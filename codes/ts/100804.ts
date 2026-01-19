/*
    Dijkstra Algorithm

    Dijkstra's algorithm is an algorithm for finding the shortest paths between nodes in a graph, which may represent, for example, road networks. It was conceived by computer scientist Edsger W. Dijkstra in 1956 and published three years later.

    In Real Life:
        1. Google Maps: Finding the shortest path from your location to your destination.
        2. Network Routing: Finding open shortest path for data transfer.
        3. Biology: Used to model the spread of viruses among humans.

    Description and comments created by chatgpt and github copilot
 */

type Graph = {[key: string]: { [key: string]: number }};

function dijkstra(graph: Graph, start: 'A' | 'B' | 'C' | 'D'): {[key: string]: number}
{
    let distances: {[key: string]: number} = {};
    let priorityQueue: [number, string][] = [];

    // Set all distances to infinity
    for (const vertex in graph){
        distances[vertex] = Infinity;
    }

    // Set the starting point to 0
    distances[start] = 0;
    priorityQueue.push([0, start]);

    while (priorityQueue.length) {
        // Get the current vertex
        const [currentDistance, currentVertex] = priorityQueue.shift() as [number, string];

        // If the current distance is greater than the distances[currentVertex], then continue
        if (currentDistance > distances[currentVertex]) {
            continue;
        }

        for (const neighbor in graph[currentVertex]) {
            // Get the weight of the neighbor
            const weight = graph[currentVertex][neighbor];
            const distance = currentDistance + weight;

            // If the distance is less than the distances[neighbor], then update the distances[neighbor] and push it to the priority queue
            if (distance < distances[neighbor]) {
                distances[neighbor] = distance;
                priorityQueue.push([distance, neighbor]);
            }
        }
    }

    return distances;
}

const graph: Graph = {
    'A': { 'B': 1, 'C': 4 },
    'B': { 'A': 1, 'C': 2, 'D': 5 },
    'C': { 'A': 4, 'B': 2, 'D': 1 },
    'D': { 'B': 5, 'C': 1 }
}

console.log(dijkstra(graph, 'A')); // { A: 0, B: 1, C: 3, D: 4 }
