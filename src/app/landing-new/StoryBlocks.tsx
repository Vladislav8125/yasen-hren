"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";

const cards = [
  { name: "Перфекциончик", text: "Когда отдых кажется недоработкой, а любой результат — недостаточным.", src: "/cards/perfektsionchik.png" },
  { name: "Добытчик", text: "Когда нужно ещё немного поднажать — даже если сил уже нет.", src: "/cards/dobytchik.png" },
  { name: "Главнюк", text: "Когда контроль становится единственным способом не тревожиться.", src: "/cards/glavnyuk.png" },
  { name: "Бабай", text: "Когда внутри первым делом появляется самый страшный сценарий.", src: "/cards/babay.png" },
  { name: "Хиханьки", text: "Когда шутка помогает не заметить, что на самом деле больно.", src: "/cards/hihanki.png" },
];

function LivingCard({ card }: { card: typeof cards[number] }) {
  const [open, setOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return <button
    type="button"
    className={`living-card ${open ? "is-open" : ""}`}
    style={{ "--tilt-x": `${tilt.x}deg`, "--tilt-y": `${tilt.y}deg` } as CSSProperties}
    onClick={() => setOpen((value) => !value)}
    onPointerMove={(event) => {
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      setTilt({ x: ((event.clientY - rect.top) / rect.height - .5) * -9, y: ((event.clientX - rect.left) / rect.width - .5) * 9 });
    }}
    onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    aria-label={`${card.name}: ${card.text}`}
  >
    <Image src={card.src} alt="" fill sizes="(max-width: 700px) 44vw, 18vw" className="object-cover" />
    <span className="living-card-glow" aria-hidden="true" />
    <span className="living-card-copy"><strong>{card.name}</strong><span>{card.text}</span></span>
  </button>;
}

export function LivingCards() {
  return <div className="living-card-row">{cards.map((card) => <LivingCard key={card.name} card={card} />)}</div>;
}

export function ParticleBridge({ dark = false }: { dark?: boolean }) {
  return <div aria-hidden="true" className={`particle-bridge ${dark ? "is-dark" : ""}`}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>;
}
