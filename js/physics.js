/**
 * 3D Squash Ball Physics & Perspective Projection Engine
 * Simulates real court dimensions, gravity, wall rebounds, and floor bounces.
 */

class SquashPhysics {
  constructor() {
    // Official Squash Court Dimensions (in meters)
    this.courtWidth = 6.4;   // -3.2 to +3.2
    this.courtDepth = 9.75;  // 0 (front wall) to 9.75 (back wall)
    this.courtHeight = 5.6;  // 0 (floor) to 5.6 (ceiling)
    
    // Key regulation heights
    this.tinHeight = 0.48;     // Front wall tin (red metal base)
    this.serviceHeight = 1.78; // Service line
    this.outLineHeight = 4.57; // Out line at front wall

    // Responsive squash physics
    this.gravity = 9.8;        // m/s^2
    this.drag = 0.9995;        // Minimal air drag

    this.resetBall();
  }

  resetBall() {
    this.x = 0;
    this.y = 5.0;
    this.z = 1.2;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.bounceCount = 0;        // floor bounces since last hit
    this.lastHitter = null;      // 'player' | 'opponent'
    this.hasHitFrontWall = false;
    this.isDead = false;
    this.deadReason = null;      // 'double_bounce' | 'tin' | 'out'
    this.isSmash = false;
    this.trail = [];
  }

  // Set serve or hit trajectory with customizable base speed
  hitBall(hitter, targetX, targetZ, power = 1.0, isSmash = false, baseSpeed = 11.0) {
    this.lastHitter = hitter;
    this.bounceCount = 0;
    this.hasHitFrontWall = false;
    this.isDead = false;
    this.deadReason = null;
    this.isSmash = isSmash;

    // Effective speed scaled by power and level baseSpeed
    const effectiveSpeed = baseSpeed * power; // m/s
    const dy = Math.max(0.5, this.y); // distance to front wall
    const timeToWall = Math.max(0.25, dy / effectiveSpeed);

    // Calculate required velocity vector (vx, vy, vz)
    this.vy = -effectiveSpeed;
    this.vx = (targetX - this.x) / timeToWall;
    
    // Height targeting to hit safely above tin
    this.vz = (targetZ - this.z + 0.5 * this.gravity * timeToWall * timeToWall) / timeToWall;

    if (window.soundEngine) {
      window.soundEngine.playHit(power, isSmash);
    }
  }

  // Update physics step (dt in seconds)
  update(dt, onEvent) {
    if (this.isDead) return;

    // Sub-stepping for collision precision
    const steps = 4;
    const subDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      // 1. Gravity and velocity
      this.vz -= this.gravity * subDt;
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vz *= this.drag;

      this.x += this.vx * subDt;
      this.y += this.vy * subDt;
      this.z += this.vz * subDt;

      // 2. Collision with Front Wall (y <= 0)
      if (this.y <= 0 && this.vy < 0) {
        this.y = 0;
        
        // Check Tin
        if (this.z <= this.tinHeight) {
          this.isDead = true;
          this.deadReason = 'tin';
          if (window.soundEngine) window.soundEngine.playTin();
          if (onEvent) onEvent('tin', { x: this.x, z: this.z });
          return;
        }

        // Check Out of Court
        if (this.z >= this.outLineHeight) {
          this.isDead = true;
          this.deadReason = 'out';
          if (window.soundEngine) window.soundEngine.playWhistle();
          if (onEvent) onEvent('out', { x: this.x, z: this.z });
          return;
        }

        // Valid Front Wall Rebound
        this.hasHitFrontWall = true;
        this.vy = -this.vy * 0.86; // smooth rebound towards court
        this.vx += (Math.random() - 0.5) * 0.2;

        if (window.soundEngine) window.soundEngine.playWallBounce();
        if (onEvent) onEvent('wall_front', { x: this.x, z: this.z });
      }

      // 3. Collision with Side Walls
      const halfW = this.courtWidth / 2;
      if (this.x <= -halfW && this.vx < 0) {
        this.x = -halfW;
        this.vx = -this.vx * 0.84;
        if (window.soundEngine) window.soundEngine.playWallBounce();
        if (onEvent) onEvent('wall_side', { side: 'left', x: this.x, y: this.y });
      } else if (this.x >= halfW && this.vx > 0) {
        this.x = halfW;
        this.vx = -this.vx * 0.84;
        if (window.soundEngine) window.soundEngine.playWallBounce();
        if (onEvent) onEvent('wall_side', { side: 'right', x: this.x, y: this.y });
      }

      // 4. Collision with Floor (z <= 0)
      if (this.z <= 0 && this.vz < 0) {
        this.z = 0;
        this.bounceCount++;
        this.vz = -this.vz * 0.65; // floor bounce restitution
        this.vx *= 0.88;
        this.vy *= 0.88;

        if (window.soundEngine) window.soundEngine.playFloorBounce();
        if (onEvent) onEvent('floor_bounce', { count: this.bounceCount, x: this.x, y: this.y });

        // Double bounce check
        if (this.bounceCount >= 2) {
          this.isDead = true;
          this.deadReason = 'double_bounce';
          if (onEvent) onEvent('double_bounce', { lastHitter: this.lastHitter, x: this.x, y: this.y });
          return;
        }
      }

      // 5. Collision with Back Glass Wall (y >= courtDepth)
      if (this.y >= this.courtDepth && this.vy > 0) {
        this.y = this.courtDepth;
        this.vy = -this.vy * 0.72;
        if (window.soundEngine) window.soundEngine.playWallBounce();
        if (onEvent) onEvent('wall_back', { x: this.x, z: this.z });
      }
    }

