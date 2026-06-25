import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { searchJobs, listJobs, bulkApply } from '../services/api'
import type { Job } from '../types'
import JobCard from '../components/JobCard'
import { Search, Zap, Filter, ChevronDown, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const SOURCES = ['linkedin', 'indeed', 'bayt', 'naukrigulf', 'gulftalent']

export default function JobsPage() {
  const qc = useQueryClient()
  const [keywords, setKeywords] = useState('')
  const [selectedSources, setSelectedSources] = useState<string[]>(SOURCES)
  const [minScore, setMinScore] = useState(0)
  const [page, setPage] = useState(1)
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [searchResult, setSearchResult] = useState<{total:number; new:number; sources:Record<string,number>} | null>(null)

  const search = useMutation({
    mutationFn: () => searchJobs(keywords, selectedSources.join(','), 25),
    onSuccess: (res) => {
      setSearchResult({ total: res.data.total, new: res.data.new, sources: res.data.sources })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setPage(1)
    },
  })

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', page, minScore],
    queryFn: () => listJobs(page, 20, undefined, minScore || undefined).then(r => r.data),
  })

  const bulk = useMutation({
    mutationFn: () => bulkApply((jobsData?.jobs || []).map(j => j.id), 'manual', minScore || undefined),
    onSuccess: (res) => {
      const applied = res.data.results.filter((r: any) => r.status === 'applied').map((r: any) => r.job_id)
      setAppliedIds(prev => new Set([...prev, ...applied]))
      qc.invalidateQueries({ queryKey: ['appStats'] })
    },
  })

  const toggleSource = (src: string) =>
    setSelectedSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])

  const handleApplied = useCallback((id: number) => {
    setAppliedIds(prev => new Set([...prev, id]))
  }, [])

  const jobs = jobsData?.jobs || []
  const total = jobsData?.total || 0

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Find Jobs</h1>
          <p className="text-gray-400 text-sm mt-1">Search across 5 UAE job boards simultaneously</p>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={() => bulk.mutate()}
            disabled={bulk.isPending}
            className="btn-secondary text-sm shrink-0"
          >
            {bulk.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Bulk Apply All
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="e.g. Software Engineer, Data Analyst, Marketing Manager…"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && keywords && search.mutate()}
          />
        </div>
        <button
          onClick={() => search.mutate()}
          disabled={!keywords || search.isPending}
          className="btn-primary shrink-0"
        >
          {search.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {search.isPending ? 'Searching…' : 'Search All Boards'}
        </button>
        <button onClick={() => setShowFilters(f => !f)} className="btn-secondary shrink-0">
          <Filter size={15} />
          <ChevronDown size={13} className={clsx('transition-transform', showFilters && 'rotate-180')} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Job Boards</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(src => (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={clsx(
                    'badge text-xs py-1 px-3 cursor-pointer border transition-colors capitalize',
                    selectedSources.includes(src)
                      ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40'
                      : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                  )}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Min Match Score: {minScore}%</p>
            <input
              type="range" min={0} max={90} step={10}
              value={minScore}
              onChange={e => { setMinScore(+e.target.value); setPage(1) }}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Search result summary */}
      {searchResult && (
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-4 py-3 text-sm flex flex-wrap gap-4">
          <span className="text-emerald-400 font-medium">Found {searchResult.total} jobs ({searchResult.new} new)</span>
          {Object.entries(searchResult.sources).map(([src, cnt]) => cnt > 0 && (
            <span key={src} className="text-gray-400 capitalize">{src}: {cnt}</span>
          ))}
        </div>
      )}

      {/* Bulk apply feedback */}
      {bulk.isSuccess && (
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-4 py-2 text-sm text-blue-300">
          ✓ Recorded {bulk.data?.data?.applied} applications
        </div>
      )}

      {/* Jobs grid */}
      {search.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 size={32} className="animate-spin" />
          <p>Searching LinkedIn, Indeed, Bayt, Naukrigulf, GulfTalent…</p>
        </div>
      )}

      {loadingJobs && !search.isPending && (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      )}

      {!search.isPending && !loadingJobs && jobs.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>No jobs found yet. Search above to get started.</p>
        </div>
      )}

      {!search.isPending && jobs.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{total} jobs · page {page} of {Math.ceil(total / 20)}</span>
            {minScore > 0 && <span>Filtered: ≥{minScore}% match</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isApplied={appliedIds.has(job.id)}
                onApplied={handleApplied}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1.5 px-4"
              >← Prev</button>
              <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary text-sm py-1.5 px-4"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
