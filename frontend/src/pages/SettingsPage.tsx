import { useState } from 'react'
import { Settings, Mail, Linkedin, Save } from 'lucide-react'

export default function SettingsPage() {
  const [smtp, setSmtp] = useState({ host: 'smtp.gmail.com', port: 465, user: '', pass: '' })
  const [linkedin, setLinkedin] = useState({ email: '', password: '' })
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem('smtp', JSON.stringify(smtp))
    localStorage.setItem('linkedin', JSON.stringify(linkedin))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} /> Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Configure email and LinkedIn auto-apply credentials</p>
      </div>

      {/* Email / SMTP */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Mail size={16} className="text-amber-400" /> Email Application (SMTP)
        </h2>
        <p className="text-xs text-gray-500">
          Used to send email applications to companies that list an email address in the job posting.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">SMTP Host</label>
            <input className="input text-sm" value={smtp.host} onChange={e => setSmtp(s => ({...s, host: e.target.value}))} placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Port</label>
            <input className="input text-sm" type="number" value={smtp.port} onChange={e => setSmtp(s => ({...s, port: +e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email Address</label>
            <input className="input text-sm" type="email" value={smtp.user} onChange={e => setSmtp(s => ({...s, user: e.target.value}))} placeholder="you@gmail.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">App Password</label>
            <input className="input text-sm" type="password" value={smtp.pass} onChange={e => setSmtp(s => ({...s, pass: e.target.value}))} placeholder="Gmail app password" />
          </div>
        </div>
        <p className="text-xs text-gray-600">For Gmail: enable 2FA → create an App Password in Google Account settings.</p>
      </div>

      {/* LinkedIn */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Linkedin size={16} className="text-blue-400" /> LinkedIn Easy Apply (Automation)
        </h2>
        <p className="text-xs text-gray-500">
          Store credentials for LinkedIn Easy Apply automation via Playwright. Credentials stay local — never sent to any server.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">LinkedIn Email</label>
            <input className="input text-sm" type="email" value={linkedin.email} onChange={e => setLinkedin(l => ({...l, email: e.target.value}))} placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">LinkedIn Password</label>
            <input className="input text-sm" type="password" value={linkedin.password} onChange={e => setLinkedin(l => ({...l, password: e.target.value}))} placeholder="••••••••" />
          </div>
        </div>
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-3 text-xs text-amber-400">
          ⚠️ LinkedIn may flag automated activity. Use a secondary account or enable human-in-the-loop review before submitting.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-primary">
          <Save size={15} /> Save Settings
        </button>
        {saved && <span className="text-emerald-400 text-sm">✓ Saved locally</span>}
      </div>

      {/* Info */}
      <div className="card border-gray-800">
        <h2 className="font-semibold text-white mb-3">Supported Job Boards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { name: 'LinkedIn Jobs', url: 'linkedin.com', note: 'Easy Apply + scraping' },
            { name: 'Indeed UAE', url: 'ae.indeed.com', note: 'RSS + scraping' },
            { name: 'Bayt.com', url: 'bayt.com', note: 'Middle East\'s #1 job site' },
            { name: 'Naukrigulf', url: 'naukrigulf.com', note: 'Large UAE expat portal' },
            { name: 'GulfTalent', url: 'gulftalent.com', note: 'Premium Gulf jobs' },
          ].map(b => (
            <div key={b.name} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-gray-200 font-medium">{b.name}</p>
                <p className="text-xs text-gray-500">{b.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
