"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const painCards = [
  ["Когда ничего не хочется", "Даже приятные планы не дают энергии, а список дел вызывает только тяжесть."],
  ["Когда всё раздражает", "Люди, сообщения и собственные мысли звучат громче, чем обычно."],
  ["Когда отдыха не хватает", "Выходной закончился, а ощущение, что сил стало больше, так и не появилось."],
  ["Когда трудно выбрать", "Любое решение кажется неправильным — и поэтому проще ничего не решать."],
  ["Когда хочется понять себя", "Не поставить диагноз, а услышать: что со мной происходит прямо сейчас?"],
];

const cabinetSlides = [
  {
    title: "Карта дня",
    text: "Каждый день — новый персонаж, состояние или внутренний сюжет.",
    src: "/cards/perfektsionchik.png",
    alt: "Карта Перфекциончик",
  },
  {
    title: "Зеркало",
    text: "История карт помогает увидеть повторяющиеся реакции и понять, кто возвращается чаще всего.",
    src: "/landing/screen-mirror.png",
    alt: "Экран раздела Зеркало",
  },
  {
    title: "Ассистент",
    text: "Задай вопрос и разберись в ситуации без необходимости часами прокручивать её в голове.",
    src: "/landing/screen-assistant.png",
    alt: "Экран раздела Ассистент",
  },
  {
    title: "Карта Путника",
    text: "Посмотри, куда ты движешься и что меняется по дороге.",
    src: "/cards/dobytchik.png",
    alt: "Карта Добытчик",
  },
];

const audiences = [
  {
    title: "Психологи и психиатры",
    text: "Для быстрого контакта с пациентом даже в сложных ситуациях. Карта помогает быстрее установить раппорт и найти точку входа в разговор.",
    src: "/landing/audience-psychologists.png",
  },
  {
    title: "Помогающие специалисты",
    text: "Для коучей, наставников, фасилитаторов, преподавателей и всех, кто работает с людьми.",
    src: "/landing/audience-helpers.png",
  },
  {
    title: "Корпоративные сотрудники",
    text: "Когда задач много, напряжение растёт, а восстановление постоянно откладывается.",
    src: "/landing/audience-corporate.png",
  },
  {
    title: "Фрилансеры",
    text: "Когда работа не заканчивается никогда, а граница между делом и личной жизнью стирается.",
    src: "/landing/audience-freelancers.png",
  },
  {
    title: "Предприниматели",
    text: "Чтобы замечать, когда ресурс заканчивается, и не принимать важные решения из состояния хронического истощения.",
    src: "/landing/audience-entrepreneurs.png",
  },
];

const team = [
  ["Фемистоклов Владислав", "Автор проекта", "/landing/creator-perfectionist.png"],
  ["Дмитрий Брехов", "Научный руководитель", "/landing/creator-ishty.png"],
  ["Елена Калашникова", "Психологическая гигиена", "/landing/creator-babushka.png"],
  ["Евгений Геллер", "Игровой практикум", "/landing/creator-ohyo.png"],
];

const faq = [
  ["Это гадание?", "Нет. Карта не предсказывает будущее и не выносит приговор. Это способ заметить своё состояние и выбрать следующий шаг."],
  ["Сколько карт в колоде?", "В основной колоде 35 карт и ещё 8 карт Путника."],
  ["Нужно ли верить в архетипы?", "Нет. Достаточно отнестись к карте как к метафоре и честному вопросу к себе."],
  ["Можно ли пользоваться в Telegram и ВКонтакте?", "Да. Выберите формат, который удобнее в конкретный день."],
];

