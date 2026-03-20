/* bg.js — Spooner Labs background system
   Backgrounds: constellations, shooting stars, solar system, fireworks
   Randomly selected on load; footer switcher to change manually
   F key toggles fireworks; fireworks auto-load on US+EU holidays       */

(function () {
  'use strict';

  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();

  function rand(a, b)     { return a + Math.random() * (b - a); }
  function randInt(a, b)  { return Math.floor(a + Math.random() * (b - a + 1)); }

  /* ══════════════════════════════════════════════════════════
     CONSTELLATION DATA
     Stars: [x, y, magnitude]  x/y in 0..1,  mag 1=bright 4=dim
     Lines: [idx_a, idx_b]
  ══════════════════════════════════════════════════════════ */
  var CONSTELLATIONS = [
    { name: 'Orion',
      stars: [[0.38,0.22,1],[0.62,0.24,2],[0.50,0.09,3],
               [0.42,0.48,2],[0.50,0.46,2],[0.58,0.44,2],
               [0.36,0.72,1],[0.66,0.75,1]],
      lines: [[0,3],[1,5],[3,4],[4,5],[3,6],[5,7],[0,2],[1,2],[0,1]] },

    { name: 'Ursa Major',
      stars: [[0.18,0.46,2],[0.28,0.52,2],[0.34,0.40,2],[0.26,0.33,2],
               [0.40,0.28,2],[0.54,0.22,2],[0.68,0.18,3]],
      lines: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]] },

    { name: 'Cassiopeia',
      stars: [[0.14,0.46,2],[0.30,0.30,1],[0.50,0.44,2],[0.68,0.28,2],[0.84,0.40,2]],
      lines: [[0,1],[1,2],[2,3],[3,4]] },

    { name: 'Cygnus',
      stars: [[0.50,0.14,1],[0.50,0.38,2],[0.50,0.65,2],[0.24,0.36,2],[0.76,0.36,2]],
      lines: [[0,1],[1,2],[3,1],[1,4]] },

    { name: 'Leo',
      stars: [[0.56,0.24,1],[0.46,0.32,2],[0.36,0.26,2],[0.28,0.18,3],
               [0.30,0.10,2],[0.42,0.10,3],[0.54,0.14,3],
               [0.72,0.40,2],[0.65,0.52,3],[0.60,0.44,3]],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,9],[9,8],[8,7]] },

    { name: 'Scorpius',
      stars: [[0.38,0.14,2],[0.50,0.10,3],[0.60,0.14,2],
               [0.48,0.28,1],[0.44,0.40,2],[0.42,0.52,2],
               [0.44,0.62,2],[0.50,0.70,2],[0.57,0.76,2],[0.64,0.74,2]],
      lines: [[0,3],[1,3],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]] },

    { name: 'Gemini',
      stars: [[0.28,0.12,1],[0.40,0.12,1],
               [0.22,0.28,2],[0.34,0.26,2],
               [0.18,0.44,2],[0.30,0.42,2],
               [0.20,0.62,2],[0.34,0.60,2]],
      lines: [[0,2],[2,4],[4,6],[1,3],[3,5],[5,7],[0,1]] },

    { name: 'Perseus',
      stars: [[0.50,0.18,1],[0.38,0.26,2],[0.28,0.36,2],[0.24,0.50,3],
               [0.32,0.56,2],[0.62,0.22,2],[0.72,0.32,2],[0.68,0.44,3],[0.56,0.36,2]],
      lines: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[0,8]] },

    { name: 'Aquila',
      stars: [[0.50,0.38,1],[0.50,0.26,3],[0.50,0.50,3],
               [0.26,0.30,2],[0.36,0.34,3],[0.74,0.28,2],[0.64,0.33,3],
               [0.50,0.65,2],[0.50,0.14,3]],
      lines: [[1,0],[0,2],[2,7],[3,4],[4,0],[0,6],[6,5],[0,8]] },

    { name: 'Lyra',
      stars: [[0.50,0.12,1],[0.40,0.32,2],[0.60,0.32,2],
               [0.38,0.52,2],[0.62,0.52,2],[0.50,0.58,3]],
      lines: [[0,1],[0,2],[1,3],[2,4],[3,5],[5,4],[1,2],[3,4]] },
  ];


  /* ══════════════════════════════════════════════════════════
     SOLAR SYSTEM PLANET DATA
  ══════════════════════════════════════════════════════════ */
  var PLANETS = [
    { name:'Mercury', r:0.055, size:3,  period:0.24,  color:'rgba(190,170,148,0.95)' },
    { name:'Venus',   r:0.095, size:5,  period:0.62,  color:'rgba(240,210,60,0.95)'  },
    { name:'Earth',   r:0.140, size:5,  period:1.00,  color:'rgba(40,148,230,0.95)'  },
    { name:'Mars',    r:0.190, size:4,  period:1.88,  color:'rgba(220,60,30,0.95)'   },
    { name:'Jupiter', r:0.290, size:10, period:11.86, color:'rgba(215,168,102,0.95)' },
    { name:'Saturn',  r:0.375, size:8,  period:29.46, color:'rgba(235,215,130,0.95)', rings:true },
    { name:'Uranus',  r:0.460, size:6,  period:84,    color:'rgba(100,218,218,0.95)' },
    { name:'Neptune', r:0.545, size:6,  period:165,   color:'rgba(62,100,238,0.95)'  },
  ];

  /* ══════════════════════════════════════════════════════════
     SHOOTING STARS  (shared utility used by constellation + solar)
  ══════════════════════════════════════════════════════════ */
  var SHOOT_COLORS = ['rgba(255,255,255,','rgba(200,222,255,','rgba(255,242,190,','rgba(255,210,120,'];

  function makeShootingStars(n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push({ active:false, countdown: randInt(80,320), x:0,y:0,dx:0,dy:0, life:0, maxLife:0, len:0, col:'' });
    }
    return arr;
  }

  function activateStar(s) {
    s.x  = rand(0.05, 0.95) * W;
    s.y  = rand(0.0,  0.25) * H;
    var ang = rand(25, 65) * Math.PI / 180;
    if (Math.random() < 0.5) ang = Math.PI - ang;
    var spd = rand(7, 15);
    s.dx = Math.cos(ang) * spd;
    s.dy = Math.sin(ang) * spd;
    s.life    = 0;
    s.maxLife = randInt(30, 52);
    s.len     = rand(70, 150);
    s.col     = SHOOT_COLORS[Math.floor(Math.random() * SHOOT_COLORS.length)];
    s.active  = true;
  }

  function drawShootingStars(stars) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!s.active) {
        if (--s.countdown <= 0) activateStar(s);
        continue;
      }
      var prog  = s.life / s.maxLife;
      var alpha = (prog < 0.25 ? prog / 0.25 : 1 - (prog - 0.25) / 0.75) * 0.88;
      var tlen  = s.len * Math.min(1, prog * 4);
      var spd   = Math.sqrt(s.dx*s.dx + s.dy*s.dy) || 1;
      var tx = s.x - (s.dx / spd) * tlen;
      var ty = s.y - (s.dy / spd) * tlen;
      var grd = ctx.createLinearGradient(s.x, s.y, tx, ty);
      grd.addColorStop(0, s.col + alpha.toFixed(3) + ')');
      grd.addColorStop(1, s.col + '0)');
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = grd;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.restore();
      s.x += s.dx; s.y += s.dy; s.life++;
      if (s.life >= s.maxLife) { s.active = false; s.countdown = randInt(100, 380); }
    }
  }

  /* ══════════════════════════════════════════════════════════
     CONSTELLATION BACKGROUND
  ══════════════════════════════════════════════════════════ */
  var constState = null;

  // Star spectral palettes by magnitude
  var STAR_PAL = [
    ['rgba(185,215,255,0.92)','rgba(255,245,185,0.90)','rgba(255,155,75,0.88)'],  // mag 1
    ['rgba(205,228,255,0.78)','rgba(255,252,210,0.75)','rgba(255,200,130,0.72)'],  // mag 2
    ['rgba(218,232,255,0.56)','rgba(255,248,225,0.52)','rgba(255,218,170,0.48)'],  // mag 3+
  ];
  var BG_STAR_PAL = ['rgba(158,182,228,','rgba(222,212,152,','rgba(218,172,128,','rgba(178,198,228,','rgba(212,195,240,'];

  function constInit() {
    var idx = Math.floor(Math.random() * CONSTELLATIONS.length);
    var c   = CONSTELLATIONS[idx];
    var bgStars = [];
    for (var i = 0; i < 250; i++) {
      bgStars.push([Math.random(), Math.random(), rand(0.4,1.3), rand(0.06,0.18),
                    Math.floor(Math.random() * BG_STAR_PAL.length)]);
    }
    var starColors = c.stars.map(function (s) {
      var pal = STAR_PAL[Math.min(s[2] - 1, 2)];
      return pal[Math.floor(Math.random() * pal.length)];
    });
    constState = { c: c, bgStars: bgStars, starColors: starColors, shooting: makeShootingStars(3) };
  }

  function constDraw() {
    var c    = constState.c;
    var size = Math.min(W, H) * 0.92;
    var ox   = (W - size) / 2;
    var oy   = (H - size) / 2;

    function map(x, y) { return [ox + x * size, oy + y * size]; }

    // Scattered background stars — colorful
    for (var i = 0; i < constState.bgStars.length; i++) {
      var bs = constState.bgStars[i];
      ctx.beginPath();
      ctx.arc(bs[0] * W, bs[1] * H, bs[2], 0, 6.283);
      ctx.fillStyle = BG_STAR_PAL[bs[4]] + bs[3] + ')';
      ctx.fill();
    }

    // Connecting lines — soft purple-blue
    ctx.lineWidth = 1;
    for (var i = 0; i < c.lines.length; i++) {
      var pa = map(c.stars[c.lines[i][0]][0], c.stars[c.lines[i][0]][1]);
      var pb = map(c.stars[c.lines[i][1]][0], c.stars[c.lines[i][1]][1]);
      ctx.strokeStyle = 'rgba(165,138,238,0.32)';
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }

    // Stars — spectral colors with glow on bright ones
    for (var i = 0; i < c.stars.length; i++) {
      var s   = c.stars[i];
      var pos = map(s[0], s[1]);
      var r   = Math.max(1.5, 5.5 - s[2] * 1.1);
      var col = constState.starColors[i];
      if (s[2] <= 2) {
        var grd = ctx.createRadialGradient(pos[0],pos[1],r*0.4, pos[0],pos[1],r*4.5);
        grd.addColorStop(0, col.replace(/[\d.]+\)$/, '0.30)'));
        grd.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
        ctx.beginPath(); ctx.arc(pos[0], pos[1], r*4.5, 0, 6.283);
        ctx.fillStyle = grd; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, 6.283);
      ctx.fillStyle = col; ctx.fill();
    }

    // Shooting stars
    drawShootingStars(constState.shooting);

    // Name label — just below and centered on the constellation
    var cMinX = Infinity, cMaxX = -Infinity, cMaxY = -Infinity;
    for (var i = 0; i < c.stars.length; i++) {
      if (c.stars[i][0] < cMinX) cMinX = c.stars[i][0];
      if (c.stars[i][0] > cMaxX) cMaxX = c.stars[i][0];
      if (c.stars[i][1] > cMaxY) cMaxY = c.stars[i][1];
    }
    var labelX = ox + (cMinX + cMaxX) / 2 * size;
    var labelY = oy + cMaxY * size + 28;
    ctx.font         = '600 14px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    var nameW = ctx.measureText(c.name).width;
    ctx.fillStyle = 'rgba(250,250,248,0.82)';
    ctx.fillRect(labelX - nameW / 2 - 10, labelY - 18, nameW + 20, 24);
    ctx.fillStyle = 'rgba(60,75,110,0.72)';
    ctx.fillText(c.name, labelX, labelY);
  }

  /* ══════════════════════════════════════════════════════════
     SHOOTING STARS BACKGROUND  (one star at a time, slow arc)
  ══════════════════════════════════════════════════════════ */
  var METEOR_COLS = [
    '255,80,120','255,160,40','80,220,255','160,255,80',
    '200,80,255','255,255,80','80,180,255','255,120,80',
  ];

  var shootState2 = null;

  function shootInit() {
    shootState2 = { star: null, countdown: randInt(60, 150), trail: [] };
  }

  function spawnMeteor() {
    // Randomly left → right or right → left
    var leftToRight = Math.random() < 0.5;
    var x   = leftToRight ? -10 : W + 10;
    var y   = rand(0.15, 0.80) * H;
    var ang = leftToRight
      ? rand(-20, 20) * Math.PI / 180
      : (180 + rand(-20, 20)) * Math.PI / 180;
    var spd = rand(3.0, 5.0);
    var col = METEOR_COLS[Math.floor(Math.random() * METEOR_COLS.length)];
    return {
      x: x, y: y,
      dx: Math.cos(ang) * spd,
      dy: Math.sin(ang) * spd,
      col: col,
      curve: rand(-0.004, 0.004),   // gentle arc per frame
      life: 0, maxLife: 900,        // off-screen detection retires it; this is a fallback
    };
  }

  function shootDraw() {
    var st = shootState2;

    if (!st.star) {
      if (--st.countdown <= 0) { st.star = spawnMeteor(); st.trail = []; }
      return;
    }

    var s = st.star;

    // Rotate velocity slightly each frame for arc
    var cosC = Math.cos(s.curve), sinC = Math.sin(s.curve);
    var ndx = s.dx * cosC - s.dy * sinC;
    var ndy = s.dx * sinC + s.dy * cosC;
    s.dx = ndx; s.dy = ndy;
    s.x += s.dx; s.y += s.dy; s.life++;

    st.trail.push({ x: s.x, y: s.y });
    if (st.trail.length > 110) st.trail.shift();

    // Fade in/out over life
    var prog  = s.life / s.maxLife;
    var alpha = (prog < 0.12 ? prog / 0.12 : prog > 0.72 ? (1 - prog) / 0.28 : 1.0) * 0.85;

    // Draw trail — thickens and brightens toward the head
    if (st.trail.length > 1) {
      for (var i = 1; i < st.trail.length; i++) {
        var t  = i / st.trail.length;
        ctx.beginPath();
        ctx.moveTo(st.trail[i - 1].x, st.trail[i - 1].y);
        ctx.lineTo(st.trail[i].x,     st.trail[i].y);
        ctx.strokeStyle = 'rgba(' + s.col + ',' + (t * alpha * 0.88).toFixed(3) + ')';
        ctx.lineWidth   = t * 3.5;
        ctx.stroke();
      }
    }

    // Head glow
    var grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 7);
    grd.addColorStop(0, 'rgba(' + s.col + ',' + (alpha * 0.95).toFixed(2) + ')');
    grd.addColorStop(1, 'rgba(' + s.col + ',0)');
    ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, 6.283);
    ctx.fillStyle = grd; ctx.fill();

    // Head dot
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, 6.283);
    ctx.fillStyle = 'rgba(' + s.col + ',' + alpha.toFixed(2) + ')'; ctx.fill();

    // Retire when off-screen or past max life
    if (s.life >= s.maxLife || s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) {
      st.star = null;
      st.trail = [];
      st.countdown = randInt(200, 480);
    }
  }

  /* ══════════════════════════════════════════════════════════
     MUSIC BACKGROUND  (floating notes, soft staff lines)
  ══════════════════════════════════════════════════════════ */
  var MUSIC_SYMS = ['♩','♪','♫','♬','♭','♮','♯'];
  var MUSIC_COLS = [
    '255,110,170','110,175,255','160,255,130',
    '255,200,70','190,110,255','70,215,215','255,155,70',
  ];

  var musicState = null;

  function spawnNote(stagger) {
    var size = rand(20, 52);
    return {
      x:     rand(0.04, 0.96) * W,
      y:     stagger ? rand(-0.1, 1.05) * H : H + size + 10,
      size:  size,
      sym:   MUSIC_SYMS[Math.floor(Math.random() * MUSIC_SYMS.length)],
      col:   MUSIC_COLS[Math.floor(Math.random() * MUSIC_COLS.length)],
      speed: rand(0.35, 0.95),
      drift: rand(-0.25, 0.25),
      sway:  rand(0, Math.PI * 2),
      swaySpd: rand(0.012, 0.030),
      swayAmp: rand(4, 14),
      alpha: 0,
      peakAlpha: rand(0.18, 0.38),
    };
  }

  function musicInit() {
    var notes = [];
    for (var i = 0; i < 22; i++) notes.push(spawnNote(true));
    musicState = { notes: notes };
  }

  function musicDraw() {
    var notes = musicState.notes;

    // Faint staff-line groups scattered across the canvas
    ctx.strokeStyle = 'rgba(140,140,140,0.055)';
    ctx.lineWidth = 1;
    var staffY = [H * 0.22, H * 0.50, H * 0.78];
    for (var s = 0; s < staffY.length; s++) {
      for (var l = -2; l <= 2; l++) {
        var ly = staffY[s] + l * 9;
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
      }
    }

    // Notes
    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      n.sway += n.swaySpd;
      n.y    -= n.speed;
      n.x    += n.drift * 0.18;

      // Fade in near bottom, fade out near top
      var yRatio = 1 - (n.y / H);
      var fade   = yRatio < 0.08 ? yRatio / 0.08
                 : yRatio > 0.82 ? (1 - yRatio) / 0.18
                 : 1.0;
      var a = n.peakAlpha * Math.max(0, fade);

      ctx.save();
      ctx.translate(n.x + Math.sin(n.sway) * n.swayAmp, n.y);
      ctx.font = 'normal ' + Math.round(n.size) + 'px serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(' + n.col + ',' + a.toFixed(3) + ')';
      ctx.fillText(n.sym, 0, 0);
      ctx.restore();

      if (n.y < -(n.size * 2)) notes[i] = spawnNote(false);
    }
  }

  /* ══════════════════════════════════════════════════════════
     FIREWORKS BACKGROUND
  ══════════════════════════════════════════════════════════ */
  // Holiday detection — US + EU common holidays
  function isHoliday() {
    var now = new Date();
    var m = now.getMonth() + 1, d = now.getDate(), y = now.getFullYear();

    // Fixed-date holidays
    var fixed = [[1,1],[1,6],[2,14],[3,17],[5,1],[6,19],[7,4],[10,31],[11,1],[12,24],[12,25],[12,26],[12,31]];
    for (var i = 0; i < fixed.length; i++) if (fixed[i][0]===m && fixed[i][1]===d) return true;

    // US Thanksgiving: 4th Thursday of November
    if (m === 11) {
      var first = new Date(y, 10, 1).getDay(); // 0=Sun
      var thu1  = 1 + ((4 - first + 7) % 7);
      if (d === thu1 + 21) return true;
    }

    // Easter Sunday (Anonymous Gregorian)
    var a=y%19, b=Math.floor(y/100), c=y%100, dd=Math.floor(b/4), e=b%4,
        f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3),
        h=(19*a+b-dd-g+15)%30, ii=Math.floor(c/4), k=c%4,
        l=(32+2*e+2*ii-h-k)%7, mn=Math.floor((a+11*h+22*l)/451),
        em=Math.floor((h+l-7*mn+114)/31), ed=((h+l-7*mn+114)%31)+1;
    if (m===em && d===ed) return true;

    return false;
  }

  var FW_PALETTES = [
    ['255,80,80',  '255,140,60','255,220,80'],
    ['80,160,255', '80,255,200','160,80,255'],
    ['255,80,200', '255,160,80','80,255,120'],
    ['255,255,80', '255,180,40','255,100,100'],
    ['120,255,180','80,200,255','200,120,255'],
  ];

  var fwState = null;

  function fwInit() {
    fwState = { rockets: [], particles: [], timer: 0 };
  }

  function launchRocket() {
    var pal = FW_PALETTES[Math.floor(Math.random() * FW_PALETTES.length)];
    return {
      x: rand(0.15, 0.85) * W,
      y: H + 10,
      dy: rand(-14, -9),
      targetY: rand(0.12, 0.48) * H,
      pal: pal, trail: [],
      col: pal[0],
    };
  }

  function explodeRocket(r, particles) {
    var n = randInt(60, 110);
    var type = Math.floor(Math.random() * 3); // 0=radial, 1=ring, 2=chrysanthemum
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
      var spd = type === 1 ? rand(4.5, 5.5) : rand(1.5, 7);
      var col = r.pal[Math.floor(Math.random() * r.pal.length)];
      particles.push({
        x: r.x, y: r.y,
        dx: Math.cos(ang) * spd, dy: Math.sin(ang) * spd - (type===2 ? rand(0,2) : 0),
        col: col, life: 0,
        maxLife: randInt(48, 90),
        gravity: rand(0.04, 0.10),
        size: rand(2, 4.5),
        twinkle: Math.random() < 0.4,
      });
    }
    // Central flash
    particles.push({ x:r.x, y:r.y, dx:0, dy:0, col:'255,255,255', life:0, maxLife:8, gravity:0, size:12, twinkle:false });
  }

  function fwDraw() {
    fwState.timer++;

    // Spawn rockets
    if (fwState.timer % randInt(28, 55) === 0 && fwState.rockets.length < 5) {
      fwState.rockets.push(launchRocket());
    }

    // Update rockets
    for (var i = fwState.rockets.length - 1; i >= 0; i--) {
      var r = fwState.rockets[i];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 12) r.trail.shift();
      r.y += r.dy; r.dy += 0.18; // slight gravity on ascent

      // Draw trail
      for (var t = 0; t < r.trail.length; t++) {
        var ta = (t / r.trail.length) * 0.7;
        ctx.beginPath(); ctx.arc(r.trail[t].x, r.trail[t].y, 1.5, 0, 6.283);
        ctx.fillStyle = 'rgba(' + r.col + ',' + ta.toFixed(2) + ')'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(r.x, r.y, 2.5, 0, 6.283);
      ctx.fillStyle = 'rgba(' + r.col + ',0.95)'; ctx.fill();

      if (r.y <= r.targetY || r.dy >= 0) {
        explodeRocket(r, fwState.particles);
        fwState.rockets.splice(i, 1);
      }
    }

    // Update particles
    for (var i = fwState.particles.length - 1; i >= 0; i--) {
      var p = fwState.particles[i];
      p.x += p.dx; p.y += p.dy; p.dy += p.gravity;
      p.dx *= 0.98; p.life++;
      if (p.life >= p.maxLife) { fwState.particles.splice(i, 1); continue; }
      var prog = p.life / p.maxLife;
      var a = (1 - prog) * 0.92;
      if (p.twinkle) a *= (Math.sin(p.life * 0.6) * 0.5 + 0.5);
      var sz = p.size * (1 - prog * 0.6);
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, sz), 0, 6.283);
      ctx.fillStyle = 'rgba(' + p.col + ',' + a.toFixed(2) + ')'; ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════
     SOLAR SYSTEM
  ══════════════════════════════════════════════════════════ */
  var solarState = null;

  function solarInit() {
    var angles = [];
    for (var i = 0; i < PLANETS.length; i++) angles.push(rand(0, Math.PI * 2));

    // Pre-compute asteroid belt particles so positions are stable each frame
    var belt = [];
    for (var i = 0; i < 200; i++) {
      belt.push({
        angle:    rand(0, Math.PI * 2),
        rOffset:  rand(-0.028, 0.028),   // fraction of belt base radius
        size:     rand(0.5, 1.8),
      });
    }
    solarState = { time: 0, angles: angles, belt: belt, shooting: makeShootingStars(2) };
  }

  function solarDraw() {
    solarState.time += 0.004;
    var t  = solarState.time;
    var cx = W / 2, cy = H / 2;
    var sc = Math.min(W, H) * 0.90;

    // Sun glow — warm multi-stop corona
    var grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 68);
    grd.addColorStop(0,   'rgba(255,235,80,0.90)');
    grd.addColorStop(0.25,'rgba(255,185,30,0.55)');
    grd.addColorStop(0.55,'rgba(255,110,10,0.22)');
    grd.addColorStop(1,   'rgba(255,60,0,0.00)');
    ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
    // Sun core
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,242,88,0.95)'; ctx.fill();

    // Shooting stars
    drawShootingStars(solarState.shooting);

    // Asteroid belt (between Mars r=0.190 and Jupiter r=0.290)
    var beltR = (PLANETS[3].r + PLANETS[4].r) / 2 * sc;
    for (var i = 0; i < solarState.belt.length; i++) {
      var b  = solarState.belt[i];
      var ba = b.angle + t * 0.012;
      var br = beltR + b.rOffset * sc;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, b.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(140,130,118,0.22)';
      ctx.fill();
    }

    // Planets
    for (var i = 0; i < PLANETS.length; i++) {
      var pl    = PLANETS[i];
      var orb   = pl.r * sc;

      // Orbit ring
      ctx.beginPath(); ctx.arc(cx, cy, orb, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148,148,148,0.13)';
      ctx.lineWidth   = 1; ctx.stroke();

      var ang = solarState.angles[i] + t / pl.period;
      var px  = cx + Math.cos(ang) * orb;
      var py  = cy + Math.sin(ang) * orb;

      // Saturn rings
      if (pl.rings) {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(1, 0.38);
        ctx.beginPath(); ctx.arc(0, 0, pl.size * 2.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(195,175,125,0.48)';
        ctx.lineWidth = 3.5; ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath(); ctx.arc(px, py, pl.size, 0, Math.PI * 2);
      ctx.fillStyle = pl.color; ctx.fill();
    }
  }

  /* ══════════════════════════════════════════════════════════
     BACKGROUND REGISTRY
  ══════════════════════════════════════════════════════════ */
  var BG = {
    blank:         { label: 'None',           animated: false, init: function(){}, draw: function(){} },
    constellation: { label: 'Constellation',  animated: true,  init: constInit,   draw: constDraw  },
    shooting:      { label: 'Shooting Stars', animated: true,  init: shootInit,   draw: shootDraw  },
    solar:         { label: 'Solar System',   animated: true,  init: solarInit,   draw: solarDraw  },
    music:         { label: 'Music',          animated: true,  init: musicInit,   draw: musicDraw  },
    fireworks:     { label: 'Fireworks',      animated: true,  init: fwInit,      draw: fwDraw     },
  };
  var BG_KEYS      = ['constellation', 'shooting', 'solar', 'music', 'fireworks'];
  var BG_COLORFUL  = ['constellation', 'shooting', 'solar', 'music'];
  var currentKey  = null;
  var lastActiveBg = null;
  var rafId       = null;
  var toggleBtn   = null;

  function setBackground(key) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    currentKey = key;
    var bg = BG[key];
    bg.init();
    ctx.clearRect(0, 0, W, H);

    if (bg.animated) {
      (function loop() {
        ctx.clearRect(0, 0, W, H);
        bg.draw();
        rafId = requestAnimationFrame(loop);
      }());
    } else {
      bg.draw();
    }

    // Track last colorful background for toggle restore
    if (key !== 'blank') lastActiveBg = key;

    // Sync dropdown (skip 'blank' — it's not in the list)
    var sel = document.getElementById('bg-select');
    if (sel && key !== 'blank') sel.value = key;

    // Sync toggle button
    if (toggleBtn) {
      if (key === 'blank') {
        toggleBtn.textContent = "Turn on background · T";
        toggleBtn.classList.remove('is-visible');
      } else {
        toggleBtn.textContent = "Turn off background · T";
        toggleBtn.classList.add('is-visible');
      }
    }

    try { localStorage.setItem('sl_bg', key); } catch (e) {}
  }

  function toggleBackground() {
    if (currentKey === 'blank') {
      // Restore background and clear the hidden preference
      try { localStorage.removeItem('sl_bg_hidden'); } catch (e) {}
      var target = lastActiveBg || BG_COLORFUL[Math.floor(Math.random() * BG_COLORFUL.length)];
      setBackground(target);
    } else {
      // Hide background and cache the preference for future visits
      try { localStorage.setItem('sl_bg_hidden', '1'); } catch (e) {}
      setBackground('blank');
    }
  }

  // Redraw static backgrounds on resize
  window.addEventListener('resize', function () {
    resize();
    if (currentKey && !BG[currentKey].animated) {
      ctx.clearRect(0, 0, W, H);
      BG[currentKey].draw();
    }
  });

  /* ══════════════════════════════════════════════════════════
     PREVIEW MODAL
     Opens by: double-click on non-text area, or pressing B.
     The existing canvas is elevated above a frosted overlay so
     the background renders in isolation — no second canvas needed.
  ══════════════════════════════════════════════════════════ */
  var modalOpen   = false;
  var overlay     = null;
  var closeBtn    = null;
  var hintEl      = null;

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'bg-modal-overlay';
    document.body.appendChild(overlay);

    closeBtn = document.createElement('button');
    closeBtn.className   = 'bg-modal-close';
    closeBtn.textContent = '✕  Close';
    document.body.appendChild(closeBtn);

    hintEl = document.createElement('p');
    hintEl.className   = 'bg-modal-hint';
    hintEl.textContent = 'Double-click or press B to close';
    document.body.appendChild(hintEl);

    overlay.addEventListener('click',  closeModal);
    closeBtn.addEventListener('click', closeModal);
  }

  function openModal() {
    if (modalOpen) return;
    modalOpen = true;
    canvas.style.zIndex = '11';
    overlay.classList.add('is-open');
    closeBtn.classList.add('is-open');
    hintEl.classList.add('is-open');
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    overlay.classList.remove('is-open');
    closeBtn.classList.remove('is-open');
    hintEl.classList.remove('is-open');
    // Reset canvas z-index after overlay fade completes
    setTimeout(function () { if (!modalOpen) canvas.style.zIndex = ''; }, 250);
  }

  // Double-click on non-text regions opens the preview
  document.addEventListener('dblclick', function (e) {
    if (e.target.closest('a, button, input, textarea, select, p, h1, h2, h3, h4, h5, h6, li, label, .bg-switcher, .site-nav, .site-footer')) return;
    if (modalOpen) closeModal(); else openModal();
  });

  // B key toggles; Escape closes
  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'b' || e.key === 'B') { if (modalOpen) closeModal(); else openModal(); }
    if (e.key === 'Escape' && modalOpen)  closeModal();
    if (e.key === 't' || e.key === 'T') toggleBackground();
    if (e.key === 'f' || e.key === 'F') {
      if (currentKey === 'fireworks') {
        // Toggle off fireworks — pick a non-fireworks background at random
        var nonFw = BG_KEYS.filter(function (k) { return k !== 'fireworks'; });
        setBackground(nonFw[Math.floor(Math.random() * nonFw.length)]);
      } else {
        setBackground('fireworks');
      }
    }
  });

  /* ══════════════════════════════════════════════════════════
     FOOTER SWITCHER  (dropdown beside copyright)
  ══════════════════════════════════════════════════════════ */
  function buildMenu() {
    var copy = document.querySelector('.site-footer__copy');
    if (!copy) return;

    var sel = document.createElement('select');
    sel.id        = 'bg-select';
    sel.className = 'bg-select';

    for (var i = 0; i < BG_KEYS.length; i++) {
      var opt       = document.createElement('option');
      opt.value     = BG_KEYS[i];
      opt.textContent = BG[BG_KEYS[i]].label;
      sel.appendChild(opt);
    }

    copy.parentNode.insertBefore(sel, copy.nextSibling);
    sel.addEventListener('change', function () {
      // Selecting from the menu resets the hidden preference
      try { localStorage.removeItem('sl_bg_hidden'); } catch (e) {}
      setBackground(this.value);
    });
  }

  function buildToggleBtn() {
    toggleBtn = document.createElement('button');
    toggleBtn.className   = 'bg-toggle-btn';
    toggleBtn.textContent = 'Turn off background · T';
    document.body.appendChild(toggleBtn);
    toggleBtn.addEventListener('click', toggleBackground);
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  buildMenu();
  buildModal();
  buildToggleBtn();

  // Start blank
  setBackground('blank');

  // Only introduce a background if the visitor hasn't hidden it
  var bgHidden;
  try { bgHidden = localStorage.getItem('sl_bg_hidden'); } catch (e) {}

  if (!bgHidden) {
    setTimeout(function () {
      if (isHoliday()) {
        setBackground('fireworks');
      } else {
        var saved;
        try { saved = localStorage.getItem('sl_bg'); } catch (e) {}
        if (saved && BG[saved] && saved !== 'blank') {
          setBackground(saved);
        } else {
          setBackground(BG_COLORFUL[Math.floor(Math.random() * BG_COLORFUL.length)]);
        }
      }
    }, 10000);
  }

}());
