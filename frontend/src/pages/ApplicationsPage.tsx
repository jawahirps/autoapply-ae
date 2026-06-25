import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listApplications, updateApplicationStatus, deleteApplication,
  listJournalEntries, addJournalEntry, deleteJournalEntry,
} from '../services/api'
import type { Application } from '../types'
import type { JournalEntry } from '../services/api'
import { ExternalLink, Trash2, ChevronDown, Plus, BookOpen, X } from 'lucide-react'
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

const ENTRY_TYPE_STYLES: Record<string, string> = {
  note:        'bg-gray-800 text-gray-300 border-gray-700',
  follow_up:   'bg-amber-900/40 text-amber-300 border-amber-700/40',
  interview:   'bg-purple-900/40 text-purple-300 border-purple-700/40',
  offer:       'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  rejection:   'bg-red-900/40 text-red-300 border-red-700/40',
  call:        'bg-blue-900/40 text-blue-300 border-blue-700/40',
  email:       'bg-teal-900/40 text-teal-300 border-teal-700/40',
}

const ENTRY_TYPES = ['note', 'follow_up', 'interview', 'offer', 'rejection', 'call', 'email']

// ── Journal panel ────────────────────────────────────────────
function JournalPanel({ app }: { app: Application }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', app.id],
    queryFn: () => listJournalEntries(app.id).then(r => r.data),
  })

  const add = useMutation({
    mutationFn: () => addJournalEntry(app.id, type, title, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal', app.id] })
      setTitle(''); setBody(''); setShowForm(false)
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => deleteJournalEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal', app.id] }),
  })

  return (
    <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
      {/* Entries */}
      {isLoading && <p className="text-xs text-gray-600">Loading…</p>}
      {entries.length === 0 && !isLoading && (
        <p className="text-xs text-gray-600 italic">No journal entries yet.</p>
      )}
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="bg-gray-800/50 rounded-lg p-3 group relative">
            <div className="flex items-start gap-2">
              <span className={clsx('badge border text-xs shrink-0 mt-0.5 capitalize', ENTRY_TYPE_STYLES[e.entry_type] || 'bg-gray-800 text-gray-400')}>
                {e.entry_type.replace('_', ' ')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium">{e.title}</p>
                {e.body && <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{e.body}</p>}
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(e.created_at).toLocaleString('en-AE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => del.mutate(e.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add entry form */}
      {showForm ? (
        <div className="bg-gray-800/40 rounded-lg p-3 space-y-2 border border-gray-700">
          <div className="flex flex-wrap gap-1.5">
            {ENTRY_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'badge border text-xs cursor-pointer capitalize transition-colors',
                  type === t ? ENTRY_TYPE_STYLES[t] || 'bg-gray-700 text-gray-200' : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'
                )}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          <input
            className="input text-sm py-1.5"
            placeholder="Title (e.g. HR called, Technical round scheduled)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="input text-sm py-1.5 resize-none"
            rows={2}
            placeholder="Notes (optional)"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => add.mutate()}
              disabled={!title.trim() || add.isPending}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {add.isPending ? 'Saving…' : 'Save Entry'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5 px-3">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
        >
          <Plus size={13} /> Add journal entry
        </button>
      )}
    </div>
  )
}

// ── Application row ──────────────────────────────────────────
function ApplicationRow({ app, onUpdate, onDelete }: {
  app: Application
  onUpdate: (id: number, status: string) => void
  onDelete: (id: number) => void
}) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)

  return (
    <div className="card hover:border-gray-700 transition-colors">
      {/* Header */}
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
            onClick={() => setStatusOpen(o => !o)}
            className={clsx('badge border flex items-center gap-1', STATUS_STYLES[app.status] || 'bg-gray-800 text-gray-400')}
          >
            {app.status}
            <ChevronDown size={11} className={clsx('transition-transform', statusOpen && 'rotate-180')} />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-36 overflow-hidden">
              {STATUSES.slice(1).map(s => (
                <button
                  key={s}
                  onClick={() => { onUpdate(app.id, s); setStatusOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Journal toggle */}
          <button
            onClick={() => setJournalOpen(o => !o)}
            className={clsx('p-1.5 transition-colors', journalOpen ? 'text-emerald-400' : 'text-gray-600 hover:text-gray-300')}
            title="Journal"
          >
            <BookOpen size={14} />
          </button>
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

      {/* Journal panel */}
      {journalOpen && <JournalPanel app={app} />}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
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
        <p className="text-gray-400 text-sm mt-1">{total} total · click <BookOpen size={12} className="inline" /> on any row to open its journal</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize',
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
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
