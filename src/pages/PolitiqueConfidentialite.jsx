export default function PolitiqueConfidentialite() {
  const section = { marginBottom: 28 };
  const h2 = { fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 };
  const p = { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 };
  const linkStyle = { color: '#2563eb', textDecoration: 'underline' };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Politique de confidentialité</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Dernière mise à jour : 4 juillet 2026</div>
      </div>

      <div style={section}>
        <div style={h2}>Responsable du traitement</div>
        <div style={p}>
          Naposolo est un service édité par Sébastien Alessandrelli-Giust, micro-entrepreneur en cours d'immatriculation en France. Contact : <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a>
        </div>
      </div>

      <div style={section}>
        <div style={h2}>Données collectées et finalités</div>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li>Inscription : prénom, nom, email, mot de passe (haché), métier déclaré → Création de compte et envoi d'emails fonctionnels (base légale : exécution du contrat).</li>
          <li>Prise de rendez-vous : nom, email, téléphone, motif → Gestion des rendez-vous par les praticiens (base légale : exécution du contrat).</li>
          <li>Consentement : case cochée + date/heure → Preuve de consentement (base légale : obligation légale).</li>
        </ul>
      </div>

      <div style={section}>
        <div style={h2}>Destinataires des données</div>
        <div style={p}>Vos données sont traitées par les sous-traitants suivants :</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Supabase (hébergement base de données et authentification)</li>
          <li>Vercel (hébergement de l'application)</li>
          <li>Resend (envoi d'emails transactionnels)</li>
          <li>Anthropic (assistant conversationnel NapoAssistant)</li>
        </ul>
        <div style={p}>
          Transfert hors UE : Certains prestataires (Anthropic, Vercel) sont situés hors Union Européenne. Les transferts sont encadrés par des clauses contractuelles types (SCC) conformes à l'<a href="https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32010D0087" style={linkStyle} target="_blank" rel="noopener noreferrer">article 46 du RGPD</a>. Une copie peut être demandée à <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a>. Aucune donnée n'est vendue ou partagée à des fins publicitaires.
        </div>
      </div>

      <div style={section}>
        <div style={h2}>Durée de conservation</div>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li>Données de compte : 12 mois après votre dernière connexion, ou suppression immédiate sur demande.</li>
          <li>Données de rendez-vous : Conservées par le praticien (responsable du traitement) pour la durée nécessaire à sa relation avec vous.</li>
        </ul>
      </div>

      <div style={section}>
        <div style={h2}>Vos droits</div>
        <div style={p}>Conformément au RGPD, vous disposez des droits suivants :</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Accès, rectification, suppression, portabilité, opposition. Pour les exercer : <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a>. Vous pouvez aussi introduire une réclamation auprès de la <a href="https://www.cnil.fr" style={linkStyle} target="_blank" rel="noopener noreferrer">CNIL</a>.</li>
        </ul>
      </div>

      <div style={section}>
        <div style={h2}>Sécurité</div>
        <div style={p}>Les données sont protégées par des mesures techniques (chiffrement, accès restreint).</div>
      </div>

      <div style={section}>
        <div style={h2}>Modifications</div>
        <div style={p}>Cette politique peut être mise à jour. La version la plus récente est disponible sur cette page.</div>
      </div>
    </div>
  );
}