function CabinetSlider() {
  const [active, setActive] = useState(0);
  const slide = cabinetSlides[active];

  return (
    <div className="mt-10 grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="mx-auto w-[min(78vw,300px)]">
        <div className="elegant-phone">
          <span className="phone-speaker" />
          <div className="phone-screen relative aspect-[9/16]">
            <Image src={slide.src} alt={slide.alt} fill sizes="300px" className="object-cover" />
          </div>
        </div>
      </div>
      <div>
        {cabinetSlides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            className={`block w-full border-b px-1 py-5 text-left transition ${index === active ? "border-gold text-parchment-hi" : "border-void-border text-bone-dim hover:text-parchment-hi"}`}
          >
            <span className="font-display text-2xl">{item.title}</span>
            <span className="mt-2 block font-body leading-relaxed">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AudienceFlipCards() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {audiences.map((item) => (
        <article key={item.title} tabIndex={0} className="audience-flip h-[330px] cursor-default rounded-2xl outline-none">
          <div className="audience-flip-inner">
            <div className="audience-face overflow-hidden rounded-2xl border border-void-border bg-void-elevated">
              <div className="relative h-full">
                <Image src={item.src} alt={item.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/80 to-transparent px-5 pb-5 pt-16">
                  <h3 className="font-display text-xl text-parchment-hi">{item.title}</h3>
                  <p className="mt-2 font-technical text-[10px] uppercase tracking-[0.18em] text-gold">Наведи на карточку</p>
                </div>
              </div>
            </div>
            <div className="audience-face audience-back flex rounded-2xl border border-gold/50 bg-red-primary p-5 text-parchment-hi">
              <div className="m-auto">
                <h3 className="font-display text-xl">{item.title}</h3>
                <p className="mt-4 font-body text-sm leading-relaxed text-parchment/90">{item.text}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function OriginalLanding() {
  return (
    <main className="overflow-hidden bg-[#eee0bf] text-parchment-hi">
      <section className="relative isolate overflow-hidden px-5 py-24 md:px-16 md:py-32">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/fon.png')" }} />
        <video className="absolute inset-0 h-full w-full object-cover opacity-85" src="/video/ях.mp4" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-black/45" />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl tracking-wide text-parchment-hi">ЯСЕН ХРЕН</Link>
          <nav className="hidden gap-5 font-technical text-[11px] uppercase tracking-widest text-parchment-hi md:flex">
            <a href="#about" className="hover:text-gold">О проекте</a>
            <a href="#tariffs" className="hover:text-gold">Тарифы</a>
            <Link href="/login" className="rounded border border-parchment/50 px-4 py-2 hover:border-gold">Войти</Link>
          </nav>
        </header>
        <div className="relative z-10 mx-auto max-w-6xl pt-24 md:pt-32">
          <p className="font-technical text-xs uppercase tracking-[0.24em] text-gold">Академия хренологии</p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-tight text-parchment-hi sm:text-5xl md:text-7xl">
            Ясен хрен, счастье — <span className="hero-emphasis">не цель</span>, а гигиена мыслей и чувств
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-parchment/85 md:text-xl">
            Интерактивные карты, чтобы остановиться, услышать себя и сделать следующий шаг без лишней серьёзности.
          </p>
          <a href="#tariffs" className="mt-9 inline-block rounded bg-red-primary px-7 py-3 font-technical text-xs uppercase tracking-widest text-parchment-hi transition hover:bg-red-primary-dark">
            Выбери свой путь
          </a>
        </div>
      </section>

      <section id="about" className="scroll-mt-8 bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Узнаёте себя?</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-parchment-hi md:text-5xl">Всё вроде нормально. Но сил уже нет.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {painCards.map(([title, text], index) => (
              <article key={title} tabIndex={0} className="flip-card h-64 rounded-2xl outline-none">
                <div className="flip-card-inner">
                  <div className="flip-face flex rounded-2xl border border-void-border bg-void-elevated p-5">
                    <div className="m-auto">
                      <span className="font-technical text-xs tracking-widest text-gold">0{index + 1}</span>
                      <h3 className="mt-4 font-display text-2xl text-parchment-hi">{title}</h3>
                    </div>
                  </div>
                  <div className="flip-face flip-back flex rounded-2xl border border-gold/50 bg-red-primary p-5">
                    <p className="m-auto font-body leading-relaxed text-parchment-hi">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Как это работает</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-parchment-hi md:text-5xl">Одна карта. Один честный разговор с собой. Один следующий шаг.</h2>
          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            {[["01", "Заметь", "Карта помогает назвать то, что обычно проходит фоном."], ["02", "Назови", "У состояния появляется понятный образ и человеческий язык."], ["03", "Шагни", "Выбери маленькое действие, которое можно сделать сегодня."]].map(([number, title, text]) => (
              <article key={number} className="rounded-2xl border border-void-border bg-void-elevated p-7">
                <p className="font-technical text-xs tracking-widest text-gold">{number}</p>
                <h3 className="mt-5 font-display text-3xl text-parchment-hi">{title}</h3>
                <p className="mt-3 font-body leading-relaxed text-bone-dim">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Личный кабинет</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">Весь путь — в одном личном кабинете</h2>
          <CabinetSlider />
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Для кого</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">Для тех, кто много держит на себе.</h2>
          <AudienceFlipCards />
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Команда</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">Кто создаёт «Ясен Хрен»</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(([name, role, src]) => (
              <article key={name} className="overflow-hidden rounded-2xl border border-void-border bg-void-elevated">
                <div className="relative aspect-square"><Image src={src} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" /></div>
                <div className="p-5"><h3 className="font-display text-xl text-parchment-hi">{name}</h3><p className="mt-2 font-body text-sm text-bone-dim">{role}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tariffs" className="scroll-mt-8 bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Выбери свой путь</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">Тарифы для разного ритма</h2>
          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            {[["Пробный", "Чтобы познакомиться с картами", "Бесплатно"], ["Стандарт", "Карта дня, зеркало и все форматы", "Основной тариф"], ["Премиум", "Больше сопровождения и возможностей", "Для глубокого пути"]].map(([title, text, note], index) => (
              <article key={title} className={`rounded-2xl border p-7 ${index === 1 ? "border-gold bg-void-elevated" : "border-void-border bg-void-elevated"}`}>
                <p className="font-technical text-xs uppercase tracking-widest text-gold">{note}</p>
                <h3 className="mt-4 font-display text-3xl text-parchment-hi">{title}</h3>
                <p className="mt-3 min-h-12 font-body leading-relaxed text-bone-dim">{text}</p>
                <Link href="/tariffs" className="mt-7 inline-block font-technical text-xs uppercase tracking-widest text-red-primary underline underline-offset-4">Подробнее →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Немного человеческого</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">С юмором — к языку. Серьёзно — к человеку.</h2>
          <p className="mt-5 font-body text-lg leading-relaxed text-bone-dim">Это не замена врачу или психотерапии. Это бережный и честный способ начать разговор с собой.</p>
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Вопросы</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">Коротко о важном</h2>
          <div className="mt-8 divide-y divide-void-border rounded-2xl border border-void-border bg-void-elevated px-6">
            {faq.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none pr-8 font-display text-xl text-parchment-hi"><span>{question}</span><span className="float-right text-gold transition group-open:rotate-45">+</span></summary>
                <p className="pt-3 font-body leading-relaxed text-bone-dim">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-20 text-center md:px-8 md:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-4xl text-parchment-hi md:text-5xl">Начни с одной карты</h2>
          <p className="mt-5 font-body text-lg leading-relaxed text-bone-dim">Пусть она станет маленькой паузой, из которой появляется твой следующий шаг.</p>
          <Link href="/register" className="mt-8 inline-block rounded bg-red-primary px-7 py-3 font-technical text-xs uppercase tracking-widest text-parchment-hi transition hover:bg-red-primary-dark">Получить карту</Link>
        </div>
      </section>
    </main>
  );
}
