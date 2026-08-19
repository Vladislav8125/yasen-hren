"use client";

import Image from "next/image";
import { useState } from "react";

const slides = [
  { title: "Карта дня", label: "01", text: "Один образ, который помогает назвать состояние без долгих объяснений.", src: "/cards/perfektsionchik.png", alt: "Карта Перфекциончик" },
  { title: "Зеркало", label: "02", text: "История карт показывает повторяющиеся реакции — без оценок и морализаторства.", src: "/landing/screen-mirror.png", alt: "Экран Зеркало" },
  { title: "Ассистент", label: "03", text: "Помогает разложить сложную ситуацию на слова, чувства и следующий шаг.", src: "/landing/screen-assistant.png", alt: "Экран Ассистент" },
];

export function NewCabinetShowcase() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <div className="new-showcase-grid mt-12">
      <div className="new-phone-shell mx-auto w-full max-w-[310px]">
        <div className="new-phone-notch" />
        <div className="new-phone-screen relative aspect-[9/16]">
          <Image src={slide.src} alt={slide.alt} fill sizes="310px" className="object-cover" priority={active === 0} />
        </div>
      </div>
      <div className="flex flex-col justify-center">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            className={`new-showcase-item ${active === index ? "is-active" : ""}`}
          >
            <span className="new-kicker">{item.label}</span>
            <span className="font-display text-3xl leading-none sm:text-4xl">{item.title}</span>
            <span className="mt-3 block max-w-md font-body text-base leading-relaxed text-[#756554]">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const audiences = [
  { title: "Практикам", note: "Психологам и психиатрам", text: "Карта помогает начать разговор и быстрее найти точку контакта даже в непростой сессии.", src: "/landing/audience-psychologists.png" },
  { title: "Тем, кто помогает", note: "Коучам, наставникам, преподавателям", text: "Когда вы постоянно держите пространство для других, важно не потерять контакт с собой.", src: "/landing/audience-helpers.png" },
  { title: "Тем, кто тянет", note: "Командам, фрилансерам, предпринимателям", text: "Чтобы не принимать важные решения из усталости и не откладывать восстановление на потом.", src: "/landing/audience-entrepreneurs.png" },
];

export function NewAudienceGallery() {
  const [active, setActive] = useState(0);
  const audience = audiences[active];

  return (
    <div className="new-audience-layout mt-12">
      <div className="new-audience-portrait relative min-h-[420px] overflow-hidden rounded-[2.5rem]">
        <Image src={audience.src} alt={audience.title} fill sizes="(max-width: 900px) 100vw, 50vw" className="object-cover transition duration-500" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1d1511]/90 via-[#1d1511]/35 to-transparent px-7 pb-8 pt-28 text-[#fff9ed]">
          <p className="new-kicker text-[#d9ad57]">{audience.note}</p>
          <h3 className="mt-2 font-display text-5xl leading-none">{audience.title}</h3>
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <p className="max-w-md font-display text-3xl leading-tight text-[#2a1b13] sm:text-4xl">{audience.text}</p>
        <div className="mt-9 grid gap-2">
          {audiences.map((item, index) => (
            <button key={item.title} type="button" onClick={() => setActive(index)} className={`new-audience-tab ${active === index ? "is-active" : ""}`}>
              <span className="new-kicker">0{index + 1}</span><span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
