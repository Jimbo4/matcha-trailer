/* S1 — "Dentro lo schermo" (0 → DROP). Endless chat, three weeks, zero dates, ghosting. */
(function () {
  const { T, tl, procs, el, scene, textBlock, revealLines, hideLines, rng, clamp, lerp, smooth, flower } = window.M;
  const t0 = 0, t1 = T.DROP + 0.5;
  const S = scene("s1", t0, t1, "radial-gradient(120% 80% at 50% 38%, #2d3131 0%, #1f2121 45%, #151616 100%)");

  // ---------- chat stream ----------
  const zoneTop = 572, zoneBottom = 1080;
  const zone = el("div", { cls: "abs", style: { left: "0px", top: zoneTop + "px", width: "1080px", height: (zoneBottom - zoneTop) + "px", overflow: "hidden",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, #000 120px, #000 calc(100% - 60px), transparent 100%)",
    maskImage: "linear-gradient(to bottom, transparent 0px, #000 120px, #000 calc(100% - 60px), transparent 100%)" } }, S);
  const stream = el("div", { cls: "chat-stream" }, zone);
  const MSG = [
    ["recv", "ciao :)"], ["sent", "ciao! come va?"], ["recv", "bene dai, tu?"], ["sent", "tutto ok 😄"], ["recv", "ahah"],
    ["day", "Giorno 4"], ["sent", "che fai di bello?"], ["recv", "niente, divano e serie"], ["sent", "ahah pure io"], ["recv", "dobbiamo vederci!"],
    ["day", "Giorno 9"], ["sent", "sì dai! quando?"], ["recv", "ti scrivo io 😉"], ["sent", "ok 👍"],
    ["day", "Giorno 15"], ["sent", "ehi, tutto ok?"], ["recv", "sì sì, settimana pesante"], ["recv", "ci sentiamo"],
    ["day", "Giorno 21"], ["sent", "allora, sto aperitivo?"],
  ];
  let y = 0;
  const items = [];
  const GAP = 20;
  MSG.forEach(([kind, text], i) => {
    let node, h;
    if (kind === "day") {
      y += 26;
      node = el("div", { cls: "day-sep", text, style: { top: y + "px" } }, stream);
      h = 40; y += h + 34;
    } else {
      node = el("div", { cls: "bubble " + kind, text, style: { top: y + "px" } }, stream);
      h = 117; y += h + GAP;
    }
    items.push({ node, kind, y: parseFloat(node.style.top), h });
  });
  const lastBubble = items[items.length - 1];
  // "Visualizzato" under the last sent message
  const seen = el("div", { cls: "seen", text: "Visualizzato", style: { top: (lastBubble.y + lastBubble.h + 10) + "px", opacity: 0 } }, stream);
  // typing indicator
  const typing = el("div", { cls: "typing", style: { top: (lastBubble.y + lastBubble.h + 70) + "px", opacity: 0 } }, stream);
  const dots = [0, 1, 2].map(() => el("i", {}, typing));
  const contentH = lastBubble.y + lastBubble.h + 70 + 117;
  const zoneH = zoneBottom - zoneTop;
  const scrollStart = 90, scrollEnd = -(contentH - zoneH + 30);
  window.M.S1_END = scrollEnd;

  // scroll: fast endless scroll that decelerates on day 21
  procs.push((t) => {
    if (t > t1) return;
    const u = clamp((t - 0.05) / 3.05, 0, 1);
    // ease: slow start, quick middle, soft landing
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const yy = lerp(scrollStart, scrollEnd, e);
    stream.style.transform = `translate3d(0, ${yy.toFixed(2)}px, 0)`;
    // typing dots
    for (let i = 0; i < 3; i++) {
      const ph = (t * 2.4 - i * 0.18) % 1;
      const b = Math.max(0, Math.sin(ph * Math.PI));
      dots[i].style.transform = `translateY(${(-9 * b).toFixed(2)}px)`;
      dots[i].style.opacity = (0.45 + 0.55 * b).toFixed(3);
    }
  });
  tl.to(seen, { opacity: 1, duration: 0.2 }, 3.05);
  tl.fromTo(typing, { opacity: 0, scale: 0.6, transformOrigin: "0% 100%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, 3.2);
  tl.to(typing, { opacity: 0, scale: 0.7, duration: 0.25, ease: "power2.in" }, 4.25); // ...and nothing arrives

  // ---------- the protagonist (halftone cutout): smile -> cringe ----------
  const womanWrap = el("div", { cls: "abs", style: { left: "70px", top: "1085px", width: "1075px", height: "903px", transformOrigin: "60% 100%", scale: "0.93" } }, S);
  const wSmile = el("img", { attrs: { src: "assets/img/woman_phone_smile.png" }, style: { position: "absolute", left: 0, top: 0, width: "1075px", height: "903px" } }, womanWrap);
  const wCringe = el("img", { attrs: { src: "assets/img/woman_phone_cringe_aligned.png" }, style: { position: "absolute", left: 0, top: 0, width: "1075px", height: "903px", opacity: 0 } }, womanWrap);
  tl.fromTo(womanWrap, { y: 60, scale: 0.97 }, { y: 0, scale: 1, duration: 1.2, ease: "power3.out" }, 0.0);
  tl.to(wCringe, { opacity: 1, duration: 0.06 }, 3.46);
  tl.to(wSmile, { opacity: 0, duration: 0.06 }, 3.48);
  tl.fromTo(womanWrap, { rotate: 0 }, { keyframes: [{ rotate: -1.6, duration: 0.07 }, { rotate: 1.2, duration: 0.08 }, { rotate: -0.6, duration: 0.08 }, { rotate: 0, duration: 0.1 }], ease: "none", immediateRender: false }, 3.46);

  // ---------- headline copy ----------
  const A = textBlock(S, ["<span style='color:#71F0AB'>3</span> settimane", "di chat."], { left: "80px", top: "250px", fontSize: "124px", color: "#FFFAFA" });
  // visible from frame 0 (hook): the whole block settles, so the line masks scale with it and never crop the words
  tl.fromTo(A.box, { scale: 1.08, transformOrigin: "0% 100%" }, { scale: 1, duration: 0.7, ease: "expo.out" }, 0.0);
  // clean handoffs: each title is fully out before the next one rolls in (no overlapping words)
  hideLines(A.inners, 1.70, 0.03, 0.24);
  const B = textBlock(S, ["<span style='color:#71F0AB'>0</span> appuntamenti."], { left: "80px", top: "310px", fontSize: "124px", color: "#FFFAFA" });
  revealLines(B.inners, 1.97, 0.1, 0.55);
  hideLines(B.inners, 3.30, 0, 0.22);
  const C = textBlock(S, ["Romantico,", "eh?"], { left: "80px", top: "250px", fontSize: "134px", color: "#FFFAFA" });
  revealLines(C.inners, 3.52, 0.2, 0.55, "back.out(1.6)");

  // ---------- the ghost ----------
  const ghost = el("img", { attrs: { src: "assets/img/ghost.png" }, cls: "sticker", style: { left: "70px", top: "590px", width: "205px", height: "556px", transformOrigin: "50% 60%" } }, S);
  tl.fromTo(ghost, { x: -420, rotate: -18, opacity: 1 }, { x: 0, rotate: 5, duration: 0.7, ease: "back.out(1.3)" }, 3.42);
  procs.push((t) => {
    if (t < 3.4 || t > t1) return;
    const k = clamp((t - 3.4) / 0.8, 0, 1);
    ghost.style.translate = `0px ${(Math.sin((t - 3.4) * 5.2) * 14 * k).toFixed(2)}px`;
  });

  // ---------- pre-drop tension: everything vibrates & swells ----------
  const r = rng(11);
  const jitterTargets = items.filter((it) => it.kind !== "day").map((it) => ({ n: it.node, ph: r() * 6.28, amp: 0.6 + r() * 0.8 }));
  procs.push((t) => {
    if (t > t1) return;
    const k = smooth(4.55, T.DROP, t);
    for (const j of jitterTargets) {
      if (k <= 0) { j.n.style.translate = ""; j.n.style.scale = ""; continue; }
      const dx = Math.sin(t * 61 + j.ph) * 7 * k * j.amp, dy = Math.cos(t * 53 + j.ph * 1.7) * 6 * k * j.amp;
      j.n.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
      j.n.style.scale = (1 + 0.12 * k).toFixed(4);
    }
    const shake = k * k;
    S.style.translate = shake > 0 ? `${(Math.sin(t * 73) * 6 * shake).toFixed(2)}px ${(Math.cos(t * 67) * 6 * shake).toFixed(2)}px` : "";
  });
  // at the drop the chat bursts: bubbles pop (scale up & vanish); flowers take over (handled in S2)
  jitterTargets.forEach((j, i) => {
    tl.to(j.n, { opacity: 0, duration: 0.08, ease: "none" }, T.DROP - 0.02 + (i % 5) * 0.012);
  });
  tl.to([C.box, ghost, womanWrap], { opacity: 0, duration: 0.12, ease: "none" }, T.DROP);

  window.M.S1 = { S, items, zoneTop, stream };
})();
