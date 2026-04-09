'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useNotifications } from '@/components/notifications/NotificationContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type Row = Record<string, unknown>

type VentaItem = {
  producto: string
  cantidad: number
  subtotal: number
  descuento_item?: number
  es_oferta?: boolean
}

// ── Estilos base ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 10, padding: 20,
  boxShadow: '0 1px 3px #0001', marginBottom: 16,
}
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th: React.CSSProperties  = { textAlign: 'left', padding: '7px 10px', borderBottom: '2px solid #f0f0f0', color: '#888', fontWeight: 600, fontSize: 12 }
const td: React.CSSProperties  = { padding: '7px 10px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'top' }

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color, color: '#fff' }}>
      {label}
    </span>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: active ? '#111' : '#e8e8e8', color: active ? '#fff' : '#444', transition: 'all .15s' }}>
      {label}
    </button>
  )
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
function startOf(periodo: string): Date {
  const now = new Date()
  if (periodo === 'semana') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (periodo === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (periodo === 'año')  return new Date(now.getFullYear(), 0, 1)
  return new Date(0) // siempre
}

function fmtMoney(n: unknown) {
  return `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function fdate(s: unknown) {
  return new Date(String(s)).toLocaleString('es-AR')
}

// ── Panel de estadísticas ─────────────────────────────────────────────────────
function StatsPanel({ ventas }: { ventas: Row[] }) {
  const [agrupacion, setAgrupacion] = useState<'dia' | 'semana' | 'mes'>('dia')
  const [periodo,    setPeriodo]    = useState<'semana' | 'mes' | 'año' | 'siempre'>('mes')
  const [producto,   setProducto]   = useState<string>('')

  // Todos los items de todas las ventas
  const allItems = useMemo(() =>
    ventas.flatMap(v => {
      const items = (v.venta_items as VentaItem[]) || []
      return items.map(it => ({ ...it, fecha: v.fecha, venta_total: v.total }))
    }),
  [ventas]) as (VentaItem & { fecha: unknown; venta_total: unknown })[]


  // Lista de productos con ventas
  const productosConVentas = useMemo(() => {
    const set = new Set(allItems.map(it => String(it.producto)))
    return Array.from(set).sort()
  }, [allItems])

  useEffect(() => {
    if (productosConVentas.length && !producto) setProducto(productosConVentas[0])
  }, [productosConVentas, producto])

  // ── KPIs ──
  const kpis = useMemo(() => {
    const now   = new Date()
    const mesIn = new Date(now.getFullYear(), now.getMonth(), 1)
    const ventasMes = ventas.filter(v => new Date(String(v.fecha)) >= mesIn)

    const total_mes     = ventasMes.reduce((a, v) => a + Number(v.total), 0)
    const ventas_mes    = ventasMes.length
    const uds_mes       = ventasMes.flatMap(v => (v.venta_items as Row[]) || [])
                          .reduce((a, it) => a + Number(it.cantidad), 0)
    const total_hist    = ventas.reduce((a, v) => a + Number(v.total), 0)

    return { total_mes, ventas_mes, uds_mes, total_hist }
  }, [ventas])

  // ── Serie de tiempo para el producto seleccionado ──
  const serieProducto = useMemo(() => {
    if (!producto) return []
    const items = allItems.filter(it => String(it.producto) === producto)

    type Bucket = { ingresos: number; unidades: number }
    const map = new Map<string, Bucket>()

    items.forEach(it => {
      const d = new Date(String(it.fecha))
      let key: string
      if (agrupacion === 'dia') {
        key = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      } else if (agrupacion === 'semana') {
        // Lunes de la semana
        const mon = new Date(d)
        mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
        key = mon.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      } else {
        key = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
      }
      const prev = map.get(key) ?? { ingresos: 0, unidades: 0 }
      map.set(key, {
        ingresos: prev.ingresos + Number(it.subtotal),
        unidades: prev.unidades + Number(it.cantidad),
      })
    })

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([periodo, v]) => ({ periodo, ...v }))
  }, [allItems, producto, agrupacion])

  // ── Ingresos totales últimos 30 días ──
  const serie30d = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 29)
    cutoff.setHours(0, 0, 0, 0)

    const map = new Map<string, number>()
    ventas.forEach(v => {
      const d = new Date(String(v.fecha))
      if (d < cutoff) return
      const key = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      map.set(key, (map.get(key) ?? 0) + Number(v.total))
    })

    // Rellenar días vacíos
    const result: { dia: string; ingresos: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
      result.push({ dia: key, ingresos: map.get(key) ?? 0 })
    }
    return result
  }, [ventas])

  // ── Top productos ──
  const topProductos = useMemo(() => {
    const from = startOf(periodo)
    const items = allItems.filter(it => new Date(String(it.fecha)) >= from)

    const map = new Map<string, { ingresos: number; unidades: number }>()
    items.forEach(it => {
      const nombre = String(it.producto)
      const prev   = map.get(nombre) ?? { ingresos: 0, unidades: 0 }
      map.set(nombre, {
        ingresos: prev.ingresos + Number(it.subtotal),
        unidades: prev.unidades + Number(it.cantidad),
      })
    })

    const arr = Array.from(map.entries()).map(([nombre, v]) => ({ nombre, ...v }))
    const byIng = [...arr].sort((a, b) => b.ingresos - a.ingresos).slice(0, 20)
    const byUni = [...arr].sort((a, b) => b.unidades - a.unidades).slice(0, 20)
    const top5  = [...arr].sort((a, b) => b.ingresos - a.ingresos).slice(0, 5)

    return { byIng, byUni, top5 }
  }, [allItems, periodo])

  // ── Tooltip custom ──
  const MoneyTooltip = ({ active, payload, label }: Record<string, unknown>) => {
    if (!active || !(payload as unknown[])?.length) return null
    return (
      <div style={{ background: '#111', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
        <div style={{ color: '#aaa', marginBottom: 4 }}>{String(label)}</div>
        {(payload as { name: string; value: number }[]).map((p, i) => (
          <div key={i}>{p.name}: <strong>{fmtMoney(p.value)}</strong></div>
        ))}
      </div>
    )
  }

  const UnitTooltip = ({ active, payload, label }: Record<string, unknown>) => {
    if (!active || !(payload as unknown[])?.length) return null
    return (
      <div style={{ background: '#111', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
        <div style={{ color: '#aaa', marginBottom: 4 }}>{String(label)}</div>
        {(payload as { name: string; value: number }[]).map((p, i) => (
          <div key={i}>{p.name}: <strong>{p.value}</strong></div>
        ))}
      </div>
    )
  }

  const AMBER  = '#f59e0b'
  const BLUE   = '#3b82f6'
  const GREEN  = '#10b981'
  const PURPLE = '#8b5cf6'

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Ingresos este mes',  value: fmtMoney(kpis.total_mes),  color: AMBER  },
          { label: 'Ventas este mes',    value: String(kpis.ventas_mes),    color: BLUE   },
          { label: 'Unidades vendidas',  value: String(kpis.uds_mes),       color: GREEN  },
          { label: 'Ingresos históricos',value: fmtMoney(kpis.total_hist), color: PURPLE },
        ].map((k, i) => (
          <div key={i} style={{ ...card, marginBottom: 0, borderTop: `3px solid ${k.color}`, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase' }}>{k.label}</p>
            <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 800, color: '#111' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tab: Gráficos */}
      <div style={{ ...card, marginBottom: 20 }}>
        <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 16 }}>Gráficos de tiempo</p>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1 }}>PRODUCTO</span>
            <select
              value={producto}
              onChange={e => setProducto(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, cursor: 'pointer', background: '#fafafa' }}
            >
              {productosConVentas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ width: 1, height: 24, background: '#e0e0e0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1 }}>AGRUPACIÓN</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['dia', 'semana', 'mes'] as const).map(a => (
                <button key={a} onClick={() => setAgrupacion(a)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: agrupacion === a ? '#111' : '#ebebeb', color: agrupacion === a ? '#fff' : '#555', transition: 'all .15s' }}>
                  {a === 'dia' ? 'DÍA' : a === 'semana' ? 'SEMANA' : 'MES'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Chart 1: Ingresos por producto línea+área */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 10px 10px' }}>
            <p style={{ margin: '0 0 10px 10px', fontSize: 12, fontWeight: 700, color: '#555' }}>
              Ingresos · {(producto || '').slice(0, 26)}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={serieProducto} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={AMBER} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#aaa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={AMBER} fill="url(#gradIng)" strokeWidth={2} dot={{ r: 3, fill: AMBER }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Unidades por producto barras */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 10px 10px' }}>
            <p style={{ margin: '0 0 10px 10px', fontSize: 12, fontWeight: 700, color: '#555' }}>
              Unidades · {(producto || '').slice(0, 26)}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serieProducto} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#aaa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} allowDecimals={false} />
                <Tooltip content={<UnitTooltip />} />
                <Bar dataKey="unidades" name="Unidades" fill={BLUE} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Ingresos totales 30d */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 10px 10px' }}>
            <p style={{ margin: '0 0 10px 10px', fontSize: 12, fontWeight: 700, color: '#555' }}>
              Ingresos totales · 30 días
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={serie30d} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad30d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GREEN} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                <XAxis dataKey="dia" tick={{ fontSize: 9, fill: '#aaa' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={GREEN} fill="url(#grad30d)" strokeWidth={2} dot={{ r: 2.5, fill: GREEN }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Top 5 barras horizontales */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 10px 10px' }}>
            <p style={{ margin: '0 0 10px 10px', fontSize: 12, fontWeight: 700, color: '#555' }}>
              Top 5 por ingresos (histórico)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={[...topProductos.top5].reverse().map((p, i, arr) => ({
                  nombre: p.nombre.slice(0, 22),
                  ingresos: p.ingresos,
                  fill: i === arr.length - 1 ? AMBER : PURPLE,
                }))}
                margin={{ top: 4, right: 60, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#aaa' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#555' }} width={90} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="ingresos" name="Ingresos" radius={[0, 3, 3, 0]}>
                  {topProductos.top5.map((_, i, arr) => (
                    <rect key={i} fill={i === arr.length - 1 ? AMBER : PURPLE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tab: Top Productos */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Top Productos</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['semana', 'mes', 'año', 'siempre'] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: periodo === p ? '#111' : '#ebebeb', color: periodo === p ? '#fff' : '#555', transition: 'all .15s' }}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Tabla por ingresos */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: AMBER }}>💰 MÁS INGRESOS</p>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>Producto</th>
                  <th style={{ ...th, textAlign: 'right' }}>Ingresos</th>
                  <th style={{ ...th, textAlign: 'right' }}>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.byIng.map((r, i) => (
                  <tr key={i} style={{ background: i === 0 ? '#fffbeb' : undefined }}>
                    <td style={{ ...td, color: '#aaa', fontSize: 11, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? AMBER : '#111' }}>{r.nombre}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmtMoney(r.ingresos)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#888' }}>{r.unidades}</td>
                  </tr>
                ))}
                {topProductos.byIng.length === 0 && (
                  <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#ccc' }}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tabla por unidades */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: BLUE }}>📦 MÁS UNIDADES</p>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 30 }}>#</th>
                  <th style={th}>Producto</th>
                  <th style={{ ...th, textAlign: 'right' }}>Unidades</th>
                  <th style={{ ...th, textAlign: 'right' }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.byUni.map((r, i) => (
                  <tr key={i} style={{ background: i === 0 ? '#eff6ff' : undefined }}>
                    <td style={{ ...td, color: '#aaa', fontSize: 11, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? BLUE : '#111' }}>{r.nombre}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{r.unidades}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#888' }}>{fmtMoney(r.ingresos)}</td>
                  </tr>
                ))}
                {topProductos.byUni.length === 0 && (
                  <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#ccc' }}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function Dashboard({ params }: { params: { entidadId: string } }) {
  const { entidadId } = params
  const { addNotification } = useNotifications()

  const [sucursales, setSucursales] = useState<Row[]>([])
  const [selSuc, setSelSuc]         = useState<string | null>(null)
  const [tab, setTab]               = useState('productos')
  const [productos, setProductos]   = useState<Row[]>([])
  const [ofertas, setOfertas]       = useState<Row[]>([])
  const [ventas, setVentas]         = useState<Row[]>([])
  const [cierres, setCierres]       = useState<Row[]>([])
  const [loading, setLoading]       = useState(false)
  const [lastSync, setLastSync]     = useState<Date | null>(null)

  const prevProductos  = useRef<Row[] | null>(null)
  const prevOfertas    = useRef<Row[] | null>(null)
  const prevVentas     = useRef<Row[] | null>(null)
  const prevCierres    = useRef<Row[] | null>(null)
  const isFirstFetch   = useRef(true)

  useEffect(() => {
    supabase.from('sucursales').select('*').eq('entidad_id', entidadId).then(({ data }) => {
      if (data?.length) { setSucursales(data); setSelSuc(data[0].id as string) }
    })
  }, [entidadId])

  // Función para refetch datos - memoizada con useCallback
  const fetchData = useCallback(async (currentSelSuc: string) => {
    console.log(`[fetch] Sincronizando datos de ${currentSelSuc} a las ${new Date().toLocaleTimeString()}`)
    const [p, o, v, c] = await Promise.all([
      supabase.from('productos').select('*').eq('sucursal_id', currentSelSuc).order('nombre'),
      supabase.from('ofertas').select('*').eq('sucursal_id', currentSelSuc).order('activa', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*)').eq('sucursal_id', currentSelSuc).order('fecha', { ascending: false }),
      supabase.from('cierres_caja').select('*').eq('sucursal_id', currentSelSuc).order('fecha_cierre', { ascending: false }),
    ])

    const newProductos = p.data as Row[] || []
    const newOfertas   = o.data as Row[] || []
    const newVentas    = v.data as Row[] || []
    const newCierres   = c.data as Row[] || []

    // Detectar cambios solo en polls (no en la carga inicial)
    if (!isFirstFetch.current) {
      const prevP = prevProductos.current ?? []
      const prevO = prevOfertas.current   ?? []
      const prevV = prevVentas.current    ?? []
      const prevC = prevCierres.current   ?? []

      // Productos nuevos
      newProductos
        .filter(r => !prevP.find(pr => pr.id === r.id))
        .forEach(r => addNotification('product_added', { productName: String(r.nombre) }))

      // Productos eliminados
      prevP
        .filter(r => !newProductos.find(nr => nr.id === r.id))
        .forEach(r => addNotification('product_removed', { productName: String(r.nombre) }))

      // Productos editados (nombre, stock o precio cambiaron)
      newProductos.forEach(np => {
        const op = prevP.find(r => r.id === np.id)
        if (!op) return
        const changes: { field: string; before: string; after: string }[] = []
        if (op.nombre !== np.nombre)
          changes.push({ field: 'Nombre', before: String(op.nombre), after: String(np.nombre) })
        if (op.stock !== np.stock)
          changes.push({ field: 'Stock', before: String(op.stock), after: String(np.stock) })
        if (op.precio !== np.precio)
          changes.push({ field: 'Precio', before: String(op.precio), after: String(np.precio) })
        if (changes.length)
          addNotification('product_edited', { productName: String(np.nombre), changes })
      })

      // Ofertas nuevas
      newOfertas
        .filter(r => !prevO.find(pr => pr.id === r.id))
        .forEach(r => addNotification('offer_created', {
          name: String(r.nombre),
          products: [],
          expiryDate: r.expira_at
            ? new Date(String(r.expira_at)).toLocaleDateString('es-AR')
            : 'Sin vencimiento',
        }))

      // Ofertas expiradas (estaban y ya no están)
      prevO
        .filter(r => !newOfertas.find(nr => nr.id === r.id))
        .forEach(r => addNotification('offer_expired', { name: String(r.nombre), salesCount: 0 }))

      // Ventas nuevas
      newVentas
        .filter(r => !prevV.find(pr => pr.id === r.id))
        .forEach(r => {
          const items = (r.venta_items as Row[]) || []
          addNotification('sale', {
            total: Number(r.total),
            products: items.map(it => ({ name: String(it.producto), quantity: Number(it.cantidad) })),
          })
        })

      // Cierre nuevo
      newCierres
        .filter(r => !prevC.find(pr => pr.id === r.id))
        .forEach(() => addNotification('cash_closed', {}))
    }

    prevProductos.current = newProductos
    prevOfertas.current   = newOfertas
    prevVentas.current    = newVentas
    prevCierres.current   = newCierres
    isFirstFetch.current  = false

    setProductos(newProductos)
    setOfertas(newOfertas)
    setVentas(newVentas)
    setCierres(newCierres)
    setLastSync(new Date())
  }, [addNotification])

  // Carga inicial
  useEffect(() => {
    if (!selSuc) return
    isFirstFetch.current = true
    setLoading(true)
    fetchData(selSuc).then(() => setLoading(false))
  }, [selSuc, fetchData])

  // Polling cada 15 segundos
  useEffect(() => {
    if (!selSuc) return
    
    const interval = setInterval(() => {
      console.log('[polling] Sincronizando...', new Date().toLocaleTimeString())
      fetchData(selSuc)
    }, 15000)
    
    return () => {
      clearInterval(interval)
    }
  }, [selSuc, fetchData])

  const suc = sucursales.find(s => s.id === selSuc)
  const fmt = (n: unknown) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 35, fontWeight: 800, letterSpacing: -1 }}>EasyStock</h1>
          <p style={{ margin: '2px 0 0', color: '#aaa', fontSize: 12 }}>ID: {entidadId}</p>
        </div>
        {suc && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{String(suc.nombre)}</p>
            <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>
              Última actualización: {lastSync ? lastSync.toLocaleTimeString('es-AR') : 'Cargando...'}
            </p>
          </div>
        )}
      </div>

      {/* Selector de sucursales */}
      {sucursales.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {sucursales.map(s => (
            <TabBtn key={String(s.id)} label={String(s.nombre)} active={s.id === selSuc} onClick={() => setSelSuc(String(s.id))} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['productos', 'ofertas', 'ventas', 'cierres', 'estadisticas'].map(t => (
          <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {loading && <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Cargando...</p>}

      {/* Estadísticas */}
      {!loading && tab === 'estadisticas' && <StatsPanel ventas={ventas} />}

      {/* Productos */}
      {!loading && tab === 'productos' && (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Productos <span style={{ fontWeight: 400, color: '#aaa', fontSize: 13 }}>({productos.length})</span></p>
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
                  <td style={{ ...td, color: '#aaa' }}>{String(p.codigo_barras || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ofertas */}
      {!loading && tab === 'ofertas' && (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Ofertas <span style={{ fontWeight: 400, color: '#aaa', fontSize: 13 }}>({ofertas.length})</span></p>
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

      {/* Ventas */}
      {!loading && tab === 'ventas' && (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Historial de ventas <span style={{ fontWeight: 400, color: '#aaa', fontSize: 13 }}>({ventas.length})</span></p>
          <table style={tbl}>
            <thead>
              <tr><th style={th}>#</th><th style={th}>Fecha</th><th style={th}>Método</th><th style={th}>Desc.</th><th style={th}>Total</th><th style={th}>Items</th></tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => {
                const items = (v.venta_items as Row[]) || []
                return (
                  <tr key={i}>
                    <td style={{ ...td, color: '#aaa', fontSize: 11 }}>{String(v.id)}</td>
                    <td style={td}>{fdate(v.fecha)}</td>
                    <td style={td}><Badge label={String(v.metodo_pago).toUpperCase()} color='#3498db' /></td>
                    <td style={td}>{Number(v.descuento_total) > 0 ? <Badge label={`-${v.descuento_total}%`} color='#e67e22' /> : '—'}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{fmt(v.total)}</td>
                    <td style={td}>
                      {items.map((it, j) => (
                        <div key={j} style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                          {String(it.producto)} ×{String(it.cantidad)} — {fmt(it.subtotal)}
                          {Number(it.descuento_item) > 0 && <span style={{ color: '#e67e22' }}> (-{String(it.descuento_item)}%)</span>}
                          {Boolean(it.es_oferta) && <span style={{ color: '#9b59b6', marginLeft: 4 }}>[oferta]</span>}
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

      {/* Cierres */}
      {!loading && tab === 'cierres' && (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Cierres de caja <span style={{ fontWeight: 400, color: '#aaa', fontSize: 13 }}>({cierres.length})</span></p>
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
                  <td style={{ ...td, fontWeight: 700 }}>{fmt(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}