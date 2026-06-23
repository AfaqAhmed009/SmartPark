/* ============================================================
   Admin_script.js  — SmartPark Admin Panel
   Changes vs original:
   • Overview tab  : now shows 4 live Chart.js graphs (revenue,
                     daily bookings, occupancy trend, slot status)
                     pulled from /api/analytics + /slots/grouped
   • Slots tab     : fetches real slots from GET /slots/grouped
                     and renders them grouped by block, with live
                     available / occupied / reserved badges
   • Everything else (bookings, users, stats) unchanged
   ============================================================ */

const API_BASE = "http://127.0.0.1:3000";

let analyticsData  = null;  // from /api/analytics
let liveSlotGroups = [];    // from /slots/grouped
let liveSlotStats  = {};    // { available, occupied, reserved }
let liveUsers      = null;  // from /admin/users   (null = not yet loaded)
let liveBookings   = null;  // from /admin/bookings (null = not yet loaded)

/* ── icons ── */
const ICONS = {
  car:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  dollar:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  more:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  bar:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  refresh:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
};

/* ── state ── */
let activeTab    = "overview";
let searchTerm   = "";
let chartInstances = [];

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

/* ══════════════════════════════════════════════
   DATA LOADERS
══════════════════════════════════════════════ */
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics`);
    if (res.ok) analyticsData = await res.json();
  } catch (e) {
    console.warn("Analytics API unavailable, using mock data.", e);
  }
}

async function loadLiveSlots() {
  try {
    const res = await fetch(`${API_BASE}/slots/grouped`);
    if (res.ok) {
      const data = await res.json();
      liveSlotGroups = data.groups ?? [];
      liveSlotStats  = data.stats  ?? {};
    }
  } catch (e) {
    console.warn("Slots API unavailable.", e);
    liveSlotGroups = [];
    liveSlotStats  = {};
  }
}

async function loadLiveUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (res.ok) {
      const data = await res.json();
      liveUsers = data.users ?? [];
    }
  } catch (e) {
    console.warn("Users API unavailable, using mock data.", e);
  }
}

async function loadLiveBookings() {
  try {
    const res = await fetch(`${API_BASE}/admin/bookings`);
    if (res.ok) {
      const data = await res.json();
      liveBookings = data.bookings ?? [];
    }
  } catch (e) {
    console.warn("Bookings API unavailable, using mock data.", e);
  }
}

/* helpers that fall back to mock data */
function getStats()          { return analyticsData?.stats          ?? STATS; }
function getMonthlyRevenue() { return analyticsData?.monthly_revenue ?? MONTHLY_REVENUE; }
function getDailyBookings()  { return analyticsData?.daily_bookings  ?? DAILY_BOOKINGS; }
function getOccupancyTrend() { return analyticsData?.occupancy_trend ?? OCCUPANCY_TREND; }
function getSummary() {
  return analyticsData?.summary ?? { today_bookings:42, available_slots:164, today_revenue:1680, peak_hours:"9 AM – 5 PM" };
}
function getEarnings() {
  return analyticsData?.earnings ?? [
    { label:"Total Earnings",    value:"PKR 2,55,640", sub:"All time" },
    { label:"This Month",        value:"PKR 45,670",   sub:"May 2026" },
    { label:"Total Bookings",    value:"1,060",        sub:"Dataset" },
    { label:"Avg. per Booking",  value:"PKR 43",       sub:"All types" },
  ];
}

/* ══════════════════════════════════════════════
   STATS CARDS
══════════════════════════════════════════════ */
function renderStats() {
  document.getElementById("statsGrid").innerHTML = getStats().map(s => `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-icon-wrap color-${s.color}">${ICONS[s.icon]}</div>
        <span class="stat-change">${s.change}</span>
      </div>
      <p class="stat-value">${s.value}</p>
      <p class="stat-label">${s.label}</p>
    </div>`).join("");
}

/* ══════════════════════════════════════════════
   TABS BAR
══════════════════════════════════════════════ */
function renderTabsBar() {
  const bar = document.getElementById("tabsBar");
  bar.innerHTML = TABS.map(t =>
    `<button class="tab-btn ${activeTab===t.id?"active":""}" data-tab="${t.id}">${t.label}</button>`
  ).join("");
  bar.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab  = btn.dataset.tab;
      searchTerm = "";
      renderTabsBar();
      renderTabContent();
    });
  });
}

/* ══════════════════════════════════════════════
   TAB CONTENT DISPATCHER
══════════════════════════════════════════════ */
function renderTabContent() {
  const root = document.getElementById("tabContent");
  destroyCharts();

  if      (activeTab === "overview") { root.innerHTML = overviewHTML(); initOverviewCharts(); }
  else if (activeTab === "charts")   { root.innerHTML = chartsHTML();   initDetailCharts(); }
  else if (activeTab === "slots")    { root.innerHTML = slotsHTML(); attachSlotRefresh(); }
  else if (activeTab === "bookings") { root.innerHTML = bookingsHTML(); attachBookingRefresh(); }
  else if (activeTab === "users")    { root.innerHTML = usersHTML();    attachUserRefresh(); }

  attachSearchHandler();
  attachTableActionHandlers();
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB  — now shows 4 mini charts
══════════════════════════════════════════════ */
function overviewHTML() {
  const summary = getSummary();
  const recentRows = BOOKINGS.map(b => `
    <div class="activity-row">
      <div>
        <p class="activity-name">${escapeHtml(b.user)}</p>
        <p class="activity-meta">${b.bookingId} · Slot ${b.slotId} · ${b.vehicleType}</p>
      </div>
      <div class="activity-right">
        <span class="activity-amount">${b.amount}</span>
        <span class="badge badge-${b.status}">${b.status}</span>
      </div>
    </div>`).join("");

  /* slot status donut data */
  const av  = liveSlotStats.available ?? 0;
  const oc  = liveSlotStats.occupied  ?? 0;
  const rs  = liveSlotStats.reserved  ?? 0;
  const tot = av + oc + rs || 1;

  return `
    <div class="stack">

      <!-- snapshot cards -->
      <div>
        <h3 class="section-title">Today's Snapshot</h3>
        <div class="mini-grid">
          <div class="mini-card"><p class="mini-card-label">Today's Bookings</p>  <p class="mini-card-value">${summary.today_bookings}</p></div>
          <div class="mini-card"><p class="mini-card-label">Available Slots</p>   <p class="mini-card-value">${av || summary.available_slots}</p></div>
          <div class="mini-card"><p class="mini-card-label">Today's Revenue</p>   <p class="mini-card-value">PKR ${Number(summary.today_revenue).toLocaleString()}</p></div>
          <div class="mini-card"><p class="mini-card-label">Peak Hours</p>        <p class="mini-card-value">${summary.peak_hours}</p></div>
        </div>
      </div>

      <!-- 4 overview charts -->
      <div>
        <h3 class="section-title">Quick Analytics</h3>
        <div class="charts-grid">

          <div class="chart-card">
            <h4>Monthly Revenue (Last 6 Months)</h4>
            <div class="chart-wrap"><canvas id="ovChartRevenue"></canvas></div>
          </div>

          <div class="chart-card">
            <h4>Daily Bookings This Week</h4>
            <div class="chart-wrap"><canvas id="ovChartDaily"></canvas></div>
          </div>

          <div class="chart-card">
            <h4>Occupancy by Hour (%)</h4>
            <div class="chart-wrap"><canvas id="ovChartOccupancy"></canvas></div>
          </div>

          <div class="chart-card">
            <h4>Live Slot Status</h4>
            <div class="chart-wrap"><canvas id="ovChartSlots"></canvas></div>
            <p style="text-align:center;font-size:12px;color:var(--muted-foreground);margin-top:6px;">
              Total: ${tot} &nbsp;|&nbsp;
              <span style="color:#16a34a">▣ ${av} Available</span> &nbsp;
              <span style="color:#dc2626">▣ ${oc} Occupied</span> &nbsp;
              <span style="color:#d97706">▣ ${rs} Reserved</span>
            </p>
          </div>

        </div>
      </div>

      <!-- recent activity -->
      <div>
        <h3 class="section-title">Recent Activity</h3>
        <div class="stack-sm" style="gap:0;">${recentRows}</div>
      </div>

    </div>`;
}

function initOverviewCharts() {
  const fontColor   = "#6b7280";
  const borderColor = "#e5e7eb";
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size   = 12;

  const mr = getMonthlyRevenue();
  const db = getDailyBookings();
  const ot = getOccupancyTrend();
  const av = liveSlotStats.available ?? 0;
  const oc = liveSlotStats.occupied  ?? 0;
  const rs = liveSlotStats.reserved  ?? 0;

  /* Revenue bar */
  chartInstances.push(new Chart(document.getElementById("ovChartRevenue"), {
    type: "bar",
    data: {
      labels: mr.map(d => d.month),
      datasets: [{ data: mr.map(d => d.revenue), backgroundColor: "#d97706", borderRadius: 5, maxBarThickness: 38 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `PKR ${c.parsed.y.toLocaleString()}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `${(v/1000).toFixed(0)}k` } }
      }
    }
  }));

  /* Daily bookings bar */
  chartInstances.push(new Chart(document.getElementById("ovChartDaily"), {
    type: "bar",
    data: {
      labels: db.map(d => d.day),
      datasets: [{ data: db.map(d => d.bookings), backgroundColor: "#4f46e5", borderRadius: 5, maxBarThickness: 38 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y} bookings` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor } }
      }
    }
  }));

  /* Occupancy line */
  chartInstances.push(new Chart(document.getElementById("ovChartOccupancy"), {
    type: "line",
    data: {
      labels: ot.map(d => d.time),
      datasets: [{
        data: ot.map(d => d.rate),
        borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)",
        pointBackgroundColor: "#10b981", pointRadius: 4,
        tension: 0.35, borderWidth: 2, fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y}%` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `${v}%` }, max: 100 }
      }
    }
  }));

  /* Live slot status doughnut */
  chartInstances.push(new Chart(document.getElementById("ovChartSlots"), {
    type: "doughnut",
    data: {
      labels: ["Available", "Occupied", "Reserved"],
      datasets: [{
        data: [av || 1, oc, rs],
        backgroundColor: ["#16a34a", "#dc2626", "#d97706"],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: { position: "bottom", labels: { color: fontColor, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed}` } }
      }
    }
  }));
}

/* ══════════════════════════════════════════════
   CHARTS TAB  — full detail analytics (unchanged)
══════════════════════════════════════════════ */
function chartsHTML() {
  const earnings = getEarnings();
  return `
    <style>
      .charts-grid-asymmetric {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.25rem;
      }
      .charts-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
      }
      .chart-card-wide { grid-column: span 1; }
      .chart-wrap-tall { height: 260px; }
      @media (max-width: 900px) {
        .charts-grid-asymmetric,
        .charts-grid-3 { grid-template-columns: 1fr; }
      }
    </style>
    <div class="stack" style="gap:2rem;">
      <div class="charts-header">${ICONS.bar}<h3 class="section-title" style="margin-bottom:0;">Analytics &amp; Charts</h3></div>

      <!-- Row 1: Revenue (wide) + Vehicle Distribution (narrow) -->
      <div class="charts-grid charts-grid-asymmetric">
        <div class="chart-card chart-card-wide">
          <h4>Monthly Revenue (Last 6 Months)</h4>
          <div class="chart-wrap chart-wrap-tall"><canvas id="chartRevenue"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Vehicle Type Distribution</h4>
          <div class="chart-wrap chart-wrap-tall"><canvas id="chartVehicle"></canvas></div>
        </div>
      </div>

      <!-- Row 2: 3 equal charts -->
      <div class="charts-grid charts-grid-3">
        <div class="chart-card">
          <h4>Daily Bookings (This Week)</h4>
          <div class="chart-wrap"><canvas id="chartDaily"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Occupancy by Hour (%)</h4>
          <div class="chart-wrap"><canvas id="chartOccupancy"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Bookings by Day of Week</h4>
          <div class="chart-wrap"><canvas id="chartDow"></canvas></div>
        </div>
      </div>

      <!-- Earnings summary -->
      <div>
        <h3 class="section-title">Earnings Summary</h3>
        <div class="earnings-grid">
          ${earnings.map(c => `
            <div class="earnings-card">
              <p class="earnings-label">${c.label}</p>
              <p class="earnings-value">${c.value}</p>
              <p class="earnings-sub">${c.sub}</p>
            </div>`).join("")}
        </div>
      </div>
    </div>`;
}

function initDetailCharts() {
  const fontColor   = "#6b7280";
  const borderColor = "#e5e7eb";
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size   = 12;

  const mr  = getMonthlyRevenue();
  const db  = getDailyBookings();
  const ot  = getOccupancyTrend();
  const vd  = VEHICLE_DISTRIBUTION;   // vehicle type donut
  const dow = analyticsData?.day_of_week_bookings ?? DAILY_BOOKINGS; // day-of-week bookings bar

  /* ── 1. Monthly Revenue — gradient bar ── */
  chartInstances.push(new Chart(document.getElementById("chartRevenue"), {
    type: "bar",
    data: {
      labels: mr.map(d => d.month),
      datasets: [{
        label: "Revenue",
        data: mr.map(d => d.revenue),
        backgroundColor: mr.map((_, i) => i === mr.length - 1 ? "#d97706" : "#fbbf24"),
        borderRadius: 6,
        maxBarThickness: 52,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `PKR ${c.parsed.y.toLocaleString()}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: {
          grid: { color: borderColor },
          ticks: { color: fontColor, callback: v => `PKR ${(v / 1000).toFixed(0)}k` },
          beginAtZero: true,
        }
      }
    }
  }));

  /* ── 2. Vehicle Type Distribution — doughnut ── */
  chartInstances.push(new Chart(document.getElementById("chartVehicle"), {
    type: "doughnut",
    data: {
      labels: vd.map(d => d.name),
      datasets: [{
        data: vd.map(d => d.value),
        backgroundColor: vd.map(d => d.color),
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "58%",
      plugins: {
        legend: { position: "bottom", labels: { color: fontColor, boxWidth: 12, padding: 14, font: { size: 12 } } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} vehicles (${Math.round(c.parsed / vd.reduce((a,d)=>a+d.value,0)*100)}%)` } }
      }
    }
  }));

  /* ── 3. Daily Bookings This Week — horizontal bar ── */
  chartInstances.push(new Chart(document.getElementById("chartDaily"), {
    type: "bar",
    data: {
      labels: db.map(d => d.day),
      datasets: [{
        label: "Bookings",
        data: db.map(d => d.bookings),
        backgroundColor: "#4f46e5",
        borderRadius: 5,
        maxBarThickness: 36,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} bookings` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor }, beginAtZero: true }
      }
    }
  }));

  /* ── 4. Occupancy by Hour — area line ── */
  chartInstances.push(new Chart(document.getElementById("chartOccupancy"), {
    type: "line",
    data: {
      labels: ot.map(d => d.time),
      datasets: [{
        label: "Occupancy %",
        data: ot.map(d => d.rate),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.10)",
        pointBackgroundColor: "#10b981",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.40,
        borderWidth: 2.5,
        fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y}% occupancy` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `${v}%` }, max: 100, beginAtZero: true }
      }
    }
  }));

  /* ── 5. Bookings by Day of Week — polar / bar with color gradient ── */
  const dowLabels = dow.map(d => d.day);
  const dowValues = dow.map(d => d.bookings);
  const dowColors = ["#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#f97316"];
  chartInstances.push(new Chart(document.getElementById("chartDow"), {
    type: "bar",
    data: {
      labels: dowLabels,
      datasets: [{
        label: "Bookings",
        data: dowValues,
        backgroundColor: dowColors,
        borderRadius: 5,
        maxBarThickness: 36,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} bookings` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor }, beginAtZero: true }
      }
    }
  }));
}

function destroyCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
}

/* ══════════════════════════════════════════════
   SLOTS TAB  — live data from /slots/grouped
══════════════════════════════════════════════ */
function slotsHTML() {
  /* If live data is available render by block groups */
  if (liveSlotGroups.length > 0) {
    return liveSlotsSectionHTML();
  }
  /* Fallback: mock table */
  return mockSlotsTableHTML();
}

function liveSlotsSectionHTML() {
  const av = liveSlotStats.available ?? 0;
  const oc = liveSlotStats.occupied  ?? 0;
  const rs = liveSlotStats.reserved  ?? 0;

  /* search filter across all slots */
  const q = searchTerm.toLowerCase();

  const blocksHTML = liveSlotGroups.map(group => {
    const filteredSlots = group.slots.filter(s =>
      q === "" ||
      String(s.slot_no).includes(q) ||
      group.block_no.toLowerCase().includes(q) ||
      (s.slot_status||"").toLowerCase().includes(q)
    );
    if (filteredSlots.length === 0) return "";

    const slotCards = filteredSlots.map(s => {
      const status = (s.slot_status || "available").toLowerCase();
      /* map booked -> occupied for badge */
      const badge  = status === "booked" ? "occupied" : status;
      const label  = status === "booked" ? "Booked" : status.charAt(0).toUpperCase() + status.slice(1);
      return `
        <div class="live-slot-card live-slot-${badge}">
          <div class="live-slot-id">${group.block_no}-${String(s.slot_no).padStart(2,"0")}</div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="live-slot-car">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
          </svg>
          <span class="badge badge-sm badge-${badge}">${label}</span>
        </div>`;
    }).join("");

    return `
      <div class="live-block-section">
        <div class="live-block-header">
          <div class="live-block-badge">${group.block_no}</div>
          <div>
            <div class="live-block-title">Block ${group.block_no} — ${group.floor_no}</div>
            <div class="live-block-sub">${filteredSlots.length} slot${filteredSlots.length!==1?"s":""}</div>
          </div>
        </div>
        <div class="live-slots-grid">${slotCards}</div>
      </div>`;
  }).join("");

  return `
    <style>
      /* ── live slot styles (scoped here so they don't bleed) ── */
      .live-slot-summary { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:20px; }
      .live-slot-pill { display:flex; align-items:center; gap:7px; padding:7px 14px;
        border-radius:99px; font-size:13px; font-weight:600; border:1px solid transparent; }
      .live-slot-pill .dot { width:8px; height:8px; border-radius:50%; }
      .pill-av  { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
      .pill-av .dot  { background:#22c55e; }
      .pill-oc  { background:#fff5f5; color:#dc2626; border-color:#fecaca; }
      .pill-oc .dot  { background:#f87171; }
      .pill-rs  { background:#fffbeb; color:#b45309; border-color:#fde68a; }
      .pill-rs .dot  { background:#f59e0b; }

      .live-block-section { margin-bottom:28px; }
      .live-block-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
      .live-block-badge { width:40px; height:40px; background:#0b0c2a; color:#fff;
        border-radius:10px; display:flex; align-items:center; justify-content:center;
        font-size:16px; font-weight:700; flex-shrink:0; }
      .live-block-title { font-weight:700; font-size:15px; color:var(--foreground); }
      .live-block-sub   { font-size:12px; color:var(--muted-foreground); margin-top:2px; }

      .live-slots-grid { display:flex; gap:12px; flex-wrap:wrap; }

      .live-slot-card { width:110px; border-radius:12px; border:2px solid;
        padding:12px 10px; display:flex; flex-direction:column;
        align-items:center; gap:8px; transition:transform .18s, box-shadow .18s; }
      .live-slot-card:hover { transform:translateY(-3px); box-shadow:0 4px 14px rgba(0,0,0,0.10); }
      .live-slot-id  { font-size:13px; font-weight:700; }
      .live-slot-car { width:28px; height:28px; }

      .live-slot-available { background:#f0fdf6; border-color:#6ee7a8; }
      .live-slot-available .live-slot-id  { color:#15803d; }
      .live-slot-available .live-slot-car { stroke:#16a34a; }

      .live-slot-occupied  { background:#fff5f5; border-color:#fca5a5; }
      .live-slot-occupied  .live-slot-id  { color:#dc2626; }
      .live-slot-occupied  .live-slot-car { stroke:#ef4444; }

      .live-slot-reserved  { background:#fffbeb; border-color:#fcd34d; }
      .live-slot-reserved  .live-slot-id  { color:#b45309; }
      .live-slot-reserved  .live-slot-car { stroke:#d97706; }
    </style>

    <div class="stack" style="gap:1rem;">

      <!-- toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          ${ICONS.search}
          <input type="text" class="search-input" id="searchInput"
            placeholder="Search by block, slot or status…" value="${escapeHtml(searchTerm)}" />
        </div>
        <button class="btn btn-outline" id="slotRefreshBtn" style="gap:6px;">
          ${ICONS.refresh} Refresh
        </button>
      </div>

      <!-- summary pills -->
      <div class="live-slot-summary">
        <div class="live-slot-pill pill-av"><span class="dot"></span>${av} Available</div>
        <div class="live-slot-pill pill-oc"><span class="dot"></span>${oc} Occupied / Booked</div>
        <div class="live-slot-pill pill-rs"><span class="dot"></span>${rs} Reserved</div>
      </div>

      <!-- block groups -->
      ${blocksHTML || `<p style="color:var(--muted-foreground);padding:20px 0;">No slots match your search.</p>`}
    </div>`;
}

