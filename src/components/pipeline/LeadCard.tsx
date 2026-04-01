import { Lead } from '@/types'

interface LeadCardProps {
  lead: Lead
}

const LeadCard = ({ lead }: LeadCardProps) => {
  const getStageStyles = () => {
    switch (lead.stage) {
      case 'Needs clarification':
        return { border: 'border-slate-300', text: 'text-on-surface-variant/60' }
      case 'Virtual Tour Sent':
        return { border: 'border-secondary', text: 'text-secondary' }
      case 'Ready to engage':
        return { border: 'border-primary', text: 'text-primary' }
      case 'Outcome':
        return { border: 'border-tertiary', text: 'text-tertiary' }
      default:
        return { border: 'border-outline-variant', text: 'text-on-surface-variant' }
    }
  }

  const getPriorityBadge = () => {
    switch (lead.priority) {
      case 'Hot':
        return 'bg-secondary/10 text-secondary'
      case 'Warm':
        return 'bg-primary/10 text-primary'
      case 'Cold':
        return 'bg-surface-container-high text-on-surface-variant'
      default:
        return 'bg-surface-container-high text-on-surface-variant'
    }
  }

  const { border, text } = getStageStyles()

  const formatIndianCurrency = (budgetStr: string | null) => {
    if (!budgetStr || budgetStr === '—') return '—'
    
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

  return (
    <div className={`bg-surface-container-lowest p-6 rounded-md shadow-sm border-l-4 ${border} transition-all hover:bg-primary-fixed/20 group relative overflow-hidden font-body`}>
      <div className="mb-4 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${text} block`}>
            {lead.stage}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${getPriorityBadge()}`}>
            {lead.priority}
          </span>
        </div>
        <h3 className="text-xl font-bold text-primary tracking-tight">{lead.name}</h3>
      </div>
      <div className="space-y-2 mb-6 text-on-surface-variant text-xs text-left">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-[16px]">mail</span>
          <span>{lead.email || '—'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
          <span>{lead.phone || '—'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between py-3 border-y border-surface-variant/30 mb-4">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
          <span className="text-xs font-bold">{formatIndianCurrency(lead.priceRange)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
          <span className="text-xs font-bold">{lead.timeline || '—'}</span>
        </div>
      </div>
      <div className="mt-4 text-left">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Lead Score</span>
          <span className="text-xs font-black text-primary">{lead.leadScore}/100</span>
        </div>
        <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full ${lead.leadScore > 70 ? 'bg-primary' : 'bg-primary/40'}`}
            style={{ width: `${lead.leadScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default LeadCard
