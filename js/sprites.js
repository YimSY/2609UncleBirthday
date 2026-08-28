/**
 * 16-Bit Cute Japanese Anime Pixel Art Engine & Character Renderer
 * Modeled directly after retro GBA / arcade sports anime pixel aesthetics.
 * Clean-shaven Dad, Niece (Amy), Wife (Chris), and Daughter (Kaitlyn).
 */

class SpriteEngine {
  constructor() {
    this.pixelSize = 2; // base unit for crisp anime pixel rendering
  }

  // Draw the full 2.5D Squash Court
  drawCourt(ctx, width, height, cameraY = 0) {
    ctx.save();

    // Perspective coordinates
    const fwLeft = width * 0.16;
    const fwRight = width * 0.84;
    const fwTop = height * 0.12;
    const fwBottom = height * 0.44;
    const fwWidth = fwRight - fwLeft;
    const fwHeight = fwBottom - fwTop;

    const bcLeft = width * 0.02;
    const bcRight = width * 0.98;
    const bcBottom = height * 0.96;

    // 1. Background Arena / Gallery
    const arenaGrad = ctx.createLinearGradient(0, 0, 0, fwTop);
    arenaGrad.addColorStop(0, '#100c22');
    arenaGrad.addColorStop(1, '#241a44');
    ctx.fillStyle = arenaGrad;
    ctx.fillRect(0, 0, width, fwTop);

    // Gallery Balcony / Spectators
    this.drawSpectators(ctx, width, fwTop);

    // 2. Front Wall
    const fwGrad = ctx.createLinearGradient(0, fwTop, 0, fwBottom);
    fwGrad.addColorStop(0, '#e8edf2');
    fwGrad.addColorStop(1, '#cad4de');
    ctx.fillStyle = fwGrad;
    ctx.fillRect(fwLeft, fwTop, fwWidth, fwHeight);

    // Front Wall Red Out-of-Court Line (Top)
    ctx.fillStyle = '#e62434';
    ctx.fillRect(fwLeft, fwTop + fwHeight * 0.08, fwWidth, 4);

    // Front Wall Service Line (Middle)
    ctx.fillStyle = '#e62434';
    ctx.fillRect(fwLeft, fwTop + fwHeight * 0.48, fwWidth, 3);

    // Front Wall "Tin" (Bottom metallic red panel - out of bounds)
    const tinTop = fwTop + fwHeight * 0.76;
    const tinHeight = fwBottom - tinTop;
    const tinGrad = ctx.createLinearGradient(0, tinTop, 0, fwBottom);
    tinGrad.addColorStop(0, '#bd1824');
    tinGrad.addColorStop(0.3, '#ff3b4b');
    tinGrad.addColorStop(1, '#700c14');
    ctx.fillStyle = tinGrad;
    ctx.fillRect(fwLeft, tinTop, fwWidth, tinHeight);

    // Tin highlight line
    ctx.fillStyle = '#ffe6e8';
    ctx.fillRect(fwLeft, tinTop, fwWidth, 2);

    // "THE BIRTHDAY CUP" / "バースデーカップ" Front Wall Billboard Banner
    this.drawCourtBanner(ctx, (fwLeft + fwRight) / 2, fwTop + fwHeight * 0.28, fwWidth * 0.72);

    // 3. Side Walls
    // Left Wall
    const leftWallGrad = ctx.createLinearGradient(0, 0, fwLeft, 0);
    leftWallGrad.addColorStop(0, '#8e9eaf');
    leftWallGrad.addColorStop(1, '#b4c3d2');
    ctx.fillStyle = leftWallGrad;
    ctx.beginPath();
    ctx.moveTo(bcLeft, bcBottom);
    ctx.lineTo(fwLeft, fwBottom);
    ctx.lineTo(fwLeft, fwTop);
    ctx.lineTo(bcLeft, fwTop - height * 0.04);
    ctx.closePath();
    ctx.fill();

    // Left Wall Red Out-Line
    ctx.strokeStyle = '#e62434';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fwLeft, fwTop + fwHeight * 0.08);
    ctx.lineTo(bcLeft, fwTop - height * 0.02);
    ctx.stroke();

    // Right Wall
    const rightWallGrad = ctx.createLinearGradient(fwRight, 0, bcRight, 0);
    rightWallGrad.addColorStop(0, '#b4c3d2');
    rightWallGrad.addColorStop(1, '#8e9eaf');
    ctx.fillStyle = rightWallGrad;
    ctx.beginPath();
    ctx.moveTo(fwRight, fwBottom);
    ctx.lineTo(bcRight, bcBottom);
    ctx.lineTo(bcRight, fwTop - height * 0.04);
    ctx.lineTo(fwRight, fwTop);
    ctx.closePath();
    ctx.fill();

