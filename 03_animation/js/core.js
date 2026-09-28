/* Core: timeline, helpers, deterministic seeking */
(function () {
  const W = 1080, H = 1920;
  const BAR = 1.875, BEAT = BAR / 4;
  const T = {
    W, H, BAR, BEAT,
    DROP: 5.625, JUMP: 20.625, HIT: 28.125, DUR: 30,
  };
  gsap.registerPlugin(CustomEase, DrawSVGPlugin, MorphSVGPlugin);
  gsap.ticker.lagSmoothing(0);
  gsap.config({ force3D: true, nullTargetWarn: false });
  gsap.defaults({ overwrite: false });

  // Signature eases
  CustomEase.create("snap", "M0,0 C0.12,0.72 0.22,1 1,1");          // fast attack, long settle
  CustomEase.create("whip", "M0,0 C0.7,0 0.2,1 1,1");               // anticipation-less whip pan
  CustomEase.create("pop", "M0,0 C0.18,1.5 0.42,1.08 0.62,0.98 C0.78,0.94 0.9,1 1,1"); // overshoot pop

  const tl = gsap.timeline({ paused: true });
  ["to", "from", "fromTo", "set", "add", "call"].forEach((fn) => {
    const orig = tl[fn].bind(tl);
    tl[fn] = function () {
      const pos = arguments[arguments.length - 1];
      if (typeof pos === "number" && pos < 0) throw new Error("negative timeline position " + pos + " in " + fn);
      return orig.apply(null, arguments);
    };
  });
  const procs = [];

  function el(tag, opts, parent) {
    opts = opts || {};
    const e = document.createElement(tag);
    if (opts.cls) e.className = opts.cls;
    if (opts.html != null) e.innerHTML = opts.html;
    if (opts.text != null) e.textContent = opts.text;
    if (opts.style) Object.assign(e.style, opts.style);
    if (opts.attrs) for (const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
    (parent || document.body).appendChild(e);
    return e;
  }
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

  // Scene container with deterministic visibility window
  function scene(id, t0, t1, bg) {
    const s = el("div", { cls: "scene", attrs: { id } }, document.getElementById("stage"));
    if (bg) s.style.background = bg;
    procs.push((t) => { s.style.visibility = t >= t0 && t < t1 ? "visible" : "hidden"; });
    return s;
  }

  // Multi-line display text. lines: array of strings (may contain <em> spans). Returns {box, inners}
  function textBlock(parent, lines, style, cls) {
    const box = el("div", { cls: "abs display " + (cls || ""), style }, parent);
    const inners = lines.map((ln) => {
      const line = el("span", { cls: "line" }, box);
      return el("span", { cls: "inner", html: ln }, line);
    });
    return { box, inners };
  }
  // Mask-reveal lines from below
  // Each masked line is only painted inside its active window [reveal start, hide end]:
  // in the parked states (below before the reveal, above after the hide) a rotated wide line
  // could otherwise peek through the mask padding as a thin sliver.
  const lineWin = new Map();
  const win = (n) => { let w = lineWin.get(n); if (!w) { w = { a: 0, b: Infinity }; lineWin.set(n, w); } return w; };
  function revealLines(inners, t0, stagger, dur, ease) {
    if (t0 < 0) throw new Error("negative timeline position " + t0);
    inners.forEach((n, i) => {
      const st = t0 + i * stagger;
      tl.fromTo(n, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: dur || 0.62, ease: ease || "expo.out" }, st);
      win(n).a = st;
    });
  }
  function hideLines(inners, t0, stagger, dur) {
    inners.forEach((n, i) => {
      const st = t0 + i * (stagger || 0);
      tl.to(n, { yPercent: -115, duration: dur || 0.4, ease: "power3.in" }, st);
      win(n).b = st + (dur || 0.4);
    });
  }
  procs.push((t) => {
    if (window.__lineGuard === false) { lineWin.forEach((w, n) => { n.style.visibility = ""; }); return; }
    lineWin.forEach((w, n) => { n.style.visibility = t >= w.a - 1e-4 && t <= w.b + 1e-4 ? "" : "hidden"; });
  });
  // Split text of an element into word spans (keeps inner HTML simple)
  function splitWords(node) {
    const words = node.textContent.split(" ");
    node.innerHTML = "";
    return words.map((w, i) => {
      const s = el("span", { cls: "word", text: w }, node);
      if (i < words.length - 1) node.appendChild(document.createTextNode(" "));
      return s;
    });
  }

  function seek(t) {
    t = clamp(t, 0, T.DUR - 1e-6);
    tl.seek(t, false);
    for (let i = 0; i < procs.length; i++) procs[i](t);
  }

  window.M = { T, tl, procs, el, svgEl, rng, clamp, lerp, smooth, easeOutExpo, scene, textBlock, revealLines, hideLines, splitWords, seek };
})();
