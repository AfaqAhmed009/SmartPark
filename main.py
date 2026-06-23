import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from chatbot import get_all_analytics, get_chatbot_answer
from database import get_connection


app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3001",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


class Login(BaseModel):
    Email: str
    Password: str


class Register(BaseModel):
    Full_name: str
    Phone_no: str
    Email: str
    user_password: str


class Admin(BaseModel):
    email: str
    admin_password: str


class Book_slot(BaseModel):
    user_id: int
    slot_id: int
    vehicle_id: int
    date_entry: str
    entry_time: str
    exit_time: str
    amount: int

class BookingRequest(BaseModel):
    user_id: int
    block_no: str
    slot_no: int
    vehicle_no: str
    vehicle_type: str
    date_entry: str
    entry_time: str
    exit_time: str
    amount: int
    

@app.post("/Login")
def Login(Login_data: Login):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM users WHERE Email = %s AND user_password = %s"
    values = (Login_data.Email, Login_data.Password)

    cursor.execute(sql, values)
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user:
        return {
            "success": True,
            "message": "Credentials are correct",
            "user_id": user[0],
            "full_name": user[1],
        }

    return {
        "success": False,
        "message": "Credentials are incorrect",
    }


@app.post("/Register")
def Register(Register_data: Register):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM user WHERE Email = %s"
    values = (Register_data.Email,)
    cursor.execute(sql, values)
    user = cursor.fetchone()

    if user:
        conn.close()
        return {
            "success": False,
            "message": "User already exists",
        }

    sql = "INSERT INTO user (Full_name,Phone_no,Email,user_password) VALUES(%s,%s,%s,%s)"
    values = (
        Register_data.Full_name,
        Register_data.Phone_no,
        Register_data.Email,
        Register_data.user_password,
    )

    cursor.execute(sql, values)
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "user registered successfully",
    }


@app.post("/Admin")
def Admin(Admin_data: Admin):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM admin WHERE email = %s AND admin_password = %s"
    values = (
        Admin_data.email,
        Admin_data.admin_password,
    )
    cursor.execute(sql, values)
    admin = cursor.fetchone()

    cursor.close()
    conn.close()

    if admin:
        return {
            "success": True,
            "message": "Admin identity found",
        }
    return {
        "success": False,
        " message": "Admin identity not found",
    }


@app.patch("/api/Forget-password")
def Forget_password(forget_password: Login):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "UPDATE user SET user_password = %s WHERE Email = %s"
    values = (forget_password.Password, forget_password.Email)
    cursor.execute(sql, values)
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "password updated successfully",
    }


@app.get("/AdminPanel/stats")
def showstats():
    conn = get_connection()
    cursor = conn.cursor()

    sql1 = "SELECT COUNT(*) FROM slots"
    sql2 = "SELECT COUNT(*) FROM users"

    cursor.execute(sql1)
    total_slots = cursor.fetchone()[0]

    cursor.execute(sql2)
    total_users = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return {
        "total_slots": total_slots,
        "total_users": total_users,
        "message": "stats returned",
    }


@app.post("/chat")
def chat(req: ChatRequest):
    answer = get_chatbot_answer(req.question)
    return {"answer": answer}


@app.get("/api/analytics")
def analytics():
    return get_all_analytics()


@app.get("/slots/grouped")
def get_slots_grouped():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, slot_no, block_no, floor_no, slot_status FROM slots ORDER BY block_no, slot_no")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    groups_dict = {}
    stats = {"available": 0, "occupied": 0, "reserved": 0}
    for row in rows:
        slot = {"id": row[0], "slot_no": row[1], "block_no": row[2], "floor_no": row[3], "slot_status": row[4]}
        key = row[2]
        if key not in groups_dict:
            groups_dict[key] = {"block_no": row[2], "floor_no": row[3], "slots": []}
        groups_dict[key]["slots"].append(slot)
        status = (row[4] or "").lower()
        if status == "available": stats["available"] += 1
        elif status in ("booked", "occupied"): stats["occupied"] += 1
        elif status == "reserved": stats["reserved"] += 1

    return {"groups": list(groups_dict.values()), "stats": stats}


@app.post("/book")
def book_slot_api(req: BookingRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, slot_status FROM slots WHERE block_no = %s AND slot_no = %s", (req.block_no, req.slot_no))
    slot_row = cursor.fetchone()
    if not slot_row:
        cursor.close(); conn.close()
        return {"success": False, "message": "Slot not found"}
    slot_id, slot_status = slot_row
    if slot_status.lower() != "available":
        cursor.close(); conn.close()
        return {"success": False, "message": f"Slot is already {slot_status}"}
    cursor.execute("SELECT id FROM vehicle WHERE vehicle_no = %s AND user_id = %s", (req.vehicle_no, req.user_id))
    vehicle_row = cursor.fetchone()
    if vehicle_row:
        vehicle_id = vehicle_row[0]
    else:
        cursor.execute("INSERT INTO vehicle (user_id, vehicle_no, vehicle_type) VALUES (%s, %s, %s)", (req.user_id, req.vehicle_no, req.vehicle_type))
        vehicle_id = cursor.lastrowid
    cursor.execute("INSERT INTO booking (user_id, slot_id, vehicle_id, date_entry, entry_time, exit_time, Amount) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (req.user_id, slot_id, vehicle_id, req.date_entry, req.entry_time, req.exit_time, req.amount))
    booking_id = cursor.lastrowid
    cursor.execute("UPDATE slots SET slot_status = 'Booked' WHERE id = %s", (slot_id,))
    conn.commit(); cursor.close(); conn.close()
    return {"success": True, "message": "Booking confirmed", "booking_id": booking_id}


@app.get("/admin/users")
def get_all_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, Full_name, Phone_no, Email FROM users ORDER BY id"
    )
    rows = cursor.fetchall()

    # count bookings per user
    cursor.execute(
        "SELECT user_id, COUNT(*) FROM booking GROUP BY user_id"
    )
    booking_counts = {row[0]: row[1] for row in cursor.fetchall()}

    cursor.close()
    conn.close()

    users = []
    for row in rows:
        uid = row[0]
        users.append({
            "id":            uid,
            "name":          row[1],
            "phone":         row[2],
            "email":         row[3],
            "totalBookings": booking_counts.get(uid, 0),
            "status":        "active",   # extend later with a status column
        })
    return {"users": users, "total": len(users)}


@app.get("/admin/bookings")
def get_all_bookings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            b.id,
            u.Full_name,
            s.block_no,
            s.slot_no,
            v.vehicle_type,
            v.vehicle_no,
            b.date_entry,
            b.entry_time,
            b.exit_time,
            b.Amount,
            b.booking_status
        FROM booking b
        JOIN users   u ON b.user_id   = u.id
        JOIN slots   s ON b.slot_id   = s.id
        JOIN vehicle v ON b.vehicle_id = v.id
        ORDER BY b.id DESC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    bookings = []
    for row in rows:
        status = (row[10] or "active").lower()
        bookings.append({
            "id":          row[0],
            "bookingId":   f"BK-{row[0]:04d}",
            "user":        row[1],
            "slotId":      f"{row[2]}-{str(row[3]).zfill(2)}",
            "vehicleType": row[4],
            "carNo":       row[5],
            "date":        str(row[6]),
            "time":        f"{row[7]} - {row[8]}",
            "amount":      f"PKR {row[9]}",
            "status":      status,
        })
    return {"bookings": bookings, "total": len(bookings)}


app.mount("/static", StaticFiles(directory=BASE_DIR, html=True), name="static")



