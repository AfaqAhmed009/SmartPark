from fastapi import FastAPI
from pydantic import BaseModel
from database import get_connection
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


# ✅ CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Base Models for data entry

class Login(BaseModel):
    Email : str
    Password : str

class Register(BaseModel):
      Full_name : str
      Phone_no : str
      Email : int
      user_password : str

class Admin(BaseModel):
     email : str
     admin_passord : str
    
class Book_slot (BaseModel):
     user_id : int
     slot_id : int
     vehicle_id : int
     date_entry : str
     entry_time : str
     exit_time : str
     amount : int

     
@app.post("/Login")
def Login(Login_data : Login ):
    conn = get_connection()
    cursor = conn.cursor()  # object of connection for commands

    sql = "SELECT * FROM users WHERE Email = %s AND user_password = %s" #sql quries simple
    values = (Login_data.Email, Login_data.Password)  # inserting data into just like data-base

    cursor.execute(sql, values)
    user = cursor.fetchone() # fetch the data from the database

    cursor.close()
    conn.close()

    if user:
        return {
            "success": True,
            "message": "Credentials are correct"
        }

    return {
        "success": False,
        "message": "Credentials are incorrect"
    }

@app.post("/Register")
def Register(Register_data : Register):
     conn = get_connection() # variable for connection
     cursor = conn.cursor() # object of connection for commands

     # check if the user is already present or not

     sql = "SELECT * FROM user WHERE Email = %s"
     values = (Register_data.Email,)
     cursor.execute(sql, values)
     user = cursor.fetchone()

     if user:
          conn.close()
          return{
                "success" : False,
               "message" : "User already exists"
          }
     # if user not present
     sql = "INSERT INTO user (Full_name,Phone_no,Email,user_password) VALUES(%s,%s,%s,%s)"
     values = (Register_data.Full_name, 
               Register_data.Phone_no, 
               Register_data.Email, 
               Register_data.user_password)

     cursor.execute(sql, values)
     conn.commit() # to insert data permenantly
     conn.close()  # to close the database connection

     return{
               "success" : True,
               "message" : "user registered successfully" 
          }

@app.post("/Admin")
def Admin( Admin_data : Admin ):
     conn = get_connection()
     cursor = conn.cursor()

     sql = "SELECT * FROM admin WHERE email = %s AND admin_password = %s"
     values = (
          Admin_data.email,
          Admin_data.admin_password
     )
     cursor.execute(sql , values)
     admin = cursor.ftechone()

     cursor.close()
     conn.close()

     if admin:
          return {
               "success" : True,
               "message" : "Admin identity found"
          }
     return {
          "success" : False,
          " message" : "Admin identity not found"
     }

@app.patch("/api/Forget-password")
def Forget_password(forget_password : Login):
     conn = get_connection()
     cursor = conn.cursor()

     sql = "UPDATE user SET user_password = %s WHERE Email = %s"
     values = (forget_password.user_Password, forget_password.Email )

     cursor.execute(sql, values)
     cursor.commit() 
     conn.close()

     return {
          "success" : True,
          "message" : "password updated successfully"
     }




     
 

  

    


    
    
         