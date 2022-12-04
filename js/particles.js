///////////////////////////////////////////////////
// a very simple particle system by mcfunkypants
///////////////////////////////////////////////////
function randomInt(min, max) {
  // helper function (inclusive: eg 1,10 may include 1 or 10)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PARTICLES_ENABLED = true; // if false, no particles at all

// example usage:
// particles.add(x,y,img,life,rotspd,ang,velx,vely,alpha);
// particles.update();
// particles.draw();
var particles = new SimpleParticles();

///////////////////////////////////////////////////
// custom effects used by this game specifically //
///////////////////////////////////////////////////

function fall_fx(x, y) {
  let img = IMAGES["dust"];
  let alpha = 0.5;
  let num = 8;
  for (let i = 0; i < num; i++) {
    let life = randomInt(333, 777);
    let rotspd = Math.random() * 0.4 - 0.2;
    let ang = Math.random() * Math.PI * 2;
    let velx = Math.random() * 2 - 1;
    let vely = Math.random() * -1.5;
    let px = x + 8 + Math.random() * 8 - 4;
    let py = y + 16 + Math.random() * 2 - 1;
    particles.add(px, py, img, life, rotspd, ang, velx, vely, alpha);
  }
}

function poof(x, y, color = "white", spd, trail = false) {
  let alpha = 1;
  let num = 100;
  for (let i = 0; i < num; i++) {
    let life = randomInt(333, 777);
    let rotspd = Math.random() * 0.4 - 0.2;
    let ang = Math.random() * Math.PI * 2;
    let velx = Math.random() * spd - spd / 2;
    let vely = -1 * Math.random() * spd - spd / 2;
    let px = x + Math.random() * 4 - 2;
    let py = y + Math.random() * 4 - 2;
    particles.add(px, py, color, life, rotspd, ang, velx, vely, alpha, trail);
  }
}

///////////////////////////////////////////////////
function SimpleParticles() {
  // the class constructor used by the global "particles"
  ///////////////////////////////////////////////////

  var particle = []; // all known particles in a pool so old ones can be reused

  this.add = function (
    x,
    y,
    color,
    life,
    rotationSpeed,
    forcedAngle,
    velX,
    velY,
    myAlpha,
    addTrail = false
  ) {
    if (!PARTICLES_ENABLED) return;
    var p, pnum, pcount;
    if (velX == undefined) velX = 0;
    if (velY == undefined) velY = 0;
    if (myAlpha == undefined) myAlpha = 1;
    if (rotationSpeed == undefined) rotationSpeed = Math.random() * 3 - 2;
    if (forcedAngle == undefined) forcedAngle = 0;

    for (pnum = 0, pcount = particle.length; pnum < pcount; pnum++) {
      p = particle[pnum];
      if (p && p.inactive) {
        break;
      } // found one we can reuse
    }
    if (!p || !p.inactive) {
      // we need a new one
      var newParticle = { inactive: true, has_trail: addTrail };
      particle.push(newParticle);
      p = newParticle;
    }
    if (p && p.inactive) {
      // reuse an old one
      p.x = x;
      p.y = y;
      p.inactive = false;
      p.life = life;
      p.birth = new Date().getTime();
      p.death = p.birth + life;
      p.angle = forcedAngle;
      p.alpha = myAlpha;
      p.maxalpha = myAlpha;
      p.rotSpd = rotationSpeed;
      p.velX = velX;
      p.velY = velY;
      p.has_trail = addTrail;
      p.color = color;
    }
  };

  this.update = function () {
    if (!PARTICLES_ENABLED) return;
    var timestamp = new Date().getTime();
    particle.forEach(function (p) {
      if (!p.inactive) {
        // if (p.has_trail) {
        //   storePreviousPosition(p);
        // }
        p.age = timestamp - p.birth;
        var lifePercent = p.age / p.life;
        if (lifePercent > 1) lifePercent = 1;
        if (lifePercent < 0) lifePercent = 0;
        p.x += p.velX; // move
        p.y += p.velY + GRAVITY * 0.05;
        p.velX *= 0.94; // slow down
        p.velY *= 0.94;
        p.alpha = (1 - lifePercent) * p.maxalpha; // fade
        if (p.rotSpd) p.angle = Math.PI * 2 * lifePercent * p.rotSpd;
        if (timestamp >= p.death) p.inactive = true;
      }
    });
  };

  this.draw = function () {
    particle.forEach(function (p) {
      if (!p.inactive) {
        context.globalAlpha = p.alpha;
        context.fillStyle = p.color;
        context.fillRect(p.x, p.y, 1, 1);
        context.globalAlpha = 1;
        if (p.has_trail) {
          //   drawParticleTrail(p);
        }
      }
    });
  };

  // immediately clears all particles
  this.clear = function () {
    particle = [];
  };
}
