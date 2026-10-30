/* Water Delivery Heroes - Game Logic */

// Level settings (array of objects)
const levels = [
  { water: 12, time: 30, goal: 10 },
  { water: 7, time: 25, goal: 5 }
];

const deliveryAnimationDuration = 800;
const spillTimeLimit = 1500;
const spillTick = 250;

let water = levels[0].water;
let score = 0;
let families = 0;
let timeRemaining = levels[0].time;
let timerInterval = null;
let spillInterval = null;
let tripStartedAt = null;
let gameStarted = false;
let currentLevel = 1;
let gameEnded = false;
let deliveryInProgress = false;

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const deliveryProgress = document.getElementById("deliveryProgress");
const waterDisplay = document.getElementById("water");
const scoreDisplay = document.getElementById("score");
const startButton = document.getElementById("startButton");
const level2Button = document.getElementById("level2Button");
const familiesDisplay = document.getElementById("families");
const timerDisplay = document.getElementById("timer");
const messageDisplay = document.getElementById("message");
const playAgainButton = document.getElementById("playAgainButton");
const deliveryMessage = document.getElementById("deliveryMessage");
const neighborhoodMap = document.getElementById("neighborhoodMap");
const mapMessage = document.getElementById("mapMessage");
const mapDeliveries = document.getElementById("mapDeliveries");
const mapTruck = neighborhoodMap?.querySelector(".map-truck");
const houses = neighborhoodMap
  ? neighborhoodMap.querySelectorAll(".map-house")
  : [];
const moveButtons = {
  up: document.getElementById("moveUp"),
  down: document.getElementById("moveDown"),
  left: document.getElementById("moveLeft"),
  right: document.getElementById("moveRight")
};

const roadColumns = [8, 37, 50, 70, 92];
const roadRows = [18, 40, 64, 82];
const startPosition = { left: 50, top: 40 };
let truckPosition = { ...startPosition };
let selectedHouse = null;

const getLevel = () => levels[currentLevel - 1];
const getGoal = () => Math.min(getLevel().goal, houses.length);

function setMoveButtonsDisabled(disabled) {
  Object.values(moveButtons).forEach((button) => {
    if (button) {
      button.disabled = disabled;
    }
  });
}

function updateDisplay() {
  waterDisplay.textContent = water.toFixed(1).replace(/\.0$/, "");
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;

  const goal = getGoal() || 1;
  const percent = Math.min(100, Math.round((families / goal) * 100));
  progressText.textContent = percent + "%";
  progressFill.style.width = percent + "%";
  deliveryProgress.setAttribute("aria-valuenow", families);
  deliveryProgress.setAttribute("aria-valuemax", goal);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
  timerDisplay.classList.toggle("time-warning", timeRemaining <= 10);

  const tankWater = document.querySelector(".tank-water");
  if (tankWater) {
    const percentFull = (water / getLevel().water) * 100;
    tankWater.style.height = `${Math.min(100, Math.max(0, percentFull))}%`;
  }
}

/* ---------- Timers ---------- */

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
    if (!gameStarted || gameEnded) {
      stopTimer();
      return;
    }

    timeRemaining = Math.max(0, timeRemaining - 1);
    updateDisplay();

    if (timeRemaining <= 0) {
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
  mapTruck?.classList.remove("spilling");
}

function startSpillTimer() {
  if (spillInterval !== null || gameEnded || !gameStarted) {
    return;
  }

  tripStartedAt = Date.now();

  spillInterval = window.setInterval(() => {
    if (!gameStarted || gameEnded || deliveryInProgress) {
      stopSpillTimer();
      return;
    }

    if (Date.now() - tripStartedAt < spillTimeLimit) {
      return;
    }

    water = Math.max(0, water - 1);
    score = Math.max(0, score - 5);
    tripStartedAt = Date.now();

    updateDisplay();
    mapMessage.textContent = "💦 Water spilled! -1 water and -5 points!";
    mapTruck?.classList.add("spilling");

    if (water <= 0) {
      endGame(false, "Out of Water! Mission Failed.");
    }
  }, spillTick);
}

/* ---------- End of game ---------- */

