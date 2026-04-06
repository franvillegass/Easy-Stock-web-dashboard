'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [id, setId]     = useState('')
  const [error, setError] = useState('')
  const router          = useRouter()

  async function handleLogin() {
    if (!id.trim()) return
    const res = await fetch(`/api/check-entidad?id=${id.trim().toUpperCase()}`)
    const data = await res.json()
    if (data.exists) {
      router.push(`/dashboard/${id.trim().toUpperCase()}`)
    } else {
      setError('ID no encontrado.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16 }}>
      <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}>EasyStock</h1>
      <p style={{ color:'#555', marginBottom:8 }}>Ingresá el ID de tu programa</p>
      <input
        value={id}
        onChange={e => { setId(e.target.value); setError('') }}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        placeholder="Ej: A1B2C3D4"
        style={{ padding:'10px 16px', fontSize:16, border:'1px solid #ccc', borderRadius:8, width:240, textAlign:'center', letterSpacing:2 }}
      />
      {error && <p style={{ color:'red', fontSize:13 }}>{error}</p>}
      <button
        onClick={handleLogin}
        style={{ padding:'10px 28px', background:'#111', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer' }}
      >
        Ingresar
      </button>
    </div>
  )
}