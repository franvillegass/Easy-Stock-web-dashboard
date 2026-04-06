'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const S = {
  wrap:    { maxWidth:1100, margin:'0 auto', padding:'24px 16px' } as React.CSSProperties,
  card:    { background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 4px #0001', marginBottom:16 } as React.CSSProperties,
  title:   { fontSize:20, fontWeight:700, marginBottom:12 } as React.CSSProperties,
  sub:     { fontSize:13, color:'#888', marginBottom:8 } as React.CSSProperties,
  table:   { width:'100%', borderCollapse:'collapse' as const, fontSize:13 },
  th:      { textAlign:'left' as const, padding:'6px 10px', borderBottom:'1px solid #eee', color:'#888', fontWeight:600 },
  td:      { padding:'6px 10px', borderBottom:'1px solid #f0f0f0' },
  tabs:    { display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' as const },
  tab:     (active: boolean) => ({ padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', background: active ? '#111' : '#e0e0e0', color: active ? '#fff' : '#333', fontWeight:600, fontSize:13 }),
  badge:   (color: string) => ({ display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:color, color:'#fff' }),
}

type Sucursal = { id: string; nombre: string; ultima_sync: string | null }

export default function Dashboard({ params }: { params: { entidadId: string } }) {
  const { entidadId } = params
  const [sucursales, setSucursales]   = useState<Sucursal[]>([])
  const [selected, setSelected]       = useState<string | null>(null)
  const [tab, setTab]                 = useState('productos')
  const [data, setData]               = useState<Record<string, unknown[]>>({})
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    supabase.from('sucursales').select('*').eq('entidad_id', entidadId)
      .then(({ data }) => {
        if (data?.length) { setSucursales(data); setSelected(data[0].id) }
      })
  }, [entidadId])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      supabase.from('productos').select('*, producto_categorias(categorias(nombre))').eq('sucursal_id', selected),
      supabase.from('ofertas').select('*').eq('sucursal_id', selected).order('activa', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*)').eq('sucursal_id', selected).order('fecha', { ascending: false }),
      supabase.from('cierres_caja').select('*').eq('sucursal_id', selected).order('fecha_cierre', { ascending: false }),
    ]).then(([p, o, v, c]) => {
      setData({ productos: p.data || [], ofertas: o.data || [], ventas: v.data || [], cierres: c.data || [] })
      setLoading(false)
    })
  }, [selected])

  const suc = sucursales.find(s => s.id === selected)

  return (
    <div style={S.wrap}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, margin:0 }}>EasyStock</h1>
          <p style={{ margin:0, color:'#888', fontSize:13 }}>ID: {entidadId}</p>
        </div>
        {suc && <p style={{ fontSize:12, color:'#aaa' }}>Sync: {suc.ultima_sync ? new Date(suc.ultima_sync).toLocaleString('es-AR') : '—'}</p>}
      </div>

      <div style={S.tabs}>
        {sucursales.map(s => (
          <button key={s.id} style={S.tab(s.id === selected)} onClick={() => setSelected(s.id)}>
            {s.nombre}
          </button>
        ))}
      </div>

      <div style={S.tabs}>
        {['productos','ofertas','ventas','cierres'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color:'#aaa' }}>Cargando...</p>}

      {!loading && tab === 'productos' && <TabProductos rows={data.productos || []} />}
      {!loading && tab === 'ofertas'   && <TabOfertas   rows={data.ofertas   || []} />}
      {!loading && tab === 'ventas'    && <TabVentas    rows={data.ventas    || []} />}
      {!loading && tab === 'cierres'   && <TabCierres   rows={data.cierres   || []} />}
    </div>
  )
}

