const contactEmail = "hello@example.com";
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

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent("Заявка на лендинг");
    const body = encodeURIComponent(
      `Имя: ${name}\nКонтакт: ${contact}\n\nОписание задачи:\n${message}`
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

    if (statusNode) {
      statusNode.textContent =
        "Открылся почтовый клиент. Если письмо не появилось, напишите в Telegram.";
    }
  });
}
