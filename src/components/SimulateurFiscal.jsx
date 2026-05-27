import { useState, useCallback } from "react";

const TAUX = { bnc: 0.22, bic_serv: 0.22, bic_vente: 0.123, liberal: 0.232 };
const CFP_T = { bnc: 0.002, bic_serv: 0.001, bic_vente: 0.001, liberal: 0.002 };
const VL_T  = { bnc: 0.022, bic_serv: 0.017, bic_vente: 0.01, liberal: 0.026 };
const ABATT = { bnc: 0.34, bic_serv: 0.50, bic_vente: 0.71, liberal: 0.34 };

const MOIS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const OPTIMS = [
  { id:"vl", titre:"Versement libératoire", impact:3, art:["Art. 151-0 CGI","BOI-BIC-DECLA-10-40"],
    desc:"Paie l'impôt en même temps que l'URSSAF à taux fixe (2,2% BNC). Avantageux si ton taux marginal dépasse 11%. Délai : avant le 30/09 pour l'année suivante.",
    steps:["Vérifier ton RFR N-2 sur impots.gouv.fr","Confirmer éligibilité (RFR < 27 478 € pour 1 part)","Demande sur autoentrepreneur.urssaf.fr avant le 30/09"],
    condition:(d,vlOn)=>!vlOn && d.ir>500 && d.ca<27000 },
  { id:"acre", titre:"ACRE — exonération 1ère année", impact:3, art:["Art. L131-6-4 CSS"],
    desc:"Exonération partielle des cotisations URSSAF pendant 12 mois (~50% de réduction). Vérifier dans ton espace URSSAF.",
    steps:["Connecter à autoentrepreneur.urssaf.fr","Vérifier onglet 'Mes exonérations'","Si non accordée et < 45 jours : contacter l'URSSAF"],
    condition:(d)=>d.ca>0 },
  { id:"franchise", titre:"Optimiser la franchise TVA", impact:2, art:["Art. 293 B CGI"],
    desc:"Tant que tu restes sous 36 800 €, tes clients particuliers paient moins. Décale certains encaissements si tu approches du seuil.",
    steps:["Calculer le CA cumulé depuis le 1er janvier","Si > 32 000 € en oct/nov : ralentir les factures","Programmer une alerte à 34 000 € de CA cumulé"],
    condition:(d,vlOn,franchiseOn)=>franchiseOn && d.ca>28000 },
  { id:"cpf", titre:"Utiliser son crédit CPF", impact:1, art:["Art. L6323-1 Code travail"],
    desc:"Ta cotisation CFP (0,2%) finance un budget formation. Utilise moncompteformation.gouv.fr pour des formations certifiantes sans dépenser de ta poche.",
    steps:["Aller sur moncompteformation.gouv.fr","Vérifier le solde disponible","Chercher formations no-code, gestion, marketing digital"],
    condition:(d)=>d.ca>0 },
  { id:"seuil", titre:"Anticiper le changement de structure", impact:3, art:["Art. 50-0 CGI","Art. L526-1 Code commerce"],
    desc:"Au-delà de 50k€ de CA régulier, une SASU permet de déduire les vraies charges et d'optimiser via dividendes (PFU 30%).",
    steps:["Lister toutes les charges réelles annuelles","Comparer abattement forfaitaire vs charges réelles","Si charges réelles > 34% CA : contacter un expert-comptable"],
    condition:(d)=>d.ca>45000 },
  { id:"rc", titre:"RC Pro — protection obligatoire", impact:1, art:["Art. L124-1 Code assurances"],
    desc:"La RC Pro protège ton patrimoine en cas de litige client. Coût moyen : 15-40 €/mois pour les activités tech/conseil.",
    steps:["Comparer sur hiscox.fr, april.fr, axeria.fr","Budget : 15-30 €/mois pour activité tech","Mentionner la RC Pro sur les CGV et devis"],
    condition:(d)=>d.grpAssur<200 && d.ca>5000 },
];

function estimerIR(ca, autres, act) {
  const ab = ABATT[act] || 0.34;
  const base = Math.max(0, ca * (1 - ab) + autres);
  let ir = 0, prev = 0;
  for (const [lim, tx] of [[10777,0],[27478,0.11],[78570,0.30],[168994,0.41],[Infinity,0.45]]) {
    if (base <= prev) break;
    ir += Math.min(base - prev, lim - prev) * tx;
    prev = lim;
  }
  return Math.round(ir);
}

