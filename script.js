/* ============================================================
   Admin Panel — render logic
   ============================================================ */

const ICONS = {
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  bar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
};

let activeTab = "overview";
let searchTerm = "";
let chartInstances = [];

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Stats ---------- */
function renderStats() {
  const grid = document.getElementById("statsGrid");
  grid.innerHTML = STATS.map(stat => `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-icon-wrap color-${stat.color}">${ICONS[stat.icon]}</div>
        <span class="stat-change">${stat.change}</span>
      </div>
      <p class="stat-value">${stat.value}</p>
      <p class="stat-label">${stat.label}</p>
    </div>
  `).join("");
}

/* ---------- Tabs bar ---------- */
function renderTabsBar() {
  const bar = document.getElementById("tabsBar");
  bar.innerHTML = TABS.map(t => `
    <button class="tab-btn ${activeTab === t.id ? "active" : ""}" data-tab="${t.id}">${t.label}</button>
  `).join("");
  bar.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      searchTerm = "";
      renderTabsBar();
      renderTabContent();
    });
  });
}

/* ---------- Tab content dispatcher ---------- */
function renderTabContent() {
  const root = document.getElementById("tabContent");
  destroyCharts();

  if (activeTab === "overview") root.innerHTML = overviewHTML();
  else if (activeTab === "charts") { root.innerHTML = chartsHTML(); initCharts(); }
  else if (activeTab === "slots") root.innerHTML = slotsHTML();
  else if (activeTab === "bookings") root.innerHTML = bookingsHTML();
  else if (activeTab === "users") root.innerHTML = usersHTML();

  attachSearchHandler();
  attachTableActionHandlers();
}

/* ---------- Overview ---------- */
function overviewHTML() {
  const rows = BOOKINGS.map(b => `
    <div class="activity-row">
      <div>
        <p class="activity-name">${escapeHtml(b.user)}</p>
        <p class="activity-meta">${b.bookingId} · Slot ${b.slotId} · ${b.vehicleType}</p>
      </div>
      <div class="activity-right">
        <span class="activity-amount">${b.amount}</span>
        <span class="badge badge-${b.status}">${b.status}</span>
      </div>
    </div>
  `).join("");

  return `
    <div class="stack">
      <div>
        <h3 class="section-title">Today's Snapshot</h3>
        <div class="mini-grid">
          <div class="mini-card"><p class="mini-card-label">Today's Bookings</p><p class="mini-card-value">42</p></div>
          <div class="mini-card"><p class="mini-card-label">Available Slots</p><p class="mini-card-value">164</p></div>
          <div class="mini-card"><p class="mini-card-label">Today's Revenue</p><p class="mini-card-value">$1,680</p></div>
          <div class="mini-card"><p class="mini-card-label">Peak Hours</p><p class="mini-card-value">9 AM – 5 PM</p></div>
        </div>
      </div>
      <div>
        <h3 class="section-title">Recent Activity</h3>
        <div class="stack-sm" style="gap:0;">${rows}</div>
      </div>
    </div>
  `;
}

/* ---------- Charts ---------- */
function chartsHTML() {
  const earnings = [
    { label: "Total Earnings", value: "$2,55,640", sub: "All time" },
    { label: "This Month", value: "$45,670", sub: "May 2026" },
    { label: "Total Cars Parked", value: "1,060", sub: "This month" },
    { label: "Avg. per Booking", value: "$43", sub: "Across all types" },
  ];
  return `
    <div class="stack" style="gap:2rem;">
      <div class="charts-header">${ICONS.bar}<h3 class="section-title" style="margin-bottom:0;">Analytics &amp; Charts</h3></div>

      <div class="charts-grid">
        <div class="chart-card">
          <h4>Monthly Revenue (Last 6 Months)</h4>
          <div class="chart-wrap"><canvas id="chartRevenue"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Vehicle Type Distribution</h4>
          <div class="chart-wrap"><canvas id="chartVehicle"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Daily Bookings (This Week)</h4>
          <div class="chart-wrap"><canvas id="chartDaily"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>Occupancy Rate by Hour (%)</h4>
          <div class="chart-wrap"><canvas id="chartOccupancy"></canvas></div>
        </div>
      </div>

      <div class="earnings-grid">
        ${earnings.map(c => `
          <div class="earnings-card">
            <p class="earnings-label">${c.label}</p>
            <p class="earnings-value">${c.value}</p>
            <p class="earnings-sub">${c.sub}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function destroyCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];
}

