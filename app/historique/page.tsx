'use client'

import { useState, useEffect } from 'react'
import { Order, OrderStatus } from '../../data/types'
import ReceiptModal from '../../components/ReceiptModal'
import { dbGetAllOrders, dbGetOrdersSince } from '../../lib/db'

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: '#f59e0b' },
  en_preparation: { label: 'En préparation', color: '#3b82f6' },
  pret: { label: 'Prêt', color: '#22c55e' },
  livre: { label: 'Livré', color: '#6b7280' },
}
const typeLabel: Record<string, string> = { sur_place: '🍽️ Sur place', a_emporter: '📦 À emporter', livraison: '🛵 Livraison' }
const payLabel: Record<string, string> = { especes: '💵 Espèces', carte: '💳 Carte', cheque: '📝 Chèque' }

export default function HistoriquePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let data: Order[]
        if (dateFilter === 'all') {
          data = await dbGetAllOrders()
        } else if (dateFilter === 'week') {
          const week = new Date()
          week.setDate(week.getDate() - 7)
          data = await dbGetOrdersSince(week)
        } else {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          data = await dbGetOrdersSince(today)
        }
        setOrders(data)
      } catch (err) {
        console.error('Erreur chargement historique:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateFilter])

  const filtered = orders

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)
  const avgTicket = filtered.length ? totalRevenue / filtered.length : 0

  // Top articles
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {}
  filtered.forEach(order => {
    order.items.forEach(item => {
      if (!itemCounts[item.menuItem.id]) itemCounts[item.menuItem.id] = { name: item.menuItem.name, qty: 0, revenue: 0 }
      itemCounts[item.menuItem.id].qty += item.quantity
      itemCounts[item.menuItem.id].revenue += item.menuItem.price * item.quantity
    })
  })
  const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5)

  // Par mode de paiement
  const byPayment = { especes: 0, carte: 0, cheque: 0 }
  filtered.forEach(o => { byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] || 0) + o.total })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px', alignItems: 'center',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, marginRight: 8 }}>📊 Historique</span>
        {(['today', 'week', 'all'] as const).map(f => (
          <button key={f} onClick={() => setDateFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: dateFilter === f ? 'var(--accent)' : 'var(--surface2)',
            color: dateFilter === f ? '#fff' : 'var(--muted)', fontSize: 13,
          }}>{f === 'today' ? "Aujourd'hui" : f === 'week' ? '7 derniers jours' : 'Tout'}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignContent: 'flex-start' }}>
        {/* Stats cards */}
        <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap' }}>
          {[
            { label: 'Chiffre d\'affaires', value: `${totalRevenue.toFixed(2)} €`, color: 'var(--success)', emoji: '💶' },
            { label: 'Commandes', value: String(filtered.length), color: 'var(--accent)', emoji: '🧾' },
            { label: 'Ticket moyen', value: `${avgTicket.toFixed(2)} €`, color: '#3b82f6', emoji: '📈' },
            { label: 'Articles vendus', value: String(filtered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0)), color: '#a855f7', emoji: '🍕' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: '1 1 140px', background: 'var(--surface)', borderRadius: 12, padding: '14px 16px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 22 }}>{stat.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Top articles */}
          <div style={{ flex: '1 1 220px', background: 'var(--surface)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>🏆 Top articles</div>
            {topItems.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Aucune donnée</div>
            ) : topItems.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span><span style={{ color: 'var(--muted)' }}>{i + 1}.</span> {item.name}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.qty}×</span>
              </div>
            ))}
          </div>

          {/* Par paiement */}
          <div style={{ flex: '1 1 200px', background: 'var(--surface)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>💳 Par mode de paiement</div>
            {(['especes', 'carte', 'cheque'] as const).map(method => (
              <div key={method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span>{payLabel[method]}</span>
                <span style={{ fontWeight: 600 }}>{byPayment[method].toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commandes list */}
        <div style={{ width: '100%', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
            📋 Détail des commandes ({filtered.length})
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Aucune commande pour cette période</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['N°', 'Heure', 'Type', 'Articles', 'Paiement', 'Statut', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const cfg = statusConfig[order.status]
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{String(order.number).padStart(4, '0')}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                          {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{typeLabel[order.type]}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                          {order.items.map(i => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{payLabel[order.paymentMethod]}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent)' }}>
                          {order.total.toFixed(2)} €
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => setSelectedOrder(order)} style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                            background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 12,
                          }}>🧾 Ticket</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && <ReceiptModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
