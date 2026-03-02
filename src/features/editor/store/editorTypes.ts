import type { Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import type { PageNodeType } from '../nodes/PageNode';

export type EditorNode = PageNodeType;

// The combined state of all our domain slices and graph slices.
export interface EditorState {
  // Graph State
  nodes: EditorNode[];
  edges: Edge[];

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

  // React Flow Handlers
  onNodesChange: OnNodesChange<EditorNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  loadStory: (
    nodes: EditorNode[],
    edges: Edge[],
    variables?: Record<string, string>,
    metadata?: { title?: string; description?: string; startPageId?: string }
  ) => void;

  // Variables
  variables: Record<string, string>;
  setVariables: (variables: Record<string, string>) => void;
  addVariable: (key: string, value: string) => void;
  updateVariable: (key: string, newValue: string) => void;
  removeVariable: (key: string) => void;

  // UI Handlers
  selectedPageId: string | null;
  setSelectedPage: (pageId: string | null) => void;

  isEditorSidebarExpanded: boolean;
  setIsEditorSidebarExpanded: (expanded: boolean) => void;

  isStorySettingsOpen: boolean;
  setIsStorySettingsOpen: (isOpen: boolean) => void;

  isVariableManagerOpen: boolean;
  setIsVariableManagerOpen: (isOpen: boolean) => void;

  // State for when user clicks "Connect" on a choice and is waiting to click a target page
  connectingChoice: { sourcePageId: string; choiceId: string } | null;
  setConnectingChoice: (choice: { sourcePageId: string; choiceId: string } | null) => void;

  // State for selecting starting node from the story settings
  isSelectingStartNode: boolean;
  setIsSelectingStartNode: (isSelecting: boolean) => void;

  // Domain Handlers - Page
  addPage: (x: number, y: number) => string;
  updatePageTitle: (pageId: string, newTitle: string) => void;
  updatePageType: (pageId: string, newType: 'location' | 'plot') => void;

  // Domain Handlers - Paragraph
  addParagraph: (pageId: string) => void;
  updateParagraph: (pageId: string, paragraphId: string, newText: string) => void;

  // Domain Handlers - Choice
  addChoice: (pageId: string) => void;
  updateChoiceText: (pageId: string, choiceId: string, newText: string) => void;
  setChoiceDestination: (sourcePageId: string, choiceId: string, targetPageId: string) => void;
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
