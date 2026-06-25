import { CheckCircle, X, ExternalLink, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  applicationId: number
  jobTitle: string
  company: string
  source: string
  applyUrl?: string
  appliedAt: string
  onClose: () => void
}

export default function ApplicationReceipt({ applicationId, jobTitle, company, source, applyUrl, appliedAt, onClose }: Props) {
  const navigate = useNavigate()
  const refNo = `APP-${String(applicationId).padStart(5, '0')}`
  const ts = new Date(appliedAt).toLocaleString('en-AE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-emerald-700/40 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-center text-white font-bold text-lg mb-1">Application Submitted</h2>
        <p className="text-center text-gray-500 text-xs mb-5">Your application has been recorded successfully</p>

        {/* Receipt body */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 divide-y divide-gray-700/50 text-sm mb-5">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Reference</span>
            <span className="text-emerald-400 font-mono font-semibold">{refNo}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Job</span>
            <span className="text-white text-right max-w-[55%] truncate">{jobTitle}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Company</span>
            <span className="text-white">{company || '—'}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Board</span>
            <span className="text-white capitalize">{source}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Submitted</span>
            <span className="text-white text-right text-xs">{ts}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-gray-500">Status</span>
            <span className="text-emerald-400 font-medium">Applied ✓</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-3 flex-1 justify-center"
            >
              <ExternalLink size={13} /> Open Job
            </a>
          )}
          <button
            onClick={() => { onClose(); navigate('/applied') }}
            className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
          >
            <ClipboardList size={13} /> View Applications
          </button>
        </div>
      </div>
    </div>
  )
}
