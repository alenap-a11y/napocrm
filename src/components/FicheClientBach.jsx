import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/* ═══ PALETTE ═══════════════════════════════════════════════════════════ */
const P = {
  vert: '#3D5A3E', ambre: '#A0622A', terre: '#8B5E3C', sable: '#FBF8F4',
  sableF: '#EDE8E0', texte: '#2C1F0E', gris: '#9B8B7A', grisClair: '#C8BDB4',
  vertClair: '#EAF0EA', ambreClair: '#FDF3EA', terreClair: '#F5EDE6',
};

/* ═══ CSS INJECTÉ ════════════════════════════════════════════════════════ */
const CSS = `
  .fb-root{box-sizing:border-box;font-family:'Georgia',serif;color:#2C1F0E;background:#FBF8F4;min-height:100vh}
  .fb-root *,.fb-root *::before,.fb-root *::after{box-sizing:inherit}
  .fb-sans{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}

  .fb-tag{cursor:pointer;padding:4px 12px;border-radius:20px;border:1.5px solid #C8BDB4;
    background:white;color:#8B5E3C;font-size:12px;font-family:inherit;transition:all .2s;white-space:nowrap}
  .fb-tag:hover{border-color:#A0622A;color:#A0622A;background:#FDF3EA}
  .fb-tag.on{background:#A0622A;border-color:#A0622A;color:white}

  .fb-card{border-radius:12px;border:1.5px solid #EDE8E0;background:white;padding:14px 16px;transition:all .2s}
  .fb-card.mel{border-color:#3D5A3E!important;background:#EAF0EA!important}
  .fb-card.fond{border-color:#8B5E3C!important;background:#F5EDE6!important}
  .fb-card.prio{border-color:#A0622A!important;background:#FDF3EA!important}

  .fb-sel{padding:3px 9px;border-radius:12px;border:1.5px solid;font-size:11px;font-weight:700;
    cursor:pointer;transition:all .15s;font-family:inherit;background:transparent}
  .fb-sel.mel{border-color:#3D5A3E;color:#3D5A3E}
  .fb-sel.mel.on,.fb-sel.mel:hover{background:#3D5A3E;color:white}
  .fb-sel.fond{border-color:#8B5E3C;color:#8B5E3C}
  .fb-sel.fond.on,.fb-sel.fond:hover{background:#8B5E3C;color:white}
  .fb-sel.prio{border-color:#A0622A;color:#A0622A}
  .fb-sel.prio.on,.fb-sel.prio:hover{background:#A0622A;color:white}

  .fb-inp{width:100%;padding:10px 14px;border:1.5px solid #EDE8E0;border-radius:8px;
    font-size:13px;background:white;color:#2C1F0E;outline:none;font-family:inherit;transition:border .2s}
  .fb-inp:focus{border-color:#A0622A}
  .fb-ta{resize:vertical;min-height:72px}

  .fb-btn{padding:11px 26px;border-radius:10px;font-size:14px;font-weight:700;
    cursor:pointer;transition:all .2s;font-family:inherit;border:none}
  .fb-btn-p{background:#3D5A3E;color:white}
  .fb-btn-p:hover{background:#2E4430}
  .fb-btn-p:disabled{opacity:.5;cursor:not-allowed}
  .fb-btn-s{background:transparent;color:#3D5A3E;border:1.5px solid #3D5A3E!important}
  .fb-btn-s:hover{background:#EAF0EA}
  .fb-btn-a{background:#A0622A;color:white}
  .fb-btn-a:hover{background:#8B5222}
  .fb-btn-t{background:#8B5E3C;color:white}
  .fb-btn-t:hover{background:#724D2F}

  .fb-circ{width:28px;height:28px;border-radius:50%;border:1.5px solid #EDE8E0;
    background:white;cursor:pointer;font-size:15px;display:flex;align-items:center;
    justify-content:center;transition:all .15s;color:#2C1F0E;font-family:inherit}
  .fb-circ:hover{border-color:#A0622A;color:#A0622A}

  .fb-dot{width:10px;height:10px;border-radius:50%;background:#EDE8E0;cursor:pointer;transition:background .15s}

  @keyframes fb-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .fb-anim{animation:fb-in .25s ease}

  @media(max-width:640px){
    .fb-grid-fleurs{grid-template-columns:1fr!important}
    .fb-grid-proto{grid-template-columns:1fr 1fr!important}
    .fb-grid-stats{grid-template-columns:1fr 1fr!important}
    .fb-steps button{font-size:10px!important;padding:8px 4px!important}
  }
`;

