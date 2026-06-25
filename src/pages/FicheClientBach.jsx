import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/* ═══════════════════════════════════════════════════════════════════════════
   PALETTE & TOKENS
═══════════════════════════════════════════════════════════════════════════ */
const P = {
  vert:       '#3D5A3E',
  vertDark:   '#2C4330',
  vertClair:  '#EBF0EB',
  ambre:      '#A0622A',
  ambreDark:  '#7D4C1F',
  ambreClair: '#FBF0E6',
  terre:      '#8B5E3C',
  terreClair: '#F5EDE5',
  sable:      '#FBF8F4',
  sableF:     '#EDE8DF',
  sableFF:    '#E0D9CE',
  blanc:      '#FFFFFF',
  texte:      '#1E1309',
  texteS:     '#5C4A36',
  gris:       '#9B8B7A',
  grisClair:  '#C8BDB0',
};

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES INLINE (constante CSS)
═══════════════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700&display=swap');

  .fb { all: initial; display: block; background: ${P.sable}; min-height: 100vh;
        font-family: 'Raleway', system-ui, sans-serif; color: ${P.texte};
        -webkit-font-smoothing: antialiased; }
  .fb *, .fb *::before, .fb *::after { box-sizing: border-box; }

  .fb-serif { font-family: 'Lora', Georgia, serif; }

  /* ── Wizard stepper ── */
  .fb-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
             padding: 10px 4px; border: none; background: transparent; cursor: pointer;
             font-family: inherit; transition: all .2s; position: relative; }
  .fb-step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex;
                 align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
                 transition: all .25s; }
  .fb-step-line { position: absolute; top: 26px; left: calc(50% + 16px);
                  width: calc(100% - 32px); height: 2px; }

  /* ── Tags cliquables ── */
  .fb-tag { cursor: pointer; padding: 5px 13px; border-radius: 20px; font-size: 12px;
            font-weight: 600; border: 1.5px solid ${P.sableFF}; background: ${P.blanc};
            color: ${P.texteS}; font-family: inherit; transition: all .2s; white-space: nowrap;
            letter-spacing: .01em; }
  .fb-tag:hover { border-color: ${P.ambre}; color: ${P.ambre}; background: ${P.ambreClair}; }
  .fb-tag.on { background: ${P.ambre}; border-color: ${P.ambre}; color: ${P.blanc}; }

  /* ── Cartes fleurs ── */
  .fb-fleur { border-radius: 10px; border: 1.5px solid ${P.sableF}; background: ${P.blanc};
              padding: 14px; transition: border-color .2s, box-shadow .2s; }
  .fb-fleur:hover { border-color: ${P.grisClair}; box-shadow: 0 2px 10px rgba(0,0,0,.06); }
  .fb-fleur.mel  { border-color: ${P.vert}   !important; background: ${P.vertClair}  !important; }
  .fb-fleur.fond { border-color: ${P.terre}  !important; background: ${P.terreClair} !important; }
  .fb-fleur.prio { border-color: ${P.ambre}  !important; background: ${P.ambreClair} !important; }

  /* ── Boutons niveau ── */
  .fb-niv { padding: 4px 10px; border-radius: 12px; border: 1.5px solid; font-size: 11px;
            font-weight: 700; cursor: pointer; font-family: inherit; transition: all .18s;
            background: transparent; letter-spacing: .02em; }
  .fb-niv.mel  { border-color: ${P.vert};  color: ${P.vert};  }
  .fb-niv.fond { border-color: ${P.terre}; color: ${P.terre}; }
  .fb-niv.prio { border-color: ${P.ambre}; color: ${P.ambre}; }
  .fb-niv.mel.on,  .fb-niv.mel:hover  { background: ${P.vert};  color: ${P.blanc}; }
  .fb-niv.fond.on, .fb-niv.fond:hover { background: ${P.terre}; color: ${P.blanc}; }
  .fb-niv.prio.on, .fb-niv.prio:hover { background: ${P.ambre}; color: ${P.blanc}; }

  /* ── Boutons principaux ── */
  .fb-btn { padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
            cursor: pointer; font-family: inherit; border: none; transition: all .2s;
            display: inline-flex; align-items: center; gap: 8px; letter-spacing: .01em; }
  .fb-btn:disabled { opacity: .5; cursor: not-allowed; }
  .fb-btn-v { background: ${P.vert};  color: ${P.blanc}; }
  .fb-btn-v:hover:not(:disabled) { background: ${P.vertDark}; }
  .fb-btn-a { background: ${P.ambre}; color: ${P.blanc}; }
  .fb-btn-a:hover:not(:disabled) { background: ${P.ambreDark}; }
  .fb-btn-t { background: ${P.terre}; color: ${P.blanc}; }
  .fb-btn-o { background: transparent; color: ${P.vert}; border: 1.5px solid ${P.vert} !important; }
  .fb-btn-o:hover { background: ${P.vertClair}; }

  /* ── Inputs ── */
  .fb-inp { width: 100%; padding: 10px 14px; border: 1.5px solid ${P.sableF};
            border-radius: 8px; font-size: 13px; background: ${P.blanc}; color: ${P.texte};
            outline: none; font-family: inherit; transition: border .2s; }
  .fb-inp:focus { border-color: ${P.ambre}; box-shadow: 0 0 0 3px ${P.ambreClair}; }
  .fb-ta { resize: vertical; min-height: 72px; line-height: 1.55; }

  /* ── Dose dots ── */
  .fb-dot { width: 10px; height: 10px; border-radius: 50%; cursor: pointer;
            transition: background .15s, transform .1s; }
  .fb-dot:hover { transform: scale(1.25); }

  /* ── Rond bouton ── */
  .fb-rnd { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid ${P.sableFF};
            background: ${P.blanc}; cursor: pointer; display: flex; align-items: center;
            justify-content: center; font-size: 15px; color: ${P.texteS}; font-family: inherit;
            transition: all .18s; flex-shrink: 0; }
  .fb-rnd:hover { border-color: ${P.ambre}; color: ${P.ambre}; }

  /* ── Animations ── */
  @keyframes fb-fade { from { opacity: 0; transform: translateY(8px); }
                        to   { opacity: 1; transform: translateY(0); } }
  .fb-anim { animation: fb-fade .28s ease; }

  /* ── Scrollbar subtile ── */
  .fb-scroll { scrollbar-width: thin; scrollbar-color: ${P.sableFF} transparent; }

  /* ── Responsive ── */
  @media (max-width: 680px) {
    .fb-fleurs-grid { grid-template-columns: 1fr !important; }
    .fb-proto-grid  { grid-template-columns: 1fr 1fr !important; }
    .fb-synth-grid  { grid-template-columns: 1fr 1fr !important; }
    .fb-step-label  { display: none; }
    .fb-pdf-row     { flex-direction: column !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fb-anim, .fb-tag, .fb-niv, .fb-btn, .fb-fleur, .fb-dot { transition: none !important; animation: none !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   DONNÉES : 39 FLEURS DE BACH
═══════════════════════════════════════════════════════════════════════════ */
const FLEURS = [
  /* ── PEUR ──────────────────────────────────────────── */
  { num:1,  name:'Rock Rose',         fr:'Hélianthème',          famille:'Peur',            theme:'Terreur et panique',                 indication:'Terreur soudaine, cauchemars, crises de panique extrême' },
  { num:2,  name:'Mimulus',           fr:'Mimule',               famille:'Peur',            theme:'Peur précise et connue',             indication:'Peurs identifiables du quotidien : maladie, mort, accidents, animaux' },
  { num:3,  name:'Cherry Plum',       fr:'Prunus',               famille:'Peur',            theme:'Peur de perdre le contrôle',         indication:'Crainte de céder à des impulsions, peur de la folie, gestes irrationnels' },
  { num:4,  name:'Aspen',             fr:'Tremble',              famille:'Peur',            theme:'Peur vague et inexpliquée',          indication:'Pressentiments, appréhensions sans raison connue, frissons, malaise' },
  { num:5,  name:'Red Chestnut',      fr:'Marronnier Rouge',     famille:'Peur',            theme:'Anxiété pour les autres',            indication:'Inquiétude excessive pour les proches, anticipation des catastrophes' },
  /* ── INCERTITUDE ────────────────────────────────────── */
  { num:6,  name:'Cerato',            fr:'Cérato',               famille:'Incertitude',     theme:'Manque de confiance en son jugement',indication:'Doute de soi, besoin constant de validation, influence des avis extérieurs' },
  { num:7,  name:'Scleranthus',       fr:'Scléranthe',           famille:'Incertitude',     theme:'Indécision entre deux options',      indication:'Hésitation chronique, humeur fluctuante, impossibilité de choisir' },
  { num:8,  name:'Gentian',           fr:'Gentiane',             famille:'Incertitude',     theme:'Découragement après un obstacle',    indication:'Scepticisme, doute facile, découragement à la moindre difficulté' },
  { num:9,  name:'Gorse',             fr:'Ajonc',                famille:'Incertitude',     theme:'Désespoir et absence d\'espoir',     indication:'Résignation profonde, sentiment que rien ne peut aider' },
  { num:10, name:'Hornbeam',          fr:'Charme',               famille:'Incertitude',     theme:'Fatigue mentale et procrastination', indication:'Lassitude au lever, doute de sa capacité à accomplir les tâches' },
  { num:11, name:'Wild Oat',          fr:'Avoine Sauvage',       famille:'Incertitude',     theme:'Absence de direction de vie',        indication:'Ne trouve pas sa voie, ambitions vagues, insatisfaction profonde' },
  /* ── PRÉSENT ────────────────────────────────────────── */
  { num:12, name:'Clematis',          fr:'Clématite',            famille:'Présent',         theme:'Rêverie et détachement du présent',  indication:'Distraction, somnolence, vie dans les rêves plutôt que la réalité' },
  { num:13, name:'Honeysuckle',       fr:'Chèvrefeuille',        famille:'Présent',         theme:'Nostalgie du passé',                 indication:'Ancré dans le passé, regrets envahissants, incapacité à avancer' },
  { num:14, name:'Wild Rose',         fr:'Églantier',            famille:'Présent',         theme:'Résignation et apathie',             indication:'Acceptation passive de la vie sans motivation, effort ou intérêt' },
  { num:15, name:'Olive',             fr:'Olive',                famille:'Présent',         theme:'Épuisement total',                   indication:'Fatigue profonde physique et mentale après longue maladie ou effort' },
  { num:16, name:'White Chestnut',    fr:'Marronnier Blanc',     famille:'Présent',         theme:'Pensées obsessionnelles',            indication:'Ruminations mentales, pensées intrusives en boucle, dialogue intérieur' },
  { num:17, name:'Mustard',           fr:'Moutarde',             famille:'Présent',         theme:'Dépression sans cause apparente',    indication:'Mélancolie soudaine sans raison identifiable, nuage sombre' },
  { num:18, name:'Chestnut Bud',      fr:'Bourgeon de Marronnier',famille:'Présent',        theme:'Répétition des mêmes erreurs',       indication:'Ne tire pas les leçons de ses expériences, manque d\'observation' },
  /* ── SOLITUDE ───────────────────────────────────────── */
  { num:19, name:'Water Violet',      fr:'Violette d\'Eau',      famille:'Solitude',        theme:'Fierté et isolement',                indication:'Tend à s\'isoler, difficulté à demander de l\'aide, sentiment de supériorité' },
  { num:20, name:'Impatiens',         fr:'Impatiente',           famille:'Solitude',        theme:'Impatience et irritabilité',         indication:'Rapidité d\'action, irritation devant la lenteur des autres, tension' },
  { num:21, name:'Heather',           fr:'Bruyère',              famille:'Solitude',        theme:'Centré sur soi',                     indication:'Besoin intense d\'attention, solitude difficile à vivre, bavardage' },
  /* ── HYPERSENSIBILITÉ ───────────────────────────────── */
  { num:22, name:'Agrimony',          fr:'Agrimonie',            famille:'Hypersensibilité',theme:'Torture intérieure masquée',         indication:'Cache son anxiété derrière la joie, fuit les conflits et le bruit' },
  { num:23, name:'Centaury',          fr:'Centaurée',            famille:'Hypersensibilité',theme:'Faiblesse de volonté',               indication:'Incapable de dire non, servitude, oubli de soi au profit des autres' },
  { num:24, name:'Walnut',            fr:'Noyer',                famille:'Hypersensibilité',theme:'Protection lors des transitions',    indication:'Changements importants de vie, protection contre influences extérieures' },
  { num:25, name:'Holly',             fr:'Houx',                 famille:'Hypersensibilité',theme:'Jalousie, envie, haine',             indication:'Jalousie, méfiance, colère profonde ou haine sans raison apparente' },
  /* ── DÉSESPOIR ──────────────────────────────────────── */
  { num:26, name:'Larch',             fr:'Mélèze',               famille:'Désespoir',       theme:'Manque de confiance en soi',         indication:'Convaincu d\'échouer avant d\'avoir essayé, sentiment d\'infériorité' },
  { num:27, name:'Pine',              fr:'Pin',                  famille:'Désespoir',       theme:'Culpabilité et auto-critique',       indication:'Se blâme excessivement, s\'excuse constamment, perfectionnisme douloureux' },
  { num:28, name:'Elm',               fr:'Orme',                 famille:'Désespoir',       theme:'Accablement temporaire',             indication:'Submergé ponctuellement par ses responsabilités, doute de ses capacités' },
  { num:29, name:'Sweet Chestnut',    fr:'Châtaignier Doux',     famille:'Désespoir',       theme:'Désespoir extrême',                  indication:'Limite de l\'endurance, sentiment que tout est fini, nuit obscure de l\'âme' },
  { num:30, name:'Star of Bethlehem', fr:'Étoile de Bethléem',  famille:'Désespoir',       theme:'Choc et traumatisme',                indication:'Séquelles de choc, traumatisme passé ou récent, deuil non résolu' },
  { num:31, name:'Willow',            fr:'Saule',                famille:'Désespoir',       theme:'Amertume et rancœur',               indication:'Se sent victime du destin, ressentiment, difficulté à pardonner' },
  { num:32, name:'Oak',               fr:'Chêne',                famille:'Désespoir',       theme:'Lutte obstinée malgré épuisement',  indication:'Continue de lutter sans se ménager, sens excessif du devoir' },
  { num:33, name:'Crab Apple',        fr:'Pommier Sauvage',      famille:'Désespoir',       theme:'Sentiment d\'impureté',             indication:'Obsession de la propreté, honte du corps, perfectionnisme ritualisé' },
  /* ── SOUCI POUR AUTRUI ──────────────────────────────── */
  { num:34, name:'Chicory',           fr:'Chicorée',             famille:'Autrui',          theme:'Possessivité et manipulation',       indication:'Amour possessif, manipulation affective, besoin d\'être indispensable' },
  { num:35, name:'Vervain',           fr:'Verveine',             famille:'Autrui',          theme:'Excès d\'enthousiasme',              indication:'Fanatisme, inflexibilité, sur-tension nerveuse, prosélytisme' },
  { num:36, name:'Vine',              fr:'Vigne',                famille:'Autrui',          theme:'Autoritarisme et domination',        indication:'Dominance, tyrannie bienveillante, certitude absolue d\'avoir raison' },
  { num:37, name:'Beech',             fr:'Hêtre',                famille:'Autrui',          theme:'Intolérance et esprit critique',     indication:'Intolérance aux défauts des autres, perfectionnisme critique, jugement' },
  { num:38, name:'Rock Water',        fr:'Eau de Roche',         famille:'Autrui',          theme:'Rigidité et idéaux austères',        indication:'Perfectionnisme envers soi-même, ascétisme, idéaux de vie inflexibles' },
  /* ── COMPOSITE ──────────────────────────────────────── */
  { num:39, name:'Rescue Remedy',     fr:'Remède d\'Urgence',    famille:'Composite',       theme:'Urgence émotionnelle aiguë',         indication:'Choc, panique, stress intense — composite: Rock Rose, Impatiens, Clematis, Star of Bethlehem, Cherry Plum' },
];

const FAMILLES = ['Peur','Incertitude','Présent','Solitude','Hypersensibilité','Désespoir','Autrui','Composite'];

const FAM_STYLE = {
  Peur:            { bg:'#FDECEA', border:'#E8A09A', color:'#A93226' },
  Incertitude:     { bg:'#F3ECF8', border:'#C9A8E0', color:'#7D3C98' },
  Présent:         { bg:'#EAF4FB', border:'#A3C8E8', color:'#1F618D' },
  Solitude:        { bg:'#E8F6F3', border:'#86C5B8', color:'#117A65' },
  Hypersensibilité:{ bg:'#FEF0E4', border:'#E8B487', color:'#B9560B' },
  Désespoir:       { bg:'#F2F3F4', border:'#BFC9CA', color:'#5D6D7E' },
  Autrui:          { bg:'#EBF5FB', border:'#A9D0E8', color:'#1A6FA8' },
  Composite:       { bg:'#FDECEA', border:'#E8907A', color:'#CB4335' },
};

const NIV = {
  mel:  { color: P.vert,  label: 'Mélange',  desc: 'Composition centrale' },
  fond: { color: P.terre, label: 'Fond',      desc: 'Pattern profond' },
  prio: { color: P.ambre, label: 'Priorité',  desc: 'Urgence immédiate' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   QUESTIONS D'ENTRETIEN
═══════════════════════════════════════════════════════════════════════════ */
const QUESTIONS = [
  { id:'humeur',    label:'État émotionnel',   icon:'◎',
    question:'Comment décrivez-vous votre état émotionnel général en ce moment ?',
    tags:['Anxieux·se','Triste','En colère','Apathique','Épuisé·e','Serein·e','Confus·e','Enthousiaste','Découragé·e','Tendu·e','Déprimé·e','Joyeux·se'] },
  { id:'peurs',     label:'Peurs & angoisses', icon:'◈',
    question:'Avez-vous des peurs ou inquiétudes particulières en ce moment ?',
    tags:['Peur vague','Peur précise','Peur pour les proches','Peur de l\'avenir','Peur du jugement','Peur de perdre le contrôle','Panique','Angoisse nocturne','Aucune peur'] },
  { id:'relations', label:'Relations',          icon:'◉',
    question:'Comment vivez-vous vos relations avec les autres ?',
    tags:['Isolement','Conflits fréquents','Dépendance affective','Jalousie','Solitude subie','Don excessif de soi','Incompris·e','Harmonie','Contrôlé·e','Contrôlant·e'] },
  { id:'energie',   label:'Énergie & vitalité', icon:'◈',
    question:'Comment évaluez-vous votre énergie et votre motivation au quotidien ?',
    tags:['Épuisé·e total','Fatigue chronique','Procrastination','Motivation fluctuante','Suractivité','Bonne énergie','Léthargie','Nervosité excessive','Fatigue matinale'] },
  { id:'mental',    label:'État mental',        icon:'◎',
    question:'Avez-vous des pensées récurrentes ou des difficultés de concentration ?',
    tags:['Ruminations','Indécision','Pensées négatives','Confusion mentale','Nostalgie envahissante','Clarté d\'esprit','Doute de soi','Obsessions','Rêverie excessive'] },
  { id:'vie',       label:'Vie & transitions',  icon:'◉',
    question:'Y a-t-il des changements importants dans votre vie en ce moment ?',
    tags:['Changement majeur','Deuil','Séparation','Nouvelle activité','Manque de sens','Stabilité','En transition','Traumatisme récent','Renouveau','Naissance'] },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════════════════════════ */
const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const icons = {
    prev: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
    next: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    minus:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
    save: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
    pdf:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
    x:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.11a1 1 0 0 0 .17 1.4 1.07 1.07 0 0 0 1.41-.14C7 18 10 17 12 15.5c0 2.5-1 5-5 7 4.5 0 10-1 13-8-1 2.5-4 4-6 4 2-2 3.5-5 3.5-8.5C17.5 6 17 2 12 2c0 4-2 6.5-5 8C8 7 9.5 4 17 8z"/></svg>,
    search:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>,
  };
  return icons[name] || null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function FicheClientBach() {
  const { clientId } = useParams();

  const [step, setStep]           = useState(0);  // 0 = Historique global
  const [selection, setSelection] = useState({});    // { num: 'mel'|'fond'|'prio' }
  const [doses, setDoses]         = useState({});    // { num: 1-6 }
  const [entretien, setEntretien] = useState({});    // { qid: { tags:[], note:'' } }
  const [proto, setProto]         = useState({ duree: 3, prises: 3, gouttes: 4, volume: 30 });
  const [persos, setPersos]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [search, setSearch]       = useState('');
  const [filtreFam, setFiltreFam] = useState('');
  const [saveError, setSaveError] = useState('');
  const [clientInfo, setClientInfo]         = useState({ nom: '', prenom: '' });
  const [historique, setHistorique]         = useState([]);
  const [loadingHisto, setLoadingHisto]     = useState(false);
  const [histoAll, setHistoAll]             = useState([]);
  const [loadingHistoAll, setLoadingHistoAll] = useState(false);
  const [searchHistoAll, setSearchHistoAll] = useState('');
  const [userId, setUserId]                 = useState(null);
  const [fleursPerso, setFleursPerso]       = useState([]);
  const [loadingPerso, setLoadingPerso]     = useState(false);
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState(null);   // null = ajout
  const [deleteConfirm, setDeleteConfirm]   = useState(null);   // id à confirmer
  const [savingPerso, setSavingPerso]       = useState(false);
  const FORM_VIDE = { name:'', fr:'', sys:'Australian Bush', fam:'Incertitude', theme:'', indic:'', couleur:'#3D5A3E' };
  const [formPerso, setFormPerso]           = useState(FORM_VIDE);

  /* ── userId depuis la session Supabase ─────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  /* ── Fetch nom/prénom client ─────────────────────────────────────────── */
  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('clients')
      .select('nom, prenom')
      .eq('id', clientId)
      .maybeSingle()
      .then(({ data }) => { if (data) setClientInfo(data); });
  }, [clientId]);

  /* ── Fetch historique du client courant ─────────────────────────────── */
  const fetchHistorique = useCallback(async () => {
    if (!clientId) return;
    setLoadingHisto(true);
    const { data } = await supabase
      .from('fiches_bach')
      .select('id, created_at, selection, doses, entretien, proto, persos')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setHistorique(data || []);
    setLoadingHisto(false);
  }, [clientId]);

  useEffect(() => { fetchHistorique(); }, [fetchHistorique]);

  /* ── Fetch historique global (tous clients) ─────────────────────────── */
  const fetchHistoAll = useCallback(async () => {
    setLoadingHistoAll(true);
    const { data } = await supabase
      .from('fiches_bach')
      .select('*, clients(nom, prenom)')
      .order('updated_at', { ascending: false });
    setHistoAll(data || []);
    setLoadingHistoAll(false);
  }, []);

  useEffect(() => { fetchHistoAll(); }, [fetchHistoAll]);

  const clientFullName = [clientInfo.prenom, clientInfo.nom].filter(Boolean).join(' ') || 'Client';

  const STEPS = ['Historique','Client','Entretien','Fleurs','Mélange','Protocole','Synthèse','Séances'];

  /* ── Dérivés ───────────────────────────────────────────────────────────── */
  const selected = useMemo(() => FLEURS.filter(f => selection[f.num]), [selection]);
  const byNiv    = useCallback(niv => selected.filter(f => selection[f.num] === niv), [selected, selection]);
  const fleursMel  = useMemo(() => byNiv('mel'),  [byNiv]);
  const fleursFond = useMemo(() => byNiv('fond'), [byNiv]);
  const fleursPrio = useMemo(() => byNiv('prio'), [byNiv]);

  const filtered = useMemo(() => FLEURS.filter(f => {
    const q  = search.toLowerCase();
    const ok = !q || [f.fr, f.name, f.theme, f.indication, f.famille].some(s => s.toLowerCase().includes(q));
    return ok && (!filtreFam || f.famille === filtreFam);
  }), [search, filtreFam]);

  const entretienComplet = useMemo(() =>
    Object.keys(entretien).filter(k => entretien[k]?.tags?.length || entretien[k]?.note).length,
  [entretien]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const toggleSel = useCallback((num, niv) => {
    setSelection(prev => {
      if (prev[num] === niv) { const n = { ...prev }; delete n[num]; return n; }
      return { ...prev, [num]: niv };
    });
    setDoses(prev => prev[num] ? prev : { ...prev, [num]: 3 });
  }, []);

  const adjDose = useCallback((num, val) =>
    setDoses(p => ({ ...p, [num]: Math.max(1, Math.min(6, val)) })), []);

  const toggleTag = useCallback((qid, tag) => setEntretien(prev => {
    const cur  = prev[qid] || { tags: [], note: '' };
    const tags = cur.tags.includes(tag) ? cur.tags.filter(t => t !== tag) : [...cur.tags, tag];
    return { ...prev, [qid]: { ...cur, tags } };
  }), []);

  const setNote = useCallback((qid, note) => setEntretien(prev => {
    const cur = prev[qid] || { tags: [], note: '' };
    return { ...prev, [qid]: { ...cur, note } };
  }), []);

  const adjProto = useCallback((key, delta, min, max) =>
    setProto(p => ({ ...p, [key]: Math.max(min, Math.min(max, p[key] + delta)) })), []);

  /* ── Sauvegarde Supabase ────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaved(false);
    try {
      const { error } = await supabase.from('fiches_bach').insert({
        client_id:  clientId,
        selection, doses, entretien, proto, persos,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || 'Erreur inconnue');
    } finally { setSaving(false); }
  };

  /* ── Génération PDF ─────────────────────────────────────────────────────── */
  /* override = { clientName, selection, doses, entretien, proto, persos, date } */
  const genPDF = async (type, override = null) => {
    const pdfName      = override?.clientName ?? clientFullName;
    const pdfSel       = override?.selection  ?? selection;
    const pdfDoses     = override?.doses      ?? doses;
    const pdfEntretien = override?.entretien  ?? entretien;
    const pdfProto     = override?.proto      ?? proto;
    const pdfPersos    = override?.persos     ?? persos;
    const pdfDate      = override?.date       ? new Date(override.date) : new Date();
    const pdfSelected  = FLEURS.filter(f => pdfSel[f.num]);

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const W = 210, PL = 18, PR = 192;

    const palette = {
      praticien:  { h: [61, 90, 62],   accent: [139, 94, 60]  },
      client:     { h: [160, 98, 42],  accent: [61, 90, 62]   },
      ordonnance: { h: [139, 94, 60],  accent: [160, 98, 42]  },
    }[type];

    let y = 0;
    const setY = v => { y = v; };
    const addY = v => { y += v; };
    const needPage = (h = 20) => { if (y + h > 272) { doc.addPage(); setY(22); } };

    const bold = (txt, x, size, rgb) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
      doc.setTextColor(...rgb); doc.text(txt, x, y);
    };
    const norm = (txt, x, size, rgb = [44, 31, 14], maxW = PR - x) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(size);
      doc.setTextColor(...rgb);
      const lines = doc.splitTextToSize(String(txt), maxW);
      lines.forEach(l => { doc.text(l, x, y); addY(4.5); });
    };
    const hr = (light = false) => {
      addY(2);
      doc.setDrawColor(...(light ? [220, 213, 204] : [180, 168, 156]));
      doc.line(PL, y, PR, y);
      addY(5);
    };
    const sectionTitle = (txt) => {
      needPage(14);
      doc.setFillColor(...palette.h);
      doc.roundedRect(PL, y - 4, PR - PL, 9, 1.5, 1.5, 'F');
      bold(txt, PL + 4, 9, [255, 255, 255]);
      addY(10);
    };

    /* ─ Bandeau header ─ */
    doc.setFillColor(...palette.h);
    doc.rect(0, 0, W, 22, 'F');
    bold(
      type === 'praticien' ? 'FICHE PRATICIEN — FLEURS DE BACH'
      : type === 'client'  ? 'VOTRE MÉLANGE FLEURS DE BACH'
      :                      'ORDONNANCE — FLEURS DE BACH',
      PL, 13, [255, 255, 255]
    );
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Naposolo CRM · Bien-être intégratif', PR, 15, { align: 'right' });
    setY(30);

    /* ─ Infos client ─ */
    bold(`Client : ${pdfName}`, PL, 12, [44, 31, 14]);
    addY(6);
    norm(`Date de séance : ${pdfDate.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`, PL, 9, [120, 100, 80]);
    addY(1); hr();

    /* ─ Entretien (praticien) ─ */
    if (type === 'praticien') {
      sectionTitle('ENTRETIEN');
      let hasEntretien = false;
      QUESTIONS.forEach(q => {
        const e = pdfEntretien[q.id];
        if (!e || (!e.tags?.length && !e.note)) return;
        hasEntretien = true;
        needPage(16);
        bold(`${q.label}`, PL, 9.5, palette.accent);
        addY(5.5);
        if (e.tags?.length) { norm(`Mots-clés : ${e.tags.join(', ')}`, PL + 3, 8.5, [80, 65, 50]); }
        if (e.note)         { norm(e.note, PL + 3, 8.5, [110, 90, 70]); }
        addY(2);
      });
      if (!hasEntretien) { norm('Aucune note d\'entretien saisie.', PL, 9, [155, 139, 122]); }
      addY(2); hr();
    }

    /* ─ Composition ─ */
    sectionTitle(type === 'client' ? 'VOS FLEURS SÉLECTIONNÉES' : 'COMPOSITION DU MÉLANGE');
    const orderNiv = [['prio','Priorité immédiate'],['mel','Mélange principal'],['fond','Pattern profond (fond)']];
    orderNiv.forEach(([niv, lbl]) => {
      const fl = pdfSelected.filter(f => pdfSel[f.num] === niv);
      if (!fl.length) return;
      needPage(12);
      bold(lbl.toUpperCase(), PL, 8, [155, 139, 122]);
      addY(5);
      fl.forEach(f => {
        const d = pdfDoses[f.num] || 3;
        needPage(10);
        if (type === 'client') {
          bold(`${f.fr}`, PL + 2, 10, [44, 31, 14]);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(155, 139, 122);
          doc.text(`${f.name}`, PL + 2 + doc.getTextWidth(f.fr) + 2, y);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...palette.accent);
          doc.text(`${d} gouttes`, PR, y, { align: 'right' });
          addY(5.5);
          norm(f.theme, PL + 4, 8.5, [120, 100, 80]);
        } else {
          bold(`N°${String(f.num).padStart(2,'0')} ${f.fr}`, PL + 2, 10, [44, 31, 14]);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(155, 139, 122);
          doc.text(`/ ${f.name}`, PL + 2 + doc.getTextWidth(`N°${String(f.num).padStart(2,'0')} ${f.fr}`) + 2, y);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...palette.accent);
          doc.text(`${d} gtt`, PR, y, { align: 'right' });
          addY(5.5);
        }
        addY(0.5);
      });
      addY(3);
    });
    if (!pdfSelected.length) { norm('Aucune fleur sélectionnée.', PL, 9, [155, 139, 122]); }
    hr();

    /* ─ Protocole ─ */
    sectionTitle('PROTOCOLE DE TRAITEMENT');
    const rows = [
      ['Durée du traitement',  `${pdfProto.duree} semaine${pdfProto.duree > 1 ? 's' : ''}`],
      ['Prises par jour',      `${pdfProto.prises} prise${pdfProto.prises > 1 ? 's' : ''}`],
      ['Gouttes par prise',    `${pdfProto.gouttes} gouttes`],
      ['Volume du flacon',     `${pdfProto.volume} ml`],
      ['Consommation estimée', `${pdfProto.prises * pdfProto.gouttes * pdfProto.duree * 7} gouttes au total`],
    ];
    rows.forEach(([l, v]) => {
      needPage(8);
      norm(l, PL, 9.5, [120, 100, 80]);
      y -= 4.5;
      bold(v, PR, 9.5, [44, 31, 14]);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setDrawColor(220, 213, 204);
      doc.line(PL + doc.getStringUnitWidth(l) * 9.5 * 0.352 + 3, y - 1.5, PR - doc.getStringUnitWidth(v) * 9.5 * 0.352 - 1, y - 1.5);
      addY(6.5);
    });

    if (pdfPersos && type === 'praticien') {
      addY(3); hr(true);
      sectionTitle('NOTES & CONSEILS PERSONNALISÉS');
      norm(pdfPersos, PL, 9.5, [44, 31, 14]);
    }

    /* ─ Footer ─ */
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5); doc.setTextColor(180, 168, 156);
      doc.text(`Naposolo CRM — Document confidentiel`, PL, 290);
      doc.text(`${i}/${totalPages}`, PR, 290, { align: 'right' });
    }

    const nom = (pdfName || 'client').replace(/\s+/g, '_').toLowerCase();
    doc.save(`bach_${type}_${nom}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDU PAR ÉTAPE
  ═══════════════════════════════════════════════════════════════════════ */

  /* ── Étape 0 : Historique global ───────────────────────────────────── */
  const renderHistoGlobal = () => {
    const now   = new Date();
    const mois  = now.getMonth();
    const annee = now.getFullYear();

    const ceMois = histoAll.filter(f => {
      const d = new Date(f.updated_at || f.created_at);
      return d.getMonth() === mois && d.getFullYear() === annee;
    });

    const scores = histoAll.map(f => Math.min(Object.keys(f.selection || {}).length, 10));
    const scoreMoyen = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

    const q = searchHistoAll.toLowerCase();
    const fichesFiltrees = histoAll.filter(f => {
      if (!q) return true;
      const nom    = [f.clients?.prenom, f.clients?.nom].filter(Boolean).join(' ').toLowerCase();
      const motif  = (f.client_info?.motif || '').toLowerCase();
      const fleurs = FLEURS.filter(fl => f.selection?.[fl.num])
                           .map(fl => fl.fr.toLowerCase() + ' ' + fl.name.toLowerCase())
                           .join(' ');
      return nom.includes(q) || motif.includes(q) || fleurs.includes(q);
    });

    return (
      <div className="fb-anim">
        {/* ── 3 stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total séances',  val: histoAll.length,  color: P.vert  },
            { label: 'Ce mois',        val: ceMois.length,    color: P.ambre },
            { label: 'Score moyen /10',val: scoreMoyen,       color: P.terre },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: P.blanc, borderRadius: 12, padding: '18px 20px',
                                      border: `1.5px solid ${P.sableF}`, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'Lora, Georgia, serif' }}>{val}</div>
              <div style={{ fontSize: 11, color: P.gris, marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Barre de recherche ── */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                         color: P.gris, pointerEvents: 'none' }}>
            <Icon name="search" size={15} />
          </span>
          <input className="fb-inp" style={{ paddingLeft: 38 }}
            placeholder="Rechercher par client, motif ou fleur…"
            value={searchHistoAll}
            onChange={e => setSearchHistoAll(e.target.value)}
            aria-label="Recherche dans l'historique" />
        </div>

        {/* ── Compteur résultats + actualiser ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: P.gris }}>
            {fichesFiltrees.length} fiche{fichesFiltrees.length !== 1 ? 's' : ''}
            {q ? ` pour « ${searchHistoAll} »` : ''}
          </span>
          <button className="fb-btn fb-btn-o" style={{ padding: '7px 14px', fontSize: 12 }}
            onClick={fetchHistoAll} disabled={loadingHistoAll}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {loadingHistoAll ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>

        {/* ── Liste des fiches ── */}
        {loadingHistoAll && (
          <div style={{ textAlign: 'center', padding: 48, color: P.gris, fontSize: 13 }}>Chargement…</div>
        )}

        {!loadingHistoAll && fichesFiltrees.length === 0 && (
          <div style={{ textAlign: 'center', padding: 56, background: P.blanc, borderRadius: 14,
                        border: `1.5px solid ${P.sableF}`, color: P.gris }}>
            <Icon name="search" size={32} color={P.sableFF} />
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>Aucun résultat</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Essayez un autre terme de recherche</div>
          </div>
        )}

        {!loadingHistoAll && fichesFiltrees.map(fiche => {
          const clientName = [fiche.clients?.prenom, fiche.clients?.nom].filter(Boolean).join(' ') || '—';
          const motif      = fiche.client_info?.motif || '';
          const date       = new Date(fiche.updated_at || fiche.created_at);
          const sel        = fiche.selection || {};
          const nbFleurs   = Object.keys(sel).length;
          const score      = Math.min(nbFleurs, 10);
          const fleursListe= FLEURS.filter(f => sel[f.num]);
          const tags3      = fleursListe.slice(0, 3);
          const reste      = fleursListe.length - 3;

          return (
            <div key={fiche.id} style={{ background: P.blanc, borderRadius: 12, padding: '16px 18px',
                                         border: `1.5px solid ${P.sableF}`, marginBottom: 10,
                                         display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Score visuel */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: P.sable, flexShrink: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', border: `1.5px solid ${P.sableFF}` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: P.vert, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 8, color: P.gris }}>/ 10</div>
              </div>

              {/* Infos principales */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: P.texte }}>{clientName}</span>
                  {motif && (
                    <span style={{ fontSize: 11, color: P.gris, background: P.sable, borderRadius: 8,
                                   padding: '1px 8px', border: `1px solid ${P.sableFF}` }}>{motif}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: P.gris, marginBottom: 8 }}>
                  {date.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                  {' · '}
                  {date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                  {' · '}
                  {nbFleurs} fleur{nbFleurs !== 1 ? 's' : ''}
                </div>
                {/* Tags fleurs (3 max + reste) */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {tags3.map(f => (
                    <span key={f.num} style={{ background: P.sable, color: P.texteS, borderRadius: 10,
                                               padding: '2px 8px', fontSize: 11,
                                               border: `1px solid ${P.sableFF}` }}>{f.fr}</span>
                  ))}
                  {reste > 0 && (
                    <span style={{ background: P.ambreClair, color: P.ambre, borderRadius: 10,
                                   padding: '2px 8px', fontSize: 11, fontWeight: 700,
                                   border: `1px solid ${P.ambre}44` }}>+{reste}</span>
                  )}
                </div>
              </div>

              {/* Bouton télécharger PDF */}
              <button
                title="Télécharger la fiche praticien"
                aria-label={`Télécharger PDF de ${clientName}`}
                onClick={() => genPDF('praticien', {
                  clientName,
                  selection: fiche.selection || {},
                  doses:     fiche.doses     || {},
                  entretien: fiche.entretien || {},
                  proto:     fiche.proto     || { duree:3, prises:3, gouttes:4, volume:30 },
                  persos:    fiche.persos    || '',
                  date:      fiche.updated_at || fiche.created_at,
                })}
                style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${P.sableFF}`,
                         background: P.blanc, cursor: 'pointer', display: 'flex', alignItems: 'center',
                         justifyContent: 'center', color: P.terre, flexShrink: 0,
                         transition: 'all .18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = P.terreClair; e.currentTarget.style.borderColor = P.terre; }}
                onMouseLeave={e => { e.currentTarget.style.background = P.blanc; e.currentTarget.style.borderColor = P.sableFF; }}>
                <Icon name="pdf" size={17} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Étape 1 : Client ───────────────────────────────────────────────── */
  const renderClient = () => (
    <div className="fb-anim">
      <div style={{ background: P.blanc, borderRadius: 14, padding: 28, border: `1.5px solid ${P.sableF}`, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: P.vertClair,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 800, color: P.vert, fontFamily: 'Lora, Georgia, serif', flexShrink: 0 }}>
            {clientFullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="fb-serif" style={{ fontSize: 22, fontWeight: 700, color: P.texte }}>{clientFullName}</div>
            <div style={{ fontSize: 12, color: P.gris, marginTop: 3 }}>ID client · {clientId}</div>
          </div>
        </div>
        <div style={{ background: P.sable, borderRadius: 10, padding: '14px 18px', fontSize: 13.5,
                      color: P.texteS, lineHeight: 1.7, borderLeft: `3px solid ${P.vert}` }}>
          <strong style={{ color: P.vert }}>Bienvenue dans la Fiche Fleurs de Bach</strong><br/>
          Ce wizard vous guide en 6 étapes pour composer un mélange personnalisé.
          Naviguez librement entre les étapes — votre saisie est conservée. L'étape <strong>Historique</strong> liste toutes les séances passées.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Fleurs sélectionnées', val: selected.length, total: 39,       color: P.vert  },
          { label: 'Questions renseignées', val: entretienComplet, total: 6,        color: P.ambre },
          { label: 'Durée du protocole',    val: `${proto.duree} sem.`, total: null, color: P.terre },
        ].map(({ label, val, total, color }) => (
          <div key={label} style={{ background: P.blanc, borderRadius: 12, padding: 18,
                                    border: `1.5px solid ${P.sableF}`, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'Lora, Georgia, serif' }}>
              {val}{total !== null ? <span style={{ fontSize: 14, fontWeight: 500, color: P.grisClair }}>/{total}</span> : ''}
            </div>
            <div style={{ fontSize: 11, color: P.gris, marginTop: 5, lineHeight: 1.4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Étape 1 : Entretien ────────────────────────────────────────────── */
  const renderEntretien = () => (
    <div className="fb-anim">
      {QUESTIONS.map((q, i) => {
        const e = entretien[q.id] || { tags: [], note: '' };
        const hasContent = e.tags.length > 0 || e.note;
        return (
          <div key={q.id} style={{ background: P.blanc, borderRadius: 12, padding: '18px 20px',
                                   border: `1.5px solid ${hasContent ? P.vert + '60' : P.sableF}`,
                                   marginBottom: 14, transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: P.ambre,
                            color: P.blanc, fontSize: 13, fontWeight: 700, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: P.texte }}>{q.label}</div>
                <div style={{ fontSize: 12, color: P.gris, marginTop: 3, lineHeight: 1.5 }}>{q.question}</div>
              </div>
              {hasContent && (
                <div style={{ marginLeft: 'auto', color: P.vert, flexShrink: 0 }}>
                  <Icon name="check" size={16} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {q.tags.map(tag => (
                <button key={tag} className={`fb-tag${e.tags.includes(tag) ? ' on' : ''}`}
                  onClick={() => toggleTag(q.id, tag)} aria-pressed={e.tags.includes(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <textarea className="fb-inp fb-ta" rows={2}
              placeholder="Notes libres (observations, nuances, contexte…)"
              value={e.note || ''} onChange={ev => setNote(q.id, ev.target.value)}
              aria-label={`Notes pour ${q.label}`} />
          </div>
        );
      })}
    </div>
  );

  /* ── Étape 2 : Fleurs ───────────────────────────────────────────────── */
  const renderFleurs = () => (
    <div className="fb-anim">
      {/* Barre de filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                         color: P.gris, pointerEvents: 'none' }}>
            <Icon name="search" size={15} />
          </span>
          <input className="fb-inp" style={{ paddingLeft: 36 }} placeholder="Rechercher une fleur…"
            value={search} onChange={e => setSearch(e.target.value)} aria-label="Recherche fleur" />
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                         color: P.gris, pointerEvents: 'none' }}>
            <Icon name="filter" size={13} />
          </span>
          <select className="fb-inp" style={{ paddingLeft: 34, cursor: 'pointer', minWidth: 170 }}
            value={filtreFam} onChange={e => setFiltreFam(e.target.value)} aria-label="Filtrer par famille">
            <option value="">Toutes les familles</option>
            {FAMILLES.map(f => <option key={f} value={f}>{f} ({FLEURS.filter(fl => fl.famille === f).length})</option>)}
          </select>
        </div>
      </div>

      {/* Compteurs niveaux */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(NIV).map(([niv, { color, label }]) => (
          <span key={niv} style={{ background: color, color: P.blanc, borderRadius: 20,
                                   padding: '4px 13px', fontSize: 12, fontWeight: 700, cursor: 'default' }}>
            {label} : {selected.filter(f => selection[f.num] === niv).length}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: P.gris }}>
          {filtered.length} / {FLEURS.length} fleurs
        </span>
      </div>

      {/* Grille fleurs */}
      <div className="fb-fleurs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
        {filtered.map(f => {
          const sel = selection[f.num];
          const fs  = FAM_STYLE[f.famille] || {};
          return (
            <div key={f.num} className={`fb-fleur${sel ? ' ' + sel : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: P.grisClair }}>{String(f.num).padStart(2,'0')}</span>
                  {' '}
                  <span style={{ fontWeight: 700, fontSize: 14, color: P.texte }}>{f.fr}</span>
                  <span style={{ fontSize: 11, color: P.gris, marginLeft: 5, fontStyle: 'italic' }}>{f.name}</span>
                </div>
                <span style={{ background: fs.bg, color: fs.color, border: `1px solid ${fs.border}`,
                               borderRadius: 10, padding: '2px 8px', fontSize: 9.5, fontWeight: 700,
                               whiteSpace: 'nowrap', marginLeft: 8, letterSpacing: '.02em', flexShrink: 0 }}>
                  {f.famille}
                </span>
              </div>
              <div style={{ fontSize: 12, color: P.terre, fontWeight: 600, marginBottom: 4 }}>{f.theme}</div>
              <div style={{ fontSize: 11.5, color: P.gris, lineHeight: 1.5, marginBottom: 12 }}>{f.indication}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(NIV).map(([niv, { label }]) => (
                  <button key={niv} className={`fb-niv ${niv}${sel === niv ? ' on' : ''}`}
                    onClick={() => toggleSel(f.num, niv)} aria-pressed={sel === niv}
                    title={NIV[niv].desc}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: P.gris }}>
          <Icon name="search" size={32} color={P.sableFF} />
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>Aucun résultat</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Essayez un autre terme ou supprimez le filtre famille</div>
        </div>
      )}
    </div>
  );

  /* ── Étape 3 : Mélange ──────────────────────────────────────────────── */
  const renderMelange = () => {
    if (!selected.length) return (
      <div className="fb-anim" style={{ textAlign: 'center', padding: '64px 24px', color: P.gris }}>
        <Icon name="leaf" size={40} color={P.sableFF} />
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 14 }}>Aucune fleur sélectionnée</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Retournez à l'étape Fleurs pour commencer</div>
        <button className="fb-btn fb-btn-o" style={{ marginTop: 20 }} onClick={() => setStep(2)}>
          <Icon name="prev" size={14} /> Retour aux fleurs
        </button>
      </div>
    );

    return (
      <div className="fb-anim">
        {[
          { niv:'prio', list: fleursPrio, label:'Priorité immédiate', desc:'Adresse les urgences émotionnelles actuelles' },
          { niv:'mel',  list: fleursMel,  label:'Mélange principal',  desc:'Composition centrale du traitement' },
          { niv:'fond', list: fleursFond, label:'Pattern profond',     desc:'Travail sur les schémas de fond durables' },
        ].map(({ niv, list, label, desc }) => list.length > 0 && (
          <div key={niv} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: NIV[niv].color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: NIV[niv].color }}>{label}</span>
                <span style={{ fontSize: 12, color: P.gris, marginLeft: 8 }}>{desc}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: P.gris }}>
                {list.length} fleur{list.length > 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(f => {
                const d = doses[f.num] || 3;
                return (
                  <div key={f.num} style={{ background: P.blanc, borderRadius: 10, padding: '13px 16px',
                                            border: `1.5px solid ${NIV[niv].color}44`,
                                            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: P.grisClair, width: 22, flexShrink: 0 }}>
                      {String(f.num).padStart(2,'0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: P.texte }}>
                        {f.fr}
                        <span style={{ fontWeight: 400, fontSize: 11, color: P.gris, marginLeft: 6, fontStyle: 'italic' }}>
                          {f.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: P.gris, marginTop: 2 }}>{f.theme}</div>
                    </div>

                    {/* Compteur doses */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="fb-rnd" onClick={() => adjDose(f.num, d - 1)} aria-label="Diminuer dose">
                        <Icon name="minus" size={13} />
                      </button>
                      <div style={{ textAlign: 'center', minWidth: 44 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: NIV[niv].color, lineHeight: 1 }}>{d}</div>
                        <div style={{ fontSize: 9, color: P.gris, marginTop: 2 }}>gouttes</div>
                      </div>
                      <button className="fb-rnd" onClick={() => adjDose(f.num, d + 1)} aria-label="Augmenter dose">
                        <Icon name="plus" size={13} />
                      </button>
                    </div>

                    {/* Points visuels dose */}
                    <div style={{ display: 'flex', gap: 4 }} role="group" aria-label={`Dose : ${d} gouttes`}>
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="fb-dot" onClick={() => adjDose(f.num, i)}
                          style={{ background: i <= d ? NIV[niv].color : P.sableFF }}
                          title={`${i} goutte${i > 1 ? 's' : ''}`} />
                      ))}
                    </div>

                    {/* Supprimer */}
                    <button className="fb-rnd" style={{ borderColor: 'transparent', background: P.sable }}
                      onClick={() => toggleSel(f.num, niv)} aria-label={`Retirer ${f.fr}`} title="Retirer">
                      <Icon name="x" size={13} color={P.grisClair} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── Étape 4 : Protocole ────────────────────────────────────────────── */
  const renderProtocole = () => {
    const FIELDS = [
      { key:'duree',   label:'Durée', unit:'semaines', min:1, max:16, hint:'1 à 16 sem.' },
      { key:'prises',  label:'Prises', unit:'par jour', min:1, max:8,  hint:'1 à 8 fois/j' },
      { key:'gouttes', label:'Gouttes', unit:'par prise', min:1, max:12, hint:'1 à 12 gtt' },
      { key:'volume',  label:'Volume', unit:'ml (flacon)', min:10, max:100, hint:'10 à 100 ml' },
    ];
    const totalGouttes = proto.prises * proto.gouttes * proto.duree * 7;

    return (
      <div className="fb-anim">
        <div style={{ background: P.blanc, borderRadius: 14, padding: 26, border: `1.5px solid ${P.sableF}`, marginBottom: 18 }}>
          <div className="fb-serif" style={{ fontSize: 17, fontWeight: 600, color: P.texte, marginBottom: 22 }}>
            Configuration du protocole
          </div>
          <div className="fb-proto-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
            {FIELDS.map(({ key, label, unit, min, max, hint }) => (
              <div key={key} style={{ background: P.sable, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: P.terre, marginBottom: 12, letterSpacing: '.02em' }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <button className="fb-rnd" onClick={() => adjProto(key, -1, min, max)} aria-label={`Diminuer ${label}`}>
                    <Icon name="minus" size={13} />
                  </button>
                  <input type="number" min={min} max={max} value={proto[key]}
                    aria-label={label}
                    onChange={e => setProto(p => ({ ...p, [key]: Math.max(min, Math.min(max, parseInt(e.target.value) || min)) }))}
                    style={{ width: 56, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${P.sableFF}`,
                             fontSize: 20, fontWeight: 800, textAlign: 'center', fontFamily: 'Lora, Georgia, serif',
                             color: P.texte, outline: 'none', background: P.blanc }} />
                  <button className="fb-rnd" onClick={() => adjProto(key, +1, min, max)} aria-label={`Augmenter ${label}`}>
                    <Icon name="plus" size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: P.gris }}>{unit}</div>
                <div style={{ fontSize: 9.5, color: P.grisClair, marginTop: 3 }}>{hint}</div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div style={{ background: P.vertClair, borderRadius: 10, padding: 16, border: `1px solid ${P.vert}30` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.vert, marginBottom: 12, letterSpacing: '.04em' }}>
              RÉSUMÉ DU TRAITEMENT
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {[
                { l:'Durée totale',           v:`${proto.duree} semaine${proto.duree > 1 ? 's' : ''}` },
                { l:'Total de prises',         v:`${proto.prises * proto.duree * 7} prises` },
                { l:'Gouttes par prise',       v:`${proto.gouttes} gouttes` },
                { l:'Consommation estimée',    v:`${totalGouttes} gouttes` },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: P.blanc, borderRadius: 8, padding: '10px 14px',
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: P.gris }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: P.vert }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes personnalisées */}
        <div style={{ background: P.blanc, borderRadius: 14, padding: 24, border: `1.5px solid ${P.sableF}` }}>
          <label htmlFor="fb-persos" style={{ display: 'block', fontWeight: 700, fontSize: 14, color: P.texte, marginBottom: 6 }}>
            Notes & conseils personnalisés
          </label>
          <div style={{ fontSize: 12, color: P.gris, marginBottom: 12 }}>
            Recommandations spécifiques, mode de prise, précautions, compléments…
          </div>
          <textarea id="fb-persos" className="fb-inp fb-ta" style={{ height: 110 }}
            placeholder="Ex : Prendre les fleurs à jeun, 10 min avant les repas. Diluer dans un verre d'eau si sensible au goût. Maintenir la prise même si amélioration, jusqu'à la fin du protocole…"
            value={persos} onChange={e => setPersos(e.target.value)} />
        </div>
      </div>
    );
  };

  /* ── Étape 5 : Synthèse ─────────────────────────────────────────────── */
  const renderSynthese = () => (
    <div className="fb-anim">
      {/* En-tête récap */}
      <div style={{ background: P.blanc, borderRadius: 14, padding: 26, border: `1.5px solid ${P.sableF}`, marginBottom: 16 }}>
        <div style={{ borderBottom: `1.5px solid ${P.sableF}`, paddingBottom: 16, marginBottom: 20 }}>
          <div className="fb-serif" style={{ fontSize: 22, fontWeight: 700, color: P.texte }}>{clientFullName}</div>
          <div style={{ fontSize: 12, color: P.gris, marginTop: 4 }}>
            Fiche Fleurs de Bach · {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>

        <div className="fb-synth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
          {[
            { label:'Fleurs au total', val: selected.length, color: P.vert  },
            { label:'Priorité',        val: fleursPrio.length, color: P.ambre },
            { label:'Pattern profond', val: fleursFond.length, color: P.terre },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: P.sable, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Lora, Georgia, serif' }}>{val}</div>
              <div style={{ fontSize: 11, color: P.gris, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Chips par niveau */}
        {[['prio',fleursPrio,'Priorité immédiate'],['mel',fleursMel,'Mélange'],['fond',fleursFond,'Pattern profond']].map(
          ([niv, list, lbl]) => list.length > 0 && (
            <div key={niv} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
                            color: NIV[niv].color, marginBottom: 8 }}>{lbl}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.map(f => (
                  <span key={f.num} style={{ background: `${NIV[niv].color}18`, color: NIV[niv].color,
                                             border: `1px solid ${NIV[niv].color}44`,
                                             borderRadius: 20, padding: '4px 13px', fontSize: 12.5, fontWeight: 700 }}>
                    {f.fr}
                    <span style={{ fontWeight: 500, opacity: .75, marginLeft: 5 }}>
                      {doses[f.num] || 3} gtt
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )
        )}

        {!selected.length && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: P.gris, fontSize: 13 }}>
            Aucune fleur sélectionnée — retournez à l'étape Fleurs.
          </div>
        )}
      </div>

      {/* Protocole recap */}
      <div style={{ background: P.blanc, borderRadius: 14, padding: 24, border: `1.5px solid ${P.sableF}`, marginBottom: 16 }}>
        <div className="fb-serif" style={{ fontSize: 16, fontWeight: 600, color: P.texte, marginBottom: 16 }}>Protocole prescrit</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: persos ? 14 : 0 }}>
          {[
            { l:'Durée',        v:`${proto.duree} sem.` },
            { l:'Prises/j',     v: proto.prises },
            { l:'Gouttes/prise',v: proto.gouttes },
            { l:'Flacon',       v:`${proto.volume} ml` },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: P.sable, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: P.terre, fontFamily: 'Lora, Georgia, serif' }}>{v}</div>
              <div style={{ fontSize: 11, color: P.gris, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        {persos && (
          <div style={{ background: P.sable, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: P.texteS, lineHeight: 1.65 }}>
            {persos}
          </div>
        )}
      </div>

      {/* Entretien recap */}
      {entretienComplet > 0 && (
        <div style={{ background: P.blanc, borderRadius: 14, padding: 24, border: `1.5px solid ${P.sableF}`, marginBottom: 20 }}>
          <div className="fb-serif" style={{ fontSize: 16, fontWeight: 600, color: P.texte, marginBottom: 16 }}>Notes d'entretien</div>
          {QUESTIONS.map(q => {
            const e = entretien[q.id];
            if (!e || (!e.tags.length && !e.note)) return null;
            return (
              <div key={q.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${P.sableF}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: P.terre, marginBottom: 7 }}>{q.label}</div>
                {e.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: e.note ? 7 : 0 }}>
                    {e.tags.map(tag => (
                      <span key={tag} style={{ background: P.ambreClair, color: P.ambre, borderRadius: 12,
                                               padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                )}
                {e.note && <div style={{ fontSize: 12.5, color: P.gris, fontStyle: 'italic', lineHeight: 1.55 }}>{e.note}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Sauvegarde */}
      <div style={{ background: P.blanc, borderRadius: 14, padding: 24, border: `1.5px solid ${P.sableF}`, marginBottom: 16 }}>
        <div className="fb-serif" style={{ fontSize: 16, fontWeight: 600, color: P.texte, marginBottom: 14 }}>Enregistrement</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="fb-btn fb-btn-v" onClick={handleSave} disabled={saving || saved}
            aria-busy={saving}>
            {saved
              ? <><Icon name="check" size={15} /> Sauvegardé</>
              : saving
                ? 'Enregistrement…'
                : <><Icon name="save" size={15} /> Sauvegarder la fiche</>}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: P.vert, fontWeight: 600 }}>
              Fiche enregistrée dans Supabase (table fiches_bach)
            </span>
          )}
          {saveError && (
            <span style={{ fontSize: 12, color: '#C0392B', padding: '6px 12px', background: '#FDECEA',
                           borderRadius: 8, border: '1px solid #E8A09A' }}>
              Erreur : {saveError}
            </span>
          )}
        </div>
      </div>

      {/* Génération PDF */}
      <div style={{ background: P.blanc, borderRadius: 14, padding: 24, border: `1.5px solid ${P.sableF}` }}>
        <div className="fb-serif" style={{ fontSize: 16, fontWeight: 600, color: P.texte, marginBottom: 6 }}>Générer un PDF</div>
        <div style={{ fontSize: 12, color: P.gris, marginBottom: 16 }}>Trois formats adaptés à chaque usage</div>
        <div className="fb-pdf-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { type:'praticien',  label:'Version Praticien', desc:'Complet · entretien + notes',  bg: P.vert  },
            { type:'client',     label:'Version Client',    desc:'Pédagogique · vulgarisé',       bg: P.ambre },
            { type:'ordonnance', label:'Ordonnance',        desc:'Format officiel · simplifié',   bg: P.terre },
          ].map(({ type, label, desc, bg }) => (
            <button key={type} onClick={() => genPDF(type)}
              style={{ flex: 1, minWidth: 160, padding: '15px 18px', borderRadius: 10, background: bg,
                       color: P.blanc, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                       transition: 'opacity .2s', display: 'flex', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13 }}>
                <Icon name="pdf" size={15} /> {label}
              </div>
              <div style={{ fontSize: 11, opacity: .8 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Étape 6 : Historique ───────────────────────────────────────────── */
  const rechargerSeance = useCallback((fiche) => {
    setSelection(fiche.selection || {});
    setDoses(fiche.doses || {});
    setEntretien(fiche.entretien || {});
    setProto(fiche.proto || { duree: 3, prises: 3, gouttes: 4, volume: 30 });
    setPersos(fiche.persos || '');
    setSaved(false);
    setSaveError('');
    setStep(1); // retour sur Client (step 0 = Historique global)
  }, []);

  const renderHistorique = () => (
    <div className="fb-anim">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="fb-serif" style={{ fontSize: 18, fontWeight: 700, color: P.texte }}>Séances précédentes</div>
          <div style={{ fontSize: 12, color: P.gris, marginTop: 3 }}>{historique.length} fiche{historique.length !== 1 ? 's' : ''} enregistrée{historique.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="fb-btn fb-btn-o" onClick={fetchHistorique} disabled={loadingHisto} aria-label="Actualiser l'historique">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {loadingHisto ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      {loadingHisto && (
        <div style={{ textAlign: 'center', padding: 48, color: P.gris }}>
          <div style={{ fontSize: 13 }}>Chargement de l'historique…</div>
        </div>
      )}

      {!loadingHisto && historique.length === 0 && (
        <div style={{ textAlign: 'center', padding: 56, color: P.gris,
                      background: P.blanc, borderRadius: 14, border: `1.5px solid ${P.sableF}` }}>
          <Icon name="leaf" size={36} color={P.sableFF} />
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>Aucune séance enregistrée</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Les fiches sauvegardées apparaîtront ici</div>
        </div>
      )}

      {!loadingHisto && historique.map((fiche, idx) => {
        const date     = new Date(fiche.created_at);
        const selObj   = fiche.selection || {};
        const nbFleurs = Object.keys(selObj).length;
        const nbPrio   = Object.values(selObj).filter(v => v === 'prio').length;
        const nbMel    = Object.values(selObj).filter(v => v === 'mel').length;
        const nbFond   = Object.values(selObj).filter(v => v === 'fond').length;
        const proto_   = fiche.proto || {};
        const isActive = idx === 0;

        return (
          <div key={fiche.id} style={{ background: P.blanc, borderRadius: 12,
                                       border: `1.5px solid ${isActive ? P.vert + '60' : P.sableF}`,
                                       padding: '18px 20px', marginBottom: 12,
                                       transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              {/* Date & badge */}
              <div style={{ minWidth: 110 }}>
                {isActive && (
                  <span style={{ display: 'inline-block', background: P.vert, color: P.blanc,
                                 fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '2px 8px',
                                 marginBottom: 6, letterSpacing: '.05em' }}>DERNIÈRE</span>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: P.texte }}>
                  {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, color: P.gris, marginTop: 2 }}>
                  {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Stats fleurs */}
              <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: P.texte }}>
                  {nbFleurs} fleur{nbFleurs !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {nbPrio > 0 && (
                    <span style={{ background: P.ambreClair, color: P.ambre, borderRadius: 12,
                                   padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                      {nbPrio} priorité
                    </span>
                  )}
                  {nbMel > 0 && (
                    <span style={{ background: P.vertClair, color: P.vert, borderRadius: 12,
                                   padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                      {nbMel} mélange
                    </span>
                  )}
                  {nbFond > 0 && (
                    <span style={{ background: P.terreClair, color: P.terre, borderRadius: 12,
                                   padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                      {nbFond} fond
                    </span>
                  )}
                </div>
                {proto_.duree && (
                  <span style={{ fontSize: 11, color: P.gris }}>
                    · {proto_.duree} sem. · {proto_.prises}×/j · {proto_.gouttes} gtt
                  </span>
                )}
              </div>

              {/* Bouton recharger */}
              <button className="fb-btn fb-btn-a" style={{ padding: '8px 16px', fontSize: 12 }}
                onClick={() => rechargerSeance(fiche)}
                title="Recharger cette séance dans le wizard">
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                Recharger
              </button>
            </div>

            {/* Noms des fleurs */}
            {nbFleurs > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {FLEURS.filter(f => selObj[f.num]).map(f => (
                  <span key={f.num} style={{ background: P.sable, color: P.texteS, borderRadius: 10,
                                             padding: '2px 9px', fontSize: 11, border: `1px solid ${P.sableFF}` }}>
                    {f.fr}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     RENDU PRINCIPAL
  ═══════════════════════════════════════════════════════════════════════ */
  const STEP_CONTENT = [renderHistoGlobal, renderClient, renderEntretien, renderFleurs, renderMelange, renderProtocole, renderSynthese, renderHistorique];

  return (
    <div className="fb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fb-scroll" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px 56px' }}>

        {/* ── En-tête ── */}
        <div style={{ padding: '30px 0 24px', borderBottom: `1.5px solid ${P.sableF}`, marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Icon name="leaf" size={20} color={P.vert} />
            <h1 className="fb-serif" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: P.vert }}>
              Fleurs de Bach
            </h1>
          </div>
          <div style={{ fontSize: 13, color: P.gris, marginLeft: 30 }}>
            Fiche personnalisée ·{' '}
            <strong style={{ color: P.texteS }}>{clientFullName}</strong>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div style={{ display: 'flex', marginBottom: 34, position: 'relative' }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            return (
              <button key={s} className="fb-step" onClick={() => setStep(i)} aria-current={isActive ? 'step' : undefined}>
                {/* Ligne connecteur */}
                {i < STEPS.length - 1 && (
                  <div className="fb-step-line" style={{ background: i < step ? P.ambre : P.sableFF }} />
                )}
                {/* Point */}
                <div className="fb-step-dot" style={{
                  background: isActive ? P.vert : isDone ? P.ambre : P.sableFF,
                  color:      isActive ? P.blanc : isDone ? P.blanc : P.grisClair,
                  boxShadow:  isActive ? `0 0 0 4px ${P.vertClair}` : 'none',
                }}>
                  {isDone ? <Icon name="check" size={13} /> : i + 1}
                </div>
                {/* Label */}
                <div className="fb-step-label" style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? P.vert : isDone ? P.ambre : P.grisClair,
                  whiteSpace: 'nowrap',
                }}>
                  {s}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Contenu ── */}
        {STEP_CONTENT[step]?.()}

        {/* ── Navigation ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 34, paddingTop: 22, borderTop: `1.5px solid ${P.sableF}` }}>
          <button className="fb-btn fb-btn-o" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            onClick={() => setStep(s => s - 1)}>
            <Icon name="prev" size={14} /> Précédent
          </button>
          <span style={{ fontSize: 12, color: P.grisClair }}>
            {step + 1} / {STEPS.length}
          </span>
          <button className="fb-btn fb-btn-v" style={{ visibility: step === STEPS.length - 1 ? 'hidden' : 'visible' }}
            onClick={() => setStep(s => s + 1)}>
            Suivant <Icon name="next" size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
