// ===== NOCTIS admin panel =====

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const toast = $("#toast");
let toastTimer;
function showToast(msg, ok = true) {
  toast.textContent = msg;
  toast.classList.remove("show", "err");
  toast.classList.add("show");
  if (!ok) toast.classList.add("err");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { res, data };
}

// ===== состояние сессии =====
let me = null;        // {id, login, role}
let content = null;   // текущий контент сайта

async function boot() {
  const [{ res: meRes, data: meData }, { res: setupRes, data: setupData }] = await Promise.all([
    api("/api/auth/me"),
    api("/api/setup"),
  ]);

  if (meRes.ok && meData.user) {
    me = meData.user;
    enterPanel();
  } else if (setupData && setupData.needsSetup) {
    showGate("setup");
  } else {
    showGate("login");
  }
}

function showGate(mode) {
  $("#gate").hidden = false;
  $("#panel").hidden = true;
  $("#loginForm").hidden = mode !== "login";
  $("#setupForm").hidden = mode !== "setup";
}

async function enterPanel() {
  $("#gate").hidden = true;
  $("#panel").hidden = false;
  $("#meRole").innerHTML = `Вы: <b>${escapeHtml(me.login)}</b> · роль <span class="role-tag">${me.role}</span>`;
  // права на раздел «Пользователи»
  const canUsers = me.role === "owner" || me.role === "admin";
  $('.tab[data-tab="users"]').style.display = canUsers ? "" : "none";
  $("#userAddWrap").hidden = me.role !== "owner";

  await Promise.all([loadContent(), loadDashboard()]);
  if (canUsers) loadUsers();
}

// ===== вход / setup =====
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const login = $("#lLogin").value.trim();
  const password = $("#lPass").value;
  const { res, data } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  if (res.ok) { me = data.user; enterPanel(); }
  else showToast(data?.error || "Не удалось войти", false);
});

$("#setupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const login = $("#sLogin").value.trim();
  const password = $("#sPass").value;
  const { res, data } = await api("/api/setup", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  if (res.ok) { me = data.user; enterPanel(); }
  else showToast(data?.error || "Не удалось создать владельца", false);
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  me = null;
  showGate("login");
});

// ===== вкладки =====
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-pane").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`.tab-pane[data-pane="${tab.dataset.tab}"]`).classList.add("active");
  });
});

// ===== дашборд =====
async function loadDashboard() {
  const [{ data: c }, { data: u }] = await Promise.all([
    api("/api/content"),
    me.role === "owner" || me.role === "admin" ? api("/api/users") : Promise.resolve({ data: null }),
  ]);
  const users = u?.users || [];
  const owners = users.filter((x) => x.role === "owner").length;
  const cards = [
    { k: "Роль", v: me.role, tag: true },
    { k: "Админов всего", v: users.length || "—" },
    { k: "Владельцев", v: `${owners} / 2` },
    { k: "Контент обновлён", v: c?.updatedAt ? fmtDate(c.updatedAt) : "ещё не правили" },
    { k: "Услуг", v: c?.services?.items?.length || 0 },
    { k: "Работ в портфолио", v: c?.portfolio?.items?.length || 0 },
    { k: "FAQ вопросов", v: c?.faq?.items?.length || 0 },
    { k: "Ценовых пакетов", v: c?.pricing?.items?.length || 0 },
  ];
  $("#dashStats").innerHTML = cards
    .map((c) => `<div class="dash-card glass"><span class="dash-k">${escapeHtml(String(c.k))}</span><span class="dash-v">${c.tag ? `<span class="role-tag">${escapeHtml(String(c.v))}</span>` : escapeHtml(String(c.v))}</span></div>`)
    .join("");
  $("#dashHint").textContent =
    me.role === "owner"
      ? "У вас полные права: контент, пользователи и передача владения (максимум 2 владельца)."
      : me.role === "admin"
      ? "Вы можете править контент и управлять админами/редакторами, но не владением."
      : "Вы можете править контент сайта.";
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString("ru-RU"); } catch (_) { return iso; }
}

// ===== контент-редактор =====
async function loadContent() {
  const { data } = await api("/api/content");
  content = JSON.parse(JSON.stringify(data));
  renderEditor();
}

