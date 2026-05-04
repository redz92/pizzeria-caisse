import { supabase } from './supabase'
import { Order } from '../data/types'

// Conversion DB (snake_case) → Order (camelCase)
function fromDb(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    number: row.number as number,
    items: row.items as Order['items'],
    total: row.total as number,
    status: row.status as Order['status'],
    type: row.type as Order['type'],
    paymentMethod: row.payment_method as Order['paymentMethod'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    tableNumber: row.table_number as number | undefined,
    customerName: row.customer_name as string | undefined,
    deliveryAddress: row.delivery_address as Order['deliveryAddress'],
    cashGiven: row.cash_given as number | undefined,
    change: row.change as number | undefined,
  }
}

// Conversion Order → DB row
function toDb(order: Order) {
  return {
    id: order.id,
    number: order.number,
    items: order.items,
    total: order.total,
    status: order.status,
    type: order.type,
    payment_method: order.paymentMethod,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    table_number: order.tableNumber ?? null,
    customer_name: order.customerName ?? null,
    delivery_address: order.deliveryAddress ?? null,
    cash_given: order.cashGiven ?? null,
    change: order.change ?? null,
  }
}

export async function dbSaveOrder(order: Order): Promise<void> {
  const { error } = await supabase.from('orders').insert(toDb(order))
  if (error) throw error
}

export async function dbGetAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function dbGetTodayOrders(): Promise<Order[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function dbGetOrdersSince(date: Date): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', date.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function dbUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function dbGetNextOrderNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('orders')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return 1
  return (data[0].number as number) + 1
}
