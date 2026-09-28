/* S3–S5 — "Dal vivo": brindisi, risata, sguardo. Collage of halftone cutouts, warm photos and brand flowers. */
(function () {
  const { T, tl, procs, el, svgEl, scene, textBlock, revealLines, hideLines, rng, clamp, lerp, smooth, flower, iris } = window.M;

  // ===================== S3 — "Succedono al primo brindisi." (7.5 → 9.375) =====================
  {
    const t0 = 7.5, t1 = 9.375 + 0.55;
    const S = scene("s3", t0 - 0.12, t1, "#FF9DDA");
    iris(S, { cx: 915, cy: 360, t0: t0 - 0.12, dur: 0.48, shape: "round5", rot0: 0.2, rot1: 1.0 });
    // yellow sun behind the couple
    const sun = flower(S, { x: 540, y: 1330, R: 330, shape: "sun", color: "#FFD36E" });
    tl.fromTo(sun, { scale: 0.2, rotate: -60 }, { scale: 1, rotate: 0, duration: 0.8, ease: "expo.out" }, t0);
    procs.push((t) => { if (t >= t0 - 0.2 && t < t1) sun.style.rotate = ((t - t0) * 18).toFixed(2) + "deg"; });
    const small = [
      flower(S, { x: 110, y: 760, R: 62, shape: "round6", color: "#FFFAFA" }),
      flower(S, { x: 975, y: 1010, R: 70, shape: "clover", color: "#71F0AB" }),
      flower(S, { x: 930, y: 250, R: 44, shape: "scallop", color: "#62CFC0" }),
    ];
    small.forEach((f, i) => tl.fromTo(f, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2)" }, t0 + 0.15 + i * 0.08));

    // couple cutout
    const cw = 1060, ch = Math.round(910 * cw / 1127);
    const couple = el("div", { cls: "abs", style: { left: (540 - cw / 2) + "px", top: (1920 - ch + 30) + "px", width: cw + "px", height: ch + "px", transformOrigin: "50% 100%" } }, S);
    el("img", { attrs: { src: "assets/img/couple_toast.png" }, style: { width: "100%", height: "100%", filter: "drop-shadow(0 24px 40px rgba(80,0,50,0.30))" } }, couple);
    tl.fromTo(couple, { y: 520, rotate: 5 }, { y: 0, rotate: -1.5, duration: 0.75, ease: "expo.out" }, t0 - 0.05);
    // the clink: tiny bump + spark lines at the glasses
    const gx = 564 * cw / 1060, gy = 414 * cw / 1060;
    tl.to(couple, { keyframes: [{ scale: 1.025, duration: 0.07, ease: "power2.out" }, { scale: 1, duration: 0.35, ease: "elastic.out(1,0.4)" }], transformOrigin: `${gx}px ${gy}px` }, 8.99);
    const spark = svgEl("svg", { width: 300, height: 300, viewBox: "-150 -150 300 300", style: `position:absolute;left:${gx - 150}px;top:${gy - 175}px;overflow:visible` }, couple);
    const rays = [];
    for (let i = 0; i < 7; i++) {
      const a = (-90 + (i - 3) * 26) * Math.PI / 180;
      const x1 = Math.cos(a) * 58, y1 = Math.sin(a) * 58, x2 = Math.cos(a) * 118, y2 = Math.sin(a) * 118;
      rays.push(svgEl("line", { x1, y1, x2, y2, stroke: "#FFFAFA", "stroke-width": 12, "stroke-linecap": "round" }, spark));
    }
    rays.forEach((ln, i) => {
      tl.fromTo(ln, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.12, ease: "power2.out" }, 8.99 + (i % 3) * 0.012);
      tl.to(ln, { drawSVG: "100% 100%", duration: 0.25, ease: "power2.in" }, 9.14);
    });
    // stickers: spritz + matcha cup
    const spr = el("img", { cls: "sticker", attrs: { src: "assets/img/spritz.png" }, style: { left: "34px", top: "700px", width: "190px" } }, S);
    const cup = el("img", { cls: "sticker", attrs: { src: "assets/img/matcha_cup.png" }, style: { left: "812px", top: "790px", width: "232px" } }, S);
    tl.fromTo(spr, { scale: 0, rotate: -40 }, { scale: 1, rotate: -12, duration: 0.55, ease: "back.out(2)" }, t0 + 0.28);
    tl.fromTo(cup, { scale: 0, rotate: 40 }, { scale: 1, rotate: 10, duration: 0.55, ease: "back.out(2)" }, t0 + 0.4);
    procs.push((t) => { if (t >= t0 && t < t1) { spr.style.translate = `0 ${(Math.sin(t * 3.1) * 8).toFixed(2)}px`; cup.style.translate = `0 ${(Math.sin(t * 2.7 + 1) * 8).toFixed(2)}px`; } });

    const H = textBlock(S, ["<span style='font-size:0.6em'>Succedono</span>", "al primo", "brindisi."], { left: "80px", top: "250px", fontSize: "136px", color: "#222222" });
    revealLines(H.inners, t0 + 0.24, 0.1, 0.6);
    window.M.S3 = { S };
  }

  // ===================== S4 — "In una risata che non ti aspettavi." (9.375 → 11.25) =====================
  {
    const t0 = 9.375, t1 = 11.25 + 0.55;
    const S = scene("s4", t0 - 0.1, t1, "#FFD36E");
    iris(S, { cx: 540, cy: 1330, t0: t0 - 0.1, dur: 0.46, shape: "sun", rot0: 0, rot1: 0.8 });
    const bigPink = flower(S, { x: 900, y: 820, R: 250, shape: "round5", color: "#FF9DDA" });
    tl.fromTo(bigPink, { scale: 0.3, rotate: 40 }, { scale: 1, rotate: 0, duration: 0.8, ease: "expo.out" }, t0);
    procs.push((t) => { if (t >= t0 - 0.2 && t < t1) bigPink.style.rotate = (-(t - t0) * 14).toFixed(2) + "deg"; });
    const clover = flower(S, { x: 140, y: 1660, R: 120, shape: "clover", color: "#71F0AB" });
    tl.fromTo(clover, { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(1.8)" }, t0 + 0.15);

    // polaroid-like photo card
    const cardW = 880, cardH = 880;
    const card = el("div", { cls: "photo-card", style: { left: (540 - cardW / 2) + "px", top: "790px", width: cardW + "px", height: (cardH + 120) + "px", padding: "22px 22px 120px", borderRadius: "10px" } }, S);
    el("img", { attrs: { src: "assets/img/piazza.jpg" }, style: { width: "100%", height: cardH - 44 + "px", objectFit: "cover", borderRadius: "4px" } }, card);
    const cap = el("div", { cls: "abs body", text: "sabato, 19:00 · Milano", style: { left: "30px", bottom: "38px", fontSize: "34px", fontWeight: 600, color: "#5C4A3C", letterSpacing: "0.01em" } }, card);
    tl.fromTo(card, { y: 700, rotate: 9, scale: 0.94 }, { y: 0, rotate: -3.5, scale: 1, duration: 0.8, ease: "expo.out" }, t0 - 0.05);
    tl.to(card, { rotate: -1.5, scale: 1.03, duration: 1.4, ease: "sine.inOut" }, t0 + 0.75);
    const H = textBlock(S, ["In una risata", "<span style='font-size:0.6em;letter-spacing:-0.02em'>che non ti aspettavi.</span>"], { left: "80px", top: "250px", fontSize: "134px", color: "#222222" });
    revealLines(H.inners, t0 + 0.2, 0.14, 0.6);
    window.M.S4 = { S };
  }

  // ===================== S5 — "In uno sguardo che dice: restiamo ancora un po'." (11.25 → 15.0) =====================
  {
    const t0 = 11.25, t1 = 15.0 + 0.5;
    const S = scene("s5", t0 - 0.1, t1, "#2a1d15");
    iris(S, { cx: 900, cy: 820, t0: t0 - 0.1, dur: 0.5, shape: "round5", rot0: 0, rot1: 0.9 });
    const bg = el("img", { attrs: { src: "assets/img/toast_blur.jpg" }, style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px" } }, S);
    tl.fromTo(bg, { scale: 1.12 }, { scale: 1.0, duration: 4.2, ease: "none" }, t0 - 0.1);
    // drifting warm bokeh
    const rb = rng(77);
    const orbs = [];
    for (let i = 0; i < 14; i++) {
      const sz = 60 + rb() * 170;
      const o = el("div", { cls: "abs", style: { left: (rb() * 1080 - sz / 2) + "px", top: (rb() * 1920 - sz / 2) + "px", width: sz + "px", height: sz + "px", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,${190 + Math.floor(rb() * 40)},${110 + Math.floor(rb() * 60)},${0.30 + rb() * 0.25}) 0%, rgba(255,180,100,0.10) 55%, rgba(255,170,90,0) 70%)`, mixBlendMode: "screen" } }, S);
      orbs.push({ o, sp: 18 + rb() * 40, ph: rb() * 6.28, amp: 10 + rb() * 25 });
    }
    procs.push((t) => {
      if (t < t0 - 0.2 || t > t1) return;
      const k = t - t0;
      orbs.forEach((b) => { b.o.style.translate = `${(Math.sin(k * 0.7 + b.ph) * b.amp).toFixed(1)}px ${(-k * b.sp).toFixed(1)}px`; b.o.style.opacity = (0.65 + 0.35 * Math.sin(k * 1.3 + b.ph)).toFixed(3); });
    });
    // warm vignette
    el("div", { cls: "abs", style: { inset: 0, background: "radial-gradient(90% 60% at 50% 55%, rgba(255,170,90,0.10) 0%, rgba(0,0,0,0.45) 100%)" } }, S);
    // a stack of polaroids from different dates (same style as S4), the last one is the candlelit toast
    const PW = 740, PIMG = PW - 44, PH = PIMG + 44 + 100;
    const pols = [
      { src: "assets/img/date_spritz.jpg", pos: "50% 42%", cap: "giovedì, 19:30 · Isola", x: -70, y: -40, rot: -8, t: t0 + 0.08 },
      { src: "assets/img/date_bar.jpg", pos: "58% 45%", cap: "venerdì, 21:00 · Navigli", x: 80, y: 10, rot: 7, t: t0 + 0.70 },
      { src: "assets/img/toast_photo.jpg", pos: "50% 50%", cap: "domenica, 20:30 · Brera", x: 0, y: 40, rot: -2.5, t: t0 + 1.32, last: true },
    ];
    const stackTop = 690;
    let photo = null, card = null;
    pols.forEach((o, i) => {
      const c = el("div", { cls: "photo-card", style: { left: (540 - PW / 2) + "px", top: stackTop + "px", width: PW + "px", height: PH + "px", padding: "22px 22px 100px", borderRadius: "10px", zIndex: 2 + i } }, S);
      const win = el("div", { cls: "abs", style: { left: "22px", top: "22px", width: PIMG + "px", height: PIMG + "px", overflow: "hidden", borderRadius: "4px" } }, c);
      const im = el("img", { attrs: { src: o.src }, style: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: o.pos, transformOrigin: "50% 55%" } }, win);
      el("div", { cls: "abs body", text: o.cap, style: { left: "30px", bottom: "30px", fontSize: "32px", fontWeight: 600, color: "#5C4A3C", letterSpacing: "0.01em" } }, c);
      tl.fromTo(c, { x: o.x * 0.4, y: 1350, rotate: o.rot + (i % 2 ? -10 : 10), scale: 0.94 }, { x: o.x, y: o.y, rotate: o.rot, scale: 1, duration: 0.75, ease: "expo.out" }, o.t);
      // earlier cards settle back a touch when the next one lands
      if (!o.last) tl.to(c, { scale: 0.96, duration: 0.6, ease: "power2.out" }, pols[i + 1].t + 0.1);
      if (o.last) { photo = im; card = c; }
      else tl.fromTo(im, { scale: 1.0 }, { scale: 1.06, duration: 2.0, ease: "sine.out" }, o.t);
    });
    tl.to(card, { rotate: -1, scale: 1.03, duration: 2.2, ease: "sine.inOut" }, pols[2].t + 0.75);
    tl.fromTo(photo, { scale: 1.0 }, { scale: 1.1, duration: 2.6, ease: "sine.inOut" }, pols[2].t);
    // candle glow flicker (candle at ~ (637, 452) in the 1264x848 source, square cover crop)
    const sc = PIMG / 848, offX = (1264 * sc - PIMG) / 2;
    const cx = 637 * sc - offX, cy = 452 * sc;
    const glow = el("div", { cls: "abs", style: { left: (cx - 150) + "px", top: (cy - 150) + "px", width: "300px", height: "300px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,196,110,0.55) 0%, rgba(255,160,70,0.18) 38%, rgba(255,140,60,0) 70%)", mixBlendMode: "screen" } }, photo.parentNode);
    procs.push((t) => {
      if (t < t0 || t > t1) return;
      const f = 0.72 + 0.14 * Math.sin(t * 13.1) + 0.09 * Math.sin(t * 31.7 + 1.3) + 0.05 * Math.sin(t * 57.3);
      glow.style.opacity = f.toFixed(3);
    });
    const H = textBlock(S, ["In uno sguardo", "<span style='font-size:0.6em'>che dice:</span>"], { left: "80px", top: "250px", fontSize: "132px", color: "#FFFAFA" });
    revealLines(H.inners, t0 + 0.22, 0.16, 0.65);
    // the only chat bubble that matters: spoken, in real life
    const bub = el("div", { cls: "abs display", html: "Restiamo ancora<br>un po'?", style: { left: "540px", top: "1000px", zIndex: 10, padding: "34px 52px 40px", background: "#FFFAFA", color: "#222222", borderRadius: "56px",
      fontSize: "78px", lineHeight: "0.98", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", transformOrigin: "50% 100%", whiteSpace: "nowrap" } }, S);
    const tail = el("div", { cls: "abs", style: { left: "50%", bottom: "-26px", width: "56px", height: "56px", marginLeft: "-28px", background: "#FFFAFA", borderRadius: "6px", transform: "rotate(45deg)" } }, bub);
    tl.fromTo(bub, { xPercent: -50, yPercent: -100, scale: 0, rotate: -6 }, { scale: 1, rotate: -2, duration: 0.6, ease: "back.out(2.2)" }, 13.45);
    const hearts = [
      flower(S, { x: 205, y: 1215, R: 48, shape: "round5", color: "#FF9DDA" }),
      flower(S, { x: 890, y: 1180, R: 40, shape: "scallop", color: "#71F0AB" }),
      flower(S, { x: 860, y: 1420, R: 30, shape: "clover", color: "#FFD36E" }),
    ];
    hearts.forEach((f) => { f.style.zIndex = 11; });
    hearts.forEach((f, i) => tl.fromTo(f, { scale: 0, rotate: -50 }, { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" }, 13.6 + i * 0.07));
    tl.to(S, { yPercent: -100, duration: 0.5, ease: "expo.out" }, 14.98);
    window.M.S5 = { S };
  }
})();
