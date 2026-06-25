import clsx from 'clsx'

export default function MatchScore({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-400' :
    score >= 40 ? 'text-amber-400' :
    'text-gray-500'

  const bg =
    score >= 70 ? 'bg-emerald-500' :
    score >= 40 ? 'bg-amber-500' :
    'bg-gray-600'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', bg)} style={{ width: `${score}%` }} />
      </div>
      <span className={clsx('text-xs font-semibold tabular-nums', color)}>{score}%</span>
    </div>
  )
}
