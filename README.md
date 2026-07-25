
# 🚗 SmartPark

A full-stack Smart Parking Management System developed to simplify parking operations in universities and commercial areas. SmartPark allows users to reserve parking slots, manage vehicle information, track bookings, and view parking availability in real time. The project also integrates AI-based predictions to estimate parking demand during peak hours and improve parking efficiency.

---

# 💻 Technologies

* FastAPI
* Python
* MySQL
* SQLAlchemy
* Pandas
* Scikit-learn
* HTML
* CSS
* JavaScript

---

# ✨ Features

Here's what SmartPark offers:

### 👤 User Authentication

* Secure registration and login system.
* User profile management.
* Session-based authentication.

### 🚘 Vehicle Management

* Add and manage multiple vehicles.
* Store vehicle number and type.
* Link vehicles with bookings.

### 🅿️ Smart Slot Booking

* View available parking slots in real time.
* Book parking slots instantly.
* Prevent double bookings.
* Automatic slot status updates.

### 📅 Booking Management

* View booking history.
* Track entry and exit times.
* Calculate parking duration and charges.
* Cancel active bookings.

### 📊 Admin Dashboard

* Monitor total bookings.
* View available and occupied slots.
* Manage parking blocks and floors.
* Track daily revenue.
* Manage users and parking slots.

### 🤖 AI Smart Prediction

* Predict peak parking hours using historical booking data.
* Estimate future parking demand.
* Improve parking space utilization.

### 💬 AI Chatbot

* Answer user queries about parking.
* Search FAQs and parking data.
* Assist users with bookings and parking information.

---

# ⌨️ Key Functionalities

* User Registration & Login
* Slot Reservation
* Real-Time Parking Availability
* Vehicle Management
* Booking History
* Parking Fee Calculation
* Admin Dashboard
* AI-Based Parking Prediction
* Smart Chatbot Assistance
* Responsive User Interface

---

# 🏗️ Project Architecture

SmartPark follows a **Layered Architecture** to maintain clean, scalable, and maintainable code.

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** FastAPI (Python)
* **Database:** MySQL
* **AI Module:** Pandas & Scikit-learn

---

# 📂 Database

The project includes the following main tables:

* Users
* Admin
* Vehicles
* slots
* Bookings
* issue

These tables work together to manage users, parking slots, reservations, and AI-generated predictions.

---

# 📈 The Development Process

The project started by designing the database and planning the system architecture. After creating the backend APIs with FastAPI, a responsive frontend was developed using Vue.js and Bootstrap. The booking system was implemented with real-time slot updates to prevent duplicate reservations. AI functionality was then added using historical booking data to predict parking demand during peak hours. Finally, the chatbot and admin dashboard were integrated to provide a complete smart parking solution.

---

# 📚 What I Learned

Working on SmartPark improved my understanding of:

* Full-Stack Web Development
* REST API Development
* FastAPI Backend Development
* MySQL Database Design
* CRUD Operations
* Authentication & Authorization
* AI & Machine Learning Integration
* Data Analysis using Pandas
* Predictive Models with Scikit-learn
* System Architecture
* Problem Solving and Debugging

---

# 🚀 Future Improvements

* QR Code-Based Parking Entry
* Mobile Application
* Online Payment Integration
* Email & SMS Notifications
* Live Parking Navigation
* License Plate Recognition (ANPR)
* Advanced AI Prediction Models
* Cloud Deployment

---

# ▶️ Running the Project

1. Clone the repository.
2. Install frontend dependencies using `npm install`.
3. Install backend dependencies using `pip install -r requirements.txt`.
4. Configure the MySQL database.
5. Run the FastAPI backend using:

   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. Open the application in your browser and start managing parking efficiently.

---

This format closely matches the professional README style in your screenshots while highlighting the features and technologies used in your **SmartPark** project. It will look polished and attractive on GitHub.
