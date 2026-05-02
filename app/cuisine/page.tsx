'use client'

import { useState, useEffect, useCallback } from 'react'
import { Order, OrderStatus } from '../../data/types'

function getOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('pizzeria_orders') || '[]') } catch { return [] }
}
function saveOrders(orders: Order[]) {
  localStorage.setItem('pizzeria_orders', JSON.stringify(orders))
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; next: OrderStatus | null; nextLabel: string }> = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', next: 'en_preparation', nextLabel: '→ Démarrer' },
  en_preparation: { label: 'En préparation', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', next: 'pret', nextLabel: '→ Prêt' },
  pret: { label: 'Prêt', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', next: 'livre', nextLabel: '→ Livré' },
  livre: { label: 'Livré', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', next: null, nextLabel: '' },
}

const typeEmoji: Record<string, string> = { sur_place: '🍽️', a_emporter: '📦', livraison: '🛵' }

export default function CuisinePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | 'all'>('en_attente')

  const loadOrders = useCallback(() => {
    const all = getOrders()
    const today = new Date().toDateString()
    setOrders(all.filter(o => new Date(o.createdAt).toDateString() === today).reverse())
  }, [])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 3000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const updateStatus = (orderId: string, newStatus: OrderStatus) => {
    const all = getOrders()
    const updated = all.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o)
    saveOrders(updated)
    loadOrders()
  }

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = {
    en_attente: orders.filter(o => o.status === 'en_attente').length,
    en_preparation: orders.filter(o => o.status === 'en_preparation').length,
    pret: orders.filter(o => o.status === 'pret').length,
    livre: orders.filter(o => o.status === 'livre').length,
  }

  const elapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    return `${Math.floor(diff / 60)}min${diff % 60 > 0 ? ` ${diff % 60}s` : ''}`
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header filters */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, marginRight: 8 }}>👨‍🍳 Cuisine</span>

        <button onClick={() => setFilter('all')} style={{
          padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
          background: filter === 'all' ? 'var(--accent)' : 'var(--surface2)', color: filter === 'all' ? '#fff' : 'var(--muted)', fontSize: 13,
        }}>Toutes ({orders.length})</button>

        {(Object.entries(counts) as [OrderStatus, number][]).map(([status, count]) => {
          const cfg = statusConfig[status]
          return (
            <button key={status} onClick={() => setFilter(status)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${filter === status ? cfg.color : 'transparent'}`,
              background: filter === status ? cfg.bg : 'var(--surface2)',
              color: filter === status ? cfg.color : 'var(--muted)', cursor: 'pointer', fontSize: 13,
            }}>{cfg.label} ({count})</button>
          )
        })}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          Actualisation auto toutes les 3s
        </div>
      </div>

      {/* Orders grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {visible.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--muted)', gap: 12 }}>
            <span style={{ fontSize: 56 }}>🍕</span>
            <span style={{ fontSize: 16 }}>Aucune commande</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {visible.map(order => {
              const cfg = statusConfig[order.status]
              const isUrgent = order.status === 'en_attente' && (Date.now() - new Date(order.createdAt).getTime()) > 10 * 60 * 1000
              return (
                <div key={order.id} style={{
                  background: 'var(--surface)', borderRadius: 12,
                  border: `2px solid ${isUrgent ? 'var(--danger)' : cfg.color}`,
                  overflow: 'hidden',
                }}>
                  {/* Card header */}
                  <div style={{ padding: '10px 14px', background: cfg.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>#{String(order.number).padStart(4, '0')}</span>
                      <span style={{ fontSize: 16 }}>{typeEmoji[order.type]}</span>
                      {order.tableNumber && <span style={{ fontSize: 13, color: cfg.color }}>Table {order.tableNumber}</span>}
                      {order.customerName && <span style={{ fontSize: 13, color: cfg.color }}>{order.customerName}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, color: isUrgent ? 'var(--danger)' : 'var(--muted)' }}>
                        {isUrgent ? '⚠️ ' : '⏱️ '}{elapsed(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '10px 14px' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{item.menuItem.emoji}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.quantity}×</span>
                        <span style={{ fontSize: 14 }}>{item.menuItem.name}</span>
                        {item.size && <span style={{ fontSize: 12, color: 'var(--muted)' }}>({item.size})</span>}
                        {item.notes && <span style={{ fontSize: 11, color: 'var(--warning)', marginLeft: 'auto' }}>📝 {item.notes}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {cfg.next && (
                    <div style={{ padding: '0 14px 12px' }}>
                      <button onClick={() => updateStatus(order.id, cfg.next!)} style={{
                        width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                        background: cfg.color, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                      }}>{cfg.nextLabel}</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
