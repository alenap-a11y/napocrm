import { useState } from "react";

const MODULES = [
  {
    id: "bach",
    icon: "ti-flower",
    iconBg: "#F0EBF8",
    iconColor: "#7F3FBF",
    category: "Bien-être",
    categoryColor: "#7F3FBF",
    categoryBg: "#F0EBF8",
    title: "Fleurs de Bach",
    description:
      "Créez des formules personnalisées, suivez l'évolution émotionnelle de vos clients et accédez à la bibliothèque complète des 38 fleurs.",
    price: null,
    status: "active",
    cta: "Accéder",
    path: "/fleurs-de-bach",
  },
  {
    id: "oracle",
    icon: "ti-crystal-ball",
    iconBg: "#EEF0FB",
    iconColor: "#3D4BB5",
    category: "Bien-être",
    categoryColor: "#3D4BB5",
    categoryBg: "#EEF0FB",
    title: "Oracle thématique",
    description:
      "Tirage de cartes guidé pour enrichir vos séances. Interprétations intégrées, journalisation et historique par client.",
    price: "4,99 €/mois",
    status: "soon",
    cta: "Bientôt disponible",
  },
  {
    id: "programmes",
    icon: "ti-route",
    iconBg: "#E6F4EE",
    iconColor: "#1A7A4A",
    category: "Bien-être",
    categoryColor: "#1A7A4A",
    categoryBg: "#E6F4EE",
    title: "Programmes de soin",
    description:
      "Construisez des parcours multi-séances structurés, assignez-les à vos clients et suivez leur progression étape par étape.",
    price: "6,99 €/mois",
    status: "available",
    cta: "Bientôt disponible",
  },
  {
    id: "facturation",
    icon: "ti-file-invoice",
    iconBg: "#FEF3E2",
    iconColor: "#A05A00",
    category: "Gestion",
    categoryColor: "#A05A00",
    categoryBg: "#FEF3E2",
    title: "Facturation Pro",
    description:
      "Générez des factures PDF à votre image, gérez les paiements, les relances automatiques et exportez votre comptabilité.",
    price: "4,99 €/mois",
    status: "available",
    cta: "Bientôt disponible",
  },
  {
    id: "stats",
    icon: "ti-chart-bar",
    iconBg: "#E8F4FB",
    iconColor: "#1565A8",
    category: "Gestion",
    categoryColor: "#1565A8",
    categoryBg: "#E8F4FB",
    title: "Statistiques avancées",
    description:
      "Visualisez votre activité avec des graphiques détaillés : revenus, fréquence des séances, fidélisation clients et tendances.",
    price: "3,99 €/mois",
    status: "available",
    cta: "Bientôt disponible",
  },
  {
    id: "fiscal",
    icon: "ti-calculator",
    iconBg: "#F3EEF8",
    iconColor: "#6B35A8",
    category: "Gestion",
    categoryColor: "#6B35A8",
    categoryBg: "#F3EEF8",
    title: "Simulateur fiscal",
    description:
      "Estimez vos charges sociales, optimisez votre régime fiscal et anticipez votre déclaration avec des projections en temps réel.",
    price: null,
    status: "active",
    cta: "Accéder",
    path: "/fiscal",
  },
  {
    id: "rappels",
    icon: "ti-message-2",
    iconBg: "#E6F6F5",
    iconColor: "#0F7070",
    category: "Automatisation",
    categoryColor: "#0F7070",
    categoryBg: "#E6F6F5",
    title: "Rappels automatiques",
    description:
      "Envoyez des rappels de séance par SMS ou email, réduisez les no-shows et automatisez vos messages post-séance.",
    price: "2,99 €/mois + SMS",
    status: "available",
    cta: "Bientôt disponible",
  },
  {
    id: "gcal",
    icon: "ti-brand-google",
    iconBg: "#FEE8E8",
    iconColor: "#B5221B",
    category: "Automatisation",
    categoryColor: "#B5221B",
    categoryBg: "#FEE8E8",
    title: "Synchro Google Calendar",
    description:
      "Synchronisez vos séances avec Google Calendar en temps réel. Vos rendez-vous NapoCRM apparaissent automatiquement dans votre agenda.",
    price: "3,99 €/mois",
    status: "available",
    cta: "Bientôt disponible",
  },
  {
    id: "formulaires",
    icon: "ti-clipboard-list",
    iconBg: "#FDF0F6",
    iconColor: "#9B2166",
    category: "Automatisation",
    categoryColor: "#9B2166",
    categoryBg: "#FDF0F6",
    title: "Formulaires d'intake",
    description:
      "Envoyez des questionnaires pré-séance à vos clients, récupérez leurs réponses directement dans leur fiche et gagnez du temps.",
    price: "3,99 €/mois",
    status: "available",
    cta: "Bientôt disponible",
  },
];

