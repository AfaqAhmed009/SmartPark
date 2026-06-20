/**
 * Dashboard — live slot map from API
 */
const CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-car-front-fill" viewBox="0 0 16 16">
<path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848ZM3 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zM2.906 5.189a.51.51 0 0 0 .497.731c.91-.073 3.35-.17 4.597-.17s3.688.097 4.597.17a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 11.691 3H4.309a.5.5 0 0 0-.447.276L2.906 5.19Z"/>
</svg>`;

function statusToClass(status) {
  switch (status) {
    case "Available":
      return "";
    case "Occupied":
      return "occupied";
    case "Reserved":
      return "reserved";
    default:
      return "";
  }
}

function renderSlotButton(slot) {
  const cls = statusToClass(slot.slot_status);
  const label = `${slot.block_no}-${slot.slot_no}`;
  const canBook = slot.slot_status === "Available";
  const onclick = canBook
    ? `onclick="goToBookSlot(${slot.id}, '${label}')"`
    : "";
  const disabledAttr = canBook ? "" : "aria-disabled=\"true\"";
  return `
    <button ${onclick} ${disabledAttr} class="parking-btn ${cls}" title="${canBook ? `Click to book slot ${label}` : `Slot ${label} is ${slot.slot_status}`}">
      <div class="icon">${CAR_SVG}</div>
      <span class="slot-number">${label}</span>
      <span class="status-dot"></span>
    </button>`;
}

function renderBlockSection(group, index) {
  const slots = group.slots;
  const available = slots.filter((s) => s.slot_status === "Available").length;
  const mid = Math.ceil(slots.length / 2);
  const upper = slots.slice(0, mid);
  const lower = slots.slice(mid);
  const delay = (index * 0.06).toFixed(2);

  return `
    <section class="slot-section" style="animation: fadeIn 0.4s ease both; animation-delay:${delay}s;">
      <div style="display:flex;align-items:center;justify-content:left;gap:20px;" class="hero2">
        <div class="block"><div class="logo-box">${CAR_SVG}</div></div>
        <div class="intro_hero2">
          <h3>Block ${group.block_no} — ${group.floor_no}</h3>
          <p>${available} of ${slots.length} available</p>
        </div>
      </div>
      <div style="margin:10px;padding:10px;" class="slots">
        <div class="upper_row">${upper.map(renderSlotButton).join("")}</div>
        <div class="drive-lane"><span>← DRIVE LANE →</span></div>
        <div class="lower_row">${lower.map(renderSlotButton).join("")}</div>
      </div>
    </section>`;
}

function goToBookSlot(slotId, label) {
  sessionStorage.setItem("selected_slot_id", slotId);
  sessionStorage.setItem("selected_slot_label", label);
  window.location.href = "BookSlot.html";
}

async function loadDashboard() {
  const container = document.getElementById("slotsContainer");
  const freeBtn = document.querySelector(".free");
  const bookBtn = document.querySelector(".book");
  const occBtn = document.querySelector(".occupied-btn");

  if (!container) return;

  // Only show the full-page loading state on first load, not on the
  // 30s polling refresh — keeps the UI from flashing/jumping.
  const isFirstLoad = !container.dataset.loaded;
  if (isFirstLoad) {
    container.innerHTML = `<div class="loading-state">Loading parking slots…</div>`;
  }

  try {
    const data = await apiRequest("/slots/grouped");
    const { groups, stats } = data;

    if (freeBtn) freeBtn.textContent = `${stats.available} Available`;
    if (bookBtn) bookBtn.textContent = `${stats.reserved} Reserved`;
    if (occBtn) occBtn.textContent = `${stats.occupied} Occupied`;

    container.innerHTML = groups.map(renderBlockSection).join("");
    container.dataset.loaded = "true";
  } catch (err) {
    container.innerHTML = `
      <div class="loading-state" style="color:#dc2626;">
        Failed to load slots: ${err.message}. Is the API running on port 8000?
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  setInterval(loadDashboard, 30000);
});
