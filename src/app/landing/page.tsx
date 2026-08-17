import Image from "next/image";
import Link from "next/link";
import { AudienceFlipCards, CabinetSlider, FlipPainCards } from "./LandingInteractions";

export const metadata = {
  title: "Ясен Хрен — психологическая гигиена на каждый день",
  description: "Открой карту дня, заметь своё состояние и выбери следующий шаг.",
};

const audience = [
  {
    title: "Психологи и психиатры",
    text: "Для быстрого контакта с пациентом даже в сложных ситуациях. Карта помогает быстрее установить раппорт и найти точку входа в разговор.",
    note: "Пациент может прийти как Бабай, закрыться как Осторожа или пытаться всё контролировать как Главнюк.",
  },
  {
    title: "Помогающие специалисты",
    text: "Для коучей, наставников, фасилитаторов, преподавателей и всех, кто работает с людьми.",
    note: "Сегодня перед вами может быть Лицедей, который привык выглядеть нормально, или Перфекциончик, которому невозможно соответствовать.",
  },
  {
    title: "Корпоративные сотрудники",
    text: "Когда задач много, напряжение растёт, а восстановление постоянно откладывается.",
    note: "Иногда человеком управляет Нудило, который заранее видит только плохое, или Скряга, который экономит даже на собственном отдыхе.",
  },
  {
    title: "Фрилансеры",
    text: "Когда работа не заканчивается никогда, а граница между делом и личной жизнью стирается.",
    note: "Добытчик заставляет работать без остановки, а Хиханки помогают отшучиваться от усталости вместо того, чтобы её заметить.",
  },
  {
    title: "Предприниматели",
    text: "Чтобы замечать, когда ресурс заканчивается, и не принимать важные решения из состояния хронического истощения.",
    note: "Главнюк требует контролировать всё, Бабай рисует катастрофы, а Осторожа не даёт сделать шаг.",
  },
];

void audience;

const plans = [
  {
    name: "Бесплатный",
    price: "0 ₽",
    description: "Для знакомства с системой.",
    features: ["1 карта в день", "Короткое описание карты", "Доступ к глоссарию"],
    href: "/register",
    cta: "Выбрать бесплатный путь",
  },
  {
    name: "Standard",
    price: "590 ₽ / месяц",
    description: "Для регулярной самостоятельной практики.",
    features: ["1 карта в день", "Развёрнутое описание", "Инструкция по работе с картой", "Базовое «Зеркало»"],
    href: "/register",
    cta: "Выбрать Standard",
  },
  {
    name: "Premium",
    price: "3 500 ₽ / месяц",
    description: "Для глубокой работы и наблюдения за динамикой.",
    features: ["2 карты в день", "Выбор сферы жизни для второй карты", "Развёрнутые описания", "Инструкция по работе с картой", "Полное «Зеркало»", "Консультация с основателем раз в месяц"],
    href: "/register",
    cta: "Выбрать Premium",
    featured: true,
  },
];

const creators = [
  {
    name: "Фемистоклов Владислав",
    role: "Руководитель проекта и развития",
    bio: "Отвечает за развитие «Ясен Хрен», язык продукта и путь пользователя от первой карты к устойчивой практике.",
    image: "/landing/creator-perfectionist.png",
    character: "Перфекциончик",
  },
  {
    name: "Дмитрий Брехов",
    role: "Научный руководитель",
    bio: "Автор методологии и соавтор системы. Развивает направление стратегической психологической гигиены и честного языка.",
    image: "/landing/creator-ishty.png",
    character: "Ишьты",
  },
  {
    name: "Елена Калашникова",
    role: "Руководитель направления психологической гигиены",
    bio: "Научный редактор и соавтор методологии. Отвечает за бережность, ясность и практическую применимость материалов.",
    image: "/landing/creator-babushka.png",
    character: "Бабушка Чтобтебя",
  },
  {
    name: "Евгений Геллер",
    role: "Директор игрового практикума",
    bio: "Игропрактик и автор трансформационных игр. Отвечает за игровой опыт, механику и живое взаимодействие с системой.",
    image: "/landing/creator-ohyo.png",
    character: "Охё",
  },
];

const faq = [
  ["Это гадание?", "Нет. Карта не предсказывает будущее и не выносит приговор. Она помогает заметить, какой внутренний персонаж сегодня влияет на твоё состояние."],
  ["Кто такие Перфекциончик, Главнюк и Бабай?", "Это образы и архетипы, через которые проще увидеть свои состояния и реакции. Не диагнозы, а понятный язык для разговора с собой."],
  ["Нужно ли верить в архетипы?", "Нет. Важнее не вера, а честная реакция: откликается карта или нет."],
  ["Это заменяет психолога?", "Нет. «Ясен Хрен» — инструмент саморефлексии и психологической гигиены, а не замена психологу, психотерапевту или врачу."],
  ["Что делать, если карта не про меня?", "Не нужно притягивать смысл. Честное «сегодня это не про меня» — тоже полезное наблюдение."],
  ["Сколько времени занимает практика?", "Обычно достаточно нескольких минут в день. Главное — регулярность, а не количество часов, проведённых в размышлениях."],
];

