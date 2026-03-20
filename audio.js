/* audio.js — Spooner Labs ambient music
   Generative Daft Punk-inspired house: kick, snare, hi-hat,
   filtered sawtooth bass, detuned pad chords, 8th-note arp,
   convolution reverb + dynamics compressor.
   Am – F – C – G loop at 118 BPM.
   M key / button to toggle; opt-out cached in localStorage   */

(function () {
  'use strict';

  var STORE_KEY = 'sl_audio_hidden';
  var BPM       = 118;
  var STEP      = 60 / BPM / 4;          // 16th-note duration in seconds

  var actx      = null;
  var master    = null;
  var comp      = null;
  var verb      = null;
  var noiseBuf  = null;

  var started   = false;
  var playing   = false;
  var seqTimer  = null;
  var curStep   = 0;
  var nextTime  = 0;
  var prevChord = -1;
  var padNodes  = [];

  var btn = null;
  var optedOut = false;
  try { optedOut = !!localStorage.getItem(STORE_KEY); } catch (e) {}

  /* ── Chord progression: Am – F – C – G ──────────────────
     Each chord = 32 steps (2 bars). Full loop = 128 steps (8 bars).
     bass[]  : note played every 8 steps (half-bar), sawtooth
     pad[]   : sustained chord tones, detuned sawtooth pads
     arp[]   : 8-note pattern, played every 2 steps (8th notes)   */
  var PROG = [
    {
      pad: [220.00, 261.63, 329.63],          // A3 C4 E4
      bass:[110.00, 110.00, 164.81, 110.00],  // A2 A2 E3 A2
      arp: [440.00, 329.63, 261.63, 220.00,
            329.63, 440.00, 261.63, 329.63],
    },
    {
      pad: [174.61, 220.00, 261.63],          // F3 A3 C4
      bass:[ 87.31,  87.31, 130.81,  87.31],
      arp: [349.23, 261.63, 220.00, 174.61,
            261.63, 349.23, 220.00, 261.63],
    },
    {
      pad: [261.63, 329.63, 392.00],          // C4 E4 G4
      bass:[130.81, 130.81, 196.00, 130.81],
      arp: [523.25, 392.00, 329.63, 261.63,
            392.00, 523.25, 329.63, 392.00],
    },
    {
      pad: [196.00, 246.94, 293.66],          // G3 B3 D4
      bass:[ 98.00,  98.00, 146.83,  98.00],
      arp: [392.00, 293.66, 246.94, 196.00,
            293.66, 392.00, 246.94, 293.66],
    },
  ];
  var CHORD_STEPS = 32;
  var TOTAL_STEPS = PROG.length * CHORD_STEPS;  // 128

  /* 16-step drum patterns */
  var KICK  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];  // four-on-floor
  var SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];  // 2 and 4
  var HIHAT = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];  // 8th notes
  var OPENH = [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0];  // off-beat open

  /* ── Audio graph ────────────────────────────────────────── */
  function mkNoiseBuf() {
    var n   = actx.sampleRate * 1;
    var buf = actx.createBuffer(1, n, actx.sampleRate);
    var d   = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function mkReverb() {
    var dur  = 2.8, dec = 2.8;
    var len  = Math.floor(actx.sampleRate * dur);
    var buf  = actx.createBuffer(2, len, actx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec);
    }
    var cv = actx.createConvolver();
    cv.buffer = buf;
    return cv;
  }

  function createGraph() {
    if (started) return;
    started = true;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    noiseBuf = mkNoiseBuf();
    verb     = mkReverb();
    comp     = actx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value      = 8;
    comp.ratio.value     = 5;
    comp.attack.value    = 0.003;
    comp.release.value   = 0.20;

    master = actx.createGain();
    master.gain.value = 0;

    comp.connect(master);
    verb.connect(master);
    master.connect(actx.destination);
  }

  /* ── Sound generators ───────────────────────────────────── */
  function kick(t) {
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.11);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    o.connect(g); g.connect(comp);
    o.start(t); o.stop(t + 0.22);
  }

  function snare(t) {
    // Body: tuned noise burst
    var ns = actx.createBufferSource();
    var bf = actx.createBiquadFilter();
    var ng = actx.createGain();
    ns.buffer = noiseBuf;
    bf.type = 'bandpass'; bf.frequency.value = 1600; bf.Q.value = 1.4;
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    ns.connect(bf); bf.connect(ng);
    ng.connect(comp); ng.connect(verb);
    ns.start(t); ns.stop(t + 0.14);

    // Snap: short sine
    var so = actx.createOscillator();
    var sg = actx.createGain();
    so.frequency.value = 200;
    sg.gain.setValueAtTime(0.12, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    so.connect(sg); sg.connect(comp);
    so.start(t); so.stop(t + 0.06);
  }

  function hihat(t, open) {
    var ns = actx.createBufferSource();
    var hf = actx.createBiquadFilter();
    var hg = actx.createGain();
    var dur = open ? 0.18 : 0.038;
    ns.buffer = noiseBuf;
    hf.type = 'highpass'; hf.frequency.value = 8800;
    hg.gain.setValueAtTime(open ? 0.09 : 0.07, t);
    hg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    ns.connect(hf); hf.connect(hg); hg.connect(comp);
    ns.start(t); ns.stop(t + dur + 0.01);
  }

  function bass(t, freq, dur) {
    // Sawtooth + sub sine for warmth
    var so = actx.createOscillator();
    var sf = actx.createBiquadFilter();
    var sg = actx.createGain();
    so.type = 'sawtooth';
    so.frequency.value = freq;
    sf.type = 'lowpass'; sf.frequency.value = 340; sf.Q.value = 2.8;
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.28, t + 0.018);
    sg.gain.setValueAtTime(0.28, t + dur - 0.04);
    sg.gain.linearRampToValueAtTime(0, t + dur);
    so.connect(sf); sf.connect(sg); sg.connect(comp);
    so.start(t); so.stop(t + dur + 0.01);

    // Sub
    var oo = actx.createOscillator();
    var og = actx.createGain();
    oo.type = 'sine'; oo.frequency.value = freq * 0.5;
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.16, t + 0.02);
    og.gain.setValueAtTime(0.16, t + dur - 0.04);
    og.gain.linearRampToValueAtTime(0, t + dur);
    oo.connect(og); og.connect(comp);
    oo.start(t); oo.stop(t + dur + 0.01);
  }

  function clearPads() {
    padNodes.forEach(function (n) {
      try {
        var now = actx.currentTime;
        n.g.gain.setValueAtTime(n.g.gain.value, now);
        n.g.gain.linearRampToValueAtTime(0, now + 0.6);
        n.o.stop(now + 0.7);
        n.l.stop(now + 0.7);
      } catch (e) {}
    });
    padNodes = [];
  }

  function startPads(chord) {
    clearPads();
    chord.pad.forEach(function (freq) {
      [-10, 0, 10].forEach(function (det) {
        var o  = actx.createOscillator();
        var f  = actx.createBiquadFilter();
        var g  = actx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        o.detune.value    = det;
        f.type = 'lowpass'; f.frequency.value = 1100; f.Q.value = 1.4;

        // Slow filter sweep LFO — the Daft Punk "alive" feeling
        var l  = actx.createOscillator();
        var lg = actx.createGain();
        l.type = 'sine'; l.frequency.value = 0.14;
        lg.gain.value = 480;
        l.connect(lg); lg.connect(f.frequency);

        g.gain.setValueAtTime(0, actx.currentTime);
        g.gain.linearRampToValueAtTime(det === 0 ? 0.038 : 0.024,
                                        actx.currentTime + 1.2);

        o.connect(f); f.connect(g);
        g.connect(comp); g.connect(verb);
        o.start(); l.start();
        padNodes.push({ o: o, l: l, g: g });
      });
    });
  }

  function arp(t, freq) {
    var o  = actx.createOscillator();
    var f  = actx.createBiquadFilter();
    var g  = actx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    o.detune.value    = -10;
    f.type = 'lowpass'; f.frequency.value = 3200; f.Q.value = 0.8;
    var dur = STEP * 1.75;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.006);
    g.gain.setValueAtTime(0.09, t + dur - 0.018);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f); f.connect(g);
    g.connect(comp); g.connect(verb);
    o.start(t); o.stop(t + dur + 0.01);
  }

  /* ── Sequencer ──────────────────────────────────────────── */
  function scheduleStep(step, t) {
    var bar    = step % 16;
    var ci     = Math.floor(step / CHORD_STEPS) % PROG.length;
    var chord  = PROG[ci];
    var cs     = step % CHORD_STEPS;

    if (ci !== prevChord) { prevChord = ci; startPads(chord); }

    if (KICK[bar])  kick(t);
    if (SNARE[bar]) snare(t);
    if (HIHAT[bar]) hihat(t, false);
    if (OPENH[bar]) hihat(t, true);

    // Bass: new note every 8 steps (half-bar)
    if (cs % 8 === 0) {
      var bi = Math.floor(cs / 8) % chord.bass.length;
      bass(t, chord.bass[bi], STEP * 7.6);
    }

    // Arp: every 2 steps (8th notes), 8-note cycle
    if (step % 2 === 0) {
      var ai = Math.floor(cs / 2) % chord.arp.length;
      arp(t, chord.arp[ai]);
    }
  }

  function nextStep() {
    nextTime += STEP;
    curStep   = (curStep + 1) % TOTAL_STEPS;
  }

  function scheduler() {
    while (nextTime < actx.currentTime + 0.14) {
      scheduleStep(curStep, nextTime);
      nextStep();
    }
    seqTimer = setTimeout(scheduler, 22);
  }

  /* ── Start / stop ───────────────────────────────────────── */
  function startMusic() {
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    curStep    = 0;
    nextTime   = actx.currentTime + 0.08;
    prevChord  = -1;
    scheduler();
    var now = actx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.82, now + 5);
    playing = true;
    updateBtn();
  }

  function stopMusic() {
    clearTimeout(seqTimer);
    clearPads();
    var now = actx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 2.5);
    playing = false;
    updateBtn();
  }

  /* ── Toggle ─────────────────────────────────────────────── */
  function toggleAudio() {
    removeListeners();
    if (!started) {
      optedOut = false;
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      createGraph();
      startMusic();
      return;
    }
    if (playing) {
      optedOut = true;
      try { localStorage.setItem(STORE_KEY, '1'); } catch (e) {}
      stopMusic();
    } else {
      optedOut = false;
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      startMusic();
    }
  }

  /* ── Auto-start on first interaction ────────────────────── */
  function onInteract() {
    removeListeners();
    if (optedOut || started) return;
    createGraph();
    startMusic();
  }

  function removeListeners() {
    document.removeEventListener('click',   onInteract);
    document.removeEventListener('keydown', onInteract);
    document.removeEventListener('scroll',  onInteract, { passive: true });
  }

  if (!optedOut) {
    document.addEventListener('click',   onInteract);
    document.addEventListener('keydown', onInteract);
    document.addEventListener('scroll',  onInteract, { passive: true });
  }

  /* ── M key ──────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'm' || e.key === 'M') toggleAudio();
  });

  /* ── Button ─────────────────────────────────────────────── */
  function updateBtn() {
    if (!btn) return;
    btn.textContent = playing ? 'Turn off music · M' : 'Turn on music · M';
  }

  function buildBtn() {
    if (btn) return;
    btn = document.createElement('button');
    btn.className   = 'bg-toggle-btn bg-toggle-btn--audio';
    btn.textContent = 'Turn on music · M';
    btn.classList.add('is-visible');
    document.body.appendChild(btn);
    btn.addEventListener('click', toggleAudio);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBtn);
  } else {
    buildBtn();
  }

}());
