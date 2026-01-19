/*
    Binary Tree

    A tree whose elements have at most 2 children is called a binary tree. Since each element in a binary tree can have only 2 children, we typically name them the left and right child.

    In Real Life
        1. File System: We can represent a file system as a tree. The folders represent the nodes and the files are the leaves.
        2. Organization Structure: We can represent the structure of an organization as a tree. The CEO is the root. The managers are the internal nodes and the employees are the leaves.
        3. Computer Memory: We can represent the computer's memory as a tree. The root represents the memory used by the operating system. The internal nodes represent the memory used by the kernel and the leaves represent the memory used by the processes.
        
    Description and comments created by chatgpt and github copilot
*/

class TNode {
    public value: number;
    public left: TNode;
    public right: TNode;

    public constructor(data:number) {
        this.value = data
    }
}

function inorder(node:TNode) {
    if(node){
        inorder(node.left);
        console.log(node.value);
        inorder(node.right);
    }
}

function preorder(node:TNode) {
    if(node){
        console.log(node.value);
        preorder(node.left);
        preorder(node.right);
    }
}

function postorder(node:TNode) {
    if(node){
        postorder(node.left);
        postorder(node.right);
        console.log(node.value);
    }
}

let t_node = new TNode(5);
let t_node2 = new TNode(10);
let t_node3 = new TNode(15);
let t_node4 = new TNode(20);
let t_node5 = new TNode(25);

t_node.right = t_node3; // t_node.value = 5 t_node.right = 15
t_node.left = t_node2; // t_node.value = 5 t_node.left = 10
t_node.left.left = t_node4; // t_node.value = 5 t_node.left = 10 t_node.left.left = 20
t_node.left.right = t_node5; // t_node.value = 5 t_node.left = 10 t_node.left.right = 25

console.log("in order");
inorder(t_node); // 20 10 25 5 15
console.log("pre order");
preorder(t_node); // 5 10 20 25 15
console.log("post order");
postorder(t_node); // 20 25 10 15 5


