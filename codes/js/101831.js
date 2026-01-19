let getSeconds;
let getMinutes;
let startButton;
let resetButton;
let timerText;
let full_time;
let time_sec;
let time_min;
let addTaskButton;
let orderedList;
let is_running = false;
let restart_true = false;

function pause() {
    is_running = false;
    console.log("stop button was pressed");
}

function reset_timer(){
    restart_true = true
    is_running = false
    time_sec = 0;
    console.log("sec " + time_sec)
    getSeconds.value = "";
    console.log(getSeconds.value)
    time_min = 0;
    console.log(time_min)
    getMinutes.value = "";
    console.log(getMinutes.value)
    timerText.textContent = "0";
    restart_true = false
    timeValues()
}

function timeValues(){
    getSeconds = document.querySelector("#secInput");
    getMinutes = document.querySelector("#minInput");
    if (getSeconds.value >= 60){
        getSeconds.value -= 60
        getMinutes.value += 1
    }
    if (getMinutes.value >= 60){
        getMinutes.value = 60
    }
}

function getTime() {
    startButton = document.querySelector(".Start");
    resetButton = document.querySelector(".Reset");
    timeValues()

    stopButton = document.querySelector(".Stop");
    startButton.addEventListener('click', timer);
    resetButton.addEventListener('click', reset_timer);
    stopButton.addEventListener('click', pause);
}

function timer(){
    if (time_sec === undefined && time_min === undefined){ 
        time_sec = (getSeconds.value);
        time_min = (getMinutes.value);
    }
    else {
        time_sec = (getSeconds.value);
        time_min = (getMinutes.value);
    }

    full_time = time_sec + time_min
    console.log("Button was pressed");

    timerText.textContent = `${time_min} : ${time_sec}`
    is_running = true
    updateText()
    setTimeout(() => {
      }, (full_time * 1000));
}

// function updateText() { // this is what I originally had before using chatGPT
//     full_time = 3
//     while (full_time > 0){
//         setTimeout(() => {
//             full_time -= 1;
//             timerText.textContent = full_time;
//           }, 1000);
//     }
// }

function updateText() { // chatgpt helped me write this function - the prompt and answer are both in my sources folder
    full_time = full_time
    time_sec = time_sec
    time_min = time_min

    const intervalIdSec = setInterval(() => {
        if (is_running === true){
            if (-1 < time_sec < 60){
                time_sec -= 1;
                timerText.textContent = `${time_min} : ${time_sec}`;
                if (time_min %5 === 0 && time_sec === 0){
                    console.log("This is running")
                    motivation()
                }
                if (time_sec === 0){
                    time_min -= 1;
                    time_sec = 60;
                }
                if (time_min === 0 && time_sec === 1) {
                    console.log("both minutes and seconds are zero")
                    timerText.textContent = `0 : 0`
                    clearInterval(intervalIdSec);
                }
            }
        } else if(restart_true === true){
                console.log("restart is true");
                timerText.textContent = "0";
                clearInterval(intervalIdSec);
        }
        else if(is_running === false && restart_true === false) {
            console.log("running is false");
            console.log("restart is false");
            timerText.textContent = `${time_min} : ${time_sec}`;
            clearInterval(intervalIdSec);
        }}, 1000)
}

function motivation(){
    
    const inspiration = [
        "You Got This!",
        "Keep Going!",
        "You Are Doing A Great Job!",
        "Stay Focused, You Are Almost Done!"
    ]
    const motivation = document.querySelector("#motivation");
    const random = Math.floor(Math.random() * inspiration.length);
    console.log(random)
    motivation.textContent = inspiration[random];

    
    const intervalId = setInterval(() => {
            motivation.textContent = "";
            clearInterval(intervalId);
        }, 10000);
    }

function getHTMLElements() {
    addTaskButton = document.querySelector("#addTask");
    timerText = document.querySelector("#timer");
    addTaskButton.addEventListener('click', addTaskFromUserInput);
    orderedList = document.querySelector("#taskList");
} 

function createExistingTasks() {
    for (let i = 0; i < taskList.length; i++) {
        let taskText = taskList[i];
        let taskDone = tasksDoneStatus[taskText];
        console.log(`Task: ${taskText} is ${taskDone}`);
        makeANewTask(taskText, taskDone);
    }
}

function addTaskFromUserInput() {
    console.log("trying to add a task");
    let inputBox = document.querySelector("#taskInputBox");
    let newTask = inputBox.value;
    makeANewTask(newTask, "not done");
}

function onCheckBoxChange(parentLi, checkBox) {
    console.log("checkbox clicked");

    if(checkBox.checked) {
        console.log("if i have a reference to the checkbox, I can know if it's checked or not");
      parentLi.classList.add("cross-out");
    }
    else{
        parentLi.classList.remove("cross-out");
    }
}

function deleteItem(newLi){
    newLi.remove()
}

function makeANewTask(taskText, taskDone) {
    const newLi = document.createElement("li");
    newLi.textContent = taskText;
    const checkBox = document.createElement("input");
    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("id", "deletebutton");
    newLi.append(deleteButton)

    checkBox.setAttribute('type', "checkbox");
    deleteButton.addEventListener(`click`, deleteItem.bind(null, newLi))
    checkBox.addEventListener('change', onCheckBoxChange.bind(null, newLi, checkBox));

    if(taskDone === "done") {
        newLi.classList.add("cross-out");
        checkBox.checked = true;
    }

    newLi.appendChild(checkBox);
    orderedList.appendChild(newLi);
}

function runProgram() {

    getTime()

    //DO NOT REMOVE: this function gets the HTML elements and stores them in variables for you to use throughout your program
    getHTMLElements();
    createExistingTasks();
}

document.addEventListener('DOMContentLoaded', runProgram);

