export default function EndpointToggle({ mode, disabled, onChange }) {
  const isLocal = mode === 'local'
  return (
    <div className="endpoint-toggle" role="group" aria-label="Source du serveur d'inference">
      <button
        type="button"
        className={`endpoint-option ${!isLocal ? 'active' : ''}`}
        disabled={disabled}
        onClick={() => onChange('infra')}
        title="Utiliser le serveur configure dans .env"
      >
        INFRA
      </button>
      <button
        type="button"
        className={`endpoint-option ${isLocal ? 'active' : ''}`}
        disabled={disabled}
        onClick={() => onChange('local')}
        title="Utiliser Ollama local sur localhost:11434"
      >
        Local
      </button>
    </div>
  )
}
