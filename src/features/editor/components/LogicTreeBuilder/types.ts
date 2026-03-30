import type { LogicNodeType, LogicNode } from '../../../../domain/Story/LogicNode';

export type { LogicNodeType, LogicNode };

export interface DraggedToolboxItem {
  type: LogicNodeType;
  blueprintId: string;
  name: string;
}
