import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function PolitiqueConfidentialite() {
  const navigate = useNavigate()
  const section = { marginBottom: 28 };
  const h2 = { fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 };
  const h3 = { fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 16, marginBottom: 8 };
  const p = { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 };
  const linkStyle = { color: '#2563eb', textDecoration: 'underline' };
  const th = { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' };
  const td = { fontSize: 12.5, color: '#374151', padding: '10px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

  const dataRows = [
    ['Prénom, nom, email', 'Inscription', "Création de compte, envoi d'emails fonctionnels (confirmation, réinitialisation de mot de passe)", 'Exécution du contrat (Art. 6.1.b)', '12 mois après la dernière connexion, ou suppression immédiate sur demande'],
    ['Mot de passe (haché)', 'Inscription', 'Authentification sécurisée', 'Exécution du contrat (Art. 6.1.b)', '12 mois après la dernière connexion, ou suppression immédiate sur demande'],
    ['Métier déclaré', 'Inscription', "Personnalisation de l'expérience utilisateur", 'Consentement (Art. 6.1.a)', '12 mois après la dernière connexion, ou suppression immédiate sur demande'],
    ['Téléphone, motif', 'Prise de rendez-vous', 'Gestion des rendez-vous par les praticiens', 'Exécution du contrat (Art. 6.1.b)', 'Conservées par le praticien (responsable du traitement indépendant) pour la durée nécessaire à sa relation client'],
    ['Consentement (timestamp)', 'Inscription', 'Preuve de consentement au traitement des données', 'Obligation légale (Art. 6.1.c)', '3 ans (durée légale de conservation des preuves)'],
  ];

  const subRows = [
    ['Supabase', 'Hébergement de la base de données et authentification', 'États-Unis', "Données d'authentification et de profil", "Clauses Contractuelles Types (SCC) conformes à l'Art. 46 RGPD"],
    ['Vercel', "Hébergement de l'application", 'États-Unis', 'Logs techniques (sans données utilisateurs)', "SCC conformes à l'Art. 46 RGPD"],
    ['Resend', 'Envoi des emails transactionnels', 'États-Unis', "Emails et noms (uniquement pour l'envoi)", "SCC conformes à l'Art. 46 RGPD"],
    ['Anthropic', 'Traitement des requêtes via NapoAssistant', 'États-Unis', 'Messages échangés (traitement en temps réel, sans stockage permanent)', "SCC conformes à l'Art. 46 RGPD"],
  ];

  return (
    <>
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Politique de Confidentialité</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Dernière mise à jour : 4 juillet 2026</div>
      </div>

      <div style={section}>
        <div style={h2}>1. Responsable du traitement</div>
        <div style={p}>Naposolo est un projet en phase alpha porté par Sébastien Alessandrelli-Giust, en cours de création d'entreprise en France sous le statut de micro-entrepreneur.</div>
        <div style={p}>Contact : <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a></div>
        <div style={p}>Statut : Les données sont traitées sous la responsabilité personnelle de Sébastien Alessandrelli-Giust jusqu'à l'immatriculation officielle de l'entreprise.</div>
      </div>

      <div style={section}>
        <div style={h2}>2. Données collectées et finalités</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, minWidth: 700 }}>
            <thead>
              <tr>
                <th style={th}>Donnée</th>
                <th style={th}>Source</th>
                <th style={th}>Finalité</th>
                <th style={th}>Base légale</th>
                <th style={th}>Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={section}>
        <div style={h2}>3. Destinataires des données et sous-traitants</div>
        <div style={p}>Vos données sont traitées par les sous-traitants suivants, agissant sous les instructions de Naposolo :</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, minWidth: 760 }}>
            <thead>
              <tr>
                <th style={th}>Sous-traitant</th>
                <th style={th}>Rôle</th>
                <th style={th}>Localisation</th>
                <th style={th}>Accès aux données</th>
                <th style={th}>Garanties RGPD</th>
              </tr>
            </thead>
            <tbody>
              {subRows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...p, marginTop: 12 }}>
          Transfert hors UE : Certains sous-traitants (Anthropic, Vercel, Resend, Supabase) sont situés hors Union Européenne. Les transferts de données vers ces pays sont encadrés par des Clauses Contractuelles Types (SCC) signées entre Naposolo et ses sous-traitants, conformément à l'article 46 du RGPD.
        </div>
        <div style={p}>Preuves : Les copies des SCC signées sont disponibles sur demande à <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a>.</div>
        <div style={p}>Aucune donnée n'est vendue ni partagée à des fins publicitaires.</div>
      </div>

      <div style={section}>
        <div style={h2}>4. Durée de conservation</div>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li>Données de compte (prénom, nom, email, mot de passe, métier) : 12 mois après votre dernière connexion à la plateforme, ou suppression immédiate sur demande.</li>
          <li>Données de rendez-vous (nom, téléphone, motif) : Conservées par le praticien concerné, qui agit en tant que responsable du traitement indépendant pour sa propre relation client. Naposolo agit en tant que sous-traitant pour le stockage et la transmission de ces données.</li>
          <li>Preuves de consentement : Conservées 3 ans (durée légale).</li>
        </ul>
      </div>

      <div style={section}>
        <div style={h2}>5. Vos droits (RGPD)</div>
        <div style={p}>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Droit d'accès : Obtenir une copie de vos données personnelles.</li>
          <li>Droit de rectification : Corriger des données inexactes ou incomplètes.</li>
          <li>Droit à l'effacement : Demander la suppression de vos données (sous réserve des obligations légales).</li>
          <li>Droit à la portabilité : Récupérer vos données dans un format structuré (JSON/CSV).</li>
          <li>Droit d'opposition : Vous opposer au traitement de vos données pour des motifs légitimes.</li>
          <li>Droit de limitation : Demander la limitation du traitement de vos données.</li>
        </ul>
        <div style={p}>Pour exercer ces droits : Envoyez une demande à <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a>. Une pièce d'identité ne sera demandée qu'en cas de doute sérieux sur votre identité, conformément aux recommandations de la <a href="https://www.cnil.fr" style={linkStyle} target="_blank" rel="noopener noreferrer">CNIL</a>.</div>
        <div style={p}>Réclamation : Vous avez le droit d'introduire une réclamation auprès de la CNIL si vous estimez que vos droits ne sont pas respectés.</div>
      </div>

      <div style={section}>
        <div style={h2}>6. Sécurité des données</div>
        <div style={p}>Naposolo met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Chiffrement : Les mots de passe sont hachés (algorithme bcrypt, coût 12) et jamais stockés en clair.</li>
          <li>Accès restreint : Seuls les administrateurs autorisés peuvent accéder aux données, avec une authentification à 2 facteurs (2FA).</li>
          <li>Audit régulier : Vérification trimestrielle des permissions et des accès.</li>
          <li>Sauvegardes : Données sauvegardées quotidiennement, avec une rétention de 30 jours.</li>
          <li>Protection contre les intrusions : Pare-feu, surveillance des activités suspectes, et mises à jour régulières des dépendances logicielles.</li>
        </ul>
      </div>

      <div style={section}>
        <div style={h2}>7. Mesure d'audience (Vercel Analytics)</div>
        <div style={p}>
          Nous utilisons Vercel Web Analytics pour mesurer la fréquentation du site
          (nombre de visiteurs, pages consultées). Cet outil ne dépose aucun cookie
          et ne collecte aucune donnée permettant de vous identifier individuellement
          ou de vous suivre d'un site à l'autre. Les données sont agrégées et utilisées
          uniquement à des fins statistiques internes, pour comprendre l'usage général
          du site.
        </div>
      </div>

      <div style={section}>
        <div style={h2}>8. Modifications de la politique</div>
        <div style={p}>Cette politique de confidentialité peut être mise à jour pour refléter des changements dans nos pratiques ou pour des raisons légales. La version la plus récente est toujours disponible sur cette page.</div>
        <div style={p}>En cas de modification substantielle, les utilisateurs seront notifiés par email (si un email valide est associé à leur compte).</div>
      </div>

      <div style={section}>
        <div style={h2}>9. Contact</div>
        <div style={p}>Pour toute question concernant cette politique ou l'utilisation de vos données, contactez-nous à : <a href="mailto:contact@naposolo.com" style={linkStyle}>contact@naposolo.com</a></div>
      </div>

      <div style={section}>
        <div style={h2}>10. Annexes</div>
        <div style={h3}>9.1. Définitions</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Données personnelles : Toute information se rapportant à une personne physique identifiée ou identifiable (ex. : nom, email, téléphone).</li>
          <li>Responsable du traitement : Entité qui détermine les finalités et les moyens du traitement (ici : Sébastien Alessandrelli-Giust pour Naposolo).</li>
          <li>Sous-traitant : Entité qui traite des données pour le compte du responsable du traitement (ex. : Supabase, Vercel).</li>
        </ul>
        <div style={h3}>9.2. Preuves de conformité</div>
        <ul style={{ ...p, paddingLeft: 20, marginTop: -4 }}>
          <li>Registre des activités de traitement : Disponible sur demande pour les autorités compétentes.</li>
          <li>Contrats avec les sous-traitants : Incluent des clauses RGPD (SCC, confidentialité, sécurité).</li>
          <li>Preuves de consentement : Horodatage des consentements stocké dans la base de données (Supabase).</li>
        </ul>
        <div style={{ ...p, fontSize: 12, color: '#9ca3af', marginTop: 16 }}>Document généré conformément au RGPD (UE) 2016/679 et aux recommandations de la CNIL.</div>
      </div>
    </div>
    <Footer />
    <div style={{ textAlign: 'center', paddingBottom: 32 }}>
      <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: '0.5px solid #e5e5e5', background: 'transparent', color: '#374151', cursor: 'pointer', fontSize: 13 }}>
        ← Retour à l'accueil
      </button>
    </div>
    </>
  );
}
