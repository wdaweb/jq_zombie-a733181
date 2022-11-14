const canvasEl = $('.canvas');
const ctx = canvasEl[0].getContext('2d');
canvasEl[0].width = 1200;
canvasEl[0].height = 800;

const backgroundImages = [
  { name: 'sky', height: 258, top: 0 },
  {
    name: 'mountain_pack',
    height: 258,
    top: 0,
  },
  { name: 'mountain_mian', height: 258, top: 0 },
  { name: 'street', height: 543, top: 258 },
];
const playerImages = [
  {
    name: 'archer',
    runImage: {
      name: 'archer_run_3',
      width: 550,
      height: 780,
    },
    armsImage: {
      name: 'archer_2',
      width: 108,
      height: 118,
    },
    attackDistance: 200,
  },
  {
    name: 'knight',
    runImage: {
      name: 'knight_run_3',
      width: 520,
      height: 750,
    },
    armsImage: {
      name: 'knight_2',
      width: 107,
      height: 110,
    },
    attackDistance: 150,
  },
  {
    name: 'wizard',
    runImage: {
      name: 'wizard_run_3',
      width: 800,
      height: 720,
    },
    armsImage: {
      name: 'wizard_2',
      width: 151,
      height: 154,
    },
    attackDistance: 100,
  },
];
const obstacleImages = [
  {
    name: 'L1_block_1',
    width: 136,
    height: 81,
    isAttack: false,
  },
  {
    name: 'L1_block_2',
    width: 134,
    height: 63,
    isAttack: true,
  },
  {
    name: 'L2_block_1',
    width: 172,
    height: 104,
    isAttack: false,
  },
  {
    name: 'L2_block_2',
    width: 156,
    height: 83,
    isAttack: true,
  },
  {
    name: 'L3_block_1',
    width: 190,
    height: 80,
    isAttack: true,
  },
  {
    name: 'L3_block_2',
    width: 166,
    height: 80,
    isAttack: true,
  },
];
let backgroundlayer = [];

const obstacleInterval = 400;
const randomObstacleInterval = Math.random() * 400 + 400;
let obstacles = [];
let obstacleTimer = 0;

let lastTime = 0;

const setEndGameTime = 60;
let gameTime = setEndGameTime;
let gameTimer;
let gameOver = false;
const timeImage = new Image();
timeImage.src = './src/img/time/time.png';

let playerIndex = 0;
const playerInfoImage = new Image();
let player;

let inputKey;

let score = 0;
let attacks = [];

const setLife = 3;
let lifes = [];

$('.illustrate-btn').on('click', function () {
  $('.illustrate-container').addClass('none');
});

$('.select-form').on('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  playerIndex = Object.fromEntries(formData).select;

  $('.select-user').addClass('none');
  canvasEl.removeClass('none');
  startGameHandler();
});

$('.restart').on('click', function (e) {
  startGameHandler();
});

$('.back-select').on('click', function () {
  resetGameHandler();
  $('.select-user').removeClass('none');
  canvasEl.addClass('none');
});

class InputKey {
  constructor() {
    this.key = [];

    if (gameTimer !== 0) {
      this.keydown();
      this.keyup();
    }
  }

  keydown() {
    window.addEventListener('keydown', (e) => {
      if (
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'f' ||
          e.key === 'F') &&
        this.key.indexOf(e.key) === -1
      ) {
        this.key.push(e.key);
      }
    });
  }
  keyup() {
    window.addEventListener('keyup', (e) => {
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'f' ||
        e.key === 'F'
      ) {
        this.key.splice(e.key.indexOf(e.key), 1);
      }
    });
  }
}

class Background {
  constructor(image, y, imageHeight, speedMode) {
    this.image = image;
    this.x = 0;
    this.y = y;
    this.width = 1200;
    this.height = imageHeight;
    this.speedMode = speedMode;
  }

  update(detection) {
    if (this.x <= -this.width) {
      this.x = 0;
    }
    this.x = Math.floor(this.x - this.speedMode * detection);
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.x + this.width,
      this.y,
      this.width,
      this.height
    );
  }
}

