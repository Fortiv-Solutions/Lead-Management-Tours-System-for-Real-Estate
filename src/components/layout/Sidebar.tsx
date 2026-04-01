import { useLocation, Link } from 'react-router-dom'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'insert_chart', path: '/dashboard' },
    { id: 'conversations', label: 'Lead Inbox', icon: 'inbox', path: '/conversations' },
    { id: 'pipeline', label: 'Lead Pipeline', icon: 'lan', path: '/pipeline' },
    { id: 'followup', label: 'Follow-up Queue', icon: 'auto_mode', path: '/followup' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface border-r border-surface-container-high py-8 px-3 hidden lg:flex flex-col font-body h-full overflow-y-auto transition-all duration-300 ease-in-out relative shrink-0`}>
      {/* Floating Toggle Button */}
      <button 
        id="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-10 -right-4 z-50 flex items-center justify-center w-8 h-8 rounded-full border border-surface-container-high bg-surface shadow-sm text-on-surface-variant hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span className="material-symbols-outlined text-[18px] font-bold">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
      <nav className="flex flex-col space-y-2 mt-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center transition-all duration-200 group px-3 py-3 rounded-lg ${
              isActive(item.path)
                ? 'bg-primary-fixed text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            } ${isCollapsed ? 'justify-center mx-auto w-12 h-12' : 'w-full space-x-4'}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className={`material-symbols-outlined text-[25px] transition-transform duration-200 group-hover:scale-110 ${isActive(item.path) ? 'font-fill' : ''}`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>


    </aside>
  )
}

export default Sidebar
