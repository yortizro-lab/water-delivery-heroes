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
const neighborhoodMap = document.getElementById("neighborhoodMap");

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

  deliveryMessage.textContent = "Keep going! Every drop helps a family. 💧";
  deliveryMessage.classList.remove("success");

  updateDisplay();

  if (water === 0) {
    deliveryMessage.textContent =
      "🎉 Mission Complete! You helped 10 families get water! 💧";
    deliveryMessage.classList.add("success");
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
  if (neighborhoodMap) {
    resetMap();
  }

  messageDisplay.textContent = "Ready to make a difference? 💧";
  deliverButton.textContent = "Deliver Water";
  deliverButton.disabled = false;
  playAgainButton.hidden = true;
});

if (neighborhoodMap) {
  const houses = neighborhoodMap.querySelectorAll(".map-house");
  const mapDeliveries = document.getElementById("mapDeliveries");
  const mapMessage = document.getElementById("mapMessage");
  const mapTruck = neighborhoodMap.querySelector(".map-truck");

  function refreshMap() {
    const served = neighborhoodMap.querySelectorAll(
      ".map-house.served"
    ).length;

    mapDeliveries.textContent = `${served} of 10 houses served`;

    if (served === 10) {
      mapMessage.textContent =
        "🎉 Mission complete! You delivered water to all 10 houses!";
    }
  }

  function resetMap() {
    houses.forEach((house, index) => {
      house.disabled = false;
      house.classList.remove("served");
      house.innerHTML = `🏠<span>House ${index + 1}</span>`;
      house.setAttribute(
        "aria-label",
        `Deliver water to house ${index + 1}`
      );
    });

    mapDeliveries.textContent = "0 of 10 houses served";
    mapMessage.textContent = "Tap a house to deliver water!";
    mapTruck.style.left = "1%";
    mapTruck.style.top = "39%";
  }

  houses.forEach((house) => {
    house.addEventListener("click", () => {
      if (house.disabled) {
        return;
      }

      if (water <= 0) {
        mapMessage.textContent =
          "💧 No water left! Start a new mission to play again.";
        return;
      }

      water -= 1;
      score += 10;
      families += 1;

      house.classList.add("served");
      house.textContent = "✅";
      house.disabled = true;
      house.setAttribute("aria-label", "House served");

      updateDisplay();
      refreshMap();

      if (water > 0 && families < 10) {
        mapMessage.textContent =
          "🚚 Delivery successful! Choose another house.";
      }

      const rect = house.getBoundingClientRect();
      const sceneRect = neighborhoodMap
        .querySelector(".map-scene")
        .getBoundingClientRect();

      mapTruck.style.left =
        Math.max(0, Math.min(82,
          ((rect.left - sceneRect.left) / sceneRect.width) * 100
        )) + "%";
      mapTruck.style.top =
        Math.max(0, Math.min(86,
          ((rect.top - sceneRect.top) / sceneRect.height) * 100
        )) + "%";
    });
  });

  refreshMap();
}
