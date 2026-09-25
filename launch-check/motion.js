/* Launch Check motion. See DESIGN.md, "Motion": every animation here has a reason, a
   duration from the token list and a reduced-motion fallback. No libraries: the Web
   Animations API, CSS and a few lines of maths. Loaded before app.js, which calls
   window.LCMotion for the checking sequence and the readiness gauge. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() {
    return !!(reduce && reduce.matches);
  }
  var EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function rand(s) {
    return s.charAt(Math.floor(Math.random() * s.length));
  }

  // ---------- Split-flap text ----------
  // Each character flips through a few letters and settles, left to right, like a
  // departures board. Character boxes are locked to their final width first, so the
  // line never reflows while letters change.
  function splitFlap(el, opts) {
    opts = opts || {};
    var text = el.textContent;
    if (reduced() || !text.trim() || !el.animate) return;
    el.setAttribute('aria-label', text);
    var frag = document.createDocumentFragment();
    var cells = [];
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      var word = document.createElement('span');
      word.className = 'flap-word';
      word.setAttribute('aria-hidden', 'true');
      part.split('').forEach(function (ch) {
        var c = document.createElement('span');
        c.className = 'flap-char';
        c.textContent = ch;
        word.appendChild(c);
        if (/[A-Za-z]/.test(ch)) cells.push({ el: c, final: ch });
      });
      frag.appendChild(word);
    });
    el.textContent = '';
    el.appendChild(frag);
    cells.forEach(function (c) {
      c.el.style.width = c.el.getBoundingClientRect().width + 'px';
    });

    var perFlip = opts.flip || 55;
    var flips = opts.flips || 4;
    var stagger = Math.min(opts.stagger || 22, 700 / Math.max(1, cells.length));
    cells.forEach(function (c, i) {
      var n = 0;
      setTimeout(function tick() {
        var last = n >= flips;
        c.el.textContent = last ? c.final : rand(LETTERS);
        c.el.animate(
          [{ transform: 'rotateX(-80deg)', opacity: 0.4 }, { transform: 'none', opacity: 1 }],
          { duration: perFlip, easing: EASE_OUT }
        );
        n++;
        if (!last) setTimeout(tick, perFlip);
      }, i * stagger);
    });
  }

  // ---------- Scramble ----------
  // Letters settle from random mono glyphs into the real words. Used for the check
  // names, so each check visibly "reads in" as it runs.
  function scramble(el, text, ms) {
    ms = ms || 360;
    if (reduced()) {
      el.textContent = text;
      return;
    }
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / ms);
      var settled = Math.floor(p * text.length);
      var out = text.slice(0, settled);
      for (var i = settled; i < text.length; i++) out += text.charAt(i) === ' ' ? ' ' : rand(LETTERS);
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = text;
    }
    requestAnimationFrame(frame);
  }

  // A status word flips over to its new value (Waiting → Checked, COPY → COPIED).
  function flipTo(el, text) {
    if (reduced() || !el.animate) {
      el.textContent = text;
      return;
    }
    var out = el.animate([{ transform: 'none' }, { transform: 'rotateX(90deg)' }], { duration: 90, easing: 'ease-in' });
    out.onfinish = function () {
      el.textContent = text;
      el.animate([{ transform: 'rotateX(-90deg)' }, { transform: 'none' }], { duration: 130, easing: EASE_OUT });
    };
  }

  // ---------- Readiness gauge ----------
  // A 240° dial. The yellow arc is how much of the plan is done; the red arc right
  // after it is the must-fix share still ahead; the needle points at "done".
  var SWEEP = 240;
  var R = 84;
  var ARC = (2 * Math.PI * R * SWEEP) / 360;

  function gaugeMarkup() {
    return (
      '<svg class="gauge__dial" viewBox="0 0 200 180" aria-hidden="true">' +
      // Circles start drawing at 3 o'clock; rotating by 150° starts the dial at the
      // bottom left, so a 240° sweep ends at the bottom right.
      '<circle class="gauge__track" cx="100" cy="100" r="' + R + '" transform="rotate(150 100 100)" stroke-dasharray="' + ARC.toFixed(2) + ' 9999" />' +
      '<circle class="gauge__must" cx="100" cy="100" r="' + R + '" transform="rotate(150 100 100)" stroke-dasharray="0 9999" />' +
      '<circle class="gauge__fill" cx="100" cy="100" r="' + R + '" transform="rotate(150 100 100)" stroke-dasharray="0 9999" />' +
      '<g class="gauge__ticks">' + ticks() + '</g>' +
      '<g class="gauge__needle"><path d="M100 100 L100 30" /><circle cx="100" cy="100" r="7" /></g>' +
      '</svg>' +
      '<p class="gauge__read"><span class="gauge__num"><span class="gauge__value">0</span>%</span> <span class="gauge__word">ready</span></p>' +
      '<p class="gauge__must-label"></p>'
    );
  }
  function ticks() {
    var out = '';
    for (var i = 0; i <= 10; i++) {
      var a = ((-SWEEP / 2 + (SWEEP * i) / 10) * Math.PI) / 180;
      var r1 = i % 5 === 0 ? 62 : 68;
      out += '<line x1="' + (100 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (100 - Math.cos(a) * r1).toFixed(1) +
        '" x2="' + (100 + Math.sin(a) * 74).toFixed(1) + '" y2="' + (100 - Math.cos(a) * 74).toFixed(1) + '" />';
    }
    return out;
  }

  function gauge(host, done, must, mustCount) {
    if (!host.firstChild) host.innerHTML = gaugeMarkup();
    var prev = host.__g || { done: 0, must: 0 };
    var to = { done: Math.max(0, Math.min(1, done)), must: Math.max(0, Math.min(1 - done, must)) };
    host.__g = to;
    host.setAttribute('role', 'img');
    host.setAttribute(
      'aria-label',
      Math.round(to.done * 100) + '% ready. ' + mustCount + (mustCount === 1 ? ' must-fix task left.' : ' must-fix tasks left.')
    );
    host.querySelector('.gauge__must-label').textContent = mustCount
      ? mustCount + ' must-fix ' + (mustCount === 1 ? 'task' : 'tasks') + ' left'
      : 'No must-fix tasks left';

    var fill = host.querySelector('.gauge__fill');
    var mustArc = host.querySelector('.gauge__must');
    var needle = host.querySelector('.gauge__needle');
    var value = host.querySelector('.gauge__value');

    function draw(d, m) {
      var dl = ARC * d;
      fill.setAttribute('stroke-dasharray', dl.toFixed(2) + ' 9999');
      mustArc.setAttribute('stroke-dasharray', '0 ' + dl.toFixed(2) + ' ' + (ARC * m).toFixed(2) + ' 9999');
      needle.style.transform = 'rotate(' + (-SWEEP / 2 + SWEEP * d).toFixed(2) + 'deg)';
      value.textContent = Math.round(d * 100);
    }
    if (reduced()) {
      draw(to.done, to.must);
      return;
    }
    var start = performance.now();
    var dur = 700;
    // back.out(1.4): overshoot a little, then settle. Only the needle and the
    // numbers use it; nothing else in the product bounces.
    function backOut(t) {
      var s = 1.4;
      t -= 1;
      return t * t * ((s + 1) * t + s) + 1;
    }
    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = backOut(p);
      var d = prev.done + (to.done - prev.done) * e;
      var m = prev.must + (to.must - prev.must) * Math.min(1, p * 1.4);
      draw(Math.max(0, Math.min(1, d)), Math.max(0, m));
      if (p < 1) requestAnimationFrame(frame);
      else draw(to.done, to.must);
    }
    requestAnimationFrame(frame);
  }

  // ---------- Rocket launch ----------
  // The one signature moment: drag the rocket up (or press Start) and it launches.
  // Its trail widens into the next screen's background, so the smoke becomes the
  // "Describe your app" page. Reduced motion, or no Web Animations: straight to it.
  var launching = false;
  function launch(rocket, target) {
    if (launching) return;
    if (reduced() || !rocket || !rocket.animate || !document.body.animate) {
      location.hash = target;
      return;
    }
    launching = true;
    var r = rocket.getBoundingClientRect();
    var W = window.innerWidth;
    var H = window.innerHeight;
    var cx = r.left + r.width / 2;
    var base = Math.min(H, r.bottom);
    var trail = document.createElement('div');
    trail.className = 'launch-trail';
    trail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trail);

    // The rocket flies above its own trail.
    rocket.style.position = 'relative';
    rocket.style.zIndex = '101';
    var lift = parseFloat(rocket.getAttribute('data-lift') || '0');
    var fly = rocket.animate(
      [
        { transform: 'translateY(' + lift + 'px)' },
        { transform: 'translateY(' + (lift + 6) + 'px) scale(0.98)', offset: 0.12 },
        { transform: 'translateY(' + -(r.bottom + 80) + 'px)' }
      ],
      { duration: 700, easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)', fill: 'forwards' }
    );
    function inset(t, rr, b, l) {
      return 'inset(' + t + 'px ' + rr + 'px ' + b + 'px ' + l + 'px)';
    }
    var nar = 7;
    var wide = Math.max(60, W * 0.12);
    trail.animate(
      [
        { clipPath: inset(base, W - cx - nar, H - base, cx - nar) },
        { clipPath: inset(base - 40, W - cx - nar, H - base, cx - nar), offset: 0.14 },
        { clipPath: inset(0, W - cx - wide, 0, cx - wide), offset: 0.62 },
        { clipPath: inset(0, 0, 0, 0) }
      ],
      { duration: 900, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }
    ).onfinish = function () {
      location.hash = target;
      // The new screen renders under the trail, which is already its background;
      // the trail then fades so the page's content appears.
      requestAnimationFrame(function () {
        var fade = trail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
        fade.onfinish = function () {
          trail.remove();
          fly.cancel();
          rocket.removeAttribute('data-lift');
          rocket.style.transform = '';
          rocket.style.position = '';
          rocket.style.zIndex = '';
          launching = false;
        };
      });
    };
  }

  function setupRocket() {
    var rocket = document.getElementById('rocket');
    if (!rocket) return;
    var target = rocket.getAttribute('data-target') || '#describe';
    var startY = null;
    var lastY = 0;
    var lastT = 0;
    var vy = 0;
    var moved = false;
    var MAX = 64;

    rocket.addEventListener('pointerdown', function (e) {
      if (launching) return;
      startY = e.clientY;
      lastY = e.clientY;
      lastT = e.timeStamp;
      vy = 0;
      moved = false;
      rocket.setPointerCapture(e.pointerId);
    });
    rocket.addEventListener('pointermove', function (e) {
      if (startY === null) return;
      var dy = Math.min(0, e.clientY - startY);
      if (Math.abs(e.clientY - startY) > 6) moved = true;
      // Resistance, like pulling back before a launch.
      var lift = -MAX * (1 - Math.exp(dy / MAX));
      rocket.style.transform = 'translateY(' + lift.toFixed(1) + 'px)';
      rocket.setAttribute('data-lift', lift.toFixed(1));
      var dt = e.timeStamp - lastT;
      if (dt > 0) vy = (e.clientY - lastY) / dt;
      lastY = e.clientY;
      lastT = e.timeStamp;
    });
    function end(e) {
      if (startY === null) return;
      var dy = e.clientY - startY;
      startY = null;
      if (!moved) return; // a tap: the click handler launches
      if (dy < -40 || vy < -0.6) {
        launch(rocket, target);
      } else {
        var lift = parseFloat(rocket.getAttribute('data-lift') || '0');
        rocket.removeAttribute('data-lift');
        rocket.style.transform = '';
        if (!reduced()) {
          rocket.animate([{ transform: 'translateY(' + lift + 'px)' }, { transform: 'none' }], { duration: 200, easing: EASE_OUT });
        }
      }
    }
    rocket.addEventListener('pointerup', end);
    rocket.addEventListener('pointercancel', end);
    rocket.addEventListener('click', function (e) {
      e.preventDefault();
      if (moved) {
        moved = false;
        return;
      }
      launch(rocket, target);
    });

    // The main button launches the same rocket, so both roads look the same.
    document.querySelectorAll('[data-view="landing"] a[href="#describe"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
        e.preventDefault();
        launch(rocket, target);
      });
    });
  }

  function setupHeadline() {
    var h = document.getElementById('landing-title');
    var landing = document.querySelector('[data-view="landing"]');
    if (!h || !landing || landing.hidden) return;
    var go = function () {
      splitFlap(h, { flips: 4, flip: 55, stagger: 24 });
    };
    if (document.fonts && document.fonts.ready) {
      // Wait for Archivo so the locked widths are the real ones, but never longer
      // than a moment: the headline must not sit blank.
      var done = false;
      var once = function () {
        if (!done) {
          done = true;
          go();
        }
      };
      document.fonts.ready.then(once);
      setTimeout(once, 600);
    } else go();
  }

  // The landing example is a real checklist: ticking a row flips its status and
  // the count, the same way the real plan behaves.
  function setupBoard() {
    var boxes = Array.prototype.slice.call(document.querySelectorAll('.board__check'));
    var count = document.getElementById('board-count');
    if (!boxes.length || !count) return;
    boxes.forEach(function (cb) {
      cb.addEventListener('change', function () {
        var status = cb.parentNode.querySelector('[data-board-status]');
        status.className = 'status ' + (cb.checked ? 'status--go' : 'status--alert');
        flipTo(status, cb.checked ? 'Done' : 'Missing');
        var n = boxes.filter(function (b) {
          return b.checked;
        }).length;
        flipTo(count, n + ' of ' + boxes.length + ' done');
      });
    });
  }

  // Paste: the box confirms it received the text, and how much.
  function setupPaste() {
    var box = document.getElementById('summary');
    var out = document.getElementById('summary-received');
    if (!box || !out) return;
    function report() {
      var n = box.value.trim().length;
      out.textContent = n ? n.toLocaleString() + (n === 1 ? ' character received' : ' characters received') : '';
    }
    box.addEventListener('paste', function () {
      setTimeout(function () {
        report();
        box.classList.remove('is-received');
        void box.offsetWidth;
        box.classList.add('is-received');
      }, 0);
    });
    box.addEventListener('input', report);
  }

  window.LCMotion = { splitFlap: splitFlap, scramble: scramble, flipTo: flipTo, gauge: gauge, launch: launch, reduced: reduced };

  document.addEventListener('DOMContentLoaded', function () {
    setupRocket();
    setupHeadline();
    setupBoard();
    setupPaste();
  });
})();
