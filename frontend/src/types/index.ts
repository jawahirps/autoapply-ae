export interface Resume {
  id: number
  filename: string
  file_path: string
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[]
  experience: { title: string; company: string; dates: string; description: string }[]
  education: { text: string }[]
  languages: string[]
  is_active: boolean
  created_at: string
}

export interface Job {
  id: number
  external_id: string
  source: 'linkedin' | 'indeed' | 'bayt' | 'naukrigulf' | 'gulftalent'
  title: string
  company: string
  location: string
  description: string
  salary: string
  job_type: string
  experience_level: string
  url: string
  apply_url: string
  easy_apply: boolean
  posted_date: string
  match_score: number
  skills_matched: string[]
  is_active: boolean
  created_at: string
}

export interface Application {
  id: number
  job_id: number
  resume_id: number | null
  source: string
  job_title: string
  company: string
  job_url: string
  status: 'applied' | 'viewed' | 'interview' | 'offered' | 'rejected' | 'withdrawn'
  applied_method: string
  cover_letter: string | null
  notes: string | null
  applied_at: string
}

export interface SearchResult {
  total: number
  new: number
  sources: Record<string, number>
  jobs: Job[]
}

export interface Stats {
  total_jobs: number
  total_applied: number
  high_match: number
  by_source: Record<string, number>
}
