const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const revealItems = document.querySelectorAll(".reveal");
const form = document.querySelector("[data-form]");
const formStatus = document.querySelector("[data-form-status]");
const systemTabs = document.querySelectorAll("[data-system]");
const systemImage = document.querySelector("[data-system-image]");
const systemLabel = document.querySelector("[data-system-label]");
const systemTitle = document.querySelector("[data-system-title]");
const systemCopy = document.querySelector("[data-system-copy]");
const systemList = document.querySelector("[data-system-list]");
const constructionCanvas = document.querySelector("[data-construction-canvas]");
const constructionStep = document.querySelector("[data-construction-step]");

const systems = {
  yard: {
    image: "assets/playground-module.png",
    alt: "Детский комплекс для двора ЖК",
    label: "Возраст 3-12",
    title: "Живая площадка во дворе",
    copy: "Комбинируем лазательные модули, баланс, тихие игровые зоны и покрытие с понятной навигацией для детей разных возрастов.",
    items: ["игровой сценарий по возрастам", "мягкое покрытие с цветовой логикой", "безопасные узлы и закрытый крепеж"]
  },
  school: {
    image: "assets/workout-yard.png",
    alt: "Спортивная площадка для школы с разноцветным покрытием",
    label: "Учебная нагрузка",
    title: "Школьная спортзона",
    copy: "Собираем территорию для уроков, секций и свободной активности: турники, рукоходы, брусья, беговые и игровые зоны.",
    items: ["разделение потоков учеников", "оборудование для разного уровня подготовки", "стойкое покрытие для ежедневной нагрузки"]
  },
  workout: {
    image: "assets/sports-frame.png",
    alt: "Воркаут-комплекс с высокими стойками и турниками",
    label: "Подростки и взрослые",
    title: "Воркаут без декораций",
    copy: "Делаем силовые станции, которые выглядят спокойно и работают жестко: правильные хваты, высоты, пролеты и зоны безопасности.",
    items: ["турники, брусья и рукоходы", "антивандальная конструкция", "монтаж под сезонную эксплуатацию"]
  }
};

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

const closeMenu = () => {
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  header.classList.remove("nav-active");
  navToggle.setAttribute("aria-expanded", "false");
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  header.classList.toggle("nav-active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    closeMenu();
  }
});

systemTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.system;
    const selected = systems[key];

    systemTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    systemImage.src = selected.image;
    systemImage.alt = selected.alt;
    systemLabel.textContent = selected.label;
    systemTitle.textContent = selected.title;
    systemCopy.textContent = selected.copy;
    systemList.replaceChildren(
      ...selected.items.map((text) => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
      })
    );
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

