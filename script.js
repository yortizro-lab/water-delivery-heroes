/* Water Delivery Heroes - Game Logic */

const totalWater = 10;
const startingTime = 90;
const deliveryAnimationDuration = 800;
const spillTimeLimit = 6000;
const spillRate = 0.5;
const spillTick = 250;

let water = totalWater;
let score = 0;
let families = 0;
let timeRemaining = startingTime;
let timerInterval = null;
let spillInterval = null;
let tripStartedAt = null;
let spillPenaltyApplied = false;
let gameStarted = false;
let gameEnded = false;
let deliveryInProgress = false;

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const deliveryProgress = document.getElementById("deliveryProgress");
const waterDisplay = document.getElementById("water");
const scoreDisplay = document.getElementById("score");
const familiesDisplay = document.getElementById("families");
const timerDisplay = document.getElementById("timer");
const messageDisplay = document.getElementById("message");
const playAgainButton = document.getElementById("playAgainButton");
const deliveryMessage = document.getElementById("deliveryMessage");
const neighborhoodMap = document.getElementById("neighborhoodMap");
const mapMessage = document.getElementById("mapMessage");
const drivingMode = document.getElementById("drivingMode");
const moveButtons = {
  up: document.getElementById("moveUp"),
  down: document.getElementById("moveDown"),
  left: document.getElementById("moveLeft"),
  right: document.getElementById("moveRight")
};

function updateDisplay() {
  waterDisplay.textContent = water.toFixed(1).replace(/\.0$/, "");
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;

  const percent = families * 10;
  progressText.textContent = percent + "%";
  progressFill.style.width = percent + "%";
  deliveryProgress.setAttribute("aria-valuenow", families);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
  timerDisplay.classList.toggle("time-warning", timeRemaining <= 10);

  const tankWater = document.querySelector(".tank-water");
  if (tankWater) {
    tankWater.style.height = `${Math.max(0, (water / totalWater) * 100)}%`;
  }
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  if (timerInterval !== null || gameEnded) {
    return;
  }

  timerInterval = window.setInterval(() => {
    timeRemaining -= 1;
    updateDisplay();
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      updateDisplay();
      endGame(false, "Time's Up! Try Again!");
    }
  }, 1000);
}

function stopSpillTimer() {
  if (spillInterval !== null) {
    window.clearInterval(spillInterval);
    spillInterval = null;
  }
  tripStartedAt = null;
  spillPenaltyApplied = false;
  mapTruck?.classList.remove("spilling");
}

function startSpillTimer() {
  if (
    drivingMode.value !== "challenge" ||
    spillInterval !== null ||
    gameEnded
  ) {
    return;
  }

  tripStartedAt = Date.now();
  spillInterval = window.setInterval(() => {
    if (tripStartedAt === null || gameEnded) {
      return;
    }

    const elapsed = Date.now() - tripStartedAt;
    if (elapsed < spillTimeLimit) {
      return;
    }

    if (!spillPenaltyApplied) {
      spillPenaltyApplied = true;
      score = Math.max(0, score - 5);
      mapMessage.textContent =
        "Water spilling! You are losing water and points!";
      mapTruck.classList.add("spilling");
    }

    water = Math.max(0, water - spillRate * (spillTick / 1000));
    updateDisplay();
    if (water <= 0) {
      endGame(false, "Out of Water! Mission Failed.");
    }
  }, spillTick);
}