function mockSlotsTableHTML() {
  const filtered = PARKING_SLOTS.filter(s =>
    searchTerm==="" || s.slotId.toLowerCase().includes(searchTerm) || s.block.toLowerCase().includes(searchTerm)
  );
  const rows = filtered.length ? filtered.map(s => `
    <tr data-id="${s.id}">
      <td>${s.slotId}</td><td>Block ${s.block}</td><td>${s.type}</td>
      <td>$${s.price}</td>
      <td><span class="badge badge-sm badge-${s.status}">${s.status}</span></td>
      <td><div class="row-actions">
        <button class="icon-btn" data-action="edit">${ICONS.edit}</button>
        <button class="icon-btn danger" data-action="delete">${ICONS.trash}</button>
      </div></td>
    </tr>`).join("") : `<tr class="empty-row"><td colspan="6">No slots found</td></tr>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">${ICONS.search}<input type="text" class="search-input" id="searchInput" placeholder="Search slots…" value="${escapeHtml(searchTerm)}" /></div>
        <button class="btn btn-primary" id="addBtn">${ICONS.plus} Add Slot</button>
      </div>
      <p style="color:var(--muted-foreground);font-size:13px;">⚠ Could not reach /slots/grouped — showing mock data.</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Slot ID</th><th>Block</th><th>Type</th><th>Rate</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function attachSlotRefresh() {
  const btn = document.getElementById("slotRefreshBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerHTML = ICONS.refresh + " Loading…";
    await loadLiveSlots();
    renderTabContent();
  });
}

/* ══════════════════════════════════════════════
   BOOKINGS TAB  — live from /admin/bookings
══════════════════════════════════════════════ */
function bookingsHTML() {
  const source   = liveBookings ?? BOOKINGS;
  const isLive   = liveBookings !== null;
  const filtered = source.filter(b =>
    searchTerm === "" ||
    (b.user      || "").toLowerCase().includes(searchTerm) ||
    (b.bookingId || "").toLowerCase().includes(searchTerm) ||
    (b.slotId    || "").toLowerCase().includes(searchTerm) ||
    (b.carNo     || "").toLowerCase().includes(searchTerm)
  );

  const rows = filtered.length ? filtered.map(b => {
    const status = (b.status || "active").toLowerCase();
    return `
      <tr data-id="${b.id}">
        <td>${escapeHtml(b.bookingId)}</td>
        <td>${escapeHtml(b.user)}</td>
        <td>${escapeHtml(b.slotId)}</td>
        <td>${escapeHtml(b.vehicleType)}</td>
        <td>${escapeHtml(b.carNo)}</td>
        <td>${escapeHtml(b.date)}</td>
        <td>${escapeHtml(b.time ?? "—")}</td>
        <td>${escapeHtml(b.amount)}</td>
        <td><span class="badge badge-sm badge-${status}">${status}</span></td>
        <td><div class="row-actions">
          <button class="icon-btn" data-action="view"  title="View">${ICONS.more}</button>
          <button class="icon-btn" data-action="edit"  title="Edit">${ICONS.edit}</button>
        </div></td>
      </tr>`;
  }).join("") : `<tr class="empty-row"><td colspan="10">No bookings found</td></tr>`;

  const sourceLabel = isLive
    ? `<span style="color:var(--green);font-size:12px;font-weight:600;">● Live — ${source.length} records from DB</span>`
    : `<span style="color:var(--destructive);font-size:12px;">⚠ Could not reach /admin/bookings — showing mock data</span>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">
          ${ICONS.search}
          <input type="text" class="search-input" id="searchInput"
            placeholder="Search by user, booking ID, slot, car no…"
            value="${escapeHtml(searchTerm)}" />
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${sourceLabel}
          <button class="btn btn-outline" id="bookingRefreshBtn" style="gap:6px;">
            ${ICONS.refresh} Refresh
          </button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th><th>User</th><th>Slot</th>
              <th>Vehicle Type</th><th>Car No</th><th>Date</th>
              <th>Time</th><th>Amount</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function attachBookingRefresh() {
  const btn = document.getElementById("bookingRefreshBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerHTML = ICONS.refresh + " Loading…";
    await loadLiveBookings();
    renderTabContent();
  });
}

