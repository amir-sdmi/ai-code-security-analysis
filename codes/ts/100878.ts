/*
    Adjacency Matrix

    An adjacency matrix is a square matrix used in graph theory to represent connections between nodes in a graph, with 1s indicating the presence of edges and 0s indicating their absence.

    In Real Life:
        1. Social Networks: An adjacency matrix can be used to represent a social network. Each node in the graph represents a person, and each edge represents a connection between two people.
        2. Computer Networks: An adjacency matrix can be used to represent a computer network. Each node in the graph represents a computer, and each edge represents a connection between two computers.
        3. Image Processing: An adjacency matrix can be used to represent an image. Each node in the graph represents a pixel, and each edge represents a connection between two pixels.

    Description and comments created by chatgpt and github copilot
 */

class AdjacencyMatrix{
    private matrix: number[][] = [];

    public constructor(size: number) {
        for(let i = 0; i < size; i++){
            this.matrix.push([]);
            for(let j = 0; j < size; j++){
                this.matrix[i].push(0);
            }
        }
    }

    public addEdge(from: number, to: number): void
    {
        this.matrix[from][to] = 1;
        this.matrix[to][from] = 1;
    }

    public removeEdge(from: number, to: number): void
    {
        this.matrix[from][to] = 0;
        this.matrix[to][from] = 0;
    }

    public print(): void
    {
        console.log(this.matrix);
    }
}

var myMatrix = new AdjacencyMatrix(5);

myMatrix.addEdge(0, 1);
myMatrix.addEdge(0, 2);
myMatrix.addEdge(1, 2);
myMatrix.addEdge(2, 0);
myMatrix.addEdge(2, 3);
myMatrix.print();
// [
//   [0, 1, 1, 0, 0],
//   [1, 0, 1, 0, 0],
//   [1, 1, 0, 1, 0],
//   [0, 0, 1, 0, 0],
//   [0, 0, 0, 0, 0]
// ]

myMatrix.removeEdge(0, 1);
myMatrix.print();
// [
//   [0, 0, 1, 0, 0],
//   [0, 0, 1, 0, 0],
//   [1, 1, 0, 1, 0],
//   [0, 0, 1, 0, 0],
//   [0, 0, 0, 0, 0]
// ]
