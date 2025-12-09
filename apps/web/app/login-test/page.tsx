// Minimal login test page
'use client'

export default function TestLogin() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Login Page</h1>
      <p>This is a test page outside the auth directory.</p>
      <form>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            style={{ display: 'block', marginTop: '0.5rem' }} 
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            style={{ display: 'block', marginTop: '0.5rem' }} 
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Sign In
        </button>
      </form>
    </div>
  )
}
