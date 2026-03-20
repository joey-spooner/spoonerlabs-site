/* bg.js — Spooner Labs background system
   Backgrounds: 10 constellations, chemistry, asteroids, solar system
   Randomly selected on load; footer switcher to change manually        */

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
     CHEMICAL STRUCTURES
     Atoms: [x, y, label]   '' = carbon (unlabeled in skeletal formula)
     Bonds: [idx_a, idx_b, order]   1=single  2=double  3=triple
  ══════════════════════════════════════════════════════════ */
  var CHEMICALS = [
    { label: 'Benzene  C₆H₆',
      atoms: [[0.50,0.22,''],[0.63,0.31,''],[0.63,0.49,''],[0.50,0.58,''],[0.37,0.49,''],[0.37,0.31,'']],
      bonds: [[0,1,1],[1,2,2],[2,3,1],[3,4,2],[4,5,1],[5,0,2]] },

    { label: 'Water  H₂O',
      atoms: [[0.50,0.38,'O'],[0.33,0.57,'H'],[0.67,0.57,'H']],
      bonds: [[0,1,1],[0,2,1]] },

    { label: 'Carbon Dioxide  CO₂',
      atoms: [[0.24,0.50,'O'],[0.50,0.50,'C'],[0.76,0.50,'O']],
      bonds: [[0,1,2],[1,2,2]] },

    { label: 'Methane  CH₄',
      atoms: [[0.50,0.50,'C'],[0.50,0.24,'H'],[0.74,0.63,'H'],[0.26,0.63,'H'],[0.50,0.76,'H']],
      bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]] },

    { label: 'Ethanol  C₂H₅OH',
      atoms: [[0.30,0.50,''],[0.50,0.50,''],[0.70,0.50,'O'],
               [0.24,0.33,'H'],[0.17,0.54,'H'],[0.24,0.68,'H'],
               [0.44,0.33,'H'],[0.56,0.33,'H'],[0.84,0.50,'H']],
      bonds: [[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[1,6,1],[1,7,1],[2,8,1]] },

    { label: 'Aspirin',
      atoms: [
        [0.38,0.28,''],[0.52,0.20,''],[0.66,0.28,''],[0.66,0.44,''],[0.52,0.52,''],[0.38,0.44,''],
        [0.24,0.20,''],[0.12,0.20,'O'],[0.24,0.07,'O'],
        [0.80,0.52,'O'],[0.92,0.60,''],[0.92,0.76,'O'],[1.04,0.52,'']],
      bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],
               [0,6,1],[6,7,2],[6,8,1],[3,9,1],[9,10,1],[10,11,2],[10,12,1]] },

    { label: 'Caffeine',
      atoms: [
        [0.34,0.30,'N'],[0.48,0.22,'C'],[0.62,0.28,'N'],[0.65,0.44,'C'],[0.52,0.52,'C'],[0.36,0.46,'C'],
        [0.52,0.66,'N'],[0.66,0.70,'C'],[0.70,0.55,'N'],
        [0.20,0.24,'C'],[0.48,0.08,'O'],[0.78,0.22,'C'],[0.52,0.80,'C'],[0.66,0.84,'O']],
      bonds: [[0,1,1],[1,2,2],[2,3,1],[3,4,1],[4,5,1],[5,0,2],
               [4,6,1],[6,7,1],[7,8,1],[8,3,1],
               [0,9,1],[1,10,2],[2,11,1],[6,12,1],[7,13,2]] },

    { label: 'Glucose  C₆H₁₂O₆',
      atoms: [[0.50,0.25,'O'],[0.35,0.35,''],[0.35,0.52,''],[0.50,0.62,''],
               [0.65,0.52,''],[0.65,0.35,''],
               [0.20,0.28,'O'],[0.20,0.58,'O'],[0.50,0.78,'O'],[0.80,0.58,'O'],
               [0.80,0.28,''],[0.94,0.22,'O']],
      bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,0,1],
               [1,6,1],[2,7,1],[3,8,1],[4,9,1],[5,10,1],[10,11,1]] },
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
    var size = Math.min(W, H) * 0.68;
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
     CHEMISTRY BACKGROUND
  ══════════════════════════════════════════════════════════ */
  var chemState = null;

  function chemInit() {
    chemState = { chem: CHEMICALS[Math.floor(Math.random() * CHEMICALS.length)] };
  }

  function chemDraw() {
    var chem  = chemState.chem;
    var atoms = chem.atoms;
    var bonds = chem.bonds;

    // Bounding box
    var minX =  Infinity, minY =  Infinity;
    var maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < atoms.length; i++) {
      if (atoms[i][0] < minX) minX = atoms[i][0];
      if (atoms[i][0] > maxX) maxX = atoms[i][0];
      if (atoms[i][1] < minY) minY = atoms[i][1];
      if (atoms[i][1] > maxY) maxY = atoms[i][1];
    }
    var bbW = maxX - minX || 0.01;
    var bbH = maxY - minY || 0.01;
    var target = Math.min(W, H) * 0.42;
    var sc = Math.min(target / bbW, target / bbH);
    var ox = W / 2 - (minX + bbW / 2) * sc;
    var oy = H / 2 - (minY + bbH / 2) * sc;

    function mp(ax, ay) { return [ax * sc + ox, ay * sc + oy]; }

    var lc = 'rgba(65,75,100,0.42)';
    ctx.lineWidth = 1.8;

    // Bonds
    for (var i = 0; i < bonds.length; i++) {
      var b  = bonds[i];
      var pa = mp(atoms[b[0]][0], atoms[b[0]][1]);
      var pb = mp(atoms[b[1]][0], atoms[b[1]][1]);
      var dx = pb[0] - pa[0], dy = pb[1] - pa[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;

      ctx.strokeStyle = lc;
      if (b[2] === 1) {
        ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      } else if (b[2] === 2) {
        ctx.beginPath(); ctx.moveTo(pa[0]+nx*3,pa[1]+ny*3); ctx.lineTo(pb[0]+nx*3,pb[1]+ny*3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pa[0]-nx*3,pa[1]-ny*3); ctx.lineTo(pb[0]-nx*3,pb[1]-ny*3); ctx.stroke();
      } else if (b[2] === 3) {
        ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pa[0]+nx*4,pa[1]+ny*4); ctx.lineTo(pb[0]+nx*4,pb[1]+ny*4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pa[0]-nx*4,pa[1]-ny*4); ctx.lineTo(pb[0]-nx*4,pb[1]-ny*4); ctx.stroke();
      }
    }

    // Atom labels — CPK colors
    var CPK = { O:'rgba(210,38,38,0.82)', N:'rgba(38,98,218,0.82)', H:'rgba(105,105,105,0.72)',
                C:'rgba(38,38,38,0.78)', S:'rgba(180,145,0,0.82)',  P:'rgba(200,80,0,0.82)' };
    ctx.font          = 'bold 13px Inter, sans-serif';
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    for (var i = 0; i < atoms.length; i++) {
      var lbl = atoms[i][2];
      if (!lbl) continue;
      var pos = mp(atoms[i][0], atoms[i][1]);
      var tw  = ctx.measureText(lbl).width;
      ctx.fillStyle = 'rgba(250,250,248,0.96)';
      ctx.fillRect(pos[0] - tw / 2 - 2, pos[1] - 9, tw + 4, 18);
      ctx.fillStyle = CPK[lbl] || 'rgba(65,75,100,0.72)';
      ctx.fillText(lbl, pos[0], pos[1]);
    }

    // Structure label — just below the molecule, horizontally centered on it
    var molCx  = (minX + bbW / 2) * sc + ox;
    var labelY = maxY * sc + oy + 28;
    ctx.font         = '600 14px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    var lblW = ctx.measureText(chem.label).width;
    ctx.fillStyle = 'rgba(250,250,248,0.82)';
    ctx.fillRect(molCx - lblW / 2 - 10, labelY - 18, lblW + 20, 24);
    ctx.fillStyle = 'rgba(60,75,110,0.72)';
    ctx.fillText(chem.label, molCx, labelY);
  }

  /* ══════════════════════════════════════════════════════════
     ASTEROID FIELD
     Classic 3-D fly-through: particles at (x,y,z), projected
     as z → 0 they expand outward from the center.
  ══════════════════════════════════════════════════════════ */
  var asteroidState = null;

  function asteroidsInit() {
    var particles = [];
    for (var i = 0; i < 130; i++) {
      var angle = rand(0, Math.PI * 2);
      var dist  = rand(0.01, 0.85);
      var nv    = randInt(5, 8);
      var verts = [];
      for (var v = 0; v < nv; v++) verts.push(rand(0.62, 1.32));
      var ROCK_COLS = ['115,108,98','142,98,72','94,112,128','128,118,88','108,94,118','88,118,98'];
      particles.push({
        x:     Math.cos(angle) * dist,
        y:     Math.sin(angle) * dist,
        z:     rand(0.05, 1.0),
        speed: rand(0.0007, 0.0020),
        size:  rand(1.4, 3.8),
        verts: verts,
        col:   ROCK_COLS[Math.floor(Math.random() * ROCK_COLS.length)],
      });
    }
    asteroidState = { particles: particles };
  }

  function asteroidsDraw() {
    var cx = W / 2, cy = H / 2;
    var persp = Math.max(W, H) * 0.52;
    var ps = asteroidState.particles;

    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.z -= p.speed;

      if (p.z <= 0.01) {
        var a = rand(0, Math.PI * 2), d = rand(0.01, 0.85);
        p.x = Math.cos(a) * d; p.y = Math.sin(a) * d; p.z = 1.0;
        continue;
      }

      var sx = (p.x / p.z) * persp + cx;
      var sy = (p.y / p.z) * persp + cy;
      if (sx < -100 || sx > W + 100 || sy < -100 || sy > H + 100) {
        var a = rand(0, Math.PI * 2), d = rand(0.01, 0.85);
        p.x = Math.cos(a) * d; p.y = Math.sin(a) * d; p.z = 1.0;
        continue;
      }

      var r      = Math.min(p.size / p.z, 80);
      var alpha  = Math.min(0.48, (1 - p.z) * 0.54);
      var nv     = p.verts.length;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.beginPath();
      for (var v = 0; v < nv; v++) {
        var ang = (v / nv) * Math.PI * 2;
        var vr  = r * p.verts[v];
        if (v === 0) ctx.moveTo(Math.cos(ang) * vr, Math.sin(ang) * vr);
        else         ctx.lineTo(Math.cos(ang) * vr, Math.sin(ang) * vr);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + p.col + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
      ctx.restore();
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
    var sc = Math.min(W, H) * 0.72;

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
    constellation: { label: 'Constellation', animated: true,  init: constInit,     draw: constDraw     },
    chemistry:     { label: 'Chemistry',      animated: false, init: chemInit,      draw: chemDraw      },
    asteroids:     { label: 'Asteroids',      animated: true,  init: asteroidsInit, draw: asteroidsDraw },
    solar:         { label: 'Solar System',   animated: true,  init: solarInit,     draw: solarDraw     },
  };
  var BG_KEYS    = ['constellation', 'chemistry', 'asteroids', 'solar'];
  var currentKey = null;
  var rafId      = null;

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

    // Sync dropdown
    var sel = document.getElementById('bg-select');
    if (sel) sel.value = key;

    try { localStorage.setItem('sl_bg', key); } catch (e) {}
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
    sel.addEventListener('change', function () { setBackground(this.value); });
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  buildMenu();
  buildModal();

  var saved;
  try { saved = localStorage.getItem('sl_bg'); } catch (e) {}

  if (saved && BG[saved]) {
    setBackground(saved);
  } else {
    setBackground(BG_KEYS[Math.floor(Math.random() * BG_KEYS.length)]);
  }

}());
