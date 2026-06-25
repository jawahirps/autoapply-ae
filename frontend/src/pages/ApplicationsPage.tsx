import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listApplications, updateApplicationStatus, deleteApplication } from '../services/api'
import type { Application } from '../types'
import { ExternalLink, Trash2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const STATUSES = ['all', 'applied', 'viewed', 'interview', 'offered', 'rejected', 'withdrawn']

const STATUS_STYLES: Record<string, string> = {
  applied:   'bg-blue-900/40 text-blue-300 border-blue-700/40',
  viewed:    'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  interview: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  offered:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  rejected:  'bg-red-900/40 text-red-300 border-red-700/40',
  withdrawn: 'bg-gray-800 text-gray-400 border-gray-700',
}

function ApplicationRow({ app, onUpdate, onDelete }: {
  app: Application
  onUpdate: (id: number, status: string) => void
  onDelete: (id: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{app.job_title}</p>
          <p className="text-xs text-gray-400">{app.company} · <span className="capitalize">{app.source}</span></p>
          <p className="text-xs text-gray-600 mt-0.5">
            {new Date(app.applied_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{app.applied_method}
          </p>
        </div>

        {/* Status selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className={clsx('badge border flex items-center gap-1', STATUS_STYLES[app.status] || 'bg-gray-800 text-gray-400')}
          >
            {app.status} <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-36 overflow-hidden">
              {STATUSES.slice(1).map(s => (
                <button
                  key={s}
                  onClick={() => { onUpdate(app.id, s); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer"
               className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => onDelete(app.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {app.notes && (
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">{app.notes}</p>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', page, statusFilter],
    queryFn: () => listApplications(page, statusFilter === 'all' ? undefined : statusFilter).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateApplicationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const del = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const apps = data?.applications || []
  const total = data?.total || 0

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="text-gray-400 text-sm mt-1">{total} total applications tracked</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize',
              statusFilter === s
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && apps.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p>No applications {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}.</p>
        </div>
      )}

      <div className="space-y-3">
        {apps.map(app => (
          <ApplicationRow
            key={app.id}
            app={app}
            onUpdate={(id, status) => updateStatus.mutate({ id, status })}
            onDelete={id => del.mutate(id)}
          />
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-4">← Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-secondary text-sm py-1.5 px-4">Next →</button>
        </div>
      )}
    </div>
  )
}
