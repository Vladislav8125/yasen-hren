"use client";

import Image from "next/image";
import { useState } from "react";

const cabinetSlides = [
  { title: "Карта дня", text: "Каждый день — новый персонаж, состояние или внутренний сюжет.", src: "/cards/perfektsionchik.png", alt: "Карта Перфекциончик" },
  { title: "Зеркало", text: "История карт помогает увидеть повторяющиеся реакции и понять, кто возвращается чаще всего.", src: "/landing/screen-mirror.png", alt: "Экран раздела Зеркало" },
  { title: "Ассистент", text: "Задай вопрос и разберись в ситуации без необходимости часами прокручивать её в голове.", src: "/landing/screen-assistant.png", alt: "Экран раздела Ассистент" },
  { title: "Карта Путника", text: "Посмотри, куда ты движешься и что меняется по дороге.", src: "/cards/dobytchik.png", alt: "Карта Добытчик" },
];

const audienceCards = [
  { title: "Психологи и психиатры", text: "Для быстрого контакта с пациентом даже в сложных ситуациях. Карта помогает быстрее установить раппорт и найти точку входа в разговор.", src: "/landing/audience-psychologists.png", alt: "Психолог с архетипической картой" },
  { title: "Помогающие специалисты", text: "Для коучей, наставников, фасилитаторов, преподавателей и всех, кто работает с людьми.", src: "/landing/audience-helpers.png", alt: "Ведущая групповой практики" },
  { title: "Корпоративные сотрудники", text: "Когда задач много, напряжение растёт, а восстановление постоянно откладывается.", src: "/landing/audience-corporate.png", alt: "Сотрудница делает паузу в работе" },
  { title: "Фрилансеры", text: "Когда работа не заканчивается никогда, а граница между делом и личной жизнью стирается.", src: "/landing/audience-freelancers.png", alt: "Фрилансер в домашней студии" },
  { title: "Предприниматели", text: "Чтобы замечать, когда ресурс заканчивается, и не принимать важные решения из состояния хронического истощения.", src: "/landing/audience-entrepreneurs.png", alt: "Предприниматель перед важным решением" },
];

export function FlipPainCards() {
  const cards = [
    ["Просыпаешься уже уставшим.", "Утро начинается не с планов, а с переговоров с собой: ещё пять минут — и потом точно встану."],
    ["Работаешь много, но не чувствуешь результата.", "Задачи закрываются, письма отправляются, а ощущение, что ты всё ещё стоишь на месте, никуда не уходит."],
    ["Раздражаешься на близких из-за мелочей.", "Человек просто спросил, что купить к ужину, а внутри уже хочется провести совещание по всем нерешённым вопросам жизни."],
    ["Сложно объяснить, что именно с тобой происходит.", "На вопрос «как дела?» автоматически отвечаешь «нормально», хотя внутри давно нужен более честный ответ."],
    ["Даже отдых не возвращает силы.", "Выходной прошёл, сериал закончился, а внутренний Добытчик уже открыл новый список задач."],
  ];
  return <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([front, back], i) => <div key={front} className="flip-card h-72 cursor-pointer" tabIndex={0}><div className="flip-card-inner"><div className="flip-face rounded-xl border border-void-border bg-void-elevated p-5"><span className="pain-icon" aria-hidden="true">{["☼", "⌁", "♡", "◌", "☾"][i]}</span><p className="mt-8 font-body text-lg leading-snug">{front}</p></div><div className="flip-face flip-back rounded-xl border border-gold bg-parchment p-5"><span className="font-technical text-xs uppercase tracking-widest text-gold">Ситуация</span><p className="mt-5 font-body text-sm leading-relaxed text-parchment-hi">{back}</p></div></div></div>)}</div>;
}

export function CabinetSlider() {
  const [active, setActive] = useState(0);
  const slide = cabinetSlides[active];
  return <div className="mt-14 grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr]"><div className="mx-auto w-full max-w-[250px]"><div className="elegant-phone"><div className="phone-speaker" /><div className="phone-screen relative aspect-[9/16]"><Image src={slide.src} alt={slide.alt} fill sizes="250px" className="object-cover" /></div></div></div><div><div className="space-y-3">{cabinetSlides.map((item, i) => <button key={item.title} type="button" onClick={() => setActive(i)} className={`flex w-full items-start gap-4 border-l-2 p-4 text-left transition ${active === i ? "border-gold bg-parchment/50" : "border-void-border hover:border-gold"}`}><span className="font-technical text-xs text-gold">0{i + 1}</span><span><strong className="block font-display text-xl text-parchment-hi">{item.title}</strong><span className="mt-1 block text-bone-dim">{item.text}</span></span></button>)}</div><div className="mt-6 flex gap-2" aria-label="Слайды личного кабинета">{cabinetSlides.map((item, i) => <button key={item.title} type="button" onClick={() => setActive(i)} aria-label={`Слайд ${i + 1}`} className={`h-2 rounded-full transition-all ${active === i ? "w-10 bg-gold" : "w-2 bg-void-border"}`} />)}</div></div></div>;
}

export function AudienceFlipCards() {
  return <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{audienceCards.map((item) => <div key={item.title} className="audience-flip h-[420px] cursor-pointer" tabIndex={0}><div className="audience-flip-inner"><div className="audience-face relative overflow-hidden rounded-2xl border border-void-border bg-parchment p-3"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) 100vw, 20vw" className="object-cover" /><div className="absolute inset-x-3 bottom-3 flex items-end justify-between rounded-lg bg-stone-dark/85 p-3"><p className="font-display text-lg text-gold-bright">{item.title}</p><span aria-hidden="true" className="text-2xl text-gold-bright">☝</span></div></div><div className="audience-face audience-back rounded-2xl border border-gold bg-parchment p-5"><p className="font-display text-xl leading-tight text-parchment-hi">{item.title}</p><p className="mt-5 text-sm leading-relaxed text-bone">{item.text}</p><span className="mt-6 block font-display text-lg text-red-primary">Ясен хрен, разберёмся.</span></div></div></div>)} </div>;
}
