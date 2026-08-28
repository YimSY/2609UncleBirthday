/**
 * Opponent AI for 3 Tournament Levels:
 * Level 1 - Niece (Amy) - 60% Miss Chance (Easy to score!)
 * Level 2 - Wife (Chris) - 40% Miss Chance
 * Level 3 - Daughter (Kaitlyn) - 20% Miss Chance
 */

class OpponentAI {
  constructor(level = 1) {
    this.setLevel(level);
    this.x = 0;
    this.y = 4.8;
    this.targetX = 0;
    this.anim = { state: 'idle', frame: 0, dir: 1, swingProg: 0 };
    this.isSwinging = false;
    this.swingDuration = 0.24;
    this.swingTimer = 0;
    this.hasHitThisRallyTurn = false;
    this.willMissThisTurn = false;
    this.turnRolled = false;
  }

  setLevel(level) {
    this.level = level;
    switch (level) {
      case 1:
        this.name = 'Niece (Amy)';
        this.role = 'niece';
        this.difficulty = 'Easy';
        this.speed = 4.8;
        this.reach = 1.6;
        this.baseSpeed = 8.5;      // Slower, comfortable ball speed
        this.powerRange = [0.88, 0.96];
        this.missChance = 0.30;    // 30% miss chance
        this.dialogues = {
          intro: "Happy Birthday Uncle! 🎉 It's Amy! Let's see who takes home the Birthday Cup!",
          pointScored: "Gotcha! Hehe, don't worry Uncle, you've got this!",
          pointConceded: "Ah! Super nice shot, Uncle!",
          win: "Uncle, Happy Birthday! Don't be sad, Amy is ready for a rematch anytime!",
          loss: "Whoa Uncle, you're on fire! Auntie Chris is waiting for you next!"
        };
        break;

      case 2:
        this.name = 'Wife (Chris)';
        this.role = 'wife';
        this.difficulty = 'Medium';
        this.speed = 6.2;
        this.reach = 1.8;
        this.baseSpeed = 11.0;     // Moderate pace
        this.powerRange = [1.05, 1.25];
        this.missChance = 0.20;    // 20% miss chance
        this.dialogues = {
          intro: "Happy Birthday darling! 💕 But Chris doesn't give free points on the court!",
          pointScored: "Keep your eye on the ball, honey! ❤️",
          pointConceded: "Impressive footwork, birthday boy!",
          win: "Looks like dinner is on you tonight, honey! Try again?",
          loss: "Well played, darling! Our daughter Kaitlyn is next, and she's ready to win!"
        };
        break;

      case 3:
      default:
        this.name = 'Daughter (Kaitlyn)';
        this.role = 'daughter';
        this.difficulty = 'Hard';
        this.speed = 7.6;
        this.reach = 2.1;
        this.baseSpeed = 13.5;     // Fast pace
        this.powerRange = [1.20, 1.45];
        this.missChance = 0.10;    // 10% miss chance
        this.dialogues = {
          intro: "Happy Birthday Dad! 🎂 Kaitlyn is here to defend the varsity title! Let's play!",
          pointScored: "Too fast for you, Dad? Haha!",
          pointConceded: "Whoa! That was an amazing angle, Dad!",
          win: "Aww Dad, you almost got me! Happy Birthday, give it another shot!",
          loss: "DAD YOU WON! 🏆 You are the undisputed Birthday Cup Champion!"
        };
        break;
    }
  }

