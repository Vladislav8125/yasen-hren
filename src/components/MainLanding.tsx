"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Card = {
  name: string;
  image: string;
  short: string;
  detail: string;
};

const firstCard: Card = {
  name: "Бабушка ШтобТебя",
  image: "/cards/babushka-shtobtebya.png",
  short:
    "Хранительница древней мудрости, терпения и надежды. Безусловная поддержка без оценки и совета — мудрость восстановления.",
  detail:
    "Призывай её при эмоциональном выгорании, после тяжёлого разговора и когда нужна поддержка без условий. Вопрос карты: «Кому ты сейчас нужен просто так — не за результат?»",
};

const secondCard: Card = {
  name: "Анахуа",
  image: "/cards/mat-anahua.png",
  short:
    "Главный фильтр суеты. Помогает отсекать вторичное и оставлять только то, что действительно приносит плоды.",
  detail:
    "Практика карты: сделай глубокий выдох, посмотри на список дел и спроси у каждого пункта: «А нахуа?» Оставь то, что прошло этот фильтр.",
};

const spheres = [
  ["BUSINESS", "Бизнес и работа"],
  ["HEALTH", "Здоровье и ресурс"],
  ["RELATIONS", "Отношения"],
  ["HARMONY", "Баланс и я"],
] as const;

const pains = [
  [
    "☁",
    "Когда ничего не хочется",
    "Даже приятные планы не дают энергии, а список дел вызывает только тяжесть.",
  ],
  [
    "↯",
    "Когда всё раздражает",
    "Люди, сообщения и собственные мысли звучат громче, чем обычно.",
  ],
  [
    "☾",
    "Когда отдыха не хватает",
    "Выходной закончился, а ощущение, что сил стало больше, так и не появилось.",
  ],
  [
    "⌁",
    "Когда трудно выбрать",
    "Любое решение кажется неправильным — и поэтому проще ничего не решать.",
  ],
  [
    "◌",
    "Когда хочется понять себя",
    "Не поставить диагноз, а услышать: что со мной происходит прямо сейчас?",
  ],
];

const cabinetSlides = [
  {
    title: "Карта дня",
    text: "35 карт основной колоды: каждый день — новый персонаж, состояние или внутренний сюжет.",
    src: "/cards/ded-ohyo.png",
    alt: "Карта Дед Охё",
  },
  {
    title: "Твой путь",
    text: "Личный кабинет бережно сохраняет историю открытых карт и ваших откликов. Можно вернуться к любому дню, заметить повторяющиеся сюжеты и увидеть свой путь целиком.",
    src: "/landing/screen-mirror.png",
    alt: "Экран раздела Твой путь",
  },
  {
    title: "Бот «Ясен Хрен Помощник»",
    text: "Задайте вопрос, разберите ситуацию и получите опору, когда не хочется часами прокручивать всё в голове.",
    src: "/landing/screen-assistant.png",
    alt: "Экран бота Ясен Хрен Помощник",
  },
  {
    title: "Карты Путника",
    text: "8 карт, которые помогают определить, по какому пути вы сейчас идёте в своей жизни — и что важно заметить по дороге.",
    src: "/cards/dobytchik.png",
    alt: "Карта Путника Добытчик",
  },
];

const formats = [
  [
    "Веб-приложение",
    "Веб",
    "Открывайте карту дня, возвращайтесь к описанию и собирайте свой путь.",
  ],
  [
    "Telegram",
    "TG",
    "Получайте мягкое напоминание и переходите к своей карте в один клик.",
  ],
  [
    "ВКонтакте",
    "VK",
    "Оставайтесь на связи с картой и уведомлениями в привычном канале.",
  ],
];

