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

deliverButton.addEventListener("click", function () {
  if (water === 0) {
    return;
  }

  water -= 1;
  score += 10;
  families += 1;

  waterDisplay.textContent = water;
  scoreDisplay.textContent = score;
  familiesDisplay.textContent = families;

  if (water === 0) {
    messageDisplay.textContent =
      `All water delivered! You helped ${families} families! 🏆`;
    deliverButton.textContent = "Mission Complete! 🎉";
    deliverButton.disabled = true;
  } else {
    messageDisplay.textContent =
      "Great job! Another family has clean water! 💧";
  }
});
