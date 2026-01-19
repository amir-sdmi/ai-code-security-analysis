/*
    Adjacency List

    An adjacency list is a collection of unordered lists used to represent a finite graph. Each list describes the set of neighbors of a vertex in the graph.

    In Real Life:
        1. Social Networks: An adjacency list can be used to represent a social network. Each node in the graph represents a person, and each edge represents a connection between two people.
        2. Computer Networks: An adjacency list can be used to represent a computer network. Each node in the graph represents a computer, and each edge represents a connection between two computers.
        3. Image Processing: An adjacency list can be used to represent an image. Each node in the graph represents a pixel, and each edge represents a connection between two pixels.

    Description and comments created by chatgpt and github copilot
 */

class AdjacencyList{
    private list: Array<Array<number>>;

    constructor(){
        this.list = [];
    }

    public addEdge(from: number, to: number){
        if(this.list[from] === undefined){
            this.list[from] = [];
        }
        this.list[from].push(to);
    }


    public print(){
        for(let i = 0; i < this.list.length; i++){
            console.log(i + " -> " + this.list[i]);
        }
    }
}

let myAdjacencyList = new AdjacencyList();
myAdjacencyList.addEdge(0, 1);
myAdjacencyList.addEdge(0, 2);
myAdjacencyList.addEdge(1, 2);
myAdjacencyList.addEdge(2, 0);
myAdjacencyList.addEdge(2, 3);
myAdjacencyList.print();
// 0 -> 1,2
// 1 -> 2
// 2 -> 0,3