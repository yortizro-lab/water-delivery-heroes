/* Water Delivery Heroes - Game Logic */

// Level settings (array of objects). "houses" lists which houses appear.
const levels = [
  { water: 12, time: 30, houses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], hospital: false },
  { water: 9, time: 25, houses: [0, 2, 4, 6, 8], hospital: true }
];

// Difficulty modes change water, time and how fast water spills.
const difficulties = {
  easy: { water: 2, time: 10, spill: 2500 },
  normal: { water: 0, time: 0, spill: 1500 },
  hard: { water: -2, time: -8, spill: 1000 }
};

// Milestone messages shown when the score reaches each value.
const milestones = [
  { score: 30, text: "🌱 Great start! 3 deliveries worth of hope!" },
  { score: 50, text: "💪 Halfway hero! Keep the water flowing!" },
  { score: 70, text: "🌟 Amazing! Almost every family has clean water!" },
  { score: 100, text: "🏆 Perfect score! You are a Water Delivery Hero!" }
];
const reachedMilestones = [];

const hospitalCost = 2;
const hospitalPoints = 20;
const deliveryAnimationDuration = 800;
const spillTick = 250;

let water = levels[0].water;
let score = 0;
let families = 0;
let timeRemaining = levels[0].time;
let timerInterval = null;
let spillInterval = null;
let tripStartedAt = null;
let difficulty = "normal";
let gameStarted = false;
let currentLevel = 1;
let level2Unlocked = false;
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
  ? neighborhoodMap.querySelectorAll(".map-house:not(.map-hospital)")
  : [];
const hospital = neighborhoodMap?.querySelector(".map-hospital") ?? null;
const allStops = hospital ? [...houses, hospital] : [...houses];
const difficultySelect = document.getElementById("difficulty");
const milestoneDisplay = document.getElementById("milestone");
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

const getLevel = () => {
  const base = levels[currentLevel - 1];
  const mode = difficulties[difficulty];
  return {
    ...base,
    water: Math.max(1, base.water + mode.water),
    time: Math.max(10, base.time + mode.time)
  };
};

// Simple sound effects made with the Web Audio API (no files needed).
let audioContext = null;
function playTone(notes) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([frequency, start, length, type]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type || "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, audioContext.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + start + length);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(audioContext.currentTime + start);
      osc.stop(audioContext.currentTime + start + length);
    });
  } catch (error) {
    // Sound is optional; ignore audio errors.
  }
}
const sounds = {
  deliver: () => playTone([[660, 0, 0.12], [880, 0.12, 0.18]]),
  spill: () => playTone([[220, 0, 0.25, "sawtooth"]]),
  win: () => playTone([[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.3]]),
  lose: () => playTone([[392, 0, 0.2, "square"], [294, 0.2, 0.2, "square"], [196, 0.4, 0.35, "square"]])
};

function checkMilestones() {
  milestones.forEach((milestone) => {
    if (score >= milestone.score && !reachedMilestones.includes(milestone.score)) {
      reachedMilestones.push(milestone.score);
      if (milestoneDisplay) {
        milestoneDisplay.textContent = milestone.text;
      }
    }
  });
}
const getGoal = () => getLevel().houses.length + (getLevel().hospital ? 1 : 0);
const getActiveStops = () => allStops.filter((stop) => !stop.hidden);

function setStopVisible(stop, visible) {
  stop.hidden = !visible;
  stop.style.display = visible ? "" : "none";
}

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

    if (Date.now() - tripStartedAt < difficulties[difficulty].spill) {
      return;
    }

    water = Math.max(0, water - 1);
    score = Math.max(0, score - 5);
    tripStartedAt = Date.now();

    updateDisplay();
    mapMessage.textContent = "💦 Water spilled! -1 water and -5 points!";
    mapTruck?.classList.add("spilling");
    sounds.spill();

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

  allStops.forEach((stop) => {
    stop.disabled = true;
  });
  setMoveButtonsDisabled(true);
  if (difficultySelect) {
    difficultySelect.disabled = false;
  }
  if (completed) {
    sounds.win();
  } else {
    sounds.lose();
  }

  if (completed) {
    if (currentLevel === 1 && level2Button) {
      level2Unlocked = true;
      level2Button.hidden = false;
      level2Button.style.display = "inline-block";
      level2Button.disabled = false;
      level2Button.textContent = "🌎 START LEVEL 2";
    }

    deliveryMessage.textContent = `🎉 Level ${currentLevel} complete! Final score: ${score}.`;
    deliveryMessage.classList.add("success");
    messageDisplay.textContent = "Mission Complete! All families helped! 🏆";
    mapMessage.textContent =
      "🎉 Mission Complete! You delivered water to everyone!";
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
    mapDeliveries.textContent = `${served} of ${getGoal()} stops served`;
  }
}

