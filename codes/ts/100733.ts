/*
    Doubly Linked List
    
    A doubly linked list is a data structure that consists of a sequence of elements, each of which contains a reference (or pointer) to the next element in the sequence and a reference to the previous element of the sequence.

    In Real Life
        1. Text Editors: Text editors may use a doubly linked list to represent the text in a document. Each element in the list represents a character or a line of text and contains references to both the previous and next characters or lines.
        2. Image Viewer: An image viewer application may use a doubly linked list to represent a collection of images. Each element in the list represents an image and contains references to both the previous and next images in the collection.
        3. Train or Bus Schedule: Train or bus schedules can be implemented using a doubly linked list, where each element represents a station or stop and contains references to both the previous and next stations or stops on the route.

    Description and comments created by chatgpt and github copilot
*/

class CDNode{
    private next:CDNode;
    private prev:CDNode;
    private value:number;

    public constructor(value:number){
        this.value = value
    }

    public setNext(next_node:CDNode){
        this.next = next_node;
    }

    public getNext(): CDNode
    {
        return this.next;
    }

    public setPrev(prev_node:CDNode){
        this.prev = prev_node;
    }

    public getPrev(): CDNode
    {
        return this.prev;
    }

    public getValue(): number
    {
        return this.value;
    }

}

let d_node = new CDNode(5);
let d_node2 = new CDNode(10);
let d_node3 = new CDNode(15);
d_node.setNext(d_node2); // node.value = 5 node.next = 10
d_node2.setNext(d_node3); // node2.value = 10 node2.next = 15
d_node2.setPrev(d_node); // node2.prev = 5

console.log(d_node.getNext().getPrev().getValue()); // 5


