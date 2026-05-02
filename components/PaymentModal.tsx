'use client'

import { useState } from 'react'
import { CartItem, PaymentMethod, OrderType } from '../data/types'
import { getEffectivePrice } from '../data/utils'

interface Props {
  items: CartItem[]
  total: number
  onConfirm: (method: PaymentMethod, type: OrderType, tableNumber: number | undefined, customerName: string, cashGiven: number) => void
  onClose: () => void
}

export default function PaymentModal({ items, total, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('especes')
  const [type, setType] = useState<OrderType>('sur_place')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [cashGiven, setCashGiven] = useState('')

  const cashAmount = parseFloat(cashGiven) || 0
  const change = method === 'especes' ? cashAmount - total : 0
  const canConfirm = method !== 'especes' || cashAmount >= total

  const quickCash = [
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 28,
        width: 480, maxHeight: '90vh', overflow: 'auto',
        border: '1px solid var(--border)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>💳 Encaissement</h2>

        {/* Récapitulatif */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 10, padding: 14,
          marginBottom: 20, border: '1px solid var(--border)',
        }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4, color: 'var(--muted)' }}>
              <span>{item.quantity}× {item.menuItem.name}{item.size ? ` (${item.size})` : ''}</span>
              <span>{(getEffectivePrice(item) * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>{total.toFixed(2)} €</span>
          </div>
        </div>

        {/* Type de commande */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Type de commande</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['sur_place', '🍽️ Sur place'], ['a_emporter', '📦 À emporter'], ['livraison', '🛵 Livraison']] as [OrderType, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setType(val)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${type === val ? 'var(--accent)' : 'var(--border)'}`,
                background: type === val ? 'rgba(249,115,22,0.15)' : 'var(--surface2)',
                color: type === val ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', fontSize: 13,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Table / Nom */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {type === 'sur_place' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>N° de table</label>
              <input
                type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)}
                placeholder="Ex: 5"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14,
                }}
              />
            </div>
          )}
          {type !== 'sur_place' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Nom client</label>
              <input
                type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: Dupont"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14,
                }}
              />
            </div>
          )}
        </div>

        {/* Mode de paiement */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Mode de paiement</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['especes', '💵 Espèces'], ['carte', '💳 Carte'], ['cheque', '📝 Chèque']] as [PaymentMethod, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setMethod(val)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${method === val ? 'var(--accent)' : 'var(--border)'}`,
                background: method === val ? 'rgba(249,115,22,0.15)' : 'var(--surface2)',
                color: method === val ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', fontSize: 13,
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Rendu monnaie */}
        {method === 'especes' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Somme remise</label>
            <input
              type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)}
              placeholder={`Min. ${total.toFixed(2)} €`}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${cashAmount > 0 && cashAmount < total ? 'var(--danger)' : 'var(--border)'}`,
                background: 'var(--surface2)', color: 'var(--text)', fontSize: 16,
              }}
            />
            {/* Raccourcis */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {quickCash.map(v => (
                <button key={v} onClick={() => setCashGiven(String(v))} style={{
                  flex: 1, padding: '6px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
                }}>{v} €</button>
              ))}
            </div>
            {cashAmount >= total && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(34,197,94,0.15)', border: '1px solid var(--success)',
                display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16,
              }}>
                <span>Monnaie à rendre</span>
                <span style={{ color: 'var(--success)' }}>{change.toFixed(2)} €</span>
              </div>
            )}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--muted)', cursor: 'pointer', fontSize: 15,
          }}>Annuler</button>
          <button
            onClick={() => canConfirm && onConfirm(method, type, tableNumber ? parseInt(tableNumber) : undefined, customerName, cashAmount)}
            disabled={!canConfirm}
            style={{
              flex: 2, padding: '12px', borderRadius: 10, border: 'none',
              background: canConfirm ? 'var(--accent)' : 'var(--border)',
              color: canConfirm ? '#fff' : 'var(--muted)', cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontSize: 15, fontWeight: 700,
            }}
          >✓ Valider la commande</button>
        </div>
      </div>
    </div>
  )
}
