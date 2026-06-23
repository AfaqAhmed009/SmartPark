from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).parent
FAQ_PATH = BASE_DIR / "smart_park_chatbot.csv"
PARKING_PATH = BASE_DIR / "smart_parking_dataset.csv"

faq_df = pd.read_csv(FAQ_PATH)
parking_df = pd.read_csv(PARKING_PATH)
parking_df["Date"] = pd.to_datetime(parking_df["Date"])

_vectorizer = TfidfVectorizer(stop_words="english")
_faq_matrix = _vectorizer.fit_transform(faq_df["question"].astype(str))
FAQ_THRESHOLD = 0.35

DAYS = [
    "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday",
]
DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MONTH_NAMES = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
    7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


def match_faq(question: str) -> str | None:
    q_vec = _vectorizer.transform([question])
    scores = cosine_similarity(q_vec, _faq_matrix)[0]
    best_idx = int(scores.argmax())
    if scores[best_idx] >= FAQ_THRESHOLD:
        return str(faq_df.iloc[best_idx]["answer"])
    return None


def _detect_day(question: str) -> str | None:
    q = question.lower()
    for day in DAYS:
        if day in q:
            return day.capitalize()
    return None


def answer_analytics(question: str) -> str | None:
    q = question.lower()

    if any(k in q for k in ("predict", "forecast", "future", "tomorrow")):
        target_day = _detect_day(question)
        if not target_day:
            latest = parking_df.iloc[-1]["Date"]
            target_day = latest.day_name()

        subset = parking_df[parking_df["Day_of_Week"] == target_day]
        if subset.empty:
            return None

        avg_occ = subset["Occupancy_Rate_Percentage"].mean()
        avg_rev = subset["Revenue_PKR"].mean()
        avg_book = subset["Total_Bookings"].mean()
        peak = subset["Peak_Hour_Start"].mode().iloc[0]
        return (
            f"Based on historical {target_day} data: expected occupancy is about "
            f"{avg_occ:.1f}%, around {avg_book:.0f} bookings, revenue near PKR "
            f"{avg_rev:,.0f}, with peak hours around {peak}."
        )

    if any(k in q for k in ("peak", "busiest", "rush hour", "busy time")):
        peak_start = parking_df["Peak_Hour_Start"].mode().iloc[0]
        peak_end = parking_df.loc[
            parking_df["Peak_Hour_Start"] == peak_start, "Peak_Hour_End"
        ].mode().iloc[0]
        avg_peak_bookings = parking_df["Peak_Hour_Bookings"].mean()
        return (
            f"Peak parking is usually between {peak_start} and {peak_end}, "
            f"with an average of {avg_peak_bookings:.0f} bookings during peak hours."
        )

    if any(k in q for k in ("revenue", "earning", "income", "money")):
        day = _detect_day(question)
        if day:
            subset = parking_df[parking_df["Day_of_Week"] == day]
            avg = subset["Revenue_PKR"].mean()
            return f"Average revenue on {day}s is about PKR {avg:,.0f}."
        avg = parking_df["Revenue_PKR"].mean()
        total = parking_df["Revenue_PKR"].sum()
        return (
            f"Average daily revenue is PKR {avg:,.0f}. "
            f"Total revenue in the dataset is PKR {total:,.0f}."
        )

    if any(k in q for k in ("profit", "net")):
        avg = parking_df["Net_Profit_PKR"].mean()
        return f"Average daily net profit is about PKR {avg:,.0f}."

    if any(k in q for k in ("occupancy", "occupied", "full", "availability", "available")):
        day = _detect_day(question)
        if day:
            subset = parking_df[parking_df["Day_of_Week"] == day]
            avg = subset["Occupancy_Rate_Percentage"].mean()
            return f"Average occupancy on {day}s is about {avg:.1f}%."
        avg = parking_df["Occupancy_Rate_Percentage"].mean()
        latest = parking_df.iloc[-1]
        return (
            f"Average occupancy rate is {avg:.1f}%. "
            f"On the latest recorded day ({latest['Date'].strftime('%Y-%m-%d')}), "
            f"occupancy was {latest['Occupancy_Rate_Percentage']:.1f}% "
            f"({int(latest['Available_Slots'])} slots available)."
        )

    if any(k in q for k in ("booking", "bookings", "cars parked", "cars entered")):
        day = _detect_day(question)
        if day:
            subset = parking_df[parking_df["Day_of_Week"] == day]
            avg = subset["Total_Bookings"].mean()
            return f"Average bookings on {day}s are about {avg:.0f} per day."
        avg = parking_df["Total_Bookings"].mean()
        return f"Average daily bookings are about {avg:.0f}."

    if any(k in q for k in ("duration", "how long", "parking time")):
        avg = parking_df["Average_Parking_Duration_Hours"].mean()
        return f"Average parking duration is about {avg:.1f} hours."

    if any(k in q for k in ("cost", "maintenance", "operating")):
        op = parking_df["Operating_Cost_PKR"].mean()
        maint = parking_df["Maintenance_Cost_PKR"].mean()
        return (
            f"Average operating cost is PKR {op:,.0f} per day and "
            f"maintenance cost is PKR {maint:,.0f} per day."
        )

    return None