function initCharts() {
  const borderColor = "#e5e7eb";
  const fontColor = "#6b7280";
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size = 12;

  // Revenue bar chart
  chartInstances.push(new Chart(document.getElementById("chartRevenue"), {
    type: "bar",
    data: {
      labels: MONTHLY_REVENUE.map(d => d.month),
      datasets: [{
        data: MONTHLY_REVENUE.map(d => d.revenue),
        backgroundColor: "#d97706",
        borderRadius: 4,
        maxBarThickness: 40,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `$${ctx.parsed.y.toLocaleString()}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `$${(v/1000).toFixed(0)}k` } }
      }
    }
  }));

  // Vehicle distribution doughnut
  chartInstances.push(new Chart(document.getElementById("chartVehicle"), {
    type: "doughnut",
    data: {
      labels: VEHICLE_DISTRIBUTION.map(d => d.name),
      datasets: [{
        data: VEHICLE_DISTRIBUTION.map(d => d.value),
        backgroundColor: VEHICLE_DISTRIBUTION.map(d => d.color),
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { position: "bottom", labels: { color: fontColor, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} bookings` } }
      }
    }
  }));

  // Daily bookings bar
  chartInstances.push(new Chart(document.getElementById("chartDaily"), {
    type: "bar",
    data: {
      labels: DAILY_BOOKINGS.map(d => d.day),
      datasets: [{
        data: DAILY_BOOKINGS.map(d => d.bookings),
        backgroundColor: "#10b981",
        borderRadius: 4,
        maxBarThickness: 40,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} bookings` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor } }
      }
    }
  }));

  // Occupancy line chart
  chartInstances.push(new Chart(document.getElementById("chartOccupancy"), {
    type: "line",
    data: {
      labels: OCCUPANCY_TREND.map(d => d.time),
      datasets: [{
        data: OCCUPANCY_TREND.map(d => d.rate),
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
        pointBackgroundColor: "#f59e0b",
        pointRadius: 4,
        tension: 0.35,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}% occupancy` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: fontColor } },
        y: { grid: { color: borderColor }, ticks: { color: fontColor, callback: v => `${v}%` } }
      }
    }
  }));
}

/* ---------- Slots ---------- */
function slotsHTML() {
  const filtered = PARKING_SLOTS.filter(s =>
    searchTerm === "" ||
    s.slotId.toLowerCase().includes(searchTerm) ||
    s.block.toLowerCase().includes(searchTerm)
  );
  const rows = filtered.length ? filtered.map(s => `
    <tr data-id="${s.id}">
      <td>${s.slotId}</td>
      <td>Block ${s.block}</td>
      <td>${s.type}</td>
      <td>$${s.price}</td>
      <td><span class="badge badge-sm badge-${s.status}">${s.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
          <button class="icon-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          <button class="icon-btn" data-action="more" title="More">${ICONS.more}</button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr class="empty-row"><td colspan="6">No slots found</td></tr>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">${ICONS.search}<input type="text" class="search-input" id="searchInput" placeholder="Search slots..." value="${escapeHtml(searchTerm)}" /></div>
        <button class="btn btn-primary" id="addBtn">${ICONS.plus} Add Slot</button>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Slot ID</th><th>Block</th><th>Type</th><th>Rate (flat)</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------- Bookings ---------- */
function bookingsHTML() {
  const filtered = BOOKINGS.filter(b =>
    searchTerm === "" ||
    b.user.toLowerCase().includes(searchTerm) ||
    b.bookingId.toLowerCase().includes(searchTerm)
  );
  const rows = filtered.length ? filtered.map(b => `
    <tr data-id="${b.id}">
      <td>${b.bookingId}</td>
      <td>${escapeHtml(b.user)}</td>
      <td>${b.slotId}</td>
      <td>${b.vehicleType}</td>
      <td>${b.carNo}</td>
      <td>${b.date}</td>
      <td>${b.amount}</td>
      <td><span class="badge badge-sm badge-${b.status}">${b.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
          <button class="icon-btn" data-action="more" title="More">${ICONS.more}</button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr class="empty-row"><td colspan="9">No bookings found</td></tr>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="search-wrap" style="max-width:28rem;">${ICONS.search}<input type="text" class="search-input" id="searchInput" placeholder="Search bookings..." value="${escapeHtml(searchTerm)}" /></div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Booking ID</th><th>User</th><th>Slot</th><th>Vehicle Type</th><th>Car No</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------- Users ---------- */
function usersHTML() {
  const filtered = USERS.filter(u =>
    searchTerm === "" ||
    u.name.toLowerCase().includes(searchTerm) ||
    u.email.toLowerCase().includes(searchTerm)
  );
  const rows = filtered.length ? filtered.map(u => `
    <tr data-id="${u.id}">
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${u.phone}</td>
      <td>${u.totalBookings}</td>
      <td><span class="badge badge-sm badge-${u.status}">${u.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" title="Edit">${ICONS.edit}</button>
          <button class="icon-btn danger" data-action="delete" title="Delete">${ICONS.trash}</button>
          <button class="icon-btn" data-action="more" title="More">${ICONS.more}</button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr class="empty-row"><td colspan="6">No users found</td></tr>`;

  return `
    <div class="stack" style="gap:1rem;">
      <div class="toolbar">
        <div class="search-wrap">${ICONS.search}<input type="text" class="search-input" id="searchInput" placeholder="Search users..." value="${escapeHtml(searchTerm)}" /></div>
        <button class="btn btn-primary" id="addBtn">${ICONS.plus} Add User</button>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Total Bookings</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------- Handlers ---------- */
function attachSearchHandler() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    const cursorPos = e.target.selectionStart;
    renderTabContent();
    const newInput = document.getElementById("searchInput");
    if (newInput) {
      newInput.focus();
      newInput.setSelectionRange(cursorPos, cursorPos);
    }
  });
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.addEventListener("click", () => alert("Hook this button up to your create form / modal."));
}

function attachTableActionHandlers() {
  document.querySelectorAll(".icon-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const row = btn.closest("tr");
      const id = row ? row.dataset.id : null;
      console.log(`Action "${action}" triggered for row ${id}`);
    });
  });
}

/* ---------- Sign out ---------- */
document.getElementById("signOutBtn").addEventListener("click", () => {
  // Mirrors original logout: clear admin flag and redirect to login
  localStorage.removeItem("isAdmin");
  alert("Signed out. (Wire this up to your auth/login route.)");
});

/* ---------- Init ---------- */
renderStats();
renderTabsBar();
renderTabContent();
