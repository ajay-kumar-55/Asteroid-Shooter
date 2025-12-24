// ========== GET HTML ELEMENTS ==========
const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const pauseMenuEl = document.getElementById("pauseMenu");
const pauseBtnEl = document.getElementById("pauseBtn");
const startScreen = document.getElementById("startScreen");
const playButton = document.getElementById("playButton");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const scoresButton = document.getElementById("scoresButton");
const highScoresWindow = document.getElementById("highScoresWindow");
const closeScoresBtn = document.getElementById("closeScoresBtn");
const scoresList = document.getElementById("scoresList");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const highScoreValue = document.getElementById("highScoreValue");
const achievementPopup = document.getElementById("achievementPopup");
const playerNamePopup = document.getElementById("playerNamePopup");
const playerNameInput = document.getElementById("playerNameInput");
const startGameBtn = document.getElementById("startGameBtn");
const nameError = document.getElementById("nameError");
const achievementText = document.getElementById("achievementText");

// Mobile controls elements
const mobileControls = document.getElementById("mobileControls");
const arrowUp = document.getElementById("arrowUp");
const arrowDown = document.getElementById("arrowDown");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");
const shootButton = document.getElementById("shootButton");

// ========== GAME DIMENSIONS ==========
// Calculate game dimensions - swap width/height if portrait on mobile
let gameWidth, gameHeight;

// Check if mobile device in portrait mode
const isMobilePortrait =
  window.innerWidth < 768 && window.innerHeight > window.innerWidth;

if (isMobilePortrait) {
  // Swap dimensions for forced landscape
  gameWidth = window.innerHeight;
  gameHeight = window.innerWidth;
} else {
  // Normal landscape or desktop
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
}

// ========== PLAYER VARIABLES ==========
let playerX = gameWidth / 2; // Player X position (center)
let playerY = gameHeight - 100; // Player Y position (near bottom)
const playerSpeed = 7; // Movement speed
const playerSize = 40; // Size for collision

// ========== GAME STATE ARRAYS ==========
let obstacles = []; // Array to store all asteroids
let lasers = []; // Array to store all laser shots
let stars = []; // Array to store background stars

// ========== GAME STATE FLAGS ==========
let gameRunning = false; // Is game currently running?
let gamePaused = false; // Is game paused?
let score = 0; // Current score
let selectedDifficulty = "easy"; // Selected difficulty level
let playerName = ""; // Current player name

// ========== HIGH SCORES SYSTEM ==========
let highScores = [
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
]; // Array to store top 5 scores with names
let highScoreBeatenThisRun = false; // Track if high score was beaten in current game

// Load high scores from localStorage
function loadHighScores() {
  const saved = localStorage.getItem("spaceShooterHighScores");
  if (saved) {
    try {
      highScores = JSON.parse(saved);
    } catch (e) {
      console.log("Could not load high scores");
    }
  }
}

// Save high scores to localStorage
function saveHighScores() {
  localStorage.setItem("spaceShooterHighScores", JSON.stringify(highScores));
}

// Get the highest score
function getHighScore() {
  return Math.max(...highScores.map((entry) => entry.score));
}

// Update high scores list - only adds unique scores
function updateHighScores(newScore, name) {
  // Check if this exact score already exists
  const scoreExists = highScores.some((entry) => entry.score === newScore);

  // Only add if score doesn't exist
  if (!scoreExists) {
    highScores.push({ score: newScore, name: name });
    highScores.sort((a, b) => b.score - a.score); // Sort descending by score
    highScores = highScores.slice(0, 5); // Keep only top 5
    saveHighScores(); // Save to localStorage
  }
}

// Display high scores in the window
function displayHighScores() {
  scoresList.innerHTML = "";
  highScores.forEach((entry, index) => {
    const scoreEntry = document.createElement("div");
    scoreEntry.className = "score-entry";
    scoreEntry.innerHTML = `<span class="score-rank">#${index + 1}</span>${
      entry.score
    } ${entry.name}`;
    scoresList.appendChild(scoreEntry);
  });
}

// Update high score display during gameplay
function updateHighScoreDisplay() {
  highScoreValue.textContent = getHighScore();
}

