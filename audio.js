/* audio.js — Spooner Labs ambient audio
   Generative ambient music via Web Audio API (Am7 spread voicing)
   Starts on first user interaction unless opted out
   M key or button to toggle; opt-out cached in localStorage        */

(function () {
  'use strict';

  var STORE_KEY = 'sl_audio_hidden';

  var actx    = null;   // AudioContext
  var master  = null;   // master GainNode
  var started = false;  // AudioContext + nodes created
  var playing = false;  // currently faded in
  var btn     = null;

  /* ── Opt-out state ─────────────────────────────────────── */
  var optedOut = false;
  try { optedOut = !!localStorage.getItem(STORE_KEY); } catch (e) {}

  /* ── Build audio graph ─────────────────────────────────── */
  function createGraph() {
    if (started) return;
    started = true;

    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    master = actx.createGain();
    master.gain.value = 0;
    master.connect(actx.destination);

    // Warm low-pass filter
    var warmth = actx.createBiquadFilter();
    warmth.type            = 'lowpass';
    warmth.frequency.value = 650;
    warmth.Q.value         = 0.7;
    warmth.connect(master);

    // Simple feedback delay for space
    var delay    = actx.createDelay(2.0);
    var fbGain   = actx.createGain();
    var dlFilter = actx.createBiquadFilter();
    delay.delayTime.value  = 0.44;
    fbGain.gain.value      = 0.26;
    dlFilter.type          = 'lowpass';
    dlFilter.frequency.value = 800;
    delay.connect(dlFilter);
    dlFilter.connect(fbGain);
    fbGain.connect(delay);
    delay.connect(master);

    // Am7 spread voicing:
    // A1 A2 E3 G3 A3 C4 E4  — open, spacious, calm
    var tones = [
      { f:  55.00, v: 0.20, lfo: 0.019, det:   0 },  // A1 sub bass
      { f:  82.41, v: 0.13, lfo: 0.031, det:  -4 },  // E2
      { f: 110.00, v: 0.16, lfo: 0.044, det:   3 },  // A2
      { f: 130.81, v: 0.11, lfo: 0.057, det:  -3 },  // C3
      { f: 164.81, v: 0.13, lfo: 0.038, det:   5 },  // E3
      { f: 196.00, v: 0.08, lfo: 0.063, det:  -7 },  // G3
      { f: 220.00, v: 0.09, lfo: 0.051, det:   6 },  // A3
      { f: 261.63, v: 0.05, lfo: 0.077, det:  -5 },  // C4 shimmer
      { f: 329.63, v: 0.04, lfo: 0.088, det:   4 },  // E4 shimmer
    ];

    tones.forEach(function (t) {
      var osc  = actx.createOscillator();
      var gain = actx.createGain();

      osc.type            = 'sine';
      osc.frequency.value = t.f;
      osc.detune.value    = t.det;
      gain.gain.value     = t.v;

      // Slow LFO tremolo — each tone breathes independently
      var lfo     = actx.createOscillator();
      var lfoGain = actx.createGain();
      lfo.type            = 'sine';
      lfo.frequency.value = t.lfo;
      lfoGain.gain.value  = t.v * 0.22;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(warmth);
      gain.connect(delay);

      osc.start();
      lfo.start();
    });
  }

  /* ── Fade helpers ──────────────────────────────────────── */
  function fadeIn() {
    if (!master) return;
    var now = actx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.06, now + 6);
    playing = true;
    updateBtn();
  }

  function fadeOut(cb) {
    if (!master) { if (cb) cb(); return; }
    var now = actx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 2.5);
    playing = false;
    updateBtn();
    if (cb) setTimeout(cb, 2600);
  }

  /* ── Toggle ────────────────────────────────────────────── */
  function toggleAudio() {
    removeInteractionListeners();

    if (!started) {
      // First manual trigger — clear opt-out and start
      optedOut = false;
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      createGraph();
      if (actx && actx.state === 'suspended') actx.resume();
      fadeIn();
      return;
    }

    if (playing) {
      optedOut = true;
      try { localStorage.setItem(STORE_KEY, '1'); } catch (e) {}
      fadeOut();
    } else {
      optedOut = false;
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      if (actx && actx.state === 'suspended') actx.resume();
      fadeIn();
    }
  }

  /* ── Auto-start on first interaction ───────────────────── */
  function startOnInteraction() {
    removeInteractionListeners();
    if (optedOut || started) return;
    createGraph();
    if (actx.state === 'suspended') {
      actx.resume().then(fadeIn);
    } else {
      fadeIn();
    }
  }

  function removeInteractionListeners() {
    document.removeEventListener('click',   startOnInteraction);
    document.removeEventListener('keydown', startOnInteraction);
    document.removeEventListener('scroll',  startOnInteraction, { passive: true });
  }

  if (!optedOut) {
    document.addEventListener('click',   startOnInteraction);
    document.addEventListener('keydown', startOnInteraction);
    document.addEventListener('scroll',  startOnInteraction, { passive: true });
  }

  /* ── M key ─────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'm' || e.key === 'M') toggleAudio();
  });

  /* ── Button ────────────────────────────────────────────── */
  function updateBtn() {
    if (!btn) return;
    btn.textContent = playing ? 'Turn off music · M' : 'Turn on music · M';
  }

  function buildBtn() {
    btn = document.createElement('button');
    btn.className   = 'bg-toggle-btn bg-toggle-btn--audio';
    btn.textContent = 'Turn on music · M';
    document.body.appendChild(btn);
    btn.addEventListener('click', toggleAudio);
    // Always visible so users can turn it back on
    btn.classList.add('is-visible');
  }

  document.addEventListener('DOMContentLoaded', buildBtn);
  if (document.readyState !== 'loading') buildBtn();

}());
