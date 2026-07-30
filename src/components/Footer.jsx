export default function Footer() {
  return (
    <footer style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '32px', paddingBottom: '24px', maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr 1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Bloc logo + description + réseaux */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {/* Remplacer par le vrai logo une fois hébergé, ex: <img src="/favicon.png" alt="Naposolo" width={32} height={32} /> */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#2E9BC7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                fontSize: 14,
                color: 'white',
              }}
            >
              N
            </div>
            <span style={{ fontWeight: 500, fontSize: 15 }}>Naposolo — naposolo.com</span>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: '16px' }}>
            Le CRM pensé pour les praticiens du bien-être. Agenda, séances et modules
            métiers réunis en un seul outil.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="https://facebook.com/VOTRE_PAGE"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Naposolo sur Facebook"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '0.5px solid #e5e5e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Icône Facebook — remplacer par votre lib d'icônes existante (ex: lucide-react) */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Colonne Produit */}
        <nav aria-label="Produit">
          <div style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.03em', marginBottom: '14px' }}>
            PRODUIT
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 13 }}>
            <li><a href="/modules" style={{ color: '#6b7280', textDecoration: 'none' }}>Modules</a></li>
            <li><a href="/tarifs" style={{ color: '#6b7280', textDecoration: 'none' }}>Tarifs</a></li>
            <li><a href="/securite" style={{ color: '#6b7280', textDecoration: 'none' }}>Sécurité</a></li>
            <li><a href="/nouveautes" style={{ color: '#6b7280', textDecoration: 'none' }}>Nouveautés</a></li>
          </ul>
        </nav>

        {/* Colonne Naposolo */}
        <nav aria-label="Naposolo">
          <div style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.03em', marginBottom: '14px' }}>
            NAPOSOLO
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 13 }}>
            <li><a href="/a-propos" style={{ color: '#6b7280', textDecoration: 'none' }}>À propos</a></li>
            <li><a href="/aide" style={{ color: '#6b7280', textDecoration: 'none' }}>Aide</a></li>
            <li><a href="/contact" style={{ color: '#6b7280', textDecoration: 'none' }}>Contact</a></li>
            <li><a href="/devenir-testeur" style={{ color: '#6b7280', textDecoration: 'none' }}>Devenir testeur</a></li>
          </ul>
        </nav>

        {/* Colonne Légal */}
        <nav aria-label="Légal">
          <div style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.03em', marginBottom: '14px' }}>
            LÉGAL
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 13 }}>
            <li>
              <a href="/politique-confidentialite" style={{ color: '#6b7280', textDecoration: 'none' }}>
                Politique de confidentialité
              </a>
            </li>
            <li><a href="/mentions-legales" style={{ color: '#6b7280', textDecoration: 'none' }}>Mentions légales</a></li>
          </ul>
        </nav>
      </div>

      <div
        style={{
          borderTop: '0.5px solid #e5e5e5',
          marginTop: '28px',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          © {new Date().getFullYear()} Naposolo. Fait avec ❤️ à Vandœuvre-lès-Nancy.
        </div>
      </div>
    </footer>
  );
}
