import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="login-wrap">
      <form className="card login-card stack" action={login}>
        <div>
          <h1>
            NEXT<span style={{ color: 'var(--accent)' }}>PHD</span>
          </h1>
          <p className="muted small">Sign in to your PhD intelligence portal.</p>
        </div>
        {error && (
          <div className="notice notice-bad" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary">
          Log in
        </button>
      </form>
    </div>
  )
}
