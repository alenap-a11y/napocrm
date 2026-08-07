import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NapoOracleSéance from '../pages/NapoOracleSéance'
import EnergieSéance from '../pages/EnergieSéance'
import MagnetismeSeance from '../pages/MagnetismeSeance'
import MediumniteSeance from '../pages/MediumniteSeance'
import RadiesthesieSeance from '../pages/RadiesthesieSeance'
import YogaSeance from '../pages/YogaSeance'
import NaturopathieSeance from '../pages/NaturopathieSeance'
import AromatherapieSeance from '../pages/AromatherapieSeance'
import SonotherapieSeance from '../pages/SonotherapieSeance'
import MassageSeance from '../pages/MassageSeance'
import SophrologieSeance from '../pages/SophrologieSeance'
import HypnotherapieSeance from '../pages/HypnotherapieSeance'
import ChamanismeSeance from '../pages/ChamanismeSeance'
import AstrologieSeance from '../pages/AstrologieSeance'

const MODULES = {
  oracle:       { table: 'napo_oracle_seances', label: 'Napo-Oracle',       backTo: id => `/napo-oracle/${id}`,   Component: NapoOracleSéance },
  energie:      { table: 'energie_seances',     label: 'NapoÉnergie',       backTo: id => `/energie/${id}`,       Component: EnergieSéance },
  magnetisme:   { table: 'fiches_magnetisme',   label: 'Napo-Magnétiseur',  backTo: id => `/magnetisme/${id}`,    Component: MagnetismeSeance },
  mediumnite:   { table: 'fiches_mediumnite',   label: 'Napo-Médium',       backTo: id => `/mediumnite/${id}`,    Component: MediumniteSeance },
  radiesthesie: { table: 'fiches_radiesthesie', label: 'Napo-Radiesthésie', backTo: id => `/radiesthesie/${id}`,  Component: RadiesthesieSeance },
  yoga:         { table: 'fiches_yoga',         label: 'Napo-Yoga',         backTo: id => `/napo-yoga/${id}`,     Component: YogaSeance },
  naturopathie: { table: 'fiches_naturopathie',  label: 'Napo-Naturopathie', backTo: id => `/napo-naturopathie/${id}`, Component: NaturopathieSeance },
  aromatherapie: { table: 'fiches_aromatherapie', label: 'Napo-Aromathérapie', backTo: id => `/napo-aromatherapie/${id}`, Component: AromatherapieSeance },
  sonotherapie: { table: 'fiches_sonotherapie', label: 'Napo-Sonothérapie', backTo: id => `/napo-sonotherapie/${id}`, Component: SonotherapieSeance },
  massage: { table: 'fiches_massage', label: 'Napo-Massage', backTo: id => `/napo-massage/${id}`, Component: MassageSeance },
  sophrologie: { table: 'fiches_sophrologie', label: 'Napo-Sophrologie', backTo: id => `/napo-sophrologie/${id}`, Component: SophrologieSeance },
  hypnotherapie: { table: 'fiches_hypnotherapie', label: 'Napo-Hypnothérapie', backTo: id => `/napo-hypnotherapie/${id}`, Component: HypnotherapieSeance },
  chamanisme: { table: 'fiches_chamanisme', label: 'Napo-Chamanisme', backTo: id => `/napo-chamanisme/${id}`, Component: ChamanismeSeance },
  astrologie: { table: 'fiches_astrologie', label: 'Napo-Astrologie', backTo: id => `/napo-astrologie/${id}`, Component: AstrologieSeance },
}

export default function NapoLive() {
  const { module, id } = useParams()
  const navigate = useNavigate()
  const [jitsiRoomId, setJitsiRoomId] = useState(null)
  const [loading, setLoading] = useState(true)

  const mod = MODULES[module]

  useEffect(() => {
    if (!mod) { navigate('/board'); return }
    async function load() {
      const { data } = await supabase.from(mod.table)
        .select('jitsi_room_id').eq('id', id).single()
      if (!data) { navigate(mod.backTo(id)); return }
      setJitsiRoomId(data.jitsi_room_id)
      setLoading(false)
    }
    load()
  }, [module, id])

  if (!mod) return null
  if (loading) return <div style={{ padding:'2rem', color:'var(--color-text-secondary)', fontSize:13 }}>Chargement…</div>

  const SeanceComponent = mod.Component

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        <button onClick={() => navigate(mod.backTo(id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:13, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize:15 }} />Quitter le direct
        </button>
        <span style={{ color:'var(--color-border-secondary)' }}>/</span>
        <i className="ti ti-video" style={{ fontSize:16, color:'var(--color-accent)' }} />
        <span style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>Napo-Live — {mod.label}</span>
      </div>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        <div style={{ width:'50%', flexShrink:0, background:'#000' }}>
          <iframe
            title="Napo-Live — visio"
            src={`https://meet.jit.si/${jitsiRoomId}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width:'100%', height:'100%', border:'none' }}
          />
        </div>
        <div style={{ width:'50%', flexShrink:0, overflowY:'auto' }}>
          <SeanceComponent />
        </div>
      </div>
    </div>
  )
}
