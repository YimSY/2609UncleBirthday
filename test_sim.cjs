global.window = {};
require('./js/audio.js');
require('./js/sprites.js');
require('./js/physics.js');
require('./js/ai.js');

const ball = window.squashPhysics;
const ai = new window.OpponentAI(1);

// Adjust physics constants for test
ball.gravity = 9.8;
ball.drag = 0.9995; // realistic low air resistance

// Fix hitBall formula to guarantee reaching targetZ on front wall
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
  // Exact kinematic height targeting
  this.vz = (targetZ - this.z + 0.5 * this.gravity * timeToWall * timeToWall) / timeToWall;
};

console.log('--- TEST RALLY SIMULATION ---');
ai.reset(0, 4.8);
ball.resetBall();
ball.x = 0.5;
ball.y = 7.4;
ball.z = 1.0;

let turn = 'opponent';
let rallyHits = 0;

// Player serves
console.log('1. Player hits ball towards front wall (targetX=0, targetZ=2.4)');
ball.hitBall('player', 0, 2.4, 1.1, false);

for (let frame = 0; frame < 600; frame++) {
  const dt = 1/60;
  
  // Opponent AI update
  const isOpponentTurn = (turn === 'opponent');
  ai.update(dt, ball, isOpponentTurn);

  if (ball.lastHitter === 'opponent' && turn === 'opponent') {
    turn = 'player';
    rallyHits++;
    console.log(`[Frame ${frame}] Opponent successfully returned ball! (Rally ${rallyHits}) target: front wall, ball.vy=${ball.vy.toFixed(2)}`);
  }

  // Ball physics update
  ball.update(dt, (event, data) => {
    console.log(`[Frame ${frame}] Ball Event: ${event}`, data);
  });

  // Simulated Player auto-return when ball reaches player depth
  if (turn === 'player' && !ball.isDead && ball.hasHitFrontWall && ball.vy > 0 && ball.y >= 7.0 && ball.bounceCount <= 1) {
    turn = 'opponent';
    rallyHits++;
    console.log(`[Frame ${frame}] Player returned ball! (Rally ${rallyHits})`);
    ball.hitBall('player', (Math.random() - 0.5) * 2.0, 2.2, 1.05, false);
  }

  if (ball.isDead) {
    console.log(`[Frame ${frame}] Rally ended! Reason: ${ball.deadReason}, Last Hitter: ${ball.lastHitter}, Total Hits: ${rallyHits}`);
    break;
  }
}
