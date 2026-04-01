import { useState, useMemo } from 'react'
import { useLeads, computePipelineStats } from '@/hooks/useSupabaseData'
import { FilterOptions } from '@/types'
import PipelineStats from '@/components/pipeline/PipelineStats'
import LeadCard from '@/components/pipeline/LeadCard'
import { useSearch } from '@/context/SearchContext'
import { subDays, isAfter, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

const LeadPipeline = () => {
  const { data: leads, loading, error } = useLeads()
  const { searchQuery } = useSearch()
  const [filters, setFilters] = useState<FilterOptions>({})
  const [viewMode, setViewMode] = useState<'card' | 'timeline'>('card')
  const [timeFilter, setTimeFilter] = useState<'All Time' | 'Last 24 Hours' | 'Last 7 Days' | 'Last 30 Days' | 'Custom Range'>('All Time')
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const handleStageFilter = (stage: string) => {
    setFilters({
      ...filters,
      stage: filters.stage === stage ? undefined : stage,
    })
  }

  const handlePriorityFilter = (priority: 'H' | 'M' | 'L') => {
    setFilters({
      ...filters,
      priority: filters.priority === priority ? undefined : priority,
    })
  }

  const handleLeadScoreChange = (score: number) => {
    setFilters({
      ...filters,
      leadScoreMin: score,
    })
  }

  // Filter leads
  const filteredLeads = useMemo(() => {
    const now = new Date()
    
    return leads.filter((lead) => {
      // Filter by search query first
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = lead.name?.toLowerCase().includes(query)
        const matchesEmail = lead.email?.toLowerCase().includes(query)
        const matchesPhone = lead.phone?.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail && !matchesPhone) return false
      }

      // Filter by Date Range
      if (timeFilter !== 'All Time' && lead.createdAt) {
        const leadDate = new Date(lead.createdAt)
        if (timeFilter === 'Last 24 Hours') {
          if (!isAfter(leadDate, subDays(now, 1))) return false
        } else if (timeFilter === 'Last 7 Days') {
          if (!isAfter(leadDate, subDays(now, 7))) return false
        } else if (timeFilter === 'Last 30 Days') {
          if (!isAfter(leadDate, subDays(now, 30))) return false
        } else if (timeFilter === 'Custom Range') {
          if (customRange.start && customRange.end) {
            const start = startOfDay(new Date(customRange.start))
            const end = endOfDay(new Date(customRange.end))
            if (!isWithinInterval(leadDate, { start, end })) return false
          }
        }
      }

      if (filters.stage && filters.stage !== 'All Stages' && lead.stage !== filters.stage) return false
      if (filters.leadScoreMin && lead.leadScore < filters.leadScoreMin) return false
      if (filters.priority) {
        const priorityMap: Record<string, string> = { H: 'Hot', M: 'Warm', L: 'Cold' }
        if (lead.priority !== priorityMap[filters.priority]) return false
      }
      return true
    })
  }, [leads, filters, searchQuery, timeFilter, customRange])

  // Compute pipeline stats from live data
  const stats = useMemo(() => computePipelineStats(leads), [leads])

  const formatIndianCurrency = (budgetStr: string | null) => {
    if (!budgetStr || budgetStr === '—') return 'Evaluating...'
    
    const parseCurrency = (str: string) => {
      const cleanStr = str.toLowerCase().replace(/[^0-9.km]/g, '')
      if (!cleanStr) return str
      
      let multiplier = 1
      let numStr = cleanStr
      
      if (cleanStr.endsWith('k')) {
        multiplier = 1000
        numStr = cleanStr.slice(0, -1)
      } else if (cleanStr.endsWith('m')) {
        multiplier = 1000000
        numStr = cleanStr.slice(0, -1)
      }
      
      const num = parseFloat(numStr) * multiplier
      if (isNaN(num)) return str
      
      if (num >= 10000000) {
        return `₹${parseFloat((num / 10000000).toFixed(2))} Cr`
      } else if (num >= 100000) {
        return `₹${parseFloat((num / 100000).toFixed(2))} Lakh`
      } else if (num >= 1000) {
        return `₹${parseFloat((num / 1000).toFixed(2))} Thousand`
      } else {
        return `₹${num}`
      }
    }

    if (budgetStr.includes('-')) {
      return budgetStr.split('-').map(part => parseCurrency(part.trim())).join(' - ')
    }
    
    return parseCurrency(budgetStr)
  }

  if (loading) {
    return (
      <div className="font-body flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Loading pipeline data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="font-body flex items-center justify-center h-96">
        <div className="text-center bg-red-50 p-8 rounded-md border border-red-200">
          <span className="material-symbols-outlined text-5xl text-red-500 mb-4 block">error</span>
          <p className="text-red-700 font-bold mb-2">Failed to load pipeline</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="font-body">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-6">
        <span>Home</span>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary font-bold">Lead Pipeline</span>
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-end mb-10">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2">Lead Pipeline</h1>
          <p className="text-on-surface-variant">Get a real-time view of where every lead stands and what needs attention next.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-md">
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 text-xs font-semibold rounded-sm transition-all ${
              viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-xs font-semibold rounded-sm transition-all ${
              viewMode === 'timeline' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Timeline View
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <PipelineStats
        leadCaptured={stats.leadCaptured}
        tourAssigned={stats.tourAssigned}
        tourViewed={stats.tourViewed}
        followUp={stats.followUp}
        outcome={stats.outcome}
      />

      {/* Filters Area */}
      <div className="bg-surface-container-low/50 p-6 rounded-lg mb-8 flex flex-wrap items-center gap-8">
        <div className="flex flex-col text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Stage</label>
          <select
            value={filters.stage || 'All Stages'}
            onChange={(e) => handleStageFilter(e.target.value)}
            className="bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary text-sm font-medium py-1 px-0 w-32 outline-none cursor-pointer"
          >
            <option>All Stages</option>
            <option>Needs clarification</option>
            <option>Virtual Tour Sent</option>
            <option>Ready to engage</option>
            <option>Follow Up</option>
            <option>Outcome</option>
          </select>
        </div>

        <div className="flex flex-col text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Priority</label>
          <div className="flex space-x-2">
            {(['H', 'M', 'L'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityFilter(p)}
                className={`w-8 h-8 rounded-sm text-xs font-bold transition-all ${
                  filters.priority === p
                    ? 'bg-secondary text-white'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col flex-1 max-w-xs text-left">
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Lead Score</label>
            <span className="text-[10px] font-bold text-primary">{filters.leadScoreMin || 0}+</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.leadScoreMin || 0}
            onChange={(e) => handleLeadScoreChange(parseInt(e.target.value))}
            className="accent-primary h-1 bg-surface-variant rounded-full appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col text-left">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Date Range</label>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-transparent border-0 border-b-2 border-surface-variant focus:ring-0 focus:border-primary text-sm font-medium py-1 px-0 w-32 outline-none cursor-pointer"
            >
              <option>All Time</option>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range</option>
            </select>
            
            {timeFilter === 'Custom Range' && (
              <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="bg-surface-container-high/50 border-0 border-b border-surface-variant text-[11px] font-bold text-primary py-0.5 outline-none focus:border-primary"
                />
                <span className="text-[10px] font-bold text-on-surface-variant">to</span>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="bg-surface-container-high/50 border-0 border-b border-surface-variant text-[11px] font-bold text-primary py-0.5 outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leads Grid & Bento Insights */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="relative border-l-2 border-surface-variant ml-4 md:ml-6 space-y-6 pl-8 py-4">
          {[...filteredLeads].sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((lead) => (
            <div key={lead.id} className="relative group">
              {/* Timeline dot */}
              <div className={`absolute -left-[43px] top-4 w-5 h-5 rounded-full border-4 border-surface ${
                  lead.priority === 'Hot' ? 'bg-red-500' : lead.priority === 'Warm' ? 'bg-orange-400' : 'bg-blue-400'
                } group-hover:scale-110 transition-transform`} 
              />
              <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                
                <div className="flex flex-col flex-1">
                  <div className="flex items-center space-x-3 mb-1.5">
                    <h3 className="text-lg font-bold text-on-surface">{lead.name}</h3>
                    <span className="px-2.5 py-0.5 bg-surface-variant text-on-surface text-[10px] uppercase font-bold tracking-wider rounded-sm">
                      {lead.stage}
                    </span>
                  </div>
                  <div className="text-sm text-on-surface-variant flex items-center space-x-4">
                    {lead.email && <span className="flex items-center"><span className="material-symbols-outlined text-[16px] mr-1.5 opacity-70">mail</span> {lead.email}</span>}
                    {lead.phone && <span className="flex items-center"><span className="material-symbols-outlined text-[16px] mr-1.5 opacity-70">call</span> {lead.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-6 md:gap-8">
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-0.5">Budget Target</span>
                    <span className="text-sm font-bold text-primary">{formatIndianCurrency(lead.priceRange)}</span>
                  </div>
                  
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-0.5">Timeline</span>
                    <span className="text-sm font-semibold text-on-surface">{lead.timeline || 'Unspecified'}</span>
                  </div>

                  <div className="flex flex-col text-right border-l border-surface-variant pl-4 md:pl-6 min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-0.5">Captured</span>
                    <span className="text-sm font-bold text-on-surface flex items-center justify-end">
                      <span className="material-symbols-outlined text-[16px] mr-1.5 text-primary">calendar_clock</span>
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredLeads.length === 0 && !loading && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-outline mb-4 block">person_search</span>
          <p className="text-on-surface-variant">No leads match your current criteria.</p>
        </div>
      )}
    </div>
  )
}

export default LeadPipeline