/* ═══ 39 FLEURS DE BACH ══════════════════════════════════════════════════ */
const FLEURS = [
  // Peur
  {num:1,name:'Rock Rose',fr:'Hélianthème',famille:'Peur',couleur:'#C0392B',theme:'Terreur et panique',indication:'Terreur soudaine, cauchemars, crises de panique extrême'},
  {num:2,name:'Mimulus',fr:'Mimule',famille:'Peur',couleur:'#C0392B',theme:'Peur précise et identifiable',indication:'Peurs du quotidien connues : maladie, mort, animaux, timidité'},
  {num:3,name:'Cherry Plum',fr:'Prunus',famille:'Peur',couleur:'#C0392B',theme:'Peur de perdre le contrôle',indication:'Crainte de céder à des impulsions violentes, peur de la folie'},
  {num:4,name:'Aspen',fr:'Tremble',famille:'Peur',couleur:'#C0392B',theme:'Peur vague et inexpliquée',indication:'Pressentiments, appréhensions sans raison connue, frissons'},
  {num:5,name:'Red Chestnut',fr:'Marronnier Rouge',famille:'Peur',couleur:'#C0392B',theme:'Anxiété pour les autres',indication:'Inquiétude excessive pour les proches, anticipe les catastrophes'},
  // Incertitude
  {num:6,name:'Cerato',fr:'Cérato',famille:'Incertitude',couleur:'#8E44AD',theme:'Manque de confiance en son jugement',indication:'Doute de soi, cherche constamment la validation des autres'},
  {num:7,name:'Scleranthus',fr:'Scléranthe',famille:'Incertitude',couleur:'#8E44AD',theme:'Indécision entre deux options',indication:'Hésitation chronique, humeur fluctuante, incapacité à choisir'},
  {num:8,name:'Gentian',fr:'Gentiane',famille:'Incertitude',couleur:'#8E44AD',theme:'Découragement et doute',indication:'Découragement après un obstacle, scepticisme, doute facile'},
  {num:9,name:'Gorse',fr:'Ajonc',famille:'Incertitude',couleur:'#8E44AD',theme:'Désespoir et absence d\'espoir',indication:'Sentiment que rien ne peut aider, résignation profonde'},
  {num:10,name:'Hornbeam',fr:'Charme',famille:'Incertitude',couleur:'#8E44AD',theme:'Fatigue mentale et procrastination',indication:'Lassitude au lever, doute de sa capacité à accomplir les tâches'},
  {num:11,name:'Wild Oat',fr:'Avoine Sauvage',famille:'Incertitude',couleur:'#8E44AD',theme:'Manque de direction de vie',indication:'Ne trouve pas sa voie, ambitions vagues, insatisfaction profonde'},
  // Présent
  {num:12,name:'Clematis',fr:'Clématite',famille:'Présent',couleur:'#2980B9',theme:'Rêverie et détachement',indication:'Distraction, somnolence, vie dans les rêves plutôt que le présent'},
  {num:13,name:'Honeysuckle',fr:'Chèvrefeuille',famille:'Présent',couleur:'#2980B9',theme:'Nostalgie du passé',indication:'Ancré dans le passé, regrets envahissants, incapacité à avancer'},
  {num:14,name:'Wild Rose',fr:'Églantier',famille:'Présent',couleur:'#2980B9',theme:'Résignation et apathie',indication:'Acceptation passive de la vie, sans motivation ni effort'},
  {num:15,name:'Olive',fr:'Olive',famille:'Présent',couleur:'#2980B9',theme:'Épuisement total',indication:'Fatigue profonde après longue maladie ou effort mental/physique intense'},
  {num:16,name:'White Chestnut',fr:'Marronnier Blanc',famille:'Présent',couleur:'#2980B9',theme:'Pensées obsessionnelles',indication:'Ruminations mentales, pensées intrusives en boucle, tourments'},
  {num:17,name:'Mustard',fr:'Moutarde',famille:'Présent',couleur:'#2980B9',theme:'Dépression sans raison',indication:'Mélancolie soudaine sans cause identifiable, nuage sombre qui arrive et repart'},
  {num:18,name:'Chestnut Bud',fr:'Bourgeon de Marronnier',famille:'Présent',couleur:'#2980B9',theme:'Ne pas apprendre de ses erreurs',indication:'Répétition des mêmes erreurs, manque d\'observation et d\'attention'},
  // Solitude
  {num:19,name:'Water Violet',fr:'Violette d\'Eau',famille:'Solitude',couleur:'#16A085',theme:'Fierté et isolement',indication:'Tendance à s\'isoler, difficulté à demander de l\'aide, distance'},
  {num:20,name:'Impatiens',fr:'Impatiente',famille:'Solitude',couleur:'#16A085',theme:'Impatience et irritabilité',indication:'Rapidité d\'action, irritation devant la lenteur des autres'},
  {num:21,name:'Heather',fr:'Bruyère',famille:'Solitude',couleur:'#16A085',theme:'Centré sur soi',indication:'Besoin intense d\'attention, solitude difficile à supporter, bavardage'},
  // Hypersensibilité
  {num:22,name:'Agrimony',fr:'Agrimonie',famille:'Hypersensibilité',couleur:'#D35400',theme:'Torture intérieure masquée',indication:'Cache son anxiété derrière joie et humour, fuit les conflits'},
  {num:23,name:'Centaury',fr:'Centaurée',famille:'Hypersensibilité',couleur:'#D35400',theme:'Faiblesse de volonté',indication:'Difficulté à dire non, servitude, oubli de soi au profit des autres'},
  {num:24,name:'Walnut',fr:'Noyer',famille:'Hypersensibilité',couleur:'#D35400',theme:'Transition et protection',indication:'Lors de changements importants, protection contre les influences extérieures'},
  {num:25,name:'Holly',fr:'Houx',famille:'Hypersensibilité',couleur:'#D35400',theme:'Jalousie et colère',indication:'Jalousie, envie, méfiance, haine sans raison apparente'},
  // Désespoir
  {num:26,name:'Larch',fr:'Mélèze',famille:'Désespoir',couleur:'#7F8C8D',theme:'Manque de confiance en soi',indication:'Convaincu d\'échouer avant d\'essayer, sentiment d\'infériorité'},
  {num:27,name:'Pine',fr:'Pin',famille:'Désespoir',couleur:'#7F8C8D',theme:'Culpabilité et auto-critique',indication:'Se blâme excessivement, s\'excuse constamment, perfectionnisme culpabilisant'},
  {num:28,name:'Elm',fr:'Orme',famille:'Désespoir',couleur:'#7F8C8D',theme:'Accablement temporaire',indication:'Submergé ponctuellement par ses responsabilités, doute de sa capacité'},
  {num:29,name:'Sweet Chestnut',fr:'Châtaignier',famille:'Désespoir',couleur:'#7F8C8D',theme:'Désespoir extrême',indication:'Limite extrême de l\'endurance, sentiment que tout est fini, nuit obscure'},
  {num:30,name:'Star of Bethlehem',fr:'Étoile de Bethléem',famille:'Désespoir',couleur:'#7F8C8D',theme:'Choc et traumatisme',indication:'Séquelles de choc, traumatisme passé ou récent, deuil non résolu'},
  {num:31,name:'Willow',fr:'Saule',famille:'Désespoir',couleur:'#7F8C8D',theme:'Amertume et rancœur',indication:'Se sent victime du destin, ressentiment, difficulté à pardonner'},
  {num:32,name:'Oak',fr:'Chêne',famille:'Désespoir',couleur:'#7F8C8D',theme:'Lutte obstinée malgré épuisement',indication:'Continue de lutter sans se ménager, sens du devoir excessif'},
  {num:33,name:'Crab Apple',fr:'Pommier Sauvage',famille:'Désespoir',couleur:'#7F8C8D',theme:'Sentiment d\'impureté',indication:'Obsession de la propreté, honte du corps, perfectionnisme ritualisé'},
  // Souci pour autrui
  {num:34,name:'Chicory',fr:'Chicorée',famille:'Autrui',couleur:'#1E8BC3',theme:'Possessivité et égocentrisme',indication:'Amour possessif, manipulation affective, besoin d\'être nécessaire'},
  {num:35,name:'Vervain',fr:'Verveine',famille:'Autrui',couleur:'#1E8BC3',theme:'Excès d\'enthousiasme',indication:'Fanatisme, inflexibilité, sur-tension nerveuse, prosélytisme'},
  {num:36,name:'Vine',fr:'Vigne',famille:'Autrui',couleur:'#1E8BC3',theme:'Autoritarisme et domination',indication:'Dominance, tyrannie bienveillante, certitude absolue d\'avoir raison'},
  {num:37,name:'Beech',fr:'Hêtre',famille:'Autrui',couleur:'#1E8BC3',theme:'Intolérance et esprit critique',indication:'Intolérance aux défauts des autres, perfectionnisme critique'},
  {num:38,name:'Rock Water',fr:'Eau de Roche',famille:'Autrui',couleur:'#1E8BC3',theme:'Rigidité et idéaux austères',indication:'Perfectionnisme envers soi-même, ascétisme, idéaux inflexibles'},
  // Composite
  {num:39,name:'Rescue Remedy',fr:'Remède d\'Urgence',famille:'Composite',couleur:'#E74C3C',theme:'Urgence émotionnelle',indication:'Choc, panique, stress intense — composite: Rock Rose, Impatiens, Clematis, Star of Bethlehem, Cherry Plum'},
];

