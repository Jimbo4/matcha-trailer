/* S6 — "Da un match a un tavolo vero. Devi solo presentarti." (15.0 → JUMP)
   The phone shows the real Matcha screens rebuilt from the codebase (booking/index.tsx, booking/slots.tsx, booking/venue.tsx). */
(function () {
  const { T, tl, procs, el, scene, textBlock, revealLines, hideLines, clamp, lerp, flower } = window.M;
  const t0 = 15.0, t1 = T.JUMP + 0.15;
  const S = scene("s6", t0 - 0.02, t1, "#1b1511");
  const C = { primary: "#62cfc0", primaryLight: "#daf3ef", bg: "#fffafa", text: "#222222", text2: "#5C4A3C", text3: "#9C8A80", border: "#E8D5C8", surface2: "#fdf8f5", surface3: "#f0e4da", success: "#16A34A" };
  const ic = window.icon;

  // ---------- backdrop: the real table, waiting (blurred bar) ----------
  const bg = el("img", { attrs: { src: "assets/img/bar_table_blur.jpg" }, style: { position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px" } }, S);
  tl.fromTo(bg, { scale: 1.15, y: 60 }, { scale: 1.02, y: 0, duration: 5.8, ease: "power1.out" }, t0 - 0.02);
  el("div", { cls: "abs", style: { inset: 0, background: "linear-gradient(180deg, rgba(20,14,10,0.55) 0%, rgba(20,14,10,0.05) 38%, rgba(20,14,10,0.25) 100%)" } }, S);
  // entry wipe: vertical push from below (bar-synced)
  tl.fromTo(S, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" }, t0 - 0.02);

  // ---------- headline ----------
  const H1 = textBlock(S, ["Da un match", "a un tavolo vero."], { left: "80px", top: "230px", fontSize: "112px", color: "#FFFAFA", textShadow: "0 6px 30px rgba(0,0,0,0.35)", zIndex: 5 });
  revealLines(H1.inners, 15.5, 0.55, 0.62);
  hideLines(H1.inners, 18.60, 0.04, 0.26);
  const H2 = textBlock(S, ["Devi solo", "presentarti."], { left: "80px", top: "230px", fontSize: "112px", color: "#FFFAFA", textShadow: "0 6px 30px rgba(0,0,0,0.35)", zIndex: 5 });
  revealLines(H2.inners, 18.93, 0.2, 0.6);

  // ---------- phone ----------
  const stage3d = el("div", { cls: "abs", style: { left: 0, top: 0, width: "1080px", height: "1920px", perspective: "2200px", perspectiveOrigin: "50% 45%", zIndex: 3 } }, S);
  const phone = el("div", { cls: "phone", style: { left: "240px", top: "690px", transformOrigin: "50% 30%" } }, stage3d);
  const screen = el("div", { cls: "screen" }, phone);
  el("div", { cls: "island" }, screen);
  el("div", { cls: "glare" }, screen);
  el("div", { cls: "rim" }, phone);
  // cover the whole screen (the old 570/393 scale left 3.5 px of screen background uncovered at the bottom)
  const APP_S = 1232 / 847;
  const app = el("div", { cls: "app", style: { left: ((570 - 393 * APP_S) / 2).toFixed(3) + "px", transform: `scale(${APP_S})` } }, screen);
  tl.fromTo(phone, { y: 1100, rotateX: 38, rotateZ: -9, scale: 1.0 }, { y: 0, rotateX: 0, rotateZ: -2.5, scale: 1.1, duration: 0.95, ease: "expo.out" }, t0 + 0.02);
  tl.to(phone, { scale: 1.2, rotateZ: -1.2, duration: 3.1, ease: "sine.inOut" }, t0 + 0.97);
  procs.push((t) => { if (t >= t0 && t < t1) phone.style.translate = `0 ${(Math.sin((t - t0) * 1.7) * 7).toFixed(2)}px`; });

  const statusBar = (dark) => `<div class="statusbar" style="color:${dark ? "#222" : "#fffafa"}"><span>18:30</span><span class="icons">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0L8 11.5Zm-4.2-4.3a6 6 0 0 1 8.4 0l1.4-1.4a8 8 0 0 0-11.2 0l1.4 1.4ZM1 4.4a10 10 0 0 1 14 0L16.2 3A11.8 11.8 0 0 0 -.2 3L1 4.4Z" fill="currentColor"/></svg>
      <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor"/><rect x="24.5" y="4" width="1.8" height="5" rx="0.9" fill="currentColor" opacity="0.4"/></svg>
    </span></div>`;

  // ===== Screen 1: È un match! =====
  const s1 = el("div", { cls: "app-screen", style: { background: "#222" } }, app);
  s1.innerHTML = `
    <img src="assets/img/splash2.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom, rgba(34,34,34,0.3) 0%, rgba(34,34,34,0.55) 55%, rgba(34,34,34,0.94) 100%)"></div>
    ${statusBar(false)}
    <div style="position:absolute;left:20px;top:55px;width:44px;height:44px;border-radius:22px;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center">${ic("close", 22, "#222")}</div>
    <div style="position:absolute;right:20px;top:55px;height:44px;padding:0 16px;border-radius:22px;background:rgba(229,229,229,0.6);display:flex;align-items:center;font-weight:700;font-size:15px;color:#222">Rivedi profilo</div>
    <div class="m-photos" style="position:absolute;left:${(393 - 260) / 2}px;top:128px;width:260px;height:320px">
      <div class="m-pa" style="position:absolute;left:0;top:20px;width:170px;height:230px"><img src="assets/img/p_mei.jpg" style="width:100%;height:100%;object-fit:cover;border-radius:20px;border:4px solid #fffafa"></div>
      <div class="m-pb" style="position:absolute;right:0;top:60px;width:170px;height:230px"><img src="assets/img/p_sandra.jpg" style="width:100%;height:100%;object-fit:cover;border-radius:20px;border:4px solid #fffafa"></div>
    </div>
    <div class="m-content" style="position:absolute;left:32px;right:32px;top:484px;text-align:center;color:#fffafa">
      <div style="height:22px;margin-bottom:10px">${ic("heart", 22, C.primary)}</div>
      <div style="font-family:'Bricolage Grotesque';font-weight:700;font-size:34px;line-height:1.15;margin-bottom:8px;letter-spacing:-0.01em">È un match!</div>
      <div style="font-size:16px;line-height:22px">Tu e Giulia avete ancora <b class="m-cd" style="font-weight:800;font-variant-numeric:tabular-nums">23:59:48</b>, poi puf, sparisce tutto.</div>
      <div class="btn primary m-cta" style="margin-top:24px">Conferma il match — €10</div>
    </div>
    <div class="m-later" style="position:absolute;left:24px;right:24px;bottom:50px;text-align:center;font-size:13px;color:#fffafa;opacity:0.6;text-decoration:underline">Voglio pensarci ancora un attimo</div>`;
  const pa = s1.querySelector(".m-pa"), pb = s1.querySelector(".m-pb"), mc = s1.querySelector(".m-content"), ml = s1.querySelector(".m-later"), cd = s1.querySelector(".m-cd"), mcta = s1.querySelector(".m-cta");
  // the app's own entrance: 550ms expo-out, 130ms stagger, ±8° tilt
  const EO = "expo.out";
  tl.fromTo(pa, { opacity: 0, y: 16, rotate: -8, scale: 0.92 }, { opacity: 1, y: 0, rotate: -8, scale: 1, duration: 0.55, ease: EO }, 15.22);
  tl.fromTo(pb, { opacity: 0, y: 16, rotate: 8, scale: 0.92 }, { opacity: 1, y: 0, rotate: 8, scale: 1, duration: 0.55, ease: EO }, 15.35);
  tl.fromTo(mc, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: EO }, 15.55);
  tl.fromTo(ml, { opacity: 0 }, { opacity: 0.6, duration: 0.55, ease: EO }, 15.68);
  procs.push((t) => {
    if (t < t0 || t > 17.2) return;
    const left = Math.max(0, 23 * 3600 + 59 * 60 + 48 - Math.floor(t - t0));
    const hh = String(Math.floor(left / 3600)).padStart(2, "0"), mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
    cd.textContent = `${hh}:${mm}:${ss}`;
  });
  // tap on CTA
  tl.to(mcta, { scale: 0.97, duration: 0.08, ease: "power2.out" }, 16.55);
  tl.to(mcta, { scale: 1, duration: 0.2, ease: "power2.out" }, 16.65);

  // ===== Screen 2: Quando sei libero/a? =====
  const s2 = el("div", { cls: "app-screen" }, app);
  const days = [["Mar", "29 set", true], ["Mer", "30 set", false], ["Gio", "1 ott", true], ["Ven", "2 ott", true], ["Sab", "3 ott", false], ["Dom", "4 ott", true], ["Lun", "5 ott", false]];
  const hours = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
  s2.innerHTML = `${statusBar(true)}
    <div style="position:absolute;left:20px;top:62px">${ic("chevron-back", 24, C.text)}</div>
    <div style="position:absolute;left:24px;right:24px;top:110px">
      <div style="font-family:'Bricolage Grotesque';font-weight:700;font-size:28px;color:${C.text};margin-bottom:8px;letter-spacing:-0.01em">Quando sei libero/a?</div>
      <div style="font-size:15px;line-height:21px;color:${C.text2}">Scegli orari in almeno 5 giorni diversi in cui potresti incontrare Giulia. Troveremo il locale nell'orario che avete in comune.</div>
    </div>
    <div class="d-row" style="position:absolute;left:20px;top:238px;display:flex;gap:8px;white-space:nowrap">
      ${days.map((d, i) => `<div class="d-chip" data-i="${i}" style="width:64px;flex:none;padding:10px 0;border-radius:14px;text-align:center;background:${C.surface2};border:1px solid ${C.border}">
        <div class="wd" style="font-size:11px;font-weight:600;color:${C.text3}">${d[0]}</div>
        <div class="lb" style="font-size:15px;font-weight:700;margin-top:2px;color:${C.text}">${d[1]}</div>
        <div class="dot" style="width:5px;height:5px;border-radius:3px;margin:4px auto 0;background:${C.primary};opacity:${d[2] ? 1 : 0}"></div></div>`).join("")}
    </div>
    <div style="position:absolute;left:24px;right:24px;top:320px;display:flex;flex-direction:column;gap:10px">
      ${hours.map((h) => `<div class="h-row" data-h="${h}" style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-radius:14px;background:${C.surface2};border:1px solid ${C.border}">
        <span style="font-size:16px;font-weight:600;color:${C.text}">${h}</span><span class="h-ic">${ic("ellipse-outline", 22, C.text3)}</span></div>`).join("")}
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(to bottom, rgba(255,250,250,0) 0%, #fffafa 22%)"></div>
    <div style="position:absolute;left:24px;right:24px;bottom:34px">
      <div class="cnt" style="font-size:13px;font-weight:600;text-align:center;margin-bottom:10px;color:${C.text3}">4/5 giorni selezionati</div>
      <div class="btn dark s-cta" style="background:${C.surface3};color:${C.text3}">Conferma disponibilità</div>
    </div>`;
  const chips = s2.querySelectorAll(".d-chip");
  const setActiveChip = (i) => chips.forEach((c, j) => {
    const a = j === i;
    c.style.background = a ? C.text : C.surface2; c.style.borderColor = a ? C.text : C.border;
    c.querySelector(".wd").style.color = a ? C.bg : C.text3; c.querySelector(".lb").style.color = a ? C.bg : C.text;
    c.querySelector(".dot").style.background = a ? C.primaryLight : C.primary;
  });
  setActiveChip(4);
  const rows = s2.querySelectorAll(".h-row");
  const cnt = s2.querySelector(".cnt"), scta = s2.querySelector(".s-cta");
  const picks = [[2, 17.30], [3, 17.62], [4, 17.94]];
  procs.push((t) => {
    if (t < 16.5 || t > t1) return;
    rows.forEach((r, i) => {
      const p = picks.find((q) => q[0] === i);
      const on = p && t >= p[1];
      r.style.background = on ? C.primaryLight : C.surface2;
      r.style.borderColor = on ? C.primary : C.border;
      r.querySelector(".h-ic").innerHTML = on ? ic("checkmark-circle", 22, C.primary) : ic("ellipse-outline", 22, C.text3);
    });
    const done = t >= 17.30;
    chips[4].querySelector(".dot").style.opacity = done ? 1 : 0;
    cnt.textContent = (done ? 5 : 4) + "/5 giorni selezionati";
    cnt.style.color = done ? C.success : C.text3;
    scta.style.background = done ? C.text : C.surface3;
    scta.style.color = done ? C.bg : C.text3;
  });
  picks.forEach(([i, tt]) => { tl.fromTo(rows[i], { scale: 1 }, { keyframes: [{ scale: 0.97, duration: 0.07 }, { scale: 1, duration: 0.22, ease: "back.out(3)" }], immediateRender: false }, tt - 0.04); });
  tl.to(scta, { keyframes: [{ scale: 0.97, duration: 0.07 }, { scale: 1, duration: 0.2 }] }, 18.32);

  // ===== Screen 3: appuntamento confermato =====
  const s3 = el("div", { cls: "app-screen" }, app);
  s3.innerHTML = `${statusBar(true)}
    <div style="position:absolute;left:20px;top:62px">${ic("chevron-back", 24, C.text)}</div>
    <div style="position:absolute;left:24px;right:24px;top:110px">
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:24px">
        <img class="v-av" src="assets/img/p_sandra.jpg" style="width:84px;height:84px;border-radius:42px;border:3px solid #fffafa;object-fit:cover;margin-bottom:12px;box-shadow:0 4px 16px rgba(34,34,34,0.12)">
        <div style="font-family:'Bricolage Grotesque';font-weight:700;font-size:24px;color:${C.text};text-align:center;letter-spacing:-0.01em">Appuntamento con Giulia</div>
      </div>
      <div class="v-cd" style="background:#222;border-radius:20px;padding:20px;text-align:center;margin-bottom:16px;color:#fffafa">
        <div style="opacity:0.7;font-size:13px">Conto alla rovescia</div>
        <div style="font-family:'Bricolage Grotesque';font-weight:700;font-size:30px;margin-top:4px">Tra 4g 5h</div>
        <div style="opacity:0.7;font-size:13px;margin-top:6px">sabato 3 ottobre alle 19:00</div>
      </div>
      <div class="v-venue" style="display:flex;align-items:center;background:${C.surface2};border-radius:16px;border:1px solid ${C.border};padding:16px;margin-bottom:16px">
        <div style="width:40px;height:40px;border-radius:20px;background:${C.primaryLight};display:flex;align-items:center;justify-content:center">${ic("location", 20, C.primary)}</div>
        <div style="margin-left:12px;flex:1"><div style="font-weight:700;font-size:15px;color:${C.text}">Bar Franco</div><div style="font-size:13px;color:${C.text3};margin-top:2px">Via Bevio 42, Milano</div></div>
        ${ic("open-outline", 18, C.text3)}
      </div>
      <div class="v-chat" style="display:flex;align-items:center;justify-content:center;background:${C.surface3};border-radius:16px;padding:16px">
        <span class="v-lock" style="display:inline-block">${ic("lock-closed", 18, C.text3)}</span><span style="margin-left:8px;font-weight:700;font-size:15px;color:${C.text3}">Chat bloccata</span>
      </div>
      <div style="font-size:12px;color:${C.text3};text-align:center;margin-top:8px">La chat si apre 2 ore prima dell'appuntamento.</div>
      <div style="padding:16px 0;text-align:center;font-size:14px;font-weight:600;color:${C.text3};margin-top:8px">Annulla l'appuntamento</div>
    </div>`;
  const vcd = s3.querySelector(".v-cd"), vven = s3.querySelector(".v-venue"), vchat = s3.querySelector(".v-chat"), vlock = s3.querySelector(".v-lock"), vav = s3.querySelector(".v-av");

  // screen switching (slide), deterministic
  gsap.set([s2, s3], { xPercent: 100 });
  tl.to(s1, { xPercent: -30, duration: 0.45, ease: "expo.inOut" }, 16.85);
  tl.to(s2, { xPercent: 0, duration: 0.45, ease: "expo.inOut" }, 16.85);
  tl.to(s2, { xPercent: -30, duration: 0.45, ease: "expo.inOut" }, 18.62);
  tl.to(s3, { xPercent: 0, duration: 0.45, ease: "expo.inOut" }, 18.62);
  // screens waiting off-screen (xPercent 100) or fully covered (-30) are hidden: the rotated rounded clip let
  // a 1 px sliver of the white waiting screen through at the right edge (white line flickering at ~16 s)
  procs.push((t) => {
    for (const sc of [s1, s2, s3]) {
      const xp = gsap.getProperty(sc, "xPercent");
      sc.style.visibility = xp >= 99.5 || xp <= -29.5 ? "hidden" : "visible";
    }
  });
  tl.fromTo(vav, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }, 18.9);
  tl.fromTo(vcd, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 18.98);
  tl.fromTo(vven, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 19.08);
  tl.fromTo(vchat, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 19.18);
  // the lock: nope-shake
  tl.to(vchat, { keyframes: [{ x: -7, duration: 0.05 }, { x: 7, duration: 0.07 }, { x: -5, duration: 0.07 }, { x: 4, duration: 0.07 }, { x: 0, duration: 0.08 }], ease: "none" }, 19.6);
  tl.fromTo(vlock, { scale: 1 }, { keyframes: [{ scale: 1.35, duration: 0.08 }, { scale: 1, duration: 0.25, ease: "back.out(3)" }], immediateRender: false }, 19.6);

  // ---------- finger taps ----------
  const taps = [
    { t: 16.55, x: 196, y: 690, sc: s1 },
    { t: 17.26, x: 290, y: 478 }, { t: 17.58, x: 290, y: 543 }, { t: 17.90, x: 290, y: 608 },
    { t: 18.32, x: 196, y: 787 },
  ];
  taps.forEach((p) => {
    const d = el("div", { cls: "abs", style: { left: (p.x - 26) + "px", top: (p.y - 26) + "px", width: "52px", height: "52px", borderRadius: "50%", background: "rgba(34,34,34,0.18)", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 10px rgba(0,0,0,0.25)", opacity: 0, zIndex: 45 } }, app);
    tl.fromTo(d, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.12, ease: "power2.out" }, p.t - 0.12);
    tl.to(d, { scale: 1.8, opacity: 0, duration: 0.3, ease: "power2.out" }, p.t + 0.06);
  });

  // ---------- flowers around the phone ----------
  const fl = [
    flower(S, { x: 930, y: 700, R: 105, shape: "round5", color: "#FF9DDA" }),
    flower(S, { x: 120, y: 1240, R: 120, shape: "sun", color: "#FFD36E" }),
    flower(S, { x: 985, y: 1600, R: 78, shape: "scallop", color: "#71F0AB" }),
  ];
  fl.forEach((f, i) => {
    tl.fromTo(f, { scale: 0, rotate: -60 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.8)" }, 15.35 + i * 0.12);
    procs.push((t) => { if (t >= t0 && t < t1) f.style.rotate = ((t - t0) * (i % 2 ? -16 : 13)).toFixed(2) + "deg"; });
  });
  // payoff: push into the venue card + "Chat bloccata"
  tl.to(phone, { scale: 1.42, y: -70, rotateZ: 0, duration: 0.7, ease: "power3.inOut" }, 19.18);
  // light sweep across the glass at entry
  const sweep = el("div", { cls: "abs", style: { left: "-60%", top: 0, width: "40%", height: "100%", background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)", zIndex: 61, pointerEvents: "none" } }, screen);
  tl.fromTo(sweep, { left: "-60%" }, { left: "130%", duration: 0.9, ease: "power2.inOut" }, 15.35);
  // exit: phone rushes toward camera
  tl.to(phone, { scale: 2.1, rotateZ: 5, y: -420, opacity: 0, duration: 0.4, ease: "power3.in" }, 20.25);
  tl.to([H2.box, ...fl], { opacity: 0, duration: 0.25, ease: "power2.in" }, 20.35);
  window.M.S6 = { S, phone };
})();
