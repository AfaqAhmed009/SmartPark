/* ============================================================
   Mock data — mirrors the Figma "Smart Car Parking System" admin panel
   ============================================================ */

const MONTHLY_REVENUE = [
  { month: "Dec", revenue: 38400 },
  { month: "Jan", revenue: 41200 },
  { month: "Feb", revenue: 39800 },
  { month: "Mar", revenue: 43500 },
  { month: "Apr", revenue: 47100 },
  { month: "May", revenue: 45670 },
];

const VEHICLE_DISTRIBUTION = [
  { name: "Sedan", value: 480, color: "#3b82f6" },
  { name: "SUV", value: 310, color: "#10b981" },
  { name: "Truck", value: 180, color: "#f59e0b" },
  { name: "Bus", value: 90, color: "#8b5cf6" },
];

const DAILY_BOOKINGS = [
  { day: "Mon", bookings: 38 },
  { day: "Tue", bookings: 45 },
  { day: "Wed", bookings: 52 },
  { day: "Thu", bookings: 49 },
  { day: "Fri", bookings: 61 },
  { day: "Sat", bookings: 72 },
  { day: "Sun", bookings: 41 },
];

const OCCUPANCY_TREND = [
  { time: "6am", rate: 12 },
  { time: "8am", rate: 45 },
  { time: "10am", rate: 68 },
  { time: "12pm", rate: 82 },
  { time: "2pm", rate: 78 },
  { time: "4pm", rate: 85 },
  { time: "6pm", rate: 71 },
  { time: "8pm", rate: 48 },
  { time: "10pm", rate: 22 },
];

const STATS = [
  { icon: "car", label: "Total Slots", value: "30", change: "+12", color: "blue" },
  { icon: "users", label: "Active Users", value: "30", change: "+48", color: "green" },
  { icon: "dollar", label: "Revenue (Month)", value: "$45,670", change: "+15%", color: "purple" },
  { icon: "trending", label: "Occupancy Rate", value: "78%", change: "+5%", color: "orange" },
];

const PARKING_SLOTS = [
  { id: 1, slotId: "A-01", block: "A", type: "Standard", status: "occupied", price: 30 },
  { id: 2, slotId: "A-02", block: "A", type: "Standard", status: "available", price: 30 },
  { id: 3, slotId: "B-01", block: "B", type: "Premium", status: "available", price: 50 },
  { id: 4, slotId: "B-02", block: "B", type: "Premium", status: "occupied", price: 50 },
  { id: 5, slotId: "C-01", block: "C", type: "Large", status: "available", price: 70 },
  { id: 6, slotId: "C-02", block: "C", type: "Large", status: "available", price: 70 },
  { id: 7, slotId: "D-01", block: "D", type: "Oversized", status: "available", price: 100 },
];

const BOOKINGS = [
  { id: 1, bookingId: "BK-2026-001", user: "afaq ahmed", slotId: "A-05", vehicleType: "Sedan", carNo: "ABC-1234", date: "May 30, 2026", time: "09:00 - 17:00", amount: "$30", status: "active" },
  { id: 2, bookingId: "BK-2026-002", user: "moiz", slotId: "B-04", vehicleType: "SUV", carNo: "XYZ-5678", date: "May 30, 2026", time: "14:00 - 18:00", amount: "$50", status: "active" },
  { id: 3, bookingId: "BK-2026-003", user: "abdullah", slotId: "C-03", vehicleType: "Truck", carNo: "DEF-9012", date: "May 29, 2026", time: "10:00 - 12:00", amount: "$70", status: "completed" },
  { id: 4, bookingId: "BK-2026-004", user: "ahmed", slotId: "A-08", vehicleType: "Sedan", carNo: "GHI-3456", date: "May 29, 2026", time: "18:00 - 23:00", amount: "$30", status: "completed" },
  { id: 5, bookingId: "BK-2026-005", user: "faizan", slotId: "D-02", vehicleType: "Bus", carNo: "JKL-7890", date: "May 28, 2026", time: "08:00 - 20:00", amount: "$100", status: "cancelled" },
];

const USERS = [
  { id: 1, name: "Afaq Ahmed", email: "afaq@email.com", phone: "+1 555-0101", totalBookings: 24, status: "active" },
  { id: 2, name: "Faizan Rasool", email: "faizan@email.com", phone: "+1 555-0102", totalBookings: 18, status: "active" },
  { id: 3, name: "Ahmed Gul", email: "ahmed@email.com", phone: "+1 555-0103", totalBookings: 32, status: "active" },
  { id: 4, name: "Abdullah Rafaqat", email: "abdullah@email.com", phone: "+1 555-0104", totalBookings: 15, status: "inactive" },
  { id: 5, name: "Umar Ikram", email: "umar@email.com", phone: "+1 555-0105", totalBookings: 27, status: "active" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "charts", label: "Charts & Analytics" },
  { id: "slots", label: "Parking Slots" },
  { id: "bookings", label: "Bookings" },
  { id: "users", label: "Users" },
];
