/**
 * The Birthday Cup: 16-Bit Japanese Squash Game Controller
 * Core State Machine, Touch/Keyboard Input, Squash Rule Judge & Flow
 */

class BirthdaySquashGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;

    // Game States
    this.STATE_TITLE = 'TITLE';
    this.STATE_INTRO = 'INTRO';
    this.STATE_SERVING = 'SERVING';
    this.STATE_RALLY = 'RALLY';
    this.STATE_POINT = 'POINT';
    this.STATE_LEVEL_CLEAR = 'LEVEL_CLEAR';
    this.STATE_GAME_OVER = 'GAME_OVER';
    this.STATE_GRAND_FINALE = 'GRAND_FINALE';

    this.state = this.STATE_TITLE;

    // Tournament & Score Data
    this.currentLevel = 1; // 1: Amy, 2: Chris, 3: Kaitlyn
    this.playerScore = 0;
    this.opponentScore = 0;
    this.server = 'player';
    this.turn = 'player';
    this.rallyCount = 0;

    // Characters
    this.player = {
      x: 0,
      y: 7.4,
      targetX: 0,
      speed: 7.2,
      reach: 1.7, // Generous reach for mobile comfort
      anim: { state: 'idle', frame: 0, dir: 1, swingProg: 0 },
      isSwinging: false,
      swingTimer: 0,
      swingDuration: 0.22
    };

    this.opponent = new OpponentAI(1);

    // FX, Particles & Notifications
    this.hitEffects = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.dialogue = null;
    this.dialogueTimer = 0;

    this.isTouching = false;
    this.keys = {};

    this.lastTime = performance.now();
    this.stateTimer = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindEvents();
    this.loop();
  }

  resize() {
    const container = document.getElementById('gameContainer');
    const rect = container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    // Mobile Touch Controls
    const handleTouchMove = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const normalizedX = (relativeX / this.width) * 2 - 1;
      this.player.targetX = Math.max(-2.9, Math.min(2.9, normalizedX * 3.2));
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (window.soundEngine) window.soundEngine.init();
      const touch = e.touches[0];
      this.isTouching = true;
      handleTouchMove(touch.clientX);

      if (this.state === 'SERVING' && this.server === 'player') {
        this.executePlayerHit(true);
      } else if (this.state === 'RALLY') {
        this.attemptManualSwing();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleTouchMove(e.touches[0].clientX);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      this.isTouching = false;
    });

    // Mouse Drag for Desktop
    let isMouseDown = false;
    this.canvas.addEventListener('mousedown', (e) => {
      if (window.soundEngine) window.soundEngine.init();
      isMouseDown = true;
      handleTouchMove(e.clientX);

      if (this.state === 'SERVING' && this.server === 'player') {
        this.executePlayerHit(true);
      } else if (this.state === 'RALLY') {
        this.attemptManualSwing();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        handleTouchMove(e.clientX);
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (window.soundEngine) window.soundEngine.init();
      this.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (this.state === 'SERVING' && this.server === 'player') {
          this.executePlayerHit(true);
        } else if (this.state === 'RALLY') {
          this.attemptManualSwing();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // UI Buttons
    document.getElementById('startBtn').addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.init();
      this.startTournament();
    });

    document.getElementById('readyServeBtn').addEventListener('click', () => {
      this.dismissIntro();
    });

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
      this.advanceToNextLevel();
    });

    document.getElementById('retryBtn').addEventListener('click', () => {
      this.retryLevel();
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
      this.startTournament();
    });

    document.getElementById('soundToggleBtn').addEventListener('click', () => {
      if (window.soundEngine) {
        const isMuted = window.soundEngine.toggleMute();
        document.getElementById('soundToggleBtn').innerText = isMuted ? '🔇' : '🔊';
      }
    });
  }

  // --- Game State Flow ---

  startTournament() {
    this.currentLevel = 1;
    this.opponent.setLevel(1);
    this.playerScore = 0;
    this.opponentScore = 0;
    this.server = 'player';
    this.player.reach = 1.7; // Extra generous reach on Level 1
    this.hideAllOverlays();
    this.showLevelIntro();
  }

  showLevelIntro() {
    this.state = this.STATE_INTRO;
    const opponent = this.opponent;

    document.getElementById('introLevelTag').innerText = `LEVEL ${this.currentLevel} OF 3`;
    document.getElementById('introOpponentName').innerText = `VS ${opponent.name.toUpperCase()}`;
    document.getElementById('introOpponentDesc').innerText = `Difficulty: ${opponent.difficulty}`;
    document.getElementById('introDialogueText').innerText = `"${opponent.dialogues.intro}"`;

    document.getElementById('levelIntroModal').classList.remove('hidden');
    this.updateHUD();
  }

  dismissIntro() {
    document.getElementById('levelIntroModal').classList.add('hidden');
    this.startServe();
  }

  startServe() {
    this.state = this.STATE_SERVING;
    this.stateTimer = 0;
    this.rallyCount = 0;
    this.turn = this.server;

    window.squashPhysics.resetBall();

    if (this.server === 'player') {
      this.player.x = 0.8;
      this.player.targetX = 0.8;
      this.opponent.reset(-0.8, 4.8);
      window.squashPhysics.x = this.player.x;
      window.squashPhysics.y = this.player.y - 0.4;
      window.squashPhysics.z = 1.1;
      this.showFloatingText('YOUR SERVE!', 'TAP OR PRESS SPACE', 0, 1.2, '#ffd700');
    } else {
      this.opponent.reset(0.8, 4.8);
      this.player.x = -0.8;
      this.player.targetX = -0.8;
      window.squashPhysics.x = this.opponent.x;
      window.squashPhysics.y = this.opponent.y - 0.3;
      window.squashPhysics.z = 1.2;
      this.showFloatingText(`${this.opponent.name.toUpperCase()} SERVES!`, 'GET READY!', 0, 1.0, '#ffbe0b');
    }
  }

  executePlayerHit(isServe = false) {
    if (this.player.isSwinging) return;

    this.player.isSwinging = true;
    this.player.swingTimer = 0;
    this.player.anim.state = 'swing';

    const ball = window.squashPhysics;
    const aimOffset = (this.player.x / 3.0) * -1.6;
    const targetX = Math.max(-2.6, Math.min(2.6, aimOffset + (Math.random() - 0.5) * 0.7));

    // Base speed scaled according to level difficulty
    let baseSpeed = 9.0; // Level 1 (Gentle & easy to follow)
    if (this.currentLevel === 2) baseSpeed = 11.2;
    if (this.currentLevel === 3) baseSpeed = 13.5;

    const targetZ = isServe ? 2.4 : (2.0 + Math.random() * 0.8);
    const power = isServe ? 1.0 : 1.05;

    ball.hitBall('player', targetX, targetZ, power, false, baseSpeed);
    this.turn = 'opponent';
    this.rallyCount++;
    this.state = this.STATE_RALLY;

    const proj = ball.project(this.width, this.height);
    this.createHitEffect(proj.x, proj.y, false);
  }

  attemptManualSwing() {
    const ball = window.squashPhysics;
    if (this.turn === 'player' && !ball.isDead && ball.hasHitFrontWall && ball.vy > 0) {
      const xDist = Math.abs(ball.x - this.player.x);
      const inHitZone = (ball.y >= 5.6 && ball.y <= 9.0) && (xDist <= this.player.reach + 0.4);

      if (inHitZone && ball.bounceCount <= 1) {
        const isSweetSpot = Math.abs(ball.y - this.player.y) < 0.45;
        this.executePlayerHit(false);

        if (isSweetSpot) {
          this.showFloatingText('★ SMASH! ★', 'すばらしい!', 0, 0.9, '#ffbe0b');
          if (window.soundEngine) window.soundEngine.playHit(1.3, true);
        }
      }
    }
  }

  handlePhysicsEvent(eventType, data) {
    if (this.state !== this.STATE_RALLY && this.state !== this.STATE_SERVING) return;

    if (eventType === 'tin') {
      const winner = window.squashPhysics.lastHitter === 'player' ? 'opponent' : 'player';
      this.awardPoint(winner, 'FAULT (TIN)!');
    } else if (eventType === 'out') {
      const winner = window.squashPhysics.lastHitter === 'player' ? 'opponent' : 'player';
      this.awardPoint(winner, 'OUT OF BOUNDS!');
    } else if (eventType === 'double_bounce') {
      const winner = data.lastHitter;
      this.awardPoint(winner, 'DOUBLE BOUNCE!');
    }
  }

  awardPoint(winner, reason) {
    this.state = this.STATE_POINT;
    this.stateTimer = 0;

    const isPlayer = (winner === 'player');
    if (isPlayer) {
      this.playerScore++;
      this.server = 'player';
      if (window.soundEngine) window.soundEngine.playPointScored(true);
      this.showFloatingText('POINT TO DAD! 🎂', reason, 0, 1.4, '#48cae4');
      this.showDialogue(this.opponent.dialogues.pointConceded, 2.5);
    } else {
      this.opponentScore++;
      this.server = 'opponent';
      if (window.soundEngine) window.soundEngine.playPointScored(false);
      this.showFloatingText(`POINT TO ${this.opponent.name.toUpperCase()}!`, reason, 0, 1.4, '#ff6b6b');
      this.showDialogue(this.opponent.dialogues.pointScored, 2.5);
    }

    this.updateHUD();

    const p = this.playerScore;
    const o = this.opponentScore;

    if (p >= 10 && o >= 10 && p === o) {
      if (window.soundEngine) window.soundEngine.playDeuce();
      this.showFloatingText('★ DEUCE! ★', 'MUST LEAD BY 2 POINTS', 0, 1.6, '#ffd700');
    } else if ((p >= 10 && p - o === 1) || (o >= 10 && o - p === 1)) {
      if (window.soundEngine) window.soundEngine.playDeuce();
      const leader = p > o ? 'DAD' : this.opponent.name.toUpperCase();
      this.showFloatingText('MATCH POINT!', `${leader} LEADS`, 0, 1.6, '#ff006e');
    }

    if (p >= 11 && p - o >= 2) {
      setTimeout(() => this.handleLevelWon(), 1600);
    } else if (o >= 11 && o - p >= 2) {
      setTimeout(() => this.handleMatchLost(), 1600);
    } else {
      setTimeout(() => {
        if (this.state === this.STATE_POINT) {
          this.startServe();
        }
      }, 2200);
    }
  }

  handleLevelWon() {
    if (window.soundEngine) window.soundEngine.playLevelWin();

    if (this.currentLevel < 3) {
      this.state = this.STATE_LEVEL_CLEAR;
      document.getElementById('clearLevelTitle').innerText = `LEVEL ${this.currentLevel} CLEAR!`;
      document.getElementById('clearScoreSummary').innerText = `Final Score: Dad ${this.playerScore} - ${this.opponentScore} ${this.opponent.name}`;
      document.getElementById('clearQuote').innerText = `"${this.opponent.dialogues.loss}"`;

      const nextName = this.currentLevel === 1 ? 'Wife (Chris)' : 'Daughter (Kaitlyn)';
      document.getElementById('nextLevelBtn').innerText = `NEXT: VS ${nextName.toUpperCase()} ➔`;
      document.getElementById('levelClearModal').classList.remove('hidden');
    } else {
      this.handleGrandFinale();
    }
  }

  advanceToNextLevel() {
    document.getElementById('levelClearModal').classList.add('hidden');
    this.currentLevel++;
    this.opponent.setLevel(this.currentLevel);
    this.playerScore = 0;
    this.opponentScore = 0;
    this.server = 'player';
    this.player.reach = this.currentLevel === 2 ? 1.6 : 1.5;
    this.showLevelIntro();
  }

  handleMatchLost() {
    this.state = this.STATE_GAME_OVER;
    if (window.soundEngine) window.soundEngine.playLoss();

    this.player.anim.state = 'sad';
    document.getElementById('lossScoreSummary').innerText = `Final Score: Dad ${this.playerScore} - ${this.opponentScore} ${this.opponent.name}`;
    document.getElementById('lossNieceQuote').innerText = `"${this.opponent.dialogues.win}"`;
    document.getElementById('gameOverModal').classList.remove('hidden');
  }

  retryLevel() {
    document.getElementById('gameOverModal').classList.add('hidden');
    this.playerScore = 0;
    this.opponentScore = 0;
    this.server = 'player';
    this.player.anim.state = 'idle';
    this.showLevelIntro();
  }

  handleGrandFinale() {
    this.state = this.STATE_GRAND_FINALE;
    this.player.anim.state = 'win';

    if (window.soundEngine) {
      window.soundEngine.playHappyBirthdaySong();
    }

    this.spawnConfetti(120);

    document.getElementById('finaleScoreSummary').innerText = `Dad ${this.playerScore} - ${this.opponentScore} Daughter (Kaitlyn)`;
    document.getElementById('grandFinaleModal').classList.remove('hidden');
  }

  updateHUD() {
    document.getElementById('hudLevel').innerText = `LVL ${this.currentLevel}: VS ${this.opponent.name.toUpperCase()}`;
    document.getElementById('hudPlayerScore').innerText = this.playerScore;
    document.getElementById('hudOpponentScore').innerText = this.opponentScore;
    document.getElementById('hudServerIndicator').innerText = this.server === 'player' ? '● DAD SERVES' : `● ${this.opponent.name.toUpperCase()} SERVES`;
  }

  hideAllOverlays() {
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('levelIntroModal').classList.add('hidden');
    document.getElementById('levelClearModal').classList.add('hidden');
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('grandFinaleModal').classList.add('hidden');
  }

  showDialogue(text, duration = 2.5) {
    this.dialogue = text;
    this.dialogueTimer = duration;
  }

  showFloatingText(text, subtext, x = 0, duration = 1.4, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      subtext: subtext,
      x: this.width / 2 + x,
      y: this.height * 0.38,
      duration: duration,
      maxDuration: duration,
      color: color
    });
  }

  createHitEffect(x, y, isSmash = false) {
    this.hitEffects.push({
      x: x,
      y: y,
      progress: 0,
      isSmash: isSmash
    });
  }

  spawnConfetti(count = 80) {
    const colors = ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#ffffff', '#ffd166'];
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // --- Main Update Loop ---

  update(dt) {
    this.stateTimer += dt;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.targetX = Math.max(-2.9, this.player.targetX - this.player.speed * dt);
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.targetX = Math.min(2.9, this.player.targetX + this.player.speed * dt);
    }

    const pDx = this.player.targetX - this.player.x;
    if (Math.abs(pDx) > 0.04) {
      this.player.x += Math.sign(pDx) * Math.min(Math.abs(pDx), this.player.speed * dt);
      if (this.player.anim.state !== 'swing' && this.player.anim.state !== 'sad' && this.player.anim.state !== 'win') {
        this.player.anim.state = 'run';
        this.player.anim.dir = pDx > 0 ? 1 : -1;
      }
    } else if (this.player.anim.state === 'run') {
      this.player.anim.state = 'idle';
    }

    this.player.anim.frame += dt * 30;

    if (this.player.isSwinging) {
      this.player.swingTimer += dt;
      this.player.anim.swingProg = Math.min(1, this.player.swingTimer / this.player.swingDuration);
      if (this.player.swingTimer >= this.player.swingDuration) {
        this.player.isSwinging = false;
        this.player.anim.state = 'idle';
        this.player.anim.swingProg = 0;
      }
    }

    const ball = window.squashPhysics;

    // 1. OPPONENT SERVE
    if (this.state === this.STATE_SERVING && this.server === 'opponent') {
      if (this.stateTimer > 0.95) {
        this.opponent.triggerHit(ball);
        this.turn = 'player';
        this.rallyCount = 1;
        this.state = this.STATE_RALLY;
        const proj = ball.project(this.width, this.height);
        this.createHitEffect(proj.x, proj.y, false);
      }
    }

    // 2. OPPONENT AI UPDATE
    const isOpponentTurn = (this.turn === 'opponent');
    this.opponent.update(dt, ball, isOpponentTurn);

    if (ball.lastHitter === 'opponent' && this.turn === 'opponent') {
      this.turn = 'player';
      this.rallyCount++;
      if (this.rallyCount >= 4 && this.rallyCount % 3 === 0) {
        this.showFloatingText(`RALLY: ${this.rallyCount} HITS! 🔥`, '', 0, 0.8, '#ffbe0b');
      }
    }

    // 3. AUTO-SWING HELPER FOR PLAYER WHEN IN RANGE
    if (this.state === this.STATE_RALLY && this.turn === 'player' && !ball.isDead && ball.hasHitFrontWall && ball.vy > 0) {
      const xDist = Math.abs(ball.x - this.player.x);
      const inHitZone = (ball.y >= 6.0 && ball.y <= 8.8) && (xDist <= this.player.reach);

      if (inHitZone && ball.bounceCount <= 1) {
        this.executePlayerHit(false);
      }
    }

    // 4. UPDATE BALL PHYSICS
    if (this.state === this.STATE_RALLY || this.state === this.STATE_POINT) {
      ball.update(dt, (eventType, data) => this.handlePhysicsEvent(eventType, data));
    }

    // 5. UPDATE FX
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      const fx = this.hitEffects[i];
      fx.progress += dt * 3.5;
      if (fx.progress >= 1) this.hitEffects.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.duration -= dt;
      ft.y -= dt * 18;
      if (ft.duration <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= dt;
      if (this.dialogueTimer <= 0) this.dialogue = null;
    }

    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.vRot;
      if (c.y > this.height + 20) {
        if (this.state === this.STATE_GRAND_FINALE) {
          c.y = -10;
          c.x = Math.random() * this.width;
        } else {
          this.confetti.splice(i, 1);
        }
      }
    }
  }

  // --- Main Render Loop ---

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const sprites = window.spriteEngine;
    const ball = window.squashPhysics;

    sprites.drawCourt(this.ctx, this.width, this.height);

    const oppProj = ball.project(this.width, this.height, this.opponent.x, this.opponent.y, 0);
    const playerProj = ball.project(this.width, this.height, this.player.x, this.player.y, 0);
    const ballProj = ball.project(this.width, this.height);

    const oppScale = 0.72 + 0.35 * oppProj.depthRatio;
    const playerScale = 0.85 + 0.35 * playerProj.depthRatio;

    // Depth Sorting
    if (ball.y < this.opponent.y) {
      sprites.drawBall(this.ctx, ballProj.x, ballProj.y, ballProj.floorY, ballProj.radius, ball.isSmash, ball.trail);
      sprites.drawCharacter(this.ctx, oppProj.x, oppProj.floorY, oppScale, this.opponent.role, this.opponent.anim);
      sprites.drawCharacter(this.ctx, playerProj.x, playerProj.floorY, playerScale, 'dad', this.player.anim);
    } else if (ball.y < this.player.y) {
      sprites.drawCharacter(this.ctx, oppProj.x, oppProj.floorY, oppScale, this.opponent.role, this.opponent.anim);
      sprites.drawBall(this.ctx, ballProj.x, ballProj.y, ballProj.floorY, ballProj.radius, ball.isSmash, ball.trail);
      sprites.drawCharacter(this.ctx, playerProj.x, playerProj.floorY, playerScale, 'dad', this.player.anim);
    } else {
      sprites.drawCharacter(this.ctx, oppProj.x, oppProj.floorY, oppScale, this.opponent.role, this.opponent.anim);
      sprites.drawCharacter(this.ctx, playerProj.x, playerProj.floorY, playerScale, 'dad', this.player.anim);
      sprites.drawBall(this.ctx, ballProj.x, ballProj.y, ballProj.floorY, ballProj.radius, ball.isSmash, ball.trail);
    }

    if (this.state === this.STATE_GAME_OVER) {
      const nieceX = playerProj.x + 52;
      sprites.drawCharacter(this.ctx, nieceX, playerProj.floorY, playerScale * 0.95, 'niece', { state: 'idle', frame: this.player.anim.frame });
    }

    if (this.state === this.STATE_GRAND_FINALE) {
      const nieceX = playerProj.x - 72;
      const wifeX = playerProj.x + 68;
      const daughterX = playerProj.x + 125;
      sprites.drawCharacter(this.ctx, nieceX, playerProj.floorY, playerScale * 0.92, 'niece', { state: 'idle', frame: this.player.anim.frame });
      sprites.drawCharacter(this.ctx, wifeX, playerProj.floorY, playerScale * 0.92, 'wife', { state: 'idle', frame: this.player.anim.frame });
      sprites.drawCharacter(this.ctx, daughterX, playerProj.floorY, playerScale * 0.92, 'daughter', { state: 'idle', frame: this.player.anim.frame });
    }

    this.hitEffects.forEach(fx => {
      sprites.drawHitEffect(this.ctx, fx.x, fx.y, fx.progress, fx.isSmash);
    });

    this.floatingTexts.forEach(ft => {
      const alpha = Math.min(1, ft.duration / (ft.maxDuration * 0.3));
      sprites.drawFloatingText(this.ctx, ft.text, ft.subtext, ft.x, ft.y, alpha, 1, ft.color);
    });

    if (this.dialogue) {
      this.drawInGameDialogue(this.dialogue);
    }

    if (this.confetti.length > 0) {
      this.ctx.save();
      this.confetti.forEach(c => {
        this.ctx.save();
        this.ctx.translate(c.x, c.y);
        this.ctx.rotate(c.rotation);
        this.ctx.fillStyle = c.color;
        this.ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        this.ctx.restore();
      });
      this.ctx.restore();
    }
  }

  drawInGameDialogue(text) {
    const cx = this.width / 2;
    const cy = this.height * 0.16;
    const maxW = Math.min(this.width * 0.88, 380);

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(16, 20, 36, 0.88)';
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;

    this.ctx.strokeRect(cx - maxW / 2, cy - 20, maxW, 42);
    this.ctx.fillRect(cx - maxW / 2, cy - 20, maxW, 42);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, cx, cy + 2);
    this.ctx.restore();
  }

  loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new BirthdaySquashGame();
});