// Show achievement popup
function showAchievementPopup() {
  achievementText.textContent = `You're on fire! ${playerName}`;
  achievementPopup.classList.add("show");
  setTimeout(() => {
    achievementPopup.classList.remove("show");
  }, 2500);
}

// ========== KEYBOARD STATE ==========
// Track which keys are currently pressed
const keys = {};

// ========== MOBILE/TABLET DETECTION ==========
// Check if device is touch-enabled (mobile/tablet)
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

// ========== MOBILE ARROW BUTTON STATE ==========
const arrowPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
};

// ========== DIFFICULTY SETTINGS ==========
const difficultySettings = {
  easy: {
    asteroidSpeed: 3, // Asteroid fall speed
    spawnRate: 65, // Frames between asteroid spawns
    asteroidSize: 50, // Asteroid size in pixels
    starSpeedMultiplier: 2, // Star scroll speed multiplier
    name: "EASY",
  },
  medium: {
    asteroidSpeed: 5,
    spawnRate: 30,
    asteroidSize: 45,
    starSpeedMultiplier: 3,
    name: "MEDIUM",
  },
  hard: {
    asteroidSpeed: 7,
    spawnRate: 10,
    asteroidSize: 40,
    starSpeedMultiplier: 4.5,
    name: "HARD",
  },
};

// Get current difficulty settings
let currentSettings = difficultySettings[selectedDifficulty];

// ========== PLAYER POSITIONING ==========
// Update player position on screen
function updatePlayerPosition() {
  player.style.left = playerX - 20 + "px";
  player.style.top = playerY - 20 + "px";
}
updatePlayerPosition();

// ========== STAR CREATION ==========
// Create a single background star
function createStar() {
  const star = document.createElement("div");
  star.className = "star";
  const size = Math.random() * 2 + 1; // Random size 1-3px
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.left = Math.random() * gameWidth + "px";
  const startY = Math.random() * gameHeight - gameHeight;
  star.style.top = startY + "px";
  star.style.opacity = Math.random() * 0.5 + 0.5; // Random opacity
  game.appendChild(star);
  stars.push({
    element: star,
    y: startY,
    baseSpeed: Math.random() * 2 + 1,
  });
}

// Initialize all background stars
function initStars() {
  // Adjust star count based on screen size for performance
  const screenArea = gameWidth * gameHeight;
  const referenceArea = 1920 * 1080; // Full HD reference
  const starCount = Math.floor(900 * (screenArea / referenceArea));
  const finalStarCount = Math.max(50, Math.min(200, starCount)); // Between 50-200 stars

  for (let i = 0; i < finalStarCount; i++) {
    createStar();
  }
  // Spread stars across entire screen
  stars.forEach((star) => {
    star.y = Math.random() * gameHeight;
    star.element.style.top = star.y + "px";
  });
}

// ========== ASTEROID CREATION ==========
// Create a new asteroid obstacle
function createObstacle() {
  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";
  const size = currentSettings.asteroidSize;
  obstacle.style.width = size + "px";
  obstacle.style.height = size + "px";

  // Determine spawn position (top, left, or right)
  const spawnSide = Math.random();
  let x, y, vx, vy; // Position and velocity

  if (spawnSide < 0.7) {
    // 70% chance: Spawn from top
    x = Math.random() * gameWidth;
    y = -size;
    vx = (Math.random() - 0.5) * 2; // Horizontal drift
    vy = currentSettings.asteroidSpeed; // Downward speed
  } else if (spawnSide < 0.85) {
    // 15% chance: Spawn from left
    x = -size;
    y = Math.random() * gameHeight * 0.5;
    vx = currentSettings.asteroidSpeed * 0.7;
    vy = currentSettings.asteroidSpeed * 0.5;
  } else {
    // 15% chance: Spawn from right
    x = gameWidth + size;
    y = Math.random() * gameHeight * 0.5;
    vx = -currentSettings.asteroidSpeed * 0.7;
    vy = currentSettings.asteroidSpeed * 0.5;
  }

  // Set initial position and rotation
  obstacle.style.left = x + "px";
  obstacle.style.top = y + "px";
  obstacle.style.transform = "rotate(" + Math.random() * 360 + "deg)";

  game.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    size: size,
  });
}

