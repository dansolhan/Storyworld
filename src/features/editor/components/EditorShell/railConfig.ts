import {
  Waypoints,
  Settings2,
  Package,
  Variable,
  Music,
  CloudFog,
  Gauge,
  Quote,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import type { EditorWorkspace } from '../../store/editorWorkspace';

/**
 * Which collection a rail item counts. Items without one — the graph, story
 * settings — show no trailing figure.
 */
export type RailCountKey =
  | 'health'
  | 'items'
  | 'variables'
  | 'audio'
  | 'atmospheres'
  | 'statusData'
  | 'context';

export interface RailItem {
  workspace: EditorWorkspace;
  label: string;
  icon: LucideIcon;
  countKey?: RailCountKey;
}

export interface RailSection {
  heading: string;
  items: RailItem[];
}

/**
 * The editor's navigation. Only surfaces that exist are listed — a rail item
 * that cannot be reached reads as a bug rather than as a promise.
 *
 * Still to join STORY once built: Outline and Text search.
 */
export const RAIL_SECTIONS: RailSection[] = [
  {
    heading: 'Story',
    items: [
      { workspace: 'graph', label: 'Graph', icon: Waypoints },
      { workspace: 'settings', label: 'Settings', icon: Settings2 },
      /*
       * The figure counts only what breaks a story. Counting unwritten pages and
       * unused variables too would leave it permanently lit on any draft, and a
       * badge that never reaches zero stops being read.
       */
      { workspace: 'health', label: 'Story health', icon: Stethoscope, countKey: 'health' },
    ],
  },
  {
    heading: 'Data',
    items: [
      { workspace: 'items', label: 'Items', icon: Package, countKey: 'items' },
      { workspace: 'variables', label: 'Variables', icon: Variable, countKey: 'variables' },
      { workspace: 'audio', label: 'Audio', icon: Music, countKey: 'audio' },
      { workspace: 'atmospheres', label: 'Atmospheres', icon: CloudFog, countKey: 'atmospheres' },
      { workspace: 'statusData', label: 'Status data', icon: Gauge, countKey: 'statusData' },
      { workspace: 'context', label: 'Context', icon: Quote, countKey: 'context' },
    ],
  },
];
