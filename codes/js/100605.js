class Queue {
    constructor() {
        this._queue = [];
    }

    enqueue(data) {
        this._queue.push(data);
    }
    dequeue() {
        if (this._queue.length === 0) {
            throw Error("queue is empty");
        }
        return this._queue.shift();
    }
    peek() {
        if (this._queue.length === 0) {
            throw Error("queue is empty");
        }
        return this._queue[0];
    }
    isEmpty(){
        return this._queue.length === 0;
    }
    size(){
        return this._queue.length;
    }
}

// this below is created by chatGPT
const myQueue = new Queue();

myQueue.enqueue("first");
myQueue.enqueue("second");

console.log(myQueue.peek()); // Output: "first"

console.log(myQueue.dequeue()); // Output: "first"
console.log(myQueue.size()); // Output: 1

console.log(myQueue.isEmpty()); // Output: false

console.log(myQueue.dequeue()); // Output: "second"
console.log(myQueue.isEmpty()); // Output: true

try {
    myQueue.peek(); // Throws an error: "Queue is empty"
} catch (e) {
    console.error(e.message);
}
