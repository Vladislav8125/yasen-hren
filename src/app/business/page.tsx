import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogoSlider, TeamTimeCalculator } from "./BusinessInteractive";
import { BusinessLeadDialog } from "./BusinessLeadDialog";

export const metadata: Metadata = {
  title: "Для бизнеса — Ясен Хрен",
  description: "Стратегические и командные сессии, деловые игры и развитие руководителей. О серьёзных делах — с юмором.",
};

const tasks = [
  { number: "01", title: "Выбрать направление", text: "Обсудить стратегию и превратить разные взгляды в общие приоритеты." },
  { number: "02", title: "Договориться в команде", text: "Прояснить роли, ожидания и работу на стыках." },
  { number: "03", title: "Развить руководителей", text: "Потренировать решения и разговоры, от которых зависит работа команды." },
];

const problems = [
  { process: "Ставим задачи без общего приоритета", loss: "Команды тратят время на работу, которую потом переделывают." },
  { process: "Передаём проект между отделами без общего правила", loss: "Сроки уходят на уточнения и возвраты." },
  { process: "Каждое решение снова поднимаем к первому лицу", loss: "Руководитель вязнет в оперативке, команда ждёт ответа." },
  { process: "Проводим обучение без практики после него", loss: "Новые подходы остаются в конспекте." },
  { process: "Запускаем изменения, не обсудив роли", loss: "Вопросы и напряжение уходят в личные чаты." },
];

const audiences = [
  { title: "HR и L&D", text: "Развитие руководителей, работа с командой и перенос обучения в практику." },
  { title: "Продуктовые и проектные команды", text: "Общие приоритеты, понятные роли и работа на стыках функций." },
  { title: "Владельцы и топ-менеджмент", text: "Стратегия, согласование решений и меньше ручного управления." },
  { title: "Сотрудники малого бизнеса", text: "Договорённости в небольшой команде, которые можно применять сразу." },
];

const services = [
  {
    id: "strategy", title: "Стратегическая сессия", label: "Фокус", result: "Общие приоритеты и план действий.",
    stages: [
      { title: "Подготовка", text: "Обсуждаем запрос с собственником или руководством, проводим интервью, собираем данные и формулируем вопросы, которые команда должна решить." },
      { title: "Проведение", text: "Сверяем картину бизнеса, обсуждаем варианты и ограничения, выбираем приоритеты и первые инициативы." },
      { title: "Итоги и план действий", text: "Фиксируем решения, ответственных и сроки. Если работа продолжается, проводим встречу по выполнению договорённостей." },
    ],
  },
  {
    id: "team", title: "Командная сессия и тимбилдинг", label: "Взаимодействие", result: "Правила и опыт совместной работы.",
    stages: [
      { title: "Подготовка", text: "Уточняем состав команды, её задачу, актуальные ситуации и комфортные правила участия. Подбираем задания под цель встречи." },
      { title: "Проведение", text: "Участники вместе решают задачи, обсуждают роли, ожидания и способы договариваться в работе." },
      { title: "Итоги и план действий", text: "Собираем конкретные командные договорённости и выбираем, когда проверить, как они работают." },
    ],
  },
  {
    id: "game", title: "Деловая игра под задачу", label: "Практика", result: "Игра для реальных рабочих ситуаций.",
    stages: [
      { title: "Подготовка", text: "Разбираем бизнес-задачу, целевую аудиторию и процесс. Создаём сценарий и тестовый прототип." },
      { title: "Проведение", text: "Проводим пилот и игровые раунды, разбираем решения участников, затем уточняем правила и материалы." },
      { title: "Итоги и сопровождение", text: "Передаём материалы и инструкции ведущему. При серии игр обучаем внутренних ведущих и дорабатываем формат по обратной связи." },
    ],
  },
  {
    id: "coaching", title: "Коучинг первых лиц", label: "Личный запрос", result: "Управленческий шаг, выбранный самим руководителем.",
    stages: [
      { title: "Подготовка", text: "Уточняем личный запрос, контекст и правила конфиденциальности, особенно если программу оплачивает компания." },
      { title: "Проведение", text: "Разбираем решения, ограничения и варианты действий. Между встречами руководитель пробует выбранный подход в работе." },
      { title: "Итоги и сопровождение", text: "Фиксируем личный план и обсуждаем опыт применения на следующих встречах. Содержание разговора остаётся конфиденциальным." },
    ],
  },
  {
    id: "leaders", title: "Развитие руководителей", label: "Навыки", result: "Подходы, отработанные на ситуациях команды.",
    stages: [
      { title: "Подготовка", text: "Определяем задачи группы и реальные ситуации: делегирование, обратная связь, сложные разговоры, принятие решений." },
      { title: "Проведение", text: "Проводим практикумы и моделируем разговоры. Между модулями участники применяют инструменты в своей работе." },
      { title: "Итоги и сопровождение", text: "Передаём материалы и план практики; в продолжительной программе разбираем результаты применения на следующих встречах." },
    ],
  },
  {
    id: "cross-team", title: "Межфункциональная сессия", label: "Стыки", result: "Ясные правила передачи задач и решений.",
    stages: [
      { title: "Подготовка", text: "Собираем примеры с обеих сторон, восстанавливаем путь задачи и приглашаем участников с нужными полномочиями." },
      { title: "Проведение", text: "Находим точки потерь, сверяем ожидания, договариваемся о критериях готовности, владельцах и способе эскалации." },
      { title: "Итоги и план действий", text: "Передаём схему взаимодействия и проверяем новые правила на выбранном проекте; при необходимости корректируем их." },
    ],
  },
];

