"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PilgrimCardParticles } from "./PilgrimCardParticles";
import { LivingCards, ParticleBridge } from "./StoryBlocks";
import { ScrollScenes } from "./ScrollScenes";

function clamp(value: number) { return Math.min(1, Math.max(0, value)); }

function useSceneProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = ref.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const next = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
      setProgress((current) => Math.abs(current - next) > .003 ? next : current);
    };
    const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
    return () => { window.removeEventListener("scroll", requestUpdate); window.removeEventListener("resize", requestUpdate); cancelAnimationFrame(frame); };
  }, []);
  return [ref, progress] as const;
}

function Arrow() { return <span aria-hidden="true" className="text-xl leading-none">↗</span>; }

const steps = [
  { number: "01", title: "Заметь", lead: "Открой карту дня.", body: "Не ищи правильный ответ. Поймай первый честный отклик: что именно во мне сейчас отозвалось?" },
  { number: "02", title: "Назови", lead: "Дай состоянию имя.", body: "Перфекциончик, Добытчик, Главнюк, Бабай — названное состояние уже не так незаметно принимает решения за тебя." },
  { number: "03", title: "Шагни", lead: "Выбери действие на сегодня.", body: "Не нужно менять жизнь за вечер. Достаточно одного следующего шага, который вернёт тебя к себе." },
];

const plans = [
  { name: "Бесплатный", price: "0 ₽", note: "Познакомиться", features: ["1 карта в день", "Короткое описание", "Глоссарий"] },
  { name: "Standard", price: "590 ₽", note: "Практиковать регулярно", features: ["Карта каждый день", "Инструкции", "Базовое «Зеркало»"] },
  { name: "Premium", price: "3 500 ₽", note: "Работать глубже", features: ["2 карты в день", "Полное «Зеркало»", "Разбор с основателем"], featured: true },
];

const audiences = [
  { title: "Практикам", note: "Психологам и психиатрам", text: "Карта помогает быстрее найти точку контакта даже в непростой сессии.", image: "/landing/audience-psychologists.png" },
  { title: "Тем, кто помогает", note: "Коучам, наставникам, преподавателям", text: "Чтобы, поддерживая других, не потерять контакт с собой.", image: "/landing/audience-helpers.png" },
  { title: "Тем, кто тянет", note: "Командам и предпринимателям", text: "Чтобы не принимать важные решения из хронической усталости.", image: "/landing/audience-entrepreneurs.png" },
];

const creators = [
  { name: "Фемистоклов Владислав", role: "Руководитель проекта и развития", image: "/landing/creator-perfectionist.png" },
  { name: "Дмитрий Брехов", role: "Научный руководитель", image: "/landing/creator-ishty.png" },
  { name: "Елена Калашникова", role: "Психологическая гигиена", image: "/landing/creator-babushka.png" },
  { name: "Евгений Геллер", role: "Игровой практикум", image: "/landing/creator-ohyo.png" },
];

function Scene({ children, className, sceneRef, progress }: { children: ReactNode; className: string; sceneRef: React.RefObject<HTMLElement | null>; progress: number }) {
  return <section ref={sceneRef} className="story-section"><div className={className} style={{ "--story-progress": progress } as CSSProperties}>{children}</div></section>;
}

