import axios from 'axios'
import type { Resume, Job, Application, SearchResult, Stats } from '../types'

// In dev, Vite proxies /api → localhost:8000. In prod, same origin.
const api = axios.create({ baseURL: '/api' })

// Resume
export const uploadResume = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<{ id: number; message: string; data: Resume }>('/resume/upload', form)
}
export const getActiveResume = () => api.get<Resume>('/resume/active')
export const listResumes = () => api.get<Resume[]>('/resume/list')
export const deleteResume = (id: number) => api.delete(`/resume/${id}`)

// Jobs
export const searchJobs = (keywords: string, sources?: string, maxPerSource?: number) =>
  api.post<SearchResult>(`/jobs/search`, null, {
    params: { keywords, sources, max_per_source: maxPerSource },
  })
export const listJobs = (page = 1, perPage = 20, source?: string, minScore?: number) =>
  api.get<{ total: number; page: number; per_page: number; jobs: Job[] }>('/jobs/list', {
    params: { page, per_page: perPage, source, min_score: minScore },
  })
export const getJob = (id: number) => api.get<Job>(`/jobs/${id}`)
export const deleteJob = (id: number) => api.delete(`/jobs/${id}`)
export const getJobStats = () => api.get<Stats>('/jobs/stats/summary')

// Applications
export const applyToJob = (jobId: number, method = 'manual', coverLetter?: string) =>
  api.post<{ message: string; application_id: number; apply_url: string }>('/applications/apply', {
    job_id: jobId,
    method,
    cover_letter: coverLetter,
  })
export const bulkApply = (jobIds: number[], method = 'manual', minScore?: number) =>
  api.post('/applications/bulk-apply', { job_ids: jobIds, method, min_score: minScore })
export const listApplications = (page = 1, status?: string) =>
  api.get<{ total: number; applications: Application[] }>('/applications/list', {
    params: { page, status },
  })
export const updateApplicationStatus = (id: number, status: string, notes?: string) =>
  api.patch(`/applications/${id}/status`, null, { params: { status, notes } })
export const deleteApplication = (id: number) => api.delete(`/applications/${id}`)
export const getApplicationStats = () =>
  api.get<Record<string, number>>('/applications/stats/summary')

// Journal
export interface JournalEntry {
  id: number
  application_id: number
  entry_type: string
  title: string
  body: string
  created_at: string
}
export const listJournalEntries = (appId: number) =>
  api.get<JournalEntry[]>(`/journal/${appId}`)
export const addJournalEntry = (appId: number, entry_type: string, title: string, body: string) =>
  api.post<JournalEntry>(`/journal/${appId}`, { entry_type, title, body })
export const deleteJournalEntry = (entryId: number) =>
  api.delete(`/journal/entry/${entryId}`)
