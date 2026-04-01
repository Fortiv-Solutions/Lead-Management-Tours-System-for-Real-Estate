interface PipelineStatsProps {
  leadCaptured: number
  tourAssigned: number
  tourViewed: number
  followUp: number
  outcome: number
}

const PipelineStats = ({
  leadCaptured,
  tourAssigned,
  tourViewed,
  followUp,
  outcome,
}: PipelineStatsProps) => {
  return (
    <div className="flex w-full mb-12 h-20 space-x-1 font-body">
      <div className="chevron-path flex-1 bg-primary flex flex-col justify-center px-8 relative">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-tight">Needs Clarification</span>
        <span className="text-xl font-bold text-white tracking-tight">{leadCaptured} Buyers</span>
      </div>
      <div className="chevron-path flex-1 bg-secondary-container flex flex-col justify-center px-8 relative">
        <span className="text-[10px] font-bold text-on-secondary-container/60 uppercase tracking-widest leading-tight">Virtual Tour Sent</span>
        <span className="text-xl font-bold text-on-secondary-container tracking-tight">{tourAssigned} Buyers</span>
      </div>
      <div className="chevron-path flex-1 bg-primary-fixed flex flex-col justify-center px-8 relative">
        <span className="text-[10px] font-bold text-on-primary-fixed/60 uppercase tracking-widest leading-tight">Ready to engage</span>
        <span className="text-xl font-bold text-on-primary-fixed tracking-tight">{tourViewed} Buyers</span>
      </div>
      <div className="chevron-path flex-1 bg-surface-container-high flex flex-col justify-center px-8 relative">
        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-tight">Follow Up</span>
        <span className="text-xl font-bold text-on-surface tracking-tight">{followUp} Buyers</span>
      </div>
      <div className="chevron-path flex-1 bg-tertiary-fixed flex flex-col justify-center px-8 relative">
        <span className="text-[10px] font-bold text-on-tertiary-fixed/60 uppercase tracking-widest leading-tight">Outcome</span>
        <span className="text-xl font-bold text-on-tertiary-fixed tracking-tight">{outcome} Closed</span>
      </div>
    </div>
  )
}

export default PipelineStats