const team = [
  {
    name: "Дмитрий Брехов", role: "Научный руководитель Академии Хренологии Бытия", image: "/landing/creator-ishty.png",
    text: "Модератор стратегических сессий, фасилитатор и игропрактик. Помогает командам вести честный разговор и находить следующий шаг.",
    fact: "По предоставленной справке: более 120 стратегических сессий в 48 городах России.",
  },
  {
    name: "Елена Калашникова", role: "НЮ-мастера душ — Практик Хренологии Бытия", image: "/landing/creator-babushka.png",
    text: "Ведущая трансформационных форматов. Помогает участникам увидеть разные позиции и превратить разговор в действие.",
    fact: "Более 100 консультаций; часть командных сессий проводила вместе с Дмитрием.",
  },
  {
    name: "Владислав Фемистоклов", role: "Проектный директор и руководитель разработки", image: "/landing/creator-perfectionist.png",
    text: "B2B-стратег и бизнес-трекер. Помогает выбрать фокус, проверить гипотезы и выстроить понятный путь роста.",
    fact: "550 часов частной практики; опыт трекинга в акселераторах и проектных программах.",
  },
];

const cases = [
  { name: "Железнодорожная компания", problem: "Команда перегружена, отдел был на грани распада.", action: "Двухмесячная программа с игровыми заданиями, еженедельной практикой и общими каналами общения.", outcome: "По материалам кейса: поставки в срок нормализовались, команда восстановила рабочую энергию." },
  { name: "Металлургический холдинг", problem: "Бизнес не видел ценности Data Governance.", action: "Программа с HR, IT и владельцами данных; командная игра и тренажёр объяснения сложной темы.", outcome: "По материалам кейса: акционерам представили и продали второй сезон программы." },
  { name: "Федеральная оконная компания", problem: "План продаж не выполнялся, конверсия была низкой.", action: "Брендированная деловая игра, обучение внутреннего ведущего и серия поддерживающих игр.", outcome: "В материалах кейса указан прирост продаж на 30%." },
  { name: "Федеральная страховая компания", problem: "Низкая конверсия и невыполнение плана продаж.", action: "Брендированная игра и еженедельные игровые встречи в течение года.", outcome: "По материалам кейса: отдел стал первым по выручке в компании, прирост выручки превысил 30%." },
  { name: "Игровая зона на «Куб Экспо»", problem: "Нужны новые контакты для будущих сделок.", action: "Серия коротких демонстрационных игр на выставочной площадке.", outcome: "По материалам кейса: 90 розданных визиток и 30 полученных контактов." },
];

const faq = [
  ["Что выбрать: стратегическую сессию, тимбилдинг или обучение?", "Сессию — когда нужно принять решения; тимбилдинг — когда важно наладить взаимодействие; обучение — когда руководителям нужна практика новых действий. Если запрос смешанный, предложим последовательность форматов."],
  ["Подойдёт ли формат серьёзной управленческой команде?", "Да. Содержание строится вокруг её деловых вопросов. Юмор помогает начать разговор, а программа ведёт к конкретным договорённостям."],
  ["Что если участники не любят игровые задания?", "При подготовке уточним ограничения и выберем механику, которая подходит вашей команде. Участие в личных обсуждениях добровольное."],
  ["Нужно ли рассказывать о личном?", "Нет. Можно работать только с профессиональными ситуациями. Участники сами выбирают глубину личного разговора."],
  ["Для какого размера команды подходит программа?", "Для небольшой команды составляем камерный сценарий. В крупной компании начинаем с выбранной группы или подразделения и при необходимости проводим программу по потокам."],
  ["Как проходит подготовка?", "Уточняем задачу и состав участников, при необходимости собираем факты и интервью, затем согласуем сценарий, формат и ожидаемый итог."],
  ["Можно провести встречу онлайн или на выезде?", "Обсудим оба варианта вместе с очным форматом. Площадка и способ участия зависят от задачи и состава группы."],
  ["Что останется после встречи?", "Для деловых сессий — решения, договорённости и план действий. Для обучающих программ — материалы и задания для применения в работе."],
  ["Можно продолжить работу после первой встречи?", "Да. Для серий и длительных программ согласуем последующие встречи, разбор применения и объём сопровождения."],
  ["Как защищается информация компании?", "До работы согласуем, какие материалы собираем и что войдёт в итог. При необходимости оформим соглашение о конфиденциальности."],
] as const;

