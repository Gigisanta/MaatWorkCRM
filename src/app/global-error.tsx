'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Error inesperado</h1>
          <p>Lo sentimos, algo salió mal.</p>
          <button onClick={() => reset()}>Reintentar</button>
        </div>
      </body>
    </html>
  )
}
