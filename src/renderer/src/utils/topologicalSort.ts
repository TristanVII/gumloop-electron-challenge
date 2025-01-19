import { AppNode } from "../nodes/types";

// TODO: Currently theres a bug where you can create a cycle, and this will output empty array
export const getExecutionOrder = (nodes: AppNode[]) => {
  // Create maps for quick lookups
  const nodeMap = new Map<string, AppNode>();
  const childrenMap = new Map<string, AppNode[]>();

  // Initialize maps
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  });

  // Build parent-child relationships
  nodes.forEach((node) => {
    if (node.data.parent) {
      const parentChildren = childrenMap.get(node.data.parent) || [];
      parentChildren.push(node);
      childrenMap.set(node.data.parent, parentChildren);
    }
  });

  const rootNodes = nodes.filter((node) => !node.data.parent);

  const executionOrder: AppNode[] = [];
  const visited = new Set<string>();

  const visit = (node: AppNode) => {
    if (visited.has(node.id)) return;

    // Process parent first if it exists and is pending
    if (node.data.parent) {
      const parent = nodeMap.get(node.data.parent);
      if (parent && parent.data.pending_question) {
        visit(parent);
      }
    }

    // Add current node if it's pending or file write
    // TODO: This is hard coded, here, should just check whether is "pending" now
    // Would add OOP to make this alot better but have no time atm
    if (node.data.pending_question || (node.type as any) === 'filewriter-node') {
      visited.add(node.id);
      executionOrder.push(node);
    }

    // Process children
    const children = childrenMap.get(node.id) || [];
    children.forEach((child) => visit(child));
  };

  // Start with root nodes
  rootNodes.forEach((root) => visit(root));

  return executionOrder;
};
