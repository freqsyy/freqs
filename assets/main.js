// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
});
// Close menu on link click
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);
// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks.classList.contains("open")) {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

// Reveal-on-scroll (sections)
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Hotkey входа в админку: Ctrl + "." (точка)
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "." || e.code === "Period")) {
    e.preventDefault();
    window.location.href = "/admin.html";
  }
});

// Back to top
const toTop = document.getElementById("toTop");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("show", window.scrollY > 600);
}, { passive: true });

// Toast
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

// Contact form -> Telegram deep link (no backend)
const form = document.getElementById("contactForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const contact = form.contact.value.trim();
  const msg = form.msg.value.trim();
  if (!name || !msg) {
    showToast("Заполните имя и сообщение");
    return;
  }
  const text =
    "🔔 Новая заявка с NOCTIS\n" +
    "Имя: " + name + "\n" +
    (contact ? "Связь: " + contact + "\n" : "") +
    "Сообщение: " + msg;
  const url = "https://t.me/Tolikbopo?text=" + encodeURIComponent(text);
  window.open(url, "_blank", "noopener");
  showToast("Заявка готова - нажмите «Отправить» в Telegram");
  form.reset();
});

// ===================== Рендер контента из API =====================
const TG = "https://t.me/Tolikbopo";

function el(tag, cls, txt) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}

function initCountUp(root) {
  const stats = root.querySelectorAll(".stat b[data-count]");
  const counted = new Set();
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const node = e.target;
        if (e.isIntersecting && !counted.has(node)) {
          counted.add(node);
          const target = parseInt(node.dataset.count, 10);
          let cur = 0;
          const step = Math.max(1, Math.round(target / 40));
          const tick = () => {
            cur += step;
            if (cur >= target) { node.textContent = target; }
            else { node.textContent = cur; requestAnimationFrame(tick); }
          };
          tick();
        }
      });
    },
    { threshold: 0.5 }
  );
  stats.forEach((s) => countIO.observe(s));
}

function renderHero(c) {
  const root = document.getElementById("heroRoot");
  root.innerHTML = "";
  const h = c.hero || {};
  if (h.tag) root.appendChild(el("span", "tag glass", h.tag));

  // h1 с градиентом на второй части (без innerHTML для данных)
  if (h.title) {
    const h1 = el("h1");
    const parts = String(h.title).split(" ");
    if (parts.length > 1) {
      const first = parts.shift();
      h1.appendChild(document.createTextNode(first + " "));
      const grad = el("span", "grad", parts.join(" "));
      h1.appendChild(grad);
    } else {
      h1.textContent = h.title;
    }
    root.appendChild(h1);
  }
  if (h.lead) root.appendChild(el("p", "lead", h.lead));

  const cta = el("div", "cta-row");
  const a1 = el("a", "btn btn-primary", "Обсудить проект");
  a1.href = TG; a1.target = "_blank"; a1.rel = "noopener";
  const a2 = el("a", "btn btn-ghost", "Смотреть работы");
  a2.href = "#portfolio";
  cta.append(a1, a2);
  root.appendChild(cta);

  if (Array.isArray(h.stats) && h.stats.length) {
    const stats = el("div", "stats");
    h.stats.forEach((s) => {
      const st = el("div", "stat");
      const b = el("b", null, "0");
      b.dataset.count = s.count;
      st.append(b, el("span", null, s.label));
      stats.appendChild(st);
    });
    root.appendChild(stats);
    initCountUp(root);
  }
}

function renderServices(c) {
  const root = document.getElementById("servicesRoot");
  if (!c.services) return;
  const s = c.services;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", s.title));
  if (s.sub) root.appendChild(el("p", "section-sub", s.sub));
  const cards = el("div", "cards");
  (s.items || []).forEach((it) => {
    const card = el("article", "card glass");
    if (it.icon) card.appendChild(el("div", "card-ic", it.icon));
    if (it.title) card.appendChild(el("h3", null, it.title));
    if (it.text) card.appendChild(el("p", null, it.text));
    if (Array.isArray(it.points) && it.points.length) {
      const ul = el("ul", "mini");
      it.points.forEach((p) => ul.appendChild(el("li", null, p)));
      card.appendChild(ul);
    }
    cards.appendChild(card);
  });
  root.appendChild(cards);
}

