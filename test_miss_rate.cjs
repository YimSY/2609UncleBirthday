global.window = {};
require('./js/audio.js');
require('./js/sprites.js');
require('./js/physics.js');
require('./js/ai.js');

const ball = window.squashPhysics;

function testLevel(lvl, missChanceExpected) {
  const ai = new window.OpponentAI(lvl);
  let aiHits = 0;
  let aiMisses = 0;

  for (let trial = 0; trial < 500; trial++) {
    ai.reset(0, 4.8);
    ball.resetBall();
    ball.x = 0;
    ball.y = 7.4;
    ball.z = 1.0;

    ball.hitBall('player', (Math.random() - 0.5) * 2.0, 2.2, 1.0, false, ai.baseSpeed);
    let isOpponentTurn = true;

    for (let frame = 0; frame < 180; frame++) {
      const dt = 1/60;
      ai.update(dt, ball, isOpponentTurn);
      ball.update(dt, (event, data) => {});

      if (ball.lastHitter === 'opponent') {
        break;
      }
      if (ball.isDead) {
        break;
      }
    }

    if (ball.lastHitter === 'opponent') {
      aiHits++;
    } else {
      aiMisses++;
    }
  }

  const total = aiHits + aiMisses;
  const missRate = (aiMisses / total) * 100;
  console.log(`Level ${lvl} (${ai.name}): Miss Rate = ${missRate.toFixed(1)}% (Expected ~${(missChanceExpected * 100).toFixed(0)}%) [Hits: ${aiHits}, Misses: ${aiMisses}]`);
}

console.log('--- TESTING REFINED AI MISS RATES ---');
testLevel(1, 0.30);
testLevel(2, 0.20);
testLevel(3, 0.10);
