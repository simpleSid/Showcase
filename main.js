const telegramUrl = "https://t.me/JustaSid";

const form = document.querySelector("[data-contact-form]");
const statusNode = document.querySelector("[data-form-status]");
const telegramLinks = document.querySelectorAll("[data-telegram-link]");
const revealNodes = document.querySelectorAll("[data-reveal]");

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