/* ══════════════════════════════════════════════
   USERS TAB  — live from /admin/users
══════════════════════════════════════════════ */
function usersHTML() {
  const source   = liveUsers ?? USERS;
  const isLive   = liveUsers !== null;
  const filtered = source.filter(u =>
    searchTerm === "" ||
    (u.name  || "").toLowerCase().includes(searchTerm) ||
    (u.email || "").toLowerCase().includes(searchTerm) ||
    (u.phone || "").toLowerCase().includes(searchTerm)
  );

  const rows = filtered.length ? filtered.map(u => {
    const status = (u.status || "active").toLowerCase();
    return `
      <tr data-id="${u.id}">
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone)}</td>
        <td>${u.totalBookings}</td>
        <td><span class="badge badge-sm badge-${status}">${status}</span></td>
        <td><div class="row-actions">
          <button class="icon-btn" data-action="edit"  title="Edit">${ICONS.edit}</button>
          <button class="icon-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          <button class="icon-btn" data-action="more"  title="More">${ICONS.more}</button>
        </div></td>
      </tr>`;
  }).join("") : `<tr class="empty-row"><td colspan="6">No users found</td></tr>`;

  const sourceLabel = isLive
    ? `<span style="color:var(--green);font-size:12px;font-weight:600;">● Live — ${source.length} users from DB</span>`
    : `<span style="color:var(--destructive);font-size:12px;">⚠ Could not reach /admin/users — showing mock data</span>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">
          ${ICONS.search}
          <input type="text" class="search-input" id="searchInput"
            placeholder="Search by name, email or phone…"
            value="${escapeHtml(searchTerm)}" />
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${sourceLabel}
          <button class="btn btn-outline" id="userRefreshBtn" style="gap:6px;">
            ${ICONS.refresh} Refresh
          </button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th>
              <th>Total Bookings</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function attachUserRefresh() {
  const btn = document.getElementById("userRefreshBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerHTML = ICONS.refresh + " Loading…";
    await loadLiveUsers();
    renderTabContent();
  });
}

/* ══════════════════════════════════════════════
   SHARED HANDLERS
══════════════════════════════════════════════ */
function attachSearchHandler() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", e => {
    searchTerm = e.target.value.toLowerCase();
    const pos = e.target.selectionStart;
    renderTabContent();
    const newInput = document.getElementById("searchInput");
    if (newInput) { newInput.focus(); newInput.setSelectionRange(pos, pos); }
  });
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.addEventListener("click", () => alert("Hook up your create modal here."));
}

function attachTableActionHandlers() {
  document.querySelectorAll(".icon-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const row = btn.closest("tr");
      console.log(`Action "${btn.dataset.action}" on row ${row?.dataset.id}`);
    });
  });
}

/* sign out */
document.getElementById("signOutBtn").addEventListener("click", () => {
  localStorage.removeItem("isAdmin");
  window.location.href = "Admin.html";
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
async function initAdminPanel() {
  /* load everything in parallel */
  await Promise.all([
    loadAnalytics(),
    loadLiveSlots(),
    loadLiveUsers(),
    loadLiveBookings(),
  ]);
  renderStats();
  renderTabsBar();
  renderTabContent();
}

initAdminPanel();
