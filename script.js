/* Water Delivery Heroes - Game Logic */

const totalWater = 10;
let water = totalWater;
let score = 0;
let families = 0;

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const deliveryProgress = document.getElementById("deliveryProgress");
const waterDisplay = document.getElementById("water");
const scoreDisplay = document.getElementById("score");
const familiesDisplay = document.getElementById("families");
const messageDisplay = document.getElementById("message");
const deliverButton = document.getElementById("deliverButton");
const deliveryTruck = document.getElementById("deliveryTruck");
const truckMessage = document.getElementById("truckMessage");
const playAgainButton = document.getElementById("playAgainButton");
const deliveryMessage = document.getElementById("deliveryMessage");

function updateDisplay() {
  waterDisplay.textContent = water;
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;

  const delivered = 10 - water;
  const percent = delivered * 10;

  progressText.textContent = percent + "%";
  progressFill.style.width = percent + "%";
  deliveryProgress.setAttribute("aria-valuenow", delivered); 
}

deliverButton.addEventListener("click", function () {
  if (water <= 0) return;
  if (water === 0) {
  deliveryMessage.textContent =
    "🎉 Mission Complete! You helped 10 families get water! 💧";
  deliveryMessage.classList.add("success");
} else {
  deliveryMessage.textContent =
    "🚚 Great delivery! Every drop helps a family. 💙";
  deliveryMessage.classList.remove("success");
}
  // Animate the delivery truck
  deliveryTruck.classList.remove("driving");

  // Restart animation for each delivery
  void deliveryTruck.offsetWidth;

  deliveryTruck.classList.add("driving");
  truckMessage.textContent =
    "🚚 Delivering clean water to a family!";

  water--;
  score += 10;
  families++;

  deliveryMessage.textContent =
  "Keep going! Every drop helps a family. 💧";
deliveryMessage.classList.remove("success");

  updateDisplay();

  if (water === 0) {
    messageDisplay.textContent =
      "All water delivered! You are a hero! 🏆";

    deliverButton.textContent = "Mission Complete! 🎉";
    deliverButton.disabled = true;
    playAgainButton.hidden = false;
  } else {
    messageDisplay.textContent =
      "Great job! Another family has clean water! 💧";
  }
});

playAgainButton.addEventListener("click", function () {
  water = totalWater;
  score = 0;
  families = 0;

  updateDisplay();

  messageDisplay.textContent = "Ready to make a difference? 💧";
  deliverButton.textContent = "Deliver Water";
  deliverButton.disabled = false;
  playAgainButton.hidden = true;
});