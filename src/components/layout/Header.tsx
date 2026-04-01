import { Link } from 'react-router-dom'
import { useSearch } from '@/context/SearchContext'

const Header = () => {
  const { searchQuery, setSearchQuery } = useSearch()

  return (
    <header className="bg-surface flex justify-between items-center w-full px-8 py-4 max-w-[1920px] mx-auto font-body text-sm tracking-tight sticky top-0 z-50 transition-all border-b border-surface-container-high">
      <Link to="/" className="flex items-center space-x-3 transition-opacity hover:opacity-90">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/10">
          <span className="material-symbols-outlined text-surface text-[22px] font-bold">architecture</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-primary tracking-tighter leading-tight uppercase">ARCHISYNC</span>
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-on-surface-variant/50 -mt-0.5">Lead Intel & Tours</span>
        </div>
      </Link>
      
      {/* Navigation labels removed as they are present in the Sidebar */}

      <div className="flex items-center">
        <div className="relative hidden lg:block text-left">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">search</span>
          <input
            className="bg-surface-container-low border-none rounded-md pl-9 pr-4 py-2 text-xs w-64 focus:ring-1 focus:ring-primary transition-all outline-none"
            placeholder="Search leads..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </header>
  )
}

export default Header
