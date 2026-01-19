/*
    Linked List

    A linked list is a data structure that consists of a sequence of elements, each of which contains a reference (or pointer) to the next element in the sequence. Unlike arrays, which have a fixed size, linked lists can grow or shrink dynamically as elements are added or removed.

    In Real Life
        1. Music or Video Playlist: A music or video playlist can be implemented using a linked list, where each element represents a song or video and contains a reference to the next element in the playlist.
        2. Address Book: An address book application may use a linked list to store contacts. Each element in the list represents a contact and contains a reference to the next contact in the list.
        3. File System: A file system may use a linked list to represent the blocks of a file. Each element in the list represents a block of the file and contains a reference to the next block.

    Description and comments created by chatgpt and github copilot
*/

class CNode{
    // For circular create a head property then connect to last node to first node
    private next:CNode|null;
    private value:number;

    public constructor(value:number){ 
        this.next = null;
        this.value = value;
    }

    public setNext(next_node:CNode){
        this.next = next_node
    }

    public getValue():number
    {
        return this.value;
    }

    public getNext():CNode|null
    {
        return this.next
    }
}
let node = new CNode(5);
let node2 = new CNode(10);
let node3 = new CNode(15);
let node4 = new CNode(20);
let node5 = new CNode(25);
node.setNext(node2); // node.value = 5 node.next = 10
node2.setNext(node3); // node2.value = 10 node2.next = 15
node3.setNext(node4); // node3.value = 15 node3.next = 20
node4.setNext(node5); // node4.value = 20 node4.next = 25

// Traverse a Linked List
let travel:CNode|null = node; 
while(travel != null){
    console.log(travel.getValue()); // 5 10 15 20 25
    travel = travel.getNext();
}