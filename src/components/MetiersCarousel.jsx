import { useEffect, useRef } from "react";

const metiers = [
  { icon: "ti-hand-stop", label: "Magnétiseur" },
  { icon: "ti-moon-stars", label: "Sophrologue" },
  { icon: "ti-cards", label: "Cartomancienne" },
  { icon: "ti-eye", label: "Médium" },
  { icon: "ti-flower", label: "Naturopathe" },
  { icon: "ti-yoga", label: "Coach yoga" },
  { icon: "ti-massage", label: "Praticien massage" },
  { icon: "ti-leaf", label: "Aromathérapeute" },
  { icon: "ti-zodiac-leo", label: "Astrologue" },
  { icon: "ti-flame", label: "Reiki" },
  { icon: "ti-pray", label: "Energéticien" },
  { icon: "ti-brain", label: "Hypnothérapeute" },
];

const row1 = metiers.slice(0, 6);
const row2 = metiers.slice(6, 12);

function Row({ items, direction }) {
  const doubled = [...items, ...items];
  return (
    <div
      className={`metiers-row ${direction === "left" ? "scroll-left" : "scroll-right"}`}
    >
      {doubled.map((m, i) => (
        <div className="metier-chip" key={i}>
          <i className={`ti ${m.icon}`} aria-hidden="true"></i>
          <span>{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function MetiersCarousel() {
  return (
    <div className="metiers-section">
      <div className="metiers-carousel">
        <Row items={row1} direction="left" />
        <Row items={row2} direction="right" />
      </div>
    </div>
  );
}
