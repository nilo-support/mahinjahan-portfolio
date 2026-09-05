/* ---------- mascot ----------
   The Jobi character: a rounded-square body with the sprout growing out of the
   top of its head and two dark oval eyes.

   The body is a superellipse sampled into a polar radius table and drawn as one
   smooth closed curve — flat through the middle of each side, turning tightly
   at the corners. Building it from a formula rather than a fixed path is what
   lets it breathe: the corner sharpness and the width and height each drift on
   their own slow cycle, so the silhouette is soft and alive without ever
   stopping being a rounded square. */
(() => {
  const svg      = document.getElementById('mascot');
  const slot     = document.querySelector('.mascot-slot');
  const bodyEl   = document.getElementById('body');
  const groupEl  = document.getElementById('mascot-g');
  const sproutEl = document.getElementById('sprout');
  const sproutArt= document.getElementById('sprout-art');
  const eyeL     = document.getElementById('eye-l');
  const eyeR     = document.getElementById('eye-r');

  const TAU = Math.PI * 2;
  const R   = 100;             /* nominal radius, in viewBox units */
  const N   = 160;             /* samples around the rim */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the body ----------
     A superellipse: n = 2 is an ellipse, n = infinity a rectangle. Just under 4
     gives the Jobi silhouette — sides that read as straight, corners that turn
     in one soft sweep. Very slightly wider than tall, as the character is. */
  const BODY_N = 3.8;
  const BODY_W = 1.06;
  const BODY_H = 0.94;

  /* the shape's own slow breathing: corners soften and firm, and it widens a
     hair as it settles — all small enough to feel like a body, not a pulse */
  const breathe = t => reduced ? { n: 1, w: 1, h: 1 } : ({
    n: 1 + Math.sin(t * 0.31)           * 0.07,
    w: 1 + Math.sin(t * 0.43 + 1.3)     * 0.014,
    h: 1 + Math.sin(t * 0.37 + 2.9)     * 0.016,
  });
  const REST = { n: 1, w: 1, h: 1 };

  function radiusAt(ux, uy, k) {
    const n = BODY_N * k.n;
    return Math.pow(
      Math.pow(Math.abs(ux / (BODY_W * k.w)), n) +
      Math.pow(Math.abs(uy / (BODY_H * k.h)), n), -1 / n);
  }

  /* ---------- measurements, taken once off the resting shape ----------
     The live shape moves, so the layout numbers are read from the still
     version — otherwise the crop and the centring would jitter every frame. */
  const SCALE = (() => {
    let peak = 0;
    for (let i = 0; i < 256; i++) {
      const a = i / 256 * TAU;
      peak = Math.max(peak, radiusAt(Math.cos(a), Math.sin(a), REST));
    }
    return 1.02 / peak;              /* the corners are the farthest point */
  })();
  const restAt = a => radiusAt(Math.cos(a), Math.sin(a), REST) * SCALE * R;

  const RIGHT  = restAt(0);                    /* half-width  of the body */
  const TOP    = -restAt(-Math.PI / 2);        /* y of the top of the head */
  const BOTTOM = restAt(Math.PI / 2);          /* y of the bottom */

  /* ---------- the sprout ----------
     Artwork is 660 x 422 in its own box with the foot of the stem at (325, 422).
     Only about a quarter of that height is stem below the leaves, so the foot
     sits barely inside the head — bury it deeper and the stem disappears and
     the leaves look like they are hovering. */
  const SPROUT_W = 74;                                    /* how wide it grows */
  const SPROUT_S = SPROUT_W / 660;
  const SPROUT_H = 422 * SPROUT_S;
  const SPROUT_X = 0;
  const SPROUT_Y = TOP + 3;
  sproutArt.setAttribute('transform',
    'translate(' + SPROUT_X + ' ' + SPROUT_Y + ') scale(' + SPROUT_S + ') translate(-325 -422)');

  /* the whole character is body plus sprout, so it is that block — not the body
     alone — that gets centred and measured for the layout */
  const ART_TOP = SPROUT_Y - SPROUT_H;
  const CY = (BOTTOM + ART_TOP) / 2;

  /* how much transparent margin the viewBox carries on each side, and how tall
     the character actually is — the layout reads both off these */
  slot.style.setProperty('--dead', ((158 - RIGHT) / 316 * 100).toFixed(2) + '%');
  slot.style.setProperty('--art-h', (BOTTOM - ART_TOP).toFixed(1));

  /* ---------- eyes ----------
     Plain dark ovals, upright and matched, as the character has them. */
  /* Set off the character sheet rather than by eye: each oval is about a sixth
     of the body's width, and the pair sit roughly half the body's width apart. */
  const EYE_X = RIGHT * 0.52;    /* centres, either side of the midline */
  const EYE_Y = CY + 10;
  const EYE_W = 15;              /* radii */
  const EYE_H = 24;

  const r2 = n => Math.round(n * 100) / 100;

  /* Closed Catmull-Rom through the rim samples, emitted as cubics.
     The rim is sampled at even ANGLES, so the points bunch along the flat sides
     and spread around the corners. A uniform Catmull-Rom overshoots on spacing
     like that and the straight runs come out visibly wavy — so the tangents are
     weighted by chord length, which is the cure. */
  function smoothClosed(pts) {
    const n = pts.length;
    const seg = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      seg[i] = Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || 1e-6;
    }
    let d = 'M' + r2(pts[0][0]) + ' ' + r2(pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
            p2 = pts[(i + 1) % n],     p3 = pts[(i + 2) % n];
      const s0 = seg[(i - 1 + n) % n], s1 = seg[i], s2 = seg[(i + 1) % n];
      /* tangent at each end, biased toward the shorter neighbouring chord */
      const w1 = s1 / (s0 + s1) / 3, w2 = s1 / (s1 + s2) / 3;
      d += 'C' + r2(p1[0] + (p2[0] - p0[0]) * w1) + ' ' + r2(p1[1] + (p2[1] - p0[1]) * w1)
        +  ',' + r2(p2[0] - (p3[0] - p1[0]) * w2) + ' ' + r2(p2[1] - (p3[1] - p1[1]) * w2)
        +  ',' + r2(p2[0]) + ' ' + r2(p2[1]);
    }
    return d + 'Z';
  }

  function rim(t, squash) {
    const k = breathe(t);
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, ux = Math.cos(a), uy = Math.sin(a);
      const r = radiusAt(ux, uy, k) * SCALE * R;
      pts.push([ux * r * (1 + squash), uy * r * (1 - squash)]);
    }
    return smoothClosed(pts);
  }

  /* ---------- keeping the eyes in the face ----------
     The body narrows toward its corners, so a gaze offset that sits comfortably
     inside when it looks straight ahead will punch a bite out of the outline
     when it looks up and to the side. Rather than dialling the travel down
     until the worst case happens to fit — which would make the gaze limp
     everywhere else — the offset is tested against the silhouette each frame
     and eased back only as far as it needs to be. So it looks as far as the
     body allows, and no further.

     The test always uses the eyes at full height, even mid-blink, so a blink
     can't let them creep out and then shove them back. */
  const EYE_MARGIN = 8;    /* keep this much body around the eye, and cover the
                              small difference between resting and breathing rim */
  function eyesFit(dx, dy) {
    for (const side of [-1, 1]) {
      const cx = side * EYE_X + dx, cy = EYE_Y + dy;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        const ex = cx + Math.cos(a) * EYE_W;
        const ey = cy + Math.sin(a) * EYE_H;
        if (Math.hypot(ex, ey) > restAt(Math.atan2(ey, ex)) - EYE_MARGIN) return false;
      }
    }
    return true;
  }

  /* ---------- what the mascot is looking at ----------
     Directions are measured from the mascot's own centre, not the window's, so
     "look at this" means the same thing for the cursor and for a project tile.
     Hovering a tile locks the gaze onto it; leaving hands it back to the cursor. */
  let px = 0, py = 0, tx = 0, ty = 0;
  let pointer = null;    /* last cursor position, in viewport px */
  let locked  = null;    /* the tile being hovered, if any */

  const clamp = n => Math.max(-1, Math.min(1, n));

  function aim() {
    const at = locked
      ? (r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))(locked.getBoundingClientRect())
      : pointer;
    if (!at) { tx = 0; ty = 0; return; }
    const box = svg.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    tx = clamp((at.x - cx) / (box.width  * 0.42));
    ty = clamp((at.y - cy) / (box.height * 0.32));
  }

  addEventListener('pointermove', e => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!locked) aim();
  }, { passive: true });

  /* a hovered project pulls the gaze — and holds it while the cursor moves
     around inside the tile */
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('pointerenter', () => { locked = tile; aim(); });
    tile.addEventListener('pointerleave', () => { locked = null;  aim(); });
  });
  addEventListener('resize', aim);

  /* a press squashes the body; letting go pops the eyes wide and whips the
     sprout for a beat */
  let squashT = 0, popT = 0;
  svg.addEventListener('pointerdown', () => { squashT = 1; });
  addEventListener('pointerup', () => { if (squashT > 0.15) popT = 1; });

  /* blinks land on a loose timer, and now and then come in pairs */
  let blink = 0, nextBlink = 1.6, queued = false;
  let focus = 0;                 /* 0 idle, 1 fixed on a project */
  const restBlink = t => t + 2.6 + Math.random() * 3.2;
  const START = performance.now();

  function frame(now) {
    const t = (now - START) / 1000;

    /* a locked tile keeps moving under the cursor, so re-aim every frame */
    if (locked) aim();

    /* eased so the head turns rather than snaps */
    px += (tx - px) * 0.075;
    py += (ty - py) * 0.075;
    focus += ((locked ? 1 : 0) - focus) * 0.09;

    if (t > nextBlink) {
      blink = 1;
      if (queued)                    { queued = false; nextBlink = restBlink(t); }
      else if (Math.random() < 0.28) { queued = true;  nextBlink = t + 0.26; }
      else                           { nextBlink = restBlink(t); }
    }
    blink   *= 0.82;
    squashT *= 0.90;
    popT    *= 0.88;

    const squash = reduced ? 0 : -squashT * 0.09;
    bodyEl.setAttribute('d', rim(t, squash));

    /* it hangs in the air rather than sitting still — two out-of-step sines so
       the bob never repeats on an obvious beat */
    const bobY = reduced ? 0 : Math.sin(t * 0.42) * 5.0 + Math.sin(t * 0.27 + 1.1) * 2.2;
    const bobX = reduced ? 0 : Math.sin(t * 0.31 + 2.3) * 3.0;

    groupEl.setAttribute('transform',
      'translate(' + r2(px * 10 + bobX) + ' ' + r2(py * 10 + bobY - CY) + ') '
      + 'rotate(' + r2(px * 2.2) + ')');

    /* The sprout is light and top-heavy, so it lags the body: it leans against
       the turn, sways on its own slower cycle, and whips when you press. */
    const sway = reduced ? 0
      : Math.sin(t * 0.62) * 3.4 + Math.sin(t * 0.37 + 2.0) * 1.8
        - px * 4.5 + popT * 9;
    sproutEl.setAttribute('transform',
      'rotate(' + r2(sway) + ' ' + r2(SPROUT_X) + ' ' + r2(SPROUT_Y) + ')');

    /* Both tiles sit hard left, so the horizontal aim saturates on either —
       it's the vertical travel that tells the top project from the bottom one,
       which is why the eyes move further in y than the body does. */
    let gx = px * 20, gy = py * 22;
    /* ask for a generous look, then give back only what doesn't fit */
    let fit = 1;
    while (fit > 0.15 && !eyesFit(gx * fit, gy * fit)) fit -= 0.1;
    gx *= fit; gy *= fit;

    /* narrowed while it studies a project, popped wide just after a press */
    const lid = Math.max(0.06, (1 - blink * 1.35) * (1 - focus * 0.26) * (1 + popT * 0.16));

    for (const [el, ox] of [[eyeL, -EYE_X], [eyeR, EYE_X]]) {
      el.setAttribute('cx', r2(ox + gx));
      el.setAttribute('cy', r2(EYE_Y + gy));
      el.setAttribute('rx', EYE_W);
      el.setAttribute('ry', r2(EYE_H * lid));
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
