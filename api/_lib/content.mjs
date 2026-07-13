import { kv, KEYS } from "./kv.mjs";

// Текущий контент сайта вынесен в JSON. При первом запуске (если KV пуст)
// GET /api/content отдаёт это как базовый набор. Дальше правится из админки.
export const DEFAULT_CONTENT = {
  updatedAt: null,
  hero: {
    tag: "цифровая студия для бизнеса",
    title: "Сайт, который продаёт за вас",
    lead: "Делаем современные сайты и ведём SMM для магазинов и бизнеса. Чтобы вы выглядели дорого, а клиенты приходили сами.",
    stats: [
      { count: 40, label: "сайтов собрано" },
      { count: 12, label: "магазинов в SMM" },
      { count: 48, label: "часа до первого макета" },
    ],
  },
  services: {
    title: "Что мы делаем",
    sub: "Три направления, которые закрывают онлайн-присутствие вашего бизнеса.",
    items: [
      {
        icon: "🌐",
        title: "Сайты под ключ",
        text: "Лендинги, визитки и магазины. Быстрые, адаптивные, с уникальным дизайном под ваш бренд.",
        points: ["Адаптив под телефон и ПК", "Запуск за дни, не недели", "Понятная панель для правок"],
      },
      {
        icon: "📈",
        title: "SMM для бизнеса",
        text: "Ведём соцсети магазина: контент-план, дизайн, реклама и рост живой аудитории.",
        points: ["Контент и оформление", "Рекламные кампании", "Отчёты по росту"],
      },
      {
        icon: "⚡",
        title: "Быстрый старт",
        text: "Первый макет - уже через 48 часов после брифа. Никакой бюрократии, только результат.",
        points: ["Честная фиксированная цена", "Правки до идеала", "Поддержка после запуска"],
      },
    ],
  },
  portfolio: {
    title: "Портфолио",
    sub: "Тестовые и учебные работы студии NOCTIS - концепты, которые мы собрали, чтобы показать почерк.",
    items: [
      { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=70&auto=format&fit=crop", alt: "Магазин одежды", tag: "Лендинг + SMM", title: "Магазин одежды", text: "Адаптивный лендинг и контент-план для нишевого бренда одежды." },
      { img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&q=70&auto=format&fit=crop", alt: "Кофейня", tag: "Сайт-меню + TG-бот", title: "Кофейня", text: "Сайт с меню и Telegram-ботом для заказа кофе с собой." },
      { img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=700&q=70&auto=format&fit=crop", alt: "IT-студия", tag: "Корпоративный сайт", title: "IT-студия", text: "Корпоративный сайт с акцентом на услуги и кейсы команды." },
      { img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=70&auto=format&fit=crop", alt: "Мебельный салон", tag: "Витрина товаров", title: "Мебельный салон", text: "Витрина мебели с фильтрами и карточками товаров." },
      { img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&q=70&auto=format&fit=crop", alt: "Студия красоты", tag: "Запись онлайн", title: "Студия красоты", text: "Лендинг салона с онлайн-записью и галереей работ." },
      { img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=70&auto=format&fit=crop", alt: "Стартап", tag: "Презентация идей", title: "Стартап", text: "Лендинг для презентации стартапа и сбора ранних подписчиков." },
    ],
  },
  pricing: {
    title: "Цены",
    sub: "Прозрачные пакеты в BYN. Точная цена - после брифа, без сюрпризов.",
    items: [
      { name: "Старт", price: "от 50", unit: "BYN", for: "Лендинг или сайт-визитка", popular: false, old: "", points: ["Адаптивная вёрстка", "До 5 блоков", "1 раунд правок", "Заливка на хостинг"] },
      { name: "Бизнес", price: "от 130", unit: "BYN", for: "Лендинг + SMM на месяц", popular: true, old: "232 BYN", points: ["Расширенный дизайн", "До 3 раундов правок", "SMM: контент + реклама", "Панель для правок"] },
      { name: "Премиум", price: "от 300", unit: "BYN", for: "Корпоративный сайт или магазин", popular: false, old: "", points: ["Индивидуальный дизайн", "Приоритетная поддержка", "SMM на 3 месяца", "Интеграции и боты"] },
    ],
  },
  why: {
    title: "Почему мы",
    items: [
      { icon: "💎", title: "Фиксированная цена", text: "Называем сумму до старта - она не растёт по ходу." },
      { icon: "⏱️", title: "Макет за 48 часов", text: "Первый дизайн показываем уже через двое суток после брифа." },
      { icon: "🔁", title: "Правки до идеала", text: "Доводим до тех пор, пока вам не понравится." },
      { icon: "🛡️", title: "Поддержка после запуска", text: "Помогаем с правками и вопросами и после релиза." },
    ],
  },
  process: {
    title: "Как работаем",
    items: [
      { num: "01", title: "Бриф", text: "Обсуждаем цель, бренд и задачи - 15 минут в переписке." },
      { num: "02", title: "Макет", text: "Через 48 часов показываем дизайн и правим под вас." },
      { num: "03", title: "Запуск", text: "Собираем, заливаем на хостинг и настраиваем." },
      { num: "04", title: "Рост", text: "Ведём SMM, следим за результатами, поддерживаем." },
    ],
  },
  faq: {
    title: "Вопросы",
    sub: "Что чаще всего спрашивают до старта.",
    items: [
      { q: "Сколько времени занимает сайт?", a: "Первый макет - через 48 часов после брифа. Готовый лендинг обычно за 3-7 дней, магазин или корпоративный сайт - от 1-2 недель в зависимости от объёма." },
      { q: "Сколько это стоит?", a: "Стартует от 50 BYN за лендинг. Точную цену называем после брифа - она фиксируется и не растёт в процессе. Смотрите раздел «Цены»." },
      { q: "Можно ли править сайт потом?", a: "Да. Даём понятную панель для правок и сопровождаем после запуска. Правки до идеала включены в пакет." },
      { q: "Что нужно, чтобы начать?", a: "Напишите в Telegram - обсудим цель, бренд и задачи за 15 минут. Дальше берём бриф и через 48 часов показываем макет." },
      { q: "Работаете с магазинами и локальным бизнесом?", a: "Да, это наша основная ниша: кофейни, магазины одежды, салоны красоты, мебельные салоны. Делаем и сайт, и ведём их соцсети." },
    ],
  },
};

// --- Защита от XSS в полях контента (defense-in-depth) ---
// Рендер у нас всё равно через textContent, но лишним не будет.
export function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function sStr(v, max = 5000) {
  if (typeof v !== "string") return "";
  return sanitize(v).slice(0, max);
}
function sNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Нормализуем входящий контент из админки: мержим с дефолтом,
// обрезаем/санируем поля, защищаемся от лишних ключей.
export function normalizeContent(input) {
  const d = DEFAULT_CONTENT;
  const out = JSON.parse(JSON.stringify(d));
  if (!input || typeof input !== "object") return out;

  if (input.hero && typeof input.hero === "object") {
    out.hero.tag = sStr(input.hero.tag, 120);
    out.hero.title = sStr(input.hero.title, 200);
    out.hero.lead = sStr(input.hero.lead, 600);
    if (Array.isArray(input.hero.stats)) {
      out.hero.stats = input.hero.stats.slice(0, 6).map((s) => ({
        count: sNum(s?.count),
        label: sStr(s?.label, 120),
      }));
    }
  }
  if (input.services && typeof input.services === "object") {
    out.services.title = sStr(input.services.title, 150);
    out.services.sub = sStr(input.services.sub, 400);
    if (Array.isArray(input.services.items)) {
      out.services.items = input.services.items.slice(0, 12).map((i) => ({
        icon: sStr(i?.icon, 8),
        title: sStr(i?.title, 150),
        text: sStr(i?.text, 500),
        points: Array.isArray(i?.points) ? i.points.slice(0, 8).map((p) => sStr(p, 200)) : [],
      }));
    }
  }
  if (input.portfolio && typeof input.portfolio === "object") {
    out.portfolio.title = sStr(input.portfolio.title, 150);
    out.portfolio.sub = sStr(input.portfolio.sub, 400);
    if (Array.isArray(input.portfolio.items)) {
      out.portfolio.items = input.portfolio.items.slice(0, 24).map((i) => ({
        img: sStr(i?.img, 2000),
        alt: sStr(i?.alt, 150),
        tag: sStr(i?.tag, 120),
        title: sStr(i?.title, 150),
        text: sStr(i?.text, 500),
      }));
    }
  }
  if (input.pricing && typeof input.pricing === "object") {
    out.pricing.title = sStr(input.pricing.title, 150);
    out.pricing.sub = sStr(input.pricing.sub, 400);
    if (Array.isArray(input.pricing.items)) {
      out.pricing.items = input.pricing.items.slice(0, 9).map((i) => ({
        name: sStr(i?.name, 120),
        price: sStr(i?.price, 60),
        unit: sStr(i?.unit, 30),
        for: sStr(i?.for, 200),
        popular: !!i?.popular,
        old: sStr(i?.old, 60),
        points: Array.isArray(i?.points) ? i.points.slice(0, 10).map((p) => sStr(p, 200)) : [],
      }));
    }
  }
  if (input.why && typeof input.why === "object") {
    out.why.title = sStr(input.why.title, 150);
    if (Array.isArray(input.why.items)) {
      out.why.items = input.why.items.slice(0, 8).map((i) => ({
        icon: sStr(i?.icon, 8),
        title: sStr(i?.title, 150),
        text: sStr(i?.text, 400),
      }));
    }
  }
  if (input.process && typeof input.process === "object") {
    out.process.title = sStr(input.process.title, 150);
    if (Array.isArray(input.process.items)) {
      out.process.items = input.process.items.slice(0, 8).map((i) => ({
        num: sStr(i?.num, 8),
        title: sStr(i?.title, 150),
        text: sStr(i?.text, 400),
      }));
    }
  }
  if (input.faq && typeof input.faq === "object") {
    out.faq.title = sStr(input.faq.title, 150);
    out.faq.sub = sStr(input.faq.sub, 400);
    if (Array.isArray(input.faq.items)) {
      out.faq.items = input.faq.items.slice(0, 20).map((i) => ({
        q: sStr(i?.q, 300),
        a: sStr(i?.a, 1500),
      }));
    }
  }
  return out;
}

export async function getContent() {
  const stored = await kv.get(KEYS.content);
  if (!stored) return DEFAULT_CONTENT;
  // мержим с дефолтом, чтобы новые поля не ломали старый контент
  return normalizeContent({ ...DEFAULT_CONTENT, ...stored });
}

export async function saveContent(content) {
  const clean = normalizeContent(content);
  clean.updatedAt = new Date().toISOString();
  await kv.set(KEYS.content, clean);
  return clean;
}
