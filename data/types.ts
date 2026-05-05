export type Category = 'pizza' | 'burger' | 'tacos' | 'salade' | 'tapas' | 'panini' | 'sandwich' | 'frite' | 'boisson' | 'dessert' | 'formule'

export interface MenuItem {
  id: string
  name: string
  category: Category
  price: number
  emoji: string
  description: string
  sizes?: { label: string; extra: number }[]
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  size?: string
  notes?: string
}

export type OrderStatus = 'en_attente' | 'en_preparation' | 'pret' | 'livre'
export type OrderType = 'sur_place' | 'a_emporter' | 'livraison'
export type PaymentMethod = 'especes' | 'carte' | 'cheque'

export interface DeliveryAddress {
  adresse: string
  ville: string
  codePostal: string
  interphone: string
  telephone: string
}

export interface Client {
  id: string
  name: string
  phone: string
  adresse: string
  ville: string
  codePostal: string
  interphone: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  number: number
  items: CartItem[]
  total: number
  status: OrderStatus
  type: OrderType
  paymentMethod: PaymentMethod
  createdAt: string
  updatedAt: string
  tableNumber?: number
  customerName?: string
  deliveryAddress?: DeliveryAddress
  cashGiven?: number
  change?: number
}
