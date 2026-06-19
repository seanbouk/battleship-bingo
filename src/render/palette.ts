import { Style, Mode } from '../settings/SettingsContext'

export interface Palette {
  bg: string
  panel: string
  gridLine: string
  gridLineStrong: string
  water: string
  coordText: string
  title: string
  subtitle: string
  hullStroke: string
  hullFill: string
  numberText: string
  /** per-ship accent, keyed by ship id */
  ship: Record<string, string>
}

// Sonar = schematic contact display. Recon = top-down reconnaissance imagery.
// Day/Night are themed per style (chart vs scope; daylight photo vs thermal).
const PALETTES: Record<Style, Record<Mode, Palette>> = {
  sonar: {
    night: {
      bg: '#04130d',
      panel: '#06231a',
      gridLine: '#0c3a2b',
      gridLineStrong: '#155640',
      water: '#05190f',
      coordText: '#3f7f68',
      title: '#7dffb8',
      subtitle: '#3f7f68',
      hullStroke: '#39ff9e',
      hullFill: 'rgba(57,255,158,0.10)',
      numberText: '#d6ffe9',
      ship: {
        frigate: '#39ff9e',
        submarine: '#46e0ff',
        destroyer: '#ffe14d',
        battleship: '#ff8a5c',
        carrier: '#ff5cc8',
      },
    },
    day: {
      bg: '#f5f1e4',
      panel: '#fbf8ef',
      gridLine: '#d8cead',
      gridLineStrong: '#b9a87f',
      water: '#f0ead7',
      coordText: '#7a6a45',
      title: '#1c3f63',
      subtitle: '#6d5d3c',
      hullStroke: '#1c3f63',
      hullFill: 'rgba(28,63,99,0.08)',
      numberText: '#102a43',
      ship: {
        frigate: '#1c6e63',
        submarine: '#1c5fa8',
        destroyer: '#9a6b00',
        battleship: '#a8431c',
        carrier: '#8a1c6e',
      },
    },
  },
  recon: {
    night: {
      bg: '#080b18',
      panel: '#0e1430',
      gridLine: '#1a2348',
      gridLineStrong: '#2b3970',
      water: '#0a0f22',
      coordText: '#5a6aa0',
      title: '#ffd23a',
      subtitle: '#7c8ac0',
      hullStroke: '#ffb74d',
      hullFill: 'rgba(255,120,60,0.22)',
      numberText: '#fff4d6',
      ship: {
        frigate: '#ffd23a',
        submarine: '#ff7a3c',
        destroyer: '#ff5e5e',
        battleship: '#ff9d3c',
        carrier: '#ffec80',
      },
    },
    day: {
      bg: '#dfeaf0',
      panel: '#eef4f7',
      gridLine: '#bcd0da',
      gridLineStrong: '#8fb0bf',
      water: '#9fc4d6',
      coordText: '#3d6577',
      title: '#0d3a4f',
      subtitle: '#3d6577',
      hullStroke: '#2a3b47',
      hullFill: 'rgba(70,90,104,0.85)',
      numberText: '#f4fbff',
      ship: {
        frigate: '#566978',
        submarine: '#4a6076',
        destroyer: '#5a4a4a',
        battleship: '#3f5260',
        carrier: '#2f4250',
      },
    },
  },
}

export function getPalette(style: Style, mode: Mode): Palette {
  return PALETTES[style][mode]
}