if (constructionCanvas) {
  const ctx = constructionCanvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stepLabels = [
    "00 / поле",
    "01 / основание",
    "02 / покрытие",
    "03 / стойки",
    "04 / турник и брусья",
    "05 / готово"
  ];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let running = false;
  let startedAt = 0;
  let buildFrameId = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeOut = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  const segment = (time, from, to) => easeOut((time - from) / (to - from));

  const resizeConstruction = () => {
    const rect = constructionCanvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(320, Math.round(rect.width));
    height = Math.max(420, Math.round(rect.height));
    constructionCanvas.width = Math.round(width * dpr);
    constructionCanvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const isoFactory = () => {
    const scenePoints = [
      [-260, -175, 0],
      [260, -175, 0],
      [260, 175, 0],
      [-260, 175, 0],
      [-104, -40, 132],
      [-59, -40, 132],
      [-11, 18, 86],
      [29, 88, 86],
      [76, -40, 132],
      [121, -40, 132],
      [166, -40, 100]
    ];
    const rawProjected = scenePoints.map(([x, y, z]) => ({
      x: x - y,
      y: (x + y) * 0.48 - z
    }));
    const rawBounds = rawProjected.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    const padding = Math.min(width, height) * 0.12;
    const scale = Math.min(
      (width - padding * 2) / (rawBounds.maxX - rawBounds.minX),
      (height - padding * 2) / (rawBounds.maxY - rawBounds.minY)
    );
    const projected = rawProjected.map((point) => ({
      x: point.x * scale,
      y: point.y * scale
    }));
    const bounds = projected.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );
    const originX = width * 0.5 - (bounds.minX + bounds.maxX) * 0.5;
    const originY = height * 0.5 - (bounds.minY + bounds.maxY) * 0.5;

    return (x, y, z = 0) => ({
      x: originX + (x - y) * scale,
      y: originY + (x + y) * scale * 0.48 - z * scale
    });
  };

  const poly = (points, fill, stroke = "rgba(15, 24, 27, 0.9)", lineWidth = 2) => {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };

  const line = (a, b, color = "#162126", lineWidth = 5) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const circle = (point, radius, fill, stroke = "#162126") => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };

  const drawPost = (iso, x, y, heightValue, progress) => {
    const base = iso(x, y, 0);
    const top = iso(x, y, heightValue * progress);
    const shadow = iso(x + 24, y + 18, 0);

    line(base, shadow, "rgba(15, 24, 27, 0.18)", 8);
    line(base, top, "#20292c", 9);
    line({ x: base.x + 3, y: base.y - 2 }, { x: top.x + 3, y: top.y - 2 }, "#475154", 3);
    circle(top, 6, "#f6c928");
  };

  const drawBar = (iso, start, end, z, progress, color = "#20292c", widthValue = 7) => {
    const a = iso(start[0], start[1], z);
    const bFull = iso(end[0], end[1], z);
    const b = {
      x: a.x + (bFull.x - a.x) * progress,
      y: a.y + (bFull.y - a.y) * progress
    };

    line(a, b, color, widthValue);
    circle(a, 5, "#f6c928");

    if (progress > 0.96) {
      circle(bFull, 5, "#f6c928");
    }
  };

  const drawConstruction = (time) => {
    const iso = isoFactory();
    const foundation = segment(time, 0.08, 0.26);
    const rubber = segment(time, 0.2, 0.42);
    const posts = segment(time, 0.36, 0.58);
    const bars = segment(time, 0.52, 0.76);
    const details = segment(time, 0.7, 0.94);
    const pulse = 0.5 + Math.sin(time * Math.PI * 10) * 0.5;

    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#dcefea");
    sky.addColorStop(0.62, "#eef5ef");
    sky.addColorStop(1, "#d7e6df");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    for (let i = -5; i < 18; i += 1) {
      const a = iso(-360 + i * 70, -260, 0);
      const b = iso(-360 + i * 70, 370, 0);
      line(a, b, "rgba(22, 33, 38, 0.07)", 1);
    }

    const field = [iso(-230, -145), iso(230, -145), iso(230, 145), iso(-230, 145)];
    poly(field, "#77a96f", "rgba(22, 33, 38, 0.34)", 2);

    for (let i = 0; i < 20; i += 1) {
      const x = -230 + i * 24;
      const a = iso(x, -136);
      const b = iso(x + 32, 136);
      line(a, b, "rgba(255, 255, 255, 0.08)", 1);
    }

    if (foundation > 0) {
      const inset = 22 * (1 - foundation);
      const slab = [
        iso(-190 + inset, -110 + inset),
        iso(190 - inset, -110 + inset),
        iso(190 - inset, 110 - inset),
        iso(-190 + inset, 110 - inset)
      ];
      poly(slab, `rgba(42, 50, 52, ${0.18 + foundation * 0.42})`, "rgba(22, 33, 38, 0.7)", 2);
    }

    if (rubber > 0) {
      const pad = 6 * (1 - rubber);
      const surface = [
        iso(-184 + pad, -104 + pad),
        iso(184 - pad, -104 + pad),
        iso(184 - pad, 104 - pad),
        iso(-184 + pad, 104 - pad)
      ];
      poly(surface, `rgba(195, 69, 58, ${rubber})`, "rgba(22, 33, 38, 0.7)", 3);
    }

    const postPositions = [
      [-104, -40, 132],
      [-59, -40, 132],
      [-11, 18, 86],
      [-11, 88, 86],
      [29, 18, 86],
      [29, 88, 86],
      [76, -40, 132],
      [121, -40, 132],
      [166, -40, 100]
    ];

    postPositions.forEach(([x, y, z], index) => {
      const stagger = clamp((posts - index * 0.055) / 0.72, 0, 1);
      if (stagger > 0) {
        drawPost(iso, x, y, z, easeOut(stagger));
      }
    });

    if (bars > 0) {
      drawBar(iso, [-104, -40], [-59, -40], 132, bars, "#20292c", 8);
      drawBar(iso, [-11, 18], [-11, 88], 86, clamp((bars - 0.14) / 0.86, 0, 1), "#20292c", 7);
      drawBar(iso, [29, 18], [29, 88], 86, clamp((bars - 0.22) / 0.78, 0, 1), "#20292c", 7);
      drawBar(iso, [76, -40], [121, -40], 132, clamp((bars - 0.3) / 0.7, 0, 1), "#20292c", 8);
      drawBar(iso, [121, -40], [166, -40], 100, clamp((bars - 0.38) / 0.62, 0, 1), "#20292c", 8);
    }

    if (details > 0) {
      const markA = iso(-168, 88);
      const markB = iso(168, 88);
      line(markA, markB, `rgba(255, 255, 255, ${0.25 + details * 0.55})`, 3);

      ctx.fillStyle = `rgba(246, 201, 40, ${details})`;
    }

    const stepIndex = time < 0.08
      ? 0
      : time < 0.2
        ? 1
        : time < 0.36
          ? 2
          : time < 0.52
            ? 3
            : time < 0.7
              ? 4
              : 5;

    if (constructionStep) {
      constructionStep.textContent = stepLabels[stepIndex];
    }
  };

  const renderBuild = (timestamp) => {
    if (!startedAt) {
      startedAt = timestamp;
    }

    const duration = 9000;
    const time = reducedMotion ? 1 : ((timestamp - startedAt) % duration) / duration;
    drawConstruction(time);

    if (running && !reducedMotion) {
      buildFrameId = requestAnimationFrame(renderBuild);
    }
  };

  const startBuild = () => {
    if (running) {
      return;
    }

    running = true;
    startedAt = 0;
    buildFrameId = requestAnimationFrame(renderBuild);
  };

  resizeConstruction();
  drawConstruction(reducedMotion ? 1 : 0);
  window.addEventListener("resize", () => {
    resizeConstruction();
    drawConstruction(reducedMotion ? 1 : 0);
  });

  const buildObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startBuild();
        }
      });
    },
    { threshold: 0.24 }
  );

  buildObserver.observe(constructionCanvas);
  startBuild();
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const phone = String(data.get("phone")).trim();
  const message = String(data.get("message")).trim();
  const submitButton = form.querySelector("button[type='submit']");
  const fieldErrors = {
    name: "Укажите имя.",
    phone: "Укажите телефон для связи."
  };
  const firstInvalidField = !name ? "name" : !phone ? "phone" : "";

  Object.keys(fieldErrors).forEach((fieldName) => {
    const field = form.elements[fieldName];
    const label = form.querySelector(`[data-field="${fieldName}"]`);
    const error = form.querySelector(`[data-error-for="${fieldName}"]`);
    const isInvalid = fieldName === firstInvalidField;

    label.classList.toggle("has-error", isInvalid);
    field.setAttribute("aria-invalid", String(isInvalid));

    if (isInvalid) {
      showFieldError(error, fieldErrors[fieldName]);
    } else {
      hideFieldError(error);
    }
  });

  if (firstInvalidField) {
    formStatus.classList.remove("is-error");
    formStatus.textContent = "";
    form.elements[firstInvalidField].focus();
    return;
  }

  formStatus.classList.remove("is-error");
  formStatus.textContent = "Отправляем заявку...";

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch("/send.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, phone, message })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Не удалось отправить заявку.");
    }

    form.reset();
    formStatus.classList.remove("is-error");
    formStatus.textContent = result.message || "Заявка отправлена. Мы свяжемся с вами.";
  } catch (error) {
    formStatus.classList.add("is-error");
    formStatus.textContent = error.message;
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

    formStatus.textContent = "";
  });
});