class Player {
  constructor(imageSrc, imageWidth, imageHeight, attackDistance) {
    this.image = new Image();
    this.image.src = `./src/img/role/${imageSrc}.png`;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.width = this.imageWidth * 0.2;
    this.height = this.imageHeight * 0.2;
    this.x = 0;
    this.maxY = canvasEl.height - this.height - 144;
    this.minY = canvasEl.height - this.height - 480;
    this.y = this.maxY;
    this.frame = 0;
    this.maxFrame = 14;
    this.frameInterval = 30; //ms
    this.frameTimer = 0;
    this.moveY = 0;
    this.moveX = 0;
    this.attackDistance = attackDistance;
  }
  decide(isAttack = false) {
    obstacles.forEach((obstacle) => {
      const dxDistance = isAttack ? this.attackDistance : 20;
      const dx =
        obstacle.x +
        (obstacle.width / 2 - dxDistance) -
        (this.x + this.width / 2);
      const dy =
        obstacle.y + obstacle.height / 2 - (this.y + this.height / 2 + 20);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < obstacle.width / 3 + this.width / 3) {
        if (isAttack && obstacle.isAttack) {
          score++;
          attacks.push(new Attack(obstacle.x, obstacle.y, obstacle.size));
          obstacle.markDelete = true;
        } else if (!isAttack && !obstacle.collision) {
          if (lifes.length !== 0) {
            lifes[lifes.length - 1].markDelete = true;
          } else {
            endGameHandler();
          }
          obstacle.collision = true;
        }
      }
    });
  }

  update(detection, inputKey) {
    this.decide();
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      if (this.frame < this.maxFrame) {
        this.frame++;
      } else {
        this.frame = 0;
      }
    } else {
      this.frameTimer += detection;
    }

    if (inputKey.key.indexOf('ArrowUp') > -1) {
      this.moveY = 5;
    } else if (inputKey.key.indexOf('ArrowDown') > -1) {
      this.moveY = -5;
    } else if (inputKey.key.indexOf('ArrowRight') > -1) {
      this.moveX = -10;
    } else if (inputKey.key.indexOf('ArrowLeft') > -1) {
      this.moveX = 10;
    } else if (
      inputKey.key.indexOf('f') > -1 ||
      inputKey.key.indexOf('F') > -1
    ) {
      this.decide(true);
    } else {
      this.moveY = 0;
      this.moveX = 0;
    }

    this.y -= this.moveY;
    if (this.y < this.minY) {
      this.y = this.minY;
    } else if (this.y > this.maxY) {
      this.y = this.maxY;
    }
    this.x -= this.moveX;
    if (this.x <= 0) {
      this.x = 0;
    } else if (this.x > canvasEl.width - 100) {
      this.x = canvasEl.width - 100;
    }
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.imageWidth,
      0,
      this.imageWidth,
      this.imageHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Obstacle {
  constructor(imageSrc, imageWidth, imageHeight, isAttack) {
    this.image = new Image();
    this.image.src = `./src/img/obstacle/${imageSrc}.png`;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.size = Math.random() * 0.6 + 0.4;
    this.width = this.imageWidth * this.size;
    this.height = this.imageHeight * this.size;
    this.x = canvasEl.width;
    this.maxY = canvasEl.height - this.height - 144;
    this.minY = canvasEl.height - this.height - 480;
    this.y = Math.floor(Math.random() * (this.maxY - this.minY) + this.minY);
    this.markDelete = false;
    this.speedX = Math.random() * 2 + 1;
    this.isAttack = isAttack;
    this.collision = false;
  }
  update() {
    if (this.x < 0 - this.width) {
      this.markDelete = true;
    }
    this.x -= this.speedX;
  }

  draw() {
    ctx.drawImage(
      this.image,
      0,
      0,
      this.imageWidth,
      this.imageHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Attack {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.image = new Image();
    this.image.src = `./src/img/role/${playerImages[playerIndex].armsImage.name}.png`;
    this.imageWidth = playerImages[playerIndex].armsImage.width;
    this.imageHeight = playerImages[playerIndex].armsImage.height;
    this.width = this.imageWidth * this.size;
    this.height = this.imageHeight * this.size;
    this.markDelete = false;
    this.deleteTime = 0;
    this.deleteInterval = 200;
  }
  update(detection) {
    if (this.deleteTime > this.deleteInterval) {
      this.markDelete = true;
    } else {
      this.deleteTime += detection;
    }
  }
  draw() {
    console.log(this.imageWidth, this.imageHeight);
    ctx.drawImage(
      this.image,
      0,
      0,
      this.imageWidth,
      this.imageHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Life {
  constructor(x) {
    this.image = new Image();
    this.image.src = './src/img/score/life.png';
    this.width = 33;
    this.height = 39;
    this.markDelete = false;
    this.x = x;
    this.y = 30;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

function obstacleHandler(detection) {
  let randomObstacle = Math.round(Math.random() * 1);

  if (gameTime < Math.floor(setEndGameTime / 3)) {
    randomObstacle = Math.round(Math.random() * 1) + 4;
  } else if (gameTime < Math.floor((setEndGameTime / 3) * 2)) {
    randomObstacle = Math.round(Math.random() * 1) + 2;
  }

  if (obstacleTimer > obstacleInterval + randomObstacleInterval) {
    obstacles.push(
      new Obstacle(
        obstacleImages[randomObstacle].name,
        obstacleImages[randomObstacle].width,
        obstacleImages[randomObstacle].height,
        obstacleImages[randomObstacle].isAttack
      )
    );
    obstacleTimer = 0;
  } else {
    obstacleTimer += detection;
  }
  obstacles.sort((a, b) => {
    return b.y > a.y;
  });

  obstacles.forEach((object) => {
    object.update();
    object.draw();
  });

  obstacles = obstacles.filter((object) => !object.markDelete);
}

function attackHandler(detection) {
  attacks.forEach((object) => {
    object.update(detection);
    object.draw();
  });

  attacks = attacks.filter((object) => !object.markDelete);
}

function lifeHandler() {
  lifes.forEach((object) => {
    object.draw();
  });
  lifes = lifes.filter((object) => !object.markDelete);
}

function renderScoreHandler() {
  ctx.drawImage(playerInfoImage, 0, 0, 363, 105);
  ctx.font = '30px Stick';
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${score}`, 200, 110);
}

function renderTimerHandler() {
  ctx.drawImage(timeImage, canvasEl.width - 200, 0, 166, 94);
  ctx.font = '50px Stick';
  ctx.fillStyle = 'white';
  ctx.fillText(`${String(gameTime).padStart(2, 0)}`, canvasEl.width - 145, 60);
}

function changeBackgroundHandler() {
  let grade = 1;
  if (gameTime < Math.floor(setEndGameTime / 3)) {
    grade = 3;
  } else if (gameTime < Math.floor((setEndGameTime / 3) * 2)) {
    grade = 2;
  }

  backgroundlayer.forEach((object) => {
    object.src.src = object.src.src.replace(`L${grade - 1}`, `L${grade}`);
  });
}

function animate(timestamp) {
  const detection = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  backgroundlayer.forEach((object) => {
    object.bg.update(detection);
    object.bg.draw();
  });
  lifeHandler();
  obstacleHandler(detection);
  attackHandler(detection);
  player.update(detection, inputKey);
  player.draw();
  renderScoreHandler();
  renderTimerHandler();
  if (!gameOver) {
    requestAnimationFrame(animate);
  } else {
    endGameHandler();
  }
}

function setBackgroundHandler() {
  backgroundImages.forEach((bg) => {
    const image = new Image();
    image.src = `./src/img/bg/L1_${bg.name}.png`;
    backgroundlayer.push({
      src: image,
      height: bg.height,
      top: bg.top,
    });
  });

  backgroundlayer.forEach((object, index) => {
    const bg = new Background(
      object.src,
      object.top,
      object.height,
      index * 0.1
    );
    object.bg = bg;
  });
}

function setPlayHandler() {
  playerInfoImage.src = `./src/img/score/info_${playerImages[playerIndex].name}.png`;

  player = new Player(
    playerImages[playerIndex].runImage.name,
    playerImages[playerIndex].runImage.width,
    playerImages[playerIndex].runImage.height,
    playerImages[playerIndex].attackDistance
  );
}

function setLifeHandler() {
  for (let i = 0; i < setLife; i++) {
    lifes.push(new Life(i * 50 + 200));
  }
}

function startGameHandler() {
  canvasEl.width = 1200;
  canvasEl.height = 800;
  resetGameHandler();

  setBackgroundHandler();
  setPlayHandler();
  setLifeHandler();

  inputKey = new InputKey();

  animate(0);

  gameTimer = setInterval(() => {
    const lifesLength = lifes.length;
    if (
      gameTime % Math.round(setEndGameTime / 3) === 0 &&
      lifesLength !== setLife
    ) {
      lifes.push(new Life(lifesLength * 50 + 200));
    }
    gameTime--;
    changeBackgroundHandler();
    if (gameTime === 0) {
      endGameHandler();
    }
  }, 1000);
}

function endGameHandler() {
  gameOver = true;
  clearInterval(gameTimer);
  $('.end-score').text(score);
  $('.end-container').removeClass('none');
  if (lifes.length === 0) {
    $('.end-title').text('OPS !');
  } else {
    $('.end-title').text('YOU WIN !');

    $('.end-img')
      .attr('src', `./src/img/role/${playerImages[playerIndex].name}.png`)
      .removeClass('none');
  }
}

function resetGameHandler() {
  $('.end-container').addClass('none');
  obstacles = [];
  obstacleTimer = 0;
  lastTime = 0;
  gameTime = setEndGameTime;
  gameOver = false;
  score = 0;
  attacks = [];
  lifes = [];
  backgroundlayer = [];
}
