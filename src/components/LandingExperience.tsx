"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const paths = [
  { title: "В приложении", text: "Открывайте карту дня, возвращайтесь к описанию и собирайте своё зеркало.", mark: "Веб" },
  { title: "В Telegram", text: "Получайте мягкое напоминание и переходите к своей карте в один клик.", mark: "TG" },
  { title: "Во ВКонтакте", text: "Оставайтесь на связи с картой и уведомлениями в привычном канале.", mark: "VK" },
];

const situations = [
  ["☼", "Просыпаешься уже уставшим", "Утро начинается не с планов, а с переговоров с собой: ещё пять минут, ещё одна попытка собраться."],
  ["⌁", "Работаешь много, но не чувствуешь результата", "Задачи закрываются, письма отправляются, а ощущение движения куда-то исчезает."],
  ["♡", "Раздражаешься на близких из-за мелочей", "Повод маленький, а внутри давно накопилось то, чему не находилось места."],
  ["◌", "Сложно объяснить, что именно с тобой", "На вопрос «как дела?» автоматически отвечаешь «нормально», хотя это уже не так."],
  ["☾", "Даже отдых не возвращает силы", "Выходной прошёл, а внутренний Добытчик уже требует снова собраться и тащить."],
];

const cabinetFeatures = [
  ["01", "Карта дня", "Каждый день — новый персонаж, состояние или внутренний сюжет."],
  ["02", "Зеркало", "История карт помогает увидеть повторяющиеся реакции и понять, кто возвращается чаще всего."],
  ["03", "Ассистент", "Задай вопрос и разберись в ситуации без необходимости часами прокручивать её в голове."],
  ["04", "Карта Путника", "Посмотри, куда ты движешься и что меняется по дороге."],
];

const audiences = [
  ["Психологи и психиатры", "Для быстрого контакта с пациентом даже в сложных ситуациях — как метафорический, а не диагностический инструмент.", "/landing/audience-psychologists.png"],
  ["Помогающие специалисты", "Для коучей, наставников, фасилитаторов и преподавателей — чтобы начать честный разговор без готовых ответов.", "/landing/audience-helpers.png"],
  ["Корпоративные сотрудники и HR", "Когда задач много, напряжение растёт, а разговор о самочувствии нужен команде не меньше, чем новый план.", "/landing/audience-corporate.png"],
  ["Фрилансеры", "Когда работа не заканчивается никогда, а граница между делом и личной жизнью постепенно стирается.", "/landing/audience-freelancers.png"],
  ["Предприниматели", "Чтобы замечать, когда ресурс заканчивается, и не принимать важные решения из состояния «дотяну ещё».", "/landing/audience-entrepreneurs.png"],
];

const team = [
  ["Фемистоклов Владислав", "Проектный директор и руководитель разработки", "/landing/creator-perfectionist.png"],
  ["Дмитрий Брехов", "Научный руководитель Академии хренологии", "/landing/creator-ishty.png"],
  ["Елена Калашникова", "Руководитель направления психологической гигиены", "/landing/creator-babushka.png"],
  ["Евгений Геллер", "Директор игрового практикума", "/landing/creator-ohyo.png"],
];

const faq = [
  ["Это гадание?", "Нет. Карта не предсказывает будущее и не выносит приговор. Это повод заметить своё состояние и выбрать следующий шаг."],
  ["Сколько карт в колоде?", "В основной колоде 35 карт и ещё 8 карт Путника. Карты Путника появляются как отдельный слой пути."],
  ["Нужно ли пользоваться только приложением?", "Нет. После оплаты тарифа доступны все форматы: приложение, Telegram и ВКонтакте. Выберите тот, который удобнее именно вам."],
  ["Как отключить подписку?", "В профиле есть кнопка отключения автопродления. Доступ сохранится до конца оплаченного периода; за 3 дня до следующего списания придёт напоминание."],
];

