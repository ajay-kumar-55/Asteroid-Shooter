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

const mobileControls = document.getElementById("mobileControls");
const arrowUp = document.getElementById("arrowUp");
const arrowDown = document.getElementById("arrowDown");
const arrowLeft = document.getElementById("arrowLeft");
const arrowRight = document.getElementById("arrowRight");
const shootButton = document.getElementById("shootButton");

let gameWidth, gameHeight;

const isMobilePortrait =
  window.innerWidth < 768 && window.innerHeight > window.innerWidth;

if (isMobilePortrait) {
  gameWidth = window.innerHeight;
  gameHeight = window.innerWidth;
}
else {
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
}

let playerX = gameWidth / 2; 
let playerY = gameHeight - 100; 
const playerSpeed = 7; 
const playerSize = 40; 


let obstacles = []; 
let lasers = []; 
let stars = []; 

let gameRunning = false; 
let gamePaused = false; 
let score = 0; //
let selectedDifficulty = "easy";
let playerName = ""; 

let highScores = [
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
  { score: 0, name: "---" },
]; 
let highScoreBeatenThisRun = false;

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

function saveHighScores() {
  localStorage.setItem("spaceShooterHighScores", JSON.stringify(highScores));
}

function getHighScore() {
  return Math.max(...highScores.map((entry) => entry.score));
}

function updateHighScores(newScore, name) {
  const scoreExists = highScores.some((entry) => entry.score === newScore);

  if (!scoreExists) {
    highScores.push({ score: newScore, name: name });
    highScores.sort((a, b) => b.score - a.score); 
    highScores = highScores.slice(0, 5); 
    saveHighScores(); 
  }
}

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

function updateHighScoreDisplay() {
  highScoreValue.textContent = getHighScore();
}

function showAchievementPopup() {
  achievementText.textContent = `You're on fire! ${playerName}`;
  achievementPopup.classList.add("show");
  setTimeout(() => {
    achievementPopup.classList.remove("show");
  }, 2500);
}


