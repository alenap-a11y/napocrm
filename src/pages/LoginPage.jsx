import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email) { setError('Saisis ton email avant de cliquer sur "Mot de passe oublié".'); return }
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`
    })
    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo"><img src="/src/assets/napopetitv1.png" alt="NapoCRM" style={{ height: 32, width: 'auto', objectFit: 'contain' }} /></div>
        <div className="login-sub">Espace praticien</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nathalie@exemple.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error"><i className="ti ti-alert-circle" aria-hidden="true" />{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <i className="ti ti-loader-2 spin" aria-hidden="true" /> : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          {resetSent
            ? <span style={{ color: '#4a7c5b' }}>Email envoyé — vérifie ta boîte mail.</span>
            : <a href="#" onClick={handleForgotPassword}>Mot de passe oublié ?</a>
          }
        </div>
      </div>
    </div>
  )
}