function TabProductos({ rows }: { rows: unknown[] }) {
  return (
    <div style={S.card}>
      <div style={S.title}>Productos ({rows.length})</div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Nombre</th><th style={S.th}>Stock</th><th style={S.th}>Precio</th><th style={S.th}>Código</th></tr></thead>
        <tbody>
          {(rows as Record<string,unknown>[]).map((p,i) => (
            <tr key={i}>
              <td style={S.td}>{String(p.nombre)}</td>
              <td style={S.td}><span style={S.badge(Number(p.stock)<=0?'#e74c3c':Number(p.stock)<=5?'#f39c12':'#27ae60')}>{String(p.stock)}</span></td>
              <td style={S.td}>${Number(p.precio).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
              <td style={S.td}>{String(p.codigo_barras||'—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabOfertas({ rows }: { rows: unknown[] }) {
  return (
    <div style={S.card}>
      <div style={S.title}>Ofertas</div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Nombre</th><th style={S.th}>Precio</th><th style={S.th}>Vence</th><th style={S.th}>Estado</th></tr></thead>
        <tbody>
          {(rows as Record<string,unknown>[]).map((o,i) => {
            const activa = Boolean(o.activa)
            return (
              <tr key={i}>
                <td style={S.td}>{String(o.nombre)}</td>
                <td style={S.td}>${Number(o.precio).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
                <td style={S.td}>{o.expira_at ? new Date(String(o.expira_at)).toLocaleDateString('es-AR') : 'Sin vencimiento'}</td>
                <td style={S.td}><span style={S.badge(activa?'#27ae60':'#aaa')}>{activa?'Activa':'Expirada'}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TabVentas({ rows }: { rows: unknown[] }) {
  const [open, setOpen] = useState<number|null>(null)
  return (
    <div style={S.card}>
      <div style={S.title}>Historial de ventas ({rows.length})</div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>#</th><th style={S.th}>Fecha</th><th style={S.th}>Método</th><th style={S.th}>Total</th><th style={S.th}></th></tr></thead>
        <tbody>
          {(rows as Record<string,unknown>[]).map((v,i) => (
            <>
              <tr key={i}>
                <td style={S.td}>{String(v.id)}</td>
                <td style={S.td}>{new Date(String(v.fecha)).toLocaleString('es-AR')}</td>
                <td style={S.td}><span style={S.badge('#3498db')}>{String(v.metodo_pago).toUpperCase()}</span></td>
                <td style={S.td}>${Number(v.total).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
                <td style={S.td}><button onClick={()=>setOpen(open===i?null:i)} style={{border:'none',background:'none',cursor:'pointer',color:'#3498db',fontSize:12}}>ver items</button></td>
              </tr>
              {open===i && (
                <tr key={`${i}_items`}>
                  <td colSpan={5} style={{...S.td, background:'#fafafa', paddingLeft:24}}>
                    {((v.venta_items as Record<string,unknown>[])||[]).map((it,j)=>(
                      <div key={j} style={{fontSize:12,padding:'2px 0'}}>
                        {String(it.producto)} × {String(it.cantidad)} — ${Number(it.subtotal).toLocaleString('es-AR',{minimumFractionDigits:2})}
                        {Number(it.descuento_item)>0 && <span style={{color:'#e67e22'}}> (-{String(it.descuento_item)}%)</span>}
                      </div>
                    ))}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabCierres({ rows }: { rows: unknown[] }) {
  return (
    <div style={S.card}>
      <div style={S.title}>Cierres de caja ({rows.length})</div>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Cierre</th><th style={S.th}>Efectivo</th><th style={S.th}>Transfer.</th><th style={S.th}>QR</th><th style={S.th}>Total</th></tr></thead>
        <tbody>
          {(rows as Record<string,unknown>[]).map((c,i) => (
            <tr key={i}>
              <td style={S.td}>{new Date(String(c.fecha_cierre)).toLocaleString('es-AR')}</td>
              <td style={S.td}>${Number(c.total_efectivo).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
              <td style={S.td}>${Number(c.total_transferencia).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
              <td style={S.td}>${Number(c.total_qr).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
              <td style={S.td} style={{fontWeight:700}}>${Number(c.total).toLocaleString('es-AR',{minimumFractionDigits:2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}