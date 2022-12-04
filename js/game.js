// GAME CONCEPT: Space Invaders meets Asteriods! Shoot at falling blocks to split them into tinier blocks. Avoid them and keep shooting to score points.
// TODO: move character left and right
// TODO: shoot with spacebar
// TODO: spawn falling blocks
// TODO: split blocks when hit by a shot
// TODO: destroy blocks at their smallest size
// TODO: add score for shooting blocks
// TODO: hurt player when hitting a block
// TODO: game over + reset + show score
// TODO: lead-in startup timer
// TODO: nice to have: start menu
// TODO: nice to have: custom controls
// TODO: nice to have: smooth vfx (screenshake, trails, particles)

const GAME_W = 320;
const GAME_H = 240;

const STATES = {
  game_over: "game_over",
  start: "start",
  in_game: "in_game",
  menu: "menu",
};
var game_state = "in_game";

// GRID PROPS
const BRICK_W = 32;
const BRICK_H = 16;
const COLS = 6;
const ROWS = 4;
const PADDING = 4;

// OBJECTS
const PADDLE = {
  x: GAME_W / 2,
  y: GAME_H / 2,
  dx: 0,
  w: 48,
  h: 8,
  color: ORANGE,
  speed: 4,
  type: "paddle",
  tag: "player1",
};
const BALL = {
  x: GAME_W / 2 - 4,
  y: GAME_H / 2 - 4,
  w: 8,
  h: 8,
  dx: 0,
  dy: 0,
  color: RED,
  speed: 0.1,
  type: "ball",
  top_speed: 1,
  positions: [],
};
const BRICK = {
  x: GAME_W / 2,
  y: 50,
  dx: 0,
  dy: 0,
  prev_x: 0,
  prev_y: 0,
  w: BRICK_W,
  h: BRICK_H,
  color: YELLOW,
  speed: 0,
  type: "brick",
  tag: "player1",
};

// PLAYERS
const PLAYER_1 = JSON.parse(JSON.stringify(PADDLE));
const PLAYER_2 = JSON.parse(JSON.stringify(PADDLE));
PLAYER_1.tag = "player1";
PLAYER_2.tag = "player2";
PLAYER_2.color = MID_PURPLE;

PLAYER_1.y = 100;
PLAYER_2.y = 200 + PLAYER_2.h;

PLAYER_1.x = GAME_W / 2 - PLAYER_1.w / 2;
PLAYER_2.x = GAME_W / 2 - PLAYER_1.w / 2;

// UTILS
const genGrid = (brick, rows, cols, start_x = 0, start_y = 0) => {
  let new_grid = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // copy obj template
      let new_brick = JSON.parse(JSON.stringify(brick));

      // initial pos
      new_brick.x = start_x + j * new_brick.w + PADDING * j;
      new_brick.y = start_y + i * new_brick.h + PADDING * i;

      // add to grid
      new_grid.push(new_brick);
    }
  }
  return new_grid;
};

function easing(x, target) {
  return (x += (target - x) * 0.1);
}

function easingWithRate(x, target, rate, tolerance = 0) {
  if (tolerance > 0 && x >= target * tolerance) return easing(x, target);
  return (x += (target - x) * rate);
}

const movePaddle = (paddle) => {
  // P1
  if (paddle.tag === "player1") {
    INPUTS.ArrowRight
      ? (paddle.dx = easingWithRate(paddle.dx, paddle.speed, 0.2))
      : null;
    INPUTS.ArrowLeft
      ? (paddle.dx = easingWithRate(paddle.dx, -1 * paddle.speed, 0.2))
      : null;

    if (!INPUTS.ArrowRight && !INPUTS.ArrowLeft) {
      paddle.dx = easingWithRate(paddle.dx, 0, 0.2);
    }
  }

  // P2
  if (paddle.tag === "player2") {
    INPUTS.d
      ? (paddle.dx = easingWithRate(paddle.dx, paddle.speed, 0.2))
      : null;
    INPUTS.a
      ? (paddle.dx = easingWithRate(paddle.dx, -1 * paddle.speed, 0.2))
      : null;

    if (!INPUTS.d && !INPUTS.a) {
      paddle.dx = easingWithRate(paddle.dx, 0, 0.2);
    }
  }
};

