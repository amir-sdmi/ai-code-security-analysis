/*
    Heap

    A heap is a tree-based data structure in which all the nodes of the tree are in a specific order.

    In Real Life:
        1. Priority Queue: A heap can be used to implement a priority queue. Each element in the heap represents a job and has a priority associated with it. The element with the highest priority is always in the first position in the heap, so it can be retrieved quickly.
        2. Heap Sort: A heap can be used to implement heap sort. In this case, the heap is used as a sorting algorithm. The elements of the array are inserted into the heap one by one, and then removed from the heap one by one. The elements are removed in sorted order.
        3. Graph Algorithms: A heap can be used to implement graph algorithms such as Dijkstra's algorithm and Prim's algorithm. In this case, the heap is used to store the vertices of the graph. Each vertex has a distance associated with it. The vertex with the smallest distance is always in the first position in the heap, so it can be retrieved quickly.

    Description and comments created by chatgpt and github copilot
 */

class MinHeap{
    private heap: Array<number> = [];

    public insert(value: number): void
    {
        this.heap.push(value);
        if(this.heap.length > 1)
            this.heapifyUp(this.heap.length);
    }

    public remove(value: number): void
    {
        // find index of value
        const index: number = this.heap.indexOf(value);

        // if value is not in heap, return null
        if (index === -1)
            return;

        // swap value with last value
        this.swap(index, this.heap.length - 1);

        // remove last value
        this.heap.pop();

        // heapify up and down
        this.heapifyUp(index + 1);
        this.heapifyDown(index + 1);
    }

    private heapifyUp(index: number): void
    {
        // get parent index of index
        let parentIndex: number = Math.floor((index) / 2);

        // if last value is less than parent value, swap
        if (this.heap[index - 1] < this.heap[parentIndex - 1])
            this.swap(index - 1, parentIndex - 1);

        // if parent index is not 0, call heapify again
        if (parentIndex !== 0)
            this.heapifyUp(parentIndex - 1);
    }

    private heapifyDown(index: number): void
    {
        // get the children of the index
        let leftChildIndex: number = 2 * index;
        let rightChildIndex: number = 2 * index + 1;

        /**
         * if value of index is greater than value of left child index
         * or value of index is greater than value of right child index
         * swap the value of index with the smaller of the two children
         * and call heapify again.
         */
        if (this.heap[index - 1] > this.heap[leftChildIndex - 1]){
            this.swap(index - 1, leftChildIndex - 1);
            this.heapifyDown(leftChildIndex);
        }
        else if(this.heap[index - 1] > this.heap[rightChildIndex - 1]){
            this.swap(index - 1, rightChildIndex - 1);
            this.heapifyDown(rightChildIndex);
        }
    }

    private swap(index1: number, index2: number): void
    {
        const temp: number = this.heap[index1];
        this.heap[index1] = this.heap[index2];
        this.heap[index2] = temp;
    }

    public print(): void
    {
        console.log(this.heap);
    }
}

var myMinHeap = new MinHeap();
[3, 9, 2, 1, 4, 5, 8, 7].forEach((item) => myMinHeap.insert(item));
myMinHeap.print(); // [ 1, 2, 3, 7, 4, 5, 8, 9 ]
myMinHeap.remove(3);
myMinHeap.print(); // [ 1, 2, 5, 7, 4, 9, 8 ]