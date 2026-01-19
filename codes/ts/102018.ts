// 100% coded with ChatGPT including the test cases
type NodeId = number | string;
class TreeNode {
  id: NodeId;
  children: TreeNode[];

  constructor(id: NodeId) {
    this.id = id;
    this.children = [];
  }

  addChild(node: TreeNode): void {
    this.children.push(node);
  }

  bfsOrder(includeLevel = false): NodeId[] | [NodeId, NodeId][] {
    const queue: [TreeNode, number][] = [];
    const result: [NodeId, NodeId][] = [];
  
    queue.push([this, 0]);
  
    while (queue.length > 0) {
      const [node, level] = queue.shift()!;
      result.push([node.id, level]);
  
      for (const child of node.children) {
        queue.push([child, level + 1]);
      }
    }
    if (!includeLevel) return result.map((x) => x[0]);
    return result;
  }
  
  dfsOrder(includeLevel = false): NodeId[] | [NodeId, NodeId][] {
    const result: [NodeId, NodeId][] = [];
  
    const traverse = (node: TreeNode, level: number) => {
      result.push([node.id, level]);
      for (const child of node.children) {
        traverse(child, level + 1);
      }
    };
  
    traverse(this, 0);
  
    if (!includeLevel) return result.map((x) => x[0]);
    return result;
  }    
}

class Tree {
  root: TreeNode | null;
  leafOnlyIds: Set<NodeId>;

  constructor() {
    this.root = null;
    this.leafOnlyIds = new Set();
  }

  setRoot(id: NodeId): TreeNode {
    this.root = new TreeNode(id);
    return this.root;
  }

  addNode(parentId: NodeId, id: NodeId): TreeNode | null {
    if (this.leafOnlyIds.has(parentId)) {
      parentId = this.root?.id || 0;
    }

    if (this.findNode(id) !== null) {
      throw new Error(`Cannot add a node with id: ${id} because it already exists`);
    }

    let parentNode = this.findNode(parentId);
    if (parentNode === null) {
      parentNode = this.root;
    }
    if (!parentNode) return null;

    const newNode = new TreeNode(id);
    parentNode.addChild(newNode);
    return newNode;
  }

  removeNode(id: NodeId): void {
    const node = this.findNode(id);
    const parent = this.findParentNode(id);

    if (node === null || parent === null) {
      return;
    }

    parent.children = parent.children.filter((child) => child.id !== id);
  }

  findNode(id: NodeId, currentNode: TreeNode | null = this.root): TreeNode | null {
    if (currentNode === null) {
      return null;
    }

    if (currentNode.id === id) {
      return currentNode;
    }

    for (const child of currentNode.children) {
      const result = this.findNode(id, child);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  bfsOrder(includeLevel = false): NodeId[] | [NodeId, NodeId][] {
    return this.root ? this.root.bfsOrder(includeLevel) : [];
  }
  
  dfsOrder(includeLevel = false): NodeId[] | [NodeId, NodeId][] {
    return this.root ? this.root.dfsOrder(includeLevel) : [];
  }  

  setLeafs(ids: NodeId[]): void {
    this.leafOnlyIds = new Set(ids);
    this.fixTree(this.root);
  }

  fixTree(node: TreeNode | null): void {
    if (node === null) {
      return;
    }

    if (this.leafOnlyIds.has(node.id)) {
      const parent = this.findParentNode(node.id);
      if (parent) {
        parent.children.push(...node.children);
      }
      node.children = [];
    }

    for (const child of node.children) {
      this.fixTree(child);
    }
  }

  findParentNode(id: NodeId, currentNode: TreeNode | null = this.root): TreeNode | null {
    if (currentNode === null) {
      return null;
    }

    for (const child of currentNode.children) {
      if (child.id === id) {
        return currentNode;
      }

      const result = this.findParentNode(id, child);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  move(nodeId: NodeId, parentId: NodeId, index?: number): void {
    const node = this.findNode(nodeId);
    const oldParentNode = this.findParentNode(nodeId);
    const newParentNode = this.findNode(parentId);

    if (node === null || oldParentNode === null || newParentNode === null) {
      return;
    }

    // Remove the node from its old parent's children
    oldParentNode.children = oldParentNode.children.filter((child) => child.id !== nodeId);

    // Add the node to its new parent's children at the specified index, or as the last child if index is undefined
    if (typeof index === 'number') {
      newParentNode.children.splice(index, 0, node);
    } else {
      newParentNode.children.push(node);
    }
  }

  private static buildTreeNodes(nodeData: any): TreeNode {
    const node = new TreeNode(nodeData.id);
    for (const childData of nodeData.children) {
      const childNode = Tree.buildTreeNodes(childData);
      node.addChild(childNode);
    }
    return node;
  }  

  private static createArrayNode(node: TreeNode): any[] {
    const compactNode = [
      node.id,
      node.children.map((child) => Tree.createArrayNode(child)),
    ];
    return compactNode;
  }

  toArray(nodeOrId?: TreeNode | number): any[] {
    let startNode: TreeNode | null = null;
  
    if (nodeOrId instanceof TreeNode) {
      startNode = nodeOrId;
    } else if (typeof nodeOrId === 'number') {
      startNode = this.findNode(nodeOrId);
    } else {
      startNode = this.root;
    }
  
    if (startNode === null) {
      return [];
    }
  
    const compactTree = Tree.createArrayNode(startNode);
    return compactTree;
  }

  private static buildTreeArrayNodes(nodeData: any): TreeNode {
    const node = new TreeNode(nodeData[0]);
    for (const childData of nodeData[1]) {
      const childNode = Tree.buildTreeArrayNodes(childData);
      node.addChild(childNode);
    }
    return node;
  }

  static fromArray(compactData: any[] | {}): Tree {
    const treeData = compactData;
    const tree = new Tree();
    if (Array.isArray(treeData) && treeData.length === 2) {
      tree.root = Tree.buildTreeArrayNodes(treeData);
    } else {
      tree.root = null;
    }
    return tree;
  }

  private static buildTreeObjNodes(nodeData: any): TreeNode {
    const node = new TreeNode(nodeData.i);
    for (const childData of nodeData.c) {
      const childNode = Tree.buildTreeObjNodes(childData);
      node.addChild(childNode);
    }
    return node;
  }

  private static createObjNode(node: TreeNode): object {
    const compactNode = {
      i: node.id,
      c: node.children.map((child) => Tree.createObjNode(child)),
    };
    return compactNode;
  }

  toObj(): object {
    if (this.root === null) {
      return {};
    }
  
    const compactTree = Tree.createObjNode(this.root);
    return compactTree;
  }

  static fromObj(compactData: object): Tree {
    const treeData = compactData;
    const tree = new Tree();
    if (typeof treeData === 'object' && treeData.hasOwnProperty('i') && treeData.hasOwnProperty('c')) {
      tree.root = Tree.buildTreeObjNodes(treeData);
    } else {
      tree.root = null;
    }
    return tree;
  }

  static fromMap(rootId: NodeId, pairs: [NodeId, NodeId][]): Tree {
    const tree = new Tree();
    tree.setRoot(rootId);

    for (const [ , id] of pairs) tree.addNode(rootId, id);

    for (const [parentId, id] of pairs) tree.move(id, parentId);   
  
    return tree;
  }

}

export { Tree }