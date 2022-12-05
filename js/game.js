// GAME CONCEPT: Space Invaders meets Asteriods!
// Shoot at falling blocks to split them into tinier blocks.
// Avoid them and keep shooting to score points.
// If you get hit, you split into tiny turrets! Neat!

// TODO: nice to have: start menu
// TODO: nice to have: custom controls
// TODO: nice to have: sound effects

const GAME_W = 320;
const GAME_H = 240;

const STATES = {
  game_over: "game_over",
  start: "start",
  in_game: "in_game",
  menu: "menu",
};
var game_state = "menu";

// GRID PROPS
const BLOCK_W = 32;
const BLOCK_H = 16;
const COLS = 6;
const ROWS = 4;
const PADDING = 4;

// OBJECTS
const PLAYER = {
  x: GAME_W / 2 - 16,
  y: GAME_H - 48,
  dx: 0,
  w: 32,
  h: 16,
  cannon: {
    h: 8,
    w: 8,
    x: 12,
    y: -8,
    color: MID_PURPLE,
  },
  color: MID_PURPLE,
  speed: 4,
  type: "turret",
  shoot_rate: 18,
  shoot_timer: 0,
  heart: {
    color: MID_PURPLE,
    x: GAME_W / 2 - 16,
    y: GAME_H - 48,
    w: 8,
    h: 8,
  },
  positions: [],
  has_trail: true,
  buffer: 4,
};

const SHOT = {
  x: GAME_W / 2 - 4,
  y: GAME_H / 2 - 4,
  w: 8,
  h: 8,
  dx: 0,
  dy: -3,
  color: GREEN,
  speed: 0.1,
  type: "shot",
  top_speed: 1,
  positions: [],
  has_trail: true,
  health: 3,
};

const BLOCK = {
  x: GAME_W / 2,
  y: 50,
  dx: 0,
  dy: 1,
  prev_x: 0,
  prev_y: 0,
  w: BLOCK_W,
  h: BLOCK_H,
  color: YELLOW,
  speed: 0,
  type: "block",
  positions: [],
  has_trail: false,
};

// PLAYERS
let player = JSON.parse(JSON.stringify(PLAYER));
let GAME_OBJECTS = [player];

// UTILS
const shoot = (shooter, projectile) => {
  let new_shot = JSON.parse(JSON.stringify(projectile));
  new_shot.x = shooter.x + shooter.w / 2 - projectile.w / 2;
  new_shot.y = shooter.y - shooter.h;
  GAME_OBJECTS.push(new_shot);

  // playSound(SOUNDS["shoot"]);
};

const spawnBlock = () => {
  let new_block = JSON.parse(JSON.stringify(BLOCK));

  if (score > 200) {
    new_block.w = 64;
    new_block.h = 16;
  }

  // if (score > 400) {
  //   new_block.w = 128;
  //   new_block.h = 16;
  // }

  new_block.x = Math.floor(Math.random() * GAME_W - BLOCK_W);
  if (new_block.x < 0) new_block.x += BLOCK_W;
  new_block.y = 0;
  GAME_OBJECTS.push(new_block);
};

const split = (object) => {
  // make 2 new objects
  let left_object = JSON.parse(JSON.stringify(object));
  let right_object = JSON.parse(JSON.stringify(object));

  // dimensions
  left_object.w = object.w / 2;
  right_object.w = object.w / 2;

  // position
  right_object.x = object.x + object.w / 2;

  // direction
  left_object.dx = -1;
  right_object.dx = 1;

  // remove original object
  let index = GAME_OBJECTS.indexOf(object);
  GAME_OBJECTS.splice(index, 1);

  poof(object.x, object.y, object.color, 1, false);

  // spawn new objects
  if (left_object.w > 4 && right_object.w > 4) {
    GAME_OBJECTS.push(left_object);
    GAME_OBJECTS.push(right_object);
  }
};

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

const move = (object) => {
  // ARROWS
  INPUTS.ArrowRight
    ? (object.dx = easingWithRate(object.dx, object.speed, 0.2))
    : null;
  INPUTS.ArrowLeft
    ? (object.dx = easingWithRate(object.dx, -1 * object.speed, 0.2))
    : null;

  if (!INPUTS.ArrowRight && !INPUTS.ArrowLeft) {
    object.dx = easingWithRate(object.dx, 0, 0.2);
  }

  // A/D
  // INPUTS.d ? (object.dx = easingWithRate(object.dx, object.speed, 0.2)) : null;
  // INPUTS.a
  //   ? (object.dx = easingWithRate(object.dx, -1 * object.speed, 0.2))
  //   : null;

  // if (!INPUTS.d && !INPUTS.a) {
  //   object.dx = easingWithRate(object.dx, 0, 0.2);
  // }
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
};

