import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-surface font-body text-on-surface overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto flex flex-col bg-surface transition-all duration-300 ease-in-out">
          <div className="p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
