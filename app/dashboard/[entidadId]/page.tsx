'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Row = Record<string, unknown>

const card: React.CSSProperties = { background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 3px #0001', marginBottom:16 }
const tbl: React.CSSProperties  = { width:'100%', borderCollapse:'collapse', fontSize:13 }
const th: React.CSSProperties   = { textAlign:'left', padding:'7px 10px', borderBottom:'2px solid #f0f0f0', color:'#888', fontWeight:600, fontSize:12 }
const td: React.CSSProperties   = { padding:'7px 10px', borderBottom:'1px solid #f5f5f5', verticalAlign:'top' }

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:color, color:'#fff' }}>{label}</span>
}

function TabBtn({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'7px 16px', borderRadius:7, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background: active ? '#111' : '#e8e8e8', color: active ? '#fff' : '#444', transition:'all .15s' }}>
      {label}
    </button>
  )
}

export default function Dashboard({ params }: { params: { entidadId: string } }) {
  const { entidadId } = params
  const [sucursales, setSucursales] = useState<Row[]>([])
  const [selSuc, setSelSuc]         = useState<string | null>(null)
  const [tab, setTab]               = useState('productos')
  const [productos, setProductos]   = useState<Row[]>([])
  const [ofertas, setOfertas]       = useState<Row[]>([])
  const [ventas, setVentas]         = useState<Row[]>([])
  const [cierres, setCierres]       = useState<Row[]>([])
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    supabase.from('sucursales').select('*').eq('entidad_id', entidadId).then(({ data }) => {
      if (data?.length) { setSucursales(data); setSelSuc(data[0].id as string) }
    })
  }, [entidadId])

  useEffect(() => {
    if (!selSuc) return
    setLoading(true)
    Promise.all([
      supabase.from('productos').select('*').eq('sucursal_id', selSuc).order('nombre'),
      supabase.from('ofertas').select('*').eq('sucursal_id', selSuc).order('activa', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*)').eq('sucursal_id', selSuc).order('fecha', { ascending: false }),
      supabase.from('cierres_caja').select('*').eq('sucursal_id', selSuc).order('fecha_cierre', { ascending: false }),
    ]).then(([p, o, v, c]) => {
      setProductos(p.data as Row[] || [])
      setOfertas(o.data as Row[] || [])
      setVentas(v.data as Row[] || [])
      setCierres(c.data as Row[] || [])
      setLoading(false)
    })
  }, [selSuc])

  const suc = sucursales.find(s => s.id === selSuc)
  const fmt = (n: unknown) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const fdate = (s: unknown) => new Date(String(s)).toLocaleString('es-AR')

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 16px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ margin:0, fontSize:35, fontWeight:800, letterSpacing:-1 }}>EasyStock</h1>
          <p style={{ margin:'2px 0 0', color:'#aaa', fontSize:12 }}>ID: {entidadId}</p>
        </div>
        {suc && (
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontSize:17, fontWeight:600 }}>{String(suc.nombre)}</p>
            <p style={{ margin:0, fontSize:14, color:'#aaa' }}>
              Última sync: {suc.ultima_sync ? fdate(suc.ultima_sync) : '—'}
            </p>
          </div>
        )}
      </div>

      {sucursales.length > 1 && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {sucursales.map(s => (
            <TabBtn key={String(s.id)} label={String(s.nombre)} active={s.id === selSuc} onClick={() => setSelSuc(String(s.id))} />
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {['productos', 'ofertas', 'ventas', 'cierres'].map(t => (
          <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {loading && <p style={{ color:'#aaa', textAlign:'center', padding:40 }}>Cargando...</p>}

      {!loading && tab === 'productos' && (
        <div style={card}>
          <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:16 }}>Productos <span style={{ fontWeight:400, color:'#aaa', fontSize:13 }}>({productos.length})</span></p>
          <table style={tbl}>
            <thead>
              <tr><th style={th}>Nombre</th><th style={th}>Stock</th><th style={th}>Precio</th><th style={th}>Código</th></tr>
            </thead>
            <tbody>
              {productos.map((p, i) => (
                <tr key={i}>
                  <td style={td}>{String(p.nombre)}</td>
                  <td style={td}><Badge label={String(p.stock)} color={Number(p.stock) <= 0 ? '#e74c3c' : Number(p.stock) <= 5 ? '#f39c12' : '#27ae60'} /></td>
                  <td style={td}>{fmt(p.precio)}</td>
                  <td style={{ ...td, color:'#aaa' }}>{String(p.codigo_barras || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'ofertas' && (
        <div style={card}>
          <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:16 }}>Ofertas <span style={{ fontWeight:400, color:'#aaa', fontSize:13 }}>({ofertas.length})</span></p>
          <table style={tbl}>
            <thead>
              <tr><th style={th}>Nombre</th><th style={th}>Precio</th><th style={th}>Vence</th><th style={th}>Estado</th></tr>
            </thead>
            <tbody>
              {ofertas.map((o, i) => (
                <tr key={i}>
                  <td style={td}>{String(o.nombre)}</td>
                  <td style={td}>{fmt(o.precio)}</td>
                  <td style={td}>{o.expira_at ? new Date(String(o.expira_at)).toLocaleDateString('es-AR') : 'Sin vencimiento'}</td>
                  <td style={td}><Badge label={o.activa ? 'Activa' : 'Expirada'} color={o.activa ? '#27ae60' : '#aaa'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'ventas' && (
        <div style={card}>
          <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:16 }}>Historial de ventas <span style={{ fontWeight:400, color:'#aaa', fontSize:13 }}>({ventas.length})</span></p>
          <table style={tbl}>
            <thead>
              <tr><th style={th}>#</th><th style={th}>Fecha</th><th style={th}>Método</th><th style={th}>Desc.</th><th style={th}>Total</th><th style={th}>Items</th></tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => {
                const items = (v.venta_items as Row[]) || []
                return (
                  <tr key={i}>
                    <td style={{ ...td, color:'#aaa', fontSize:11 }}>{String(v.id)}</td>
                    <td style={td}>{fdate(v.fecha)}</td>
                    <td style={td}><Badge label={String(v.metodo_pago).toUpperCase()} color='#3498db' /></td>
                    <td style={td}>{Number(v.descuento_total) > 0 ? <Badge label={`-${v.descuento_total}%`} color='#e67e22' /> : '—'}</td>
                    <td style={{ ...td, fontWeight:700 }}>{fmt(v.total)}</td>
                    <td style={td}>
                      {items.map((it, j) => (
                        <div key={j} style={{ fontSize:12, color:'#555', lineHeight:1.6 }}>
                          {String(it.producto)} ×{String(it.cantidad)} — {fmt(it.subtotal)}
                          {Number(it.descuento_item) > 0 && <span style={{ color:'#e67e22' }}> (-{String(it.descuento_item)}%)</span>}
                          {Boolean(it.es_oferta) && <span style={{ color:'#9b59b6', marginLeft:4 }}>[oferta]</span>}
                        </div>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'cierres' && (
        <div style={card}>
          <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:16 }}>Cierres de caja <span style={{ fontWeight:400, color:'#aaa', fontSize:13 }}>({cierres.length})</span></p>
          <table style={tbl}>
            <thead>
              <tr><th style={th}>Fecha cierre</th><th style={th}>Efectivo</th><th style={th}>Transfer.</th><th style={th}>QR</th><th style={th}>Subtotal items</th><th style={th}>Total</th></tr>
            </thead>
            <tbody>
              {cierres.map((c, i) => (
                <tr key={i}>
                  <td style={td}>{fdate(c.fecha_cierre)}</td>
                  <td style={td}>{fmt(c.total_efectivo)}</td>
                  <td style={td}>{fmt(c.total_transferencia)}</td>
                  <td style={td}>{fmt(c.total_qr)}</td>
                  <td style={td}>{fmt(c.subtotal_productos)}</td>
                  <td style={{ ...td, fontWeight:700 }}>{fmt(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}