function renderEditor() {
  const root = $("#contentEditor");
  root.innerHTML = "";
  root.appendChild(section("hero", "Герой (заголовок)", (s) => {
    s.text("tag", "Подзаголовок-тег", content.hero.tag, (v) => (content.hero.tag = v));
    s.text("title", "Заголовок", content.hero.title, (v) => (content.hero.title = v));
    s.textarea("lead", "Подводка", content.hero.lead, (v) => (content.hero.lead = v));
    s.list("stats", "Статистика", content.hero.stats, (item) => ({
      count: item.count,
      label: item.label,
    }), (item, row) => {
      row.num("count", "Число", item.count, (v) => (item.count = v));
      row.text("label", "Подпись", item.label, (v) => (item.label = v));
    });
  }));

  root.appendChild(section("services", "Услуги", (s) => {
    s.text("title", "Заголовок", content.services.title, (v) => (content.services.title = v));
    s.text("sub", "Подзаголовок", content.services.sub, (v) => (content.services.sub = v));
    s.cards("items", "Карточки услуг", content.services.items, (item) => item.title, (item, card) => {
      card.text("icon", "Иконка (эмодзи)", item.icon, (v) => (item.icon = v));
      card.text("title", "Заголовок", item.title, (v) => (item.title = v));
      card.textarea("text", "Описание", item.text, (v) => (item.text = v));
      card.strings("points", "Пункты списка", item.points);
    });
  }));

  root.appendChild(section("portfolio", "Портфолио", (s) => {
    s.text("title", "Заголовок", content.portfolio.title, (v) => (content.portfolio.title = v));
    s.text("sub", "Подзаголовок", content.portfolio.sub, (v) => (content.portfolio.sub = v));
    s.cards("items", "Работы", content.portfolio.items, (item) => item.title, (item, card) => {
      card.text("img", "URL фото", item.img, (v) => (item.img = v));
      card.text("alt", "Описание фото (alt)", item.alt, (v) => (item.alt = v));
      card.text("tag", "Тег", item.tag, (v) => (item.tag = v));
      card.text("title", "Заголовок", item.title, (v) => (item.title = v));
      card.textarea("text", "Описание", item.text, (v) => (item.text = v));
    });
  }));

  root.appendChild(section("pricing", "Цены", (s) => {
    s.text("title", "Заголовок", content.pricing.title, (v) => (content.pricing.title = v));
    s.text("sub", "Подзаголовок", content.pricing.sub, (v) => (content.pricing.sub = v));
    s.cards("items", "Пакеты", content.pricing.items, (item) => item.name, (item, card) => {
      card.text("name", "Название", item.name, (v) => (item.name = v));
      card.text("price", "Цена", item.price, (v) => (item.price = v));
      card.text("unit", "Валюта", item.unit, (v) => (item.unit = v));
      card.text("for", "Для кого", item.for, (v) => (item.for = v));
      card.text("old", "Старая цена (зачёркнутая, пусто=нет)", item.old, (v) => (item.old = v));
      card.check("popular", "Популярный (хит)", item.popular, (v) => (item.popular = v));
      card.strings("points", "Что входит", item.points);
    });
  }));

  root.appendChild(section("why", "Почему мы", (s) => {
    s.text("title", "Заголовок", content.why.title, (v) => (content.why.title = v));
    s.cards("items", "Преимущества", content.why.items, (item) => item.title, (item, card) => {
      card.text("icon", "Иконка", item.icon, (v) => (item.icon = v));
      card.text("title", "Заголовок", item.title, (v) => (item.title = v));
      card.textarea("text", "Описание", item.text, (v) => (item.text = v));
    });
  }));

  root.appendChild(section("process", "Как работаем", (s) => {
    s.text("title", "Заголовок", content.process.title, (v) => (content.process.title = v));
    s.cards("items", "Шаги", content.process.items, (item) => `${item.num} ${item.title}`, (item, card) => {
      card.text("num", "Номер", item.num, (v) => (item.num = v));
      card.text("title", "Заголовок", item.title, (v) => (item.title = v));
      card.textarea("text", "Описание", item.text, (v) => (item.text = v));
    });
  }));

  root.appendChild(section("faq", "Вопросы (FAQ)", (s) => {
    s.text("title", "Заголовок", content.faq.title, (v) => (content.faq.title = v));
    s.text("sub", "Подзаголовок", content.faq.sub, (v) => (content.faq.sub = v));
    s.cards("items", "Вопросы", content.faq.items, (item) => item.q, (item, card) => {
      card.text("q", "Вопрос", item.q, (v) => (item.q = v));
      card.textarea("a", "Ответ", item.a, (v) => (item.a = v));
    });
  }));
}

