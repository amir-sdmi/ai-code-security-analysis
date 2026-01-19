// queue written by chatGPT-3

class Queue {
    constructor() {
      this.items = [];
    }
  
    // enqueue function adds an element to the end of the queue
    enqueue(element) {
      this.items.push(element);
    }
  
    // dequeue function removes an element from the front of the queue
    dequeue() {
      if (this.isEmpty()) {
        return "Underflow";
      }
      return this.items.shift();
    }
  
    // front function returns the front element of the queue
    front() {
      if (this.isEmpty()) {
        return "No elements in Queue";
      }
      return this.items[0];
    }
  
    // isEmpty function returns true if the queue is empty
    isEmpty() {
      return this.items.length === 0;
    }
  
    // printQueue function prints all the elements in the queue
    printQueue() {
      let str = "";
      for (let i = 0; i < this.items.length; i++) {
        str += this.items[i] + " ";
      }
      return str;
    }
  }

  export default Queue;



  