export function StoryExperience() {
  const [heroRef, heroProgress] = useSceneProgress();
  const [mechanicsRef, mechanicsProgress] = useSceneProgress();
  const [tariffRef, tariffProgress] = useSceneProgress();
  const activeStep = Math.min(steps.length - 1, Math.floor(mechanicsProgress * steps.length));

  return <main className="story-landing">
    <ScrollScenes />
    <Scene sceneRef={heroRef} progress={heroProgress} className="story-stage story-stage-paper">
      <header className="story-header"><Link href="/landing-new" className="font-display text-2xl tracking-tight">ЯСЕН ХРЕН</Link><nav className="hidden gap-7 font-technical text-[10px] uppercase tracking-[.15em] text-[#756554] md:flex"><a href="#mechanics">Как это работает</a><a href="#tariffs">Тарифы</a></nav><Link href="#tariffs" className="story-cta">Выбери свой путь <Arrow /></Link></header>
      <div className="story-hero-layout"><div className="story-hero-copy"><p className="story-kicker text-[#7a1620]">АХ Бытия · психологическая гигиена</p><h1>Счастье —<br />не цель.<br /><span>Гигиена</span><br />мыслей и чувств.</h1><p className="story-lead">Одна карта в день, чтобы заметить состояние, назвать его честно и выбрать свой следующий шаг.</p><Link href="#tariffs" className="story-cta mt-9">Выбери свой путь <Arrow /></Link></div><div className="story-hero-visual"><video className="story-babushka" src="/video/ях.mp4" autoPlay muted loop playsInline /><div className="story-card-cloud"><PilgrimCardParticles interactive={false} /><div className="story-card-caption"><p className="story-kicker text-[#7a1620]">Карта Путника</p><p>Ясен хрен,<br />всё получится.</p></div></div></div></div>
      <div className="story-scroll-cue"><span>Листайте</span><i /></div>
    </Scene>

    <Scene sceneRef={mechanicsRef} progress={mechanicsProgress} className="story-stage story-stage-ink">
      <div id="mechanics" className="story-mechanics"><div className="story-mechanics-title"><p className="story-kicker text-[#d9ad57]">01 / механика</p><h2>Одна карта.<br />Один разговор.<br /><span>Один шаг.</span></h2></div><div className="story-step-nav">{steps.map((step, index) => <span key={step.number} className={activeStep === index ? "is-active" : ""}>{step.number}</span>)}</div><article className="story-active-step" key={steps[activeStep].number}><p className="story-kicker text-[#d9ad57]">{steps[activeStep].number}</p><h3>{steps[activeStep].title}</h3><p className="story-step-lead">{steps[activeStep].lead}</p><p className="story-step-body">{steps[activeStep].body}</p></article><div className="story-mechanics-rule" aria-hidden="true" /></div>
    </Scene>

    <section data-scroll-scene className="story-content-section story-content-paper"><ParticleBridge dark /><div className="story-content-wrap"><div className="story-section-head"><p className="story-kicker">02 / кто сегодня у руля</p><div><h2>С вами всё<br />в порядке.</h2><p>Просто иногда внутри решения принимает не вы, а уставший персонаж.</p></div></div><LivingCards /><p className="story-small-note">Наведите курсор на карту или нажмите на неё — персонаж оживёт и расскажет, как он обычно действует.</p></div></section>

    <section data-scroll-scene className="story-content-section story-content-ink"><ParticleBridge /><div className="story-content-wrap"><div className="story-section-head"><p className="story-kicker text-[#d9ad57]">03 / личный кабинет</p><div><h2>Встречаться<br />с собой —<br /><span>в одном месте.</span></h2><p>Карта дня, «Зеркало», ассистент и карта Путника — в одном личном пространстве.</p></div></div><div className="story-product-grid"><div className="story-product-phone"><Image src="/landing/screen-mirror.png" alt="Раздел Зеркало" fill sizes="(max-width: 850px) 80vw, 34vw" className="object-cover" /></div><div className="story-product-list"><article><span className="story-kicker text-[#d9ad57]">01</span><h3>Карта дня</h3><p>Одна честная встреча с собой без долгих вступлений.</p></article><article><span className="story-kicker text-[#d9ad57]">02</span><h3>Зеркало</h3><p>История карт помогает увидеть повторяющиеся реакции.</p></article><article><span className="story-kicker text-[#d9ad57]">03</span><h3>Ассистент</h3><p>Помогает разложить сложную ситуацию на слова, чувства и действия.</p></article></div></div></div></section>

    <section data-scroll-scene className="story-content-section story-content-gold"><ParticleBridge dark /><div className="story-content-wrap"><div className="story-section-head"><p className="story-kicker">04 / для кого</p><div><h2>Для тех,<br />кто много<br />держит на себе.</h2><p>Не важно, помогаете вы другим, строите бизнес или просто слишком давно не делали паузу.</p></div></div><div className="story-audience-grid">{audiences.map((audience) => <article key={audience.title} className="story-audience-card"><div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]"><Image src={audience.image} alt={audience.note} fill sizes="(max-width: 700px) 100vw, 33vw" className="object-cover" /></div><p className="story-kicker mt-5 text-[#7a1620]">{audience.note}</p><h3>{audience.title}</h3><p>{audience.text}</p></article>)}</div></div></section>

    <section data-scroll-scene className="story-content-section story-content-paper"><ParticleBridge /><div className="story-content-wrap"><div className="story-formats"><div><p className="story-kicker">05 / форматы</p><h2>Там, где<br />вам удобно.</h2></div><div className="story-format-grid">{[['⌘', 'Веб-приложение', 'Полный путь: история, «Зеркало», ассистент и тарифы.'], ['➤', 'Telegram-бот', 'Карта дня и контакт с системой прямо в мессенджере.'], ['◌', 'VK-бот', 'Практика и карта дня во «ВКонтакте».']].map(([symbol, title, text]) => <article key={title}><span>{symbol}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></div></section>

    <section data-scroll-scene className="story-content-section story-content-ink"><ParticleBridge /><div className="story-content-wrap"><div className="story-section-head"><p className="story-kicker text-[#d9ad57]">06 / что меняется</p><div><h2>Меньше шума.<br /><span>Больше ясности.</span></h2><p>Не нужно становиться идеальной версией себя. Достаточно вовремя заметить состояние и выбрать, как с ним обойтись.</p></div></div><div className="story-outcomes">{["Меньше внутреннего шума.", "Больше ясности перед решениями.", "Понимание собственных реакций.", "Регулярная забота о себе.", "Действия вместо самоанализа."].map((outcome, index) => <p key={outcome}><span>0{index + 1}</span>{outcome}</p>)}</div></div></section>

    <section data-scroll-scene className="story-content-section story-content-paper"><ParticleBridge dark /><div className="story-content-wrap"><div className="story-section-head"><p className="story-kicker">07 / авторы</p><div><h2>Кто создаёт<br />«Ясен Хрен»</h2><p>АХ Бытия соединяет психологическую гигиену, игру и язык, который не притворяется умнее человека.</p></div></div><div className="story-creators-grid">{creators.map((creator) => <article key={creator.name}><div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]"><Image src={creator.image} alt={creator.name} fill sizes="(max-width: 700px) 100vw, 25vw" className="object-cover object-top" /></div><p className="story-kicker mt-5 text-[#7a1620]">{creator.role}</p><h3>{creator.name}</h3></article>)}</div></div></section>

    <section data-scroll-scene className="story-content-section story-content-gold"><ParticleBridge /><div className="story-content-wrap story-safe-grid"><div><p className="story-kicker">08 / важно</p><h2>С юмором —<br />к языку.<br />Серьёзно —<br />к человеку.</h2></div><div><p className="story-safe-lead">Карты помогают замечать и исследовать происходящее внутри. Они не ставят диагнозов, не предсказывают будущее и не заменяют психологическую или медицинскую помощь.</p><div className="story-faq">{[["Это гадание?", "Нет. Карта не предсказывает будущее — она даёт язык для разговора с собой."], ["Это заменяет психолога?", "Нет. Это инструмент саморефлексии и психологической гигиены."], ["Сколько времени занимает практика?", "Обычно достаточно нескольких минут в день."]].map(([question, answer]) => <details key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div></div></div></section>

    <Scene sceneRef={tariffRef} progress={tariffProgress} className="story-stage story-stage-tariffs">
      <div id="tariffs" className="story-tariffs"><div className="story-tariff-intro"><p className="story-kicker text-[#7a1620]">02 / тарифы</p><h2>Выбери<br />свой путь.</h2><p>Начни бесплатно. Если карты становятся полезной привычкой — выбери свою глубину.</p></div><div className="story-plan-rail">{plans.map((plan, index) => { const reveal = clamp(tariffProgress * 1.8 - index * .16); return <article key={plan.name} className={`story-plan ${plan.featured ? "is-featured" : ""}`} style={{ "--card-reveal": reveal } as CSSProperties}><p className="story-kicker">{plan.note}</p><h3>{plan.name}</h3><p className="story-plan-price">{plan.price}<span> / месяц</span></p><ul>{plan.features.map(feature => <li key={feature}>— {feature}</li>)}</ul><Link href="/register" className="story-cta mt-auto w-full justify-center">{plan.name === "Бесплатный" ? "Начать бесплатно" : `Выбрать ${plan.name}`} <Arrow /></Link></article>; })}</div><p className="story-free-note">2 недели бесплатно · без обязательств</p></div>
    </Scene>

    <section data-scroll-scene className="story-final"><ParticleBridge dark /><div><p className="story-kicker text-[#d9ad57]">Начать можно сегодня</p><h2>Не нужно<br />чинить себя.<br /><span>Нужно заметить.</span></h2><p>Ясен хрен, иногда нужна не новая стратегия, а один честный разговор с собой.</p><Link href="#tariffs" className="story-cta mt-9">Выбери свой путь <Arrow /></Link></div></section>

    <footer className="story-footer"><div><p className="font-display text-3xl text-[#fff9ed]">ЯСЕН ХРЕН</p><p>Психологическая гигиена для мыслей и чувств.</p></div><div><Link href="/login">Войти</Link><Link href="/register">Регистрация</Link><Link href="/policies/privacy">Конфиденциальность</Link></div></footer>
  </main>;
}