function SectionLabel(props: { children?: unknown }) {
  void props;
  return null;
}

function FormatIcon({ title }: { title: string }) {
  return <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gold/10 text-gold" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{title === "Веб-приложение" ? <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></> : title === "Telegram-бот" ? <><path d="m21 3-8.4 18-3.1-7.5L2 10.4 21 3Z" /><path d="m9.5 13.5 5-5" /></> : <><path d="M7 4h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5l-4 4v-4H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>}</svg></div>;
}

export default function LandingPage() {
  return (
    <main className="landing-texture relative overflow-hidden text-bone">
      <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-14 bg-[url('/patterns/side-border-realistic.svg')] bg-repeat-y bg-[length:56px_260px] opacity-35 md:block" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 right-0 z-30 hidden w-14 -scale-x-100 bg-[url('/patterns/side-border-realistic.svg')] bg-repeat-y bg-[length:56px_260px] opacity-35 md:block" />

      <section className="relative flex min-h-[min(860px,100vh)] items-center justify-center overflow-hidden px-6 py-28 md:px-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/fon.png')" }} />
        <video className="absolute inset-0 h-full w-full object-cover opacity-85" src="/video/ях.mp4" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-3xl text-center text-parchment">
            <p className="mb-5 font-technical text-xs uppercase tracking-[0.3em] text-gold-bright">АХ Бытия</p>
            <h1 className="font-display text-4xl leading-[1.08] text-white sm:text-6xl md:text-7xl">Ясен хрен, счастье — не цель, а <span className="hero-emphasis">гигиена мыслей и чувств</span></h1>
            <p className="mt-7 max-w-xl font-body text-lg leading-relaxed text-white/85 md:text-xl">Каждый день мы чистим зубы, принимаем душ и надеваем чистую одежду. Но почему-то редко делаем то же самое со своими мыслями, чувствами и внутренним состоянием.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="#tariffs" className="rounded bg-red-primary px-7 py-4 font-technical text-xs uppercase tracking-[0.18em] text-parchment shadow-xl transition hover:bg-red-primary-dark">Выбери свой путь</Link>
            </div>
            <p className="mt-4 font-technical text-xs uppercase tracking-[0.18em] text-gold-bright">2 недели бесплатно!</p>
          </div>
          <p className="mt-5 text-center font-display text-2xl text-white md:text-right">Ясен хрен, всё получится.</p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Всё вроде нормально. Но сил уже нет.</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone-dim">Внешне всё может быть нормально. Но внутри копится напряжение — и начинает влиять на работу, решения и отношения.</p>
          <FlipPainCards />
          <div className="mt-10 grid gap-6 rounded-2xl border border-gold/50 bg-parchment/45 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-9">
            <p className="max-w-2xl font-display text-2xl leading-snug text-parchment-hi">С вами всё в порядке. Просто усталость, напряжение и привычные реакции иногда начинают принимать решения за вас.</p>
            <p className="max-w-xs font-body italic text-bone-dim">Перфекциончик, Главнюк, Бабай или Добытчик — познакомимся?</p>
          </div>
        </div>
      </section>

      <section className="landing-paper-panel px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mx-auto max-w-5xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl"><span className="block">Одна карта. Один честный разговор с собой.</span><span className="block">Один следующий шаг.</span></h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-bone-dim">Карта дня помогает заметить, кто сегодня управляет твоими мыслями, решениями и реакциями.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["ЗАМЕТЬ", "Открой карту дня и поймай момент узнавания."],
              ["НАЗОВИ", "Это может быть Перфекциончик, Главнюк, Добытчик, Бабай или кто-то ещё. Названное состояние уже не управляет тобой так незаметно."],
              ["ШАГНИ", "Выбери одно конкретное действие, которое можно сделать уже сегодня."],
            ].map(([title, text], i) => <article key={title} className="relative rounded-xl border border-void-border bg-void-elevated p-7"><span className="font-technical text-xs text-gold">0{i + 1}</span><h3 className="mt-8 font-display text-2xl text-parchment-hi">{title}</h3><p className="mt-3 leading-relaxed text-bone-dim">{text}</p></article>)}
          </div>
          <p className="mx-auto mt-8 max-w-2xl font-body italic text-bone-dim">Это не гадание, не диагноз и не замена психологу. Это способ перестать спорить с собой вслепую.</p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Весь путь — в одном личном кабинете</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone-dim">Здесь можно встретиться со своим Перфекциончиком, заметить Добытчика и наконец спросить Главнюка: «А можно сегодня без тотального контроля?»</p>
          <CabinetSlider />
        </div>
      </section>

      <section className="landing-dark-panel px-6 py-20 text-parchment md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl"><h2 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">Для тех, кто много держит на себе</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/70">Для тех, кто привык справляться. Даже когда уже давно пора перестать делать вид, что всё нормально.</p><AudienceFlipCards /></div>
      </section>

      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="font-technical text-xs uppercase tracking-[0.22em] text-gold">АХ Бытия</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Кто создаёт «Ясен Хрен»</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-bone-dim">Люди, которые соединили психологическую гигиену, честный язык и игру — и сами стали частью её мира.</p>
          </div>
          <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {creators.map((creator) => (
              <article key={creator.name} className="flex h-full flex-col overflow-hidden rounded-2xl border border-void-border bg-void-elevated shadow-lg">
                <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
                  <Image src={creator.image} alt={`${creator.name} в образе ${creator.character}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover object-top" />
                  <span className="absolute bottom-4 left-4 rounded-full border border-gold/60 bg-stone-dark/90 px-3 py-1 font-technical text-[10px] uppercase tracking-widest text-gold-bright">{creator.character}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl text-parchment-hi">{creator.name}</h3>
                  <p className="mt-2 font-technical text-xs uppercase tracking-wider text-red-primary">{creator.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-bone-dim">{creator.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Выбирай удобный формат</h2>
          <p className="mt-6 max-w-2xl text-lg text-bone-dim">Веб-приложение, Telegram или VK — один путь к большей ясности.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[["Веб-приложение", "Полный личный кабинет: карта дня, «Зеркало», история, ассистент, тарифы и дополнительные материалы."], ["Telegram-бот", "Получай карту дня и общайся с системой прямо в Telegram. Даже если Главнюк снова требует срочно всё контролировать."], ["VK-бот", "Открывай карту дня и взаимодействуй с системой во «ВКонтакте»." ]].map(([title, text]) => <article key={title} className="rounded-xl border border-void-border bg-void-elevated p-7"><FormatIcon title={title} /><h3 className="font-display text-2xl text-parchment-hi">{title}</h3><p className="mt-3 leading-relaxed text-bone-dim">{text}</p></article>)}
          </div>
          <p className="mt-6 font-technical text-xs uppercase tracking-widest text-bone-dim">Доступность отдельных функций зависит от выбранного тарифа.</p>
        </div>
      </section>

      <section className="landing-paper-panel px-6 py-20 md:px-16 md:py-28"><div className="mx-auto max-w-6xl"><SectionLabel>06 / Результат</SectionLabel><h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Что меняется, когда начинаешь замечать себя</h2><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{["Меньше внутреннего шума.", "Больше ясности перед важными решениями.", "Понимание собственных реакций.", "Регулярная забота о психическом состоянии.", "Маленькие действия вместо бесконечного самоанализа."].map((item) => <div key={item} className="border-t-2 border-gold pt-4"><p className="text-lg leading-snug">{item}</p></div>)}</div><div className="mt-12 max-w-3xl rounded-xl bg-void-elevated p-7"><p className="font-display text-2xl leading-snug text-parchment-hi">Не нужно становиться идеальной версией себя. Достаточно вовремя заметить своё состояние и выбрать, как с ним обойтись.</p></div></div></section>

      <section id="tariffs" className="scroll-mt-8 px-6 py-20 md:px-16 md:py-28"><div className="mx-auto max-w-6xl"><SectionLabel>07 / Тарифы</SectionLabel><h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Выбери свой путь</h2><p className="mt-6 max-w-2xl text-lg text-bone-dim">Попробуй систему, посмотри, какие карты и персонажи откликаются, и выбери глубину практики.</p><div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`flex flex-col rounded-2xl border p-7 ${plan.featured ? "border-gold bg-parchment/55 shadow-[0_0_0_2px_rgba(184,137,46,0.25)]" : "border-void-border bg-void-elevated"}`}><div className="flex items-start justify-between gap-3"><h3 className="font-display text-2xl text-parchment-hi">{plan.name}</h3>{plan.featured && <span className="rounded-full bg-gold px-3 py-1 font-technical text-[10px] uppercase tracking-wider text-white">Выбор дня</span>}</div><p className="mt-5 font-display text-4xl text-red-primary">{plan.price}</p><p className="mt-3 text-bone-dim">{plan.description}</p><ul className="mt-7 flex-1 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-2 leading-snug"><span className="text-gold">✦</span><span>{feature}</span></li>)}</ul><Link href={plan.href} className="mt-8 rounded bg-red-primary px-4 py-3 text-center font-technical text-xs uppercase tracking-widest text-parchment transition hover:bg-red-primary-dark">{plan.cta}</Link></article>)}</div><p className="mt-8 text-center font-display text-2xl text-red-primary">2 недели бесплатно!</p><p className="mt-2 text-center text-sm text-bone-dim">Попробуй без обязательств. Если система тебе подходит — продолжишь свой путь дальше.</p></div></section>

      <section className="landing-dark-panel px-6 py-20 text-parchment md:px-16 md:py-28"><div className="mx-auto max-w-4xl"><SectionLabel>08 / Безопасность</SectionLabel><h2 className="mt-3 font-display text-4xl leading-tight md:text-6xl">С юмором — к языку. Серьёзно — к человеку.</h2><div className="mt-8 space-y-5 text-lg leading-relaxed text-parchment/80"><p>За прямым названием «Ясен Хрен» стоит система для внимательного отношения к своему состоянию.</p><p>Карты помогают замечать, называть и исследовать происходящее внутри. Они не ставят диагнозов, не предсказывают будущее и не заменяют медицинскую или психологическую помощь.</p><p>Ясен хрен, иногда нужна не новая карта, а живой человек рядом. Если тяжёлое состояние длится неделями, нарушает сон и повседневную жизнь или связано с угрозой безопасности, обратись к профильному специалисту.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2">{["Архетипический язык", "Саморефлексия", "Внимание к телесным сигналам", "Конкретные действия", "Наблюдение за личной динамикой"].map((item) => <div key={item} className="border-l border-gold px-4 py-2 text-parchment/75">{item}</div>)}</div></div></section>

      <section className="px-6 py-20 md:px-16 md:py-28"><div className="mx-auto max-w-4xl"><SectionLabel>09 / FAQ</SectionLabel><h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-6xl">Вопросы, которые обычно задают</h2><div className="mt-10 divide-y divide-void-border border-y border-void-border">{faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl text-parchment-hi"><span>{question}</span><span className="text-gold transition group-open:rotate-45">＋</span></summary><p className="max-w-3xl pt-4 leading-relaxed text-bone-dim">{answer}</p></details>)}</div></div></section>

      <section className="landing-paper-panel px-6 py-24 text-center md:px-16 md:py-32"><div className="mx-auto max-w-4xl"><SectionLabel>10 / Начало</SectionLabel><h2 className="mt-3 font-display text-4xl leading-tight text-parchment-hi md:text-6xl">Начни с одной карты</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-bone-dim">Возможно, тебе не нужен ещё один совет. Возможно, сначала нужно честно увидеть, кто сейчас у руля.</p><p className="mt-5 font-display text-2xl text-red-primary">Перфекциончик? Добытчик? Главнюк? Бабай? Ясен хрен, разберёмся.</p><div className="mt-9 flex flex-wrap justify-center gap-4"><Link href="#tariffs" className="rounded bg-red-primary px-7 py-4 font-technical text-xs uppercase tracking-[0.18em] text-parchment transition hover:bg-red-primary-dark">Выбери свой путь</Link><Link href="/register" className="rounded border border-red-primary/60 px-7 py-4 font-technical text-xs uppercase tracking-[0.18em] text-red-primary transition hover:bg-red-primary/10">Попробовать бесплатно</Link></div><p className="mt-5 font-technical text-xs uppercase tracking-[0.18em] text-bone-dim">2 недели бесплатно. Регистрация займёт меньше минуты.</p></div></section>

      <footer className="border-t border-void-border bg-void-elevated px-6 py-10 md:px-16"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-start"><div><p className="font-display text-2xl text-parchment-hi">ЯСЕН ХРЕН</p><p className="mt-2 max-w-sm text-bone-dim">Психологическая гигиена для мыслей, чувств и ежедневных решений.</p></div><nav className="grid gap-2 font-technical text-xs uppercase tracking-widest text-bone-dim sm:grid-cols-2"><Link href="#tariffs" className="hover:text-gold">Тарифы</Link><Link href="/partners" className="hover:text-gold">Партнёрам</Link><Link href="/login" className="hover:text-gold">Войти</Link><Link href="/register" className="hover:text-gold">Регистрация</Link><Link href="/policies/privacy" className="hover:text-gold">Конфиденциальность</Link><Link href="/policies/offer" className="hover:text-gold">Публичная оферта</Link></nav></div></footer>
    </main>
  );
}