const keys = {};

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const arrowPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const difficultySettings = {
  easy: {
    asteroidSpeed: 3, 
    spawnRate: 65, 
    asteroidSize: 50, 
    starSpeedMultiplier: 2, //
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

let currentSettings = difficultySettings[selectedDifficulty];

function updatePlayerPosition() {
  player.style.left = playerX - 20 + "px";
  player.style.top = playerY - 20 + "px";
}
updatePlayerPosition();

function createStar() {
  const star = document.createElement("div");
  star.className = "star";
  const size = Math.random() * 2 + 1; //
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.left = Math.random() * gameWidth + "px";
  const startY = Math.random() * gameHeight - gameHeight;
  star.style.top = startY + "px";
  star.style.opacity = Math.random() * 0.5 + 0.5; //
  game.appendChild(star);
  stars.push({
    element: star,
    y: startY,
    baseSpeed: Math.random() * 2 + 1,
  });
}

function initStars() {
  const screenArea = gameWidth * gameHeight;
  const referenceArea = 1920 * 1080; //
  const starCount = Math.floor(900 * (screenArea / referenceArea));
  const finalStarCount = Math.max(50, Math.min(200, starCount)); //

  for (let i = 0; i < finalStarCount; i++) {
    createStar();
  }
  stars.forEach((star) => {
    star.y = Math.random() * gameHeight;
    star.element.style.top = star.y + "px";
  });
}

function createObstacle() {
  const obstacle = document.createElement("div");
  obstacle.className = "obstacle";
  const size = currentSettings.asteroidSize;
  obstacle.style.width = size + "px";
  obstacle.style.height = size + "px";

  const spawnSide = Math.random();
  let x, y, vx, vy; //

  if (spawnSide < 0.7) {
    x = Math.random() * gameWidth;
    y = -size;
    vx = (Math.random() - 0.5) * 2; 
    vy = currentSettings.asteroidSpeed; 
  } else if (spawnSide < 0.85) {
    x = -size;
    y = Math.random() * gameHeight * 0.5;
    vx = currentSettings.asteroidSpeed * 0.7;
    vy = currentSettings.asteroidSpeed * 0.5;
  } else {
    x = gameWidth + size;
    y = Math.random() * gameHeight * 0.5;
    vx = -currentSettings.asteroidSpeed * 0.7;
    vy = currentSettings.asteroidSpeed * 0.5;
  }

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


function shoot() {
  if (!gameRunning || gamePaused) return; 

  const laser = document.createElement("div");
  laser.className = "laser";
  laser.style.left = playerX - 4 + "px"; 
  laser.style.top = playerY - 30 + "px"; 

  game.appendChild(laser);
  lasers.push({ element: laser, x: playerX, y: playerY - 30 });
}


function createExplosion(x, y) {
  const explosion = document.createElement("div");
  explosion.className = "explosion";
  explosion.style.left = x - 8 + "px";
  explosion.style.top = y - 8 + "px";
  game.appendChild(explosion);

  setTimeout(() => explosion.remove(), 400);
}


function setPlayerOnFire() {
  const fireContainer = document.createElement("div");
  fireContainer.className = "fire";
  fireContainer.id = "playerFire";

  for (let i = 0; i < 3; i++) {
    const flame = document.createElement("div");
    flame.className = "flame";
    fireContainer.appendChild(flame);
  }

  for (let i = 0; i < 3; i++) {
    const smoke = document.createElement("div");
    smoke.className = "smoke";
    smoke.style.left = Math.random() * 40 - 20 + "px";
    smoke.style.animationDelay = i * 0.3 + "s";
    fireContainer.appendChild(smoke);
  }

  player.appendChild(fireContainer);
}


function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2; 
}

function checkCollisions() {
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
      createExplosion(playerX, playerY); 
      game.classList.add("shake"); 
      setTimeout(() => game.classList.remove("shake"), 500);
      setPlayerOnFire(); 

      gameRunning = false;

      updateHighScores(score, playerName);
      updateHighScoreDisplay();

      finalScoreEl.textContent = score;
      gameOverEl.style.display = "block";
    }
  });

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
        createExplosion(obs.x + obs.size / 2, obs.y + obs.size / 2);
        laser.element.remove();
        lasers.splice(lIndex, 1);
        obs.element.remove();
        obstacles.splice(oIndex, 1);
        score += 10; 
        scoreEl.textContent = "Score: " + score;

    
        if (
          !highScoreBeatenThisRun &&
          score > getHighScore() &&
          getHighScore() > 0
        ){
          highScoreBeatenThisRun = true;
          showAchievementPopup();
        }

        if (score > getHighScore()) {
          highScoreValue.textContent = score;
        }
      }
    });
  });
}

difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    difficultyButtons.forEach((b) => b.classList.remove("selected"));
    this.classList.add("selected");
    selectedDifficulty = this.getAttribute("data-difficulty");
  });
});

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

function startGame() {
  currentSettings = difficultySettings[selectedDifficulty];
  startScreen.style.display = "none";

  if (isTouchDevice) {
    requestFullscreen();
    mobileControls.style.display = "block";
  }

  highScoreBeatenThisRun = false; 
  updateHighScoreDisplay(); 
  gameRunning = true;
  update(); 
}

playButton.addEventListener("click", () => {
  if (!playerName) {
    playerNamePopup.style.display = "block";
    playerNameInput.value = "";
    nameError.textContent = "";
    playerNameInput.focus();
  } else {
    startGame();
  }
});

startGameBtn.addEventListener("click", () => {
  const inputName = playerNameInput.value.trim();

  if (!inputName) {
    nameError.textContent = "Please enter your name!";
    return;
  }

  if (!/^[a-zA-Z]+$/.test(inputName)) {
    nameError.textContent = "Only letters allowed!";
    return;
  }

  playerName = inputName.toUpperCase();
  playerNamePopup.style.display = "none";
  startGame();
});

playerNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    startGameBtn.click();
  }
});

playerNameInput.addEventListener("input", () => {
  nameError.textContent = "";
});

scoresButton.addEventListener("click", () => {
  displayHighScores();
  highScoresWindow.style.display = "block";
});

closeScoresBtn.addEventListener("click", () => {
  highScoresWindow.style.display = "none";
});

