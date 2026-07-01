import { useState } from 'react'
import { IconMinus, IconPlus } from './icons.jsx'

const TOKEN_MIN = 128
const TOKEN_MAX = 8192
const TOKEN_STEP = 128
const TOKEN_PRESETS = [512, 1024, 2048, 4096]

const clampTokens = (value) => Math.min(TOKEN_MAX, Math.max(TOKEN_MIN, Math.round(value / TOKEN_STEP) * TOKEN_STEP))
const rangeFill = (value, min, max) => `${((value - min) / (max - min)) * 100}%`

export default function SettingsPanel({ settings, models, onSave, onClose }) {
  const [draft, setDraft] = useState(settings)
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))
  const setTokens = (value) => set('maxTokens', clampTokens(value))

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
          <span className="field-label">URL du serveur</span>
          <input
            type="url"
            value={draft.endpoint}
            placeholder="Vide = serveur du .env, sinon Ollama local"
            onChange={(e) => set('endpoint', e.target.value)}
          />
          <small>Reglable a chaud (sans redemarrer). Si l'URL ne repond pas, bascule automatique sur le Ollama local.</small>
        </label>

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
          <span className="field-head">
            <span className="field-label">Temperature</span>
            <b className="metric-pill">{draft.temperature.toFixed(2)}</b>
          </span>
          <input
            className="range-input"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={draft.temperature}
            style={{ '--range-fill': rangeFill(draft.temperature, 0, 1) }}
            onChange={(e) => set('temperature', parseFloat(e.target.value))}
          />
          <small>Plus bas = plus precis et deterministe (recommande pour la finance).</small>
        </label>

        <div className="field">
          <span className="field-head">
            <span className="field-label">Longueur max de reponse</span>
            <b className="metric-pill">{draft.maxTokens.toLocaleString('fr-FR')} tokens</b>
          </span>
          <div className="token-control">
            <button
              type="button"
              className="step-btn"
              onClick={() => setTokens(draft.maxTokens - TOKEN_STEP)}
              disabled={draft.maxTokens <= TOKEN_MIN}
              title="Reduire"
              aria-label="Reduire la longueur maximale"
            >
              <IconMinus />
            </button>
            <div className="range-wrap">
              <input
                className="range-input"
                type="range"
                min={TOKEN_MIN}
                max={TOKEN_MAX}
                step={TOKEN_STEP}
                value={draft.maxTokens}
                style={{ '--range-fill': rangeFill(draft.maxTokens, TOKEN_MIN, TOKEN_MAX) }}
                onChange={(e) => setTokens(Number(e.target.value))}
                aria-label="Longueur max de reponse en tokens"
              />
              <div className="range-scale">
                <span>{TOKEN_MIN}</span>
                <span>{TOKEN_MAX.toLocaleString('fr-FR')}</span>
              </div>
            </div>
            <button
              type="button"
              className="step-btn"
              onClick={() => setTokens(draft.maxTokens + TOKEN_STEP)}
              disabled={draft.maxTokens >= TOKEN_MAX}
              title="Augmenter"
              aria-label="Augmenter la longueur maximale"
            >
              <IconPlus />
            </button>
          </div>
          <div className="preset-row" aria-label="Presets de longueur">
            {TOKEN_PRESETS.map((value) => (
              <button
                type="button"
                key={value}
                className={`preset-chip ${draft.maxTokens === value ? 'active' : ''}`}
                onClick={() => setTokens(value)}
              >
                {value.toLocaleString('fr-FR')}
              </button>
            ))}
          </div>
          <small>Plafond de generation (num_predict). Evite les reponses tronquees.</small>
        </div>

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
