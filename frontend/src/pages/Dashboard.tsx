import { useQuery } from '@tanstack/react-query'
import { getJobStats, getApplicationStats, getActiveResume } from '../services/api'
import { Briefcase, TrendingUp, CheckCircle2, Clock, Target, User } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLOR: Record<string, string> = {
  applied:   'bg-blue-500',
  viewed:    'bg-yellow-500',
  interview: 'bg-purple-500',
  offered:   'bg-emerald-500',
  rejected:  'bg-red-500',
}

export default function Dashboard() {
  const { data: jobStats } = useQuery({ queryKey: ['jobStats'], queryFn: () => getJobStats().then(r => r.data) })
  const { data: appStats } = useQuery({ queryKey: ['appStats'], queryFn: () => getApplicationStats().then(r => r.data) })
  const { data: resume } = useQuery({
    queryKey: ['activeResume'],
    queryFn: () => getActiveResume().then(r => r.data),
    retry: false,
  })

  const totalApps = appStats ? Object.values(appStats).reduce((a, b) => a + b, 0) : 0
  const responseRate = totalApps > 0 && appStats
    ? Math.round(((appStats.interview || 0) + (appStats.offered || 0)) / totalApps * 100)
    : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Your UAE job search at a glance</p>
      </div>

      {/* Resume status */}
      {resume ? (
        <div className="card border-emerald-800/40 bg-emerald-950/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-700/30 flex items-center justify-center">
            <User size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">{resume.name || 'Resume loaded'}</p>
            <p className="text-sm text-gray-400">
              {resume.email} · {(resume.skills || []).length} skills · Active resume
            </p>
          </div>
          <span className="ml-auto badge bg-emerald-700/30 text-emerald-400 border border-emerald-700/40">Active</span>
        </div>
      ) : (
        <div className="card border-amber-800/40 bg-amber-950/20">
          <p className="text-amber-400 font-medium">⚠️ No resume uploaded yet — head to <strong>Resume</strong> to get started.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jobs Found', value: jobStats?.total_jobs ?? '—', icon: Briefcase, color: 'text-blue-400' },
          { label: 'High Match (≥70%)', value: jobStats?.high_match ?? '—', icon: Target, color: 'text-emerald-400' },
          { label: 'Applied', value: totalApps, icon: CheckCircle2, color: 'text-violet-400' },
          { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <Icon size={20} className={clsx(color, 'mb-2')} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs by source */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Jobs by Board</h2>
          <div className="space-y-3">
            {jobStats && Object.entries(jobStats.by_source).map(([src, count]) => (
              <div key={src} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 capitalize w-24 shrink-0">{src}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, (count / (jobStats.total_jobs || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 tabular-nums w-6 text-right">{count}</span>
              </div>
            ))}
            {!jobStats?.total_jobs && <p className="text-gray-600 text-sm">No jobs yet — run a search first</p>}
          </div>
        </div>

        {/* Application pipeline */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Application Pipeline</h2>
          <div className="space-y-3">
            {appStats && Object.entries(appStats).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 capitalize w-20 shrink-0">{status}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', STATUS_COLOR[status] || 'bg-gray-500')}
                    style={{ width: `${Math.min(100, totalApps > 0 ? (count / totalApps) * 100 : 0)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 tabular-nums w-6 text-right">{count}</span>
              </div>
            ))}
            {!totalApps && <p className="text-gray-600 text-sm">No applications yet</p>}
          </div>
        </div>
      </div>

      {/* Quick start */}
      {!resume && (
        <div className="card border-gray-700">
          <h2 className="font-semibold text-white mb-3">Quick Start</h2>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Upload your resume (PDF or DOCX) on the <strong className="text-gray-200">Resume</strong> page</li>
            <li>Go to <strong className="text-gray-200">Find Jobs</strong>, enter your desired role, and click <em>Search All Boards</em></li>
            <li>Review matched jobs sorted by your profile fit score</li>
            <li>Click <strong className="text-gray-200">Apply</strong> on individual jobs, or use <strong className="text-gray-200">Bulk Apply</strong></li>
            <li>Track your pipeline on the <strong className="text-gray-200">Applications</strong> page</li>
          </ol>
        </div>
      )}
    </div>
  )
}
