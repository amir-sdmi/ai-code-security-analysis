/*
    Queue
    
    A queue is a data structure that represents a collection of elements with two main operations: enqueue and dequeue. It is a First-In-First-Out (FIFO) data structure, meaning that the first element added to the queue will be the first one to be removed.

    In Real Life
        1. Supermarket Checkout: At a supermarket, customers join a queue to check out their purchases. The queue ensures that customers are served on a first-come, first-served basis.
        2. Printer Queue: In a computer system, documents are added to a printer queue and printed in the order they were added.
        3. Call Center: In a call center, calls are added to a queue and answered in the order they were received.

    Description and comments created by chatgpt and github copilot
*/
class Queue{
    private queue:number[] = [];

    public enqueue(a:number): void
    {
        this.queue[this.queue.length] = a;
    }

    public dequeue(): number
    {
        // delete first element in stack
        const temp = this.queue[0];
        this.queue.splice(0, 1);
        return temp;
    }

    public display(): void
    {
        console.log(this.queue);
    }
}

let queue = new Queue();
queue.enqueue(1) // [1]
queue.enqueue(2) // [1, 2]
queue.enqueue(3) // [1, 2, 3]
queue.enqueue(4) // [1, 2, 3, 4]
queue.enqueue(5) // [1, 2, 3, 4, 5]

queue.display() // [1, 2, 3, 4, 5]

queue.dequeue() // [2, 3, 4, 5]
queue.dequeue() // [3, 4, 5]
queue.display() // [4, 5]