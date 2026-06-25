import { useState } from 'react'
import { MapPin, Building2, ExternalLink, Send, Clock, CheckCircle, Zap } from 'lucide-react'
import type { Job } from '../types'
import SourceBadge from './SourceBadge'
import MatchScore from './MatchScore'
import ApplicationReceipt from './ApplicationReceipt'
import { applyToJob } from '../services/api'
import clsx from 'clsx'

interface Props {
  job: Job
  isApplied?: boolean
  onApplied?: (jobId: number) => void
}

export default function JobCard({ job, isApplied, onApplied }: Props) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(isApplied || false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{ applicationId: number; applyUrl: string; appliedAt: string } | null>(null)

  const handleApply = async () => {
    if (applied) return
    setApplying(true)
    setError('')
    try {
      const res = await applyToJob(job.id, 'manual')
      setApplied(true)
      onApplied?.(job.id)
      setReceipt({
        applicationId: res.data.application_id,
        applyUrl: res.data.apply_url,
        appliedAt: new Date().toISOString(),
      })
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Apply failed')
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      {receipt && (
        <ApplicationReceipt
          applicationId={receipt.applicationId}
          jobTitle={job.title}
          company={job.company}
          source={job.source}
          applyUrl={receipt.applyUrl}
          appliedAt={receipt.appliedAt}
          onClose={() => setReceipt(null)}
        />
      )}

      <div className={clsx(
        'card hover:border-gray-700 transition-all group relative',
        applied && 'opacity-80 border-emerald-900/50'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-xs">
              <Building2 size={12} />
              <span className="truncate">{job.company || '—'}</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <SourceBadge source={job.source} />
            {job.easy_apply && (
              <span className="badge bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 flex items-center gap-1">
                <Zap size={10} /> Easy Apply
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
          )}
          {job.salary && <span className="text-emerald-500 font-medium">{job.salary}</span>}
          {job.job_type && <span className="capitalize">{job.job_type}</span>}
          {job.posted_date && (
            <span className="flex items-center gap-1"><Clock size={11} />{job.posted_date}</span>
          )}
        </div>

        {/* Match */}
        <div className="mb-3">
          <MatchScore score={job.match_score} />
          {job.skills_matched?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.skills_matched.slice(0, 5).map(s => (
                <span key={s} className="badge bg-gray-800 text-gray-400">{s}</span>
              ))}
              {job.skills_matched.length > 5 && (
                <span className="badge bg-gray-800 text-gray-500">+{job.skills_matched.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Description preview */}
        {job.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{job.description}</p>
        )}

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <ExternalLink size={13} /> View
          </a>
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={clsx(
              'text-xs py-1.5 px-3 rounded-lg font-medium flex items-center gap-1.5 transition-colors ml-auto',
              applied
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40 cursor-default'
                : 'btn-primary py-1.5 px-3'
            )}
          >
            {applied ? (
              <><CheckCircle size={13} /> Applied</>
            ) : applying ? (
              <><span className="animate-spin inline-block w-3 h-3 border border-white/40 border-t-white rounded-full" /> Applying…</>
            ) : (
              <><Send size={13} /> Apply</>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