function resetMap() {
  stopSpillTimer();

  truckPosition = { ...startPosition };
  setTruckFacing("right");
  selectedHouse = null;
  deliveryInProgress = false;

  let shown = 0;
  houses.forEach((house, index) => {
    const visible = getLevel().houses.includes(index);
    setStopVisible(house, visible);
    house.disabled = false;
    house.classList.remove("served", "selected");
    if (visible) {
      shown += 1;
      house.innerHTML = `🏠<span>House ${shown}</span>`;
      house.setAttribute("aria-label", `House ${shown}`);
    }
  });

  if (hospital) {
    setStopVisible(hospital, getLevel().hospital);
    hospital.disabled = false;
    hospital.classList.remove("served", "selected");
    hospital.innerHTML = `🏥<span>Hospital</span>`;
  }

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

function isTruckAtHouse(stop) {
  return (
    truckPosition.left === parseFloat(stop.style.left) &&
    truckPosition.top === parseFloat(stop.style.top)
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

  const isHospital = house === hospital;
  const cost = isHospital ? hospitalCost : 1;
  const points = isHospital ? hospitalPoints : 10;

  if (water < cost) {
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

  water = Math.max(0, water - cost);
  score += points;
  families += 1;

  updateDisplay();
  refreshMap();
  sounds.deliver();
  checkMilestones();

  mapMessage.textContent = isHospital
    ? "🏥 Hospital supplied! +20 points."
    : "💧 Water delivered! +10 points.";
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

  const reachedHouse = getActiveStops().find(
    (stop) => !stop.classList.contains("served") && isTruckAtHouse(stop)
  );

  if (reachedHouse) {
    await deliverAtHouse(reachedHouse);
  } else {
    startSpillTimer();
  }
}

/* ---------- Events ---------- */

allStops.forEach((stop) => {
  stop.addEventListener("click", () => {
    if (stop.disabled || deliveryInProgress || gameEnded) {
      return;
    }
    mapMessage.textContent = "🚚 Use the arrows to drive to a stop!";
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
  if (level === 2 && !level2Unlocked) {
    mapMessage.textContent = "Finish Level 1 first to unlock Level 2! 🔒";
    return;
  }
  currentLevel = level;
  neighborhoodMap?.classList.toggle("level-2", level === 2);
  const mapTitle = document.getElementById("mapTitle");
  if (mapTitle) {
    mapTitle.textContent = level === 2 ? "🏥 Town Map" : "🏘️ Neighborhood Map";
  }
  if (difficultySelect) {
    difficulty = difficultySelect.value;
    difficultySelect.disabled = true;
  }
  const { water: startWater, time } = getLevel();
  reachedMilestones.length = 0;
  if (milestoneDisplay) {
    milestoneDisplay.textContent = "";
  }

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
      : `Level 2: Help 5 houses and the hospital in ${time} seconds! 🏥`;
  mapMessage.textContent = "Use the arrow buttons to drive to each stop.";

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

difficultySelect?.addEventListener("change", () => {
  if (gameStarted && !gameEnded) {
    return;
  }
  difficulty = difficultySelect.value;
  water = getLevel().water;
  timeRemaining = getLevel().time;
  updateDisplay();
});

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
water = getLevel().water;
timeRemaining = getLevel().time;
updateDisplay();

messageDisplay.textContent = "Ready to make a difference? 💧";
deliveryMessage.textContent = "Keep going! Every drop helps a family. 💧";
deliveryMessage.classList.remove("success");

startButton.disabled = false;
startButton.textContent = "▶ START GAME";
