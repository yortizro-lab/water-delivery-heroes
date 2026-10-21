
const waterDisplay = document.getElementById("water");
const scoreDisplay = document.getElementById("score");
const familiesDisplay = document.getElementById("families");
const messageDisplay = document.getElementById("message");
const deliverButton = document.getElementById("deliverButton");

let water = 10;
let score = 0;
let families = 0;

deliverButton.addEventListener("click", function () {
  if (water > 0) {
    // Deliver one unit of water
    water -= 1;

    // Reward the player
    score += 10;
    families += 1;

    // Update the screen
    waterDisplay.textContent = water;
    scoreDisplay.textContent = score;
    familiesDisplay.textContent = families;

    if (water > 0) {
      messageDisplay.textContent =
        "Great job! You helped a family! 💧";
    } else {
      messageDisplay.textContent =
        "All water delivered! You are a hero! 🏆";
      deliverButton.textContent = "Mission Complete!";
      deliverButton.disabled = true;
    }
  }
});