// --- мини-билдер полей редактора ---
function section(key, title, build) {
  const wrap = document.createElement("div");
  wrap.className = "editor-sec glass";
  const h = document.createElement("h3");
  h.textContent = title;
  wrap.appendChild(h);
  const s = makeScope(wrap, key);
  build(s);
  return wrap;
}

function makeScope(wrap, key) {
  const field = (label, input) => {
    const f = document.createElement("div");
    f.className = "field";
    const l = document.createElement("label");
    l.textContent = label;
    f.appendChild(l);
    f.appendChild(input);
    wrap.appendChild(f);
    return input;
  };
  return {
    text(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "text";
      i.value = val ?? "";
      i.addEventListener("input", () => set(i.value));
      return field(label, i);
    },
    textarea(name, label, val, set) {
      const i = document.createElement("textarea");
      i.rows = 3;
      i.value = val ?? "";
      i.addEventListener("input", () => set(i.value));
      return field(label, i);
    },
    check(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = !!val;
      i.addEventListener("change", () => set(i.checked));
      return field(label, i);
    },
    list(name, label, arr, makeItem, buildRow) {
      const box = document.createElement("div");
      box.className = "sub-list";
      const head = document.createElement("div");
      head.className = "sub-head";
      head.innerHTML = `<span>${escapeHtml(label)}</span>`;
      const add = document.createElement("button");
      add.className = "btn btn-ghost tiny";
      add.textContent = "+ добавить";
      add.addEventListener("click", () => {
        arr.push(makeItem({ count: 1, label: "" }));
        renderRows();
      });
      head.appendChild(add);
      box.appendChild(head);
      const rows = document.createElement("div");
      box.appendChild(rows);
      const renderRows = () => {
        rows.innerHTML = "";
        arr.forEach((item, idx) => {
          const row = document.createElement("div");
          row.className = "sub-row";
          const scope = makeRowScope(row, () => arr.splice(idx, 1) && renderRows());
          buildRow(item, scope);
          rows.appendChild(row);
        });
      };
      renderRows();
      wrap.appendChild(box);
    },
    cards(name, label, arr, titleFn, buildCard) {
      const box = document.createElement("div");
      box.className = "sub-cards";
      const head = document.createElement("div");
      head.className = "sub-head";
      head.innerHTML = `<span>${escapeHtml(label)}</span>`;
      const add = document.createElement("button");
      add.className = "btn btn-ghost tiny";
      add.textContent = "+ добавить";
      add.addEventListener("click", () => {
        arr.push({ title: "Новая", text: "", icon: "✨" });
        renderCards();
      });
      head.appendChild(add);
      box.appendChild(head);
      const grid = document.createElement("div");
      box.appendChild(grid);
      const renderCards = () => {
        grid.innerHTML = "";
        arr.forEach((item, idx) => {
          const card = document.createElement("div");
          card.className = "sub-card";
          const title = document.createElement("div");
          title.className = "sub-card-title";
          title.textContent = titleFn(item) || `Карточка ${idx + 1}`;
          card.appendChild(title);
          const scope = makeCardScope(card, () => { arr.splice(idx, 1); renderCards(); });
          buildCard(item, scope);
          grid.appendChild(card);
        });
      };
      renderCards();
      wrap.appendChild(box);
    },
    strings(name, label, arr) {
      const box = document.createElement("div");
      box.className = "sub-list";
      const head = document.createElement("div");
      head.className = "sub-head";
      head.innerHTML = `<span>${escapeHtml(label)}</span>`;
      const add = document.createElement("button");
      add.className = "btn btn-ghost tiny";
      add.textContent = "+ добавить";
      add.addEventListener("click", () => { arr.push(""); renderRows(); });
      head.appendChild(add);
      box.appendChild(head);
      const rows = document.createElement("div");
      box.appendChild(rows);
      const renderRows = () => {
        rows.innerHTML = "";
        arr.forEach((_, idx) => {
          const row = document.createElement("div");
          row.className = "sub-row";
          const i = document.createElement("input");
          i.type = "text";
          i.value = arr[idx];
          i.addEventListener("input", () => (arr[idx] = i.value));
          row.appendChild(i);
          const del = document.createElement("button");
          del.className = "btn btn-ghost tiny danger";
          del.textContent = "✕";
          del.addEventListener("click", () => { arr.splice(idx, 1); renderRows(); });
          row.appendChild(del);
          rows.appendChild(row);
        });
      };
      renderRows();
      wrap.appendChild(box);
    },
  };
}

