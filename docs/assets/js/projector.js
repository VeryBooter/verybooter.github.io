// Faithful page renders of the supplied PPT.pdf; Vite bundles the image URLs.
export const slides = [
  {
    image: new URL("../images/projector/slide-01.png", import.meta.url).href,
    title: "Air Battle",
    description:
      "A modernized aerial warfare with well integrated EW, C4ISR feature.",
  },
  {
    image: new URL("../images/projector/slide-02.png", import.meta.url).href,
    title: "Blood & Railroad",
    description:
      "An united game for railroad partisans to resist hostile aggression.",
  },
];
export function mountProjector() {
  let index = 0,
    timer = null;
  const $ = (id) => document.getElementById(id);
  const show = () => {
    const slide = slides[index];
    $("projected-slide").src = slide.image;
    $("projected-slide").alt =
      `Slide ${index + 1}: ${slide.title} — ${slide.description}`;
    $("projected-slide-caption").textContent = `${slide.title} — ${slide.description}`;
    $("slide-count").textContent = `${index + 1} / ${slides.length}`;
  };
  const step = (delta) => {
    index = (index + delta + slides.length) % slides.length;
    show();
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
    $("slide-play").textContent = "Play";
    $("slide-play").setAttribute("aria-pressed", "false");
  };
  $("slide-previous").addEventListener("click", () => step(-1));
  $("slide-next").addEventListener("click", () => step(1));
  $("slide-play").addEventListener("click", () => {
    if (timer) return stop();
    timer = setInterval(() => step(1), 5000);
    $("slide-play").textContent = "Pause";
    $("slide-play").setAttribute("aria-pressed", "true");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  show();
}
