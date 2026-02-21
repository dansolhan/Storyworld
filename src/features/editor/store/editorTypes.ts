import type { Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import type { PageNodeType } from '../nodes/PageNode';

export type EditorNode = PageNodeType;

// The combined state of all our domain slices and graph slices.
export interface EditorState {
  // Graph State
  nodes: EditorNode[];
  edges: Edge[];

  // React Flow Handlers
  onNodesChange: OnNodesChange<EditorNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: EditorNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  loadStory: (nodes: EditorNode[], edges: Edge[], variables?: Record<string, string>) => void;

  // Variables
  variables: Record<string, string>;
  setVariables: (variables: Record<string, string>) => void;
  addVariable: (key: string, value: string) => void;
  updateVariable: (key: string, newValue: string) => void;
  removeVariable: (key: string) => void;

  // UI Handlers
  selectedPageId: string | null;
  setSelectedPage: (pageId: string | null) => void;

  // Domain Handlers - Page
  addPage: (x: number, y: number) => string;
  updatePageTitle: (pageId: string, newTitle: string) => void;

  // Domain Handlers - Paragraph
  addParagraph: (pageId: string) => void;
  updateParagraph: (pageId: string, paragraphId: string, newText: string) => void;

  // Domain Handlers - Choice
  addChoice: (pageId: string) => void;
  updateChoiceText: (pageId: string, choiceId: string, newText: string) => void;

  // Domain Handlers - Conditionals (Unified for Choice and Paragraph)
  addConditional: (targetType: 'choice' | 'paragraph', pageId: string, targetId: string, blueprintId: string, parentId?: string) => void;
  updateConditional: (targetType: 'choice' | 'paragraph', pageId: string, targetId: string, conditionalId: string, params: Record<string, unknown>) => void;
  removeConditional: (targetType: 'choice' | 'paragraph', pageId: string, targetId: string, conditionalId: string) => void;
}