// ========== LASER SHOOTING ==========
// Fire a laser from player position
function shoot() {
  if (!gameRunning || gamePaused) return; // Can't shoot if not playing

  const laser = document.createElement("div");
  laser.className = "laser";
  laser.style.left = playerX - 4 + "px"; // Center on player
  laser.style.top = playerY - 30 + "px"; // Above player

  game.appendChild(laser);
  lasers.push({ element: laser, x: playerX, y: playerY - 30 });
}

// ========== EXPLOSION EFFECT ==========
// Create explosion animation at position
function createExplosion(x, y) {
  const explosion = document.createElement("div");
  explosion.className = "explosion";
  explosion.style.left = x - 8 + "px";
  explosion.style.top = y - 8 + "px";
  game.appendChild(explosion);

  // Remove explosion after animation completes
  setTimeout(() => explosion.remove(), 400);
}

// ========== FIRE EFFECT ON PLAYER ==========
// Set player ship on fire (when hit)
function setPlayerOnFire() {
  const fireContainer = document.createElement("div");
  fireContainer.className = "fire";
  fireContainer.id = "playerFire";

  // Create 3 flame elements
  for (let i = 0; i < 3; i++) {
    const flame = document.createElement("div");
    flame.className = "flame";
    fireContainer.appendChild(flame);
  }

  // Create 3 smoke particles
  for (let i = 0; i < 3; i++) {
    const smoke = document.createElement("div");
    smoke.className = "smoke";
    smoke.style.left = Math.random() * 40 - 20 + "px";
    smoke.style.animationDelay = i * 0.3 + "s"; // Stagger animation
    fireContainer.appendChild(smoke);
  }

  player.appendChild(fireContainer);
}

// ========== COLLISION DETECTION ==========
// Check if two circles are colliding
function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2; // True if overlapping
}

// Check all collisions in game
function checkCollisions() {
  // Check player vs asteroids
  obstacles.forEach((obs) => {
    if (
      checkCircleCollision(
        playerX,
        playerY,
        20,
        obs.x + obs.size / 2,
        obs.y + obs.size / 2,
        obs.size / 2
      )
    ) {
      // GAME OVER!
      createExplosion(playerX, playerY); // Explosion effect
      game.classList.add("shake"); // Shake screen
      setTimeout(() => game.classList.remove("shake"), 500);
      setPlayerOnFire(); // Set ship on fire

      gameRunning = false;

      // Update high scores
      updateHighScores(score, playerName);
      updateHighScoreDisplay();

      finalScoreEl.textContent = score;
      gameOverEl.style.display = "block";
    }
  });

  // Check lasers vs asteroids
  lasers.forEach((laser, lIndex) => {
    obstacles.forEach((obs, oIndex) => {
      if (
        checkCircleCollision(
          laser.x,
          laser.y,
          5,
          obs.x + obs.size / 2,
          obs.y + obs.size / 2,
          obs.size / 2
        )
      ) {
        // HIT! Destroy asteroid
        createExplosion(obs.x + obs.size / 2, obs.y + obs.size / 2);
        laser.element.remove();
        lasers.splice(lIndex, 1);
        obs.element.remove();
        obstacles.splice(oIndex, 1);
        score += 10; // Award points
        scoreEl.textContent = "Score: " + score;

        // Check if high score beaten for first time this run
        // Only show popup if previous high score was greater than 0 (not first game)
        if (
          !highScoreBeatenThisRun &&
          score > getHighScore() &&
          getHighScore() > 0
        ) {
          highScoreBeatenThisRun = true;
          showAchievementPopup();
        }

        // Update high score display if current score is higher
        if (score > getHighScore()) {
          highScoreValue.textContent = score;
        }
      }
    });
  });
}

// ========== DIFFICULTY SELECTION ==========
difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    difficultyButtons.forEach((b) => b.classList.remove("selected"));
    this.classList.add("selected");
    selectedDifficulty = this.getAttribute("data-difficulty");
  });
});

// ========== FULLSCREEN FUNCTION ==========
function requestFullscreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch((err) => {
      console.log("Fullscreen request failed:", err);
    });
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

// ========== GAME START ==========
function startGame() {
  currentSettings = difficultySettings[selectedDifficulty];
  startScreen.style.display = "none";

  // Request fullscreen on mobile
  if (isTouchDevice) {
    requestFullscreen();
    mobileControls.style.display = "block";
  }

  highScoreBeatenThisRun = false; // Reset flag for new game
  updateHighScoreDisplay(); // Reset high score display to actual high score
  gameRunning = true;
  update(); // Start game loop
}

