import { useEffect, useRef, useState } from 'react'
import { IconChip, IconChevron, IconCheck } from './icons.jsx'

// Dropdown de selection du modele (remplace le <select> natif).
export default function ModelPicker({ models, model, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isAbsent = (m) => models.length > 0 && !models.includes(m)
  const list = isAbsent(model) ? [model, ...models] : models.length ? models : [model]
  const shortName = model.length > 22 ? `${model.slice(0, 21)}…` : model

  return (
    <div className="model-picker" ref={ref}>
      <button type="button" className="model-trigger" onClick={() => setOpen((v) => !v)} title="Choisir le modele">
        <IconChip className="model-chip" />
        <span className="model-name">{shortName}</span>
        <IconChevron className={`model-caret ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="model-menu" role="listbox">
          <div className="model-menu-label">Modele d'inference</div>
          {list.map((m) => (
            <button
              key={m}
              type="button"
              role="option"
              aria-selected={m === model}
              className={`model-option ${m === model ? 'selected' : ''}`}
              onClick={() => {
                onChange(m)
                setOpen(false)
              }}
            >
              <IconChip className="model-opt-chip" />
              <span className="model-opt-name">
                {m}
                {isAbsent(m) && <span className="model-tag">absent</span>}
              </span>
              {m === model && <IconCheck className="model-opt-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
