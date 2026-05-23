export default function ProfilPage({ accent, onSignOut }) {
  return (
    <div className="profil">
      <div className="pf-header">
        <div className="pf-av" style={{ color: accent, borderColor: accent }}>NA</div>
        <div>
          <div className="pf-name">Nathalie Alpha</div>
          <div className="pf-role">
            Sophrologue · Nancy
            <span className="pf-plan">Plan Créateur</span>
          </div>
        </div>
      </div>

      <div className="pf-section-title">Statistiques</div>
      <div className="pf-stats">
        <div className="pf-stat"><div className="pf-stat-val">12</div><div className="pf-stat-lbl">Clients</div></div>
        <div className="pf-stat"><div className="pf-stat-val">47</div><div className="pf-stat-lbl">Séances</div></div>
        <div className="pf-stat"><div className="pf-stat-val">3</div><div className="pf-stat-lbl">Mois actif</div></div>
      </div>

      <div className="pf-section-title">Informations</div>
      <div className="pf-grid">
        {[
          { lbl: 'Email', val: 'nathalie@exemple.fr' },
          { lbl: 'Téléphone', val: '06 12 34 56 78' },
          { lbl: 'Ville', val: 'Nancy, France' },
          { lbl: 'Membre depuis', val: 'Mars 2026' },
          { lbl: 'SIRET', val: '123 456 789 00012' },
          { lbl: 'Activité', val: 'Sophrologue' },
        ].map(f => (
          <div className="pf-field" key={f.lbl}>
            <div className="pf-field-lbl">{f.lbl}</div>
            <div className="pf-field-val">{f.val}</div>
          </div>
        ))}
      </div>

      <div className="pf-section-title">Actions</div>
      <div className="pf-actions">
        <button className="pf-btn">
          <i className="ti ti-edit" style={{ color: accent }} aria-hidden="true" />
          <span>Modifier le profil</span>
        </button>
        <button className="pf-btn">
          <i className="ti ti-lock" style={{ color: '#534AB7' }} aria-hidden="true" />
          <span>Changer le mot de passe</span>
        </button>
        <button className="pf-btn">
          <i className="ti ti-credit-card" style={{ color: '#0F6E56' }} aria-hidden="true" />
          <span>Gérer l'abonnement</span>
        </button>
        <button className="pf-btn pf-btn-danger" onClick={onSignOut}>
          <i className="ti ti-power" aria-hidden="true" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
