import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActiveResume, listResumes, uploadResume, deleteResume } from '../services/api'
import { Upload, FileText, Trash2, CheckCircle, User, Mail, Phone, Briefcase, GraduationCap, Languages } from 'lucide-react'
import clsx from 'clsx'

export default function ResumePage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { data: active } = useQuery({
    queryKey: ['activeResume'],
    queryFn: () => getActiveResume().then(r => r.data),
    retry: false,
  })
  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => listResumes().then(r => r.data),
  })

  const upload = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeResume'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
      setUploadError('')
    },
    onError: (e: any) => setUploadError(e?.response?.data?.detail || 'Upload failed'),
  })

  const del = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activeResume'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
  })

  const handleFile = (file: File) => {
    setUploadError('')
    upload.mutate(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume</h1>
        <p className="text-gray-400 text-sm mt-1">Upload your resume — it'll be parsed and used to match jobs</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          dragging ? 'border-emerald-500 bg-emerald-950/20' : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        {upload.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <p className="text-gray-400">Parsing resume…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={32} className="text-gray-500" />
            <p className="text-gray-300 font-medium">Drop your resume here or click to browse</p>
            <p className="text-xs text-gray-500">Supports PDF, DOCX, DOC, TXT</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{uploadError}</div>
      )}

      {/* Active resume parsed view */}
      {active && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" /> Active Resume
            </h2>
            <span className="text-xs text-gray-500">{active.filename}</span>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: User, label: 'Name', value: active.name },
              { icon: Mail, label: 'Email', value: active.email },
              { icon: Phone, label: 'Phone', value: active.phone },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Icon size={11} /> {label}</p>
                <p className="text-sm text-gray-200 truncate">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {active.summary && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{active.summary}</p>
            </div>
          )}

          {/* Skills */}
          {active.skills?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <Briefcase size={11} /> Skills ({active.skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {active.skills.map(s => (
                  <span key={s} className="badge bg-emerald-900/30 text-emerald-300 border border-emerald-700/30 capitalize">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {active.experience?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <Briefcase size={11} /> Experience
              </p>
              <div className="space-y-2">
                {active.experience.slice(0, 4).map((exp, i) => (
                  <div key={i} className="bg-gray-800/40 rounded-lg p-3">
                    <p className="text-sm font-medium text-white">{exp.title}</p>
                    <p className="text-xs text-gray-400">{exp.company}{exp.dates ? ` · ${exp.dates}` : ''}</p>
                    {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {active.education?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <GraduationCap size={11} /> Education
              </p>
              {active.education.map((edu, i) => (
                <p key={i} className="text-sm text-gray-300">{edu.text}</p>
              ))}
            </div>
          )}

          {/* Languages */}
          {active.languages?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <Languages size={11} /> Languages
              </p>
              <div className="flex flex-wrap gap-1.5">
                {active.languages.map(l => (
                  <span key={l} className="badge bg-gray-800 text-gray-300">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All resumes history */}
      {resumes && resumes.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <FileText size={16} /> History
          </h2>
          <div className="space-y-2">
            {resumes.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <FileText size={14} className="text-gray-500 shrink-0" />
                <span className="flex-1 text-gray-300 truncate">{r.filename}</span>
                {r.is_active && <span className="badge bg-emerald-900/30 text-emerald-400">Active</span>}
                <button onClick={() => del.mutate(r.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
