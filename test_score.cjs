global.window = {};
require('./js/audio.js');
require('./js/sprites.js');
require('./js/physics.js');
require('./js/ai.js');

const ball = window.squashPhysics;
const ai = new window.OpponentAI(1);

ball.gravity = 9.8;
ball.drag = 0.9995;

ball.hitBall = function(hitter, targetX, targetZ, power = 1.0, isSmash = false) {
  this.lastHitter = hitter;
  this.bounceCount = 0;
  this.hasHitFrontWall = false;
  this.isDead = false;
  this.deadReason = null;
  this.isSmash = isSmash;

  const baseSpeed = 13.0 * power;
  const dy = Math.max(0.5, this.y);
  const timeToWall = dy / baseSpeed;

  this.vy = -baseSpeed;
  this.vx = (targetX - this.x) / timeToWall;
  this.vz = (targetZ - this.z + 0.5 * this.gravity * timeToWall * timeToWall) / timeToWall;
};

console.log('--- TEST 2: Opponent Scores Point when Player misses ---');
ai.reset(0, 4.8);
ball.resetBall();
ball.x = 0;
ball.y = 4.8;
ball.z = 1.2;

// Opponent serves
ball.hitBall('opponent', 1.0, 2.2, 1.05, false);
let turn = 'player';
let pointWinner = null;

for (let frame = 0; frame < 150; frame++) {
  const dt = 1/60;
  
  ball.update(dt, (event, data) => {
    console.log(`[Frame ${frame}] Ball Event: ${event}`, data);
    if (event === 'double_bounce') {
      pointWinner = data.lastHitter;
    }
  });

  if (ball.isDead) {
    console.log(`[Frame ${frame}] Ball is dead! Reason: ${ball.deadReason}, Point winner: ${pointWinner}`);
    break;
  }
}
