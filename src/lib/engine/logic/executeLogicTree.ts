import type { LogicNode } from '../../../domain/Story/LogicNode';
import type { EvaluationContext } from '../../../domain/Conditionals/Conditional';
import type { ActionContext } from '../../../domain/Actions/Action';
import { conditionalBlueprints } from '../../../domain/Conditionals/registry';
import { actionBlueprints } from '../../../domain/Actions/registry';

// Evaluates a single condition node, mapping branch_conditions back into the children array blueprint format.
export const evaluateLogicNode = (node: LogicNode, evalContext: EvaluationContext): boolean => {
  if (node.type !== 'condition') return true; // Actions evaluate as true implicitly

  const blueprint = conditionalBlueprints[node.blueprintId || ''];
  if (!blueprint) return true; // Fail open if no blueprint found

  // Map our LogicNode branch_conditions structure into the flat children array legacy blueprints expect.
  const branchConditions = node.children?.find((c: LogicNode) => c.type === 'branch_conditions');
  
  // Create an adapter to mock the Conditional interface for recursive evaluation.
  const childrenAdapter = (branchConditions?.children || []).map((child: LogicNode) => ({
    id: child.id,
    blueprintId: child.blueprintId || '',
    params: child.params || {},
    children: [] // The blueprint recursively calls evaluateNode instead of using this nested directly typically
  }));

  return blueprint.evaluate(
    node.params || {}, 
    evalContext, 
    childrenAdapter as any, 
    (cond: { id: string }) => {
      // Find the actual sub-logic node by ID to evaluate it
      const actualLogicNode = branchConditions?.children?.find((c: LogicNode) => c.id === cond.id);
      if (actualLogicNode) {
        return evaluateLogicNode(actualLogicNode, evalContext);
      }
      return false;
    }
  );
};

// Determines if an explicit onEvaluate event tree returns true (all root conditions must pass).
export const evaluateEventVisibility = (logicTree: LogicNode[], evalContext: EvaluationContext): boolean => {
  if (!logicTree || logicTree.length === 0) return true; // No conditions = visible
  
  // Implicit AND for multiple root condition nodes
  for (const node of logicTree) {
    if (node.type === 'condition') {
      if (!evaluateLogicNode(node, evalContext)) {
        return false;
      }
    }
  }
  return true;
};

// Full sequential executor for onEnter, onExit, onClick type events.
export const executeLogicTree = (
  logicTree: LogicNode[], 
  evalContext: EvaluationContext, 
  actionContext: ActionContext
) => {
  for (const node of logicTree) {
    if (node.type === 'action') {
      const blueprint = actionBlueprints[node.blueprintId || ''];
      if (blueprint) {
        blueprint.execute(node.params || {}, actionContext);
      }
    } else if (node.type === 'condition') {
      // Evaluate the condition
      const result = evaluateLogicNode(node, evalContext);
      
      // Select the correct branch based on result
      const targetBranchType = result ? 'branch_then' : 'branch_else';
      const branch = node.children?.find((c: LogicNode) => c.type === targetBranchType);
      
      // Sequentially execute the contents of that branch
      if (branch && branch.children && branch.children.length > 0) {
        executeLogicTree(branch.children, evalContext, actionContext);
      }
    }
  }
};
