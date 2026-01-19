/* 
The prompt for this was created by CHATGPT; The prompt follows:

Write a function that takes in a list of tasks, where each task has dependencies on other tasks, and returns a sequence in which the tasks can be completed. 
If the tasks have circular dependencies, the function should detect and handle them.

This is a work in progress as of 11/26/2024
*/

const tasks = [
    { name: "A", dependsOn: [], task: "change tires on the shitty honda civic sitting on cinderblocks in the front yard", done: false},
    { name: "B", dependsOn: ["A"], task: "Get mad at Veteran mode on COD4 Mile High Club and punch a hole in the wall", done: false},
    { name: "C", dependsOn: ["B"], task: "sell crack", done: false},
    { name: "D", dependsOn: ["A", "B", "C"], task: "Praise Terry Davis and code in Holy C on TempleOS", done: false},
  ];

function taskChecker(inputTasks = tasks) { //default value is the tasks from earlier
    let Output = [];
    for (let items of inputTasks) { // so here im looking into if the task is actually done, ill work more on it later
        if (!items.done) {
            Output.push(`You need to complete ${this.task}`);
        }
    }
return Output.join(" and ");
}
taskChecker();
