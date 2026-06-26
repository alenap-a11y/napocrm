import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit() {
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.')
    if (password.length < 8) return setError('8 caractères minimum.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Choisir ton mot de passe</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>Bienvenue sur Naposolo 🎉 Définis ton mot de passe pour accéder à ton espace.</p>
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #ddd' }}
      />
      <input
        type="password"
        placeholder="Confirmer"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid #ddd' }}
      />
      {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', padding: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
      >
        {loading ? 'Enregistrement...' : 'Confirmer'}
      </button>
    </div>
  )
}