    // Record motion trail
    this.trail.push(this.project(window.innerWidth || 800, window.innerHeight || 600));
    if (this.trail.length > 7) {
      this.trail.shift();
    }
  }

  /**
   * Project 3D coordinate (x, y, z) to Screen 2D
   */
  project(w, h, customX = this.x, customY = this.y, customZ = this.z) {
    const fwLeft = w * 0.16;
    const fwRight = w * 0.84;
    const fwTop = h * 0.12;
    const fwBottom = h * 0.44;

    const bcLeft = w * 0.02;
    const bcRight = w * 0.98;
    const bcBottom = h * 0.96;

    const d = Math.max(0, Math.min(1, customY / this.courtDepth));

    const curLeft = fwLeft + (bcLeft - fwLeft) * d;
    const curRight = fwRight + (bcRight - fwRight) * d;
    const curFloorY = fwBottom + (bcBottom - fwBottom) * d;

    const xRatio = (customX + this.courtWidth / 2) / this.courtWidth;
    const screenX = curLeft + (curRight - curLeft) * xRatio;

    const heightScale = ((fwBottom - fwTop) / this.courtHeight) * (0.8 + 0.6 * d);
    const screenY = curFloorY - customZ * heightScale;

    const radius = (w > 600 ? 9 : 7) * (0.55 + 0.55 * d);

    return {
      x: screenX,
      y: screenY,
      floorY: curFloorY,
      radius: radius,
      depthRatio: d
    };
  }

  /**
   * Predict X coordinate when ball reaches target depth Y
   */
  predictAtDepth(targetY) {
    const halfW = this.courtWidth / 2;

    if (this.vy > 0) {
      const timeToY = (targetY - this.y) / this.vy;
      if (timeToY < 0) return { x: this.x, time: 0 };

      let predX = this.x + this.vx * timeToY;
      while (predX < -halfW || predX > halfW) {
        if (predX < -halfW) predX = -halfW + (-halfW - predX);
        if (predX > halfW) predX = halfW - (predX - halfW);
      }
      return { x: predX, time: timeToY };
    } else if (this.vy < 0) {
      const timeToWall = Math.max(0.01, -this.y / this.vy);
      let wallX = this.x + this.vx * timeToWall;
      while (wallX < -halfW || wallX > halfW) {
        if (wallX < -halfW) wallX = -halfW + (-halfW - wallX);
        if (wallX > halfW) wallX = halfW - (wallX - halfW);
      }

      const reboundVy = -this.vy * 0.86;
      const timeFromWallToY = targetY / reboundVy;
      let predX = wallX + this.vx * timeFromWallToY;
      while (predX < -halfW || predX > halfW) {
        if (predX < -halfW) predX = -halfW + (-halfW - predX);
        if (predX > halfW) predX = halfW - (predX - halfW);
      }

      return { x: predX, time: timeToWall + timeFromWallToY };
    }

    return { x: this.x, time: 0 };
  }
}

window.squashPhysics = new SquashPhysics();