playButton.addEventListener("click", () => {
  // Always ask for name on every game load (treat as new user)
  if (!playerName) {
    playerNamePopup.style.display = "block";
    playerNameInput.value = "";
    nameError.textContent = "";
    playerNameInput.focus();
  } else {
    // Name already set in this session, start game directly
    startGame();
  }
});

// Validate and start game when name is entered
startGameBtn.addEventListener("click", () => {
  const inputName = playerNameInput.value.trim();

  // Check if name is empty
  if (!inputName) {
    nameError.textContent = "Please enter your name!";
    return;
  }

  // Check if name contains only letters
  if (!/^[a-zA-Z]+$/.test(inputName)) {
    nameError.textContent = "Only letters allowed!";
    return;
  }

  // Valid name, save for this session only (not in localStorage)
  playerName = inputName.toUpperCase();
  playerNamePopup.style.display = "none";
  startGame();
});

// Allow Enter key to submit name
playerNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startGameBtn.click();
  }
});

// Clear error when user types
playerNameInput.addEventListener("input", () => {
  nameError.textContent = "";
});

// ========== HIGH SCORES WINDOW ==========
scoresButton.addEventListener("click", () => {
  displayHighScores();
  highScoresWindow.style.display = "block";
});

closeScoresBtn.addEventListener("click", () => {
  highScoresWindow.style.display = "none";
});

// ========== GAME RESTART ==========
function restartGame() {
  // Reset player position
  playerX = gameWidth / 2;
  playerY = gameHeight - 100;
  score = 0;
  gameRunning = false;
  gamePaused = false;
  frameCount = 0;

  // Clear all game objects
  obstacles.forEach((obs) => obs.element.remove());
  obstacles = [];
  lasers.forEach((laser) => laser.element.remove());
  lasers = [];

  // Remove fire from player
  const playerFire = document.getElementById("playerFire");
  if (playerFire) {
    playerFire.remove();
  }

  // Hide mobile controls
  mobileControls.style.display = "none";

  // Reset high score display to actual high score
  updateHighScoreDisplay();

  // Reset UI
  updatePlayerPosition();
  scoreEl.textContent = "Score: 0";
  gameOverEl.style.display = "none";
  startScreen.style.display = "flex";
  pauseBtnEl.textContent = "⏸ PAUSE";
}

restartButton.addEventListener("click", restartGame);

// ========== PAUSE FUNCTIONALITY ==========
function togglePause() {
  if (!gameRunning) return; // Can't pause if game over

  gamePaused = !gamePaused;

  if (gamePaused) {
    pauseMenuEl.style.display = "block";
    pauseBtnEl.textContent = "RESUME";
  } else {
    pauseMenuEl.style.display = "none";
    pauseBtnEl.textContent = "PAUSE";
    update(); // Resume game loop
  }
}

// ========== KEYBOARD CONTROLS ==========
document.addEventListener("keydown", (e) => {
  // Pause with P key
  if (e.key === "p" || e.key === "P") {
    togglePause();
    return;
  }

  // Shoot with spacebar
  if (e.key === " ") {
    e.preventDefault();
    shoot();
    return;
  }

  keys[e.key] = true; // Mark key as pressed
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false; // Mark key as released
});

pauseBtnEl.addEventListener("click", togglePause);

// Resume button in pause menu
document.getElementById("resumeBtn").addEventListener("click", togglePause);

// Restart button in pause menu - resets game but keeps playing
document.getElementById("restartFromPause").addEventListener("click", () => {
  // Reset score and player position
  score = 0;
  scoreEl.textContent = "Score: 0";
  playerX = gameWidth / 2;
  playerY = gameHeight - 100;
  updatePlayerPosition();

  // Clear all game objects
  obstacles.forEach((obs) => obs.element.remove());
  obstacles = [];
  lasers.forEach((laser) => laser.element.remove());
  lasers = [];

  // Remove fire from player if any
  const playerFire = document.getElementById("playerFire");
  if (playerFire) {
    playerFire.remove();
  }

  frameCount = 0;
  highScoreBeatenThisRun = false; // Reset flag for new game run

  // Reset high score display to actual high score
  updateHighScoreDisplay();

  // Resume game
  togglePause();
});

