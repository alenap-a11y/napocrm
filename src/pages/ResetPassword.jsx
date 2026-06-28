import { useState } from "react"
import { supabase } from "../lib/supabase"
import napopetit from "../assets/napopetitv1.png"

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  let pwd = upper[Math.floor(Math.random()*upper.length)]
           + lower[Math.floor(Math.random()*lower.length)]
           + digits[Math.floor(Math.random()*digits.length)]
           + special[Math.floor(Math.random()*special.length)]
  for (let i = 0; i < 8; i++) pwd += all[Math.floor(Math.random()*all.length)]
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [message,  setMessage]  = useState("")
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(true)
  const [done,     setDone]     = useState(false)

  function handleGenerate() {
    const pwd = generatePassword()
    setPassword(pwd)
    setConfirm(pwd)
  }

  async function handleReset() {
    if (!password || password.length < 8) { setMessage("Minimum 8 caractères."); return }
    if (password !== confirm) { setMessage("Les mots de passe ne correspondent pas."); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setMessage("Erreur : " + error.message) }
    else { setDone(true); setTimeout(() => onDone?.(), 2500) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: '#111827', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={napopetit} alt="Naposolo" style={{ height: 28 }} />
        <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Napo<span style={{ color: '#4BBFCE' }}>solo</span></span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#1d3a4a', color: '#4BBFCE', marginLeft: 4 }}>Alpha</span>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '0.5px solid rgba(75,191,206,0.2)' }}>

          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Mot de passe mis à jour !</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Redirection en cours...</div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#4BBFCE18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🔐</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Nouveau mot de passe</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Choisissez un mot de passe sécurisé pour votre espace Naposolo</div>
              </div>

              {message && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13, marginBottom: 16 }}>
                  {message}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nouveau mot de passe</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={inp}
                  />
                  <button onClick={() => setShowPwd(s => !s)}
                    style={{ padding: '0 12px', borderRadius: 8, border: '0.5px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: 16 }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Confirmer</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inp}
                />
              </div>

              <button onClick={handleGenerate}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '0.5px solid #4BBFCE', background: '#f0f9ff', color: '#0369A1', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🎲 Générer un mot de passe sécurisé
              </button>

              {password && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F0F9FF', border: '0.5px solid #BAE6FD', fontSize: 12, color: '#0369A1', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>💡 Notez ce mot de passe avant de continuer</span>
                  <button onClick={() => navigator.clipboard.writeText(password)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>📋</button>
                </div>
              )}

              <button onClick={handleReset} disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: loading ? '#7dd3fc' : '#4BBFCE', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48 }}>
                {loading ? 'Enregistrement…' : 'Mettre à jour mon mot de passe →'}
              </button>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' }}>"Les petits font les grands !"</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inp = {
  flex: 1, width: '100%', padding: '10px 12px', borderRadius: 8, minHeight: 44,
  border: '0.5px solid #d1d5db', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
