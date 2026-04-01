import { useState, useEffect, useMemo } from 'react'
import { useProperties, useLeads, useActivityLogs, useConversations } from '@/hooks/useSupabaseData'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { useSearch } from '@/context/SearchContext'

const Dashboard = () => {
  const { data: allProperties = [], loading: propsLoading } = useProperties()
  const { data: allLeads = [], loading: leadsLoading } = useLeads()
  const { data: allActivityLogs = [], loading: logsLoading } = useActivityLogs()
  const { data: allConversations = [], loading: convsLoading } = useConversations()
  const { searchQuery = '' } = useSearch()

  const [messageLogs, setMessageLogs] = useState<{created_at: string}[]>([])
  
  // Filter data based on search query
  const properties = allProperties.filter(p => !searchQuery || 
    p.address?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.propertyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.agentName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const leads = allLeads.filter(l => !searchQuery || 
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const leadNamesForSearch = new Set(leads.map(l => (l.name || '').toLowerCase()))
  
  const activityLogs = allActivityLogs.filter(log => !searchQuery || 
    leadNamesForSearch.has((log.buyerName || '').toLowerCase()) ||
    log.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const conversations = allConversations.filter(c => !searchQuery || 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('created_at')
      if (data) setMessageLogs(data)
    }
    fetchMessages()
  }, [])

  const loading = propsLoading || leadsLoading || logsLoading || convsLoading

  const formatCompact = (num: number) => {
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

  const totalPortfolioValue = properties.reduce((acc, p) => acc + p.price, 0)
  const avgLeadScore = leads.length > 0
    ? Math.round(leads.reduce((acc, l) => acc + l.leadScore, 0) / leads.length)
    : 0
  const hotLeads = leads.filter((l) => l.priority === 'Hot').length

  // Compute basic stage distribution for pipeline insight
  const needClarificationCount = conversations.filter(c => {
    if (typeof c.state === 'string') {
      return c.state.includes('clarification')
    }
    return false
  }).length

  const readyToEngageCount = conversations.filter(c => {
    if (typeof c.state === 'string') {
      return c.state.includes('engage')
    }
    return false
  }).length

  // You can also consider distinct leads that have been sent a tour link
  const virtualTourSentCount = activityLogs.filter(log => log.status === 'Tour Link Sent').length

  const stageDistribution = [
    { label: 'Needs Clarification', count: needClarificationCount, color: 'bg-tertiary' },
    { label: 'Virtual Tour Sent', count: virtualTourSentCount, color: 'bg-secondary' },
    { label: 'Ready to Engage', count: readyToEngageCount, color: 'bg-primary' },
  ]
  const maxStageCount = Math.max(...stageDistribution.map((s) => s.count), 1)

  const [timeFilter, setTimeFilter] = useState<'Today' | 'Last Week' | 'Last Month'>('Today')

  // -- Dynamic Activity Data based on Filter --
  const activityData = useMemo(() => {
    const now = new Date()
    
    if (timeFilter === 'Today') {
      // Last 24 hours (Hourly)
      return Array.from({ length: 24 }, (_, i) => {
        const date = new Date(now)
        date.setHours(now.getHours() - (23 - i), 0, 0, 0)
        const dateDayStr = format(date, 'yyyy-MM-dd')
        const hour = date.getHours()
        
        const logCount = activityLogs.filter(log => {
          if (!log.timestamp) return false
          const d = new Date(log.timestamp)
          return format(d, 'yyyy-MM-dd') === dateDayStr && d.getHours() === hour
        }).length

        const msgCount = messageLogs.filter(m => {
          if (!m.created_at) return false
          const d = new Date(m.created_at)
          return format(d, 'yyyy-MM-dd') === dateDayStr && d.getHours() === hour
        }).length

        return { 
          name: format(date, 'HH:00'), 
          interactions: logCount + msgCount 
        }
      })
    }

    const days = timeFilter === 'Last Week' ? 7 : 30
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(now, (days - 1) - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const logCount = activityLogs.filter((log) => log.timestamp?.startsWith(dateStr)).length
      const msgCount = messageLogs.filter((m) => m.created_at?.startsWith(dateStr)).length
      return { 
        name: format(date, 'MMM dd'), 
        interactions: logCount + msgCount 
      }
    })
  }, [timeFilter, activityLogs, messageLogs])

  // -- Lead Priorities --
  const priorityData = [
    { name: 'Hot', count: leads.filter((l) => l.priority === 'Hot').length, fill: '#ef4444' },     // red-500
    { name: 'Warm', count: leads.filter((l) => l.priority === 'Warm').length, fill: '#f59e0b' },    // amber-500
    { name: 'Cold', count: leads.filter((l) => l.priority === 'Cold').length, fill: '#3b82f6' }     // blue-500
  ].filter(p => p.count > 0)

  // -- Acquisition Channels (Insights) --
  const sourceCount = new Map<string, number>()
  conversations.forEach(c => {
    const s = c.source && c.source !== 'Unknown' && c.source !== 'unknown_name' ? c.source : 'Website'
    sourceCount.set(s, (sourceCount.get(s) || 0) + 1)
  })
  const acquisitionData = Array.from(sourceCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const ACQUISITION_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']

  if (loading) {
    return (
      <div className="font-body flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Crunching dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="font-body">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-6">
        <span className="text-primary font-bold">Primary Dashboard</span>
      </div>

      {/* Page Header */}
      <div className="text-left mb-10">
        <h1 className="text-4xl font-black tracking-tight text-primary mb-2">Dashboard Overview</h1>
        <p className="text-on-surface-variant max-w-2xl text-[14px]">Real-time intelligence and portfolio performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">domain</span>
            </div>
            <h3 className="text-3xl font-black text-primary tracking-tighter">{properties.length}</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Properties</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-secondary/10 rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">people</span>
            </div>
            <h3 className="text-3xl font-black text-secondary tracking-tighter">{leads.length}</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Leads</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-tertiary/10 rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">payments</span>
            </div>
            <h3 className="text-3xl font-black text-tertiary tracking-tighter">{formatCompact(totalPortfolioValue)}</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Portfolio Value</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">local_fire_department</span>
            </div>
            <h3 className="text-3xl font-black text-primary tracking-tighter">{hotLeads}</h3>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hot Leads</p>
        </div>
      </div>

      {/* Strategic Executive View: Activity + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats Stack - Contextualized layout */}
        <div className="flex flex-col gap-5">
          <div className="bg-surface-container-high p-6 rounded-sm border-l-4 border-primary text-left flex-1 flex flex-row items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">Avg. Lead Score</span>
            <div className="text-3xl font-black text-primary tracking-tighter">{avgLeadScore}/100</div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-sm border-l-4 border-secondary text-left flex-1 flex flex-row items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">Total Tour Interactions</span>
            <div className="text-3xl font-black text-secondary tracking-tighter">{activityLogs.length}</div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-sm border-l-4 border-tertiary text-left flex-1 flex flex-row items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">Avg. Property Value</span>
            <div className="text-3xl font-black text-tertiary tracking-tighter">
              {properties.length > 0 ? formatCompact(totalPortfolioValue / properties.length) : '₹0'}
            </div>
          </div>
        </div>

        {/* Activity Log Trending (Focus Metric) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left flex flex-col">
          <div className="flex flex-wrap flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Engagement Activity</h2>
            </div>
            
            <div className="flex items-center bg-surface-container-high/50 rounded-lg p-1 border border-outline-variant shadow-inner">
              {(['Today', 'Last Week', 'Last Month'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                    timeFilter === filter 
                      ? 'bg-primary text-on-primary shadow-md transform scale-[1.02]' 
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-grow w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="interactions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorInteractions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Charts: Distribution, Priorities & Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline Stage Distribution */}
        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left flex flex-col">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Pipeline Distribution</h2>
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {stageDistribution.map((stage) => (
              <div key={stage.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-on-surface-variant">{stage.label}</span>
                  <span className="text-xs font-black text-primary">{stage.count}</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Priorities Bar Chart */}
        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left flex flex-col">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Lead Categories</h2>
          <div className="flex-grow w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} maxBarSize={60} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NEW Visual: Acquisition Channels */}
        <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant shadow-sm text-left flex flex-col">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Channel Split</h2>
          <div className="flex-grow w-full min-h-[220px]">
            {acquisitionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={acquisitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {acquisitionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACQUISITION_COLORS[index % ACQUISITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-on-surface-variant">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
