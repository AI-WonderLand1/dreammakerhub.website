'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

const POSITIONS = [
  '3D Artist',
  'Game Developer',
  'Full Stack Engineer',
  'UI/UX Designer',
  'DevOps Engineer',
  'Community Manager',
  'AI/ML Engineer',
  'Other',
]

export default function CareersPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.careers.apply({ name, email, position, portfolioUrl: portfolioUrl || undefined, message: message || undefined })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <a href="/" className="text-[var(--accent)] hover:underline text-sm">&larr; Home</a>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {submitted ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold mb-2">Application Received!</h1>
              <p className="text-sm text-gray-400 mb-6">We&apos;ll review your application and get back to you.</p>
              <a href="/" className="text-sm text-[var(--accent)] hover:underline">Back to Home</a>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold">Join the Team</h1>
                <p className="text-sm text-gray-400 mt-1">We&apos;re looking for talented people to build the future of spatial computing.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-3">{error}</div>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full" placeholder="Jane Doe" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full" placeholder="jane@example.com" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Position *</label>
                  <select value={position} onChange={e => setPosition(e.target.value)} required className="w-full">
                    <option value="">Select a position</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Portfolio / LinkedIn</label>
                  <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} className="w-full" placeholder="https://..." />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Why do you want to join?</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full resize-none" placeholder="Tell us about yourself..." />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded font-medium transition-colors"
                >
                  {busy ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