const TABS = ["Tous", "Bien-être", "Gestion", "Automatisation"];

const STATUS_STYLES = {
  active: { label: "Inclus", bg: "#E6F4EE", color: "#1A7A4A" },
  available: { label: "Bientôt", bg: "#EEEDFE", color: "#534AB7" },
  soon: { label: "Bientôt", bg: "#F5F5F5", color: "#6B7280" },
};

export default function NapoPlus() {
  const [activeTab, setActiveTab] = useState("Tous");


  const filtered =
    activeTab === "Tous"
      ? MODULES
      : MODULES.filter((m) => m.category === activeTab);

  const included = filtered.filter((m) => m.status === "active");
  const available = filtered.filter((m) => m.status !== "active");

  return (
    <div style={{ padding: "0", fontFamily: "inherit", minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #26215C 0%, #534AB7 60%, #7F77DD 100%)",
          padding: "36px 32px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: "40%",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-sparkles" style={{ fontSize: 20, color: "#fff" }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              Napo<span style={{ color: "#AFA9EC" }}>+</span>
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                background: "#AFA9EC",
                color: "#26215C",
                padding: "2px 8px",
                borderRadius: 20,
                letterSpacing: "0.02em",
              }}
            >
              NOUVEAU
            </span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
            Étendez NapoCRM avec des modules pensés pour les praticiens du bien-être.
            Activez uniquement ce dont vous avez besoin.
          </p>

          <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
            {[
              { icon: "ti-puzzle", label: "9 modules" },
              { icon: "ti-shield-check", label: "Sans engagement" },
              { icon: "ti-rotate", label: "Résiliable à tout moment" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{ fontSize: 14, color: "#AFA9EC" }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: "0 32px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          background: "var(--color-background-primary)",
          display: "flex",
          gap: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#534AB7" : "var(--color-text-secondary)",
              borderBottom: activeTab === tab ? "2px solid #534AB7" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.12s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px" }}>

        {/* Modules inclus */}
        {included.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <i className="ti ti-check-circle" style={{ fontSize: 15, color: "#1A7A4A" }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Inclus dans votre abonnement
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {included.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} onNavigate={(path) => { window.location.hash = path }} />
              ))}
            </div>
          </>
        )}

        {/* Modules disponibles */}
        {available.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <i className="ti ti-sparkles" style={{ fontSize: 15, color: "#534AB7" }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#534AB7", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {activeTab === "Tous" ? "Modules disponibles" : activeTab}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {available.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} onNavigate={(path) => { window.location.hash = path }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div
        style={{
          margin: "8px 32px 32px",
          padding: "20px 24px",
          borderRadius: 12,
          background: "#EEEDFE",
          border: "0.5px solid #AFA9EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#26215C", marginBottom: 3 }}>
            Un module vous manque ?
          </div>
          <div style={{ fontSize: 12, color: "#534AB7" }}>
            Dites-nous ce qui vous ferait gagner du temps — nous construisons Napo+ avec vos retours.
          </div>
        </div>
        <button
          style={{
            flexShrink: 0,
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "#534AB7",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Faire une suggestion
        </button>
      </div>
    </div>
  );
}

function ModuleCard({ mod, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const statusStyle = STATUS_STYLES[mod.status];
  const isActive = mod.status === "active";
  const isSoon = mod.status === "soon";

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: `0.5px solid ${hovered && !isSoon ? "#AFA9EC" : "var(--color-border-tertiary)"}`,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered && !isSoon ? "0 2px 12px rgba(83,74,183,0.1)" : "none",
        opacity: isSoon ? 0.7 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: mod.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className={`ti ${mod.icon}`} style={{ fontSize: 20, color: mod.iconColor }} aria-hidden="true" />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: statusStyle.bg,
            color: statusStyle.color,
            padding: "3px 8px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Body */}
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: mod.categoryColor,
              background: mod.categoryBg,
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            {mod.category}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 5 }}>
          {mod.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          {mod.description}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#1A7A4A" : "var(--color-text-primary)" }}>
          
        </div>
        <button
          onClick={() => !isSoon && (isActive && mod.path ? onNavigate(mod.path) : null)}
          disabled={isSoon}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: isActive ? "0.5px solid #1A7A4A" : "none",
            background: isSoon ? "#F5F5F5" : isActive ? "transparent" : "#534AB7",
            color: isSoon ? "#9CA3AF" : isActive ? "#1A7A4A" : "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: isSoon ? "default" : "pointer",
            transition: "opacity 0.12s",
          }}
        >
          {mod.cta}
        </button>
      </div>
    </div>
  );
}
