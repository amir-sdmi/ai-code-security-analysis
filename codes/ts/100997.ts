/*
    Deque

    A deque is a double-ended queue. It can be used to add or remove elements from both ends.

    In Real Life
        1. Undo Operation: A deque can be used to implement an undo operation. Each element in the deque represents a state and contains a reference to the previous state.
        2. Browser History: A deque can be used to implement the back and forward buttons in a browser. Each element in the deque represents a URL and contains a reference to the previous URL and the next URL.
        3. Breadth-First Search: A deque can be used to perform a breadth-first search on a graph or tree. In this case, each element in the deque represents a vertex or node and contains references to its adjacent vertices or child nodes.

    Description and comments created by chatgpt and github copilot
*/

class Deque{
    private deque:number[] = [];

    public addRear(a:number): void
    {
        // add element to rear
        this.deque.push(a);
    }

    public addFront(a:number): void
    {
        // add element to front
        let cache_even = this.deque[0];
        let cache_odd = this.deque[0];
        this.deque[0] = a;
        let l = this.deque.length + 1;
        for(let i = 1;i<l;i++){
            if(i % 2 == 0){ // even
                cache_even = this.deque[i];
                if(i + 1 >= l) // if last element
                    this.deque.push(cache_odd);
                else
                    this.deque[i] = cache_odd;
            }else{ // odd
                cache_odd = this.deque[i];
                if(i + 1 >= l) // if last element
                    this.deque.push(cache_even);
                else
                    this.deque[i] = cache_even;
            }
        }

    }

    public removeFront(): number
    {
        // delete front element
        const temp = this.deque[0];
        this.deque.splice(0, 1);
        return temp;
    }

    public removeRear(): number
    {
        // delete rear element
        const temp = this.deque[this.deque.length - 1];
        this.deque.splice(this.deque.indexOf(this.deque.length - 1), 1); // this.deque.length - 1
        return temp;
    }

}

let deque = new Deque()
deque.addRear(8); // [8]
deque.addRear(5); // [8, 5]
deque.addFront(7); // [7, 8, 5]
deque.addFront(10); // [10, 7, 8, 5]
deque.addRear(11); // [10, 7, 8, 5, 11]

console.log(deque); // [10, 7, 8, 5, 11]

deque.removeRear(); // 11
deque.removeFront(); // 10
deque.addFront(55); // [55, 7, 8, 5]
deque.addRear(45); // [55, 7, 8, 5, 45]

console.log(deque); // [55, 7, 8, 5, 45]