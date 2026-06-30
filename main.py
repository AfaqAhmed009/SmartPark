
# Create the CORRECT main.py file - pure FastAPI code only
import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime, date

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
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PYDANTIC MODELS
# ============================================================

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


# Slot CRUD Models
class SlotCreate(BaseModel):
    slot_no: int
    block_no: str
    floor_no: str
    slot_status: str = "Available"


class SlotUpdate(BaseModel):
    slot_no: Optional[int] = None
    block_no: Optional[str] = None
    floor_no: Optional[str] = None
    slot_status: Optional[str] = None


# User CRUD Models
class UserCreate(BaseModel):
    Full_name: str
    Phone_no: str
    Email: str
    user_password: str


class UserUpdate(BaseModel):
    Full_name: Optional[str] = None
    Phone_no: Optional[str] = None
    Email: Optional[str] = None
    user_password: Optional[str] = None


# Booking CRUD Models
class BookingUpdate(BaseModel):
    user_id: Optional[int] = None
    slot_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    date_entry: Optional[str] = None
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    Amount: Optional[int] = None
    booking_status: Optional[str] = None


class BookingCreate(BaseModel):
    user_id: int
    slot_id: int
    vehicle_id: int
    date_entry: str
    entry_time: str
    exit_time: str
    Amount: int
    booking_status: str = "active"


# ============================================================
# AUTH ENDPOINTS
# ============================================================

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

    sql = "SELECT * FROM users WHERE Email = %s"
    values = (Register_data.Email,)
    cursor.execute(sql, values)
    user = cursor.fetchone()

    if user:
        conn.close()
        return {
            "success": False,
            "message": "User already exists",
        }

    sql = "INSERT INTO users (Full_name, Phone_no, Email, user_password) VALUES(%s,%s,%s,%s)"
    values = (
        Register_data.Full_name,
        Register_data.Phone_no,
        Register_data.Email,
        Register_data.user_password,
    )

    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
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
        "message": "Admin identity not found",
    }


@app.patch("/api/Forget-password")
def Forget_password(forget_password: Login):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "UPDATE users SET user_password = %s WHERE Email = %s"
    values = (forget_password.Password, forget_password.Email)
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "password updated successfully",
    }


# ============================================================
# ANALYTICS & CHATBOT
# ============================================================

@app.post("/chat")
def chat(req: ChatRequest):
    answer = get_chatbot_answer(req.question)
    return {"answer": answer}


@app.get("/api/analytics")
def analytics():
    return get_all_analytics()


@app.get("/AdminPanel/stats")
def showstats():
    conn = get_connection()
    cursor = conn.cursor()

    sql1 = "SELECT COUNT(*) FROM slots"
    sql2 = "SELECT COUNT(*) FROM users"
    sql3 = "SELECT COUNT(*) FROM booking"
    sql4 = "SELECT COUNT(*) FROM slots WHERE slot_status = 'Available'"
    sql5 = "SELECT COUNT(*) FROM slots WHERE slot_status = 'Booked'"
    sql6 = "SELECT COUNT(*) FROM slots WHERE slot_status = 'Reserved'"

    cursor.execute(sql1)
    total_slots = cursor.fetchone()[0]

    cursor.execute(sql2)
    total_users = cursor.fetchone()[0]

    cursor.execute(sql3)
    total_bookings = cursor.fetchone()[0]

    cursor.execute(sql4)
    available_slots = cursor.fetchone()[0]

    cursor.execute(sql5)
    booked_slots = cursor.fetchone()[0]

    cursor.execute(sql6)
    reserved_slots = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return {
        "total_slots": total_slots,
        "total_users": total_users,
        "total_bookings": total_bookings,
        "available_slots": available_slots,
        "booked_slots": booked_slots,
        "reserved_slots": reserved_slots,
        "message": "stats returned",
    }


# ============================================================
# SLOT CRUD OPERATIONS
# ============================================================

@app.get("/slots/grouped")
def get_slots_grouped():
    """Get all slots grouped by block for dashboard display"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, slot_no, block_no, floor_no, slot_status FROM slots ORDER BY block_no, slot_no"
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    groups_dict = {}
    stats = {"available": 0, "occupied": 0, "reserved": 0}
    for row in rows:
        slot = {
            "id": row[0],
            "slot_no": row[1],
            "block_no": row[2],
            "floor_no": row[3],
            "slot_status": row[4],
        }
        key = row[2]
        if key not in groups_dict:
            groups_dict[key] = {"block_no": row[2], "floor_no": row[3], "slots": []}
        groups_dict[key]["slots"].append(slot)
        status = (row[4] or "").lower()
        if status == "available":
            stats["available"] += 1
        elif status in ("booked", "occupied"):
            stats["occupied"] += 1
        elif status == "reserved":
            stats["reserved"] += 1

    return {"groups": list(groups_dict.values()), "stats": stats}


@app.get("/slots")
def get_all_slots():
    """Get all slots for admin panel"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, slot_no, block_no, floor_no, slot_status FROM slots ORDER BY id"
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    slots = []
    for row in rows:
        slots.append({
            "id": row[0],
            "slot_no": row[1],
            "block_no": row[2],
            "floor_no": row[3],
            "slot_status": row[4],
        })
    return {"slots": slots, "total": len(slots)}


