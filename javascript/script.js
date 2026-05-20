window.addEventListener("DOMContentLoaded", function () {
  const slideshow = document.getElementById("solarSlideshow");
  if (!slideshow) return;
 
  const slides       = Array.from(slideshow.querySelectorAll(".ss-slide"));
  if (!slides.length) return;
 
  const prevBtn       = slideshow.querySelector(".ss-prev");
  const nextBtn       = slideshow.querySelector(".ss-next");
  const flankLeftImg  = slideshow.querySelector(".ss-flank--left  .ss-flank-img");
  const flankRightImg = slideshow.querySelector(".ss-flank--right .ss-flank-img");
  const stage         = slideshow.querySelector(".ss-stage");
  const track         = slideshow.querySelector(".ss-track");
  const indicator     = slideshow.querySelector(".ss-pause-indicator"); 
 
  let current = 0;
  let timer   = null;
  const DELAY = 5500;
 
  /* ── Dot indicators ──────────────────────────── */
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "ss-dots";
  dotsWrap.setAttribute("role", "tablist");
  dotsWrap.setAttribute("aria-label", "Slideshow navigation");
 
  const dots = slides.map((_, i) => {
    const btn = document.createElement("button");
    btn.className = "ss-dot" + (i === 0 ? " is-active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Slide ${i + 1}`);
    btn.setAttribute("aria-selected", String(i === 0));
    btn.addEventListener("click", () => { goTo(i); restartTimer(); });
    dotsWrap.appendChild(btn);
    return btn;
  });
 
  stage.after(dotsWrap);
 
  /* ── Accessibility ───────────────────────────── */
  track.setAttribute("aria-live", "polite");
  track.setAttribute("aria-atomic", "true");
 
  /* ── Helpers ─────────────────────────────────── */
  function wrappedSrc(index) {
    const i = ((index % slides.length) + slides.length) % slides.length;
    const img = slides[i].querySelector("img");
    return img ? img.getAttribute("src") : "";
  }
 
  function updateFlanks() {
    if (flankLeftImg)  flankLeftImg.setAttribute("src", wrappedSrc(current - 1));
    if (flankRightImg) flankRightImg.setAttribute("src", wrappedSrc(current + 1));
  }
 
  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-selected", String(i === current));
    });
  }
 
  // NEW — show pause bars, hide play triangle
  function showPaused() {
    if (indicator) indicator.classList.remove("is-playing");
  }
 
  // NEW — show play triangle, hide pause bars
  function showPlaying() {
    if (indicator) indicator.classList.add("is-playing");
  }
 
  function goTo(index) {
    slides[current].classList.remove("is-active");
    current = ((index % slides.length) + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    updateFlanks();
    updateDots();
  }
 
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);
 
  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(next, DELAY);
    showPlaying(); // NEW
  }
 
  /* ── Controls ────────────────────────────────── */
  nextBtn?.addEventListener("click", () => { next(); restartTimer(); });
  prevBtn?.addEventListener("click", () => { prev(); restartTimer(); });
 
  slideshow.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); restartTimer(); }
    if (e.key === "ArrowLeft")  { prev(); restartTimer(); }
  });
 
  // NEW — show pause icon when autoplay stops
  stage.addEventListener("mouseenter", () => { clearInterval(timer); showPaused(); });
  stage.addEventListener("mouseleave", restartTimer);
  stage.addEventListener("focusin",    () => { clearInterval(timer); showPaused(); });
  stage.addEventListener("focusout",   restartTimer);
 
  // Touch / swipe
  let touchStartX = 0;
  stage.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 44) { delta < 0 ? next() : prev(); restartTimer(); }
  }, { passive: true });
 
  /* ── Init ────────────────────────────────────── */
  updateFlanks();
  restartTimer();
});

window.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links  = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    var isOpen = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      links.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});