    // Right Wall Red Out-Line
    ctx.strokeStyle = '#e62434';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fwRight, fwTop + fwHeight * 0.08);
    ctx.lineTo(bcRight, fwTop - height * 0.02);
    ctx.stroke();

    // 4. Hardwood Squash Floor with Warm Wood Grid Planks
    this.drawWoodFloor(ctx, fwLeft, fwRight, fwBottom, bcLeft, bcRight, bcBottom);

    // 5. Floor Lines (Red)
    this.drawFloorLines(ctx, fwLeft, fwRight, fwBottom, bcLeft, bcRight, bcBottom);

    // Glass Wall reflections
    this.drawBackGlass(ctx, width, height, bcLeft, bcRight, bcBottom);

    ctx.restore();
  }

  // Draw Gallery Spectators
  drawSpectators(ctx, width, galleryBottom) {
    ctx.fillStyle = '#2d274c';
    ctx.fillRect(0, galleryBottom - 18, width, 18);
    ctx.fillStyle = '#4f447d';
    ctx.fillRect(0, galleryBottom - 20, width, 3);

    const time = Date.now() * 0.003;
    const colors = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#e63946', '#a8dadc', '#ffb703'];
    for (let x = 12; x < width - 12; x += 22) {
      const bob = Math.sin(time + x * 0.5) * 2;
      const col = colors[Math.floor(x * 7) % colors.length];
      ctx.fillStyle = '#fcd5b5';
      ctx.fillRect(x, galleryBottom - 34 + bob, 10, 10);
      ctx.fillStyle = col;
      ctx.fillRect(x - 1, galleryBottom - 37 + bob, 12, 5);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 2, galleryBottom - 30 + bob, 2, 2);
      ctx.fillRect(x + 6, galleryBottom - 30 + bob, 2, 2);
      ctx.fillStyle = col;
      ctx.fillRect(x - 2, galleryBottom - 24 + bob, 14, 8);
    }
  }

  // Front Wall Tournament Banner
  drawCourtBanner(ctx, cx, cy, bannerWidth) {
    const bh = 32;
    ctx.fillStyle = '#1c2038';
    ctx.fillRect(cx - bannerWidth / 2, cy - bh / 2, bannerWidth, bh);
    ctx.strokeStyle = '#f4d03f';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bannerWidth / 2, cy - bh / 2, bannerWidth, bh);

    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.moveTo(cx - bannerWidth / 2, cy - bh / 2);
    ctx.lineTo(cx - bannerWidth / 2 + 10, cy - bh / 2);
    ctx.lineTo(cx - bannerWidth / 2, cy - bh / 2 + 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + bannerWidth / 2, cy - bh / 2);
    ctx.lineTo(cx + bannerWidth / 2 - 10, cy - bh / 2);
    ctx.lineTo(cx + bannerWidth / 2, cy - bh / 2 + 10);
    ctx.fill();

    ctx.fillStyle = '#f4d03f';
    ctx.font = 'bold 11px "Courier New", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ THE BIRTHDAY CUP 2026 ★', cx, cy - 5);
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px "Courier New", monospace, sans-serif';
    ctx.fillText('バースデー・スカッシュ選手権', cx, cy + 8);
  }

  // Draw Wood Floor with Warm Perspective Planks
  drawWoodFloor(ctx, fwL, fwR, fwB, bcL, bcR, bcB) {
    const floorGrad = ctx.createLinearGradient(0, fwB, 0, bcB);
    floorGrad.addColorStop(0, '#c7925b');
    floorGrad.addColorStop(1, '#e2ad72');
    ctx.fillStyle = floorGrad;

    ctx.beginPath();
    ctx.moveTo(fwL, fwB);
    ctx.lineTo(fwR, fwB);
    ctx.lineTo(bcR, bcB);
    ctx.lineTo(bcL, bcB);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(140, 85, 35, 0.35)';
    ctx.lineWidth = 1;
    const numPlanks = 16;
    for (let i = 0; i <= numPlanks; i++) {
      const ratio = i / numPlanks;
      const xTop = fwL + (fwR - fwL) * ratio;
      const xBot = bcL + (bcR - bcL) * ratio;
      ctx.beginPath();
      ctx.moveTo(xTop, fwB);
      ctx.lineTo(xBot, bcB);
      ctx.stroke();
    }
  }

  // Draw Floor Service Boxes and Out Lines
  drawFloorLines(ctx, fwL, fwR, fwB, bcL, bcR, bcB) {
    ctx.strokeStyle = '#e62434';
    ctx.lineWidth = 3;

    // Short Line
    const shortLineDepth = 0.52;
    const slL = fwL + (bcL - fwL) * shortLineDepth;
    const slR = fwR + (bcR - fwR) * shortLineDepth;
    const slY = fwB + (bcB - fwB) * shortLineDepth;

    ctx.beginPath();
    ctx.moveTo(slL, slY);
    ctx.lineTo(slR, slY);
    ctx.stroke();

    // Half Court Line
    const halfTopX = (slL + slR) / 2;
    const halfBotX = (bcL + bcR) / 2;
    ctx.beginPath();
    ctx.moveTo(halfTopX, slY);
    ctx.lineTo(halfBotX, bcB);
    ctx.stroke();

    // Left Service Box
    const sBoxL_X = slL + (slR - slL) * 0.32;
    const sBoxB_Y = slY + (bcB - slY) * 0.40;
    const sBoxBL_X = fwL + (bcL - fwL) * (shortLineDepth + 0.18) + ((fwR + (bcR - fwR) * (shortLineDepth + 0.18)) - (fwL + (bcL - fwL) * (shortLineDepth + 0.18))) * 0.32;

    ctx.beginPath();
    ctx.moveTo(sBoxL_X, slY);
    ctx.lineTo(sBoxBL_X, sBoxB_Y);
    ctx.lineTo(fwL + (bcL - fwL) * (shortLineDepth + 0.18), sBoxB_Y);
    ctx.stroke();

    // Right Service Box
    const sBoxR_X = slL + (slR - slL) * 0.68;
    const sBoxBR_X = fwL + (bcL - fwL) * (shortLineDepth + 0.18) + ((fwR + (bcR - fwR) * (shortLineDepth + 0.18)) - (fwL + (bcL - fwL) * (shortLineDepth + 0.18))) * 0.68;

    ctx.beginPath();
    ctx.moveTo(sBoxR_X, slY);
    ctx.lineTo(sBoxBR_X, sBoxB_Y);
    ctx.lineTo(fwR + (bcR - fwR) * (shortLineDepth + 0.18), sBoxB_Y);
    ctx.stroke();
  }

  // Back Glass Frame
  drawBackGlass(ctx, width, height, bcL, bcR, bcB) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, bcB, width, height - bcB);

    ctx.fillStyle = '#e62434';
    ctx.fillRect(0, bcB, width, 4);

    const sheenGrad = ctx.createLinearGradient(0, bcB, width, height);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0.0)');
    sheenGrad.addColorStop(0.3, 'rgba(255,255,255,0.12)');
    sheenGrad.addColorStop(0.35, 'rgba(255,255,255,0.0)');
    sheenGrad.addColorStop(0.65, 'rgba(255,255,255,0.08)');
    sheenGrad.addColorStop(0.7, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, bcB, width, height - bcB);
  }

  // -------------------------------------------------------------
  // CUTE ANIME PIXEL ART CHARACTER RENDERING (GBA / ARCADE STYLE)
  // -------------------------------------------------------------

  /**
   * Draw Character
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x Screen center X
   * @param {number} y Screen feet Y
   * @param {number} scale Scale multiplier
   * @param {string} role 'dad' | 'niece' | 'wife' | 'daughter'
   * @param {object} anim { state: 'idle'|'run'|'swing'|'smash'|'win'|'sad', frame: number, dir: 1|-1, swingProg: 0..1 }
   */
  drawCharacter(ctx, x, y, scale, role, anim = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * (anim.dir || 1), scale);

    const u = 1.35; // base pixel unit size for crisp high-def anime pixel art

    // Realistic Directional Floor Cast Shadow (matches reference image)
    ctx.fillStyle = 'rgba(30, 20, 15, 0.48)';
    ctx.beginPath();
    ctx.ellipse(6 * u, 2 * u, 18 * u, 7 * u, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const bob = anim.state === 'idle' 
      ? Math.sin((anim.frame || 0) * 0.15) * 1.5 
      : (anim.state === 'run' ? Math.abs(Math.sin((anim.frame || 0) * 0.4)) * 3.5 : 0);
    const legOffset = anim.state === 'run' ? Math.sin((anim.frame || 0) * 0.4) * 8 : 0;

    switch (role) {
      case 'dad':
        this.drawCuteDad(ctx, u, bob, legOffset, anim);
        break;
      case 'niece':
        this.drawCuteAmy(ctx, u, bob, legOffset, anim);
        break;
      case 'wife':
        this.drawCuteChris(ctx, u, bob, legOffset, anim);
        break;
      case 'daughter':
        this.drawCuteKaitlyn(ctx, u, bob, legOffset, anim);
        break;
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 1. CUTE DAD (NO MUSTACHE, FLUFFY DARK HAIR, NAVY ATHLETIC SUIT)
  // Recreated exactly from reference image: handsome anime dad!
  // -------------------------------------------------------------
  drawCuteDad(ctx, u, bob, legOffset, anim) {
    const baseY = -bob;

    if (anim.state === 'sad') {
      this.drawCuteSadDad(ctx, u);
      return;
    }

    // --- LEGS & ATHLETIC SHOES ---
    // Left Leg / Shoe (White sneakers with blue trim, like reference)
    const lX = -12 * u + legOffset;
    const rX = 4 * u - legOffset;

    // Back leg (Left)
    this.drawShoe(ctx, u, lX, baseY, '#ffffff', '#243b6b');
    ctx.fillStyle = '#fed0bb'; // Skin
    ctx.fillRect(lX + 3 * u, baseY - 18 * u, 6 * u, 10 * u);
    // White sock with blue ring
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lX + 2 * u, baseY - 12 * u, 7 * u, 6 * u);
    ctx.fillStyle = '#243b6b';
    ctx.fillRect(lX + 2 * u, baseY - 10 * u, 7 * u, 2 * u);

    // Front leg (Right)
    this.drawShoe(ctx, u, rX, baseY, '#ffffff', '#243b6b');
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(rX + 3 * u, baseY - 18 * u, 6 * u, 10 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rX + 2 * u, baseY - 12 * u, 7 * u, 6 * u);
    ctx.fillStyle = '#243b6b';
    ctx.fillRect(rX + 2 * u, baseY - 10 * u, 7 * u, 2 * u);

    // --- NAVY SHORTS WITH WHITE PIPING (Reference exact match) ---
    ctx.fillStyle = '#1e2c4f'; // Base navy
    ctx.fillRect(-12 * u, baseY - 28 * u, 24 * u, 12 * u);
    // Dark navy shading
    ctx.fillStyle = '#141d36';
    ctx.fillRect(-12 * u, baseY - 20 * u, 24 * u, 4 * u);
    // White athletic stripe piping
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12 * u, baseY - 24 * u, 24 * u, 2 * u);

    // --- NAVY ATHLETIC JERSEY (V-Neck, White shoulder stripe) ---
    ctx.fillStyle = '#243b6b'; // Main jersey
    ctx.fillRect(-12 * u, baseY - 50 * u, 24 * u, 23 * u);
    // Jersey shadow & fold
    ctx.fillStyle = '#18274a';
    ctx.fillRect(-12 * u, baseY - 35 * u, 24 * u, 8 * u);
    // White shoulder stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-12 * u, baseY - 48 * u, 24 * u, 2.5 * u);
    ctx.fillRect(-12 * u, baseY - 42 * u, 2.5 * u, 12 * u); // side vertical piping

    // Birthday Ribbon Badge "★ #1 DAD ★"
    ctx.fillStyle = '#e62434';
    ctx.fillRect(-2 * u, baseY - 48 * u, 8 * u, 3 * u);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(2 * u, baseY - 46 * u, 3.5 * u, 0, Math.PI * 2);
    ctx.fill();

    // --- ARMS & RACKET (Dynamic Swing Angle) ---
    this.drawAnimeArmAndRacket(ctx, u, baseY, anim, '#fed0bb', '#1e2c4f', '#243b6b', '#e62434');

    // --- HEAD & FACE (CLEAN SHAVEN, NO MUSTACHE, CUTE ANIME EYE) ---
    // Neck
    ctx.fillStyle = '#e5a582';
    ctx.fillRect(-4 * u, baseY - 54 * u, 8 * u, 5 * u);

    // Cute Anime Face Profile
    ctx.fillStyle = '#fed0bb'; // Base warm skin tone
    ctx.fillRect(-10 * u, baseY - 70 * u, 20 * u, 18 * u);
    // Jaw / Chin contour
    ctx.beginPath();
    ctx.moveTo(-10 * u, baseY - 60 * u);
    ctx.lineTo(-6 * u, baseY - 52 * u);
    ctx.lineTo(6 * u, baseY - 52 * u);
    ctx.lineTo(10 * u, baseY - 60 * u);
    ctx.closePath();
    ctx.fill();

    // Cute Anime Ear
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(8 * u, baseY - 65 * u, 4 * u, 7 * u);
    ctx.fillStyle = '#d89370';
    ctx.fillRect(9 * u, baseY - 63 * u, 2 * u, 4 * u);

    // BIG CUTE ANIME EYE (With bright highlight!)
    // Eyebrow
    ctx.fillStyle = '#1e1c2e';
    ctx.fillRect(-5 * u, baseY - 69 * u, 7 * u, 2.2 * u);
    // Eye black contour
    ctx.fillStyle = '#111222';
    ctx.fillRect(-5 * u, baseY - 66 * u, 6 * u, 6 * u);
    // Iris deep navy
    ctx.fillStyle = '#2b3a67';
    ctx.fillRect(-4 * u, baseY - 65 * u, 4.5 * u, 4.5 * u);
    // White catchlight highlight (Top-left 2x2 shine)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5 * u, baseY - 66 * u, 2.5 * u, 2.5 * u);
    ctx.fillRect(-2 * u, baseY - 63 * u, 1.5 * u, 1.5 * u);

    // NO MUSTACHE - CLEAN SHAVEN CUTE MOUTH
    if (anim.state === 'win') {
      // Big happy open smile
      ctx.fillStyle = '#d81159';
      ctx.fillRect(-3 * u, baseY - 58 * u, 7 * u, 4 * u);
      ctx.fillStyle = '#ffffff'; // teeth shine
      ctx.fillRect(-2 * u, baseY - 58 * u, 5 * u, 1.5 * u);
    } else {
      // Determined cute anime mouth line
      ctx.fillStyle = '#c47253';
      ctx.fillRect(-3 * u, baseY - 56 * u, 5 * u, 2 * u);
    }

    // --- FLUFFY SPIKY DARK ANIME HAIR (Exact match to reference image!) ---
    this.drawFluffySpikyHair(ctx, u, baseY, '#181824', '#2b2c44', '#45476a', '#686a94', anim);
  }

  // Fluffy Spiky Hair Drawing (Layered pixel clusters)
  drawFluffySpikyHair(ctx, u, baseY, colDark, colMid, colLight, colShine, anim) {
    ctx.save();
    // Base hair volume
    ctx.fillStyle = colDark;
    ctx.fillRect(-13 * u, baseY - 78 * u, 26 * u, 15 * u);

    // Spiky tufts on top & crown
    const spikes = [
      { x: -14, y: -76, w: 6, h: 6 },
      { x: -11, y: -81, w: 7, h: 7 },
      { x: -6,  y: -84, w: 8, h: 8 },
      { x: 0,   y: -85, w: 8, h: 8 },
      { x: 6,   y: -82, w: 7, h: 7 },
      { x: 10,  y: -77, w: 6, h: 6 },
      // Sideburn tufts
      { x: -13, y: -68, w: 5, h: 7 },
      { x: 8,   y: -68, w: 5, h: 8 }
    ];

    spikes.forEach(s => {
      ctx.fillStyle = colDark;
      ctx.fillRect(s.x * u, baseY + s.y * u, s.w * u, s.h * u);
    });

    // Midtone hair layers
    ctx.fillStyle = colMid;
    ctx.fillRect(-10 * u, baseY - 77 * u, 20 * u, 10 * u);
    ctx.fillRect(-4 * u, baseY - 82 * u, 10 * u, 6 * u);

    // Top glossy anime light highlights (soft cross-hatch shine)
    ctx.fillStyle = colLight;
    ctx.fillRect(-8 * u, baseY - 78 * u, 16 * u, 3.5 * u);
    ctx.fillStyle = colShine;
    ctx.fillRect(-4 * u, baseY - 77 * u, 8 * u, 2 * u);

    // Forehead bangs (spiky fringe across brow)
    ctx.fillStyle = colDark;
    ctx.fillRect(-9 * u, baseY - 69 * u, 4 * u, 5 * u);
    ctx.fillRect(-4 * u, baseY - 70 * u, 4 * u, 6 * u);
    ctx.fillRect(1 * u, baseY - 69 * u, 4 * u, 4 * u);

    ctx.restore();
  }

  // Sad Dad pose for defeat screen (Cute chibi slump)
  drawCuteSadDad(ctx, u) {
    const baseY = 0;
    // Slumped legs
    this.drawShoe(ctx, u, -10 * u, baseY, '#ffffff', '#243b6b');
    this.drawShoe(ctx, u, 2 * u, baseY, '#ffffff', '#243b6b');
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(-8 * u, baseY - 12 * u, 5 * u, 8 * u);
    ctx.fillRect(3 * u, baseY - 12 * u, 5 * u, 8 * u);
    ctx.fillStyle = '#1e2c4f';
    ctx.fillRect(-11 * u, baseY - 22 * u, 22 * u, 10 * u);

    // Slumped jersey
    ctx.fillStyle = '#243b6b';
    ctx.fillRect(-11 * u, baseY - 40 * u, 22 * u, 19 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11 * u, baseY - 38 * u, 22 * u, 2 * u);

    // Drooped head
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(-9 * u, baseY - 56 * u, 18 * u, 16 * u);

    // Sad downturned eyebrows & cute teardrops
    ctx.fillStyle = '#181824';
    ctx.fillRect(-6 * u, baseY - 52 * u, 4 * u, 2 * u);
    ctx.fillRect(2 * u, baseY - 52 * u, 4 * u, 2 * u);

    // Big tear streaming down cheek
    ctx.fillStyle = '#4cc9f0';
    const tearY = (Date.now() * 0.015) % 16;
    ctx.fillRect(-5 * u, baseY - 48 * u + tearY, 2.5 * u, 3.5 * u);
    ctx.fillRect(3 * u, baseY - 48 * u + tearY, 2.5 * u, 3.5 * u);

    // Wavy cute sad mouth
    ctx.fillStyle = '#a84646';
    ctx.fillRect(-3 * u, baseY - 43 * u, 6 * u, 2 * u);

    // Fluffy hair drooped
    this.drawFluffySpikyHair(ctx, u, baseY + 12 * u, '#181824', '#2b2c44', '#45476a', '#686a94', {});

    // Racket resting on court floor
    ctx.fillStyle = '#333';
    ctx.fillRect(-18 * u, baseY - 2 * u, 16 * u, 2 * u);
    ctx.strokeStyle = '#e62434';
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(-24 * u, baseY - 6 * u, 8 * u, 6 * u);
  }

  // -------------------------------------------------------------
  // 2. NIECE (Amy, 27yo - Cute Anime Young Woman, High Ponytail)
  // -------------------------------------------------------------
  drawCuteAmy(ctx, u, bob, legOffset, anim) {
    const baseY = -bob;

    // Stylish mint & white sneakers
    const lX = -11 * u + legOffset;
    const rX = 3 * u - legOffset;
    this.drawShoe(ctx, u, lX, baseY, '#ffffff', '#06d6a0');
    this.drawShoe(ctx, u, rX, baseY, '#ffffff', '#06d6a0');

    // Legs & Black athletic leggings
    ctx.fillStyle = '#212529';
    ctx.fillRect(lX + 3 * u, baseY - 18 * u, 5 * u, 12 * u);
    ctx.fillRect(rX + 3 * u, baseY - 18 * u, 5 * u, 12 * u);

    // Mint Green Tennis Skort
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(-10 * u, baseY - 25 * u, 20 * u, 8 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10 * u, baseY - 23 * u, 20 * u, 1.5 * u);

    // Mint & White Athletic Top
    ctx.fillStyle = '#48cae4';
    ctx.fillRect(-10 * u, baseY - 46 * u, 20 * u, 22 * u);
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(-10 * u, baseY - 46 * u, 20 * u, 14 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10 * u, baseY - 44 * u, 20 * u, 2 * u);

    // Arms & Racket
    this.drawAnimeArmAndRacket(ctx, u, baseY, anim, '#fed0bb', '#06d6a0', '#48cae4', '#ff6b6b');

    // Head & Face
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(-9 * u, baseY - 66 * u, 18 * u, 18 * u);

    // Big Sparkly Anime Eyes with Eyelashes
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(-5 * u, baseY - 62 * u, 4 * u, 5 * u);
    ctx.fillRect(2 * u, baseY - 62 * u, 4 * u, 5 * u);
    // Catchlight shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5 * u, baseY - 62 * u, 2 * u, 2 * u);
    ctx.fillRect(2 * u, baseY - 62 * u, 2 * u, 2 * u);

    // Cute Pink Blush Cheeks
    ctx.fillStyle = 'rgba(255, 105, 180, 0.65)';
    ctx.fillRect(-8 * u, baseY - 57 * u, 3.5 * u, 2.5 * u);
    ctx.fillRect(4 * u, baseY - 57 * u, 3.5 * u, 2.5 * u);

    // Cheerful Smile
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-2 * u, baseY - 54 * u, 5 * u, 2 * u);

    // Warm Chestnut Hair with Cute High Ponytail & Bangs
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-11 * u, baseY - 74 * u, 22 * u, 12 * u);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-8 * u, baseY - 73 * u, 16 * u, 3 * u); // highlight

    // Forehead soft bangs
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-9 * u, baseY - 66 * u, 4 * u, 5 * u);
    ctx.fillRect(-3 * u, baseY - 67 * u, 4 * u, 6 * u);
    ctx.fillRect(2 * u, baseY - 66 * u, 4 * u, 4 * u);

    // Turquoise Scrunchie & Bouncing Ponytail
    ctx.fillStyle = '#06d6a0';
    ctx.fillRect(9 * u, baseY - 72 * u, 5 * u, 5 * u);

    const ponyWag = Math.sin((anim.frame || 0) * 0.35) * 4 * u;
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(11 * u, baseY - 70 * u);
    ctx.quadraticCurveTo(22 * u + ponyWag, baseY - 58 * u, 16 * u + ponyWag, baseY - 38 * u);
    ctx.lineTo(10 * u + ponyWag, baseY - 42 * u);
    ctx.closePath();
    ctx.fill();
  }

  // -------------------------------------------------------------
  // 3. WIFE (Chris, ~40yo - Cute Elegant Lady with Chic Short Bob)
  // -------------------------------------------------------------
  drawCuteChris(ctx, u, bob, legOffset, anim) {
    const baseY = -bob;

    // Classic white tennis court shoes with royal blue accents
    const lX = -11 * u + legOffset;
    const rX = 3 * u - legOffset;
    this.drawShoe(ctx, u, lX, baseY, '#ffffff', '#1d3557');
    this.drawShoe(ctx, u, rX, baseY, '#ffffff', '#1d3557');

    // Legs
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(lX + 3 * u, baseY - 18 * u, 5 * u, 12 * u);
    ctx.fillRect(rX + 3 * u, baseY - 18 * u, 5 * u, 12 * u);

    // Royal Blue & Gold Squash Skirt
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(-10 * u, baseY - 26 * u, 20 * u, 9 * u);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-10 * u, baseY - 20 * u, 20 * u, 2 * u); // gold hem

    // Navy / Royal Blue Athletic Polo
    ctx.fillStyle = '#27496d';
    ctx.fillRect(-11 * u, baseY - 48 * u, 22 * u, 23 * u);
    // White collar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6 * u, baseY - 50 * u, 12 * u, 4 * u);

    // Arms & Racket
    this.drawAnimeArmAndRacket(ctx, u, baseY, anim, '#fed0bb', '#1d3557', '#27496d', '#ffd166');

    // Head & Face
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(-9 * u, baseY - 67 * u, 18 * u, 18 * u);

    // Confident, Loving Anime Eyes with Eyelashes
    ctx.fillStyle = '#111827';
    ctx.fillRect(-5 * u, baseY - 63 * u, 4 * u, 4 * u);
    ctx.fillRect(2 * u, baseY - 63 * u, 4 * u, 4 * u);
    // Catchlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5 * u, baseY - 63 * u, 2 * u, 2 * u);
    ctx.fillRect(2 * u, baseY - 63 * u, 2 * u, 2 * u);
    // Eyeliner / lashes
    ctx.fillStyle = '#000000';
    ctx.fillRect(-6 * u, baseY - 64 * u, 5 * u, 1.5 * u);
    ctx.fillRect(2 * u, baseY - 64 * u, 5 * u, 1.5 * u);

    // Elegant Lipstick Smile
    ctx.fillStyle = '#d81159';
    ctx.fillRect(-2 * u, baseY - 55 * u, 5 * u, 2 * u);

    // Chic Short Bob Haircut (Black with sleek violet-tint highlight)
    ctx.fillStyle = '#1f1d2b';
    ctx.fillRect(-12 * u, baseY - 74 * u, 24 * u, 12 * u);
    // Sleek Bob Curves along cheeks
    ctx.fillRect(-12 * u, baseY - 66 * u, 4 * u, 14 * u);
    ctx.fillRect(8 * u, baseY - 66 * u, 4 * u, 14 * u);
    // Glossy hair highlight
    ctx.fillStyle = '#5c5470';
    ctx.fillRect(-8 * u, baseY - 73 * u, 16 * u, 3 * u);

    // Sporty White Visor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11 * u, baseY - 70 * u, 22 * u, 3 * u);
    ctx.fillRect(7 * u, baseY - 70 * u, 6 * u, 2.5 * u); // visor brim
  }

  // -------------------------------------------------------------
  // 4. DAUGHTER (Kaitlyn, 18yo - Energetic Anime Girl, Twin Tails)
  // -------------------------------------------------------------
  drawCuteKaitlyn(ctx, u, bob, legOffset, anim) {
    const baseY = -bob;

    // High-top neon yellow sneakers
    const lX = -11 * u + legOffset;
    const rX = 3 * u - legOffset;
    this.drawShoe(ctx, u, lX, baseY, '#ffbe0b', '#ff006e');
    this.drawShoe(ctx, u, rX, baseY, '#ffbe0b', '#ff006e');

    // Striped Knee-High Athletic Socks & Legs
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(lX + 3 * u, baseY - 18 * u, 5 * u, 10 * u);
    ctx.fillRect(rX + 3 * u, baseY - 18 * u, 5 * u, 10 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lX + 2 * u, baseY - 16 * u, 6 * u, 8 * u);
    ctx.fillRect(rX + 2 * u, baseY - 16 * u, 6 * u, 8 * u);
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(lX + 2 * u, baseY - 14 * u, 6 * u, 2 * u);
    ctx.fillRect(rX + 2 * u, baseY - 14 * u, 6 * u, 2 * u);

    // Neon Pink Athletic Skort
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(-10 * u, baseY - 25 * u, 20 * u, 8 * u);

    // Black & Gold Varsity Tank Top with "#3"
    ctx.fillStyle = '#212529';
    ctx.fillRect(-10 * u, baseY - 46 * u, 20 * u, 22 * u);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(-3 * u, baseY - 40 * u, 6 * u, 8 * u); // number 3
    ctx.fillStyle = '#212529';
    ctx.fillRect(-1 * u, baseY - 38 * u, 3 * u, 2 * u);
    ctx.fillRect(-1 * u, baseY - 35 * u, 3 * u, 2 * u);

    // Arms & Fast Racket
    this.drawAnimeArmAndRacket(ctx, u, baseY, anim, '#fed0bb', '#212529', '#ff006e', '#ffbe0b');

    // Head & Face
    ctx.fillStyle = '#fed0bb';
    ctx.fillRect(-9 * u, baseY - 65 * u, 18 * u, 18 * u);

    // Fierce Competitive Purple Anime Eyes
    ctx.fillStyle = '#8338ec';
    ctx.fillRect(-5 * u, baseY - 61 * u, 4.5 * u, 5 * u);
    ctx.fillRect(2 * u, baseY - 61 * u, 4.5 * u, 5 * u);
    // Catchlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4.5 * u, baseY - 61 * u, 2 * u, 2 * u);
    ctx.fillRect(2.5 * u, baseY - 61 * u, 2 * u, 2 * u);

    // Competitive Smirk
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(-1 * u, baseY - 53 * u, 5 * u, 2 * u);

    // Black Hair with Neon Ribbons & Twin Tails
    ctx.fillStyle = '#1c1a24';
    ctx.fillRect(-11 * u, baseY - 73 * u, 22 * u, 12 * u);
    ctx.fillStyle = '#4a4659';
    ctx.fillRect(-7 * u, baseY - 72 * u, 14 * u, 3 * u); // shine

    // Forehead bangs
    ctx.fillStyle = '#1c1a24';
    ctx.fillRect(-9 * u, baseY - 65 * u, 4 * u, 5 * u);
    ctx.fillRect(-3 * u, baseY - 66 * u, 4 * u, 6 * u);
    ctx.fillRect(2 * u, baseY - 65 * u, 4 * u, 4 * u);

    // Neon Yellow Hair Ribbons
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(-13 * u, baseY - 71 * u, 4 * u, 4 * u);
    ctx.fillRect(9 * u, baseY - 71 * u, 4 * u, 4 * u);

    const twinWag = Math.sin((anim.frame || 0) * 0.45) * 5 * u;
    ctx.fillStyle = '#1c1a24';
    // Left twin tail
    ctx.beginPath();
    ctx.moveTo(-12 * u, baseY - 69 * u);
    ctx.quadraticCurveTo(-22 * u - twinWag, baseY - 55 * u, -16 * u - twinWag, baseY - 36 * u);
    ctx.lineTo(-10 * u - twinWag, baseY - 40 * u);
    ctx.closePath();
    ctx.fill();

    // Right twin tail
    ctx.beginPath();
    ctx.moveTo(12 * u, baseY - 69 * u);
    ctx.quadraticCurveTo(22 * u + twinWag, baseY - 55 * u, 16 * u + twinWag, baseY - 36 * u);
    ctx.lineTo(10 * u + twinWag, baseY - 40 * u);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Athletic Shoe helper
  drawShoe(ctx, u, x, baseY, mainCol, trimCol) {
    ctx.fillStyle = mainCol;
    ctx.fillRect(x, baseY - 6 * u, 10 * u, 6 * u);
    ctx.fillStyle = '#111'; // Rubber outsole
    ctx.fillRect(x, baseY - 2 * u, 10 * u, 2 * u);
    ctx.fillStyle = trimCol;
    ctx.fillRect(x + 2 * u, baseY - 5 * u, 6 * u, 2 * u);
  }

  // Draw Dynamic Arm & Squash Racket
  drawAnimeArmAndRacket(ctx, u, baseY, anim, skinCol, sleeveDark, sleeveCol, racketCol) {
    ctx.save();
    let swingAngle = -0.35; // ready stance angle

    if (anim.state === 'swing') {
      const p = anim.swingProg || 0;
      swingAngle = -1.3 + p * 2.8; // dynamic swing arc
    } else if (anim.state === 'smash') {
      const p = anim.swingProg || 0;
      swingAngle = -2.3 + p * 3.6;
    } else if (anim.state === 'win') {
      swingAngle = -2.4; // triumphant celebration
    }

    // Shoulder & Sleeve
    ctx.fillStyle = sleeveCol;
    ctx.fillRect(6 * u, baseY - 48 * u, 7 * u, 7 * u);
    ctx.fillStyle = sleeveDark;
    ctx.fillRect(6 * u, baseY - 44 * u, 7 * u, 3 * u);

    // Arm Rotation
    ctx.translate(9 * u, baseY - 43 * u);
    ctx.rotate(swingAngle);

    // Forearm & Wristband
    ctx.fillStyle = skinCol;
    ctx.fillRect(0, -3.5 * u, 16 * u, 6 * u);
    ctx.fillStyle = racketCol; // Wristband
    ctx.fillRect(10 * u, -3.5 * u, 4 * u, 6 * u);

    // Hand gripping racket
    ctx.fillStyle = skinCol;
    ctx.fillRect(15 * u, -3 * u, 5 * u, 5 * u);

    // Squash Racket Shaft & Grip
    ctx.fillStyle = '#222222';
    ctx.fillRect(18 * u, -2 * u, 18 * u, 3.5 * u);

    // Racket Teardrop Head Frame
    ctx.strokeStyle = racketCol;
    ctx.lineWidth = 3.5 * u;
    ctx.beginPath();
    ctx.ellipse(42 * u, 0, 11 * u, 8 * u, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Racket Cross Strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(34 * u, 0);
    ctx.lineTo(50 * u, 0);
    ctx.moveTo(42 * u, -6 * u);
    ctx.lineTo(42 * u, 6 * u);
    ctx.stroke();

    // Swing swoosh arc
    if (anim.state === 'swing' && anim.swingProg > 0.2 && anim.swingProg < 0.85) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4 * u;
      ctx.beginPath();
      ctx.arc(0, 0, 46 * u, -0.6, 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // SQUASH BALL RENDERING
  // -------------------------------------------------------------
  drawBall(ctx, screenX, screenY, floorY, radius, isSmash = false, motionTrail = []) {
    ctx.save();

    // 1. Ball Shadow on Floor
    const heightAboveFloor = Math.max(0, floorY - screenY);
    const shadowScale = Math.max(0.2, 1 - heightAboveFloor / 220);
    const shadowAlpha = Math.max(0.15, 0.55 - heightAboveFloor / 300);

    ctx.fillStyle = `rgba(15, 10, 5, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(screenX, floorY, radius * 1.5 * shadowScale, radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Motion Trail for Fast Drives / Smashes
    if (motionTrail && motionTrail.length > 1) {
      for (let i = 0; i < motionTrail.length; i++) {
        const pt = motionTrail[i];
        const alpha = (i / motionTrail.length) * (isSmash ? 0.6 : 0.35);
        ctx.fillStyle = isSmash ? `rgba(255, 180, 50, ${alpha})` : `rgba(80, 80, 90, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius * (0.5 + 0.5 * (i / motionTrail.length)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Matte Black Rubber Ball
    const ballGrad = ctx.createRadialGradient(
      screenX - radius * 0.3, screenY - radius * 0.3, radius * 0.1,
      screenX, screenY, radius
    );
    ballGrad.addColorStop(0, isSmash ? '#ffd166' : '#495057');
    ballGrad.addColorStop(0.6, '#212529');
    ballGrad.addColorStop(1, '#000000');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Double Yellow Competition Dots
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(screenX - radius * 0.25, screenY - radius * 0.1, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(screenX + radius * 0.25, screenY - radius * 0.1, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // HIT EFFECTS & FLOATING TEXT FX
  // -------------------------------------------------------------
  drawHitEffect(ctx, x, y, progress, isSmash = false) {
    ctx.save();
    const p = progress;
    const radius = 10 + p * 35;
    const alpha = 1 - p;

    ctx.strokeStyle = isSmash ? `rgba(255, 220, 50, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    const count = 8;
    ctx.fillStyle = isSmash ? '#ffbe0b' : '#ffffff';
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 8 + p * 40;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }

    ctx.restore();
  }

  // Floating Arcade Text Banner
  drawFloatingText(ctx, text, subtext, x, y, alpha, scale = 1, color = '#ffd700') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px "Courier New", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 2, 2);

    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);

    if (subtext) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
      ctx.fillText(subtext, 1, 23);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtext, 0, 22);
    }

    ctx.restore();
  }
}

window.spriteEngine = new SpriteEngine();