/* ═══ FAMILLES ═══════════════════════════════════════════════════════════ */
const FAMILLES = ['Peur','Incertitude','Présent','Solitude','Hypersensibilité','Désespoir','Autrui','Composite'];
const FAM_BG = {
  Peur:'#FDECEA',Incertitude:'#F5EDF8',Présent:'#EAF3FB',Solitude:'#E8F6F3',
  Hypersensibilité:'#FEF0E7',Désespoir:'#F4F4F4',Autrui:'#EAF4FB',Composite:'#FDECEA',
};
const NIV_COLOR = {mel:'#3D5A3E',fond:'#8B5E3C',prio:'#A0622A'};
const NIV_LABEL = {mel:'Mélange',fond:'Fond',prio:'Priorité'};

/* ═══ QUESTIONS D'ENTRETIEN ══════════════════════════════════════════════ */
const QUESTIONS = [
  {id:'humeur',label:'État émotionnel',question:'Comment décrivez-vous votre état émotionnel général en ce moment ?',
   tags:['Anxieux·se','Triste','En colère','Apathique','Épuisé·e','Serein·e','Confus·e','Enthousiaste','Découragé·e','Tendu·e','Déprimé·e','Joyeux·se']},
  {id:'peurs',label:'Peurs et angoisses',question:'Avez-vous des peurs ou inquiétudes particulières en ce moment ?',
   tags:['Peur vague','Peur précise','Peur pour les proches','Peur de l\'avenir','Peur du jugement','Peur de perdre contrôle','Panique','Angoisse nocturne','Aucune peur']},
  {id:'relations',label:'Relations',question:'Comment vivez-vous vos relations avec les autres en ce moment ?',
   tags:['Isolement','Conflits fréquents','Dépendance affective','Jalousie','Solitude subie','Don excessif de soi','Incompris·e','Harmonie','Relation de contrôle']},
  {id:'energie',label:'Énergie et vitalité',question:'Comment évaluez-vous votre énergie et votre motivation au quotidien ?',
   tags:['Épuisé·e total','Fatigue chronique','Procrastination','Motivation fluctuante','Suractivité','Bonne énergie','Léthargie','Nervosité','Fatigue matinale']},
  {id:'mental',label:'État mental',question:'Avez-vous des pensées récurrentes ou des difficultés de concentration ?',
   tags:['Ruminations','Indécision','Pensées négatives','Confusion mentale','Nostalgie envahissante','Clarté d\'esprit','Doute de soi','Pensées obsessionnelles','Rêverie excessive']},
  {id:'vie',label:'Vie et transitions',question:'Y a-t-il des changements ou transitions importants dans votre vie actuellement ?',
   tags:['Changement majeur','Deuil','Séparation','Nouvelle activité','Manque de sens','Stabilité','En transition','Traumatisme récent','Nouvelle naissance','Renouveau']},
];

