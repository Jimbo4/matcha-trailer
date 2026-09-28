/* Boot: fit stage to window (preview), player controls & audio sync, render hooks */
(function () {
  const { T, seek } = window.M;
  const params = new URLSearchParams(location.search);
  const RENDER = params.has("render");
  if (RENDER) document.body.classList.add("render");
  const vp = document.getElementById("viewport");
  function fit() {
    if (RENDER) return;
    const s = Math.min((window.innerHeight - 70) / 1920, window.innerWidth / 1080);
    vp.style.transform = `scale(${s})`;
  }
  window.addEventListener("resize", fit); fit();

  // impactShake: decaying camera shake on the two musical impacts (deterministic)
  const stageEl = document.getElementById("stage");
  const hits = [[T.DROP, 14], [T.JUMP, 10], [T.HIT, 5]];
  window.M.procs.push((t) => {
    let dx = 0, dy = 0;
    for (const [h, a] of hits) {
      const u = t - h;
      if (u >= 0 && u < 0.32) { const k = a * Math.exp(-u * 14); dx += Math.sin(u * 95) * k; dy += Math.cos(u * 83) * k * 0.8; }
    }
    stageEl.style.transform = (dx || dy) ? `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(1.012)` : "";
  });
  // Wait for fonts + images before first frame
  const imgs = Array.from(document.images);
  const ready = Promise.all([document.fonts.ready, ...imgs.map((im) => im.decode ? im.decode().catch(() => {}) : Promise.resolve())])
    .then(() => { seek(0); window.__ready = true; });
  window.__readyPromise = ready;
  window.__seek = seek;
  window.__duration = T.DUR;

  if (RENDER) return;
  // ---------- preview player ----------
  const audio = new Audio("assets/audio/trailer_mix.m4a");
  audio.preload = "auto";
  const ctrl = document.getElementById("controls");
  const btn = ctrl.querySelector("button");
  const range = ctrl.querySelector("input");
  const lab = ctrl.querySelector("span");
  let playing = false, clockStart = 0, offset = 0;
  function now() { return playing ? (audio.readyState >= 2 && !audio.paused ? audio.currentTime : offset + (performance.now() - clockStart) / 1000) : offset; }
  function loop() {
    const t = now();
    if (t >= T.DUR) { playing = false; offset = 0; audio.pause(); btn.textContent = "Play"; }
    seek(Math.min(t, T.DUR - 0.001));
    range.value = (t / T.DUR) * 1000; lab.textContent = t.toFixed(2) + " s";
    requestAnimationFrame(loop);
  }
  btn.onclick = () => {
    if (playing) { offset = now(); playing = false; audio.pause(); btn.textContent = "Play"; return; }
    playing = true; clockStart = performance.now(); audio.currentTime = offset; audio.play().catch(() => {}); btn.textContent = "Pausa";
  };
  range.oninput = () => { offset = (range.value / 1000) * T.DUR; if (playing) { clockStart = performance.now(); audio.currentTime = offset; } };
  document.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); btn.onclick(); } });
  ready.then(() => requestAnimationFrame(loop));
})();