function makeRowScope(row, onDel) {
  return {
    num(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "number";
      i.value = val ?? 0;
      i.addEventListener("input", () => set(Number(i.value)));
      return rowField(row, label, i, onDel);
    },
    text(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "text";
      i.value = val ?? "";
      i.addEventListener("input", () => set(i.value));
      return rowField(row, label, i, onDel);
    },
  };
}
function makeCardScope(card, onDel) {
  const del = document.createElement("button");
  del.className = "btn btn-ghost tiny danger card-del";
  del.textContent = "удалить карточку";
  del.addEventListener("click", onDel);
  card.appendChild(del);
  return {
    text(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "text";
      i.value = val ?? "";
      i.addEventListener("input", () => set(i.value));
      const f = document.createElement("div");
      f.className = "field";
      const l = document.createElement("label");
      l.textContent = label;
      f.append(l, i);
      card.insertBefore(f, del);
      return i;
    },
    textarea(name, label, val, set) {
      const i = document.createElement("textarea");
      i.rows = 2;
      i.value = val ?? "";
      i.addEventListener("input", () => set(i.value));
      const f = document.createElement("div");
      f.className = "field";
      const l = document.createElement("label");
      l.textContent = label;
      f.append(l, i);
      card.insertBefore(f, del);
      return i;
    },
    check(name, label, val, set) {
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = !!val;
      i.addEventListener("change", () => set(i.checked));
      const f = document.createElement("div");
      f.className = "field";
      const l = document.createElement("label");
      l.textContent = label;
      f.append(l, i);
      card.insertBefore(f, del);
      return i;
    },
    strings(name, label, arr) {
      const box = document.createElement("div");
      box.className = "sub-list";
      const rows = document.createElement("div");
      const renderRows = () => {
        rows.innerHTML = "";
        arr.forEach((_, idx) => {
          const r = document.createElement("div");
          r.className = "sub-row";
          const i = document.createElement("input");
          i.type = "text";
          i.value = arr[idx];
          i.addEventListener("input", () => (arr[idx] = i.value));
          r.appendChild(i);
          const d = document.createElement("button");
          d.className = "btn btn-ghost tiny danger";
          d.textContent = "✕";
          d.addEventListener("click", () => { arr.splice(idx, 1); renderRows(); });
          r.appendChild(d);
          rows.appendChild(r);
        });
      };
      renderRows();
      box.appendChild(rows);
      card.insertBefore(box, del);
    },
  };
}
function rowField(row, label, input, onDel) {
  const f = document.createElement("div");
  f.className = "field";
  const l = document.createElement("label");
  l.textContent = label;
  f.append(l, input);
  // кнопка удаления строки — только если есть onDel
  row.appendChild(f);
  return input;
}

// сохранить / отменить контент
$("#saveContent").addEventListener("click", async () => {
  const { res, data } = await api("/api/content", {
    method: "PUT",
    body: JSON.stringify(content),
  });
  if (res.ok) { showToast("Контент сохранён"); await loadDashboard(); }
  else showToast(data?.error || "Не удалось сохранить", false);
});
$("#reloadContent").addEventListener("click", () => { loadContent(); showToast("Отменено — загружено из сайта"); });

