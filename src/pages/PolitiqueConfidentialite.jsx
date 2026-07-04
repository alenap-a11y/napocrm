export default function PolitiqueConfidentialite() {
  const section = { marginBottom: 28 }
  const h2 = { fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 }
  const p = { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Politique de confidentialité</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Dernière mise à jour : juillet 2026</div>
      </div>

      <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FDECEA', color: '#C0392B', fontSize: 13, lineHeight: 1.6, marginBottom: 32 }}>
        Naposolo est actuellement en phase alpha et en cours d'immatriculation (statut micro-entreprise, SIRET en cours d'obtention). Les mentions légales complètes seront publiées dès l'immatriculation finalisée. La présente politique décrit néanmoins, dès aujourd'hui, la manière dont vos données sont traitées.
      </div>

      <div style={section}>
        <div style={h2}>Qui traite vos données ?</div>
        <div style={p}>Naposolo, service édité par Sébastien Alessandrelli, exerçant en France. Contact : contact@naposolo.com</div>
      </div>

      <div style={section}>
        <div style={h2}>Quelles données sont collectées ?</div>
        <div style={p}>Lors de l'inscription : prénom, nom, email, mot de passe (stocké de façon sécurisée, jamais en clair), métier déclaré.</div>
        <div style={p}>Lors d'une prise de rendez-vous via l'agenda public d'un praticien : nom, email, téléphone, motif de la demande.</div>
        <div style={p}>Lors de votre consentement à l'inscription : la case cochée et la date/heure de ce consentement sont enregistrées.</div>
      </div>

      <div style={section}>
        <div style={h2}>Pourquoi ces données sont-elles collectées ?</div>
        <div style={p}>Pour créer et gérer votre compte, vous envoyer les emails nécessaires au fonctionnement du service (confirmation d'inscription, réinitialisation de mot de passe, confirmation de rendez-vous), et permettre aux praticiens de gérer leurs rendez-vous.</div>
      </div>

      <div style={section}>
        <div style={h2}>Avec qui vos données sont-elles partagées ?</div>
        <div style={p}>Naposolo fait appel aux prestataires techniques suivants pour fonctionner :</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li><strong>Supabase</strong> — hébergement de la base de données et authentification</li>
          <li><strong>Vercel</strong> — hébergement de l'application</li>
          <li><strong>Resend</strong> — envoi des emails transactionnels</li>
          <li><strong>Anthropic</strong> — assistant conversationnel intégré (NapoAssistant)</li>
        </ul>
        <div style={p}>Aucune donnée n'est vendue ni partagée à des fins publicitaires.</div>
      </div>

      <div style={section}>
        <div style={h2}>Combien de temps vos données sont-elles conservées ?</div>
        <div style={p}>Durant toute la phase alpha, vos données sont conservées le temps de votre participation au test. Vous pouvez demander leur suppression à tout moment (voir ci-dessous).</div>
      </div>

      <div style={section}>
        <div style={h2}>Quels sont vos droits ?</div>
        <div style={p}>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, écrivez à contact@naposolo.com.</div>
      </div>
    </div>
  )
}
