/*
  PORTFOLIO INTERACTIONS
  This file controls small behavior only:
  - moving the About panel over the hero as you scroll
  - fading sections in and out as you scroll
  - highlighting the active navigation link
  - moving through simple media carousels

  The site will still work if this file is removed; it just becomes less polished.
*/

const sections = document.querySelectorAll(".reveal-panel");
const navLinks = document.querySelectorAll(".nav-link");

document.body.classList.add("reveal-enabled");

/*
  ABOUT SCROLL TRANSITION
  The tall [data-about-scroll] section supplies the scrolling distance while its
  inner frame stays sticky. This converts the stage's position into a clean 0–1
  value that CSS uses for the hero fade, panel movement, and gold progress line.
*/
const aboutScrollStage = document.querySelector("[data-about-scroll]");

if (aboutScrollStage) {
  let aboutAnimationFrame = null;

  const updateAboutProgress = () => {
    const stageBounds = aboutScrollStage.getBoundingClientRect();
    const scrollDistance = Math.max(1, aboutScrollStage.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -stageBounds.top / scrollDistance));
    const heroOpacity = Math.max(0, 1 - (progress * 1.35));
    const heroShift = progress * -8;
    const heroScale = 1 - (progress * 0.035);
    const panelOpacity = Math.min(1, Math.max(0, (progress - 0.06) * 1.55));
    const panelOffset = (1 - progress) * 72;

    aboutScrollStage.style.setProperty("--about-progress", progress.toFixed(4));
    aboutScrollStage.style.setProperty("--about-hero-opacity", heroOpacity.toFixed(4));
    aboutScrollStage.style.setProperty("--about-hero-shift", `${heroShift.toFixed(3)}vh`);
    aboutScrollStage.style.setProperty("--about-hero-scale", heroScale.toFixed(4));
    aboutScrollStage.style.setProperty("--about-panel-opacity", panelOpacity.toFixed(4));
    aboutScrollStage.style.setProperty("--about-panel-offset", `${panelOffset.toFixed(3)}vh`);
    aboutAnimationFrame = null;
  };

  const requestAboutUpdate = () => {
    if (aboutAnimationFrame !== null) {
      return;
    }

    aboutAnimationFrame = window.requestAnimationFrame(updateAboutProgress);
  };

  updateAboutProgress();
  window.addEventListener("scroll", requestAboutUpdate, { passive: true });
  window.addEventListener("resize", requestAboutUpdate);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  },
  {
    /*
      rootMargin controls where the fade happens.
      This creates a center "active slide" zone, so old sections fade out
      instead of hanging around when the next section takes over.
    */
    rootMargin: "-28% 0px -28% 0px",
    threshold: 0.01,
  }
);

sections.forEach((section) => revealObserver.observe(section));

const navAwareSections = document.querySelectorAll("[data-nav-section]");

const activeNavObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const activeSection = entry.target.dataset.navSection || entry.target.id;
      const activeLink = document.querySelector(`.nav-link[href="#${activeSection}"]`);

      navLinks.forEach((link) => link.classList.remove("is-active"));

      if (activeLink) {
        activeLink.classList.add("is-active");
      }
    });
  },
  {
    /* This watches the middle band of the viewport, so the nav updates at a natural point. */
    rootMargin: "-38% 0px -52% 0px",
    threshold: 0,
  }
);

navAwareSections.forEach((section) => activeNavObserver.observe(section));

/*
  SYMBIOSIS TRAILER
  The visible play button avoids presenting a black, apparently inactive video.
  Native controls remain available once playback begins and handle pausing/seeking.
*/
const symbiosisTrailers = document.querySelectorAll("[data-symbiosis-trailer]");

symbiosisTrailers.forEach((symbiosisTrailer) => {
  const trailerVideo = symbiosisTrailer.querySelector("video");
  const trailerPlayButton = symbiosisTrailer.querySelector("[data-trailer-play]");

  trailerPlayButton?.addEventListener("click", async () => {
    try {
      await trailerVideo?.play();
    } catch {
      /* The native video controls remain usable if playback is blocked. */
    }
  });

  trailerVideo?.addEventListener("play", () => {
    trailerPlayButton.hidden = true;
  });

  trailerVideo?.addEventListener("ended", () => {
    trailerPlayButton.hidden = false;
  });
});

const carousels = document.querySelectorAll("[data-carousel]");

carousels.forEach((carousel) => {
  const slides = carousel.querySelectorAll(".media-slide");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const countLabel = carousel.querySelector("[data-carousel-count]");
  const viewport = carousel.querySelector(".media-viewport");
  let currentSlide = 0;

  const showSlide = (slideIndex) => {
    currentSlide = (slideIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isCurrentSlide = index === currentSlide;
      const slideVideo = slide.querySelector("video");

      slide.classList.toggle("is-current", isCurrentSlide);

      /* Only the visible carousel video plays; returning to it restarts the loop cleanly. */
      if (slideVideo && isCurrentSlide) {
        const playRequest = slideVideo.play();
        playRequest?.catch(() => {
          /* Native controls remain available if the browser blocks automatic playback. */
        });
      } else if (slideVideo) {
        slideVideo.pause();

        if (slideVideo.readyState > 0) {
          slideVideo.currentTime = 0;
        }
      }
    });

    const currentAspectRatio = slides[currentSlide].dataset.aspectRatio;

    if (viewport && currentAspectRatio) {
      viewport.style.aspectRatio = currentAspectRatio;
    }

    if (countLabel) {
      const currentNumber = String(currentSlide + 1).padStart(2, "0");
      const totalNumber = String(slides.length).padStart(2, "0");
      countLabel.textContent = `${currentNumber} / ${totalNumber}`;
    }
  };

  if (slides.length <= 1) {
    return;
  }

  previousButton?.addEventListener("click", () => showSlide(currentSlide - 1));
  nextButton?.addEventListener("click", () => showSlide(currentSlide + 1));

  showSlide(currentSlide);
});