// Main menu button in pause menu
document.getElementById("mainMenuBtn").addEventListener("click", () => {
  pauseMenuEl.style.display = "none";
  gamePaused = false;

  // Reset high score display to actual high score before going to menu
  updateHighScoreDisplay();

  restartGame();
});

// ========== MOBILE ARROW BUTTON CONTROLS ==========
// Arrow Up
arrowUp.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.up = true;
});
arrowUp.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.up = false;
});

// Arrow Down
arrowDown.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.down = true;
});
arrowDown.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.down = false;
});

// Arrow Left
arrowLeft.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.left = true;
});
arrowLeft.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.left = false;
});

// Arrow Right
arrowRight.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.right = true;
});
arrowRight.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.right = false;
});

// ========== MOBILE SHOOT BUTTON ==========
shootButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  shoot();
});

// ========== MAIN GAME LOOP ==========
let frameCount = 0; // Frame counter for timing

function update() {
  if (!gameRunning || gamePaused) return; // Stop if not playing

  frameCount++;

  // ========== PLAYER MOVEMENT ==========
  // Keyboard controls (desktop)
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    playerX -= playerSpeed;
  }
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    playerX += playerSpeed;
  }
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
    playerY -= playerSpeed;
  }
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
    playerY += playerSpeed;
  }

  // Arrow button controls (mobile)
  if (arrowPressed.left) {
    playerX -= playerSpeed;
  }
  if (arrowPressed.right) {
    playerX += playerSpeed;
  }
  if (arrowPressed.up) {
    playerY -= playerSpeed;
  }
  if (arrowPressed.down) {
    playerY += playerSpeed;
  }

  // Keep player within screen bounds
  playerX = Math.max(30, Math.min(gameWidth - 30, playerX));
  playerY = Math.max(30, Math.min(gameHeight - 30, playerY));

  updatePlayerPosition();

  // ========== SPAWN ASTEROIDS ==========
  if (frameCount % currentSettings.spawnRate === 0) {
    createObstacle();
  }

  // ========== MOVE STARS ==========
  stars.forEach((star) => {
    star.y += star.baseSpeed * currentSettings.starSpeedMultiplier;
    star.element.style.top = star.y + "px";

    // Respawn star at top when it goes off screen
    if (star.y > gameHeight + 10) {
      star.y = -10;
      star.element.style.left = Math.random() * gameWidth + "px";
    }
  });

  // ========== MOVE ASTEROIDS ==========
  obstacles.forEach((obs, index) => {
    obs.x += obs.vx; // Move horizontally
    obs.y += obs.vy; // Move vertically
    obs.element.style.left = obs.x + "px";
    obs.element.style.top = obs.y + "px";

    // Remove asteroid if off screen (no points for dodge)
    if (obs.y > gameHeight + 100 || obs.x < -100 || obs.x > gameWidth + 100) {
      obs.element.remove();
      obstacles.splice(index, 1);
    }
  });

  // ========== MOVE LASERS ==========
  lasers.forEach((laser, index) => {
    laser.y -= 15; // Move upward
    laser.element.style.top = laser.y + "px";

    // Remove laser if off screen
    if (laser.y < -20) {
      laser.element.remove();
      lasers.splice(index, 1);
    }
  });

  // ========== CHECK COLLISIONS ==========
  checkCollisions();

  // Continue game loop
  requestAnimationFrame(update);
}

// ========== INITIALIZE GAME ==========
initStars(); // Create background stars
loadHighScores(); // Load high scores from localStorage
updateHighScoreDisplay(); // Initialize high score display

// ========== HANDLE WINDOW RESIZE ==========
// Recalculate dimensions when window/orientation changes
window.addEventListener("resize", () => {
  const isMobilePortrait =
    window.innerWidth < 768 && window.innerHeight > window.innerWidth;

  if (isMobilePortrait) {
    gameWidth = window.innerHeight;
    gameHeight = window.innerWidth;
  } else {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
  }

  // Keep player within new bounds
  playerX = Math.max(30, Math.min(gameWidth - 30, playerX));
  playerY = Math.max(30, Math.min(gameHeight - 30, playerY));
  updatePlayerPosition();
});
