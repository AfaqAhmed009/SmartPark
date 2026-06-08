import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",   # XAMPP default is empty
        database="smart_park"
    )

# Connection of database
# host: represents where you want to view
# user: is the root
# password: Generally xampp has no password by default
# database: Name of the database in which data will be stored.