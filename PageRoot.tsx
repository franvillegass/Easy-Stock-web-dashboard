'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [id, setId]       = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router            = useRouter()

  async function handleLogin() {
    const val = id.trim().toUpperCase()
    if (!val) return
    setLoading(true)
    const { data } = await supabase.from('entidades').select('id').eq('id', val).single()
    setLoading(false)
    if (data) {
      router.push(`/dashboard/${val}`)
    } else {
      setError('ID no encontrado.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:12, background:'#f7f7f7' }}>
      <h1 style={{ fontSize:30, fontWeight:800, margin:0, letterSpacing:-1 }}>EasyStock</h1>
      <p style={{ color:'#666', margin:0, fontSize:14 }}>Ingresá el ID de tu programa para acceder al panel</p>
      <input
        value={id}
        onChange={e => { setId(e.target.value.toUpperCase()); setError('') }}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        placeholder="Ej: A1B2C3D4"
        maxLength={8}
        style={{ marginTop:8, padding:'10px 16px', fontSize:18, border:'1px solid #ccc', borderRadius:8, width:220, textAlign:'center', letterSpacing:3, outline:'none' }}
      />
      {error && <p style={{ color:'#e74c3c', fontSize:13, margin:0 }}>{error}</p>}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding:'10px 32px', background:'#111', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer', opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Verificando...' : 'Ingresar'}
      </button>
    </div>
  )
}