function fmt(v) { return Math.round(v).toLocaleString("fr-FR") + " €"; }
function fmtD(v) { return "− " + fmt(v); }
function fmtPct(v) { return v.toFixed(1).replace(".", ",") + " %"; }

const IMPACT_COLOR = { 1:"#1D9E75", 2:"#EF9F27", 3:"#E24B4A" };
const IMPACT_LABEL = { 1:"Faible", 2:"Moyen", 3:"Fort" };

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      position:"relative", width:34, height:18,
      background: value ? "#1D9E75" : "#ccc",
      borderRadius:9, border:"none", cursor:"pointer",
      transition:"background .2s", flexShrink:0, padding:0
    }}
    aria-pressed={value}
  >
    <span style={{
      position:"absolute", top:2, left: value ? 18 : 2,
      width:14, height:14, background:"#fff", borderRadius:"50%",
      transition:"left .2s", display:"block"
    }}/>
  </button>
);

const Field = ({ label, children }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:8 }}>
    <label style={{ fontSize:13, color:"#6B6B6A", flex:1 }}>{label}</label>
    {children}
  </div>
);

const NumInput = ({ value, onChange, step=100, min=0, max=999999 }) => (
  <input
    type="number" value={value} min={min} max={max} step={step}
    onChange={e => onChange(Math.max(0, parseFloat(e.target.value)||0))}
    style={{ width:108, textAlign:"right", fontSize:13, padding:"4px 8px",
      border:"0.5px solid #ccc", borderRadius:8, background:"#f8f8f6", color:"inherit" }}
  />
);

const FraisRow = ({ label, value, onChange, step=5 }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginBottom:6 }}>
    <label style={{ fontSize:12, color:"#6B6B6A", flex:1 }}>{label}</label>
    <input type="number" value={value} min={0} step={step}
      onChange={e => onChange(Math.max(0,parseFloat(e.target.value)||0))}
      style={{ width:72, textAlign:"right", fontSize:12, padding:"3px 6px",
        border:"0.5px solid #ccc", borderRadius:6, background:"#fff", color:"inherit" }}
    />
    <span style={{ fontSize:11, color:"#999", whiteSpace:"nowrap" }}>€</span>
  </div>
);

