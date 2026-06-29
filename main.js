const telegramUrl = "https://t.me/JustaSid";

const form = document.querySelector("[data-contact-form]");
const statusNode = document.querySelector("[data-form-status]");
const telegramLinks = document.querySelectorAll("[data-telegram-link]");
const revealNodes = document.querySelectorAll("[data-reveal]");
const carouselNode = document.querySelector("[data-project-carousel]");

telegramLinks.forEach((link) => {
  link.href = telegramUrl;
});

const revealAll = () => {
  revealNodes.forEach((node) => {
    node.classList.add("is-visible");
  });
};

if (revealNodes.length > 0) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const hasPassedViewport = entry.boundingClientRect.top < window.innerHeight * 0.16;

          if (!entry.isIntersecting && !hasPassedViewport) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.14,
      }
    );

    revealNodes.forEach((node) => {
      observer.observe(node);
    });

    document.documentElement.classList.add("reveal-ready");
  }
}

const initProjectCarousel = (carousel) => {
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let autoplayTimer = 0;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let isDragging = false;
  let didDrag = false;
  let activePointerId = 0;
  let suppressNextClick = false;

  if (!viewport || !track || slides.length === 0) {
    return;
  }

  const getViewportContentWidth = () => {
    const viewportStyles = window.getComputedStyle(viewport);
    const paddingLeft = Number.parseFloat(viewportStyles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(viewportStyles.paddingRight) || 0;

    return Math.max(0, viewport.clientWidth - paddingLeft - paddingRight);
  };

  const getSlideOffset = (index) => {
    const slide = slides[index];
    const viewportWidth = getViewportContentWidth();
    const maxOffset = Math.max(0, track.scrollWidth - viewportWidth);
    const centeredOffset = slide.offsetLeft - (viewportWidth - slide.clientWidth) / 2;

    return Math.min(Math.max(0, centeredOffset), maxOffset);
  };

  const setActiveSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    const offset = getSlideOffset(activeIndex);

    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      const links = slide.querySelectorAll("a");

      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      links.forEach((link) => {
        link.tabIndex = isActive ? 0 : -1;
      });
    });

  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = 0;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (reducedMotion.matches || slides.length < 2) {
      return;
    }

    autoplayTimer = window.setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, 4600);
  };

  const goToSlide = (index) => {
    setActiveSlide(index);
    startAutoplay();
  };

  previousButton?.addEventListener("click", () => {
    goToSlide(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    goToSlide(activeIndex + 1);
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }

    isDragging = true;
    didDrag = false;
    suppressNextClick = false;
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOffset = getSlideOffset(activeIndex);
    stopAutoplay();
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartX;

    if (!didDrag && Math.abs(deltaX) > 8) {
      didDrag = true;
      viewport.classList.add("is-dragging");
      track.style.transition = "none";
      viewport.setPointerCapture(event.pointerId);
    }

    if (!didDrag) {
      return;
    }

    track.style.transform = `translate3d(${-dragStartOffset + deltaX}px, 0, 0)`;
  });

  const finishDrag = (event) => {
    if (!isDragging || event.pointerId !== activePointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    isDragging = false;
    activePointerId = 0;

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    viewport.classList.remove("is-dragging");
    track.style.transition = "";

    if (!didDrag) {
      startAutoplay();
      return;
    }

    suppressNextClick = event.type === "pointerup";
    setActiveSlide(activeIndex + (deltaX < 0 ? 1 : -1));

    startAutoplay();
  };

  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);
  carousel.addEventListener("pointerenter", stopAutoplay);
  carousel.addEventListener("pointerleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);
  carousel.addEventListener(
    "dragstart",
    (event) => {
      event.preventDefault();
    },
    true
  );
  carousel.addEventListener(
    "click",
    (event) => {
      if (!suppressNextClick) {
        return;
      }

      event.preventDefault();
      suppressNextClick = false;
      didDrag = false;
    },
    true
  );

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      setActiveSlide(activeIndex);
    });
    observer.observe(viewport);
  } else {
    window.addEventListener("resize", () => {
      setActiveSlide(activeIndex);
    });
  }

  reducedMotion.addEventListener?.("change", () => {
    setActiveSlide(activeIndex);
    startAutoplay();
  });

  setActiveSlide(0);
  startAutoplay();
};

if (carouselNode) {
  initProjectCarousel(carouselNode);
}

const fieldHintTimers = new WeakMap();

const showFieldError = (error, message) => {
  const activeTimer = fieldHintTimers.get(error);

  if (activeTimer) {
    window.clearTimeout(activeTimer);
  }

  error.textContent = message;
  error.classList.remove("is-hiding");
  error.classList.add("is-visible");
};

const hideFieldError = (error) => {
  const activeTimer = fieldHintTimers.get(error);

  if (activeTimer) {
    window.clearTimeout(activeTimer);
  }

  if (!error.textContent) {
    error.classList.remove("is-visible", "is-hiding");
    return;
  }

  error.classList.remove("is-visible");
  error.classList.add("is-hiding");

  const timer = window.setTimeout(() => {
    error.textContent = "";
    error.classList.remove("is-hiding");
    fieldHintTimers.delete(error);
  }, 220);

  fieldHintTimers.set(error, timer);
};

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const message = String(data.get("message") || "").trim();
    const submitButton = form.querySelector("button[type='submit']");
    const fieldErrors = {
      name: "Укажите имя.",
      contact: "Укажите контакт для связи.",
      message: "Опишите задачу.",
    };
    const firstInvalidField = !name ? "name" : !contact ? "contact" : !message ? "message" : "";

    Object.keys(fieldErrors).forEach((fieldName) => {
      const field = form.elements[fieldName];
      const label = form.querySelector(`[data-field="${fieldName}"]`);
      const error = form.querySelector(`[data-error-for="${fieldName}"]`);
      const isInvalid = fieldName === firstInvalidField;

      if (!field || !label || !error) {
        return;
      }

      label.classList.toggle("has-error", isInvalid);
      field.setAttribute("aria-invalid", String(isInvalid));

      if (isInvalid) {
        showFieldError(error, fieldErrors[fieldName]);
      } else {
        hideFieldError(error);
      }
    });

    if (firstInvalidField) {
      if (statusNode) {
        statusNode.classList.remove("is-error");
        statusNode.textContent = "";
      }

      form.elements[firstInvalidField].focus();
      return;
    }

    if (statusNode) {
      statusNode.classList.remove("is-error");
      statusNode.textContent = "Отправляем заявку...";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch("send.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, contact, message }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Не удалось отправить заявку.");
      }

      form.reset();

      if (statusNode) {
        statusNode.classList.remove("is-error");
        statusNode.textContent = result.message || "Заявка отправлена. Я свяжусь с Вами.";
      }
    } catch (error) {
      if (statusNode) {
        statusNode.classList.add("is-error");
        statusNode.textContent = error.message;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      const label = field.closest("[data-field]");
      const error = form.querySelector(`[data-error-for="${field.name}"]`);

      if (label) {
        label.classList.remove("has-error");
      }

      field.removeAttribute("aria-invalid");

      if (error) {
        hideFieldError(error);
      }

      if (statusNode) {
        statusNode.textContent = "";
      }
    });
  });
}
