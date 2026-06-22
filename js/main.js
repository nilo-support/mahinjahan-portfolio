/* ============================================
   Mahin Jahan — Portfolio
   Lenis + GSAP · subtle reveals only
   ============================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------
   Smooth scroll (Lenis)
   -------------------------------------------- */
let lenis = null;
if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* --------------------------------------------
   Anchor links work with Lenis
   -------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView();
  });
});

/* --------------------------------------------
   Nav state
   -------------------------------------------- */
const nav = document.getElementById("nav");
ScrollTrigger.create({
  start: 40,
  onEnter: () => nav.classList.add("is-scrolled"),
  onLeaveBack: () => nav.classList.remove("is-scrolled"),
});

/* --------------------------------------------
   Gentle reveals
   -------------------------------------------- */
if (!prefersReduced) {
  document.querySelectorAll(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
    });
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => {
    el.style.opacity = 1;
    el.style.transform = "none";
  });
}

window.addEventListener("load", () => ScrollTrigger.refresh());