function DemoCard({
  image,
  name,
  caption,
  revealed,
}: {
  image: string;
  name: string;
  caption: string;
  revealed: boolean;
}) {
  return (
    <article className="w-[min(44vw,220px)] min-w-32">
      <div className="relative aspect-[20/41] overflow-hidden rounded-xl border border-gold/40 bg-parchment shadow-xl">
        {revealed ? (
          <Image src={image} alt={`Карта «${name}»`} fill sizes="(max-width: 640px) 44vw, 220px" className="object-cover" />
        ) : (
          <Image src="/cards/_back.png" alt="Рубашка карты" fill sizes="(max-width: 640px) 44vw, 220px" className="object-cover" />
        )}
      </div>
      <h3 className="mt-3 text-center font-display text-lg text-parchment-hi">{revealed ? name : "Карта ждёт"}</h3>
      {revealed && <p className="mt-1 text-center font-body text-sm leading-relaxed text-bone-dim">{caption}</p>}
    </article>
  );
}

export function LandingExperience() {
  const [revealed, setRevealed] = useState(false);

  return (
    <main className="overflow-hidden">
      <section className="relative flex min-h-[min(760px,100svh)] flex-col text-parchment-hi">
        <video className="absolute inset-0 h-full w-full object-cover" src="/video/ях.mp4" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-[#f9e5bc]/75" />
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link href="/" className="font-display text-xl tracking-wide">ЯСЕН ХРЕН</Link>
          <nav className="hidden items-center gap-5 font-technical text-[11px] uppercase tracking-widest md:flex">
            <a href="#about" className="hover:text-red-primary">О нас</a>
            <a href="#how-it-works" className="hover:text-red-primary">Как работает</a>
            <a href="#faq" className="hover:text-red-primary">Вопросы</a>
            <Link href="/login" className="rounded border border-bone/30 px-4 py-2 hover:border-red-primary">Войти</Link>
          </nav>
        </header>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-end px-5 pb-16 pt-20 md:px-8 md:pb-24">
          <div className="max-w-2xl">
            <p className="font-technical text-xs uppercase tracking-[0.22em] text-red-primary">Бабушка ШтобТебя и Академия хренологии «Ясен Хрен»</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">Когда внутри хрень — пора поговорить с собой честно.</h1>
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-bone/85">Карты архетипов помогают заметить, кто сейчас у руля, назвать это без стыда и сделать один посильный шаг.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-parchment shadow-lg transition hover:bg-red-primary-dark">Начать путь</Link>
              <a href="#about" className="rounded border border-bone/40 bg-parchment/35 px-6 py-3 font-technical text-xs uppercase tracking-widest transition hover:border-red-primary">Подробнее</a>
            </div>
          </div>
          <div className="relative ml-auto hidden aspect-[20/41] w-56 overflow-hidden rounded-xl border border-gold/50 shadow-2xl md:block">
            <Image src="/cards/perfektsionchik.png" alt="Карта Перфекциончик" fill sizes="224px" className="object-cover" priority />
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-6 bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_.9fr] md:items-start">
          <div>
            <p className="font-technical text-xs uppercase tracking-widest text-gold">О программе</p>
            <h2 className="mt-3 font-display text-4xl text-parchment-hi">Академия хренологии — не про «исправить себя».</h2>
            <div className="mt-6 space-y-4 font-body text-lg leading-relaxed text-bone-dim">
              <p>Это программа ежедневной психологической гигиены. Она помогает не спорить с собой до изнеможения, а увидеть состояние, назвать его и вернуть себе выбор.</p>
              <p>Архетипы говорят человеческим языком: иногда смешным, иногда колким, но всегда достаточно точным, чтобы за ним последовал реальный шаг.</p>
            </div>
          </div>
          <aside className="rounded-2xl border border-gold/40 bg-void-elevated p-6 shadow-sm">
            <p className="font-technical text-xs uppercase tracking-widest text-gold">Для чего</p>
            <ul className="mt-5 space-y-4 font-body leading-relaxed text-bone">
              <li>— заметить автоматическую реакцию прежде, чем она управляет днём;</li>
              <li>— дать состоянию имя вместо привычного «со мной что-то не так»;</li>
              <li>— выбрать маленькое действие, которое возвращает опору.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Узнаёте себя?</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Всё вроде нормально. Но сил уже нет.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {situations.map(([symbol, title, text]) => <article key={title} tabIndex={0} className="group min-h-64 rounded-2xl border border-void-border bg-void-elevated p-5 outline-none transition hover:-translate-y-1 hover:border-gold focus:border-gold"><span className="font-display text-3xl text-gold">{symbol}</span><h3 className="mt-5 font-display text-xl text-parchment-hi">{title}</h3><p className="mt-3 font-body text-sm leading-relaxed text-bone-dim">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-6 bg-parchment/45 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Как это работает</p>
          <div className="mt-3 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="font-display text-4xl text-parchment-hi">Две карты. Один честный разговор.</h2>
              <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-bone-dim">Это единственная демонстрация на лендинге: так выглядит выдача карт в приложении. Откройте две карты, прочитайте короткий отклик и решите, хотите ли продолжить путь.</p>
              <button type="button" onClick={() => setRevealed(true)} disabled={revealed} className="mt-7 rounded bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-parchment transition hover:bg-red-primary-dark disabled:cursor-default disabled:bg-bone-dim">
                {revealed ? "Карты открыты" : "Получить две карты"}
              </button>
              {revealed && <Link href="/register" className="mt-4 inline-block font-technical text-xs uppercase tracking-widest text-red-primary underline underline-offset-4">Получить полный разбор в приложении →</Link>}
            </div>
            <div className="flex justify-center gap-4 sm:gap-7">
              <DemoCard image="/cards/babushka-shtobtebya.png" name="Бабушка ШтобТебя" caption="Твоя забота может звучать громко. Где ты сейчас требуешь от себя слишком многого?" revealed={revealed} />
              <DemoCard image="/cards/mat-anahua.png" name="Анахуа" caption="Философский фильтр в народной упаковке: «А нахуа?» — и что в ответ остаётся твоим?" revealed={revealed} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
          <div className="relative mx-auto aspect-[20/41] w-56 overflow-hidden rounded-xl border border-gold/50 shadow-2xl">
            <Image src="/cards/mat-anahua.png" alt="Карта Анахуа" fill sizes="224px" className="object-cover" />
          </div>
          <div>
            <p className="font-technical text-xs uppercase tracking-widest text-gold">Одна из карт</p>
            <h2 className="mt-3 font-display text-4xl text-parchment-hi">Анахуа</h2>
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-bone-dim">Не ответ, а вопрос, который очищает пространство. «А нахуа?» помогает отделить собственное желание от чужого сценария и увидеть, куда уходит энергия.</p>
            <Link href="/register" className="mt-7 inline-block rounded border border-gold px-6 py-3 font-technical text-xs uppercase tracking-widest text-gold transition hover:bg-gold/10">Начать путь</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Личный кабинет</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Весь путь — в одном личном кабинете.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cabinetFeatures.map(([number, title, text]) => <article key={number} className="rounded-2xl border border-void-border bg-void-elevated p-6"><p className="font-technical text-xs tracking-widest text-gold">{number}</p><h3 className="mt-4 font-display text-2xl text-parchment-hi">{title}</h3><p className="mt-3 font-body leading-relaxed text-bone-dim">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Выбери свой путь</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Один тариф — все форматы.</h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-bone-dim">При оплате тарифа доступны приложение, Telegram и ВКонтакте. Выберите удобный способ быть рядом со своей картой.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {paths.map((path) => <Link key={path.title} href="/tariffs" className="group rounded-2xl border border-void-border bg-void-elevated p-6 transition hover:-translate-y-1 hover:border-gold"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-technical text-xs text-gold">{path.mark}</span><h3 className="mt-5 font-display text-2xl text-parchment-hi">{path.title}</h3><p className="mt-2 font-body leading-relaxed text-bone-dim">{path.text}</p><p className="mt-5 font-technical text-xs uppercase tracking-widest text-red-primary">К тарифам →</p></Link>)}
          </div>
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-2xl border border-gold/40 bg-void-elevated p-7">
            <p className="font-technical text-xs uppercase tracking-widest text-gold">Для команд и HR</p>
            <h2 className="mt-3 font-display text-3xl text-parchment-hi">Говорить по делу — не значит говорить сухо.</h2>
            <p className="mt-4 font-body leading-relaxed text-bone-dim">Форматы для команд, HR и руководителей: игра, фасилитация и разговор о том, что обычно прячется за «всё нормально».</p>
            <Link href="/partners" className="mt-6 inline-block rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Обсудить корпоративный формат</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Когда много напряжения', 'Наведи на карточку: увидишь, с чего начать разговор.'], ['Когда нужна общая оптика', 'Карты дают команде язык без диагнозов и обвинений.'], ['Когда пора действовать', 'Фиксируем один реальный шаг, а не красивое обещание.']].map(([title, text]) => <article key={title} className="group min-h-48 rounded-2xl border border-void-border bg-parchment/35 p-5"><h3 className="font-display text-xl text-parchment-hi">{title}</h3><p className="mt-4 font-body leading-relaxed text-bone-dim transition md:opacity-0 md:group-hover:opacity-100">{text}</p><p className="mt-4 font-technical text-xs uppercase tracking-widest text-gold md:group-hover:opacity-0">Наведи на карточку</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Для кого</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Для тех, кто много держит на себе.</h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-bone-dim">Наведите на карточку, чтобы увидеть, в чём может быть польза именно для вашей роли.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map(([title, text, image]) => <article key={title} tabIndex={0} className="group overflow-hidden rounded-2xl border border-void-border bg-void-elevated outline-none transition hover:border-gold focus:border-gold"><div className="relative aspect-[4/3]"><Image src={image} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="min-h-52 p-5"><p className="font-technical text-xs uppercase tracking-widest text-gold">Для вас</p><h3 className="mt-3 font-display text-xl text-parchment-hi">{title}</h3><p className="mt-4 font-body text-sm leading-relaxed text-bone-dim transition md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100">{text}</p><p className="mt-4 font-technical text-xs uppercase tracking-widest text-red-primary md:group-hover:opacity-0 md:group-focus:opacity-0">Наведи на карточку</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="bg-void px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Команда</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Кто создаёт «Ясен Хрен».</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(([name, role, image]) => <article key={name} className="overflow-hidden rounded-2xl border border-void-border bg-void-elevated"><div className="relative aspect-square"><Image src={image} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" /></div><div className="p-6"><h3 className="font-display text-xl text-parchment-hi">{name}</h3><p className="mt-2 font-body text-sm leading-relaxed text-bone-dim">{role}</p></div></article>)}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-6 bg-parchment/45 px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Вопросы</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">Коротко о важном</h2>
          <div className="mt-8 divide-y divide-void-border rounded-2xl border border-void-border bg-void-elevated px-6">
            {faq.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-display text-xl text-parchment-hi"><span>{question}</span><span className="float-right text-gold transition group-open:rotate-45">+</span></summary><p className="pt-3 font-body leading-relaxed text-bone-dim">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bg-[#eee0bf] px-5 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Не обещаем, что станет легко</p>
          <h2 className="mt-3 font-display text-4xl text-parchment-hi">С юмором — к языку. Серьёзно — к человеку.</h2>
          <p className="mt-5 font-body text-lg leading-relaxed text-bone-dim">Карта не заменяет врача или психотерапию. Но она может стать честной точкой входа в разговор с собой.</p>
          <Link href="/register" className="mt-8 inline-block rounded bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-parchment shadow-lg hover:bg-red-primary-dark">Начать с одной карты</Link>
        </div>
      </section>

    </main>
  );
}