export default function SimulateurFiscal() {
  const [tab, setTab] = useState("sim");
  const [ca, setCa] = useState(24000);
  const [activite, setActivite] = useState("bnc");
  const [autres, setAutres] = useState(0);
  const [franchiseOn, setFranchiseOn] = useState(true);
  const [tvaTaux, setTvaTaux] = useState(0.20);
  const [tvaDed, setTvaDed] = useState(300);
  const [cfe, setCfe] = useState(0);
  const [vlOn, setVlOn] = useState(false);
  const [optimChecks, setOptimChecks] = useState({});

  const [frais, setFrais] = useState({
    loyer:0, eau:0, elec:0, net:0,
    rc:0, mutuelle:0, prev:0, assu:0,
    soft:0, tel:0, transport:0, compta:0,
    form:0, market:0, materiel:0, divers:0
  });

  const setF = (k, v) => setFrais(prev => ({ ...prev, [k]: v }));

  const urssaf = ca * TAUX[activite];
  const cfp    = ca * CFP_T[activite];
  const tva    = franchiseOn ? 0 : Math.max(0, ca * tvaTaux - tvaDed);
  const ir     = vlOn ? ca * VL_T[activite] : estimerIR(ca, autres, activite);

  const grpLogement = (frais.loyer+frais.eau+frais.elec+frais.net)*12;
  const grpAssur    = (frais.rc+frais.mutuelle+frais.prev+frais.assu)*12;
  const grpOutils   = (frais.soft+frais.tel+frais.transport+frais.compta)*12;
  const grpForm     = frais.form + frais.materiel + (frais.market+frais.divers)*12;
  const totalFrais  = grpLogement + grpAssur + grpOutils + grpForm;

  const netFiscal = Math.max(0, ca - urssaf - cfp - tva - ir - cfe);
  const netReel   = Math.max(0, netFiscal - totalFrais);
  const totalPrel = urssaf + cfp + tva + ir + cfe;
  const provPct   = ca > 0 ? Math.min(60, Math.round((urssaf+cfp+ir)/ca*100)) : 0;

  const G = { ca, ir, urssaf, cfp, tva, cfe, netFiscal, netReel, totalFrais, grpAssur, fMut: frais.mutuelle*12 };

  const activeOptims = OPTIMS.filter(o => o.condition(G, vlOn, franchiseOn));
  const score = Math.round(10 - (activeOptims.length / OPTIMS.length) * 10);

  const toggleCheck = (id, step) => {
    const k = id+"_"+step;
    setOptimChecks(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const segs = [
    { v:netReel,    c:"#1D9E75", l:"Net réel" },
    { v:urssaf+cfp, c:"#E24B4A", l:"URSSAF" },
    { v:ir,         c:"#EF9F27", l:"Impôts" },
    { v:tva,        c:"#378ADD", l:"TVA" },
    { v:cfe,        c:"#888780", l:"CFE" },
    { v:totalFrais, c:"#7F77DD", l:"Frais" },
  ];
  const tot = ca || 1;

  const card = (children, style={}) => (
    <div style={{ background:"#fff", border:"0.5px solid #e5e5e5", borderRadius:12,
      padding:"14px 18px", marginBottom:10, ...style }}>
      {children}
    </div>
  );

  const cardTitle = (icon, text) => (
    <div style={{ fontSize:13, fontWeight:500, color:"#6B6B6A", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
      <i className={`ti ti-${icon}`} style={{ fontSize:15 }} aria-hidden="true"/>
      {text}
    </div>
  );

  const tabStyle = (t) => ({
    padding:"9px 14px", fontSize:13, fontWeight:500, cursor:"pointer", border:"none", background:"none",
    color: tab===t ? "#1a1a1a" : "#6B6B6A",
    borderBottom: tab===t ? "2px solid #1a1a1a" : "2px solid transparent",
    whiteSpace:"nowrap"
  });

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", maxWidth:680, margin:"0 auto", padding:"12px 16px" }}>

      {/* Disclaimer */}
      <div style={{ background:"#f8f8f6", border:"0.5px solid #ccc", borderRadius:8,
        padding:"10px 14px", fontSize:11, color:"#999", lineHeight:1.6, marginBottom:14 }}>
        <strong>Avertissement</strong> — Outil indicatif uniquement. Ne constitue pas un conseil fiscal ou comptable.
        Articles cités à titre informatif. Sources : impots.gouv.fr · urssaf.fr · legifrance.gouv.fr
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"0.5px solid #e5e5e5", marginBottom:14 }}>
        {[["sim","Simulateur"],["optim","Optimisation"],["bilan","Bilan annuel"]].map(([t,l])=>(
          <button key={t} style={tabStyle(t)} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ===== SIMULATEUR ===== */}
      {tab==="sim" && <>
        {card(<>
          {cardTitle("adjustments","Paramètres principaux")}
          <Field label="CA annuel">
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <NumInput value={ca} onChange={setCa} step={500} max={200000}/>
              <span style={{ fontSize:11, color:"#999" }}>€ / an</span>
            </div>
          </Field>
          <Field label="Activité">
            <select value={activite} onChange={e=>setActivite(e.target.value)}
              style={{ fontSize:13, padding:"4px 8px", borderRadius:8, border:"0.5px solid #ccc", background:"#f8f8f6", color:"inherit" }}>
              <option value="bnc">Prestations services BNC — 22%</option>
              <option value="bic_serv">Prestations services BIC — 22%</option>
              <option value="bic_vente">Vente marchandises — 12,3%</option>
              <option value="liberal">Profession libérale réglementée — 23,2%</option>
            </select>
          </Field>
          <Field label="Autres revenus du foyer">
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <NumInput value={autres} onChange={setAutres} step={500}/>
              <span style={{ fontSize:11, color:"#999" }}>€ / an</span>
            </div>
          </Field>
          <Field label="Franchise TVA">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Toggle value={franchiseOn} onChange={setFranchiseOn}/>
              <span style={{ fontSize:12, color:"#6B6B6A" }}>{franchiseOn?"Oui (sous seuil)":"Non"}</span>
            </div>
          </Field>
          {!franchiseOn && <>
            <Field label="Taux TVA collectée">
              <select value={tvaTaux} onChange={e=>setTvaTaux(parseFloat(e.target.value))}
                style={{ fontSize:13, padding:"4px 8px", borderRadius:8, border:"0.5px solid #ccc", background:"#f8f8f6" }}>
                <option value={0.20}>20%</option><option value={0.10}>10%</option><option value={0.055}>5,5%</option>
              </select>
            </Field>
            <Field label="TVA déductible">
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <NumInput value={tvaDed} onChange={setTvaDed} step={50}/>
                <span style={{ fontSize:11, color:"#999" }}>€ / an</span>
              </div>
            </Field>
          </>}
          <Field label="CFE annuelle">
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <NumInput value={cfe} onChange={setCfe} step={50} max={5000}/>
              <span style={{ fontSize:11, color:"#999" }}>€ / an</span>
            </div>
          </Field>
          <div style={{ fontSize:11, color:"#999", marginBottom:6 }}>Exonéré 1ère année — prévoir 300–800 € dès l'an 2.</div>
          <Field label="Versement libératoire">
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Toggle value={vlOn} onChange={setVlOn}/>
              <span style={{ fontSize:12, color:"#6B6B6A" }}>{vlOn?"Oui (2,2% BNC)":"Non"}</span>
            </div>
          </Field>
        </>)}

        {card(<>
          {cardTitle("home","Frais annexes")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["Logement & charges",[["loyer","Loyer / mois",50],["eau","Eau / mois",5],["elec","Électricité / mois",10],["net","Internet / mois",5]]],
              ["Assurances",[["rc","RC Pro / mois",5],["mutuelle","Mutuelle / mois",10],["prev","Prévoyance / mois",5],["assu","Autres assu. / mois",5]]],
              ["Outils & abonnements",[["soft","Logiciels / mois",5],["tel","Téléphone / mois",5],["transport","Transport / mois",10],["compta","Compta / mois",10]]],
              ["Formation & divers",[["form","Formation / an",100],["market","Marketing / mois",10],["materiel","Matériel / an",100],["divers","Divers / mois",10]]],
            ].map(([title, fields]) => (
              <div key={title} style={{ background:"#f8f8f6", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:11, fontWeight:500, color:"#999", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>{title}</div>
                {fields.map(([k,l,s])=>(
                  <FraisRow key={k} label={l} value={frais[k]} onChange={v=>setF(k,v)} step={s}/>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, paddingTop:10, borderTop:"0.5px solid #e5e5e5" }}>
            <span style={{ fontSize:13, color:"#6B6B6A" }}>Total frais annexes / an</span>
            <span style={{ fontSize:15, fontWeight:500, color:"#E24B4A" }}>{fmt(totalFrais)}</span>
          </div>
        </>)}

        {card(<>
          {cardTitle("chart-pie","Répartition du CA")}
          <div style={{ height:14, borderRadius:7, background:"#e5e5e5", overflow:"hidden", display:"flex", marginBottom:6 }}>
            {segs.map(s=>(
              <div key={s.l} style={{ width:`${Math.max(0,s.v/tot*100).toFixed(1)}%`, background:s.c, transition:"width .35s" }}/>
            ))}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 12px", marginBottom:12 }}>
            {segs.map(s=>(
              <div key={s.l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#6B6B6A" }}>
                <div style={{ width:9, height:9, borderRadius:2, background:s.c, flexShrink:0 }}/>
                {s.l} ({ca>0?fmtPct(s.v/ca*100):"0%"})
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              [fmt(netFiscal),"Net fiscal / an","#1D9E75"],
              [fmt(netFiscal/12),"Net fiscal / mois","#1D9E75"],
              [fmt(netReel),"Net réel / an","#378ADD"],
              [fmt(netReel/12),"Net réel / mois","#378ADD"],
            ].map(([v,l,c])=>(
              <div key={l} style={{ background:"#f8f8f6", borderRadius:8, padding:10, textAlign:"center" }}>
                <div style={{ fontSize:19, fontWeight:500, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:"#999", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:12, color:"#6B6B6A" }}>Provision recommandée / encaissement</span>
            <span style={{ fontSize:15, fontWeight:500, color:"#EF9F27" }}>{provPct}%</span>
          </div>
          <div style={{ height:8, borderRadius:4, background:"#e5e5e5", overflow:"hidden", marginBottom:4 }}>
            <div style={{ height:"100%", borderRadius:4, background:"#EF9F27", width:`${Math.min(100,provPct*2)}%`, transition:"width .3s" }}/>
          </div>
          <div style={{ fontSize:11, color:"#999" }}>
            URSSAF {fmtPct(TAUX[activite]*100)} | IR {ca>0?fmtPct(ir/ca*100):"—"} | CFP {fmtPct(CFP_T[activite]*100)}
          </div>
        </>)}

        {card(<>
          {cardTitle("receipt-2","Détail complet")}
          <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
            {[
              ["section","Recettes"],
              ["CA brut annuel", fmt(ca), "#1a1a1a"],
              ["section","Cotisations obligatoires"],
              ["URSSAF", fmtD(urssaf), "#E24B4A"],
              ["CFP (formation pro)", fmtD(cfp), "#E24B4A"],
              ...(!franchiseOn ? [["TVA nette", fmtD(tva), "#378ADD"]] : []),
              ["CFE", fmtD(cfe), "#E24B4A"],
              ["section","Fiscalité"],
              ["Impôt sur le revenu (estimé)", fmtD(ir), "#EF9F27"],
              ["section","Frais annexes"],
              ["Logement & charges", fmtD(grpLogement), "#888780"],
              ["Assurances", fmtD(grpAssur), "#888780"],
              ["Outils & abonnements", fmtD(grpOutils), "#888780"],
              ["Formation & divers", fmtD(grpForm), "#888780"],
            ].map((row, i) => row[0]==="section" ? (
              <tr key={i}><td colSpan={2} style={{ fontSize:11, fontWeight:500, color:"#999",
                textTransform:"uppercase", letterSpacing:".04em", padding:"12px 2px 4px" }}>{row[1]}</td></tr>
            ) : (
              <tr key={i} style={{ borderBottom:"0.5px solid #e5e5e5" }}>
                <td style={{ padding:"7px 2px", color:"#6B6B6A" }}>{row[0]}</td>
                <td style={{ padding:"7px 2px", textAlign:"right", fontWeight:500, color:row[2] }}>{row[1]}</td>
              </tr>
            ))}
            <tr style={{ borderTop:"0.5px solid #ccc" }}>
              <td style={{ padding:"10px 2px", fontSize:15, fontWeight:500 }}>Net réel annuel</td>
              <td style={{ padding:"10px 2px", textAlign:"right", fontSize:15, fontWeight:500, color:"#1D9E75" }}>{fmt(netReel)}</td>
            </tr>
            <tr>
              <td style={{ padding:"4px 2px", fontSize:13, fontWeight:500 }}>Net réel mensuel</td>
              <td style={{ padding:"4px 2px", textAlign:"right", fontSize:13, fontWeight:500, color:"#1D9E75" }}>{fmt(netReel/12)}</td>
            </tr>
          </table>
        </>)}
      </>}

      {/* ===== OPTIMISATION ===== */}
      {tab==="optim" && <>
        <div style={{ background:"#f8f8f6", borderRadius:12, padding:"14px 18px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <div>
              <div style={{ fontSize:13, color:"#6B6B6A", marginBottom:2 }}>Score d'optimisation fiscale</div>
              <div style={{ fontSize:36, fontWeight:500 }}>{score}/10</div>
            </div>
            <div style={{ textAlign:"right", fontSize:12, color:"#999" }}>
              {score>=8?"Excellente optimisation":score>=5?"Optimisation correcte":"Des leviers importants existent"}
            </div>
          </div>
          <div style={{ height:10, borderRadius:5, background:"#e5e5e5", overflow:"hidden", margin:"8px 0" }}>
            <div style={{ height:"100%", borderRadius:5, background:"#1D9E75", width:`${score*10}%`, transition:"width .4s" }}/>
          </div>
          <div style={{ fontSize:11, color:"#999" }}>
            {activeOptims.length===0?"Tout est optimisé !": `${activeOptims.length} levier${activeOptims.length>1?"s":""} d'optimisation détecté${activeOptims.length>1?"s":""}`}
          </div>
        </div>

        {activeOptims.length===0 ? (
          <div style={{ background:"#E1F5EE", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#085041", display:"flex", gap:8 }}>
            <i className="ti ti-circle-check" aria-hidden="true"/>
            Aucun levier d'optimisation détecté avec tes paramètres actuels.
          </div>
        ) : activeOptims.map(o=>(
          <div key={o.id} style={{ background:"#fff", border:"0.5px solid #e5e5e5", borderRadius:12, padding:"14px 18px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:6 }}>{o.titre}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"2px 4px" }}>
                  {o.art.map(a=>(
                    <span key={a} style={{ fontSize:11, padding:"2px 8px", borderRadius:20,
                      background:"#E6F1FB", color:"#0C447C", cursor:"default" }}>{a}</span>
                  ))}
                </div>
              </div>
              <span style={{ fontSize:12, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
                background:IMPACT_COLOR[o.impact]+"22", color:IMPACT_COLOR[o.impact], flexShrink:0 }}>
                Impact {IMPACT_LABEL[o.impact]}
              </span>
            </div>
            <p style={{ fontSize:13, color:"#6B6B6A", lineHeight:1.6, marginBottom:10 }}>{o.desc}</p>
            <div style={{ fontSize:11, fontWeight:500, color:"#999", textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>Plan d'action</div>
            {o.steps.map((s,i)=>{
              const done = !!optimChecks[o.id+"_"+i];
              return (
                <div key={i} onClick={()=>toggleCheck(o.id,i)}
                  style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"6px 0",
                    borderBottom:"0.5px solid #e5e5e5", cursor:"pointer" }}>
                  <input type="checkbox" checked={done} onChange={()=>toggleCheck(o.id,i)}
                    style={{ width:14, height:14, marginTop:1, flexShrink:0, cursor:"pointer", accentColor:"#1D9E75" }}
                    onClick={e=>e.stopPropagation()}/>
                  <span style={{ fontSize:12, color: done?"#999":"#1a1a1a",
                    textDecoration: done?"line-through":"none", lineHeight:1.4 }}>{s}</span>
                </div>
              );
            })}
          </div>
        ))}
      </>}

      {/* ===== BILAN ===== */}
      {tab==="bilan" && <>
        {card(<>
          {cardTitle("calendar-stats","Bilan annuel")}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
            {[[fmt(ca/12),"CA / mois","#1a1a1a"],
              [fmt((totalPrel+totalFrais)/12),"Charges / mois","#E24B4A"],
              [fmt(netReel/12),"Net réel / mois","#1D9E75"]
            ].map(([v,l,c])=>(
              <div key={l} style={{ background:"#f8f8f6", borderRadius:8, padding:10, textAlign:"center" }}>
                <div style={{ fontSize:17, fontWeight:500, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:"#999", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, fontWeight:500, color:"#6B6B6A", marginBottom:8 }}>Net mensuel estimé — 12 mois</div>
          {MOIS.map(m=>(
            <div key={m} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:12, color:"#6B6B6A", width:40, flexShrink:0 }}>{m}</span>
              <div style={{ flex:1, height:8, borderRadius:4, background:"#e5e5e5", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, background:"#1D9E75",
                  width: ca>0?`${Math.min(100,(netReel/12)/(ca/12)*100).toFixed(0)}%`:"0%" }}/>
              </div>
              <span style={{ fontSize:12, color:"#6B6B6A", width:60, textAlign:"right", flexShrink:0 }}>{fmt(netReel/12)}</span>
            </div>
          ))}
        </>)}

        {card(<>
          {cardTitle("target","Seuils à surveiller")}
          <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
            {[
              ["CA actuel / an", fmt(ca), "#1a1a1a"],
              ["Seuil franchise TVA", "36 800 €", "#EF9F27"],
              ["Plafond micro BNC/services", "77 700 €", "#E24B4A"],
              ["Marge avant seuil TVA", fmt(Math.max(0,36800-ca)), ca<36800?"#1D9E75":"#E24B4A"],
              ["Marge avant plafond micro", fmt(Math.max(0,77700-ca)), ca<70000?"#1D9E75":"#E24B4A"],
              ["% plafond micro atteint", fmtPct(Math.min(100,ca/77700*100)), ca>65000?"#E24B4A":ca>45000?"#EF9F27":"#1D9E75"],
            ].map(([k,v,c])=>(
              <tr key={k} style={{ borderBottom:"0.5px solid #e5e5e5" }}>
                <td style={{ padding:"7px 2px", color:"#6B6B6A" }}>{k}</td>
                <td style={{ padding:"7px 2px", textAlign:"right", fontWeight:500, color:c }}>{v}</td>
              </tr>
            ))}
          </table>
        </>)}
      </>}

    </div>
  );
}