  reset(x = 0, y = 4.8) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.anim = { state: 'idle', frame: 0, dir: 1, swingProg: 0 };
    this.isSwinging = false;
    this.swingTimer = 0;
    this.hasHitThisRallyTurn = false;
    this.willMissThisTurn = false;
    this.turnRolled = false;
  }

  update(dt, ball, isOpponentTurn) {
    this.anim.frame += dt * 30;

    if (this.isSwinging) {
      this.swingTimer += dt;
      this.anim.swingProg = Math.min(1, this.swingTimer / this.swingDuration);
      if (this.swingTimer >= this.swingDuration) {
        this.isSwinging = false;
        this.anim.state = 'idle';
        this.anim.swingProg = 0;
      }
    }

    if (isOpponentTurn) {
      // Roll miss decision once per rally turn
      if (!this.turnRolled) {
        this.willMissThisTurn = (Math.random() < this.missChance);
        this.turnRolled = true;
      }

      const prediction = ball.predictAtDepth(this.y);
      let targetPosX = 0;
      if (prediction && typeof prediction.x === 'number') {
        targetPosX = prediction.x;
      } else {
        targetPosX = ball.x;
      }

      if (this.willMissThisTurn) {
        // Deliberately position with an offset so ball slips past
        const missOffset = (targetPosX >= 0 ? -1.8 : 1.8);
        this.targetX = Math.max(-2.9, Math.min(2.9, targetPosX + missOffset));
      } else {
        this.targetX = Math.max(-2.9, Math.min(2.9, targetPosX));
      }
    } else {
      this.targetX = this.targetX * 0.96 + 0 * 0.04;
      this.hasHitThisRallyTurn = false;
      this.turnRolled = false;
      this.willMissThisTurn = false;
    }

    // Move smoothly towards targetX
    const dx = this.targetX - this.x;
    if (Math.abs(dx) > 0.04) {
      const moveStep = Math.sign(dx) * Math.min(Math.abs(dx), this.speed * dt);
      this.x += moveStep;
      if (!this.isSwinging) {
        this.anim.state = 'run';
        this.anim.dir = dx > 0 ? 1 : -1;
      }
    } else if (!this.isSwinging) {
      this.anim.state = 'idle';
    }

    // HIT DETECTION: When it's Opponent's turn to hit and ball is returning
    if (isOpponentTurn && !ball.isDead && !this.hasHitThisRallyTurn) {
      const isRebounding = ball.hasHitFrontWall && ball.vy > 0;

      if (isRebounding) {
        const xDist = Math.abs(ball.x - this.x);
        const inHitDepth = (ball.y >= 3.2 && ball.y <= 6.4);
        const inReach = (xDist <= this.reach);

        if (inHitDepth && inReach && ball.bounceCount <= 1) {
          if (!this.willMissThisTurn) {
            this.triggerHit(ball);
            this.hasHitThisRallyTurn = true;
          } else if (!this.isSwinging && ball.y >= 4.4) {
            // Attempt a close swing animation for dramatic close miss
            this.isSwinging = true;
            this.swingTimer = 0;
            this.anim.state = 'swing';
            this.hasHitThisRallyTurn = true; // don't hit ball
          }
        }
      }
    }
  }

  triggerHit(ball) {
    this.isSwinging = true;
    this.swingTimer = 0;
    this.anim.state = 'swing';

    let targetX = 0;
    let targetZ = 2.2;
    let isSmash = false;
    const power = this.powerRange[0] + Math.random() * (this.powerRange[1] - this.powerRange[0]);

    if (this.level === 1) {
      // Level 1 (Amy): High gentle rainbow arc towards center court (Easy to read & catch!)
      targetX = (Math.random() - 0.5) * 2.2;
      targetZ = 2.4 + Math.random() * 0.6;
    } else if (this.level === 2) {
      // Level 2 (Chris): Side-wall drives & corners
      targetX = (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 1.0);
      targetZ = 1.8 + Math.random() * 0.8;
      if (Math.random() < 0.2) isSmash = true;
    } else {
      // Level 3 (Kaitlyn): Fast smashes & drop shots
      if (Math.random() < 0.35) {
        targetX = (Math.random() - 0.5) * 4.6;
        targetZ = 1.0 + Math.random() * 0.4;
      } else {
        targetX = (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 0.8);
        targetZ = 2.2 + Math.random() * 0.9;
        isSmash = true;
      }
    }

    ball.hitBall('opponent', targetX, targetZ, power, isSmash, this.baseSpeed);
  }
}

window.OpponentAI = OpponentAI;
