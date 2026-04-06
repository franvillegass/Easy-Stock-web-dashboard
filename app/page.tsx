'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setLoaded(true)
  }, [])

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

  const bgStyle = {
    position: 'relative' as const,
    minHeight: '100vh',
    overflow: 'hidden' as const,
    background: '#080a0e'
  }

  const noiseStyle = {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: 999,
    opacity: 0.025,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat',
    backgroundSize: '128px 128px'
  }

  const orb1Style = {
    position: 'absolute' as const,
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: '#e8ff57',
    filter: 'blur(100px)',
    opacity: 0.12,
    top: '-200px',
    right: '-200px',
    animation: 'orbFloat1 12s ease-in-out infinite',
    pointerEvents: 'none' as const
  }

  const orb2Style = {
    position: 'absolute' as const,
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: '#57d9ff',
    filter: 'blur(100px)',
    opacity: 0.1,
    bottom: '100px',
    left: '-100px',
    animation: 'orbFloat2 16s ease-in-out infinite',
    pointerEvents: 'none' as const
  }

  const orb3Style = {
    position: 'absolute' as const,
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: '#ff6b57',
    filter: 'blur(100px)',
    opacity: 0.06,
    top: '50%',
    left: '40%',
    animation: 'orbFloat3 20s ease-in-out infinite',
    pointerEvents: 'none' as const
  }

  const gridStyle = {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
    pointerEvents: 'none' as const
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '8rem 2.5rem 5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: 20,
    position: 'relative' as const,
    zIndex: 1
  }

  const titleStyle = {
    fontSize: 'clamp(3.5rem, 7vw, 6rem)',
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    color: '#e8eaf0',
    textAlign: 'center' as const,
    marginBottom: 8,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease'
  }

  const sloganStyle = {
    fontSize: 18,
    color: '#5a5f72',
    marginBottom: 32,
    textAlign: 'center' as const,
    maxWidth: 600,
    lineHeight: 1.5,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s'
  }

  const inputStyle = {
    padding: '12px 20px',
    fontSize: 16,
    border: '2px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    width: 280,
    textAlign: 'center' as const,
    letterSpacing: 2,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    background: '#111520',
    color: '#e8eaf0',
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s, border-color 0.2s ease'
  }

  const buttonStyle = {
    padding: '12px 32px',
    background: '#e8ff57',
    color: '#080a0e',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.1s ease',
    boxShadow: '0 4px 12px rgba(232, 255, 87, 0.3)',
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s, background 0.2s ease, transform 0.1s ease'
  }

  const errorStyle = {
    color: '#ff6b57',
    fontSize: 14,
    marginTop: 8,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s'
  }

  return (
    <>
      <style jsx>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.1); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 20px) scale(0.9); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, 10px) scale(1.05); }
        }
      `}</style>
      <div style={bgStyle}>
        <div style={noiseStyle}></div>
        <div style={orb1Style}></div>
        <div style={orb2Style}></div>
        <div style={orb3Style}></div>
        <div style={gridStyle}></div>
        <div style={containerStyle}>
          <h1 style={titleStyle}>EasyStock</h1>
          <p style={sloganStyle}>
            Desde esta web podés ver en tiempo real el stock y las ventas de todas tus sucursales.
          </p>
          <input
            value={id}
            onChange={e => { setId(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Ej: A1B2C3D4"
            style={inputStyle}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#e8ff57'}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.07)'}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button
            onClick={handleLogin}
            style={buttonStyle}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1)'}
          >
            Ingresar
          </button>
        </div>
      </div>
    </>
  )
}