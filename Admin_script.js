
const API_BASE = "http://127.0.0.1:8000";

let analyticsData  = null;
let liveSlotGroups = [];
let liveSlotStats  = {};
let liveUsers      = null;
let liveBookings   = null;
let allSlots       = []; // Flat list for table view

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
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

/* ── state ── */
let activeTab    = "overview";
let searchTerm   = "";
let chartInstances = [];
let currentModal = null;
let editingId    = null;
let editingType  = null; // 'slot', 'user', 'booking'

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
    console.warn("Slots grouped API unavailable.", e);
    liveSlotGroups = [];
    liveSlotStats  = {};
  }
}

async function loadAllSlots() {
  try {
    const res = await fetch(`${API_BASE}/slots`);
    if (res.ok) {
      const data = await res.json();
      allSlots = data.slots ?? [];
    }
  } catch (e) {
    console.warn("Slots API unavailable.", e);
    allSlots = [];
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
function getRevenueForecast() { return analyticsData?.revenue_forecast ?? []; }
function getCostBreakdown()   { return analyticsData?.cost_breakdown   ?? VEHICLE_DISTRIBUTION; }

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
  else if (activeTab === "slots")    { root.innerHTML = slotsHTML();    attachSlotRefresh(); }
  else if (activeTab === "bookings") { root.innerHTML = bookingsHTML(); attachBookingRefresh(); }
  else if (activeTab === "users")    { root.innerHTML = usersHTML();    attachUserRefresh(); }

  attachSearchHandler();
  attachTableActionHandlers();
}

/* ══════════════════════════════════════════════
   MODAL SYSTEM
══════════════════════════════════════════════ */
function showModal(title, content, onConfirm) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="modalConfirmBtn">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  currentModal = modal;
  
  document.getElementById("modalConfirmBtn").addEventListener("click", () => {
    onConfirm();
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

async function refreshStats() {
  await loadAnalytics();
  renderStats();
}

function closeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
  editingId = null;
  editingType = null;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? ICONS.check : ICONS.x}</span>
    <span>${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ══════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════ */
function overviewHTML() {
  const summary = getSummary();
  const recentRows = BOOKINGS.slice(0, 5).map(b => `
    <div class="activity-row">
      <div>
        <p class="activity-name">${escapeHtml(b.user)}</p>
        <p class="activity-meta">${b.bookingId} · Slot ${b.slotId} · ${b.vehicleType}</p>
      </div>
      <div class="activity-right">
        <span class="activity-amount">${b.amount}</span>
        <span class="badge badge-sm badge-${b.status}">${b.status}</span>
      </div>
    </div>`).join("");

  const av  = liveSlotStats.available ?? 0;
  const oc  = liveSlotStats.occupied  ?? 0;
  const rs  = liveSlotStats.reserved  ?? 0;
  const tot = av + oc + rs || 1;

  return `
    <div class="stack">
      <div>
        <h3 class="section-title">Today's Snapshot</h3>
        <div class="mini-grid">
          <div class="mini-card"><p class="mini-card-label">Today's Bookings</p>  <p class="mini-card-value">${summary.today_bookings}</p></div>
          <div class="mini-card"><p class="mini-card-label">Available Slots</p>   <p class="mini-card-value">${av || summary.available_slots}</p></div>
          <div class="mini-card"><p class="mini-card-label">Today's Revenue</p>   <p class="mini-card-value">PKR ${Number(summary.today_revenue).toLocaleString()}</p></div>
          <div class="mini-card"><p class="mini-card-label">Peak Hours</p>        <p class="mini-card-value">${summary.peak_hours}</p></div>
        </div>
      </div>

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
              <span style="color:#34d399">▣ ${av} Available</span> &nbsp;
              <span style="color:#dc2626">▣ ${oc} Occupied</span> &nbsp;
              <span style="color:#d97706">▣ ${rs} Reserved</span>
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="section-title">Recent Activity</h3>
        <div class="stack-sm" style="gap:0;">${recentRows}</div>
      </div>
    </div>`;
}

function initOverviewCharts() {
  const fontColor   = "#a8a29e";
  const borderColor = "#292524";
  Chart.defaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size   = 12;

  const mr = getMonthlyRevenue();
  const db = getDailyBookings();
  const ot = getOccupancyTrend();
  const av = liveSlotStats.available ?? 0;
  const oc = liveSlotStats.occupied  ?? 0;
  const rs = liveSlotStats.reserved  ?? 0;

  chartInstances.push(new Chart(document.getElementById("ovChartRevenue"), {
    type: "bar",
    data: {
      labels: mr.map(d => d.month),
      datasets: [{ data: mr.map(d => d.revenue), backgroundColor: "#fafaf9", borderRadius: 5, maxBarThickness: 38 }]
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

  chartInstances.push(new Chart(document.getElementById("ovChartDaily"), {
    type: "bar",
    data: {
      labels: db.map(d => d.day),
      datasets: [{ data: db.map(d => d.bookings), backgroundColor: "#0d9488", borderRadius: 5, maxBarThickness: 38 }]
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

  chartInstances.push(new Chart(document.getElementById("ovChartOccupancy"), {
    type: "line",
    data: {
      labels: ot.map(d => d.time),
      datasets: [{
        data: ot.map(d => d.rate),
        borderColor: "#059669", backgroundColor: "rgba(5,150,105,0.08)",
        pointBackgroundColor: "#059669", pointRadius: 4,
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

  chartInstances.push(new Chart(document.getElementById("ovChartSlots"), {
    type: "doughnut",
    data: {
      labels: ["Available", "Occupied", "Reserved"],
      datasets: [{
        data: [av || 1, oc, rs],
        backgroundColor: ["#34d399", "#f87171", "#fbbf24"],
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
   CHARTS TAB
══════════════════════════════════════════════ */
function chartsHTML() {
  const earnings = getEarnings();
  return `
    <style>
      .charts-grid-asymmetric { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; }
      .charts-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
      .chart-card-wide { grid-column: span 1; }
      .chart-wrap-tall { height: 260px; }
      @media (max-width: 900px) {
        .charts-grid-asymmetric, .charts-grid-3 { grid-template-columns: 1fr; }
      }
    </style>
    <div class="stack" style="gap:2rem;">
      <div class="charts-header">${ICONS.bar}<h3 class="section-title" style="margin-bottom:0;">Analytics &amp; Charts</h3></div>

      <div class="charts-grid charts-grid-asymmetric">
        <div class="chart-card chart-card-wide">
          <h4>Monthly Revenue (Last 6 Months)</h4>
          <div class="chart-wrap chart-wrap-tall"><canvas id="chartRevenue"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Cost Breakdown (Avg / Day)</h4>
          <div class="chart-wrap chart-wrap-tall"><canvas id="chartVehicle"></canvas></div>
        </div>
      </div>

      <div class="charts-grid charts-grid-3">
        <div class="chart-card">
          <h4>Revenue Forecast (Next 7 Days · Linear Regression)</h4>
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
  const fontColor   = "#a8a29e";
  const borderColor = "#292524";
  Chart.defaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size   = 12;

  const mr  = getMonthlyRevenue();
  const rf  = getRevenueForecast();
  const ot  = getOccupancyTrend();
  const cb  = getCostBreakdown();
  const dow = analyticsData?.day_of_week_bookings ?? DAILY_BOOKINGS;

  chartInstances.push(new Chart(document.getElementById("chartRevenue"), {
    type: "bar",
    data: {
      labels: mr.map(d => d.month),
      datasets: [{
        label: "Revenue",
        data: mr.map(d => d.revenue),
        backgroundColor: mr.map((_, i) => i === mr.length - 1 ? "#fafaf9" : "#44403c"),
        borderRadius: 6, maxBarThickness: 52,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `PKR ${c.parsed.y.toLocaleString()}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `PKR ${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
      }
    }
  }));

  chartInstances.push(new Chart(document.getElementById("chartVehicle"), {
    type: "doughnut",
    data: {
      labels: cb.map(d => d.name),
      datasets: [{
        data: cb.map(d => d.value),
        backgroundColor: cb.map(d => d.color),
        borderWidth: 3, borderColor: "#1c1917", hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "58%",
      plugins: {
        legend: { position: "bottom", labels: { color: fontColor, boxWidth: 12, padding: 14, font: { size: 12 } } },
        tooltip: { callbacks: { label: c => ` ${c.label}: PKR ${c.parsed.toLocaleString()}` } }
      }
    }
  }));

  chartInstances.push(new Chart(document.getElementById("chartDaily"), {
    type: "line",
    data: {
      labels: rf.map(d => d.day),
      datasets: [{
        label: "Forecast Revenue", data: rf.map(d => d.revenue),
        borderColor: "#0d9488", backgroundColor: "rgba(13,148,136,0.10)",
        borderDash: [5, 4], pointBackgroundColor: "#0d9488",
        pointRadius: 4, pointHoverRadius: 6, tension: 0.3, borderWidth: 2.5, fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `PKR ${c.parsed.y.toLocaleString()}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `PKR ${(v / 1000).toFixed(0)}k` }, beginAtZero: true }
      }
    }
  }));

  chartInstances.push(new Chart(document.getElementById("chartOccupancy"), {
    type: "line",
    data: {
      labels: ot.map(d => d.time),
      datasets: [{
        label: "Occupancy %", data: ot.map(d => d.rate),
        borderColor: "#059669", backgroundColor: "rgba(5,150,105,0.10)",
        pointBackgroundColor: "#059669", pointRadius: 4, pointHoverRadius: 6,
        tension: 0.40, borderWidth: 2.5, fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y}% occupancy` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `${v}%` }, max: 100, beginAtZero: true }
      }
    }
  }));

  const dowLabels = dow.map(d => d.day);
  const dowValues = dow.map(d => d.bookings);
  const dowColors = ["#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#f97316"];
  chartInstances.push(new Chart(document.getElementById("chartDow"), {
    type: "bar",
    data: {
      labels: dowLabels,
      datasets: [{
        label: "Bookings", data: dowValues,
        backgroundColor: dowColors, borderRadius: 5, maxBarThickness: 36,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y} bookings` } } },
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
   SLOTS TAB — Full CRUD
══════════════════════════════════════════════ */
function slotsHTML() {
  if (liveSlotGroups.length > 0) {
    return liveSlotsSectionHTML();
  }
  return mockSlotsTableHTML();
}

function liveSlotsSectionHTML() {
  const av = liveSlotStats.available ?? 0;
  const oc = liveSlotStats.occupied  ?? 0;
  const rs = liveSlotStats.reserved  ?? 0;
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
      const badge  = status === "booked" ? "occupied" : status;
      const label  = status === "booked" ? "Booked" : status.charAt(0).toUpperCase() + status.slice(1);
      return `
        <div class="live-slot-card live-slot-${badge}" data-id="${s.id}">
          <div class="live-slot-id">${group.block_no}-${String(s.slot_no).padStart(2,"0")}</div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="live-slot-car">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
          </svg>
          <span class="badge badge-sm badge-${badge}">${label}</span>
          <div class="slot-actions">
            <button class="icon-btn slot-edit" data-id="${s.id}" data-action="edit" title="Edit Slot">${ICONS.edit}</button>
            <button class="icon-btn slot-delete" data-id="${s.id}" data-action="delete" title="Delete Slot">${ICONS.trash}</button>
          </div>
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
      .live-block-badge { width:40px; height:40px; background:#1c1917; color:#fff;
        border-radius:10px; display:flex; align-items:center; justify-content:center;
        font-size:16px; font-weight:700; flex-shrink:0; }
      .live-block-title { font-weight:700; font-size:15px; color:var(--foreground); }
      .live-block-sub   { font-size:12px; color:var(--muted-foreground); margin-top:2px; }

      .live-slots-grid { display:flex; gap:12px; flex-wrap:wrap; }

      .live-slot-card { width:110px; border-radius:12px; border:2px solid;
        padding:12px 10px; display:flex; flex-direction:column;
        align-items:center; gap:8px; transition:transform .18s, box-shadow .18s; position:relative; }
      .live-slot-card:hover { transform:translateY(-3px); box-shadow:0 4px 14px rgba(0,0,0,0.10); }
      .live-slot-card:hover .slot-actions { opacity:1; }
      .live-slot-id  { font-size:13px; font-weight:700; }
      .live-slot-car { width:28px; height:28px; }
      .slot-actions { display:flex; gap:4px; opacity:0; transition:opacity 0.2s; position:absolute; top:4px; right:4px; }
      .slot-actions .icon-btn { padding:3px; background:rgba(255,255,255,0.9); border-radius:4px; }

      .live-slot-available { background:#f0fdf6; border-color:#6ee7a8; }
      .live-slot-available .live-slot-id  { color:#15803d; }
      .live-slot-available .live-slot-car { stroke:#34d399; }

      .live-slot-occupied  { background:#fff5f5; border-color:#fca5a5; }
      .live-slot-occupied  .live-slot-id  { color:#dc2626; }
      .live-slot-occupied  .live-slot-car { stroke:#ef4444; }

      .live-slot-reserved  { background:#fffbeb; border-color:#fcd34d; }
      .live-slot-reserved  .live-slot-id  { color:#b45309; }
      .live-slot-reserved  .live-slot-car { stroke:#d97706; }
    </style>

    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">
          ${ICONS.search}
          <input type="text" class="search-input" id="searchInput"
            placeholder="Search by block, slot or status…" value="${escapeHtml(searchTerm)}" />
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" id="addSlotBtn" style="gap:6px;">
            ${ICONS.plus} Add Slot
          </button>
          <button class="btn btn-outline" id="slotRefreshBtn" style="gap:6px;">
            ${ICONS.refresh} Refresh
          </button>
        </div>
      </div>

      <div class="live-slot-summary">
        <div class="live-slot-pill pill-av"><span class="dot"></span>${av} Available</div>
        <div class="live-slot-pill pill-oc"><span class="dot"></span>${oc} Occupied / Booked</div>
        <div class="live-slot-pill pill-rs"><span class="dot"></span>${rs} Reserved</div>
      </div>

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
        <button class="icon-btn" data-action="edit" data-id="${s.id}">${ICONS.edit}</button>
        <button class="icon-btn danger" data-action="delete" data-id="${s.id}">${ICONS.trash}</button>
      </div></td>
    </tr>`).join("") : `<tr class="empty-row"><td colspan="6">No slots found</td></tr>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">${ICONS.search}<input type="text" class="search-input" id="searchInput" placeholder="Search slots…" value="${escapeHtml(searchTerm)}" /></div>
        <button class="btn btn-primary" id="addSlotBtn">${ICONS.plus} Add Slot</button>
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
  const refreshBtn = document.getElementById("slotRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = ICONS.refresh + " Loading…";
      await loadLiveSlots();
      await loadAllSlots();
      renderTabContent();
    });
  }

  const addBtn = document.getElementById("addSlotBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => showSlotModal());
  }
}

function showSlotModal(slot = null) {
  editingId = slot ? slot.id : null;
  editingType = "slot";
  const isEdit = !!slot;
  
  const content = `
    <div class="form-stack">
      <div class="form-field">
        <label>Slot Number</label>
        <input type="number" id="slotNoInput" value="${slot ? slot.slot_no : ''}" placeholder="e.g. 1, 2, 3" />
      </div>
      <div class="form-field">
        <label>Block</label>
        <select id="blockNoInput">
          <option value="A" ${slot && slot.block_no === 'A' ? 'selected' : ''}>Block A</option>
          <option value="B" ${slot && slot.block_no === 'B' ? 'selected' : ''}>Block B</option>
          <option value="C" ${slot && slot.block_no === 'C' ? 'selected' : ''}>Block C</option>
          <option value="D" ${slot && slot.block_no === 'D' ? 'selected' : ''}>Block D</option>
        </select>
      </div>
      <div class="form-field">
        <label>Floor</label>
        <select id="floorNoInput">
          <option value="Ground-Floor" ${slot && slot.floor_no === 'Ground-Floor' ? 'selected' : ''}>Ground Floor</option>
          <option value="First-Floor" ${slot && slot.floor_no === 'First-Floor' ? 'selected' : ''}>First Floor</option>
          <option value="Second-Floor" ${slot && slot.floor_no === 'Second-Floor' ? 'selected' : ''}>Second Floor</option>
          <option value="Third-Floor" ${slot && slot.floor_no === 'Third-Floor' ? 'selected' : ''}>Third Floor</option>
        </select>
      </div>
      <div class="form-field">
        <label>Status</label>
        <select id="slotStatusInput">
          <option value="Available" ${slot && slot.slot_status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="Booked" ${slot && slot.slot_status === 'Booked' ? 'selected' : ''}>Booked</option>
          <option value="Reserved" ${slot && slot.slot_status === 'Reserved' ? 'selected' : ''}>Reserved</option>
        </select>
      </div>
    </div>
  `;

  showModal(isEdit ? "Edit Slot" : "Add New Slot", content, async () => {
    const slotNo = document.getElementById("slotNoInput").value;
    const blockNo = document.getElementById("blockNoInput").value;
    const floorNo = document.getElementById("floorNoInput").value;
    const status = document.getElementById("slotStatusInput").value;

    if (!slotNo) {
      showToast("Please enter a slot number", "error");
      return;
    }

    try {
      const url = isEdit ? `${API_BASE}/slots/${editingId}` : `${API_BASE}/slots`;
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_no: parseInt(slotNo),
          block_no: blockNo,
          floor_no: floorNo,
          slot_status: status
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || "Operation failed", "error");
        return;
      }

      showToast(isEdit ? "Slot updated successfully" : "Slot created successfully");
      closeModal();
      await loadLiveSlots();
      await loadAllSlots();
      await refreshStats();
      renderTabContent();
    } catch (e) {
      showToast("Network error: " + e.message, "error");
    }
  });
}

async function deleteSlot(slotId) {
  if (!confirm("Are you sure you want to delete this slot?")) return;
  
  try {
    const res = await fetch(`${API_BASE}/slots/${slotId}`, { method: "DELETE" });
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.detail || "Delete failed", "error");
      return;
    }
    
    showToast("Slot deleted successfully");
    await loadLiveSlots();
    await loadAllSlots();
    await refreshStats();
    renderTabContent();
  } catch (e) {
    showToast("Network error: " + e.message, "error");
  }
}

/* ══════════════════════════════════════════════
   BOOKINGS TAB — Full CRUD
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
          <button class="icon-btn" data-action="view" data-id="${b.id}" title="View">${ICONS.more}</button>
          <button class="icon-btn" data-action="edit" data-id="${b.id}" title="Edit">${ICONS.edit}</button>
          <button class="icon-btn danger" data-action="delete" data-id="${b.id}" title="Delete">${ICONS.trash}</button>
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

async function deleteBooking(bookingId) {
  if (!confirm("Are you sure you want to delete this booking? The slot will be freed.")) return;
  
  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}`, { method: "DELETE" });
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.detail || "Delete failed", "error");
      return;
    }
    
    showToast("Booking deleted and slot freed");
    await loadLiveBookings();
    await loadLiveSlots();
    await refreshStats();
    renderTabContent();
  } catch (e) {
    showToast("Network error: " + e.message, "error");
  }
}

async function updateBookingStatus(bookingId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_status: newStatus })
    });
    
    const data = await res.json();
    if (!res.ok) {
      showToast(data.detail || "Update failed", "error");
      return;
    }
    
    showToast("Booking status updated");
    await loadLiveBookings();
    await refreshStats();
    renderTabContent();
  } catch (e) {
    showToast("Network error: " + e.message, "error");
  }
}

/* ══════════════════════════════════════════════
   USERS TAB — Full CRUD
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
          <button class="icon-btn" data-action="edit" data-id="${u.id}" title="Edit">${ICONS.edit}</button>
          <button class="icon-btn danger" data-action="delete" data-id="${u.id}" title="Delete">${ICONS.trash}</button>
          <button class="icon-btn" data-action="more" data-id="${u.id}" title="More">${ICONS.more}</button>
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
          <button class="btn btn-primary" id="addUserBtn" style="gap:6px;">
            ${ICONS.plus} Add User
          </button>
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
  if (btn) {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.innerHTML = ICONS.refresh + " Loading…";
      await loadLiveUsers();
      renderTabContent();
    });
  }

  const addBtn = document.getElementById("addUserBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => showUserModal());
  }
}

function showUserModal(user = null) {
  editingId = user ? user.id : null;
  editingType = "user";
  const isEdit = !!user;

  const content = `
    <div class="form-stack">
      <div class="form-field">
        <label>Full Name</label>
        <input type="text" id="userNameInput" value="${user ? escapeHtml(user.name) : ''}" placeholder="e.g. John Doe" />
      </div>
      <div class="form-field">
        <label>Email</label>
        <input type="email" id="userEmailInput" value="${user ? escapeHtml(user.email) : ''}" placeholder="e.g. john@email.com" />
      </div>
      <div class="form-field">
        <label>Phone</label>
        <input type="text" id="userPhoneInput" value="${user ? escapeHtml(user.phone) : ''}" placeholder="e.g. 03001234567" />
      </div>
      <div class="form-field">
        <label>Password ${isEdit ? '(leave blank to keep unchanged)' : ''}</label>
        <input type="password" id="userPasswordInput" placeholder="${isEdit ? '••••••••' : 'Set a password'}" autocomplete="new-password" />
      </div>
    </div>
  `;

  showModal(isEdit ? "Edit User" : "Add New User", content, async () => {
    const name     = document.getElementById("userNameInput").value.trim();
    const email    = document.getElementById("userEmailInput").value.trim();
    const phone    = document.getElementById("userPhoneInput").value.trim();
    const password = document.getElementById("userPasswordInput").value;

    if (!name || !email) {
      showToast("Name and email are required", "error");
      return;
    }
    if (!isEdit && !password) {
      showToast("Please set a password for the new user", "error");
      return;
    }

    const body = { Full_name: name, Phone_no: phone, Email: email };
    if (password) body.user_password = password;

    try {
      const url    = isEdit ? `${API_BASE}/admin/users/${editingId}` : `${API_BASE}/admin/users`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.detail || "Operation failed", "error");
        return;
      }

      showToast(isEdit ? "User updated successfully" : "User created successfully");
      closeModal();
      await loadLiveUsers();
      await refreshStats();
      renderTabContent();
    } catch (e) {
      showToast("Network error: " + e.message, "error");
    }
  });
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    
    if (!res.ok) {
      showToast(data.detail || "Delete failed", "error");
      return;
    }
    
    showToast("User deleted successfully");
    await loadLiveUsers();
    await refreshStats();
    renderTabContent();
  } catch (e) {
    showToast("Network error: " + e.message, "error");
  }
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
}

function attachTableActionHandlers() {
  // Slot actions
  document.querySelectorAll(".slot-edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const slotId = btn.dataset.id;
      const slot = allSlots.find(s => s.id == slotId);
      if (slot) showSlotModal(slot);
    });
  });

  document.querySelectorAll(".slot-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteSlot(btn.dataset.id);
    });
  });

  // General table actions
  document.querySelectorAll(".icon-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const row = btn.closest("tr");

      if (activeTab === "bookings") {
        if (action === "delete") await deleteBooking(id);
        else if (action === "edit") {
          const booking = liveBookings?.find(b => b.id == id);
          if (booking) {
            const statuses = ["active", "completed", "cancelled"];
            const currentStatus = booking.status;
            const newStatus = prompt(`Change status (current: ${currentStatus})\\nOptions: ${statuses.join(", ")}`, currentStatus);
            if (newStatus && statuses.includes(newStatus.toLowerCase())) {
              await updateBookingStatus(id, newStatus.toLowerCase());
            }
          }
        }
      }
      else if (activeTab === "users") {
        if (action === "delete") await deleteUser(id);
        else if (action === "edit") {
          const source = liveUsers ?? USERS;
          const user = source.find(u => u.id == id);
          if (user) showUserModal(user);
        }
      }
      else if (activeTab === "slots" && !btn.classList.contains("slot-edit") && !btn.classList.contains("slot-delete")) {
        if (action === "delete") await deleteSlot(id);
        else if (action === "edit") {
          const slot = allSlots.find(s => s.id == id);
          if (slot) showSlotModal(slot);
        }
      }
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
  await Promise.all([
    loadAnalytics(),
    loadLiveSlots(),
    loadAllSlots(),
    loadLiveUsers(),
    loadLiveBookings(),
  ]);
  renderStats();
  renderTabsBar();
  renderTabContent();
}

initAdminPanel();