function endGame(completed, text) {
  stopTimer();
  stopSpillTimer();
  gameEnded = true;
  const startButton = document.getElementById("startButton");
if (startButton) {
  startButton.textContent = completed ? "🎉 PLAY AGAIN" : "🔄 TRY AGAIN";
  startButton.disabled = false;
}
  playAgainButton.hidden = false;
  houses.forEach((house) => {
    house.disabled = true;
  });
  Object.values(moveButtons).forEach((button) => {
    button.disabled = true;
  });

  if (completed) {
    deliveryMessage.textContent =
      `🎉 Mission complete! Final score: ${score}. Time remaining: ${timerDisplay.textContent}.`;
    deliveryMessage.classList.add("success");
    messageDisplay.textContent = "Mission Complete! All 10 families helped! 🏆";
    mapMessage.textContent =
      "🎉 Mission Complete! You delivered water to all 10 houses!";
  } else {
    deliveryMessage.textContent = text;
    deliveryMessage.classList.remove("success");
    messageDisplay.textContent = text;
    mapMessage.textContent = text;
  }
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

const houses = neighborhoodMap
  ? neighborhoodMap.querySelectorAll(".map-house")
  : [];
const mapDeliveries = document.getElementById("mapDeliveries");
const mapTruck = neighborhoodMap?.querySelector(".map-truck");
const roadColumns = [8, 37, 50, 70, 92];
const roadRows = [18, 40, 64, 82];
let truckPosition = { left: 50, top: 40 };
let selectedHouse = null;
let facingDirection = "right";
houses.forEach((house) => {
  house.addEventListener("click", () => {
    // Houses no longer need to be selected manually.
    mapMessage.textContent = "🚚 Use the arrows to drive to a house!";
  });
});

function setTruckFacing(direction) {
  facingDirection = direction;
  const angles = { up: -90, right: 0, down: 90, left: 180 };
  mapTruck?.style.setProperty("--truck-angle", `${angles[direction]}deg`);
}

function refreshMap() {
  const served = neighborhoodMap.querySelectorAll(".map-house.served").length;
  mapDeliveries.textContent = `${served} of 10 houses served`;
}

function resetMap() {
  stopSpillTimer();
  truckPosition = { left: 50, top: 40 };
  setTruckFacing("right");
  selectedHouse = null;
  deliveryInProgress = false;
  houses.forEach((house, index) => {
    house.disabled = false;
    house.classList.remove("served", "selected");
    house.innerHTML = `🏠<span>House ${index + 1}</span>`;
    house.setAttribute("aria-label", `Select house ${index + 1} for delivery`);
  });
  mapDeliveries.textContent = "0 of 10 houses served";
  mapMessage.textContent = "Select House 1 to begin delivering water.";
  mapTruck.style.left = `${truckPosition.left}%`;
  mapTruck.style.top = `${truckPosition.top}%`;
  mapTruck.classList.remove("delivering");
  Object.values(moveButtons).forEach((button) => {
    button.disabled = false;
  });
}

async function deliverAtHouse(house) {
  if (
    gameEnded ||
    deliveryInProgress ||
    house.classList.contains("served") ||
    truckPosition.left !== parseFloat(house.style.left) ||
    truckPosition.top !== parseFloat(house.style.top)
  ) {
    return;
  }

  if (water < 1) {
    endGame(false, "Out of Water! Mission Failed.");
    return;
  }

  deliveryInProgress = true;
  stopSpillTimer();

  house.classList.add("served");
  house.classList.remove("selected");
  house.innerHTML =
    '✅<span class="delivery-drop" aria-hidden="true">💧</span>';
  house.disabled = true;

  water = Math.max(0, water - 1);
  score += 10;
  families += 1;

  updateDisplay();
  refreshMap();

  mapMessage.textContent = "💧 Water delivered! +10 points.";
  deliveryMessage.textContent =
    "Keep going! Every drop helps a family. 💧";
  deliveryMessage.classList.remove("success");

  mapTruck.classList.add("delivering");
  await wait(deliveryAnimationDuration);
  mapTruck.classList.remove("delivering");

  if (families === houses.length) {
    endGame(true);
  } else {
    deliveryInProgress = false;
    selectedHouse = null;
    startTimer();
  }
}

async function moveTruck(direction) {
  if (gameEnded || deliveryInProgress) {
    return;
  }
  if (water < 1) {
    endGame(false, "Out of Water! Mission Failed.");
    return;
  }

  const columnIndex = roadColumns.indexOf(truckPosition.left);
  const rowIndex = roadRows.indexOf(truckPosition.top);
  const offsets = {
    up: { left: 0, top: -1 },
    down: { left: 0, top: 1 },
    left: { left: -1, top: 0 },
    right: { left: 1, top: 0 }
  };
  const offset = offsets[direction];
  const nextPosition = {
    left: roadColumns[columnIndex + offset.left],
    top: roadRows[rowIndex + offset.top]
  };

  if (
    columnIndex === -1 ||
    rowIndex === -1 ||
    nextPosition.left === undefined ||
    nextPosition.top === undefined ||
    (roadColumns[columnIndex] === 92 && offset.top !== 0)
  ) {
    mapMessage.textContent = "Road blocked.";
    return;
  }

  setTruckFacing(direction);
  truckPosition = nextPosition;
  mapTruck.style.left = `${truckPosition.left}%`;
  mapTruck.style.top = `${truckPosition.top}%`;
  mapMessage.textContent = "🚚 Driving...";
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }
  if (drivingMode.value === "challenge" && tripStartedAt === null) {
    startSpillTimer();
 
  }
    const reachedHouse = [...houses].find((house) => {
  return (
    !house.classList.contains("served") &&
    truckPosition.left === parseFloat(house.style.left) &&
    truckPosition.top === parseFloat(house.style.top)
  );
});

if (reachedHouse) {
  await deliverAtHouse(reachedHouse);
}
}

houses.forEach((house) => {
  house.addEventListener("click", () => {
    if (house.disabled || deliveryInProgress || gameEnded) {
      return;
    }
    const houseNumber = Number(house.dataset.house) + 1;
    const nextHouseNumber = families + 1;
    if (houseNumber !== nextHouseNumber) {
      mapMessage.textContent = `Deliver to House ${nextHouseNumber} first!`;
      return;
    }
    if (selectedHouse) {
      selectedHouse.classList.remove("selected");
    }
    selectedHouse = house;
    house.classList.add("selected");
    mapMessage.textContent = `Drive to House ${houseNumber} with the arrow controls.`;
  });
});

Object.entries(moveButtons).forEach(([direction, button]) => {
  if (!button) {
    console.error(`Missing movement button: ${direction}`);
    return;
  }

  button.addEventListener("click", () => {
    console.log(`Arrow clicked: ${direction}`);
    moveTruck(direction);
  });
});

document.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  const direction = directions[event.key];
  if (!direction) {
    return;
  }
  event.preventDefault();
  moveTruck(direction);
});


gameEnded = false;
deliveryInProgress = false;

drivingMode.value = "safe";
resetMap();
updateDisplay();

messageDisplay.textContent = "Ready to make a difference? 💧";
deliveryMessage.textContent =
  "Keep going! Every drop helps a family. 💧";
deliveryMessage.classList.remove("success");


    drivingMode.value = "safe";
    resetMap();
    updateDisplay();

    messageDisplay.textContent = "Ready to make a difference? 💧";
    deliveryMessage.textContent =
      "Keep going! Every drop helps a family. 💧";
    deliveryMessage.classList.remove("success");


  resetMap();
  gameEnded = false;
  deliveryInProgress = false;
  gameStarted = true;

  startButton.textContent = "▶ GAME IN PROGRESS";
  startButton.disabled = true;

  mapMessage.textContent =
    "Game started! 🏁 Use the arrow buttons to deliver water.";

  updateDisplay();
  startTimer();
