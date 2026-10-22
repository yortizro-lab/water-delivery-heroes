/* Water Delivery Heroes - Game Logic */

const totalWater = 10;
let water = totalWater;
let score = 0;
let families = 0;

const waterDisplay = document.getElementById("water");
const scoreDisplay = document.getElementById("score");
const familiesDisplay = document.getElementById("families");
const messageDisplay = document.getElementById("message");
const deliverButton = document.getElementById("deliverButton");

const deliveryTruck = document.getElementById("deliveryTruck");
const truckMessage = document.getElementById("truckMessage");
const playAgainButton = document.getElementById("playAgainButton");

function updateDisplay() {
  waterDisplay.textContent = water;
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;
}

deliverButton.addEventListener("click", function () {
  if (water <= 0) return;
  
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