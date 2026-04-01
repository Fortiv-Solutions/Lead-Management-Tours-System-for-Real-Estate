import React, { useState, useMemo, useEffect } from 'react'
import { useConversations, useMessages } from '@/hooks/useSupabaseData'
import { formatDistanceToNow } from 'date-fns'
import { useSearch } from '@/context/SearchContext'

const ConversationsPage = () => {
  const { data: conversations, loading } = useConversations()
  const { searchQuery: search, setSearchQuery: setSearch } = useSearch()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatIndianCurrency = (budgetStr: string | null | undefined) => {
    if (!budgetStr || budgetStr === '—' || budgetStr.toLowerCase() === 'flexible') return 'Flexible'
    
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

  // Auto-select first conversation if none selected
  React.useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  )

  const { data: messages, loading: messagesLoading } = useMessages(selectedId)

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.lastMessage?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesTab = activeTab === 'All' || c.platform.toLowerCase() === activeTab.toLowerCase()
      return matchesSearch && matchesTab
    })
  }, [conversations, search, activeTab])

  const tabs = ['All', 'Instagram', 'Facebook', 'WhatsApp', 'Website']

  const getSourceIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'photo_camera'
      case 'whatsapp': return 'chat'
      case 'facebook': return 'facebook'
      default: return 'language'
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-surface overflow-hidden">
      {/* Left Sidebar: Lead Inbox */}
      <div className="w-[380px] border-r border-surface-container-high flex flex-col bg-surface shadow-sm z-10">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-on-surface mb-4">Lead Inbox</h1>
          
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container rounded-xl py-3 pl-10 pr-4 text-[13px] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="flex space-x-1 border-b border-surface-container-high overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-[12px] font-bold transition-all relative shrink-0 ${
                  activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-[13px]">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`p-4 mx-3 my-1 rounded-2xl cursor-pointer transition-all duration-200 group flex items-start space-x-3 relative ${
                  selectedId === c.id 
                    ? 'bg-primary-fixed shadow-sm' 
                    : 'hover:bg-surface-container hover:shadow-sm'
                }`}
              >
                {/* Active Indicator Pin */}
                {selectedId === c.id && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  selectedId === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="text-[14px] font-bold">{c.name.charAt(0)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center space-x-1 min-w-0">
                      <h3 className={`text-[14px] font-bold truncate ${selectedId === c.id ? 'text-primary' : 'text-on-surface'}`}>
                        {c.name}
                      </h3>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant shrink-0">
                        {getSourceIcon(c.platform)}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant shrink-0 font-medium">
                      {(() => {
                        if (!c.lastMessageAt) return ''
                        const d = new Date(c.lastMessageAt)
                        if (isNaN(d.getTime())) return ''
                        return formatDistanceToNow(d, { addSuffix: true }).replace('about ', '')
                      })()}
                    </span>
                  </div>
                  
                  <p className="text-[12px] text-on-surface-variant line-clamp-1 mb-3 leading-relaxed">
                    {c.lastMessage || 'No messages yet'}
                  </p>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      c.matchScore >= 75 ? 'bg-red-100 text-red-700' :
                      c.matchScore >= 30 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {c.matchScore >= 75 ? 'HOT' : c.matchScore >= 30 ? 'WARM' : 'COLD'}
                    </span>
                    {c.intent && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[9px] font-bold uppercase tracking-wider truncate">
                        {c.intent.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Conversation View */}
      <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="px-4 py-6 border-b border-surface-container-high flex justify-between items-start bg-surface/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-xl font-black shadow-inner">
                  {selectedConversation.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">{selectedConversation.name}</h2>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-black uppercase tracking-[0.1em]">
                      {selectedConversation.platform}
                    </span>
                    <span className="text-on-surface-variant text-[11px] font-medium flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">calendar_today</span>
                      Joined {selectedConversation.joinedAt ? new Date(selectedConversation.joinedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] block mb-1">Lead Score</span>
                <span className={`text-4xl font-black ${selectedConversation.matchScore > 80 ? 'text-primary' : 'text-orange-500'} tabular-nums`}>
                  {selectedConversation.matchScore}%
                </span>
              </div>
            </div>

            {/* Content Sidebar + Chat Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Middle: Chat History */}
              <div className="flex-1 flex flex-col border-r border-surface-container-high bg-surface-container/10 overflow-hidden">
                {/* Scrollable Area for Chat */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  
                  {/* Chat View Section */}
                  <div className="bg-white rounded-[32px] border border-surface-container-high shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl">
                    <div className="px-8 py-5 border-b border-surface-container-high bg-surface-container/30 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Conversation History</h3>
                      </div>
                      <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        selectedConversation.matchScore >= 75 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedConversation.matchScore >= 75 ? 'High Intent' : 'Warm Prospect'}
                      </span>
                    </div>

                    <div className="p-8 flex-1 bg-surface-container/10">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-70">
                          <div className="p-10 bg-white rounded-3xl border-2 border-dashed border-surface-container-high max-w-md w-full">
                            <p className="text-on-surface-variant text-[14px] italic text-center font-medium leading-relaxed">
                              "{selectedConversation.lastMessage || 'No recent messages found in external history.'}"
                            </p>
                          </div>
                          <p className="text-[11px] text-on-surface-variant font-black uppercase tracking-[0.15em]">Last Logged Fragment</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-4xl mx-auto">
                          {/* UPDATED: Showing last 2 messages instead of first 2 */}
                          {messages.length > 2 && (
                            <div className="flex justify-center mb-6">
                              <div className="h-[1px] bg-surface-container-high flex-1 self-center"></div>
                              <span className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic">Previous activity hidden</span>
                              <div className="h-[1px] bg-surface-container-high flex-1 self-center"></div>
                            </div>
                          )}
                          
                          {messages.slice(-2).map((m) => (
                            <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative transition-all hover:scale-[1.01] ${
                                m.direction === 'outbound' 
                                  ? 'bg-slate-800 text-white rounded-tr-none' 
                                  : 'bg-white border border-surface-container-high text-on-surface rounded-tl-none'
                              }`}>
                                <p className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap">{m.content}</p>
                                <div className="text-[8px] mt-1 font-bold uppercase tracking-widest opacity-60 text-right">
                                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  {m.channel && ` • VIA ${m.channel}`}
                                </div>
                              </div>
                            </div>
                          ))}

                          {messages.length > 2 && (
                            <div className="flex justify-center pt-8">
                              <button 
                                onClick={() => setIsModalOpen(true)}
                                className="group px-6 py-3 bg-white border border-surface-container-high rounded-full shadow-sm hover:shadow-md hover:bg-surface-container transition-all flex items-center space-x-3"
                              >
                                <span className="text-[12px] font-black text-primary uppercase tracking-wider">Expand Full History</span>
                                <span className="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              </div>

              {/* Right: Lead Profile & Sidebar Details */}
              <div className="w-[360px] bg-white border-l border-surface-container-high flex flex-col overflow-y-auto scrollbar-hide shadow-lg z-10 shrink-0">
                <div className="p-8 space-y-10">
                  
                  {/* Status Section */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center">
                      <span className="material-symbols-outlined text-[18px] mr-2 text-primary">analytics</span>
                      Profile Analytics
                    </h3>
                    
                    <div className="bg-surface-container/30 rounded-3xl p-6 space-y-6 border border-surface-container-high/50">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-1">Intent Level</span>
                          <span className={`text-[12px] font-black px-3 py-1 rounded-full ${
                            selectedConversation.matchScore >= 75 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                          }`}>
                            {selectedConversation.matchScore >= 75 ? 'HIGH INTENT' : 'WARM PROSPECT'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-1">Lead Health</span>
                          <span className="text-2xl font-black text-on-surface">Excellent</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                          <span>Conversion Probability</span>
                          <span>{selectedConversation.matchScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: `${selectedConversation.matchScore}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center">
                      <span className="material-symbols-outlined text-[18px] mr-2 text-primary">person</span>
                      Lead Credentials
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">call</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Phone Number</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight">{selectedConversation.phone || 'Not provided'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">location_on</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Primary Location</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight">{selectedConversation.location || 'Unknown Area'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">explore</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Discovery Intent</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight capitalize">
                            {(selectedConversation.intent || 'General Interest').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead Preferences */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center">
                      <span className="material-symbols-outlined text-[18px] mr-2 text-primary">interests</span>
                      Property Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Budget Range</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight">{formatIndianCurrency(selectedConversation.budget)}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">schedule</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Purchase Timeline</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight">{selectedConversation.timeline || 'Immediate'}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 group cursor-default">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-[20px]">home_work</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block mb-0.5">Desired Property</span>
                          <span className="text-[14px] font-bold text-on-surface tracking-tight">
                            {selectedConversation.bedrooms ? `${selectedConversation.bedrooms} BHK ` : ''}
                            {selectedConversation.propertyType || 'Residential'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Channel Attribution */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center">
                      <span className="material-symbols-outlined text-[18px] mr-2 text-primary">hub</span>
                      Source Attribution
                    </h3>
                    <div className="p-5 rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-lg overflow-hidden relative">
                      <div className="relative z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Acquisition Channel</span>
                        <span className="text-lg font-black tracking-tight">{selectedConversation.platform}</span>
                      </div>
                      <span className="material-symbols-outlined text-[40px] opacity-20 absolute -right-2 -bottom-2 transform rotate-12">
                        {getSourceIcon(selectedConversation.platform)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Interaction Area at bottom if needed */}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl">inbox</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Select a Lead</h2>
            <p className="text-on-surface-variant max-w-xs mx-auto text-[14px]">
              Choose a conversation from the sidebar to view details and message history.
            </p>
          </div>
        )}
      </div>

      {/* Full Conversation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-surface rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-surface-container-high flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                  {selectedConversation?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-on-surface">{selectedConversation?.name}</h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">Full Conversation History</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: Full History */}
            <div className="flex-1 overflow-y-auto p-8 bg-surface-container/5 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative ${
                    m.direction === 'outbound' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white border border-surface-container-high text-on-surface rounded-tl-none'
                  }`}>
                    <p className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap">{m.content}</p>
                    <div className="text-[8px] mt-1 font-bold uppercase tracking-widest opacity-60 text-right">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      {m.channel && ` • VIA ${m.channel}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-container-high text-center bg-white shrink-0">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                Showing {messages.length} messages
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationsPage
