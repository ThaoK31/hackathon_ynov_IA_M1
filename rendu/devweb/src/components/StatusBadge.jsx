export default function StatusBadge({ connection }) {
  const { checking, ok, latencyMs, error, source } = connection
  const suffix = ok && source === 'local' ? ' · local' : ''
  const label = checking
    ? 'Verification…'
    : ok
      ? `Connecte${latencyMs != null ? ` · ${latencyMs} ms` : ''}${suffix}`
      : 'Deconnecte'
  const state = checking ? 'checking' : ok ? 'online' : 'offline'
  const title = source === 'local' ? 'Bascule sur le Ollama local (serveur distant injoignable)' : error || "Serveur d'inference"

  return (
    <div className={`status status-${state}`} title={title}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </div>
  )
}
