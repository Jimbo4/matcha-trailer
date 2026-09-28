/* Brand flower shapes (Matcha marketing language): rounded 5-petal, scalloped cloud, pointy sun, clover */
(function () {
  const { el, svgEl } = window.M;
  const SHAPES = {
    // k petals, inner radius ratio, exponent (small = fat round lobes, large = pointy petals)
    round5:  { k: 5, inner: 0.36, p: 0.34 },
    round6:  { k: 6, inner: 0.40, p: 0.36 },
    scallop: { k: 7, inner: 0.72, p: 0.35 },
    sun:     { k: 8, inner: 0.46, p: 0.95 },
    clover:  { k: 4, inner: 0.26, p: 0.40 },
    star:    { k: 6, inner: 0.30, p: 2.4 },
  };
  function flowerD(shape, R, N) {
    const s = SHAPES[shape] || SHAPES.round5;
    N = N || 360;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const c = 0.5 + 0.5 * Math.cos(s.k * th); // cos^2(k th / 2): smooth notches
      const r = R * (s.inner + (1 - s.inner) * Math.pow(c, s.p));
      pts.push((r * Math.cos(th - Math.PI / 2)).toFixed(2) + "," + (r * Math.sin(th - Math.PI / 2)).toFixed(2));
    }
    return "M" + pts.join("L") + "Z";
  }
  // Creates an absolutely positioned svg flower centered at (x,y) with radius R
  function flower(parent, o) {
    const R = o.R || 100;
    const pad = 4;
    const size = 2 * R + pad * 2;
    const svg = svgEl("svg", { class: "flower", width: size, height: size, viewBox: `${-R - pad} ${-R - pad} ${size} ${size}` });
    svg.style.left = (o.x - R - pad) + "px";
    svg.style.top = (o.y - R - pad) + "px";
    const path = svgEl("path", { d: flowerD(o.shape || "round5", R), fill: o.color || "#FF9DDA" }, svg);
    if (o.center) svgEl("circle", { cx: 0, cy: 0, r: R * 0.16, fill: o.center }, svg);
    parent.appendChild(svg);
    svg._path = path;
    return svg;
  }
  window.M.flowerD = flowerD;
  window.M.flower = flower;
  window.M.SHAPES = SHAPES;
})();
/* Flower iris: reveal an element through a growing flower-shaped clip-path (deterministic, proc-driven) */
(function () {
  const { procs, clamp, SHAPES } = window.M;
  function flowerPathAt(shape, cx, cy, R, rot, N, rMin) {
    const s = SHAPES[shape] || SHAPES.round5; N = N || 220;
    let d = "M";
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const c = 0.5 + 0.5 * Math.cos(s.k * th);
      const r = Math.max(rMin || 0, R * (s.inner + (1 - s.inner) * Math.pow(c, s.p)));
      const a = th + rot - Math.PI / 2;
      d += (cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1) + (i < N - 1 ? "L" : "Z");
    }
    return d;
  }
  function iris(node, o) {
    const shape = o.shape || "round5";
    const s = SHAPES[shape];
    const far = Math.max(Math.hypot(o.cx, o.cy), Math.hypot(1080 - o.cx, o.cy), Math.hypot(o.cx, 1920 - o.cy), Math.hypot(1080 - o.cx, 1920 - o.cy));
    const Rmax = (far / s.inner) * 1.02;
    const ease = o.ease || ((u) => 1 - Math.pow(1 - u, 3));
    const rot0 = o.rot0 || 0, rot1 = o.rot1 == null ? 0.6 : o.rot1;
    procs.push((t) => {
      if (t < o.t0) { node.style.clipPath = "path('M0,0Z')"; return; }
      const u = clamp((t - o.t0) / o.dur, 0, 1);
      if (u >= 1) { node.style.clipPath = "none"; return; }
      const e = ease(u);
      const R = Math.max(0.5, (o.R0 || 0) + (Rmax - (o.R0 || 0)) * e);
      // once the bloom has passed the frame edges, the notches between petals fill in,
      // so no slivers of the previous scene linger in the corners
      const x = clamp((e - 0.3) / 0.4, 0, 1), fill = o.fill === false ? 0 : x * x * (3 - 2 * x);
      const rMin = R * (s.inner + (1 - s.inner) * fill);
      node.style.clipPath = "path('" + flowerPathAt(shape, o.cx, o.cy, R, rot0 + (rot1 - rot0) * e, 220, rMin) + "')";
    });
  }
  window.M.flowerPathAt = flowerPathAt;
  window.M.iris = iris;
})();
