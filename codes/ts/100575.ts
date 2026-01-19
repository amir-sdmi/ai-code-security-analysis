/*
    Stack

    A stack is an abstract data type that represents a collection of elements with two main operations: push and pop. It is a Last-In-First-Out (LIFO) data structure, meaning that the last element added to the stack will be the first one to be removed.

    In Real Life 
        1. Call Stack: In computer programming, the call stack is used to keep track of function calls. Each time a function is called, its arguments and local variables are pushed onto the stack. When the function returns, the stack is popped to restore the previous state.
        2. Expression Evaluation: Stacks are used to evaluate expressions in many programming languages. For example, a postfix expression is evaluated by pushing each operand onto the stack and then applying each operator to the top two values on the stack.
        3. Plate Stacking: In a restaurant, plates are often stacked on top of each other to save space. The plates are added to the stack one at a time, and the top plate is removed when it is needed.

    Description and comments created by chatgpt and github copilot
*/
class Stack{
    private stack:number[] = [];

    public push(a: number): void
    {
        // add item to end of stack
        this.stack[this.stack.length] = a;
    }

    public pop(): number
    {
        // delete last element in stack
        const temp = this.stack[this.stack.length - 1];
        this.stack.splice(this.stack.length - 1, 1);
        return temp;
    }

    public isEmpty(): boolean
    {
        return this.stack.length === 0;
    }

    public peek(): number
    {
        // return last element of stack
        return this.stack[this.stack.length - 1 != -1 ? this.stack.length - 1 : 0];
    }
}

let stack = new Stack();
stack.push(1); // [1]
stack.push(2); // [1, 2]
stack.push(3); // [1, 2, 3]
stack.pop(); // 3
console.log(stack); // [1, 2]
console.log(stack.peek()); // 2