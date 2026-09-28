/* S2 — the turn (DROP → 7.5): chat bubbles burst into brand flowers. "Le cose belle non succedono in chat." */
(function () {
  const { T, tl, procs, el, svgEl, scene, textBlock, revealLines, hideLines, rng, clamp, lerp, smooth, flower, iris } = window.M;
  const t0 = T.DROP, t1 = 7.5 + 0.7;
  const S = scene("s2", t0, t1, "#71F0AB");
  iris(S, { cx: 540, cy: 900, t0: t0 + 0.02, dur: 0.5, shape: "round5", rot0: -0.5, rot1: 0.35 });

  // Burst layer sits ABOVE everything at the drop (independent of S2 clip)
  const burst = el("div", { cls: "abs", style: { left: 0, top: 0, width: "1080px", height: "1920px", pointerEvents: "none", zIndex: 30 } }, document.getElementById("stage"));
  procs.push((t) => { burst.style.visibility = t >= T.DROP - 0.01 && t < T.DROP + 1.2 ? "visible" : "hidden"; });
  const r = rng(5);
  const palette = ["#FF9DDA", "#FFD36E", "#62CFC0", "#FFFAFA", "#71F0AB"];
  const shapes = ["round5", "sun", "scallop", "clover", "round6", "star"];
  const S1 = window.M.S1;
  // bubble screen positions at the drop (stream fully scrolled)
  const streamY = parseFloat((S1.stream.style.transform.match(/,\s*(-?[\d.]+)px/) || [0, 0])[1]);
  const spots = [];
  S1.items.forEach((it) => {
    if (it.kind === "day") return;
    const x = it.kind === "recv" ? 70 + 190 + r() * 120 : 1080 - 70 - 190 - r() * 120;
    spots.push({ x, y: S1.zoneTop + it.y + it.h / 2 });
  });
  // compute the actual scrolled offset from the S1 scroll end value (stored at build time via dataset)
  const endOffset = window.M.S1_END || 0;
  const vis = spots.map((s) => ({ x: s.x, y: s.y + endOffset })).filter((s) => s.y > S1.zoneTop - 60 && s.y < 1260);
  // extra burst points to fill the frame
  for (let i = 0; i < 9; i++) vis.push({ x: 120 + r() * 840, y: 520 + r() * 820 });
  vis.forEach((p, i) => {
    const R = 55 + r() * 70;
    const f = flower(burst, { x: p.x, y: p.y, R, shape: shapes[i % shapes.length], color: palette[i % palette.length] });
    const ang = Math.atan2(p.y - 900, p.x - 540) + (r() - 0.5) * 0.8;
    const dist = 520 + r() * 520;
    const d = T.DROP + (i % 7) * 0.018;
    tl.fromTo(f, { scale: 0.05, rotate: r() * 90, opacity: 1 }, { scale: 1 + r() * 0.5, rotate: "+=" + (60 + r() * 120), duration: 0.28, ease: "back.out(2.2)" }, d);
    tl.to(f, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, scale: 0.4 + r() * 0.5, rotate: "+=" + (90 + r() * 140), duration: 0.75, ease: "power2.in" }, d + 0.22);
    tl.to(f, { opacity: 0, duration: 0.2, ease: "none" }, d + 0.8);
  });

  // ---------- decorative flowers on the Menta field ----------
  const deco = [
    { x: 915, y: 360, R: 170, shape: "round5", color: "#FF9DDA", d: 0.10 },
    { x: 150, y: 1535, R: 210, shape: "sun", color: "#FFD36E", d: 0.16 },
    { x: 905, y: 1440, R: 95, shape: "clover", color: "#62CFC0", d: 0.24 },
    { x: 118, y: 300, R: 66, shape: "scallop", color: "#FFFAFA", d: 0.2 },
    { x: 735, y: 1675, R: 60, shape: "round6", color: "#FFFAFA", d: 0.3 },
  ];
  deco.forEach((o, i) => {
    const f = flower(S, o);
    tl.fromTo(f, { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.55, ease: "back.out(1.8)" }, t0 + o.d);
    procs.push((t) => { if (t >= t0 && t < t1) f.style.rotate = ((t - t0) * (i % 2 ? -14 : 12)).toFixed(2) + "deg"; });
  });

  // ---------- headline ----------
  const H = textBlock(S, ["Le cose belle", "non succedono", "in <span class='chatword' style='position:relative;display:inline-block'>chat.</span>"], { left: "80px", top: "700px", fontSize: "132px", color: "#222222" });
  revealLines(H.inners, t0 + 0.14, 0.11, 0.62);
  // hand-drawn strike on "chat."
  const cw = H.box.querySelector(".chatword");
  const sv = svgEl("svg", { width: "360", height: "120", viewBox: "0 0 360 120", style: "position:absolute;left:-18px;top:28px;overflow:visible" });
  cw.appendChild(sv);
  const strike = svgEl("path", { d: "M8,74 C70,58 140,70 205,55 C255,44 300,52 346,40", fill: "none", stroke: "#FF5FC4", "stroke-width": "18", "stroke-linecap": "round" }, sv);
  tl.fromTo(strike, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.32, ease: "power2.inOut" }, 7.02);
  // subtle push on the whole scene
  tl.fromTo(H.box, { scale: 1 }, { scale: 1.04, duration: 2.2, ease: "none", transformOrigin: "0% 50%" }, t0);

  window.M.S2 = { S, H };
})();
