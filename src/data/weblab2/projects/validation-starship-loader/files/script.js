// DOM Elements
const runBtn = document.querySelector("#run-btn");
const statusMsg = document.querySelector("#status-msg");
const weightDisplay = document.querySelector("#weight-display");
const warehouseList = document.querySelector("#warehouse-list");
const shipList = document.querySelector("#ship-list");

// Data
const warehouseQueue = [150, 300, 120, 200, 500, 100];
const maxCapacity = 800;
let shipCargo = [];
let currentWeight = 0;

// Initial Render
renderLists();

// Event Listener
runBtn.addEventListener("click", () => {
  // Reset for the run
  shipCargo = [];
  currentWeight = 0;
  let i = 0; // Index tracker

  statusMsg.textContent = "Loading sequence initiated...";

  // LOOP: Run as long as we have items AND haven't exceeded capacity
  while (i < warehouseQueue.length && currentWeight < maxCapacity) {

    let crate = warehouseQueue[i];

    // Check if adding this crate fits on the ship
    if (currentWeight + crate <= maxCapacity) {
      currentWeight = currentWeight + crate;

      // Add the crate to the shipCargo array
      shipCargo.push(crate);
    }

    // MISSING CODE HERE


    
  }

  updateScreen();
});

// Helper Functions
function renderLists() {
  warehouseList.innerHTML = "";
  warehouseQueue.forEach(crate => {
    warehouseList.innerHTML += `<li>📦 Crate (${crate} tons)</li>`;
  });

  shipList.innerHTML = "";
  if(shipCargo.length === 0) {
    shipList.innerHTML = "<li style='opacity:0.5'>Empty</li>";
  } else {
    shipCargo.forEach(crate => {
      shipList.innerHTML += `<li class="loaded">🚀 Crate (${crate} tons)</li>`;
    });
  }
}

function updateScreen() {
  weightDisplay.textContent = currentWeight;
  renderLists();

  if (currentWeight > 0) {
    statusMsg.textContent = "Loading Complete!";
    statusMsg.style.color = "var(--neon-green)";
  } else {
    statusMsg.textContent = "System Error: No cargo loaded.";
    statusMsg.style.color = "var(--neon-red)";
  }
}