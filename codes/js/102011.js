class Graph {
    constructor() {
        this.adjacencyList = {}
    }

    // adding a vertex
    // write a method called addVertex
    // which accepts a name of a vertex
    // it should add a key to the
    // adjacency list with the name of the vertex
    // and the value should be an empty array

    addVertex(vertex){
        if (!this.adjacencyList[vertex]){
            this.adjacencyList[vertex] = [];
        }
        return this;
    }

    // adding an edge
    // This function should accept two vertices
    // The function should find in the adjacency
    // list the key of vertex 1 and push vertex 2
    // into the array
    // and the same thing for vertex2
    // Don't worry about handling errors or
    // invalid vertices
    addEdge(vertex1, vertex2){
        this.adjacencyList[vertex1].push(vertex2);
        this.adjacencyList[vertex2].push(vertex1);
        return this;
    }

    // Remove Edge
    // This function should accept two vertices
    // (two keys)
    // Reassign the key of vertex1 to be an array
    // that does not contain vertex1
    // Reassign the key of vertex2 to be an array
    // that does not contain vertex2
    // Don't worry about handling errors or
    // invalid vertices

    removeEdge(vertex1, vertex2){
        this.adjacencyList[vertex1] = this.adjacencyList[vertex1].filter(v => v !== vertex2);
        this.adjacencyList[vertex2] = this.adjacencyList[vertex2].filter(v => v !== vertex1);
        return this;
    }

    // removing a vertex
    // first effort, with no pseudocode
    // removeVertex(vertex){
    //     for (const key in this.adjacencyList){
    //         if (key !== vertex){
    //             this.adjacencyList[key] = this.adjacencyList[key].filter(v => v !== vertex);
    //         }
    //     }
    //     delete this.adjacencyList[vertex];
    // }

    // instructor pseudocode
    // the function should accept a vertex to remove
    // the function should loop as long as there are
    // any other vertices in the adjacency list for that vertex
    // inside the loop, call our remove Edge function with the
    // vertex we are removing and any values in the adjacency
    // list for that vertex
    // [my note: this seems unnecessary, as you are
    // looping over the array for the vertex we are going to remove anyway]
    // delete the key in the adjacency list for that vertex


    removeVertex(vertex){
        for (const key of this.adjacencyList[vertex]){
            this.adjacencyList[key] = this.adjacencyList[key].filter(v => v !== vertex);
        }
        delete this.adjacencyList[vertex];
    }

    // note that the instructor takes a different approach
    // he loops while there is anything left in the vertex's
    // adjacency list, he pops the last one off the list,
    // and uses removeEdge to remove that edge
    // the problem here is that he unnecessarily loops over
    // the vertex's adjacency list when he literally just
    // popped the item off

    // DFS recursive
    // DFS(vertex):
    //      if vertex is empty
    //          return (this is base case)
    // add vertex to results list
    // mark vertex as visited
    // for each neighbor in vertex
    //      if neighbor is not visited
    //          recursively call DFS on neighbor

    // More detailed pseudocode
    // The function should accept a starting node
    // Create a list to store the end result, to be returned
    // Create an object to store the visited vertices
    // Create a helper function which accepts a vertex
    //      --The helper function should return early
    //      if the vertex is empty
    //      --The helper function should place the vertex
    //      it accepts into the visited object and push
    //      that vertex into the results array
    //      --Loop over all the values in the adjacency list
    //      for that vertex
    //      -- if any of those values have not been visited
    //      recursively call the helper function with that vertex
    // Invoke the helper function with the starting vertex
    // Return the results array

    // My first attempt -- complicated because
    // the instructor never explained that you don't use a base
    // case in this recursion
    // instead we use a version of passing a smaller subset
    // called **immutable access** -- recursively working through
    // an index or iterator while leaving the data unchanged
    // so I originally popped, then shifted the adjacency list entries
    // but this meant when we went back, the list was modified
    // and it didn't cover the necessary vertices, as they were
    // no longer listed
    // DFSRecursive(start){
    //     const visited = {};
    //     const results = [];
    //     const vertexChecker = this.adjacencyList;
    //     function DFS(startVertex){
    //         if (vertexChecker[startVertex].length === 0) return false;
    //         visited[startVertex] = true;
    //         results.push(startVertex);
    //         for (let i = 0; i < vertexChecker[startVertex].length; i++){
    //             const checking = vertexChecker[startVertex][i];
    //             if (!visited[checking]) DFS(checking);
    //         }
    //     }
    //     DFS(start);
    //     return results;
    // }

    // instructor's solution
    // depthFirstRecursive(start){
    //      const result = [];
    //      const visited = {};
    //      const adjacencyList = this.adjacencyList;
    //      (function dfs(vertex){
    //          if (!vertex) return null;
    //          visited[vertex] = true;
    //          result.push(vertex);
    //          adjacencyList[vertex].forEach(neighbor => {
    //              if (!visited[neighbor]) return dfs(neighbor);
    //          })(start);
    //        return result;

    // observations: using the IIFE is gross
    //              the helper function doesn't return anything
    //              so doing "return dfs(neighbor)" is meaningless

    // After reading the student comments on this, I realize
    // that the instructor Colt Steele actually made a mistake
    // that check is NOT the base case for the
    // recursion. The recursion runs out after all the nodes are checked
    // That check for if there is a vertex is merely to catch
    // the possibility of a bad vertex being passed in:
    // it's an error handling and not part of the recursion

    // DFSRecursive(start){
    //     const visited = {};
    //     const results = [];
    //     const vertexChecker = this.adjacencyList;
    //     function DFS(startVertex){
    //         // this is just error handling, not a base case:
    //         if (!startVertex) return false;
    //         visited[startVertex] = true;
    //         results.push(startVertex);
    //         for (let i = 0; i < vertexChecker[startVertex].length; i++){
    //             const checking = vertexChecker[startVertex][i];
    //             if (!visited[checking]) DFS(checking);
    //         }
    //     }
    //     DFS(start);
    //     return results;
    // }

    // One further step suggested by chatGPT:
    DFSRecursive(start){
        const visited = {};
        const results = [];
        const vertexChecker = this.adjacencyList;
        function DFS(startVertex){
            // this is just error handling, not a base case:
            if (!startVertex) return false;
            visited[startVertex] = true;
            results.push(startVertex);
            for (const neighbor of vertexChecker[startVertex]) {
                if (!visited[neighbor]) DFS(neighbor);
            }
        }
        DFS(start);
        return results;
    }

    // DFS Iterative pseudocode
    // DFSI(start):
    // let S be a stack
    // S.push(start)
    // while S is not empty
    //  vertex = S.pop()
    //  if vertex is not labeled as discovered:
    //      visit vertex (add to result list)
    //      label vertex as discovered
    //      for each of vertex's neighbors, N
    //          do S.push(N)

}