// ===== пользователи =====
async function loadUsers() {
  const { data } = await api("/api/users");
  const wrap = $("#usersTable");
  if (!data || !data.users) { wrap.innerHTML = `<p class="admin-hint">Нет доступа к списку пользователей.</p>`; return; }
  const users = data.users;
  const ownerCount = users.filter((u) => u.role === "owner").length;

  const table = document.createElement("div");
  table.className = "users-table";
  const head = `<div class="ut-row ut-head"><span>Логин</span><span>Роль</span><span>Действия</span></div>`;
  table.innerHTML = head;

  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "ut-row";
    const isSelf = u.id === me.id;
    const isOwner = u.role === "owner";
    const canTouch = me.role === "owner";

    let actions = "";
    if (canTouch && !isSelf) {
      if (!isOwner && u.role === "admin") {
        actions += btn(`make-owner`, "сделать совладельцем", ownerCount < 2);
        actions += btn(`to-editor`, "в редакторы", true);
      } else if (!isOwner && u.role === "editor") {
        actions += btn(`to-admin`, "в админы", true);
      }
      if (!isOwner) actions += btn(`transfer`, "передать владение", ownerCount < 2, "primary");
      actions += btn(`delete`, "удалить", true, "danger");
    } else if (isOwner) {
      actions += `<span class="ut-tag">владелец</span>`;
    } else if (isSelf) {
      actions += `<span class="ut-tag">это вы</span>`;
    }

    row.innerHTML = `<span class="ut-login">${escapeHtml(u.login)}</span><span class="ut-role"><span class="role-tag">${u.role}</span></span><span class="ut-actions">${actions}</span>`;

    row.querySelectorAll("[data-act]").forEach((b) => {
      b.addEventListener("click", () => userAction(b.dataset.act, u.id, u.login));
    });
    table.appendChild(row);
  });

  wrap.innerHTML = "";
  wrap.appendChild(table);
  wrap.insertAdjacentHTML("beforeend", `<p class="admin-hint">Владельцев: ${ownerCount} из 2. Передача владения понижает вас до админа и повышает выбранного.</p>`);
}

function btn(act, label, enabled, cls = "") {
  return `<button class="btn btn-ghost tiny ${cls}" data-act="${act}" ${enabled ? "" : "disabled"}>${label}</button>`;
}

async function userAction(act, id, login) {
  let path, method = "POST", body = null, confirmMsg = null;
  switch (act) {
    case "to-admin": path = `/api/users/${id}`; method = "PUT"; body = { role: "admin" }; break;
    case "to-editor": path = `/api/users/${id}`; method = "PUT"; body = { role: "editor" }; break;
    case "make-owner": path = `/api/users/${id}/make-owner`; confirmMsg = `Сделать ${login} совладельцем?`; break;
    case "transfer": path = `/api/users/${id}/transfer`; confirmMsg = `Передать владение ${login}? Вы станете админом.`; break;
    case "delete": path = `/api/users/${id}`; method = "DELETE"; confirmMsg = `Удалить ${login}?`; break;
  }
  if (confirmMsg && !confirm(confirmMsg)) return;
  const { res, data } = await api(path, { method, body: body ? JSON.stringify(body) : undefined });
  if (res.ok) { showToast("Готово"); await loadUsers(); await loadDashboard(); }
  else showToast(data?.error || "Не удалось выполнить", false);
}

// добавить админа (только owner)
$("#addUserBtn").addEventListener("click", async () => {
  const login = prompt("Логин нового админа/редактора (от 3 символов):");
  if (!login) return;
  const password = prompt("Пароль (от 6 символов):");
  if (!password) return;
  const role = confirm("Сделать админом? (ОК = admin, Отмена = editor)") ? "admin" : "editor";
  const { res, data } = await api("/api/users", {
    method: "POST",
    body: JSON.stringify({ login: login.trim(), password, role }),
  });
  if (res.ok) { showToast("Пользователь создан"); await loadUsers(); await loadDashboard(); }
  else showToast(data?.error || "Не удалось создать", false);
});

// ===== настройки: смена пароля =====
$("#pwForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const oldP = $("#pwOld").value;
  const newP = $("#pwNew").value;
  if (newP.length < 6) { showToast("Пароль минимум 6 символов", false); return; }
  // переиспользуем логин-эндпоинт для проверки старого + users update через отдельный хелпер
  // пока через простой endpoint /api/auth/change-password (если есть)
  const { res, data } = await api("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ old: oldP, new: newP }),
  });
  if (res.ok) { showToast("Пароль обновлён"); $("#pwForm").reset(); }
  else showToast(data?.error || "Не удалось сменить пароль (нужен endpoint)", false);
});

// ===== утилиты =====
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

boot();