function collisionDetected(obj_a, obj_b) {
  return (
    obj_a.x < obj_b.x + obj_b.w &&
    obj_a.x + obj_a.w > obj_b.x &&
    obj_a.y < obj_b.y + obj_b.h &&
    obj_a.y + obj_a.h > obj_b.y
  );
}

function clamp(num, min, max) {
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function trackPosition(object) {
  let pos = { x: object.prev_x, y: object.prev_y };
  object.positions.push(pos);
  if (object.positions.length > 10) {
    object.positions.shift();
  }
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
  // MOVE
  ArrowLeft: false,
  ArrowRight: false,
  a: false,
  d: false,

  // SHOOT
  [" "]: false,

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

const resetGame = () => {
  GAME_OBJECTS.length = 0;

  let player = JSON.parse(JSON.stringify(PLAYER));
  GAME_OBJECTS = [player];

  game_state = STATES.start;
  start_timer = 4;
  score = 0;
};

// LOOP
const update = (dt) => {
  // collision groups
  let turrets = GAME_OBJECTS.filter((obj) => obj.type === "turret");
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
    // invincibility frames
    if (i_frames > 0) {
      i_frames -= 1;
    }

    if (i_frames <= 0) {
      i_frames = 0;
    }

    // player group
    turrets.forEach((turret) => {
      trackPosition(turret);

      // PLAYER MOVEMENT
      turret.prev_x = turret.x;

      move(turret);

      if (INPUTS[" "] && turret.shoot_timer === 0) {
        shoot(turret, SHOT);
        turret.shoot_timer += 1;
      }

      if (turret.shoot_timer > 0) {
        turret.shoot_timer += 1;
      }

      if (turret.shoot_timer >= turret.shoot_rate) {
        turret.shoot_timer = 0;
      }

      turret.x += turret.dx;

      turrets.forEach((other_turret) => {
        if (other_turret === turret) return;
        if (collisionDetected(turret, other_turret)) {
          turret.x = turret.prev_x;
        }
      });

      if (turret.x <= 0) turret.x = turret.prev_x;
      if (turret.x + turret.w >= GAME_W) turret.x = turret.prev_x;

      // turret hitboxes
      turret.heart.w = turret.w / 4;

      turret.heart.x = turret.x + turret.w / 2 - turret.heart.w / 2;
      turret.heart.y = turret.y + 2;

      turret.cannon.w = turret.w / 4;
      turret.cannon.x = turret.w / 2 - turret.cannon.w / 2;

      // collision against blocks
      blocks.forEach((block) => {
        if (collisionDetected(turret.heart, block) && i_frames < 1) {
          // particle effect and screen shake on turret destruction
          poof(
            turret.x + turret.w / 2,
            turret.y + turret.h - turret.h / 4,
            turret.color,
            1,
            false
          );
          screenshakesRemaining = HIT_SCREENSHAKES;

          // remove block that hit the player
          GAME_OBJECTS.splice(GAME_OBJECTS.indexOf(block), 1);

          // split the player into smaller turrets
          split(turret);

          // give the player a span of invincibility frames
          i_frames = invincibility_duration;
        }
      });

      shots.forEach((shot) => {
        if (collisionDetected(turret.heart, shot) && i_frames < 1) {
          // particle effect and screen shake on turret destruction
          poof(
            turret.x + turret.w / 2,
            turret.y + turret.h - turret.h / 4,
            turret.color,
            1,
            false
          );
          screenshakesRemaining = HIT_SCREENSHAKES;

          // remove shot that hit the player
          GAME_OBJECTS.splice(GAME_OBJECTS.indexOf(shot), 1);

          // split the player into smaller turrets
          split(turret);

          // give the player a span of invincibility frames
          i_frames = invincibility_duration;
        }
      });
    });

    // shot groups
    shots.forEach((shot) => {
      trackPosition(shot);

      shot.prev_x = shot.x;
      shot.prev_y = shot.y;
      shot.y += shot.dy;

      blocks.forEach((block) => {
        if (collisionDetected(shot, block)) {
          // update score based on the split block's width
          let points = 32 / block.w;
          score += points;

          // split the block into 2 new blocks
          split(block);

          // remove the shot that hit the block
          let index = GAME_OBJECTS.indexOf(shot);
          GAME_OBJECTS.splice(index, 1);
        }
      });

      shots.forEach((other_shot) => {
        if (shot === other_shot) return;
        if (collisionDetected(shot, other_shot)) {
          shot.remove = true;
          other_shot.remove = true;
        }
      });

      // wall collision
      if (shot.x + shot.w > GAME_W || shot.x + shot.w < 0) {
        shot.dx *= -1;
      }
      if (shot.y + shot.w > GAME_H || shot.y + shot.w < 0) {
        shot.dy *= -1;
        shot.health -= 1;
      }

      // health coloring
      if (shot.health === 3) {
        shot.color = GREEN;
      } else if (shot.health === 2) {
        shot.color = YELLOW;
      } else if (shot.health === 1) {
        shot.color = RED;
      }

      // health check
      if (shot.health <= 0) {
        shot.remove = true;
      }
    });

    // block group
    blocks.forEach((block) => {
      trackPosition(block);

      block.prev_x = block.x;
      block.prev_y = block.y;

      // block.positions.push({ x: block.prev_x, y: block.prev_y });
      // if (block.positions.length > Math.floor(block.top_speed * 10)) {
      //   block.positions.shift();
      // }

      block.speed = 1;
      block.x += block.dx * block.speed;
      block.y += block.dy * block.speed;

      // wall collision
      if (block.x + block.w > GAME_W || block.x + block.w < 0) {
        block.dx *= -1;
      }
      if (block.y + block.w > GAME_H || block.y + block.w < 0) {
        block.dy *= -1;
      }

      // block.speed = easing(block.speed, block.top_speed);
    });

    // spawning
    let spawn_count = blocks.length;
    spawn_timer++;
    if (spawn_timer >= spawn_rate && spawn_count < spawn_limit) {
      spawnBlock();
      spawn_timer = 0;
    }

    updateScreenshake();

    // despawning
    GAME_OBJECTS.forEach((obj) => {
      if (obj.remove) {
        poof(obj.x + obj.w / 2, obj.y + obj.h / 2, obj.color, 1, false);
        let idx = GAME_OBJECTS.indexOf(obj);
        GAME_OBJECTS.splice(idx, 1);
      }
    });

    if (turrets.length < 1) {
      game_state = "game_over";
    }

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
  context.fillStyle = AQUAMARINE;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // render objects
  GAME_OBJECTS.forEach((obj) => {
    // render trail underneath objects
    if (obj.has_trail) {
      drawTrail(obj.positions, obj);
    }

    // render object
    context.fillStyle = obj.color;
    context.fillRect(obj.x, obj.y, obj.w, obj.h);

    // turret-specific rendering
    if (obj.type === "turret") {
      // i frame flash
      if (i_frames > 0) {
        obj.color = i_frames % 2 === 0 ? "white" : MID_PURPLE;
      }

      // heart
      // context.fillStyle = obj.heart.color;
      // context.fillRect(obj.heart.x, obj.heart.y, obj.heart.w, obj.heart.h);

      // gun
      context.fillStyle = obj.cannon.color;
      context.fillRect(
        obj.x + obj.cannon.x,
        obj.y + obj.cannon.y,
        obj.cannon.w,
        obj.cannon.h
      );
    }
  });

  // timer
  if (game_state === STATES.start) {
    context.fillStyle = "white";
    context.fillText(Math.floor(start_timer), GAME_W / 2 - 4, GAME_H / 2 - 16);
  }

  if (game_state === STATES.game_over) {
    context.fillStyle = "white";
    let game_over_text = "GAME OVER!";
    let game_over_w = context.measureText(game_over_text).width;
    context.fillText(game_over_text, GAME_W / 2 - game_over_w / 2, GAME_H / 2);

    let score_text = "SCORE:" + score.toFixed(0);
    let score_text_w = context.measureText(score_text).width;
    context.fillText(
      score_text,
      GAME_W / 2 - score_text_w / 2,
      GAME_H / 2 + 16
    );
  }

  if (game_state === STATES.menu) {
    context.fillStyle = "white";

    let move_text = "MOVE WITH LEFT / RIGHT KEYS";
    let shoot_text = "SHOOT WITH SPACEBAR";
    let start_text = "PRESS ENTER TO START";
    let move_text_width = context.measureText(move_text).width;
    let shoot_text_width = context.measureText(shoot_text).width;
    let start_text_width = context.measureText(start_text).width;
    context.fillStyle = "white";
    context.fillText(move_text, GAME_W / 2 - move_text_width / 2, GAME_H / 2);
    context.fillText(
      shoot_text,
      GAME_W / 2 - shoot_text_width / 2,
      GAME_H / 2 + 16
    );
    context.fillText(
      start_text,
      GAME_W / 2 - start_text_width / 2,
      GAME_H / 2 + 48
    );
  }

  // fx
  particles.draw();

  // HUD
  context.fillStyle = "white";
  context.fillText(score, 12, 16);
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
