export type MedAtlasViewMode = 'professional' | 'patient'

interface Props {
  mode: MedAtlasViewMode
  onChange: (mode: MedAtlasViewMode) => void
  compact?: boolean
}

export function ViewModeSwitcher({
  mode,
  onChange,
  compact = false,
}: Props) {
  return (
    <div
      className={compact ? 'view-mode-switcher compact' : 'view-mode-switcher'}
      role="group"
      aria-label="Alternar visão do MedAtlas"
    >
      <button
        type="button"
        className={mode === 'professional' ? 'active' : ''}
        aria-pressed={mode === 'professional'}
        onClick={() => onChange('professional')}
      >
        <span aria-hidden="true">✚</span>
        <span>
          <strong>Profissional</strong>
          {!compact && <small>Criar e revisar</small>}
        </span>
      </button>
      <button
        type="button"
        className={mode === 'patient' ? 'active' : ''}
        aria-pressed={mode === 'patient'}
        onClick={() => onChange('patient')}
      >
        <span aria-hidden="true">◉</span>
        <span>
          <strong>Paciente</strong>
          {!compact && <small>Ver experiência</small>}
        </span>
      </button>
    </div>
  )
}
