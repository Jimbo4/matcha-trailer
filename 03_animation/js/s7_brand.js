/* S7 — brand (JUMP → 24.375) and S8 — CTA (24.375 → 30) */
(function () {
  const { T, tl, procs, el, scene, textBlock, revealLines, hideLines, rng, clamp, lerp, flower, iris, splitWords } = window.M;

  // ===================== S7: wordmark + tagline =====================
  const t0 = T.JUMP, tCTA = 24.375;
  // the phone stays on screen until the hit, then a clean white flash frame on the beat
  const S = scene("s7", t0 - 0.012, T.DUR + 1, "#222222");
  const flash = el("div", { cls: "abs", style: { inset: 0, background: "#FFFAFA", opacity: 0, zIndex: 20 } }, S);
  tl.set(flash, { opacity: 1 }, t0 - 0.012);
  tl.to(flash, { opacity: 0, duration: 0.17, ease: "power2.out" }, t0 + 0.02);

  // flowers burst from the center to a ring that frames (never covers) the type
  const ring = [
    { shape: "round5", color: "#FF9DDA", R: 125, x: 175, y: 520 },
    { shape: "sun", color: "#FFD36E", R: 140, x: 915, y: 560 },
    { shape: "scallop", color: "#71F0AB", R: 110, x: 960, y: 1330 },
    { shape: "clover", color: "#62CFC0", R: 90, x: 130, y: 1300 },
    { shape: "round6", color: "#FFFAFA", R: 48, x: 560, y: 430 },
    { shape: "star", color: "#FF9DDA", R: 58, x: 700, y: 1450 },
    { shape: "round5", color: "#FFD36E", R: 40, x: 330, y: 1480 },
  ];
  const cx = 540, cy = 860;
  const orb = ring.map((o, i) => {
    const f = flower(S, { x: cx, y: cy, R: o.R, shape: o.shape, color: o.color });
    tl.fromTo(f, { scale: 0 }, { scale: 1, duration: 0.7, ease: "back.out(1.6)" }, t0 + 0.02 + i * 0.03);
    return { f, o };
  });
  procs.push((t) => {
    if (t < t0 - 0.05 || t >= tCTA + 0.6) return;
    const u = clamp((t - t0) / 0.75, 0, 1);
    const e = 1 - Math.pow(1 - u, 4);
    orb.forEach(({ f, o }, i) => {
      const dx = (o.x - cx) * e + Math.sin((t - t0) * 1.3 + i) * 10 * e;
      const dy = (o.y - cy) * e + Math.cos((t - t0) * 1.1 + i * 2) * 12 * e;
      f.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
      f.style.rotate = (((t - t0) * (i % 2 ? 26 : -22)) + i * 40).toFixed(2) + "deg";
    });
  });

  // wordmark: Fraunces Black, Acqua
  const wm = el("div", { cls: "abs wordmark", style: { left: "0px", width: "1080px", top: (cy - 150) + "px", textAlign: "center", fontSize: "250px", color: "#62CFC0" } }, S);
  const letters = "Matcha".split("").map((ch) => el("span", { text: ch, style: { display: "inline-block", transformOrigin: "50% 100%" } }, wm));
  tl.fromTo(wm, { scale: 1.35 }, { scale: 1, duration: 0.9, ease: "expo.out" }, t0);
  tl.to(wm, { scale: 1.05, duration: 2.9, ease: "sine.inOut" }, t0 + 0.9);
  letters.forEach((l, i) => tl.fromTo(l, { yPercent: 60, opacity: 0, rotate: (i % 2 ? 8 : -8) }, { yPercent: 0, opacity: 1, rotate: 0, duration: 0.55, ease: "back.out(2)" }, t0 + 0.02 + i * 0.035));

  // tagline
  const tag = textBlock(S, ["Per te che vuoi", "uscire davvero."], { left: "0px", width: "1080px", top: (cy + 170) + "px", fontSize: "96px", letterSpacing: "-0.02em", color: "#FFFAFA", textAlign: "center" });
  revealLines(tag.inners, 21.78, 0.34, 0.6);

  // ===================== S8: CTA (Menta) =====================
  const C8 = scene("s8", tCTA - 0.08, T.DUR + 1, "#71F0AB");
  iris(C8, { cx: 540, cy: 980, t0: tCTA - 0.08, dur: 0.55, shape: "scallop", rot0: 0, rot1: 0.5 });
  // corner flowers
  const cf = [
    flower(C8, { x: 70, y: 250, R: 230, shape: "round5", color: "#FF9DDA" }),
    flower(C8, { x: 1025, y: 610, R: 140, shape: "sun", color: "#FFD36E" }),
    flower(C8, { x: 980, y: 1640, R: 170, shape: "scallop", color: "#FFFAFA" }),
    flower(C8, { x: 95, y: 1520, R: 95, shape: "clover", color: "#62CFC0" }),
  ];
  cf.forEach((f, i) => {
    tl.fromTo(f, { scale: 0, rotate: -50 }, { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.6)" }, tCTA + 0.05 + i * 0.07);
    procs.push((t) => { if (t >= tCTA) f.style.rotate = ((t - tCTA) * (i % 2 ? -12 : 10)).toFixed(2) + "deg"; });
  });
  // halftone friends peeking from the bottom
  const pk1 = el("img", { cls: "sticker", attrs: { src: "assets/img/women_laugh.png" }, style: { left: "-150px", top: "1480px", width: "700px" } }, C8);
  const pk2 = el("img", { cls: "sticker", attrs: { src: "assets/img/men_dance.png" }, style: { left: "520px", top: "1500px", width: "700px" } }, C8);
  tl.fromTo(pk1, { y: 500, rotate: -6 }, { y: 0, rotate: -3, duration: 0.8, ease: "expo.out" }, tCTA + 0.35);
  tl.fromTo(pk2, { y: 500, rotate: 6 }, { y: 0, rotate: 3, duration: 0.8, ease: "expo.out" }, tCTA + 0.45);

  const icon8 = el("img", { attrs: { src: "assets/img/icon.png" }, style: { position: "absolute", left: "455px", top: "250px", width: "170px", height: "170px", borderRadius: "38px", boxShadow: "0 18px 40px rgba(0,60,40,0.28)" } }, C8);
  tl.fromTo(icon8, { scale: 0, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)" }, tCTA + 0.12);
  const wm2 = el("div", { cls: "abs wordmark", text: "Matcha", style: { left: 0, width: "1080px", top: "440px", textAlign: "center", fontSize: "176px", color: "#222222" } }, C8);
  tl.fromTo(wm2, { y: 60, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "expo.out" }, tCTA + 0.08);
  const tag2 = textBlock(C8, ["Per te che vuoi", "uscire davvero."], { left: 0, width: "1080px", top: "672px", fontSize: "80px", letterSpacing: "-0.018em", color: "#222222", textAlign: "center" });
  revealLines(tag2.inners, tCTA + 0.16, 0.08, 0.6);
  // CTA pill
  const pill = el("div", { cls: "abs display", html: `Scarica Matcha <span style="display:inline-block;transform:translateY(-2px)">→</span>`, style: { left: "540px", top: "940px", padding: "40px 64px 44px", borderRadius: "999px", background: "#222222", color: "#FFFAFA", fontSize: "76px", letterSpacing: "-0.015em", whiteSpace: "nowrap", boxShadow: "0 22px 50px rgba(0,60,40,0.28)" } }, C8);
  tl.fromTo(pill, { xPercent: -50, scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.65, ease: "back.out(1.8)" }, tCTA + 0.4);
  // store badges
  const lbl = el("div", { cls: "abs body", text: "Disponibile ora su", style: { left: 0, width: "1080px", top: "1172px", textAlign: "center", fontSize: "30px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#222222", opacity: 0.8 } }, C8);
  // same height for both badges (the Apple one was 110 px vs 124 px); pair centred, 28 px gap
  const BH = 118, wA = BH * 119.66407 / 40, wG = BH * 238.96 / 70.87, gap = 28, bx = (1080 - wA - gap - wG) / 2, by = 1291 - BH / 2;
  const bA = el("img", { attrs: { src: "assets/svg/apple-store.svg" }, style: { position: "absolute", left: bx.toFixed(1) + "px", top: by + "px", width: wA.toFixed(1) + "px", height: BH + "px" } }, C8);
  const bG = el("img", { attrs: { src: "assets/svg/google-play-badge.svg" }, style: { position: "absolute", left: (bx + wA + gap).toFixed(1) + "px", top: by + "px", width: wG.toFixed(1) + "px", height: BH + "px" } }, C8);
  tl.fromTo(lbl, { opacity: 0, y: 16 }, { opacity: 0.8, y: 0, duration: 0.5, ease: "power3.out" }, 25.9);
  tl.fromTo(bA, { scale: 0.5, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(2)" }, 26.22);
  tl.fromTo(bG, { scale: 0.5, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(2)" }, 26.38);
  // final hit: pulse
  tl.to(pill, { keyframes: [{ scale: 1.07, duration: 0.09, ease: "power2.out" }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.45)" }] }, T.HIT - 0.02);
  tl.to(cf, { scale: 1.12, duration: 0.1, ease: "power2.out", yoyo: true, repeat: 1 }, T.HIT - 0.02);
  window.M.S7 = { S, C8 };
})();
