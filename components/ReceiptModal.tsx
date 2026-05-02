'use client'

import { Order } from '../data/types'
import { getEffectivePrice } from '../data/utils'

interface Props {
  order: Order
  onClose: () => void
}

const typeLabels = { sur_place: 'Sur place', a_emporter: 'À emporter', livraison: 'Livraison' }
const paymentLabels = { especes: 'Espèces', carte: 'Carte bancaire', cheque: 'Chèque' }

export default function ReceiptModal({ order, onClose }: Props) {
  const handlePrint = () => window.print()

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', color: '#111', borderRadius: 12, padding: 28,
        width: 360, maxHeight: '90vh', overflow: 'auto',
        fontFamily: 'monospace',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🍕</div>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>FRENCHY PIZZA</div>
          <div style={{ fontSize: 12, color: '#666' }}>10 Rue de Breteuil, 60360 Crèvecœur-le-Grand</div>
          <div style={{ fontSize: 12, color: '#666' }}>Tél: 09 81 39 87 71</div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Commande #{String(order.number).padStart(4, '0')}</span>
            <span>{typeLabels[order.type]}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}>
            <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
            {order.tableNumber && <span>Table {order.tableNumber}</span>}
            {order.customerName && <span>{order.customerName}</span>}
          </div>
          {order.deliveryAddress && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: '#f5f5f5', borderRadius: 6, fontSize: 12, color: '#333' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🛵 Livraison</div>
              <div>{order.deliveryAddress.adresse}</div>
              <div>{order.deliveryAddress.codePostal} {order.deliveryAddress.ville}</div>
              {order.deliveryAddress.interphone && <div>Interphone : {order.deliveryAddress.interphone}</div>}
              {order.deliveryAddress.telephone && <div>Tél : {order.deliveryAddress.telephone}</div>}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', paddingBlock: 10, marginBottom: 12 }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
              <span>{item.quantity}× {item.menuItem.name}{item.size ? ` (${item.size})` : ''}</span>
              <span>{(getEffectivePrice(item) * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
            <span>Sous-total HT</span>
            <span>{(order.total / 1.1).toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 8 }}>
            <span>TVA (10%)</span>
            <span>{(order.total - order.total / 1.1).toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18 }}>
            <span>TOTAL TTC</span>
            <span>{order.total.toFixed(2)} €</span>
          </div>
          <div style={{ fontSize: 13, color: '#444', marginTop: 6 }}>
            {paymentLabels[order.paymentMethod]}
            {order.cashGiven && order.cashGiven > 0 && (
              <span> — Rendu: {order.change?.toFixed(2)} €</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', borderTop: '2px dashed #ccc', paddingTop: 14, fontSize: 13, color: '#666' }}>
          Merci de votre visite ! 🍕
          <br />Bonne dégustation
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={handlePrint} style={{
            flex: 1, padding: '10px', borderRadius: 8,
            background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
          }}>🖨️ Imprimer</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 8,
            background: '#eee', color: '#111', border: 'none', cursor: 'pointer', fontSize: 14,
          }}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
