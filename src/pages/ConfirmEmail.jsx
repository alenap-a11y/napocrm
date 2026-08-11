import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseClient } from '../lib/supabaseClient'

// Page de confirmation d'inscription servie sous naposolo.com (pas
// <projet>.supabase.co) — évite le lien générique supabase.co dans l'email,
// signalé par Resend comme facteur de filtrage anti-spam. Le lien email
// pointe ici avec token_hash + type + account_type, et cette page finalise
// la vérification côté client via verifyOtp() plutôt que de laisser
// Supabase rediriger depuis son propre domaine.
//
// account_type détermine QUEL client Supabase appelle verifyOtp() — donc
// dans QUELLE storageKey la session atterrit. Se tromper ici recréerait
// exactement le bug de contamination croisée client/praticien déjà corrigé
// (cf. étape "rôle exclusif").
export default function ConfirmEmail() {
  const [status, setStatus] = useState('verifying') // verifying | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type') || 'signup'
    const accountType = params.get('account_type')
    const isClient = accountType === 'client'

    if (!tokenHash) {
      setStatus('error')
      setErrorMsg('Lien de confirmation invalide ou incomplet.')
      return
    }

    const client = isClient ? supabaseClient : supabase
    client.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setStatus('error')
        setErrorMsg(error.message.includes('expired') || error.message.includes('invalid')
          ? 'Ce lien a expiré ou a déjà été utilisé.'
          : error.message)
      } else {
        window.location.replace(isClient ? '/client/accueil' : '/')
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f9ff', fontFamily: 'system-ui, -apple-system, sans-serif', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', border: '0.5px solid rgba(14,165,233,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)' }}>
        {status === 'verifying' && (
          <>
            <i className="ti ti-loader-2" style={{ fontSize: 28, color: '#0EA5E9', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>Confirmation de votre email...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <i className="ti ti-alert-circle" style={{ fontSize: 28, color: '#A32D2D' }} />
            <p style={{ marginTop: 16, fontSize: 14, color: '#374151' }}>{errorMsg}</p>
            <a href="/login" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#0EA5E9', fontWeight: 600 }}>Retour à la connexion</a>
          </>
        )}
      </div>
    </div>
  )
}
