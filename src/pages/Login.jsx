import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase'

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/user-not-found': 'Akun dengan email ini belum terdaftar.',
  'auth/wrong-password': 'Password salah.',
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Coba masuk.',
  'auth/weak-password': 'Password minimal 6 karakter.',
}

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() })
        }
      }
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Terjadi kesalahan, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">Buku<span>.</span></div>
        <p className="tagline">Catatan keuangan harian kamu.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Nama</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting
              ? 'Memproses…'
              : mode === 'signin' ? 'Masuk' : 'Buat akun'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <>Belum punya akun?{' '}
              <button onClick={() => { setMode('signup'); setError('') }}>Daftar</button>
            </>
          ) : (
            <>Sudah punya akun?{' '}
              <button onClick={() => { setMode('signin'); setError('') }}>Masuk</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