const g = new Graph();
// console.log(g.addVertex("Tokyo"));
// console.log(g.addVertex("Hong Kong"));
// console.log(g.addVertex("Bangkok"));
// g.addEdge("Tokyo", "Hong Kong");
// g.addEdge("Bangkok", "Hong Kong");
// console.log(g);
// g.removeEdge("Hong Kong", "Bangkok");
// console.log(g);
// g.removeVertex("Hong Kong");
// console.log(g);

g.addVertex("A");
g.addVertex("B");
g.addVertex("C");
g.addVertex("D");
g.addVertex("E");
g.addVertex("F");

g.addEdge("A", "B");
g.addEdge("A", "C");
g.addEdge("B", "D");
g.addEdge("C", "E");
g.addEdge("D", "E");
g.addEdge("D", "F");
g.addEdge("E", "F");

// console.log(g.DFSRecursive());

const graph = new Graph();

graph.addVertex('S');
graph.addVertex('P');
graph.addVertex('U');
graph.addVertex('X');
graph.addVertex('Q');
graph.addVertex('Y');
graph.addVertex('V');
graph.addVertex('R');
graph.addVertex('W');
graph.addVertex('T');

graph.addEdge('S','P');
graph.addEdge('S','U');

graph.addEdge('P','X');
graph.addEdge('U','X');

graph.addEdge('P','Q');
graph.addEdge('U','V');

graph.addEdge('X','Q');
graph.addEdge('X','Y');
graph.addEdge('X','V');

graph.addEdge('Q','R');
graph.addEdge('Y','R');

graph.addEdge('Y','W');
graph.addEdge('V','W');

graph.addEdge('R','T');
graph.addEdge('W','T');

console.log(graph.DFSRecursive("S"));

// * ["S", "P", "X", "U", "V", "W", "Y", "R", "Q", "T"] // recursive version