const audiences = [
  [
    "Психологи и психиатры",
    "Для быстрого контакта с пациентом даже в сложных ситуациях. Карта помогает найти точку входа в разговор.",
    "/landing/audience-psychologists.png",
  ],
  [
    "Помогающие специалисты",
    "Для коучей, наставников, фасилитаторов и преподавателей, которым нужно живое крепкое словцо для начала работы.",
    "/landing/audience-helpers.png",
  ],
  [
    "Корпоративные сотрудники",
    "Когда задач много, напряжение растёт, а восстановление постоянно откладывается.",
    "/landing/audience-corporate.png",
  ],
  [
    "Фрилансеры",
    "Когда работа не заканчивается никогда, а граница между делом и личной жизнью постепенно стирается.",
    "/landing/audience-freelancers.png",
  ],
  [
    "Предприниматели",
    "Чтобы замечать, когда ресурс заканчивается, и не принимать важные решения из хронического истощения.",
    "/landing/audience-entrepreneurs.png",
  ],
];

const team = [
  {
    name: "Владислав Фемистоклов",
    role: "Проектный директор и руководитель разработки",
    image: "/landing/creator-perfectionist.png",
    credentials: [
      "Маркетолог-стратег: B2B и Data-Driven Growth",
      "Более 7 лет в digital-стратегии и аналитике",
      "Выстраивает процессы, тестирует гипотезы и собирает сильные команды",
      "Переводит хаос в понятную систему роста",
    ],
  },
  {
    name: "Дмитрий Брехов",
    role: "Научный руководитель Академии Хренологии Бытия",
    image: "/landing/creator-ishty.png",
    credentials: [
      "Игропрактик и ведущий трансформационных форматов",
      "Работает с архетипами и честным разговором о важном",
      "Помогает увидеть ситуацию объёмнее, без готовых диагнозов",
      "Соединяет игру, саморефлексию и практику следующего шага",
    ],
  },
  {
    name: "Елена Калашникова",
    role: "НЮ-мастера душ — Практик Хренологии Бытия",
    image: "/landing/creator-babushka.png",
    credentials: [
      "Дипломированный мастер трансформационной игры «4 Грани»",
      "Провела более 100 консультаций",
      "Более 20 лет моделирует жизненные ситуации",
      "Соединяет структуру, коучинг и интуицию",
      "Помогает идти к амбициозным целям без выгорания",
    ],
  },
];

const plans = [
  {
    tariff: "FREE",
    name: "Базовый",
    price: "0 ₽",
    note: "Познакомиться с игрой",
    features: [
      "1 карта в день",
      "Короткое описание карты",
      "35 карт основной колоды и 8 карт Путника",
      "Веб-база знаний и выбранная площадка",
    ],
    action: "Получить карту",
  },
  {
    tariff: "STANDARD",
    name: "Стандарт",
    price: "590 ₽ / месяц",
    note: "Основной тариф",
    features: [
      "1 карта в день с развёрнутым описанием и практикой",
      "Базовый «Мой путь»: история и повторяющиеся архетипы",
      "35 карт основной колоды и 8 карт Путника",
      "Веб-база знаний и выбранная площадка: Telegram, ВКонтакте или MAX",
    ],
    action: "Выбрать Стандарт",
    highlight: true,
  },
  {
    tariff: "PREMIUM",
    name: "Премиум",
    price: "3 500 ₽ / месяц",
    note: "Для глубокого пути",
    features: [
      "2 карты в день и выбор сферы жизни для второй",
      "Полный «Мой путь» и развёрнутые описания",
      "Одна консультация с основателем в месяц включена",
      "35 карт основной колоды и 8 карт Путника",
      "Веб-база знаний и выбранная площадка: Telegram, ВКонтакте или MAX",
    ],
    action: "Выбрать Премиум",
  },
];

const deckPaymentHref = "/deck";