@app.get("/slots/{slot_id}")
def get_slot(slot_id: int):
    """Get a single slot by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, slot_no, block_no, floor_no, slot_status FROM slots WHERE id = %s",
        (slot_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Slot not found")

    return {
        "id": row[0],
        "slot_no": row[1],
        "block_no": row[2],
        "floor_no": row[3],
        "slot_status": row[4],
    }


@app.post("/slots")
def create_slot(slot: SlotCreate):
    """Create a new slot"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if slot already exists in same block
    cursor.execute(
        "SELECT id FROM slots WHERE slot_no = %s AND block_no = %s",
        (slot.slot_no, slot.block_no),
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400, detail="Slot already exists in this block"
        )

    cursor.execute(
        "INSERT INTO slots (slot_no, block_no, floor_no, slot_status) VALUES (%s, %s, %s, %s)",
        (slot.slot_no, slot.block_no, slot.floor_no, slot.slot_status),
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Slot created successfully",
        "slot_id": new_id,
    }


@app.put("/slots/{slot_id}")
def update_slot(slot_id: int, slot: SlotUpdate):
    """Update a slot"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if slot exists
    cursor.execute("SELECT id FROM slots WHERE id = %s", (slot_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Slot not found")

    # Build update query dynamically
    updates = []
    values = []
    if slot.slot_no is not None:
        updates.append("slot_no = %s")
        values.append(slot.slot_no)
    if slot.block_no is not None:
        updates.append("block_no = %s")
        values.append(slot.block_no)
    if slot.floor_no is not None:
        updates.append("floor_no = %s")
        values.append(slot.floor_no)
    if slot.slot_status is not None:
        updates.append("slot_status = %s")
        values.append(slot.slot_status)

    if not updates:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    values.append(slot_id)
    sql = f"UPDATE slots SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, tuple(values))
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Slot updated successfully"}


@app.delete("/slots/{slot_id}")
def delete_slot(slot_id: int):
    """Delete a slot"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if slot has active bookings
    cursor.execute(
        "SELECT id FROM booking WHERE slot_id = %s",
        (slot_id,),
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400, detail="Cannot delete slot with active bookings"
        )

    cursor.execute("DELETE FROM slots WHERE id = %s", (slot_id,))
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Slot not found")

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Slot deleted successfully"}


# ============================================================
# USER CRUD OPERATIONS
# ============================================================

@app.get("/admin/users")
def get_all_users():
    """Get all users for admin panel"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, Full_name, Phone_no, Email FROM users ORDER BY id"
    )
    rows = cursor.fetchall()

    # count bookings per user
    cursor.execute("SELECT user_id, COUNT(*) FROM booking GROUP BY user_id")
    booking_counts = {row[0]: row[1] for row in cursor.fetchall()}

    cursor.close()
    conn.close()

    users = []
    for row in rows:
        uid = row[0]
        users.append({
            "id": uid,
            "name": row[1],
            "phone": row[2],
            "email": row[3],
            "totalBookings": booking_counts.get(uid, 0),
            "status": "active",
        })
    return {"users": users, "total": len(users)}


@app.get("/admin/users/{user_id}")
def get_user(user_id: int):
    """Get a single user by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, Full_name, Phone_no, Email FROM users WHERE id = %s",
        (user_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": row[0],
        "name": row[1],
        "phone": row[2],
        "email": row[3],
        "status": "active",
    }


@app.post("/admin/users")
def create_user(user: UserCreate):
    """Create a new user"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE Email = %s", (user.Email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    cursor.execute(
        "INSERT INTO users (Full_name, Phone_no, Email, user_password) VALUES (%s, %s, %s, %s)",
        (user.Full_name, user.Phone_no, user.Email, user.user_password),
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "User created successfully",
        "user_id": new_id,
    }


@app.put("/admin/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    """Update a user"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Build update query dynamically
    updates = []
    values = []
    if user.Full_name is not None:
        updates.append("Full_name = %s")
        values.append(user.Full_name)
    if user.Phone_no is not None:
        updates.append("Phone_no = %s")
        values.append(user.Phone_no)
    if user.Email is not None:
        updates.append("Email = %s")
        values.append(user.Email)
    if user.user_password is not None:
        updates.append("user_password = %s")
        values.append(user.user_password)

    if not updates:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    values.append(user_id)
    sql = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, tuple(values))
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "User updated successfully"}


