import { create } from 'zustand'
import type { Product, SaleItem, Customer, Settings, User } from '../types'

interface CartItem extends SaleItem {
  product: Product
}

interface AppState {
  currentUser: User | null
  cart: CartItem[]
  selectedCustomer: Customer | null
  isOnline: boolean
  language: 'ht' | 'fr'
  settings: Settings | null

  login: (user: User) => void
  logout: () => void
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateCartItemQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  setSelectedCustomer: (customer: Customer | null) => void
  setSettings: (settings: Settings) => void
  setLanguage: (language: 'ht' | 'fr') => void
  setOnline: (isOnline: boolean) => void
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  cart: [],
  selectedCustomer: null,
  isOnline: navigator.onLine,
  language: 'ht',
  settings: null,

  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null, cart: [], selectedCustomer: null }),

  addToCart: (product, quantity = 1) => {
    const cart = get().cart
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      set({ cart: cart.map(item => item.productId === product.id
        ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
        : item
      )})
    } else {
      set({ cart: [...cart, {
        productId: product.id!, productName: product.name, quantity,
        unitPrice: product.price, discount: 0, subtotal: quantity * product.price, product
      }]})
    }
  },

  removeFromCart: (productId) => set({ cart: get().cart.filter(item => item.productId !== productId) }),

  updateCartItemQuantity: (productId, quantity) => {
    if (quantity <= 0) { get().removeFromCart(productId); return }
    set({ cart: get().cart.map(item => item.productId === productId
      ? { ...item, quantity, subtotal: quantity * item.unitPrice } : item
    )})
  },

  clearCart: () => set({ cart: [], selectedCustomer: null }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setSettings: (settings) => set({ settings, language: settings.language }),
  setLanguage: (language) => set({ language }),
  setOnline: (isOnline) => set({ isOnline })
}))

export function useCartTotals() {
  const cart = useStore(state => state.cart)
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotal, itemCount, cart }
}