function restartGame() {
  playerX = gameWidth / 2;
  playerY = gameHeight - 100;
  score = 0;
  gameRunning = false;
  gamePaused = false;
  frameCount = 0;

  obstacles.forEach((obs) => obs.element.remove());
  obstacles = [];
  lasers.forEach((laser) => laser.element.remove());
  lasers = [];

  const playerFire = document.getElementById("playerFire");
  if (playerFire) {
    playerFire.remove();
  }

  mobileControls.style.display = "none";

  updateHighScoreDisplay();

  updatePlayerPosition();
  scoreEl.textContent = "Score: 0";
  gameOverEl.style.display = "none";
  startScreen.style.display = "flex";
  pauseBtnEl.textContent = "PAUSE";
}

restartButton.addEventListener("click", restartGame);

function togglePause() {
  if (!gameRunning) return; 

  gamePaused = !gamePaused;

  if (gamePaused) {
    pauseMenuEl.style.display = "block";
    pauseBtnEl.textContent = "RESUME";
  } else {
    pauseMenuEl.style.display = "none";
    pauseBtnEl.textContent = "PAUSE";
    update(); 
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    togglePause();
    return;
  }

  if (e.key === " ") {
    e.preventDefault();
    shoot();
    return;
  }

  keys[e.key] = true; 
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false; 
});

pauseBtnEl.addEventListener("click", togglePause);

document.getElementById("resumeBtn").addEventListener("click", togglePause);

document.getElementById("restartFromPause").addEventListener("click", () => {
  score = 0;
  scoreEl.textContent = "Score: 0";
  playerX = gameWidth / 2;
  playerY = gameHeight - 100;
  updatePlayerPosition();

  obstacles.forEach((obs) => obs.element.remove());
  obstacles = [];
  lasers.forEach((laser) => laser.element.remove());
  lasers = [];

  const playerFire = document.getElementById("playerFire");
  if (playerFire) {
    playerFire.remove();
  }

  frameCount = 0;
  highScoreBeatenThisRun = false; 

  updateHighScoreDisplay();

  togglePause();
});

document.getElementById("mainMenuBtn").addEventListener("click", () => {
  pauseMenuEl.style.display = "none";
  gamePaused = false;

  updateHighScoreDisplay();

  restartGame();
});

arrowUp.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.up = true;
});
arrowUp.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.up = false;
});

arrowDown.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.down = true;
});
arrowDown.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.down = false;
});

arrowLeft.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.left = true;
});
arrowLeft.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.left = false;
});

arrowRight.addEventListener("touchstart", (e) => {
  e.preventDefault();
  arrowPressed.right = true;
});
arrowRight.addEventListener("touchend", (e) => {
  e.preventDefault();
  arrowPressed.right = false;
});

shootButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
  shoot();
});

let frameCount = 0;

function update() {
  if (!gameRunning || gamePaused) return; 

  frameCount++;

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

  playerX = Math.max(30, Math.min(gameWidth - 30, playerX));
  playerY = Math.max(30, Math.min(gameHeight - 30, playerY));

  updatePlayerPosition();

  if (frameCount % currentSettings.spawnRate === 0) {
    createObstacle();
  }

  stars.forEach((star) => {
    star.y += star.baseSpeed * currentSettings.starSpeedMultiplier;
    star.element.style.top = star.y + "px";

    if (star.y > gameHeight + 10) {
      star.y = -10;
      star.element.style.left = Math.random() * gameWidth + "px";
    }
  });

  obstacles.forEach((obs, index) => {
    obs.x += obs.vx; 
    obs.y += obs.vy; //
    obs.element.style.left = obs.x + "px";
    obs.element.style.top = obs.y + "px";

    if (obs.y > gameHeight + 100 || obs.x < -100 || obs.x > gameWidth + 100) {
      obs.element.remove();
      obstacles.splice(index, 1);
    }
  });

  lasers.forEach((laser, index) => {
    laser.y -= 15; 
    laser.element.style.top = laser.y + "px";

    if (laser.y < -20) {
      laser.element.remove();
      lasers.splice(index, 1);
    }
  });

  checkCollisions();

  requestAnimationFrame(update);
}

initStars(); 
loadHighScores(); 
updateHighScoreDisplay(); 

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

  playerX = Math.max(30, Math.min(gameWidth - 30, playerX));
  playerY = Math.max(30, Math.min(gameHeight - 30, playerY));
  updatePlayerPosition();
});


