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

function updateDisplay() {
  waterDisplay.textContent = water;
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;
}

deliverButton.addEventListener("click", function () {
  if (water <= 0) return;

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
  water = 10;
  score = 0;
  families = 0;

  updateDisplay();

  messageDisplay.textContent = "Ready to make a difference? 💧";
  deliverButton.textContent = "Deliver Water";
  deliverButton.disabled = false;
  playAgainButton.hidden = true;
});