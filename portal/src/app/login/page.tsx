import { login } from './actions'

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', padding: '2rem', border: '1px solid #eaeaea', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>Log In to NEXTPHD</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="email">Email:</label>
          <input id="email" name="email" type="email" required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="password">Password:</label>
          <input id="password" name="password" type="password" required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <button formAction={login} style={{ marginTop: '1rem', padding: '0.75rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Log In</button>
      </form>
    </div>
  )
}
