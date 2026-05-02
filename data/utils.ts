import { CartItem } from './types'

export function getEffectivePrice(item: CartItem): number {
  if (item.size && item.menuItem.sizes) {
    const sizeOption = item.menuItem.sizes.find(s => s.label === item.size)
    return item.menuItem.price + (sizeOption?.extra || 0)
  }
  return item.menuItem.price
}