def get_chatbot_answer(question: str) -> str:
    question = question.strip()
    if not question:
        return "Please ask a question about Smart Park, parking slots, revenue, or occupancy."

    analytics = answer_analytics(question)
    if analytics:
        return analytics

    faq = match_faq(question)
    if faq:
        return faq

    return (
        "Sorry, I don't have a specific answer for that. "
        "Try asking about login, slot booking, revenue, occupancy, peak hours, or predictions."
    )


def get_all_analytics() -> dict:
    latest = parking_df.iloc[-1]
    prev_month = parking_df[
        (parking_df["Year"] == latest["Year"]) & (parking_df["Month"] == latest["Month"])
    ]
    month_revenue = prev_month["Revenue_PKR"].sum()
    month_occupancy = prev_month["Occupancy_Rate_Percentage"].mean()

    monthly = (
        parking_df.groupby(["Year", "Month"], as_index=False)["Revenue_PKR"]
        .sum()
        .tail(6)
    )
    monthly_revenue = [
        {
            "month": MONTH_NAMES[int(row["Month"])],
            "revenue": round(row["Revenue_PKR"], 2),
        }
        for _, row in monthly.iterrows()
    ]

    day_order = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
    ]
    daily = (
        parking_df.groupby("Day_of_Week")["Total_Bookings"]
        .mean()
        .reindex(day_order)
        .fillna(0)
    )
    daily_bookings = [
        {"day": label, "bookings": round(daily[day], 0)}
        for label, day in zip(DAY_LABELS, day_order)
    ]

    peak_occ = (
        parking_df.groupby("Peak_Hour_Start")["Occupancy_Rate_Percentage"]
        .mean()
        .sort_index()
    )
    occupancy_trend = [
        {"time": hour, "rate": round(rate, 1)}
        for hour, rate in peak_occ.items()
    ]

    dow_bookings = [
        {"name": day[:3], "value": round(daily[day], 0), "color": color}
        for day, color in zip(
            day_order,
            ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"],
        )
    ]

    total_revenue = parking_df["Revenue_PKR"].sum()
    total_bookings = parking_df["Total_Bookings"].sum()
    avg_per_booking = total_revenue / total_bookings if total_bookings else 0

    peak_start = parking_df["Peak_Hour_Start"].mode().iloc[0]
    peak_end = parking_df.loc[
        parking_df["Peak_Hour_Start"] == peak_start, "Peak_Hour_End"
    ].mode().iloc[0]

    return {
        "stats": [
            {
                "icon": "car",
                "label": "Total Slots",
                "value": str(int(latest["Total_Parking_Slots"])),
                "change": f"{int(latest['Available_Slots'])} free",
                "color": "blue",
            },
            {
                "icon": "users",
                "label": "Avg Daily Bookings",
                "value": f"{parking_df['Total_Bookings'].mean():.0f}",
                "change": f"{int(latest['Total_Bookings'])} latest",
                "color": "green",
            },
            {
                "icon": "dollar",
                "label": "Revenue (Month)",
                "value": f"PKR {month_revenue:,.0f}",
                "change": f"{latest['Date'].strftime('%b %Y')}",
                "color": "purple",
            },
            {
                "icon": "trending",
                "label": "Occupancy Rate",
                "value": f"{month_occupancy:.0f}%",
                "change": f"{latest['Occupancy_Rate_Percentage']:.0f}% today",
                "color": "orange",
            },
        ],
        "monthly_revenue": monthly_revenue,
        "daily_bookings": daily_bookings,
        "occupancy_trend": occupancy_trend,
        "day_of_week_bookings": dow_bookings,
        "summary": {
            "today_bookings": int(latest["Total_Bookings"]),
            "available_slots": int(latest["Available_Slots"]),
            "today_revenue": round(latest["Revenue_PKR"], 2),
            "peak_hours": f"{peak_start} – {peak_end}",
        },
        "earnings": [
            {
                "label": "Total Earnings",
                "value": f"PKR {total_revenue:,.0f}",
                "sub": "All time (dataset)",
            },
            {
                "label": "This Month",
                "value": f"PKR {month_revenue:,.0f}",
                "sub": latest["Date"].strftime("%b %Y"),
            },
            {
                "label": "Total Bookings",
                "value": f"{int(total_bookings):,}",
                "sub": "Recorded in dataset",
            },
            {
                "label": "Avg. per Booking",
                "value": f"PKR {avg_per_booking:,.0f}",
                "sub": "Across all days",
            },
        ],
    }