const pickDirection = (obj) => {
  let dy = Math.random() > 0.5 ? -1 : 1;
  let dx = Math.random() > 0.5 ? -1 : 1;
  obj.dx = dx;
  obj.dy = dy;
};

const bounceBall = (ball, other) => {
  ball.x = ball.prev_x;
  ball.y = ball.prev_y;

  // hit left side
  if (ball.x + ball.w < other.x) {
    ball.dx = Math.abs(ball.dx) * -1;
    // ball.dx *= -1;
  }
  // hit right side
  else if (ball.x > other.x + other.w) {
    ball.dx = Math.abs(ball.dx);
  }
  // hit top
  else if (ball.y + ball.h < other.y) {
    ball.dy = Math.abs(ball.dy) * -1;
  }
  // hit bottom
  else if (ball.y > other.y + other.h) {
    ball.dy = Math.abs(ball.dy);
  }
  // default
  else {
    if (ball.dy > 0) {
      ball.y -= ball.h;
    } else if (ball.dy < 0) {
      ball.y += ball.h;
    }
  }

  // if the ball hit a paddle, move the ball faster
  if (other.type === "paddle") {
    ball.top_speed += 0.1;
    if (ball.top_speed > 2) {
      ball.top_speed = 2;
    }
    return;
  }

  // remove other + shake screen
  let other_idx = GAME_OBJECTS.indexOf(other);
  GAME_OBJECTS.splice(other_idx, 1);
  poof(
    other.x + other.w / 2,
    other.y + other.h - other.h / 4,
    other.color,
    1,
    false
  );
  screenshakesRemaining = HIT_SCREENSHAKES;

  // reduce brick count
  if (other.tag === "player1" && other.type === "brick") p1_bricks--;
  if (other.tag === "player2" && other.type === "brick") p2_bricks--;
};

function collisionDetected(obj_a, obj_b) {
  return (
    obj_a.x < obj_b.x + obj_b.w &&
    obj_a.x + obj_a.w > obj_b.x &&
    obj_a.y < obj_b.y + obj_b.h &&
    obj_a.y + obj_a.h > obj_b.y
  );
}

function checkForWinner() {
  if (p1_bricks <= 0) {
    winner = "P2 WINS";
    game_state = STATES.game_over;
  }

  if (p2_bricks <= 0) {
    winner = "P1 WINS";
    game_state = STATES.game_over;
  }
}

