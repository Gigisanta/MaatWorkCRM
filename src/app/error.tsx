'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: '1rem', border: '1px solid red', borderRadius: '8px' }}>
      <h2>Error</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Reintentar</button>
    </div>
  )
}
