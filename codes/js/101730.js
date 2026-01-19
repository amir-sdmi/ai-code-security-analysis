// 102. Binary Tree Level Order Traversal
// Medium
// Topics
// Companies
// Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).


// Example 1:


// Input: root = [3,9,20,null,null,15,7]
// Output: [[3],[9,20],[15,7]]
// Example 2:

// Input: root = [1]
// Output: [[1]]
// Example 3:

// Input: root = []
// Output: []


// Constraints:

// The number of nodes in the tree is in the range [0, 2000].
// -1000 <= Node.val <= 1000



class TreeNode {
    constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}


const tree = new TreeNode(3)
tree.right = new TreeNode(20);
tree.left = new TreeNode(9);
tree.right.right = new TreeNode(7);
tree.right.left = new TreeNode(15);



// breadth-first Search Traversal
const levelOrder1 = (root) => {
    if (!root) return [];
    const queue = [root];
    const res = [[root.val]];
    let level = 1;
    let count = 1;

    while (queue.length > 0) {
        let node = queue.shift();

        if (node.left) {
            queue.push(node.left);
            if (!res[level]) {
                res.push([node.left.val])
            } else {
                res[level] = [...res[level], node.left.val]
            }
        }

        if (node.right) {
            queue.push(node.right);
            if (!res[level]) {
                res.push([node.right.val])
            } else {
                res[level] = [...res[level], node.right.val]
            }
        }
        if (count <= 1) {
            level++;
            count = queue.length;
        } else {
            count--;
        }
    }
    return res
}


// rebuild while using chatGPT help to simplify the solution

const levelOrder = (root) => {
    if (!root) return [];
    const queue = [root];
    const res = [];

    while (queue.length > 0) {
        // find the size of the level by counting the length of the queue
        const levelSize = queue.length;
        // while on one level make an array of all values
        const levelNodes = [];

        // use a for loop to stay within the size of your level
        for (let i = 0; i < levelSize; i++) {
            // shift off all nodes within the size limit
            let node = queue.shift();
            // push the values of those nodes to the array for the nodes on this level
            levelNodes.push(node.val);

            // if left or right exist push them to the queue
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        // then push all the node values for this level to the result
        res.push(levelNodes);
        // once this loop ends you will have a full queue for the next level to be checked
    }
    return res
}

const emptyTree = new TreeNode(0)

console.log(levelOrder(tree))



/*
let counter = {}
    counter[0] = [root.val]

    return counter */






//     107. Binary Tree Level Order Traversal II
// Medium
// Topics
// Companies
// Given the root of a binary tree, return the bottom-up level order traversal of its nodes' values. (i.e., from left to right, level by level from leaf to root).



// Example 1:


// Input: root = [3,9,20,null,null,15,7]
// Output: [[15,7],[9,20],[3]]
// Example 2:

// Input: root = [1]
// Output: [[1]]
// Example 3:

// Input: root = []
// Output: []


// Constraints:

// The number of nodes in the tree is in the range [0, 2000].
// -1000 <= Node.val <= 1000


const levelOrderBottom = (root) => {
    if (!root) return [];

    const results = [];
    const queue = [root];

    while(queue.length > 0) {
        const levelSize = queue.length;
        const levelNodes = [];

        for (let i = 0; i < levelSize; i++) {
            let node = queue.shift();
            levelNodes.push(node.val);

            node.left ? queue.push(node.left) : '';
            node.right ? queue.push(node.right) : '';
        }
        results.unshift(levelNodes);
    }
    return results;
}

console.log(levelOrderBottom(tree))
