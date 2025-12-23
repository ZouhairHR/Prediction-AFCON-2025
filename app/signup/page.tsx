import Link from 'next/link'
import { signup } from './actions'

export default function SignUpPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error

  return (
    <main style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Sign Up</h1>

      {error ? (
        <p style={{ color: 'crimson' }}>
          {error === 'missing' ? 'Please fill all fields.' : decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={signup}>
        <div style={{ marginBottom: 12 }}>
          <label>Full Name</label>
          <input name="full_name" required style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input name="username" required style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input name="password" type="password" required style={{ width: '100%' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: 10 }}>
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </main>
  )
}
