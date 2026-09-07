import type { AtlasPart } from './types'

export type AtlasSystemId =
  | 'skeletal'
  | 'muscular'
  | 'arterial'
  | 'venous'
  | 'nervous'
  | 'digestive'
  | 'respiratory'
  | 'urinary'
  | 'reproductive'
  | 'lymphatic'
  | 'endocrine'
  | 'integumentary'
  | 'connective'
  | 'sensory'
  | 'cardiac'

export interface AtlasSystem {
  id: AtlasSystemId
  name: string
  color: string
}

export const ATLAS_SYSTEMS: AtlasSystem[] = [
  { id: 'skeletal', name: 'Esqueleto', color: '#e2d9ba' },
  { id: 'muscular', name: 'Músculos', color: '#a85b50' },
  { id: 'cardiac', name: 'Coração', color: '#b96760' },
  { id: 'sensory', name: 'Órgãos sensoriais', color: '#b0c8ce' },
  { id: 'arterial', name: 'Artérias', color: '#c05245' },
  { id: 'venous', name: 'Veias', color: '#527c9f' },
  { id: 'nervous', name: 'Sistema nervoso', color: '#d8b565' },
  { id: 'respiratory', name: 'Respiratório', color: '#b98991' },
  { id: 'digestive', name: 'Digestório', color: '#b8916b' },
  { id: 'urinary', name: 'Urinário', color: '#b47961' },
  { id: 'lymphatic', name: 'Linfático', color: '#879f7c' },
  { id: 'endocrine', name: 'Endócrino', color: '#c5a09a' },
  { id: 'reproductive', name: 'Reprodutor', color: '#bda098' },
  { id: 'integumentary', name: 'Superfície corporal', color: '#ba9b7d' },
  { id: 'connective', name: 'Tecido conjuntivo', color: '#aec3bb' },
]

export const DEFAULT_VISIBLE_SYSTEMS: AtlasSystemId[] = [
  'cardiac',
  'sensory',
  'skeletal',
  'muscular',
  'arterial',
  'venous',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'lymphatic',
  'endocrine',
  'reproductive',
  'connective',
]

export type AtlasView = 'three-quarter' | 'front' | 'side' | 'back'

export interface AtlasExplorerSceneState {
  explode: number
  visible: AtlasSystemId[]
  selected: string[]
  isolate: boolean
  view: AtlasView
  rotate: boolean
  reset: number
  inspectorOpen?: boolean
}

export function isAtlasSystemId(value: string): value is AtlasSystemId {
  return ATLAS_SYSTEMS.some((system) => system.id === value)
}

export function systemColor(part: AtlasPart) {
  return (
    ATLAS_SYSTEMS.find((system) => system.id === part.system)?.color ??
    '#aebbb8'
  )
}