const faq = [
  [
    "Это гадание?",
    "Нет. Карта не предсказывает будущее и не выносит приговор. Это метафорический инструмент для саморефлексии.",
  ],
  [
    "Это заменяет психолога, врача или психотерапию?",
    "Нет. Приложение помогает заметить и назвать состояние, но не заменяет профессиональную помощь, диагностику и лечение.",
  ],
  ["Сколько карт в колоде?", "В основной колоде 35 карт и ещё 8 карт Путника."],
  [
    "Где работает подписка?",
    "На любом тарифе доступны веб-приложение, Telegram-бот и VK-бот. Выбирайте удобный формат.",
  ],
  [
    "Что, если карта «не про меня»?",
    "Не нужно притягивать смысл. Честное «не про меня сегодня» — нормальный результат.",
  ],
  [
    "Как получить вторую карту?",
    "На тарифе «Премиум» можно выбрать сферу жизни и получить вторую карту, чтобы посмотреть на ситуацию с другого ракурса.",
  ],
  [
    "Можно ли использовать приложение с клиентами?",
    "Да, как метафорический инструмент для начала разговора. Решение о применении и профессиональная ответственность остаются у специалиста.",
  ],
  [
    "Как отключить подписку?",
    "Автопродление можно отключить в профиле. Доступ сохранится до конца оплаченного периода; за 3 дня до списания придёт напоминание.",
  ],
];

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gold/50 bg-void-elevated p-5 shadow-2xl md:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-void-border bg-void text-xl text-parchment-hi hover:border-gold"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function MainLanding() {
  const [selectedPlatform, setSelectedPlatform] = useState("TELEGRAM");
  const [firstDrawn, setFirstDrawn] = useState(false);
  const [cardStep, setCardStep] = useState<
    "first" | "sphere" | "second" | "premium" | null
  >(null);
  const [selectedSphere, setSelectedSphere] =
    useState<(typeof spheres)[number][0]>("HARMONY");
  const [cabinetIndex, setCabinetIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [flippedPain, setFlippedPain] = useState<number | null>(null);
  const [flippedAudience, setFlippedAudience] = useState<number | null>(null);
  const landingRef = useRef<HTMLElement>(null);
  const cabinetSlide = cabinetSlides[cabinetIndex];

  useEffect(() => {
    const sections = landingRef.current?.querySelectorAll(
      ":scope > section:not(:first-child)",
    );
    if (!sections) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function startDemo() {
    setFirstDrawn(true);
    window.setTimeout(
      () =>
        document
          .getElementById("get-card")
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      0,
    );
  }

  return (
    <main ref={landingRef} className="landing-shell overflow-hidden">
      <section className="relative isolate flex min-h-[min(780px,100svh)] flex-col overflow-hidden text-[#fff8e6]">
        <video
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl md:hidden"
          src="/video/ях1.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <video
          className="absolute inset-0 h-full w-full object-contain md:object-cover"
          src="/video/ях1.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,15,9,.70)_0%,rgba(29,18,10,.48)_52%,rgba(29,18,10,.26)_100%)]" />
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-5 px-5 py-5 md:px-8">
          <div className="inline-flex items-center gap-3 font-display text-xl tracking-wide">
            <span className="relative h-11 w-11 overflow-hidden rounded-full border border-gold/60 bg-parchment shadow-md">
              <Image
                src="/landing/yasen-hren-logo.jpg"
                alt=""
                fill
                sizes="44px"
                className="object-cover object-[50%_20%]"
              />
            </span>
            <span>ЯСЕН ХРЕН</span>
          </div>
          <Link
            href="/business"
            className="rounded border border-parchment/50 px-3 py-2 font-technical text-[10px] uppercase tracking-wide text-white hover:border-gold md:hidden"
          >
            Для бизнеса
          </Link>
          <nav className="hidden items-center gap-5 font-technical text-[11px] uppercase tracking-widest md:flex">
            <a href="#about">О приложении</a>
            <a href="#tariffs">Тарифы</a>
            <a href="#faq">Вопросы</a>
            <Link href="/business">Для бизнеса</Link>
            <Link
              href="/login"
              className="rounded border border-parchment/50 px-4 py-2 hover:border-gold"
            >
              Войти
            </Link>
          </nav>
        </header>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16 md:px-8">
          <div className="max-w-3xl">
            <p className="font-technical text-xs uppercase tracking-[0.18em] text-gold">
              Академия Хренологии Бытия
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight [text-shadow:0_2px_20px_rgba(0,0,0,.9)] sm:text-5xl md:text-7xl">
              Инструмент саморефлексии на каждый день
            </h1>
            <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-[#fff8e6] [text-shadow:0_2px_16px_rgba(0,0,0,.9)] md:text-xl">
              «Ясен хрен» помогает понять текущее состояние, назвать его своими
              словами и выбрать один шаг на сегодня для его изменения.
            </p>
            <p className="mt-4 max-w-2xl font-body text-lg font-semibold leading-relaxed text-[#fff8e6] [text-shadow:0_2px_16px_rgba(0,0,0,.9)]">
              Ты получишь карту с образом, смыслом и вопросом к себе — без
              предсказаний и «правильных ответов».
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#get-card"
                className="inline-block rounded bg-red-primary px-10 py-5 font-technical text-sm uppercase tracking-[0.16em] text-[#fff8e6] shadow-lg transition hover:bg-red-primary-dark"
              >
                Получить карту дня
              </a>
              <a
                href={deckPaymentHref}
                className="inline-block rounded border border-gold bg-[#fff8e6]/10 px-10 py-5 font-technical text-sm uppercase tracking-[0.16em] text-[#fff8e6] shadow-lg transition hover:bg-gold/20"
              >
                Купить колоду
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="landing-paper scroll-mt-6 px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <p className="font-technical text-xs uppercase tracking-widest text-gold">
              О приложении
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-5xl">
              Понимать себя легче, когда есть крепкое словцо для состояния.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Отношения",
                  "Говорить честнее и слышать друг друга без лишней обороны.",
                ],
                [
                  "Работа",
                  "Действовать без надрыва и замечать, что забирает силы.",
                ],
                [
                  "Здоровье",
                  "Видеть предел раньше, чем тело вынужденно остановит.",
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#8d6d42]/30 bg-[#fffaf0]/70 p-5"
                >
                  <p className="font-display text-xl text-red-primary">
                    {title}
                  </p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-bone-dim">
                    {text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7 max-w-3xl space-y-4 font-body text-lg leading-relaxed text-bone-dim">
              <p>
                «Ясен Хрен» — приложение ежедневной психологической гигиены.
                Карта даёт образ для состояния, «Мой путь» помогает заметить
                повторяющиеся сценарии, а следующий шаг возвращает чувство
                выбора.
              </p>
              <p>
                Под народной оболочкой — архетипическое крепкое словцо,
                системный взгляд, юмор и практика малого действия. Это
                инструмент саморефлексии и просвещения, а не диагностика и не
                замена терапии.
              </p>
            </div>
          </div>
          <aside className="rounded-2xl border border-gold/45 bg-void-elevated p-6 lg:mt-[14.75rem] md:p-7">
            <p className="font-technical text-xs uppercase tracking-widest text-gold">
              Как появилась Академия
            </p>
            <ol className="mt-5 space-y-5 font-body leading-relaxed text-bone">
              <li className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="font-technical text-gold">01</span>
                <span>
                  Больше 20 лет игропрактики, стратегических сессий и клиентской
                  работы.
                </span>
              </li>
              <li className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="font-technical text-gold">02</span>
                <span>
                  На сотнях встреч команда замечала: в момент честного узнавания
                  у человека часто появляется точное, живое слово.
                </span>
              </li>
              <li className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="font-technical text-gold">03</span>
                <span>
                  Из наблюдений выросла картотека архетипов, а затем —
                  приложение и Академия хренологии «Ясен Хрен».
                </span>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="landing-ink px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Узнаёте себя?
          </p>
          <h2 className="mt-3 max-w-4xl font-display text-4xl leading-tight text-parchment-hi md:text-5xl">
            Когда у тебя хреновое состояние — пора поговорить с собой честно.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pains.map(([icon, title, text], index) => (
              <article
                key={title}
                tabIndex={0}
                role="button"
                aria-pressed={flippedPain === index}
                onClick={() =>
                  setFlippedPain(flippedPain === index ? null : index)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlippedPain(flippedPain === index ? null : index);
                  }
                }}
                className={`flip-card h-64 cursor-pointer rounded-2xl outline-none ${flippedPain === index ? "is-flipped" : ""}`}
              >
                <div className="flip-card-inner">
                  <div className="flip-face flex rounded-2xl border border-void-border bg-void-elevated p-5">
                    <div className="m-auto">
                      <p className="font-display text-4xl leading-none text-gold">
                        {icon}
                      </p>
                      <h3 className="mt-5 font-display text-2xl leading-tight text-parchment-hi">
                        {title}
                      </h3>
                    </div>
                  </div>
                  <div className="flip-face flip-back flex rounded-2xl border border-gold/50 bg-red-primary p-5">
                    <p className="m-auto font-body leading-relaxed text-[#fff8e6]">
                      {text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="get-card"
        className="landing-paper scroll-mt-5 px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="font-technical text-xs uppercase tracking-widest text-gold">
              Как использовать карту
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-parchment-hi md:text-5xl">
              Заметь. Назови. Сделай микрошаг.
            </h2>
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-bone-dim">
              Не ищи в карте готовый ответ. Прочитай её и отметь фразу, образ
              или вопрос, который отзывается сильнее всего. Назови себе, что
              происходит сейчас.
            </p>
            <p className="mt-4 max-w-xl font-body text-lg font-semibold leading-relaxed text-bone">
              Затем сделай микрошаг: одно простое действие, разговор, решение
              или паузу, которые можно совершить сегодня. После этого посмотри и
              почувствуй результат: что изменилось в твоём состоянии, внимании
              или ситуации.
            </p>
            <a
              href={deckPaymentHref}
              className="mt-7 inline-block rounded border border-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-red-primary hover:bg-red-primary hover:text-[#fff8e6]"
            >
              Купить колоду
            </a>
            {!firstDrawn && (
              <button
                type="button"
                onClick={startDemo}
                className="mt-7 inline-block rounded bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark"
              >
                Получить первую карту
              </button>
            )}
          </div>
          <div className="grid w-full max-w-[520px] grid-cols-2 items-end gap-4">
            {firstDrawn ? (
              <button
                type="button"
                onClick={() => setCardStep("first")}
                className="group w-full text-center"
              >
                <div className="relative aspect-[20/41] overflow-hidden rounded-xl border border-gold/50 bg-parchment shadow-2xl transition duration-300 group-hover:-translate-y-2">
                  <Image
                    src={firstCard.image}
                    alt={`Карта ${firstCard.name}`}
                    fill
                    sizes="260px"
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="mt-4 block font-display text-xl text-parchment-hi">
                  {firstCard.name}
                </span>
                <span className="mt-2 block font-technical text-xs uppercase tracking-widest text-red-primary">
                  Нажмите, чтобы открыть
                </span>
              </button>
            ) : (
              <div className="relative aspect-[20/41] overflow-hidden rounded-xl border border-gold/40 shadow-xl">
                <Image
                  src="/cards/_back.png"
                  alt="Рубашка карты"
                  fill
                  sizes="260px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center">
              <div className="relative aspect-[20/41] overflow-hidden rounded-xl border border-gold/50 bg-parchment shadow-2xl">
                <Image
                  src={secondCard.image}
                  alt={`Карта ${secondCard.name}`}
                  fill
                  sizes="260px"
                  className="object-cover"
                />
              </div>
              <span className="mt-4 block font-display text-xl text-parchment-hi">
                {secondCard.name}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-paper px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Личный кабинет
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Весь путь — в одном личном кабинете
          </h2>
          <div className="mt-10 grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr]">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group mx-auto w-[min(78vw,300px)] text-left"
              aria-label={`Открыть крупно: ${cabinetSlide.title}`}
            >
              <div className="elegant-phone">
                <span className="phone-speaker" />
                <div className="phone-screen relative aspect-[9/16]">
                  <Image
                    src={cabinetSlide.src}
                    alt={cabinetSlide.alt}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                </div>
              </div>
              <span className="mt-3 block text-center font-technical text-xs uppercase tracking-widest text-red-primary">
                Нажмите, чтобы увеличить
              </span>
            </button>
            <div>
              {cabinetSlides.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setCabinetIndex(index)}
                  className={`block w-full border-b px-1 py-5 text-left transition ${index === cabinetIndex ? "border-gold text-parchment-hi" : "border-void-border text-bone-dim hover:text-parchment-hi"}`}
                >
                  <span className="font-display text-2xl">{item.title}</span>
                  <span className="mt-2 block font-body leading-relaxed">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-paper px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Выбери свой путь
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Один тариф — выбранный бот и веб-база.
          </h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-bone-dim">
            При оплате тарифа доступны веб-приложение, Telegram и ВКонтакте.
            Выберите формат, который удобнее именно сегодня.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {formats.map(([title, mark, text]) => (
              <Link
                key={title}
                href="#tariffs"
                className="rounded-2xl border border-void-border bg-void-elevated p-6 transition hover:-translate-y-1 hover:border-gold"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 font-technical text-xs text-gold">
                  {mark}
                </span>
                <h3 className="mt-5 font-display text-2xl text-parchment-hi">
                  {title}
                </h3>
                <p className="mt-2 font-body leading-relaxed text-bone-dim">
                  {text}
                </p>
                <p className="mt-5 font-technical text-xs uppercase tracking-widest text-red-primary">
                  К тарифам →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-paper px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Для кого
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Для тех, кто много держит на себе.
          </h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-bone-dim">
            Нажмите на карточку, чтобы увидеть, в чём может быть польза именно
            для вашей роли.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map(([title, text, image], index) => (
              <article
                key={title}
                tabIndex={0}
                role="button"
                aria-pressed={flippedAudience === index}
                onClick={() =>
                  setFlippedAudience(flippedAudience === index ? null : index)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFlippedAudience(
                      flippedAudience === index ? null : index,
                    );
                  }
                }}
                className={`audience-flip min-w-0 h-[350px] cursor-pointer rounded-2xl outline-none ${flippedAudience === index ? "is-flipped" : ""}`}
              >
                <div className="audience-flip-inner">
                  <div className="audience-face overflow-hidden rounded-2xl border border-void-border bg-void-elevated">
                    <div className="relative h-full">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/85 to-transparent px-5 pb-5 pt-20">
                        <h3 className="break-words font-display text-[clamp(1rem,1.25vw,1.25rem)] leading-tight text-parchment-hi">
                          {title}
                        </h3>
                        <p className="mt-2 font-technical text-[10px] uppercase tracking-[0.16em] text-gold">
                          Нажми на карточку
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="audience-face audience-back flex rounded-2xl border border-gold/50 bg-red-primary p-5">
                    <div className="m-auto min-w-0">
                      <h3 className="break-words font-display text-lg leading-tight text-[#fff8e6]">
                        {title}
                      </h3>
                      <p className="mt-4 font-body text-sm leading-relaxed text-[#fff8e6]">
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-paper px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Команда
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Кто создаёт «Ясен Хрен».
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <article
                key={member.name}
                className="overflow-hidden rounded-2xl border border-void-border bg-void-elevated"
              >
                <div className="relative aspect-[4/5] bg-parchment">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl text-parchment-hi">
                    {member.name}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-gold">
                    {member.role}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-void-border pt-4">
                    {member.credentials.map((credential) => (
                      <li
                        key={credential}
                        className="font-body text-sm leading-relaxed text-bone-dim before:mr-2 before:text-gold before:content-['•']"
                      >
                        {credential}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="tariffs"
        className="landing-paper scroll-mt-6 px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Тарифы
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Выберите глубину, которая нужна сейчас.
          </h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-bone-dim">
            На платных тарифах выберите площадку для бота — Telegram, ВКонтакте
            или MAX. Веб-база знаний доступна по подписке.
          </p>
          <label className="mt-6 block max-w-sm font-body text-sm text-bone">
            Где получать карту
            <select
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gold/50 bg-[#fffaf0] px-4 py-3 text-ink focus:outline-2 focus:outline-red-primary"
            >
              <option value="TELEGRAM">Telegram</option>
              <option value="VK">ВКонтакте</option>
              <option value="MAX">MAX</option>
            </select>
          </label>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`landing-plan flex min-h-full flex-col ${plan.highlight ? "landing-plan-featured" : ""}`}
              >
                <p className="font-technical text-xs uppercase tracking-widest">
                  {plan.note}
                </p>
                <h3 className="mt-4 font-display text-4xl">{plan.name}</h3>
                <p className="mt-3 font-display text-3xl">{plan.price}</p>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="font-body text-sm leading-relaxed before:mr-2 before:content-['—']"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/tariffs?select=${plan.tariff}&channel=${selectedPlatform}`}
                  className="story-cta mt-auto pt-8"
                >
                  <span>{plan.action}</span>
                  <span aria-hidden="true" className="text-xl leading-none">
                    ↗
                  </span>
                </Link>
              </article>
            ))}
          </div>
          <article className="landing-plan mt-5 flex flex-col border-gold/60 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div>
              <p className="font-technical text-xs uppercase tracking-widest text-gold">
                Физический формат
              </p>
              <h3 className="mt-3 font-display text-3xl text-parchment-hi">
                Колода «Ясен Хрен»
              </h3>
              <p className="mt-2 max-w-2xl font-body leading-relaxed text-bone-dim">
              Полная колода для самостоятельной практики, разговоров и
              ежедневного микрошагa. Глянец — 9 000 ₽, софт-тач — 10 500 ₽.
              </p>
            </div>
            <a
              href={deckPaymentHref}
              className="mt-6 inline-flex shrink-0 items-center justify-center rounded bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark lg:mt-0"
            >
              Купить колоду
            </a>
          </article>
        </div>
      </section>

      <section
        id="faq"
        className="landing-ink scroll-mt-6 px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-4xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            Коротко о важном
          </h2>
          <div className="mt-8 divide-y divide-void-border rounded-2xl border border-void-border bg-void-elevated px-6">
            {faq.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none pr-8 font-display text-xl text-parchment-hi">
                  <span>{question}</span>
                  <span className="float-right text-gold transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 font-body leading-relaxed text-bone-dim">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-paper px-5 py-20 text-center md:px-8 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">
            Немного человеческого
          </p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
            С юмором — к крепкому словцу.
            <br />
            Серьёзно — к человеку.
          </h2>
          <p className="mt-5 font-body text-lg leading-relaxed text-bone-dim">
            Не нужно срочно становиться лучшей версией себя. Иногда достаточно
            честно заметить: «Ну вот, теперь хотя бы ясен хрен, что со мной
            происходит».
          </p>
          <Link
            href="/tariffs"
            className="mt-8 inline-block rounded bg-red-primary px-7 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark"
          >
            Получить карту
          </Link>
        </div>
      </section>

      {cardStep && (
        <Modal onClose={() => setCardStep(null)}>
          {cardStep === "first" && (
            <div className="text-center">
              <div className="relative mx-auto aspect-[20/41] w-[min(58vw,240px)] overflow-hidden rounded-xl shadow-xl">
                <Image
                  src={firstCard.image}
                  alt={firstCard.name}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <p className="mt-5 font-technical text-xs uppercase tracking-widest text-gold">
                Первая карта
              </p>
              <h2 className="mt-2 font-display text-3xl text-parchment-hi">
                {firstCard.name}
              </h2>
              <p className="mt-4 text-left font-body leading-relaxed text-bone-dim">
                {firstCard.short}
              </p>
              <p className="mt-3 text-left font-body leading-relaxed text-bone">
                {firstCard.detail}
              </p>
              <button
                type="button"
                onClick={() => setCardStep("premium")}
                className="mt-6 w-full rounded bg-red-primary py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark"
              >
                Получить вторую карту
              </button>
            </div>
          )}
          {cardStep === "premium" && (
            <div className="text-center">
              <p className="font-technical text-xs uppercase tracking-widest text-gold">Вторая карта</p>
              <h2 className="mt-2 font-display text-3xl text-parchment-hi">Доступна на тарифе «Премиум»</h2>
              <p className="mt-3 font-body leading-relaxed text-bone-dim">Выберите сферу жизни для второй карты, получайте развёрнутые разборы и консультацию с основателем раз в месяц.</p>
              <Link href={`/tariffs?select=PREMIUM&channel=${selectedPlatform}`} className="mt-6 inline-flex w-full items-center justify-center rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark">Выбрать тариф «Премиум» · 3 500 ₽/мес</Link>
            </div>
          )}
          {cardStep === "sphere" && (
            <div>
              <p className="font-technical text-xs uppercase tracking-widest text-gold">
                Вторая карта
              </p>
              <h2 className="mt-2 font-display text-3xl text-parchment-hi">
                Выберите сферу жизни
              </h2>
              <p className="mt-3 font-body leading-relaxed text-bone-dim">
                Карта покажет ещё один ракурс вашей ситуации.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {spheres.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedSphere(value)}
                    className={`rounded-xl border p-4 text-left font-body transition ${selectedSphere === value ? "border-gold bg-gold/10 text-parchment-hi" : "border-void-border text-bone-dim hover:border-gold/60"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCardStep("second")}
                className="mt-6 w-full rounded bg-red-primary py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark"
              >
                Открыть вторую карту
              </button>
            </div>
          )}
          {cardStep === "second" && (
            <div className="text-center">
              <div className="relative mx-auto aspect-[20/41] w-[min(58vw,240px)] overflow-hidden rounded-xl shadow-xl">
                <Image
                  src={secondCard.image}
                  alt={secondCard.name}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <p className="mt-5 font-technical text-xs uppercase tracking-widest text-gold">
                Вторая карта
              </p>
              <h2 className="mt-2 font-display text-3xl text-parchment-hi">
                {secondCard.name}
              </h2>
              <p className="mt-4 text-left font-body leading-relaxed text-bone-dim">
                {secondCard.short}
              </p>
              <p className="mt-3 text-left font-body leading-relaxed text-bone">
                {secondCard.detail}
              </p>
              <div className="mt-6 rounded-xl border border-gold/40 bg-gold/5 p-4 text-left">
                <p className="font-body text-sm leading-relaxed text-bone">
                  Зарегистрируйтесь, чтобы получить доступ к базе знаний. Или
                  получайте карту дня прямо в Telegram-боте.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6] hover:bg-red-primary-dark"
                  >
                    Зарегистрироваться
                  </Link>
                  <a
                    href="https://t.me/yasenhren_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded border border-gold px-5 py-3 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10"
                  >
                    Получить карту
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {previewOpen && (
        <Modal onClose={() => setPreviewOpen(false)}>
          <p className="pr-10 font-technical text-xs uppercase tracking-widest text-gold">
            Личный кабинет
          </p>
          <h2 className="mt-2 font-display text-3xl text-parchment-hi">
            {cabinetSlide.title}
          </h2>
          <div className="relative mt-5 aspect-[9/16] w-full overflow-hidden rounded-xl bg-void">
            <Image
              src={cabinetSlide.src}
              alt={cabinetSlide.alt}
              fill
              sizes="(max-width: 640px) 90vw, 540px"
              className="object-contain"
            />
          </div>
        </Modal>
      )}
    </main>
  );
}