/* ═══ COMPOSANT PRINCIPAL ════════════════════════════════════════════════ */
export default function FicheClientBach({ clientId, clientNom }) {
  const [step, setStep]           = useState(0);
  const [selection, setSelection] = useState({});   // {num: 'mel'|'fond'|'prio'}
  const [doses, setDoses]         = useState({});   // {num: 1-6}
  const [entretien, setEntretien] = useState({});   // {qid: {tags:[], note:''}}
  const [proto, setProto]         = useState({duree:3, prises:3, gouttes:4, volume:30});
  const [persos, setPersos]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [search, setSearch]       = useState('');
  const [famille, setFamille]     = useState('');

  const STEPS = ['Client','Entretien','Fleurs','Mélange','Protocole','Synthèse'];

  /* ── Computed ─────────────────────────────────────────────────────────── */
  const selected   = useMemo(() => FLEURS.filter(f => selection[f.num]), [selection]);
  const byNiv      = niv => selected.filter(f => selection[f.num] === niv);
  const fleursMel  = useMemo(() => byNiv('mel'),  [selected]);  // eslint-disable-line
  const fleursFond = useMemo(() => byNiv('fond'), [selected]);  // eslint-disable-line
  const fleursPrio = useMemo(() => byNiv('prio'), [selected]);  // eslint-disable-line

  const filtered = useMemo(() => FLEURS.filter(f => {
    const q = search.toLowerCase();
    const ms = !q || [f.name,f.fr,f.theme,f.indication].some(s => s.toLowerCase().includes(q));
    const mf = !famille || f.famille === famille;
    return ms && mf;
  }), [search, famille]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const toggleSel = (num, niv) => {
    setSelection(prev => {
      if (prev[num] === niv) { const n={...prev}; delete n[num]; return n; }
      return {...prev,[num]:niv};
    });
    if (!doses[num]) setDoses(p => ({...p,[num]:3}));
  };

  const adjDose = (num, d) => setDoses(p => ({...p,[num]:Math.max(1,Math.min(6,d))}));

  const toggleTag = (qid, tag) => setEntretien(prev => {
    const cur = prev[qid] || {tags:[],note:''};
    const tags = cur.tags.includes(tag) ? cur.tags.filter(t=>t!==tag) : [...cur.tags,tag];
    return {...prev,[qid]:{...cur,tags}};
  });

  const setNote = (qid, note) => setEntretien(prev => {
    const cur = prev[qid] || {tags:[],note:''};
    return {...prev,[qid]:{...cur,note}};
  });

  /* ── Supabase ──────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const {error} = await supabase.from('fiches_bach').insert({
        client_id: clientId,
        selection, doses, entretien, proto, persos,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
    } catch(err) {
      alert('Erreur sauvegarde : ' + err.message);
    } finally { setSaving(false); }
  };

  /* ── PDF ───────────────────────────────────────────────────────────────── */
  const genPDF = async (type) => {
    const {default:jsPDF} = await import('jspdf');
    const doc = new jsPDF({orientation:'p',unit:'mm',format:'a4'});
    const W=210, M=20;
    const colors = {praticien:[61,90,62], client:[160,98,42], ordonnance:[139,94,60]};
    const [r,g,b] = colors[type];

    // Header band
    doc.setFillColor(r,g,b);
    doc.rect(0,0,W,20,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(255,255,255);
    const titles = {praticien:'FICHE PRATICIEN — FLEURS DE BACH',client:'VOTRE MÉLANGE — FLEURS DE BACH',ordonnance:'ORDONNANCE — FLEURS DE BACH'};
    doc.text(titles[type], M, 13);

    let y = 28;
    const h = (txt,size=11,c=[44,31,14]) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(size); doc.setTextColor(...c); doc.text(txt,M,y);
    };
    const t = (txt,x=M,size=10,c=[44,31,14]) => {
      doc.setFont('helvetica','normal'); doc.setFontSize(size); doc.setTextColor(...c);
      const lines = doc.splitTextToSize(String(txt), W-M-x+M);
      lines.forEach(l => { doc.text(l,x,y); y+=5; });
    };
    const hr = () => { doc.setDrawColor(200,189,180); doc.line(M,y,W-M,y); y+=6; };

    // Client info
    h(`Client : ${clientNom || '—'}`,12); y+=6;
    t(`Date : ${new Date().toLocaleDateString('fr-FR')}`,M,9,[155,139,122]); y+=4;
    hr();

    // Entretien (praticien only)
    if (type === 'praticien') {
      h('ENTRETIEN',11,[r,g,b]); y+=7;
      QUESTIONS.forEach(q => {
        const e = entretien[q.id];
        if (!e || (!e.tags.length && !e.note)) return;
        t(`• ${q.label}`,M,10,[139,94,60]); y+=1;
        if (e.tags.length) t(`  ${e.tags.join(', ')}`,M,9,[100,80,60]);
        if (e.note) t(`  ${e.note}`,M,9,[120,100,80]);
        y+=2;
      });
      hr();
    }

    // Composition
    h(type==='client'?'FLEURS SÉLECTIONNÉES':'COMPOSITION',11,[r,g,b]); y+=7;
    [['prio','Priorité immédiate'],['mel','Mélange'],['fond','Pattern profond']].forEach(([niv,lbl]) => {
      const fl = selected.filter(f=>selection[f.num]===niv);
      if (!fl.length) return;
      t(lbl.toUpperCase(),M,9,[155,139,122]); y+=1;
      fl.forEach(f => {
        const d = doses[f.num]||3;
        if (type==='client') {
          t(`  • ${f.fr} (${f.name}) — ${d} gouttes`,M,10);
          t(`    ${f.theme}`,M,8,[155,139,122]);
        } else {
          t(`  • N°${f.num} ${f.fr} / ${f.name} — ${d} gtt`,M,10);
        }
      });
      y+=3;
    });
    hr();

    // Protocole
    h('PROTOCOLE',11,[r,g,b]); y+=7;
    t(`Durée du traitement : ${proto.duree} semaine${proto.duree>1?'s':''}`);
    t(`Prises par jour : ${proto.prises}`);
    t(`Gouttes par prise : ${proto.gouttes}`);
    t(`Volume du flacon : ${proto.volume} ml`);
    if (type!=='ordonnance') {
      y+=2;
      t(`Total estimé : ${proto.prises*proto.gouttes*proto.duree*7} gouttes`,M,9,[155,139,122]);
    }

    // Notes (praticien)
    if (persos && type==='praticien') {
      y+=4; hr();
      h('NOTES PERSONNALISÉES',11,[r,g,b]); y+=7;
      t(persos);
    }

    // Footer
    doc.setFontSize(8); doc.setTextColor(155,139,122);
    doc.text('Naposolo CRM · naposolo.com', M, 287);
    doc.text(new Date().toLocaleDateString('fr-FR'), W-M, 287, {align:'right'});

    doc.save(`bach_${type}_${(clientNom||'client').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  /* ── Renders par étape ─────────────────────────────────────────────────── */

  const renderStep0 = () => (
    <div className="fb-anim">
      <div style={{background:'white',borderRadius:14,padding:28,border:`1.5px solid ${P.sableF}`,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:P.vertClair,display:'flex',
            alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:P.vert}}>
            {(clientNom||'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:P.texte,fontFamily:'Georgia,serif'}}>{clientNom||'Client'}</div>
            <div style={{fontSize:12,color:P.gris,marginTop:2}}>ID : {clientId}</div>
          </div>
        </div>
        <div style={{background:P.sable,borderRadius:10,padding:16,fontSize:13,color:P.terre,lineHeight:1.7}}>
          Ce wizard vous guidera en <strong>6 étapes</strong> pour créer un mélange Fleurs de Bach personnalisé.
          Naviguez librement entre les étapes et sauvegardez à tout moment en étape Synthèse.
        </div>
      </div>
      <div style={{background:P.vertClair,borderRadius:12,padding:20,border:'1px solid #C5D9C6'}}>
        <div style={{fontSize:12,fontWeight:700,color:P.vert,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.08em'}}>Aperçu de la session</div>
        <div className="fb-grid-stats" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {label:'Fleurs sélectionnées',val:`${selected.length}/39`,color:P.vert},
            {label:'Questions complétées',val:`${Object.keys(entretien).filter(k=>entretien[k]?.tags?.length||entretien[k]?.note).length}/6`,color:P.ambre},
            {label:'Durée protocole',val:`${proto.duree} sem.`,color:P.terre},
          ].map(({label,val,color}) => (
            <div key={label} style={{background:'white',borderRadius:8,padding:14,textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:11,color:P.gris,marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="fb-anim">
      {QUESTIONS.map((q,i) => {
        const e = entretien[q.id]||{tags:[],note:''};
        return (
          <div key={q.id} style={{background:'white',borderRadius:12,padding:20,border:`1.5px solid ${P.sableF}`,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
              <span style={{width:26,height:26,borderRadius:'50%',background:P.ambre,color:'white',
                fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:P.texte}}>{q.label}</div>
                <div style={{fontSize:12,color:P.gris,marginTop:2}}>{q.question}</div>
              </div>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:12}}>
              {q.tags.map(tag => (
                <button key={tag} className={`fb-tag${e.tags.includes(tag)?' on':''}`}
                  onClick={()=>toggleTag(q.id,tag)}>{tag}</button>
              ))}
            </div>
            <textarea className="fb-inp fb-ta"
              placeholder="Notes libres (observations, détails...)"
              value={e.note||''}
              onChange={ev=>setNote(q.id,ev.target.value)}
              style={{height:68}}/>
          </div>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className="fb-anim">
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input className="fb-inp" style={{flex:1,minWidth:180}}
          placeholder="Rechercher une fleur..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="fb-inp" style={{width:'auto',cursor:'pointer'}}
          value={famille} onChange={e=>setFamille(e.target.value)}>
          <option value="">Toutes les familles</option>
          {FAMILLES.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        {['mel','fond','prio'].map(n=>(
          <span key={n} style={{background:NIV_COLOR[n],color:'white',borderRadius:16,
            padding:'3px 12px',fontSize:12,fontWeight:700}}>
            {NIV_LABEL[n]} : {selected.filter(f=>selection[f.num]===n).length}
          </span>
        ))}
        <span style={{marginLeft:'auto',fontSize:12,color:P.gris}}>{filtered.length} fleurs</span>
      </div>
      <div className="fb-grid-fleurs" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {filtered.map(f => {
          const sel = selection[f.num];
          return (
            <div key={f.num} className={`fb-card${sel?' '+sel:''}`} style={{cursor:'default'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div>
                  <span style={{fontSize:10,fontWeight:700,color:P.gris}}>{f.num}.</span>{' '}
                  <span style={{fontWeight:700,fontSize:13,color:P.texte}}>{f.fr}</span>
                  <span style={{fontSize:11,color:P.gris,marginLeft:6,fontStyle:'italic'}}>{f.name}</span>
                </div>
                <span style={{background:FAM_BG[f.famille]||'#f5f5f5',color:f.couleur,
                  border:`1px solid ${f.couleur}33`,borderRadius:10,padding:'2px 7px',
                  fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{f.famille}</span>
              </div>
              <div style={{fontSize:12,color:P.terre,fontWeight:600,marginBottom:4}}>{f.theme}</div>
              <div style={{fontSize:11,color:P.gris,lineHeight:1.45,marginBottom:10}}>{f.indication}</div>
              <div style={{display:'flex',gap:6}}>
                {['mel','fond','prio'].map(n=>(
                  <button key={n} className={`fb-sel ${n}${sel===n?' on':''}`}
                    onClick={()=>toggleSel(f.num,n)}>
                    {n==='mel'?'Mélange':n==='fond'?'Fond':'Priorité'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!selected.length) return (
      <div className="fb-anim" style={{textAlign:'center',padding:60,color:P.gris}}>
        <div style={{fontSize:38,marginBottom:14}}>🌿</div>
        <div style={{fontSize:16,fontWeight:700}}>Aucune fleur sélectionnée</div>
        <div style={{fontSize:13,marginTop:8}}>Retournez à l'étape Fleurs pour faire votre sélection</div>
        <button className="fb-btn fb-btn-s" style={{marginTop:20}} onClick={()=>setStep(2)}>Sélectionner des fleurs</button>
      </div>
    );
    return (
      <div className="fb-anim">
        {[
          {niv:'prio',list:fleursPrio,label:'Priorité immédiate',desc:'Adresse les problèmes les plus urgents'},
          {niv:'mel', list:fleursMel, label:'Mélange principal', desc:'Composition centrale du traitement'},
          {niv:'fond',list:fleursFond,label:'Pattern profond (fond)',desc:'Travail sur les schémas durables'},
        ].map(({niv,list,label,desc}) => list.length>0 && (
          <div key={niv} style={{marginBottom:26}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <span style={{width:12,height:12,borderRadius:'50%',background:NIV_COLOR[niv],flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:15,color:NIV_COLOR[niv]}}>{label}</span>
              <span style={{fontSize:12,color:P.gris}}>{desc}</span>
              <span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:P.gris}}>{list.length} fleur{list.length>1?'s':''}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {list.map(f => {
                const d = doses[f.num]||3;
                return (
                  <div key={f.num} style={{background:'white',borderRadius:10,padding:'12px 16px',
                    border:`1.5px solid ${NIV_COLOR[niv]}44`,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,fontSize:11,color:P.gris,width:18,flexShrink:0}}>{f.num}</span>
                    <div style={{flex:1,minWidth:160}}>
                      <span style={{fontWeight:600,fontSize:13,color:P.texte}}>{f.fr}</span>
                      <span style={{color:P.gris,fontSize:11,marginLeft:6,fontStyle:'italic'}}>{f.name}</span>
                      <div style={{fontSize:11,color:P.gris,marginTop:2}}>{f.theme}</div>
                    </div>
                    {/* Dose adjuster */}
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <button className="fb-circ" onClick={()=>adjDose(f.num,d-1)}>−</button>
                      <div style={{textAlign:'center',minWidth:38}}>
                        <div style={{fontWeight:800,fontSize:17,color:NIV_COLOR[niv]}}>{d}</div>
                        <div style={{fontSize:9,color:P.gris}}>gouttes</div>
                      </div>
                      <button className="fb-circ" onClick={()=>adjDose(f.num,d+1)}>+</button>
                    </div>
                    {/* Dots */}
                    <div style={{display:'flex',gap:3}}>
                      {[1,2,3,4,5,6].map(i=>(
                        <div key={i} className="fb-dot" onClick={()=>adjDose(f.num,i)}
                          style={{background:i<=d?NIV_COLOR[niv]:P.sableF}}/>
                      ))}
                    </div>
                    <button onClick={()=>toggleSel(f.num,niv)}
                      style={{width:22,height:22,borderRadius:'50%',border:'none',background:P.sableF,
                        cursor:'pointer',color:P.gris,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="fb-anim">
      <div style={{background:'white',borderRadius:14,padding:28,border:`1.5px solid ${P.sableF}`,marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,color:P.texte,marginBottom:20}}>Configuration du protocole</div>
        <div className="fb-grid-proto" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[
            {key:'duree', label:'Durée (semaines)', min:1, max:12, unit:'sem.'},
            {key:'prises',label:'Prises / jour',    min:1, max:6,  unit:'x/j'},
            {key:'gouttes',label:'Gouttes / prise', min:1, max:10, unit:'gtt'},
            {key:'volume',label:'Volume flacon',   min:10,max:100, unit:'ml'},
          ].map(({key,label,min,max,unit}) => (
            <div key={key} style={{background:P.sable,borderRadius:10,padding:'14px 12px',textAlign:'center'}}>
              <div style={{fontSize:12,fontWeight:700,color:P.terre,marginBottom:10}}>{label}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center',marginBottom:6}}>
                <button className="fb-circ"
                  onClick={()=>setProto(p=>({...p,[key]:Math.max(min,p[key]-1)}))}>−</button>
                <input type="number" min={min} max={max} value={proto[key]}
                  onChange={e=>setProto(p=>({...p,[key]:Math.max(min,Math.min(max,parseInt(e.target.value)||min))}))}
                  style={{width:58,padding:'6px',borderRadius:8,border:`1.5px solid ${P.sableF}`,
                    fontSize:18,fontWeight:700,textAlign:'center',fontFamily:'inherit',outline:'none',background:'white'}}/>
                <button className="fb-circ"
                  onClick={()=>setProto(p=>({...p,[key]:Math.min(max,p[key]+1)}))}>+</button>
              </div>
              <div style={{fontSize:11,color:P.gris}}>{unit}</div>
            </div>
          ))}
        </div>
        <div style={{background:P.vertClair,borderRadius:10,padding:16,border:'1px solid #C5D9C6'}}>
          <div style={{fontSize:12,fontWeight:700,color:P.vert,marginBottom:10}}>Résumé du traitement</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
            {[
              {l:'Durée totale',v:`${proto.duree} semaine${proto.duree>1?'s':''}`},
              {l:'Total de prises',v:`${proto.prises*proto.duree*7} prises`},
              {l:'Gouttes par prise',v:`${proto.gouttes} gouttes`},
              {l:'Consommation estimée',v:`${proto.prises*proto.gouttes*proto.duree*7} gouttes`},
            ].map(({l,v})=>(
              <div key={l} style={{background:'white',borderRadius:8,padding:'10px 14px'}}>
                <div style={{fontSize:11,color:P.gris}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:P.vert,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:'white',borderRadius:14,padding:24,border:`1.5px solid ${P.sableF}`}}>
        <label style={{display:'block',fontWeight:700,fontSize:14,color:P.texte,marginBottom:10}}>
          Notes personnalisées
          <span style={{fontWeight:400,fontSize:12,color:P.gris,marginLeft:8}}>Conseils complémentaires, recommandations...</span>
        </label>
        <textarea className="fb-inp fb-ta" style={{height:110}}
          placeholder="Ex : Prendre les fleurs hors des repas, matin et soir de préférence. Éviter le café 30 min avant/après..."
          value={persos} onChange={e=>setPersos(e.target.value)}/>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="fb-anim">
      {/* Récap composition */}
      <div style={{background:'white',borderRadius:14,padding:24,border:`1.5px solid ${P.sableF}`,marginBottom:16}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:700,color:P.texte,marginBottom:2}}>{clientNom}</div>
        <div style={{fontSize:12,color:P.gris,marginBottom:18}}>Fiche Fleurs de Bach · {new Date().toLocaleDateString('fr-FR')}</div>
        <div className="fb-grid-stats" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {[
            {label:'Total fleurs',val:selected.length,color:P.vert},
            {label:'Priorité',val:fleursPrio.length,color:P.ambre},
            {label:'Pattern profond',val:fleursFond.length,color:P.terre},
          ].map(({label,val,color})=>(
            <div key={label} style={{background:P.sable,borderRadius:8,padding:14,textAlign:'center'}}>
              <div style={{fontSize:26,fontWeight:800,color}}>{val}</div>
              <div style={{fontSize:11,color:P.gris,marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
        {[['prio',fleursPrio,'Priorité immédiate'],['mel',fleursMel,'Mélange'],['fond',fleursFond,'Pattern profond']].map(([niv,list,lbl])=>list.length>0&&(
          <div key={niv} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:NIV_COLOR[niv],marginBottom:8}}>{lbl}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {list.map(f=>(
                <span key={f.num} style={{background:`${NIV_COLOR[niv]}18`,color:NIV_COLOR[niv],
                  border:`1px solid ${NIV_COLOR[niv]}44`,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>
                  {f.fr} ({doses[f.num]||3} gtt)
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Protocole */}
      <div style={{background:'white',borderRadius:14,padding:24,border:`1.5px solid ${P.sableF}`,marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:15,color:P.texte,marginBottom:14}}>Protocole prescrit</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[{l:'Durée',v:`${proto.duree} sem.`},{l:'Prises/j',v:proto.prises},{l:'Gouttes/prise',v:proto.gouttes},{l:'Flacon',v:`${proto.volume}ml`}].map(({l,v})=>(
            <div key={l} style={{background:P.sable,borderRadius:8,padding:'10px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:800,color:P.terre}}>{v}</div>
              <div style={{fontSize:11,color:P.gris,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
        {persos&&<div style={{marginTop:14,padding:14,background:P.sable,borderRadius:8,fontSize:13,color:P.texte,lineHeight:1.65}}>{persos}</div>}
      </div>

      {/* Entretien résumé */}
      <div style={{background:'white',borderRadius:14,padding:24,border:`1.5px solid ${P.sableF}`,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:15,color:P.texte,marginBottom:14}}>Notes d'entretien</div>
        {QUESTIONS.map(q=>{
          const e=entretien[q.id];
          if(!e||(!e.tags.length&&!e.note)) return null;
          return(
            <div key={q.id} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${P.sableF}`}}>
              <div style={{fontWeight:600,fontSize:13,color:P.terre,marginBottom:6}}>{q.label}</div>
              {e.tags.length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:e.note?6:0}}>
                  {e.tags.map(tag=>(
                    <span key={tag} style={{background:P.ambreClair,color:P.ambre,borderRadius:12,padding:'2px 9px',fontSize:11,fontWeight:600}}>{tag}</span>
                  ))}
                </div>
              )}
              {e.note&&<div style={{fontSize:12,color:P.gris,fontStyle:'italic'}}>{e.note}</div>}
            </div>
          );
        })}
        {!Object.keys(entretien).some(k=>entretien[k]?.tags?.length||entretien[k]?.note)&&(
          <div style={{color:P.gris,fontSize:13,fontStyle:'italic'}}>Aucune note d'entretien saisie</div>
        )}
      </div>

      {/* Actions sauvegarde */}
      <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:20}}>
        <button className="fb-btn fb-btn-p" onClick={handleSave} disabled={saving||saved}>
          {saving?'Enregistrement...':saved?'✓ Sauvegardé':'Sauvegarder la fiche'}
        </button>
        {saved&&<span style={{color:P.vert,fontSize:13,fontWeight:700}}>✓ Enregistrée dans Supabase</span>}
      </div>

      {/* PDF */}
      <div style={{background:'white',borderRadius:14,padding:24,border:`1.5px solid ${P.sableF}`}}>
        <div style={{fontWeight:700,fontSize:15,color:P.texte,marginBottom:4}}>Générer un PDF</div>
        <div style={{fontSize:12,color:P.gris,marginBottom:16}}>3 formats disponibles selon l'usage</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {[
            {type:'praticien',label:'Version Praticien',desc:'Complet avec entretien et notes',bg:P.vert},
            {type:'client',   label:'Version Client',  desc:'Vulgarisé et pédagogique',      bg:P.ambre},
            {type:'ordonnance',label:'Ordonnance',     desc:'Format officiel simplifié',     bg:P.terre},
          ].map(({type,label,desc,bg})=>(
            <button key={type} onClick={()=>genPDF(type)}
              style={{flex:1,minWidth:150,padding:'14px 16px',borderRadius:10,background:bg,
                color:'white',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{label}</div>
              <div style={{fontSize:11,opacity:.8}}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const RENDERS = [renderStep0,renderStep1,renderStep2,renderStep3,renderStep4,renderStep5];

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="fb-root">
      <style>{CSS}</style>
      <div style={{maxWidth:980,margin:'0 auto',padding:'0 16px 48px'}}>

        {/* Header */}
        <div style={{padding:'28px 0 22px',borderBottom:`1.5px solid ${P.sableF}`,marginBottom:28}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:700,color:P.vert,marginBottom:4}}>
            Fleurs de Bach
          </div>
          <div style={{fontSize:13,color:P.gris}}>
            Fiche personnalisée · <span style={{color:P.texte,fontWeight:700}}>{clientNom}</span>
          </div>
        </div>

        {/* Wizard nav */}
        <div className="fb-steps" style={{display:'flex',gap:0,marginBottom:32,background:P.sableF,borderRadius:12,padding:4}}>
          {STEPS.map((s,i)=>{
            const isActive=i===step, isDone=i<step;
            return(
              <button key={s} onClick={()=>setStep(i)} style={{
                flex:1,padding:'10px 6px',border:'none',cursor:'pointer',borderRadius:8,
                fontFamily:'inherit',fontSize:12,fontWeight:700,lineHeight:1.3,
                background:isActive?P.vert:isDone?P.ambreClair:'transparent',
                color:isActive?'white':isDone?P.ambre:P.gris,transition:'all .2s',
              }}>
                <div style={{fontSize:10,marginBottom:2,opacity:.7}}>0{i+1}</div>
                {s}
              </button>
            );
          })}
        </div>

        {/* Contenu étape */}
        {RENDERS[step]?.()}

        {/* Navigation bas */}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:32,paddingTop:20,borderTop:`1.5px solid ${P.sableF}`}}>
          <button className="fb-btn fb-btn-s" style={{visibility:step===0?'hidden':'visible'}}
            onClick={()=>setStep(s=>s-1)}>← Précédent</button>
          <span style={{fontSize:12,color:P.gris,alignSelf:'center'}}>Étape {step+1} / {STEPS.length}</span>
          <button className="fb-btn fb-btn-p" style={{visibility:step===STEPS.length-1?'hidden':'visible'}}
            onClick={()=>setStep(s=>s+1)}>Suivant →</button>
        </div>

      </div>
    </div>
  );
}
