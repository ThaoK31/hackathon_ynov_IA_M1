// Petit jeu d'icones SVG (trait, style feather), taille surchargeable via props.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

export const IconChip = (props) => (
  <svg width="14" height="14" {...base} {...props}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M10 2.5v2M14 2.5v2M10 19.5v2M14 19.5v2M2.5 10h2M2.5 14h2M19.5 10h2M19.5 14h2" />
  </svg>
)

export const IconSearch = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
)

export const IconChevron = (props) => (
  <svg width="13" height="13" {...base} {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconCheck = (props) => (
  <svg width="14" height="14" {...base} {...props}>
    <path d="M5 12l5 5 9-9" />
  </svg>
)

export const IconMinus = (props) => (
  <svg width="14" height="14" {...base} {...props}>
    <path d="M5 12h14" />
  </svg>
)

export const IconPlus = (props) => (
  <svg width="14" height="14" {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconArrowUp = (props) => (
  <svg width="17" height="17" {...base} {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
)

export const IconStop = (props) => (
  <svg width="15" height="15" {...base} fill="currentColor" stroke="none" {...props}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
)

export const IconCopy = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)

export const IconThumbUp = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

export const IconThumbDown = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
)

export const IconRetry = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v5h-5" />
  </svg>
)

export const IconSpeaker = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a9 9 0 0 1 0 14" />
  </svg>
)

export const IconSpeakerOff = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M23 9l-6 6" />
    <path d="M17 9l6 6" />
  </svg>
)

export const IconPaperclip = (props) => (
  <svg width="14" height="14" {...base} {...props}>
    <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" />
  </svg>
)

export const IconEdit = (props) => (
  <svg width="15" height="15" {...base} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)
