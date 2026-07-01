const SUGGESTIONS = [
  "Explique l'EBITDA et le resultat net simplement.",
  'Comment valoriser une startup SaaS ?',
  'Construis un plan de tresorerie sur 12 mois.',
  "Quelle allocation d'actifs pour un profil modere ?",
]

export default function EmptyState({ onPick }) {
  return (
    <div className="empty">
      <div className="empty-inner">
        <span className="empty-mark" aria-hidden="true">◆</span>
        <h1 className="empty-title">Comment puis-je vous aider avec vos finances&nbsp;?</h1>
        <p className="empty-sub">
          Marches, comptabilite, valorisation, fiscalite ou strategie d'entreprise&nbsp;— posez votre
          question. Les reponses sont generees par le modele auto-heberge de TechCorp.
        </p>
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion" onClick={() => onPick(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
