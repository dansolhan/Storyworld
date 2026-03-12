import type { Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import type { PageNodeType } from '../nodes/PageNode';
import type { ActionNodeType } from '../nodes/ActionNode';
import type { PortalNodeType } from '../nodes/PortalNode';
import type { Subplot } from '../../../domain/Story/Subplot';
import type { StoryVariable } from '../../../domain/Story/Variable';
import type { Item } from '../../../domain/Item/Item';
import type { AudioItem } from '../../../domain/Story/Audio';
import type { Page } from '../../../domain/Page/Page';
import type { StatusData } from '../../../domain/Story/StatusData';

export type EditorNode = PageNodeType | ActionNodeType | PortalNodeType;

// The combined state of all our domain slices and graph slices.
export interface EditorState {
  // Graph State
  nodes: EditorNode[];
  edges: Edge[];

  // Game Data State
  pages: Record<string, Page>;
  setPages: (pages: Record<string, Page>) => void;

  // System State
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Story Metadata
  storyId: string | null;
  setStoryId: (id: string | null) => void;
  storyTitle: string;
  storyDescription: string;
  startPageId: string | null;
  setStoryTitle: (title: string) => void;
  setStoryDescription: (description: string) => void;
  setStartPageId: (pageId: string | null) => void;

  // Audio
  audio: Record<string, AudioItem>;
  isAudioManagerOpen: boolean;
  setIsAudioManagerOpen: (isOpen: boolean) => void;
  addAudio: (audio: AudioItem) => void;
  updateAudio: (id: string, updates: Partial<AudioItem>) => void;
  deleteAudio: (id: string) => void;


  // Atmospheres
  atmospheres: Record<string, import('../../../domain/Atmosphere/Atmosphere').Atmosphere>;
  setAtmospheres: (atmospheres: Record<string, import('../../../domain/Atmosphere/Atmosphere').Atmosphere>) => void;
  addAtmosphere: (id: string, atmosphere: import('../../../domain/Atmosphere/Atmosphere').Atmosphere) => void;
  updateAtmosphere: (id: string, updates: Partial<import('../../../domain/Atmosphere/Atmosphere').Atmosphere>) => void;
  removeAtmosphere: (id: string) => void;

  // Subplots
  subplots: Subplot[];
  currentPlotId: string | null;
  setCurrentPlotId: (plotId: string | null) => void;
  addSubplot: (name: string, description: string) => string;
  updateSubplot: (id: string, name: string, description: string) => void;
  deleteSubplot: (id: string) => void;

  // React Flow Handlers
  onNodesChange: OnNodesChange<EditorNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  loadStory: (params: {
    nodes: EditorNode[];
    edges: Edge[];
    pages: Record<string, Page>;
    variables?: Record<string, StoryVariable>;
    items?: Record<string, Item>;
    metadata?: { title?: string; description?: string; startPageId?: string };
    subplots?: Subplot[];
    audio?: Record<string, AudioItem>;
    atmospheres?: Record<string, import('../../../domain/Atmosphere/Atmosphere').Atmosphere>;
    statusData?: StatusData[];
  }) => void;

  // Variables
  variables: Record<string, StoryVariable>;
  setVariables: (variables: Record<string, StoryVariable>) => void;
  addVariable: (key: string, variable: StoryVariable) => void;
  updateVariable: (key: string, variable: StoryVariable) => void;
  removeVariable: (key: string) => void;

  // Items
  items: Record<string, Item>;
  setItems: (items: Record<string, Item>) => void;
  addItem: (key: string, item: Item) => void;
  updateItem: (key: string, item: Item) => void;
  removeItem: (key: string) => void;

  // Status Data
  statusData: StatusData[];
  setStatusData: (statusData: StatusData[]) => void;
  addStatusData: (entry: StatusData) => void;
  updateStatusData: (id: string, updates: Partial<StatusData>) => void;
  removeStatusData: (id: string) => void;

  // UI Handlers
  selectedPageId: string | null;
  setSelectedPage: (pageId: string | null) => void;

  sidebarTab: string;
  setSidebarTab: (tab: string) => void;

  isEditorSidebarExpanded: boolean;
  setIsEditorSidebarExpanded: (expanded: boolean) => void;

  pageColorMode: 'type' | 'atmosphere';
  setPageColorMode: (mode: 'type' | 'atmosphere') => void;

  isStorySettingsOpen: boolean;
  setIsStorySettingsOpen: (isOpen: boolean) => void;

  isVariableManagerOpen: boolean;
  setIsVariableManagerOpen: (isOpen: boolean) => void;

  isAtmosphereManagerOpen: boolean;
  setIsAtmosphereManagerOpen: (isOpen: boolean) => void;

  isItemManagerOpen: boolean;
  setIsItemManagerOpen: (isOpen: boolean) => void;

  isStatusDataManagerOpen: boolean;
  setIsStatusDataManagerOpen: (isOpen: boolean) => void;

  // State for when user clicks "Connect" on a choice and is waiting to click a target page
  connectingChoice: { sourcePageId: string; choiceId: string } | null;
  setConnectingChoice: (choice: { sourcePageId: string; choiceId: string } | null) => void;

  // State for selecting starting node from the story settings
  isSelectingStartNode: boolean;
  setIsSelectingStartNode: (isSelecting: boolean) => void;

  // Global drag state to coordinate performance optimizations
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;

  // Domain Handlers - Page
  addPage: (x: number, y: number, atmosphereId?: string) => string;
  updatePageTitle: (pageId: string, newTitle: string) => void;
  updatePageType: (pageId: string, newType: 'location' | 'plot') => void;

  // Domain Handlers - Paragraph
  addParagraph: (pageId: string) => void;
  updateParagraph: (pageId: string, paragraphId: string, newText: string) => void;

  // Domain Handlers - Choice
  addChoice: (pageId: string) => void;
  addActionOnlyChoice: (pageId: string) => void;
  updateChoiceText: (pageId: string, choiceId: string, newText: string) => void;
  setChoiceDestination: (sourcePageId: string, choiceId: string, targetPageId: string | undefined) => void;
  setChoiceActions: (pageId: string, choiceId: string, actions: import('../../../domain/Actions/Action').Action[]) => void;
  createPageFromChoice: (sourcePageId: string, choiceId: string) => void;

  // Domain Handlers - Actions (Unified for Page and Choice)
  addAction: (targetType: 'page' | 'choice', pageId: string, targetId: string, blueprintId: string) => void;
  updateAction: (targetType: 'page' | 'choice', pageId: string, targetId: string, actionId: string, params: Record<string, unknown>) => void;
  removeAction: (targetType: 'page' | 'choice', pageId: string, targetId: string, actionId: string) => void;

  // Domain Handlers - Conditionals (Unified for Choice, Paragraph, Action)
  addConditional: (targetType: 'choice' | 'paragraph' | 'action', pageId: string, targetId: string, blueprintId: string, parentId?: string) => void;
  updateConditional: (targetType: 'choice' | 'paragraph' | 'action', pageId: string, targetId: string, conditionalId: string, params: Record<string, unknown>) => void;
  removeConditional: (targetType: 'choice' | 'paragraph' | 'action', pageId: string, targetId: string, conditionalId: string) => void;
}
