import { NavLink } from 'react-router-dom'
import { Home, ShoppingCart, Package, Users, Settings } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

const navItems = [
  { path: '/', icon: Home, labelKey: 'home' as const },
  { path: '/sales', icon: ShoppingCart, labelKey: 'sales' as const },
  { path: '/inventory', icon: Package, labelKey: 'inventory' as const },
  { path: '/customers', icon: Users, labelKey: 'customers' as const },
  { path: '/settings', icon: Settings, labelKey: 'settings' as const },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive
                ? 'flex flex-col items-center justify-center w-full h-full text-black'
                : 'flex flex-col items-center justify-center w-full h-full text-gray-400'
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-xs mt-1">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
