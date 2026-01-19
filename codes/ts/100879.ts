/*
    Depth First Search

    Depth First Search (DFS) is a graph traversal algorithm where we start at a root node and keep traversing down until we reach the end. If we reach a node that has no children, we backtrack to the previous node and continue the same process.

    In Real Life:
        1. Web Crawlers: DFS is used to build web crawlers. Web crawlers start from a root page, and follow links to other pages. DFS is used to decide which pages to follow, and which to ignore.
        2. Finding Connected Components: DFS can be used to find all the connected components in an undirected graph. The graph is traversed using DFS, and each time a new vertex is reached, a new connected component is discovered.
        3. Topological Sorting: DFS can be used to topologically sort a graph. The graph is traversed using DFS, and each time a vertex is finished expanding, it is added to the topological sort.

    Description and comments created by chatgpt and github copilot
 */

class Graph{
    private list: number[][] = [];

    public addEdge(from: number, to: number): void
    {
        if(this.list[from] === undefined){
            this.list[from] = [];
        }
        this.list[from].push(to);
    }

    public dfs(start: number): number[]
    {
        let visited: boolean[] = [];
        let stack: number[] = [];
        let result: number[] = [];

        stack.push(start);

        while(stack.length > 0){
            let current: number = stack.pop()!;
            if(visited[current] === true){
                continue;
            }
            visited[current] = true;
            result.push(current);
            for(let i = 0; i < this.list[current].length; i++){
                stack.push(this.list[current][i]);
            }
        }

        return result;
    }

    public print(){
        for(let i = 0; i < this.list.length; i++){
            console.log(i + " -> " + this.list[i]);
        }
    }
}

let myGraph = new Graph();
myGraph.addEdge(0, 1);
myGraph.addEdge(0, 2);
myGraph.addEdge(1, 2);
myGraph.addEdge(2, 0);
myGraph.addEdge(2, 3);
myGraph.addEdge(3, 3);
myGraph.print();
// 0 -> 1,2
// 1 -> 2
// 2 -> 0,3
// 3 -> 3

console.log(myGraph.dfs(2));
// [ 2, 3, 0, 1 ]