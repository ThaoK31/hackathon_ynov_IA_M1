import { useState } from 'react'

export default function SettingsPanel({ settings, models, onSave, onClose }) {
  const [draft, setDraft] = useState(settings)
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Reglages">
        <div className="modal-head">
          <h2>Reglages</h2>
          <button className="icon-btn" onClick={onClose} title="Fermer" aria-label="Fermer">
            ✕
          </button>
        </div>

        <label className="field">
          <span className="field-label">Modele</span>
          {models.length > 0 ? (
            <select value={draft.model} onChange={(e) => set('model', e.target.value)}>
              {!models.includes(draft.model) && <option value={draft.model}>{draft.model} (absent)</option>}
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input value={draft.model} onChange={(e) => set('model', e.target.value)} />
          )}
          <small>Le serveur est configure cote proxy (/api). Le navigateur reste en same-origin, sans CORS.</small>
        </label>

        <label className="field">
          <span className="field-label">
            Temperature <b>{draft.temperature.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={draft.temperature}
            onChange={(e) => set('temperature', parseFloat(e.target.value))}
          />
          <small>Plus bas = plus precis et deterministe (recommande pour la finance).</small>
        </label>

        <label className="field">
          <span className="field-label">Longueur max de reponse (tokens)</span>
          <input
            type="number"
            min="128"
            max="8192"
            step="128"
            value={draft.maxTokens}
            onChange={(e) => set('maxTokens', parseInt(e.target.value, 10) || 1024)}
          />
          <small>Plafond de generation (num_predict). Evite les reponses tronquees.</small>
        </label>

        <label className="field">
          <span className="field-label">Prompt systeme</span>
          <textarea rows={5} value={draft.systemPrompt} onChange={(e) => set('systemPrompt', e.target.value)} />
        </label>

        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={() => onSave(draft)}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
