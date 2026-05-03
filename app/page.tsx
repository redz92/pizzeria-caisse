'use client'

import { useState, useEffect } from 'react'
import { menuItems, categories } from '../data/menu'
import { CartItem, Order, OrderStatus, PaymentMethod, OrderType, Category, MenuItem, DeliveryAddress } from '../data/types'
import { getEffectivePrice } from '../data/utils'
import PaymentModal from '../components/PaymentModal'
import ReceiptModal from '../components/ReceiptModal'

function getOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('pizzeria_orders') || '[]') } catch { return [] }
}
function saveOrders(orders: Order[]) {
  localStorage.setItem('pizzeria_orders', JSON.stringify(orders))
}
function getNextNumber(): number {
  const orders = getOrders()
  if (!orders.length) return 1
  return Math.max(...orders.map(o => o.number)) + 1
}

export default function CaissePage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<Category>('pizza')
  const [search, setSearch] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [todayCount, setTodayCount] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [sizeItem, setSizeItem] = useState<MenuItem | null>(null)
  const [tacoSelector, setTacoSelector] = useState<{ menuItem: MenuItem; max: number } | null>(null)
  const [tacoMeatCounts, setTacoMeatCounts] = useState<Record<string, number>>({})
  const [formulePicker, setFormulePicker] = useState<{ menuItem: MenuItem; size: string | undefined; count: number } | null>(null)
  const [formulePizzas, setFormulePizzas] = useState<string[]>([])

  const TACO_MEATS = ['Viande hachée', 'Merguez', 'Tenders', 'Émincé de poulet']
  const FORMULE_PIZZA_COUNT: Record<string, number> = { 'f-duo': 2, 'f-family': 4, 'f-gourmande': 1, 'f-1plus1': 2 }
  const pizzaList = menuItems.filter(m => m.category === 'pizza')

  useEffect(() => {
    const today = new Date().toDateString()
    const orders = getOrders().filter(o => new Date(o.createdAt).toDateString() === today)
    setTodayCount(orders.length)
    setTodayRevenue(orders.reduce((s, o) => s + o.total, 0))
  }, [lastOrder])

  const openFormulePicker = (menuItem: MenuItem, size: string | undefined) => {
    const count = FORMULE_PIZZA_COUNT[menuItem.id] || 1
    setFormulePizzas(Array(count).fill(''))
    setFormulePicker({ menuItem, size, count })
  }

  const handleMenuClick = (itemId: string) => {
    const menuItem = menuItems.find(m => m.id === itemId)!
    if (menuItem.category === 'formule') {
      if (menuItem.sizes && menuItem.sizes.length > 0) {
        setSizeItem(menuItem) // taille d'abord, puis pizza picker
      } else {
        openFormulePicker(menuItem, undefined) // Gourmande : direct pizza picker
      }
    } else if (menuItem.sizes && menuItem.sizes.length > 0) {
      setSizeItem(menuItem)
    } else if (menuItem.category === 'tacos') {
      const max = itemId === 't-1' ? 1 : itemId === 't-2' ? 2 : 3
      setTacoMeatCounts({})
      setTacoSelector({ menuItem, max })
    } else {
      addToCart(itemId, undefined)
    }
  }

  const addToCart = (itemId: string, size: string | undefined, notes?: string) => {
    setFlashId(itemId)
    setTimeout(() => setFlashId(null), 300)
    const menuItem = menuItems.find(m => m.id === itemId)!
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId && c.size === size && c.notes === notes)
      if (existing) return prev.map(c =>
        c.menuItem.id === itemId && c.size === size && c.notes === notes ? { ...c, quantity: c.quantity + 1 } : c
      )
      return [...prev, { menuItem, quantity: 1, size, notes }]
    })
  }

  const updateQty = (itemId: string, size: string | undefined, delta: number, notes?: string) => {
    setCart(prev => {
      const updated = prev.map(c =>
        c.menuItem.id === itemId && c.size === size && c.notes === notes ? { ...c, quantity: c.quantity + delta } : c
      )
      return updated.filter(c => c.quantity > 0)
    })
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((s, c) => s + getEffectivePrice(c) * c.quantity, 0)
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0)

  const visibleItems = search
    ? menuItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : menuItems.filter(i => i.category === activeCategory)

  const handleConfirmPayment = (method: PaymentMethod, type: OrderType, tableNumber: number | undefined, customerName: string, cashGiven: number, deliveryAddress?: DeliveryAddress) => {
    const now = new Date().toISOString()
    const order: Order = {
      id: `${Date.now()}`,
      number: getNextNumber(),
      items: cart,
      total,
      status: 'en_preparation' as OrderStatus,
      type,
      paymentMethod: method,
      createdAt: now,
      updatedAt: now,
      tableNumber,
      customerName: customerName || undefined,
      deliveryAddress,
      cashGiven,
      change: method === 'especes' ? cashGiven - total : 0,
    }
    const orders = getOrders()
    orders.push(order)
    saveOrders(orders)
    setLastOrder(order)
    setCart([])
    setShowPayment(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* LEFT — Menu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 16, padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>Commandes aujourd'hui : </span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{todayCount}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>CA du jour : </span>
            <span style={{ fontWeight: 700, color: 'var(--success)' }}>{todayRevenue.toFixed(2)} €</span>
          </div>
        </div>

        {/* Search + categories */}
        <div style={{ padding: '12px 16px 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un article..."
            style={{
              width: '100%', padding: '8px 14px', borderRadius: 8, marginBottom: 10,
              border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id as Category); setSearch('') }} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: activeCategory === cat.id && !search ? 'var(--accent)' : 'var(--surface2)',
                color: activeCategory === cat.id && !search ? '#fff' : 'var(--muted)',
                fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
              }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {search && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              {visibleItems.length} résultat{visibleItems.length !== 1 ? 's' : ''} pour « {search} »
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
            {visibleItems.map(item => (
              <button key={item.id} onClick={() => handleMenuClick(item.id)} style={{
                padding: '12px 10px', borderRadius: 10,
                border: `2px solid ${flashId === item.id ? 'var(--accent)' : 'var(--border)'}`,
                background: flashId === item.id ? 'rgba(249,115,22,0.1)' : 'var(--surface)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontSize: 26 }}>{item.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>{item.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3, flexGrow: 1 }}>{item.description}</span>
                {item.sizes ? (
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', marginTop: 4 }}>
                    {item.price.toFixed(0)} → {(item.price + item.sizes[item.sizes.length - 1].extra).toFixed(0)} €
                  </span>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', marginTop: 4 }}>
                    {item.price.toFixed(2)} €
                  </span>
                )}
                {item.sizes && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {item.sizes.map(s => s.label).join(' · ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Panier */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            🛒 Panier
            {itemCount > 0 && (
              <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', padding: '1px 7px', fontSize: 12, marginLeft: 6 }}>
                {itemCount}
              </span>
            )}
          </span>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Vider
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', gap: 8 }}>
              <span style={{ fontSize: 48 }}>🛒</span>
              <span style={{ fontSize: 14 }}>Panier vide</span>
              <span style={{ fontSize: 12 }}>Cliquez sur un article pour l'ajouter</span>
            </div>
          ) : (
            cart.map(item => {
              const price = getEffectivePrice(item)
              return (
                <div key={`${item.menuItem.id}-${item.size}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 18 }}>{item.menuItem.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.menuItem.name}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 1 }}>
                        🥩 {item.notes}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {item.size && <span style={{ color: 'var(--accent)' }}>{item.size} · </span>}
                      {(price * item.quantity).toFixed(2)} €
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => updateQty(item.menuItem.id, item.size, -1, item.notes)} style={{
                      width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                    }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItem.id, item.size, 1, item.notes)} style={{
                      width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                    }}>+</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Total + paiement */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          {cart.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--muted)' }}>
                <span>{itemCount} article{itemCount !== 1 ? 's' : ''}</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>{total.toFixed(2)} €</span>
              </div>
            </>
          )}
          <button
            onClick={() => cart.length > 0 && setShowPayment(true)}
            disabled={cart.length === 0}
            style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: cart.length > 0 ? 'var(--accent)' : 'var(--border)',
              color: cart.length > 0 ? '#fff' : 'var(--muted)',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 700,
            }}
          >💳 Encaisser</button>
        </div>
      </div>

      {/* Modal sélecteur de taille */}
      {sizeItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }} onClick={() => setSizeItem(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 24, width: 360,
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{sizeItem.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{sizeItem.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Choisissez une taille</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sizeItem.sizes!.map(size => {
                const price = sizeItem.price + size.extra
                return (
                  <button key={size.label} onClick={() => {
                    if (sizeItem.category === 'formule') {
                      setSizeItem(null)
                      openFormulePicker(sizeItem, size.label)
                    } else {
                      addToCart(sizeItem.id, size.label)
                      setSizeItem(null)
                    }
                  }} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--surface2)',
                    cursor: 'pointer', color: 'var(--text)',
                  }}>
                    <span style={{ fontWeight: 600 }}>{size.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{price.toFixed(2)} €</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setSizeItem(null)} style={{
              width: '100%', marginTop: 12, padding: '10px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', cursor: 'pointer', fontSize: 14,
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal sélecteur de viandes tacos */}
      {tacoSelector && (() => {
        const totalSelected = Object.values(tacoMeatCounts).reduce((s, n) => s + n, 0)
        const canAdd = totalSelected === tacoSelector.max
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          }} onClick={() => setTacoSelector(null)}>
            <div style={{
              background: 'var(--surface)', borderRadius: 16, padding: 24, width: 380,
              border: '1px solid var(--border)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 32 }}>{tacoSelector.menuItem.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{tacoSelector.menuItem.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Choisissez {tacoSelector.max} viande{tacoSelector.max > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginBottom: 16, padding: '6px 12px', borderRadius: 20,
                background: canAdd ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.1)',
                border: `1px solid ${canAdd ? '#22c55e' : 'var(--accent)'}`,
              }}>
                {Array.from({ length: tacoSelector.max }).map((_, i) => (
                  <span key={i} style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: i < totalSelected ? 'var(--accent)' : 'var(--border)',
                    display: 'inline-block',
                  }} />
                ))}
                <span style={{ fontSize: 13, color: canAdd ? '#22c55e' : 'var(--accent)', fontWeight: 600, marginLeft: 4 }}>
                  {totalSelected}/{tacoSelector.max}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {TACO_MEATS.map(meat => {
                  const count = tacoMeatCounts[meat] || 0
                  const canIncrease = totalSelected < tacoSelector.max
                  return (
                    <div key={meat} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10,
                      border: `1px solid ${count > 0 ? 'var(--accent)' : 'var(--border)'}`,
                      background: count > 0 ? 'rgba(249,115,22,0.1)' : 'var(--surface2)',
                    }}>
                      <span style={{ fontWeight: count > 0 ? 700 : 400, color: count > 0 ? 'var(--accent)' : 'var(--text)', fontSize: 14 }}>
                        🥩 {meat}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => count > 0 && setTacoMeatCounts(prev => ({ ...prev, [meat]: count - 1 }))}
                          disabled={count === 0}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
                            background: count > 0 ? 'var(--surface)' : 'var(--surface2)',
                            color: count > 0 ? 'var(--text)' : 'var(--border)',
                            cursor: count > 0 ? 'pointer' : 'not-allowed', fontSize: 16, lineHeight: 1,
                          }}>−</button>
                        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 18, textAlign: 'center', color: count > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                          {count}
                        </span>
                        <button
                          onClick={() => canIncrease && setTacoMeatCounts(prev => ({ ...prev, [meat]: count + 1 }))}
                          disabled={!canIncrease}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
                            background: canIncrease ? 'var(--accent)' : 'var(--surface2)',
                            color: canIncrease ? '#fff' : 'var(--border)',
                            cursor: canIncrease ? 'pointer' : 'not-allowed', fontSize: 16, lineHeight: 1,
                          }}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTacoSelector(null)} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14,
                }}>Annuler</button>
                <button
                  disabled={!canAdd}
                  onClick={() => {
                    if (!canAdd) return
                    const parts: string[] = []
                    TACO_MEATS.forEach(meat => {
                      const c = tacoMeatCounts[meat] || 0
                      if (c > 0) parts.push(c > 1 ? `${meat} ×${c}` : meat)
                    })
                    addToCart(tacoSelector.menuItem.id, undefined, parts.join(', '))
                    setTacoSelector(null)
                  }}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                    background: canAdd ? 'var(--accent)' : 'var(--border)',
                    color: canAdd ? '#fff' : 'var(--muted)',
                    cursor: canAdd ? 'pointer' : 'not-allowed',
                    fontSize: 15, fontWeight: 700,
                  }}>✓ Ajouter au panier</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal sélecteur de pizzas pour formules */}
      {formulePicker && (() => {
        const allFilled = formulePizzas.every(p => p !== '')
        const pizzaLabel = formulePicker.count === 1 ? 'pizza' : 'pizzas'
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
          }} onClick={() => setFormulePicker(null)}>
            <div style={{
              background: 'var(--surface)', borderRadius: 16, padding: 24, width: 420,
              maxHeight: '85vh', overflow: 'auto', border: '1px solid var(--border)',
            }} onClick={e => e.stopPropagation()}>

              {/* En-tête */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>🍕</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{formulePicker.menuItem.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {formulePicker.size && <span style={{ color: 'var(--accent)', marginRight: 6 }}>{formulePicker.size}</span>}
                    Choisissez vos {formulePicker.count} {pizzaLabel}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, paddingLeft: 4 }}>
                {formulePicker.menuItem.description}
              </div>

              {/* Slots de sélection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {formulePizzas.map((selected, idx) => (
                  <div key={idx}>
                    <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>
                      Pizza {formulePicker.count > 1 ? `n°${idx + 1}` : ''}
                    </label>
                    <select
                      value={selected}
                      onChange={e => {
                        const next = [...formulePizzas]
                        next[idx] = e.target.value
                        setFormulePizzas(next)
                      }}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10,
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        background: selected ? 'rgba(249,115,22,0.08)' : 'var(--surface2)',
                        color: selected ? 'var(--text)' : 'var(--muted)',
                        fontSize: 14, cursor: 'pointer', appearance: 'auto',
                      }}
                    >
                      <option value="">— Choisir une pizza —</option>
                      {pizzaList.map(pizza => (
                        <option key={pizza.id} value={pizza.name}>{pizza.emoji} {pizza.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Résumé sélection */}
              {allFilled && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
                  fontSize: 13, color: '#22c55e', fontWeight: 600,
                }}>
                  ✓ {formulePizzas.join(' · ')}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setFormulePicker(null)} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14,
                }}>Annuler</button>
                <button
                  disabled={!allFilled}
                  onClick={() => {
                    if (!allFilled) return
                    addToCart(formulePicker.menuItem.id, formulePicker.size, formulePizzas.join(', '))
                    setFormulePicker(null)
                  }}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                    background: allFilled ? 'var(--accent)' : 'var(--border)',
                    color: allFilled ? '#fff' : 'var(--muted)',
                    cursor: allFilled ? 'pointer' : 'not-allowed',
                    fontSize: 15, fontWeight: 700,
                  }}>✓ Ajouter au panier</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modals paiement / ticket */}
      {showPayment && (
        <PaymentModal
          items={cart} total={total}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
      {lastOrder && (
        <ReceiptModal order={lastOrder} onClose={() => setLastOrder(null)} />
      )}
    </div>
  )
}