const sectionLabel = "font-technical text-xs font-bold uppercase tracking-[0.22em] text-red-primary";
const sectionTitle = "mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl";
const panel = "rounded-3xl border border-gold/30 bg-[#fffaf0] shadow-sm";

export default function BusinessPage() {
  return (
    <main className="overflow-hidden bg-[#f3e6ca] text-ink">
      <header className="relative z-20 border-b border-gold/30 bg-[#fff8e9]/95 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/landing" className="font-display text-xl text-red-primary sm:text-2xl">Ясен Хрен <span className="font-technical text-xs uppercase tracking-wide text-bone-dim">· для бизнеса</span></Link>
          <a href="#contact" className="rounded-lg bg-red-primary px-4 py-2.5 font-technical text-xs uppercase tracking-wide text-[#fff8e9] md:hidden">Обсудить</a>
          <nav aria-label="Разделы корпоративного лендинга" className="hidden items-center gap-6 font-technical text-xs uppercase tracking-wide md:flex">
            <a href="#formats" className="hover:text-red-primary">Форматы</a><a href="#team" className="hover:text-red-primary">Команда</a><a href="#cases" className="hover:text-red-primary">Кейсы</a><a href="#calculator" className="hover:text-red-primary">Калькулятор</a><a href="#contact" className="rounded-lg bg-red-primary px-4 py-2.5 text-[#fff8e9] transition hover:bg-red-primary-dark">Обсудить задачу</a>
          </nav>
        </div>
      </header>

      <section className="px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <p className={sectionLabel}>Ясен Хрен · программы для бизнеса</p>
          <h1 className="mt-5 max-w-5xl font-display text-[clamp(2.8rem,6vw,6rem)] leading-[1.05] text-ink">О серьёзных делах — <span className="text-red-primary">с юмором.</span></h1>
          <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-bone sm:text-xl">Рабочие форматы для команд, которым пора договориться о важном и двигаться дальше.</p>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {tasks.map((task) => <article key={task.number} tabIndex={0} className="group rounded-2xl border border-gold/45 bg-[#fffaf0] p-5 shadow-sm outline-none transition duration-300 hover:-translate-y-2 hover:border-red-primary hover:shadow-xl focus-visible:-translate-y-2 focus-visible:border-red-primary focus-visible:ring-2 focus-visible:ring-red-primary motion-reduce:transform-none motion-reduce:transition-none sm:p-6"><span className="font-technical text-xs font-bold text-red-primary">{task.number} / ЗАДАЧА</span><h2 className="mt-4 font-display text-xl leading-tight text-ink transition-colors group-hover:text-red-primary group-focus-visible:text-red-primary sm:text-2xl">{task.title}</h2><p className="mt-3 font-body leading-relaxed text-bone-dim">{task.text}</p></article>)}
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div>
              <p className="font-body text-lg font-bold leading-relaxed text-ink">Для продуктовых и проектных команд, топ-менеджмента и сотрудников малого бизнеса.</p>
              <p className="mt-4 font-body text-lg leading-relaxed text-bone-dim">У каждой команды своя ситуация. Соберём программу вокруг вашей задачи, людей и решения, которое важно принять.</p>
              <a href="#contact" className="mt-7 inline-block rounded-xl bg-red-primary px-7 py-4 font-technical text-xs font-bold uppercase tracking-wider text-[#fff8e9] shadow-lg transition hover:bg-red-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-primary">Обсудить задачу ↗</a>
            </div>
            <figure className="overflow-hidden rounded-3xl border border-gold/40 bg-[#fffaf0] shadow-xl">
              <div className="relative aspect-[16/9]"><Image src="/business/corporate-session-ai.png" alt="Иллюстрация рабочей сессии: ведущая обсуждает задачу с командой, на столе карты и рабочие записи" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /></div>
              <figcaption className="px-4 py-3 font-body text-xs text-bone-dim">Иллюстрация формата, создана ИИ</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="problems" className="bg-[#fff8e9] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl"><p className={sectionLabel}>Узнаваемые ситуации</p><h2 className={sectionTitle}>Всем всё ясно. Но каждый понял своё.</h2><p className="mt-5 max-w-3xl font-body text-lg text-bone-dim">Посмотрите, где привычный процесс превращается в потерю времени и ясности.</p><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{problems.map((item) => <article key={item.process} className={`${panel} p-6`}><p className="font-technical text-xs font-bold uppercase tracking-wide text-red-primary">Как идёт работа</p><h3 className="mt-3 font-display text-xl leading-snug">{item.process}</h3><p className="mt-5 border-t border-gold/30 pt-5 font-technical text-xs font-bold uppercase tracking-wide text-red-primary">Что теряем ↓</p><p className="mt-2 font-body leading-relaxed text-bone-dim">{item.loss}</p></article>)}</div></div>
      </section>

      <section id="audience" className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Для кого</p><h2 className={sectionTitle}>Собираем людей вокруг задачи.</h2><div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{audiences.map((item) => <article key={item.title} className="rounded-2xl border border-gold/40 bg-[#fffaf0] p-6"><h3 className="font-display text-xl leading-tight text-red-primary">{item.title}</h3><p className="mt-4 font-body leading-relaxed text-bone-dim">{item.text}</p></article>)}</div><p className="mt-6 max-w-3xl font-body text-lg text-bone-dim">В большой компании начинаем с конкретной группы или подразделения; в малом бизнесе работаем с теми, кто действительно принимает и выполняет решения.</p></div></section>

      <section className="bg-[#50232b] px-5 py-16 text-[#fff8e9] md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className="font-technical text-xs font-bold uppercase tracking-[0.22em] text-[#e8c574]">Как работаем</p><h2 className="mt-3 font-display text-3xl sm:text-5xl">Заметили. Назвали. Шагнули.</h2><div className="mt-9 grid gap-4 md:grid-cols-3">{[{title:"Заметили",text:"Через карту или вопрос увидели привычную рабочую ситуацию под новым углом."},{title:"Назвали",text:"Сформулировали, где расходятся ожидания и о чём важно договориться."},{title:"Шагнули",text:"Выбрали действие, ответственного и срок, чтобы проверить договорённость в работе."}].map((step,i) => <article key={step.title} className="rounded-2xl border border-[#e8c574]/40 bg-white/10 p-6"><p className="font-technical text-xs text-[#e8c574]">0{i+1}</p><h3 className="mt-3 font-display text-2xl">{step.title}</h3><p className="mt-3 font-body leading-relaxed text-white/80">{step.text}</p></article>)}</div></div></section>

      <section id="formats" className="bg-[#fff8e9] px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Шесть форматов</p><h2 className={sectionTitle}>Под задачу, а не по шаблону.</h2><p className="mt-5 max-w-3xl font-body text-lg text-bone-dim">У каждой программы три этапа: подготовка, работа с участниками и конкретный итог. Откройте формат, чтобы посмотреть план.</p><div className="mt-10 grid gap-5 lg:grid-cols-2">{services.map((service) => <article id={service.id} key={service.id} className={`${panel} scroll-mt-8 p-6 sm:p-8`}><p className="font-technical text-xs font-bold uppercase tracking-wider text-red-primary">{service.label}</p><h3 className="mt-3 font-display text-2xl text-ink sm:text-3xl">{service.title}</h3><p className="mt-3 font-body text-bone-dim">{service.result}</p>{service.id === "cross-team" && <BusinessLeadDialog />}<details className="group mt-6 border-t border-gold/35 pt-5"><summary className="cursor-pointer list-none font-technical text-xs font-bold uppercase tracking-wide text-red-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-primary">Как проходит <span className="float-right text-xl leading-none transition group-open:rotate-45">+</span></summary><ol className="mt-5 space-y-4">{service.stages.map((stage,index) => <li key={stage.title} className="rounded-xl bg-[#f2e3c3]/65 p-4"><p className="font-technical text-xs font-bold uppercase tracking-wide text-red-primary">{index+1}. {stage.title}</p><p className="mt-2 font-body text-sm leading-relaxed text-bone">{stage.text}</p></li>)}</ol></details></article>)}</div></div></section>

      <section id="calculator" className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Быстрая проверка</p><h2 className={sectionTitle}>Посчитаем время, которое уходит в круг.</h2><p className="mb-9 mt-5 max-w-3xl font-body text-lg text-bone-dim">Без сложных отчётов: только ваши оценки и простая арифметика.</p><TeamTimeCalculator /></div></section>

      <section id="team" className="bg-[#fff8e9] px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Команда</p><h2 className={sectionTitle}>С юмором — в разговор. С опытом — в работу.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{team.map((member) => <article key={member.name} className={`${panel} overflow-hidden`}><div className="relative aspect-[4/3] bg-[#ead4a8]"><Image src={member.image} alt={member.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-top" /></div><div className="p-6"><p className="font-technical text-xs uppercase tracking-wide text-red-primary">{member.role}</p><h3 className="mt-3 font-display text-2xl">{member.name}</h3><p className="mt-3 font-body leading-relaxed text-bone">{member.text}</p><p className="mt-4 border-t border-gold/30 pt-4 font-body text-sm leading-relaxed text-bone-dim">{member.fact}</p></div></article>)}</div></div></section>

      <section id="organizations" className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Опыт команды</p><h2 className={sectionTitle}>С кем работала наша команда.</h2><div className="mt-8"><LogoSlider /></div></div></section>

      <section id="cases" className="bg-[#fff8e9] px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-7xl"><p className={sectionLabel}>Кейсы</p><h2 className={sectionTitle}>Что менялось в работе.</h2><p className="mt-4 max-w-3xl font-body text-lg text-bone-dim">Примеры из практики команды. Компании обозначены так, как в предоставленных материалах. Результаты относятся к этим проектам; такой же эффект для новой программы не гарантируется.</p><div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cases.map((item,i) => <article key={item.name} className={`${panel} p-6`}><p className="font-technical text-xs font-bold uppercase tracking-wide text-red-primary">Кейс 0{i+1}</p><h3 className="mt-3 font-display text-xl leading-tight">{item.name}</h3><dl className="mt-5 space-y-4 font-body text-sm leading-relaxed"><div><dt className="font-bold text-ink">Задача</dt><dd className="mt-1 text-bone-dim">{item.problem}</dd></div><div><dt className="font-bold text-ink">Что сделали</dt><dd className="mt-1 text-bone-dim">{item.action}</dd></div><div><dt className="font-bold text-ink">Итог</dt><dd className="mt-1 text-bone-dim">{item.outcome}</dd></div></dl></article>)}</div></div></section>

      <section id="faq" className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-4xl"><p className={sectionLabel}>FAQ</p><h2 className={sectionTitle}>Коротко о важном.</h2><div className="mt-8 divide-y divide-gold/30 overflow-hidden rounded-3xl border border-gold/35 bg-[#fffaf0] px-5 sm:px-8">{faq.map(([question,answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-5 font-display text-lg leading-snug text-ink sm:text-xl"><span>{question}</span><span className="float-right font-technical text-2xl text-red-primary transition group-open:rotate-45">+</span></summary><p className="max-w-3xl pt-3 font-body leading-relaxed text-bone-dim">{answer}</p></details>)}</div></div></section>

      <section id="contact" className="bg-[#50232b] px-5 py-16 text-[#fff8e9] md:px-8 md:py-24"><div className="mx-auto max-w-5xl text-center"><p className="font-technical text-xs uppercase tracking-[0.22em] text-[#e8c574]">Следующий шаг</p><h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">С чем вашей команде пора разобраться?</h2><p className="mx-auto mt-5 max-w-2xl font-body text-lg leading-relaxed text-white/80">Расскажите о ситуации. Предложим программу под вашу задачу, людей и решение, которое важно принять.</p><a href="mailto:kalashhhova@yandex.ru?subject=%D0%9A%D0%BE%D1%80%D0%BF%D0%BE%D1%80%D0%B0%D1%82%D0%B8%D0%B2%D0%BD%D0%B0%D1%8F%20%D0%BF%D1%80%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D0%B0%20%D0%AF%D1%81%D0%B5%D0%BD%20%D0%A5%D1%80%D0%B5%D0%BD" className="mt-8 inline-block rounded-xl bg-[#e8c574] px-8 py-4 font-technical text-xs font-bold uppercase tracking-wider text-[#3f1a20] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Обсудить задачу ↗</a><p className="mt-5 font-body text-sm text-white/70">Или напишите на <a className="underline underline-offset-4" href="mailto:kalashhhova@yandex.ru">kalashhhova@yandex.ru</a></p></div></section>
    </main>
  );
}