@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int):
    """Delete a user"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if user has bookings
    cursor.execute("SELECT id FROM booking WHERE user_id = %s", (user_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400, detail="Cannot delete user with active bookings"
        )

    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "User deleted successfully"}


# ============================================================
# BOOKING CRUD OPERATIONS
# ============================================================

@app.get("/admin/bookings")
def get_all_bookings():
    """Get all bookings for admin panel"""
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
            "id": row[0],
            "bookingId": f"BK-{row[0]:04d}",
            "user": row[1],
            "slotId": f"{row[2]}-{str(row[3]).zfill(2)}",
            "vehicleType": row[4],
            "carNo": row[5],
            "date": str(row[6]),
            "time": f"{row[7]} - {row[8]}",
            "amount": f"PKR {row[9]}",
            "status": status,
        })
    return {"bookings": bookings, "total": len(bookings)}


@app.get("/admin/bookings/{booking_id}")
def get_booking(booking_id: int):
    """Get a single booking by ID"""
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
        WHERE b.id = %s
    """, (booking_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")

    status = (row[10] or "active").lower()
    return {
        "id": row[0],
        "bookingId": f"BK-{row[0]:04d}",
        "user": row[1],
        "slotId": f"{row[2]}-{str(row[3]).zfill(2)}",
        "vehicleType": row[4],
        "carNo": row[5],
        "date": str(row[6]),
        "time": f"{row[7]} - {row[8]}",
        "amount": f"PKR {row[9]}",
        "status": status,
    }


@app.put("/admin/bookings/{booking_id}")
def update_booking(booking_id: int, booking: BookingUpdate):
    """Update a booking"""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if booking exists
    cursor.execute("SELECT id FROM booking WHERE id = %s", (booking_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Booking not found")

    # Build update query dynamically
    updates = []
    values = []
    if booking.user_id is not None:
        updates.append("user_id = %s")
        values.append(booking.user_id)
    if booking.slot_id is not None:
        updates.append("slot_id = %s")
        values.append(booking.slot_id)
    if booking.vehicle_id is not None:
        updates.append("vehicle_id = %s")
        values.append(booking.vehicle_id)
    if booking.date_entry is not None:
        updates.append("date_entry = %s")
        values.append(booking.date_entry)
    if booking.entry_time is not None:
        updates.append("entry_time = %s")
        values.append(booking.entry_time)
    if booking.exit_time is not None:
        updates.append("exit_time = %s")
        values.append(booking.exit_time)
    if booking.Amount is not None:
        updates.append("Amount = %s")
        values.append(booking.Amount)
    if booking.booking_status is not None:
        updates.append("booking_status = %s")
        values.append(booking.booking_status)

    if not updates:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    values.append(booking_id)
    sql = f"UPDATE booking SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, tuple(values))
    conn.commit()
    cursor.close()
    conn.close()

    return {"success": True, "message": "Booking updated successfully"}


@app.delete("/admin/bookings/{booking_id}")
def delete_booking(booking_id: int):
    """Delete a booking and free up the slot"""
    conn = get_connection()
    cursor = conn.cursor()

    # Get the slot_id before deleting
    cursor.execute("SELECT slot_id FROM booking WHERE id = %s", (booking_id,))
    result = cursor.fetchone()
    if not result:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Booking not found")

    slot_id = result[0]

    # Delete the booking
    cursor.execute("DELETE FROM booking WHERE id = %s", (booking_id,))
    
    # Free up the slot
    cursor.execute(
        "UPDATE slots SET slot_status = 'Available' WHERE id = %s",
        (slot_id,),
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "Booking deleted and slot freed successfully",
    }


# ============================================================
# BOOKING CREATION (User-facing)
# ============================================================

@app.post("/book")
def book_slot_api(req: BookingRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, slot_status FROM slots WHERE block_no = %s AND slot_no = %s",
        (req.block_no, req.slot_no),
    )
    slot_row = cursor.fetchone()
    if not slot_row:
        cursor.close()
        conn.close()
        return {"success": False, "message": "Slot not found"}
    slot_id, slot_status = slot_row
    if slot_status.lower() != "available":
        cursor.close()
        conn.close()
        return {
            "success": False,
            "message": f"Slot is already {slot_status}",
        }
    cursor.execute(
        "SELECT id FROM vehicle WHERE vehicle_no = %s AND user_id = %s",
        (req.vehicle_no, req.user_id),
    )
    vehicle_row = cursor.fetchone()
    if vehicle_row:
        vehicle_id = vehicle_row[0]
    else:
        cursor.execute(
            "INSERT INTO vehicle (user_id, vehicle_no, vehicle_type) VALUES (%s, %s, %s)",
            (req.user_id, req.vehicle_no, req.vehicle_type),
        )
        vehicle_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO booking (user_id, slot_id, vehicle_id, date_entry, entry_time, exit_time, Amount, booking_status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')",
        (
            req.user_id,
            slot_id,
            vehicle_id,
            req.date_entry,
            req.entry_time,
            req.exit_time,
            req.amount,
        ),
    )
    booking_id = cursor.lastrowid
    cursor.execute(
        "UPDATE slots SET slot_status = 'Booked' WHERE id = %s",
        (slot_id,),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {
        "success": True,
        "message": "Booking confirmed",
        "booking_id": booking_id,
    }


# ============================================================
# STATIC FILES
# ============================================================

app.mount("/static", StaticFiles(directory=BASE_DIR, html=True), name="static")
