import { useState, useMemo } from 'react'
import { useLeads, useFollowups } from '@/hooks/useSupabaseData'
import { format, isAfter, isBefore, startOfToday, endOfToday, addDays, subDays } from 'date-fns'
import { useSearch } from '@/context/SearchContext'
import { Followup } from '@/types'

const FollowUpPage = () => {
  const { data: allLeads = [], loading: leadsLoading } = useLeads()
  const { data: allFollowups = [], loading: followupsLoading, refetch } = useFollowups()
  const { searchQuery = '' } = useSearch()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'sent' | 'failed'>('upcoming')

  const loading = leadsLoading || followupsLoading

  // FILTERING LOGIC
  const filteredData = useMemo(() => {
    return allFollowups.filter((f: Followup) => {
      const matchesSearch = !searchQuery || 
        f.leadName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.templateName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTab = 
        (activeTab === 'upcoming' && f.status === 'pending') ||
        (activeTab === 'sent' && f.status === 'sent') ||
        (activeTab === 'failed' && f.status === 'failed')

      return matchesSearch && matchesTab
    })
  }, [allFollowups, searchQuery, activeTab])

  // STATS
  const stats = useMemo(() => {
    const pending = allFollowups.filter((f: Followup) => f.status === 'pending').length
    const sent = allFollowups.filter((f: Followup) => f.status === 'sent').length
    const failed = allFollowups.filter((f: Followup) => f.status === 'failed').length
    
    return { pending, sent, failed }
  }, [allFollowups])

  const formatIndianCurrency = (budgetStr: string | undefined | null) => {
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
          <p className="text-on-surface-variant font-medium">Loading sequences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="font-body animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-6">
        <span className="text-primary font-bold">Automation Center</span>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span>Follow-up Queue</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="text-left">
          <h1 className="text-4xl font-black tracking-tight text-primary mb-2">Follow-up Queue</h1>
          <p className="text-on-surface-variant max-w-2xl text-[14px]">
            Manage automated engagement sequences and lead nurture tasks. Sequences marked as <span className="font-bold underline italic">cancelled</span> are automatically archived.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-secondary text-3xl">schedule</span>
            <span className="text-3xl font-black text-secondary tracking-tighter">{stats.pending}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pending Scheduled</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">mark_email_read</span>
            <span className="text-3xl font-black text-primary tracking-tighter">{stats.sent}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sent (All Time)</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-error text-3xl">report_problem</span>
            <span className="text-3xl font-black text-error tracking-tighter">{stats.failed}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Failed Delivery</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-container-lowest rounded-md border border-outline-variant shadow-sm overflow-hidden text-left">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant px-6">
          {(['upcoming', 'sent', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-[11px] font-bold uppercase tracking-[0.15em] border-b-2 transition-all duration-300 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary hover:bg-primary/5'
              }`}
            >
              {tab}
              <span className="ml-2 bg-surface-container-high px-2 py-0.5 rounded-full text-[9px]">
                {tab === 'upcoming' ? stats.pending : tab === 'sent' ? stats.sent : stats.failed}
              </span>
            </button>
          ))}
        </div>

        {/* List Body */}
        <div className="p-0">
          {filteredData.length > 0 ? (
            <div className="divide-y divide-outline-variant">
              {filteredData.map((item: Followup) => (
                <div key={item.id} className="p-6 hover:bg-surface-container-low/30 transition-all flex flex-col xl:flex-row xl:items-center gap-6 group">
                  {/* Lead Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-bold text-primary group-hover:text-primary transition-colors">{item.leadName || 'Unknown Lead'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        item.channel === 'whatsapp' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 
                        item.channel === 'email' ? 'bg-primary/10 text-primary border border-primary/20' : 
                        'bg-on-surface-variant/10 text-on-surface-variant'
                      }`}>
                        {item.channel}
                      </span>
                      {item.leadSource && (
                        <span className="text-[10px] text-on-surface-variant/60 font-medium">via {item.leadSource}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-[12px] text-on-surface-variant">
                      <div className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[16px]">account_tree</span>
                        <span>{item.type || 'Standard Sequence'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        <span>{item.templateName || 'No Template'}</span>
                      </div>
                    </div>

                    {/* Rich Metadata Metrics */}
                    <div className="flex items-center space-x-4 mt-1">
                      {item.leadScore !== undefined && (
                        <div className="flex items-center space-x-1.5" title="Lead Score">
                          <div className="w-16 h-1 bg-surface-container-high rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.leadScore >= 80 ? 'bg-primary' : item.leadScore >= 50 ? 'bg-secondary' : 'bg-on-surface-variant/40'}`} 
                              style={{ width: `${item.leadScore}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant">Score: {item.leadScore}</span>
                        </div>
                      )}
                      
                      {item.leadBudget && (
                        <div className="flex items-center space-x-1 text-[11px] font-black text-secondary">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          <span>{formatIndianCurrency(item.leadBudget)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Info */}
                  <div className="xl:w-48">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                      {activeTab === 'upcoming' ? 'Scheduled For' : 'Delivered At'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                      <span className="text-[13px] font-medium">
                        {item.scheduledAt || item.sentAt ? format(new Date(item.scheduledAt || item.sentAt || ''), 'MMM dd, HH:mm') : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                      item.status === 'sent' ? 'bg-primary/5 border-primary/20 text-primary' : 
                      item.status === 'failed' ? 'bg-error/5 border-error/20 text-error' : 
                      item.status === 'cancelled' ? 'bg-on-surface-variant/5 border-outline-variant text-on-surface-variant/60' :
                      'bg-surface-container-high border-outline-variant text-on-surface-variant'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'sent' ? 'bg-primary' : 
                        item.status === 'failed' ? 'bg-error' : 
                        item.status === 'cancelled' ? 'bg-on-surface-variant/40' :
                        'bg-on-surface-variant opacity-40 animate-pulse'
                      }`}></span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">auto_stories</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Queue set to zero</h3>
              <p className="text-on-surface-variant text-sm max-w-xs text-center">
                Currently no {activeTab} sequences in the pipes. Sequences are managed automatically by the backend sync.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Automation Insights - Contextual Sidebar hint */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary/5 p-8 rounded-xl border border-primary/20 text-left">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">psychology</span>
            </div>
            <h4 className="font-black text-primary uppercase tracking-wider">AI Strategy Tip</h4>
          </div>
          <p className="text-sm text-primary/80 leading-relaxed italic">
            "Leads who receive a virtual tour follow-up within 24 hours of capture are <span className="font-bold underline">3.4x more likely</span> to convert to a site visit. Use the 'Tour Recap' template for optimal engagement."
          </p>
        </div>

        <div className="bg-secondary/5 p-8 rounded-xl border border-secondary/20 text-left">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">trending_up</span>
            </div>
            <h4 className="font-black text-secondary uppercase tracking-wider">Delivery Performance</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant">WhatsApp Delivery Rate</span>
              <span className="font-bold text-secondary">98.2%</span>
            </div>
            <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden">
              <div className="h-full bg-secondary" style={{ width: '98.2%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FollowUpPage
