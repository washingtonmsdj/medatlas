import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export interface GlobalSearchAction {
  id: string
  label: string
  description: string
  group: 'Ação' | 'Módulo' | 'Paciente' | 'Cenário'
  keywords?: string
  onSelect: () => void
}

interface Props {
  actions: GlobalSearchAction[]
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function EnterIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 4v8H7" />
      <path d="m11 8-4 4 4 4" />
    </svg>
  )
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function GlobalCommandSearch({ actions }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  const results = useMemo(() => {
    const term = normalize(query)

    if (!term) {
      return actions.filter((action) => action.group === 'Ação').slice(0, 5)
    }

    return actions
      .map((action) => {
        const haystack = normalize(
          [
            action.label,
            action.description,
            action.group,
            action.keywords ?? '',
          ].join(' '),
        )

        let score = 0

        if (normalize(action.label).startsWith(term)) score += 6
        if (normalize(action.label).includes(term)) score += 4
        if (haystack.includes(term)) score += 2

        return { action, score }
      })
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.action.label.localeCompare(b.action.label, 'pt-BR'),
      )
      .slice(0, 8)
      .map((entry) => entry.action)
  }, [actions, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const select = (action: GlobalSearchAction) => {
    action.onSelect()
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
      return
    }

    if (!open || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % results.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(
        (current) => (current - 1 + results.length) % results.length,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      select(results[activeIndex] ?? results[0])
    }
  }

  return (
    <div
      className="global-search global-command-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
        }
      }}
    >
      <span aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Buscar paciente, relatório, anatomia ou módulo"
        aria-expanded={open}
        aria-controls="medatlas-global-search-options"
        aria-autocomplete="list"
        aria-activedescendant={
          open && results[activeIndex]
            ? 'global-command-option-' + results[activeIndex].id
            : undefined
        }
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        placeholder="Buscar pacientes, exames, estruturas anatômicas..."
      />
      <kbd aria-hidden="true">⌘ K</kbd>

      {open && (
        <div className="global-command-results">
          <div className="global-command-results-heading">
            <span>{query.trim() ? 'Resultados' : 'Ações rápidas'}</span>
            <small>{results.length}</small>
          </div>

          <div
            className="global-command-options"
            id="medatlas-global-search-options"
            role="listbox"
            aria-label="Resultados da busca global"
          >
            {results.length > 0 ? (
              results.map((action, index) => (
                <button
                  key={action.id}
                  id={'global-command-option-' + action.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'active' : ''}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(action)}
                >
                  <span className="global-command-group">
                    {action.group}
                  </span>
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <b aria-hidden="true">
                    <EnterIcon />
                  </b>
                </button>
              ))
            ) : (
              <p className="global-command-empty">
                Nenhum resultado encontrado.
              </p>
            )}
          </div>

          <footer>
            <span>↑↓ navegar</span>
            <span>Enter abrir</span>
            <span>Esc fechar</span>
          </footer>
        </div>
      )}
    </div>
  )
}
