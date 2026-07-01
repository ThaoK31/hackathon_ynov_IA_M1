export default function StatusBadge({ connection }) {
  const { checking, ok, latencyMs, error } = connection
  const label = checking ? 'Verification…' : ok ? `Connecte${latencyMs != null ? ` · ${latencyMs} ms` : ''}` : 'Deconnecte'
  const state = checking ? 'checking' : ok ? 'online' : 'offline'

  return (
    <div className={`status status-${state}`} title={error || "Serveur d'inference"}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </div>
  )
}
