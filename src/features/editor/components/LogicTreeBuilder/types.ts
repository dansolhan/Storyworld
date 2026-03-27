export type LogicNodeType = 'action' | 'condition' | 'branch_then' | 'branch_else' | 'branch_conditions';

export interface LogicNode {
  id: string; // Unique instance ID
  type: LogicNodeType;
  name: string; // Display name
  blueprintId?: string; // Reference to the actual ActionBlueprint or ConditionalBlueprint
  params?: Record<string, unknown>; // Saved params
  children?: LogicNode[]; // Empty for actions, contains logic for branches
}

export interface DraggedToolboxItem {
  type: LogicNodeType;
  blueprintId: string;
  name: string;
}