function endGame(completed, text) {
  gameEnded = true;
  gameStarted = false;
  deliveryInProgress = false;

  stopTimer();
  stopSpillTimer();

  startButton.textContent = completed ? "🎉 PLAY AGAIN" : "💧 TRY AGAIN";
  startButton.disabled = false;

  if (playAgainButton) {
    playAgainButton.hidden = false;
  }

  houses.forEach((house) => {
    house.disabled = true;
  });
  setMoveButtonsDisabled(true);

  if (completed) {
    if (currentLevel === 1 && level2Button) {
      level2Button.hidden = false;
      level2Button.style.display = "inline-block";
      level2Button.disabled = false;
      level2Button.textContent = "🌎 START LEVEL 2";
    }

    deliveryMessage.textContent = `🎉 Level ${currentLevel} complete! Final score: ${score}.`;
    deliveryMessage.classList.add("success");
    messageDisplay.textContent = "Mission Complete! All families helped! 🏆";
    mapMessage.textContent =
      "🎉 Mission Complete! You delivered water to all the families!";
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

/* ---------- Map ---------- */

function setTruckFacing(direction) {
  const angles = { up: -90, right: 0, down: 90, left: 180 };
  mapTruck?.style.setProperty("--truck-angle", `${angles[direction]}deg`);
}

function refreshMap() {
  const served = neighborhoodMap
    ? neighborhoodMap.querySelectorAll(".map-house.served").length
    : 0;

  if (mapDeliveries) {
    mapDeliveries.textContent = `${served} houses served`;
  }
}

function resetMap() {
  stopSpillTimer();

  truckPosition = { ...startPosition };
  setTruckFacing("right");
  selectedHouse = null;
  deliveryInProgress = false;

  houses.forEach((house, index) => {
    house.disabled = false;
    house.classList.remove("served", "selected");
    house.innerHTML = `🏠<span>House ${index + 1}</span>`;
    house.setAttribute("aria-label", `House ${index + 1}`);
  });

  if (mapMessage) {
    mapMessage.textContent = "Press START, then drive the truck! 🚚";
  }

  if (mapTruck) {
    mapTruck.style.left = `${truckPosition.left}%`;
    mapTruck.style.top = `${truckPosition.top}%`;
    mapTruck.classList.remove("delivering");
  }

  setMoveButtonsDisabled(false);
  refreshMap();
}

function isTruckAtHouse(house) {
  return (
    truckPosition.left === parseFloat(house.style.left) &&
    truckPosition.top === parseFloat(house.style.top)
  );
}

async function deliverAtHouse(house) {
  if (
    gameEnded ||
    deliveryInProgress ||
    house.classList.contains("served") ||
    !isTruckAtHouse(house)
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
  house.disabled = true;

  const drop = document.createElement("span");
  drop.className = "delivery-drop";
  drop.setAttribute("aria-hidden", "true");
  drop.textContent = "💧";
  house.appendChild(drop);

  water = Math.max(0, water - 1);
  score += 10;
  families += 1;

  updateDisplay();
  refreshMap();

  mapMessage.textContent = "💧 Water delivered! +10 points.";
  deliveryMessage.textContent = "Keep going! Every drop helps a family. 💧";
  deliveryMessage.classList.remove("success");

  mapTruck?.classList.add("delivering");
  await wait(deliveryAnimationDuration);
  mapTruck?.classList.remove("delivering");

  // The game may have ended (time ran out) during the animation.
  if (gameEnded) {
    return;
  }

  if (families >= getGoal()) {
    endGame(true);
  } else if (water < 1) {
    endGame(false, "Out of Water! Mission Failed.");
  } else {
    deliveryInProgress = false;
    selectedHouse = null;
    startSpillTimer();
  }
}

async function moveTruck(direction) {
  if (!gameStarted || gameEnded || deliveryInProgress) {
    if (!gameStarted && !gameEnded) {
      mapMessage.textContent = "Press START first! ▶";
    }
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

  const reachedHouse = [...houses].find(
    (house) => !house.classList.contains("served") && isTruckAtHouse(house)
  );

  if (reachedHouse) {
    await deliverAtHouse(reachedHouse);
  } else {
    startSpillTimer();
  }
}

/* ---------- Events ---------- */

houses.forEach((house) => {
  house.addEventListener("click", () => {
    if (house.disabled || deliveryInProgress || gameEnded) {
      return;
    }
    mapMessage.textContent = "🚚 Use the arrows to drive to a house!";
  });
});

Object.entries(moveButtons).forEach(([direction, button]) => {
  if (!button) {
    console.error(`Missing movement button: ${direction}`);
    return;
  }
  button.addEventListener("click", () => moveTruck(direction));
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

/* ---------- Starting levels ---------- */

function startLevel(level) {
  currentLevel = level;
  const { water: startWater, time } = getLevel();

  stopTimer();
  stopSpillTimer();

  water = startWater;
  score = 0;
  families = 0;
  timeRemaining = time;

  gameEnded = false;
  gameStarted = true;
  deliveryInProgress = false;
  selectedHouse = null;

  resetMap();

  if (level2Button) {
    level2Button.hidden = true;
    level2Button.style.display = "none";
  }
  if (playAgainButton) {
    playAgainButton.hidden = true;
  }

  startButton.disabled = true;
  startButton.textContent =
    level === 1 ? "🚚 GAME RUNNING" : "🚚 LEVEL 2 RUNNING";

  deliveryMessage.classList.remove("success");
  deliveryMessage.textContent = "Deliver water to the families! 💧";
  messageDisplay.textContent =
    level === 1
      ? "Game started! 🚚"
      : `Level 2: Help ${getGoal()} families in ${time} seconds! 💧`;
  mapMessage.textContent = "Use the arrow buttons to drive to each house.";

  updateDisplay();
  startTimer();
}

startButton.addEventListener("click", () => {
  if (gameStarted && !gameEnded) {
    return;
  }
  startLevel(1);
});

level2Button?.addEventListener("click", () => startLevel(2));

playAgainButton?.addEventListener("click", () => startLevel(currentLevel));

/* ---------- Initial state ---------- */

gameEnded = false;
gameStarted = false;
deliveryInProgress = false;

resetMap();
if (level2Button) {
  level2Button.hidden = true;
  level2Button.style.display = "none";
}
if (playAgainButton) {
  playAgainButton.hidden = true;
}
updateDisplay();

messageDisplay.textContent = "Ready to make a difference? 💧";
deliveryMessage.textContent = "Keep going! Every drop helps a family. 💧";
deliveryMessage.classList.remove("success");

startButton.disabled = false;
startButton.textContent = "▶ START GAME";