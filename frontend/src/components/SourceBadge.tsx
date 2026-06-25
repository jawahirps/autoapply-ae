import clsx from 'clsx'

const SOURCE_COLORS: Record<string, string> = {
  linkedin:    'bg-blue-900/50 text-blue-300 border border-blue-700/40',
  indeed:      'bg-violet-900/50 text-violet-300 border border-violet-700/40',
  bayt:        'bg-amber-900/50 text-amber-300 border border-amber-700/40',
  naukrigulf:  'bg-rose-900/50 text-rose-300 border border-rose-700/40',
  gulftalent:  'bg-teal-900/50 text-teal-300 border border-teal-700/40',
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  bayt: 'Bayt',
  naukrigulf: 'Naukrigulf',
  gulftalent: 'GulfTalent',
}

export default function SourceBadge({ source }: { source: string }) {
  return (
    <span className={clsx('badge', SOURCE_COLORS[source] || 'bg-gray-800 text-gray-400')}>
      {SOURCE_LABELS[source] || source}
    </span>
  )
}