function renderPortfolio(c) {
  const root = document.getElementById("portfolioRoot");
  if (!c.portfolio) return;
  const p = c.portfolio;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", p.title));
  if (p.sub) root.appendChild(el("p", "section-sub", p.sub));
  const grid = el("div", "pf-grid");
  (p.items || []).forEach((it) => {
    const card = el("article", "pf-card glass");
    const thumb = el("div", "pf-thumb");
    const img = el("img");
    img.src = it.img || "";
    img.alt = it.alt || "";
    img.loading = "lazy";
    thumb.appendChild(img);
    const body = el("div", "pf-body");
    if (it.tag) body.appendChild(el("span", "pf-tag", it.tag));
    if (it.title) body.appendChild(el("h3", null, it.title));
    if (it.text) body.appendChild(el("p", null, it.text));
    card.append(thumb, body);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

function renderPricing(c) {
  const root = document.getElementById("pricingRoot");
  if (!c.pricing) return;
  const p = c.pricing;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", p.title));
  if (p.sub) root.appendChild(el("p", "section-sub", p.sub));
  const grid = el("div", "price-grid");
  (p.items || []).forEach((it) => {
    const card = el("article", it.popular ? "price-card glass popular" : "price-card glass");
    if (it.popular) {
      card.appendChild(el("span", "popular-badge", "хит"));
      card.appendChild(el("span", "disc-badge", "-44%"));
    }
    if (it.name) card.appendChild(el("h3", null, it.name));
    const price = el("div", "price");
    if (it.old) price.appendChild(el("span", "old-price", it.old));
    const b = el("b", null, it.price || "");
    const unit = el("span", null, it.unit || "");
    price.append(b, unit);
    card.appendChild(price);
    if (it.for) card.appendChild(el("p", "price-for", it.for));
    if (Array.isArray(it.points) && it.points.length) {
      const ul = el("ul", "mini");
      it.points.forEach((p2) => ul.appendChild(el("li", null, p2)));
      card.appendChild(ul);
    }
    const btn = el("a", it.popular ? "btn btn-primary full" : "btn btn-ghost full", "Выбрать");
    btn.href = TG; btn.target = "_blank"; btn.rel = "noopener";
    card.appendChild(btn);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

function renderWhy(c) {
  const root = document.getElementById("whyRoot");
  if (!c.why) return;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", c.why.title));
  const grid = el("div", "why-grid");
  (c.why.items || []).forEach((it) => {
    const w = el("div", "why glass");
    if (it.icon) w.appendChild(el("span", "why-ic", it.icon));
    if (it.title) w.appendChild(el("b", null, it.title));
    if (it.text) w.appendChild(el("p", null, it.text));
    grid.appendChild(w);
  });
  root.appendChild(grid);
}

function renderProcess(c) {
  const root = document.getElementById("processRoot");
  if (!c.process) return;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", c.process.title));
  const ol = el("ol", "steps");
  (c.process.items || []).forEach((it) => {
    const li = el("li");
    if (it.num) li.appendChild(el("span", "num", it.num));
    const div = el("div");
    if (it.title) div.appendChild(el("b", null, it.title));
    if (it.text) div.appendChild(el("p", null, it.text));
    li.appendChild(div);
    ol.appendChild(li);
  });
  root.appendChild(ol);
}

function renderFaq(c) {
  const root = document.getElementById("faqRoot");
  if (!c.faq) return;
  root.innerHTML = "";
  root.appendChild(el("h2", "section-title", c.faq.title));
  if (c.faq.sub) root.appendChild(el("p", "section-sub", c.faq.sub));
  const wrap = el("div", "faq");
  (c.faq.items || []).forEach((it) => {
    const d = el("details", "faq-item glass");
    const sum = el("summary", null, it.q || "");
    const body = el("div", "faq-body");
    body.appendChild(el("p", null, it.a || ""));
    d.append(sum, body);
    wrap.appendChild(d);
  });
  root.appendChild(wrap);
}

async function renderContent() {
  try {
    const res = await fetch("/api/content", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("bad status " + res.status);
    const c = await res.json();
    renderHero(c);
    renderServices(c);
    renderPortfolio(c);
    renderPricing(c);
    renderWhy(c);
    renderProcess(c);
    renderFaq(c);
  } catch (e) {
    console.error("Не удалось загрузить контент:", e);
    // мягкий фолбэк: подсказка админу
    const hint = document.createElement("p");
    hint.className = "section-sub";
    hint.textContent = "Контент временно недоступен (нет связи с хранилищем). Зайдите позже или проверьте настройки.";
    ["servicesRoot", "portfolioRoot", "pricingRoot", "whyRoot", "processRoot", "faqRoot"].forEach((id) => {
      const r = document.getElementById(id);
      if (r && !r.children.length) r.appendChild(hint.cloneNode(true));
    });
  }
}

renderContent();