function clamp(num, min, max) {
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function drawTrail(positions, obj) {
  positions?.forEach((pos, i) => {
    // ratio that moves toward one as we reach the end of the trail
    // useful for gradually increasing size/alpha/etc
    let ratio = (i + 1) / positions.length;

    // keep height and width within range of the leading object's size
    let w = clamp(ratio * obj.w, 1, obj.w);
    let h = clamp(ratio * obj.h, 1, obj.h);

    // center trail with leading object
    let x = pos.x;
    let y = pos.y;

    x -= w / 2;
    y -= h / 2;

    x += obj.w / 2;
    y += obj.h / 2;

    // increase alpha as we get closer to the front of the trail
    context.fillStyle = "rgba(255, 255, 255, " + ratio / 2 + ")";
    context.fillRect(x, y, w, h);
  });
}

function updateScreenshake() {
  if (screenshakesRemaining > 0) {
    // starts max size and gets smaller
    let wobble = Math.round(
      (screenshakesRemaining / HIT_SCREENSHAKES) * SCREENSHAKE_MAX_SIZE
    );
    if (screenshakesRemaining % 4 < 2) wobble *= -1; // alternate left/right every 2 frames
    context.setTransform(1, 0, 0, 1, wobble, 0);
    screenshakesRemaining--;
  } else {
    context.setTransform(1, 0, 0, 1, 0, 0); // reset
  }
}

// INPUTS
const INPUTS = {
  // PLAYER 1
  ArrowLeft: false,
  ArrowRight: false,

  // PLAYER 2
  a: false,
  d: false,

  // PAUSE/START/QUIT
  Enter: false,
};
window.addEventListener("keydown", function (e) {
  if (INPUTS[e.key] !== undefined) {
    INPUTS[e.key] = true;
  }
});
window.addEventListener("keyup", function (e) {
  if (INPUTS[e.key] !== undefined) {
    INPUTS[e.key] = false;
  }
});

const PLAYER_1_GRID = genGrid(BRICK, ROWS, COLS, BRICK_W / 2, BRICK_H);
const PLAYER_2_GRID = genGrid(BRICK, ROWS, COLS, BRICK_W / 2, 224);
PLAYER_2_GRID.forEach((brick) => {
  brick.tag = "player2";
  brick.color = PURPLE;
});
p1_bricks = PLAYER_1_GRID.length;
p2_bricks = PLAYER_2_GRID.length;

pickDirection(BALL);
let GAME_OBJECTS = [];

const resetGame = () => {
  GAME_OBJECTS.length = 0;

  GAME_OBJECTS = [];

  game_state = STATES.start;
  start_timer = 4;
};

// LOOP
const update = (dt) => {
  // collision groups
  let turret = GAME_OBJECTS.filter((obj) => obj.type === "turret");
  let blocks = GAME_OBJECTS.filter((obj) => obj.type === "block");
  let shots = GAME_OBJECTS.filter((obj) => obj.type === "shot");

  // fx
  particles.update();

  // GAME STATES
  if (game_state === STATES.menu) {
    if (INPUTS.Enter) {
      game_state = STATES.start;
    }
    return;
  }
  if (game_state === STATES.start) {
    // tick timer until the game is ready to start

    start_timer -= 0.02;

    if (start_timer <= 0) {
      game_state = STATES.in_game;
    }

    return;
  }
  if (game_state === STATES.in_game) {
    // player group
    turret.forEach((paddle) => {
      // PLAYER MOVEMENT
      paddle.prev_x = paddle.x;

      movePaddle(paddle);

      paddle.x += paddle.dx;

      if (paddle.x <= 0) paddle.x = paddle.prev_x;
      if (paddle.x + paddle.w >= GAME_W) paddle.x = paddle.prev_x;

      if (collisionDetected(BALL, paddle)) {
        bounceBall(BALL, paddle);
      }
    });

    // shot groups
    shots.forEach((brick) => {
      brick.prev_x = brick.x;
      brick.prev_y = brick.y;
      if (collisionDetected(BALL, brick)) {
        bounceBall(BALL, brick);
      }
    });

    // block group
    blocks.forEach((ball) => {
      ball.prev_x = ball.x;
      ball.prev_y = ball.y;

      ball.positions.push({ x: ball.prev_x, y: ball.prev_y });
      if (ball.positions.length > Math.floor(ball.top_speed * 10)) {
        ball.positions.shift();
      }

      ball.x += ball.dx * ball.speed;
      ball.y += ball.dy * ball.speed;

      // wall collision
      if (ball.x + ball.w > GAME_W || ball.x + ball.w < 0) {
        ball.dx *= -1;
      }
      if (ball.y + ball.w > GAME_H || ball.y + ball.w < 0) {
        ball.dy *= -1;
      }

      ball.speed = easing(ball.speed, ball.top_speed);
    });

    updateScreenshake();

    checkForWinner();

    return;
  }
  if (game_state === STATES.game_over) {
    if (INPUTS.Enter) {
      resetGame();
      game_state = STATES.start;
    }
    return;
  }
};

const draw = () => {
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height / 2);

  // render objects
  GAME_OBJECTS.forEach((obj) => {
    context.fillStyle = obj.color;
    context.fillRect(obj.x, obj.y, obj.w, obj.h);
  });

  // timer
  if (game_state === STATES.start) {
    context.fillStyle = "white";
    context.fillText(Math.floor(start_timer), GAME_W / 2 - 4, GAME_H / 2 - 16);
  }

  if (game_state === STATES.game_over) {
  }

  if (game_state === STATES.menu) {
    context.fillStyle = "white";

    let p2_text = "MOVE WITH LEFT / RIGHT";
    let p2_text_width = context.measureText(p2_text).width;
    context.fillStyle = "white";
    // context.fillText(p2_text, GAME_W / 2 - p2_text_width / 2, GAME_H / 2 + 16);
  }

  // fx
  particles.draw();

  // HUD
  context.fillStyle = "white";
};

const loop = () => {
  current_time = Date.now();
  let elapsed = current_time - start_time;
  start_time = current_time;
  lag += elapsed;

  while (lag > frame_duration) {
    update(elapsed / 1000);
    lag -= 1000 / fps;
    if (lag < 0) lag = 0;
  }

  var lag_offset = lag / frame_duration;
  draw(lag_offset);

  window.requestAnimationFrame(loop);
};

loop();