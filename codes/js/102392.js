//I want to use the dragableTask variable for the targets (the tasks), I'll drag later on.
let draggableTask = null;
//A let variable for totalPoints.
let totalPoints = 0;

/*An allowDrop method with 'event'.
This method is made to allow dropping the tasks in another section.
the needed updates for the points will be done here as well by calling the right methods to do so.
Add the updatePointsToDoInProgress function call in the allowDrop method*/
function allowDrop(event) {
    event.preventDefault();

    // Voeg een check toe voor 'In Progress' en bel updatePointsToDoInProgress
  /*  if (event.target.id === 'inprogress-tasks') {
        updatePointsToDoInProgress(event);
    }

    // Assuming the updatePointsToDoInProgress function is used on the 'dragleave' event.
    // Add an event listener for the 'dragleave' event for the targets to ensure smooth updating of points.
    event.target.addEventListener('dragleave', function (event) {
        updatePointsToDoInProgress(event);
    });
*/
    const doneTasks = document.getElementById('done-tasks').childNodes;

  /*  if (event.target.className === 'tasks') {
        if (!doneTasks.includes(draggableTask) && event.target.id !== 'done-tasks') {
            substractPoints(); // Subtract points if task dragged from 'done' to another section
        } 
        else if (doneTasks.includes(draggableTask) && event.target.id === 'done-tasks') {
            updatePoints(); // Update points if task was dragged back to 'done'
        }
        else {
            // Update points for 'To do' to 'In progress' section changes
            if (event.target.id === 'inprogress-tasks') {
                updatePointsToDoInProgress(event);
            }
        }

        event.target.appendChild(draggableTask);
        saveTasks();
    } */
}

//A drag method in which draggableTask is equal to event.target.
function drag(event) {
    draggableTask = event.target;
    /*I'm using the originalParent because the substraction of points didn't work when dragging a task from the 'done'
    section to another.*/
    originalParent = event.target.parentNode; // Store the original parent when a task is dragged
}

/*A drop method with 'event'.
If the event.target.classname is 'tasks', only then it gets appended.
This means the task is being added to the section.*/
function drop(event) {
    event.preventDefault();

    // Code to handle the task drop
    if (event.target.className === 'tasks') {
        const originalParentId = originalParent.id;
        const targetId = event.target.id;

        event.target.appendChild(draggableTask);

        //If the event target id is 'todo-tasks', then the addPointsToDoInProgress() method is being called.
        if (originalParentId === 'todo-tasks' && targetId === 'inprogress-tasks') {
            addPoints2(5);
        } 
        else if (originalParentId === 'todo-tasks' && targetId === 'done-tasks') {
            addPoints2(20);
            finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
            finishedCounter=finishedCounter+1;
            localStorage.setItem('finishedCounter',finishedCounter);
            checkPoints();
        } 
        
        else if (originalParentId === 'inprogress-tasks' && targetId === 'done-tasks') {
            
            finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
            finishedCounter=finishedCounter+1;
            localStorage.setItem('finishedCounter',finishedCounter);
            addPoints2(15);
            checkPoints();
        }
        else if (originalParentId === 'inprogress-tasks' && targetId === 'todo-tasks') {
            removePoints(5);
        }
        //If the event target id is 'inprogress-tasks', then the updatePointsToDoInProgress() method is being called.
        else if (originalParentId === 'done-tasks' && targetId === 'inprogress-tasks') {
            finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
            finishedCounter=finishedCounter-1;
            localStorage.setItem('finishedCounter',finishedCounter);
            removePoints(15);
            checkPoints();
        } 
        
        // Check if the task is moved from 'in-progress' to 'done'
        else if (originalParentId === 'done-tasks' && targetId === 'todo-tasks') {
            finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
            finishedCounter=finishedCounter-1;
            localStorage.setItem('finishedCounter',finishedCounter);
            removePoints(20);
            checkPoints();
        }

         saveTasks();
        originalParent = null; // Reset original parent after drop
    }
}

    //A method to add a task.
    function addTask() {
        const taskInput = document.getElementById('taskInput').value;
        if (taskInput.trim() !== '') {
            const task = document.createElement('div');
            task.className = 'task';
            task.draggable = true;
            task.textContent = taskInput;
            task.addEventListener('dragstart', drag);
            document.getElementById('todo-tasks').appendChild(task);
            //The saveTasks() method is being called.
            saveTasks();
            addNewTaskPoints(); // Add points for adding a new task
            document.getElementById('taskInput').value = '';
        } else {
            alert('Fill in a task!!');
        }
        createCounter=JSON.parse(localStorage.getItem('createCounter'));
        createCounter++;
        localStorage.setItem('createCounter',createCounter);
        checkPoints();
    }

    //A method to remove a task.
    function removeTask() {
        if (draggableTask) {
            const doneTasks = document.getElementById('done-tasks').childNodes;
            const inProgressTasks = document.getElementById('inprogress-tasks').childNodes;
            const todoTasks = document.getElementById('todo-tasks').childNodes;

             /*I want a pop up asking 'Are you sure you want to remove this task?'
            If you click on 'Yes', the task will be removed.*/
            if (confirm('Are you sure you want to remove this task?')) {
                
            
                //If the event target is not anymore in 'done-tasks', 15 points get removed.
                if (doneTasks && doneTasks.length > 0 && doneTasks[doneTasks.length - 1] === draggableTask) {
                    //substractPoints(); // Subtract points if the removed task was from the 'done' section
                    //substractPointsToDoInProgress();
                   // substractPointsTodo();
                    removePoints(21);
                    finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
                    finishedCounter--;
                    localStorage.setItem('finishedCounter',finishedCounter);
                    checkPoints();
                }

                //If the event target is not anymore in 'inprogress-tasks', 5 points get removed.
                if (inProgressTasks && inProgressTasks.length > 0 && inProgressTasks[inProgressTasks.length - 1] === draggableTask) {
                    //substractPointsToDoInProgress(); // Subtract points if the removed task was from 'In progress'
                    //substractPointsTodo();
                    removePoints(6);
                }

                //If the event target is not anymore in 'todo-tasks', 1 point gets removed.
                if (todoTasks && todoTasks.length > 0 && todoTasks[todoTasks.length - 1] === draggableTask) {
                    //substractPointsTodo(); // Subtract points if the removed task was from 'To do'
                    removePoints(1);
                }
                createCounter=JSON.parse(localStorage.getItem('createCounter'));
                createCounter--;
                localStorage.setItem('createCounter',createCounter);
                draggableTask.remove();
                checkPoints();
            }

            //The saveTasks() method is being called.
            saveTasks();
            draggableTask = null;
        } 
        else {
            alert('Select a task.');
        }
    }

    

    /*A method saveTasks which uses a constant columns which has a query selector using the html class .column.
    Also I want a const tasks = {};
    With a foreach loop there should be looped through the columns*/
    function saveTasks() {
        const columns = document.querySelectorAll('.column');
        const tasks = {};
        columns.forEach(column => {
            const columnId = column.id;
            const columnTasks = [];
            column.querySelectorAll('.task').forEach(task => {
                columnTasks.push(task.textContent);
            });
            tasks[columnId] = columnTasks;
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    /*A method loadTasks which uses a constant tasks = JSON.parse(localStorage.getItem('tasks'));
    This means this method is responsible for eventually loading and showing the earlier saved information.*/
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks'));
    
        if (tasks) {
            Object.keys(tasks).forEach(columnId => {
                const column = document.getElementById(columnId);
    
                // Ensure the column exists
                if (column) {
                    const columnTasks = tasks[columnId];
    
                    // Add the tasks to the column
                    columnTasks.forEach(taskContent => {
                        const task = document.createElement('div');
                        task.className = 'task';
                        task.draggable = true;
                        task.textContent = taskContent;
                        task.addEventListener('dragstart', drag); // Reattach the drag event listener
                        column.querySelector('.tasks').appendChild(task); // Append to tasks container
                    });
                }
            });
            restorePoints();
        }
    }
    
    window.onload = function() {
        loadTasks();
        // Create a dummy json to save to localstorage scores
        check = JSON.parse(localStorage.getItem('scores')) || [];
        if (check.length === 0) {
            const dummyScores = [{ name: 'Bob', score: 0 },
        { name: 'Alice', score: 5 },
        { name: 'Tester', score: 0 },
        { name: 'Bob', score: 20 },
        { name: 'Tiger', score: 60 },
        { name: 'Eve', score: 100 },
        { name: 'Lars', score: 3 },
        { name: 'Sam', score: 12 },
        { name: 'Frank', score: 88 },
        { name: 'Johnny', score: 8 }];
        localStorage.setItem('scores', JSON.stringify(dummyScores));
        }
        
        console.log(JSON.parse(localStorage.getItem('scores')));
    }
    

    /*The selectTask method and the addEventListener 'click' have been generated by ChatGPT 3.5*/
    /*The selectTask method should make sure the user can select a task.
    It gets a border so it's clear for the user what has been selected.
    This is practical for when a user would like to remove a task, so they are always aware which task is selected.*/
    function selectTask(task) {
        if (draggableTask) {
            draggableTask.style.border = 'none'; // Remove border from the previously selected task
        }
        draggableTask = task;
        draggableTask.style.border = '2px solid black'; // Add a red border to the selected task
    }

    /*The earlier made selectTask()-method will be activated when someone CLICKS on the task.
    For that I use an addEventListener 'click'.*/
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('task')) {
            selectTask(event.target);
        } else if (event.target.nodeName !== 'INPUT') {
            if (draggableTask) {
                draggableTask.style.border = 'none'; // Remove border if clicked outside of tasks
                draggableTask = null;
            }
        }

    });


    //A function 'toggleMode' which toggles the dark-mode class on the body element with a const body which uses a querySelector.
    function toggleMode() {
        const body = document.querySelector('body');
        body.classList.toggle('dark-mode');
    }

    //Make a function 'updatePoints' which updates the points.
    function updatePoints() {
        const doneTasks = document.getElementById('done-tasks').childNodes;
        totalPoints = 15 * doneTasks.length;

        if (totalPoints >= 500) {
            createBadge(); // Create badge when points reach 500
            displayPopup(); // Display popup on the index page
        }

        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }
    
    //Make a function 'addPoints' which adds points.
    function addPoints() {
        totalPoints += 15;
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }
    
    //Make a function 'substractPoints' which substracts points.
    function substractPoints() {
        // Ensure the points don't go below 0
        if (totalPoints > 0) {
            totalPoints -= 15;
        }
        else{
            totalPoints = 0;
        }
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }

    /* Add a method 'updatePointsToDoInProgress()'to update points when tasks move between 'To do' and 'In progress'*/
    function updatePointsToDoInProgress(event) {
        const todoTasks = document.getElementById('todo-tasks').childNodes;
        const inProgressSection = document.getElementById('inprogress-tasks');
        const inProgressTasks = inProgressSection.childNodes;
    
        // Check if the dragged task is from 'To do' and is moving into 'In Progress'
        if (todoTasks.includes(draggableTask) && event.target === inProgressSection) {
            addPointsToDoInProgress(); // Add points when a task moves from 'To do' to 'In Progress'
        } 
        else if (inProgressTasks.includes(draggableTask) && event.target.id === 'todo-tasks') {
            substractPointsToDoInProgress(); // Subtract points if the task moves back from 'In Progress' to 'To do'
        }
    }

    /*Add a method 'addPointsToDoInProgress' to add 5 points.*/
    function addPointsToDoInProgress() {
        totalPoints += 5; // Update to add 5 points when a task moves from 'To do' to 'In progress'
        savePoints();
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }

    /*Add a method 'substractPointsToDoInProgress()' to remove 5 points. 
    If the user already has less than 5 points, their points are getting to 0.*/
    function substractPointsToDoInProgress() {
        if (totalPoints >= 5) {
            totalPoints -= 5;
        } 
        else {
            totalPoints = 0;
        }
        
        savePoints();
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }

    /*Add a method 'substractPointsToDo* to remove 1 point.
    If the user already has 0 points, their points stay 0.*/
    function substractPointsTodo() {
        if (totalPoints > 0) {
            totalPoints -= 1;
        }
        else{
            totalPoints = 0;
        }
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }
    
    /*The savePoints() method will save 'saved points' in localStorage.*/
    function savePoints() {
        localStorage.setItem('points', totalPoints);
    }

    /*The addNewTaskPoints() method will add 1 point when a new task is added.*/
    function addNewTaskPoints() {
        totalPoints += 1;
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    }
        
    //The restorePoints() method will restore the points from localStorage.
    function restorePoints() {
        const points = localStorage.getItem('points');
        if (points) {
            totalPoints = parseInt(points);
            document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
        }
    }

    //A simple resetPoints() method which resets the points to 0.
    function resetPoints() {
        totalPoints = 0;
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
        UpdateScore();
        localStorage.setItem('finishedCounter',0);
        localStorage.setItem('createCounter',0);
        checkPoints();

    }
    //A simple function that adds points to totalPoints and updates point counter in html
    function addPoints2(points) {
        totalPoints += points;
        savePoints(); // Save the updated points
        document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
        UpdateScore();
        checkPoints();
    }
// A function that removes points from totalPoints and updates point counter in html
function removePoints(points) {
    totalPoints -= points;
    if (totalPoints < 0) {
        totalPoints = 0;
    }
    savePoints(); // Save the updated points
    document.getElementById('point-counter').textContent = `Points: ${totalPoints}`;
    UpdateScore(); // Call the function after updating the points
    checkPoints();
}


// A function that creates a JSON file with a name and score that will be saved in localstorage
function UpdateScore() {
    const testerName = "Tester";
    const score = totalPoints;
    const scoreObject = { testerName, score };
    const scoreslist = JSON.parse(localStorage.getItem('scores')) || [];

    for (var i = 0; i < scoreslist.length; i++) {
        if (scoreslist[i].name === testerName) {
            scoreslist[i].score = totalPoints;
            console.log("Score updated");
            break;
        }
        console.log("looped");
    }
    localStorage.setItem('scores', JSON.stringify(scoreslist));


}

    // A function that loads the scores from localstorage and displays them in the scoreboard
    function loadScores() {
        const scores = JSON.parse(localStorage.getItem('scores'));
        console.log(scores);
        if (scores) {
            let counter = 1;
            const scoreList = document.getElementById('score-list');
            scoreList.innerHTML = '';
            scores.forEach(score => {
                const scoreItem = document.createElement('li');
                scoreItem.textContent = `${counter}:    ${score.testerName}: ${score.score}`;
                scoreList.appendChild(scoreItem);
                counter++;
            });
        }
    }

    function createBadge() {
        // Create badge image element
        const badgeImage = document.createElement('img');
        badgeImage.src = 'img/badge_500points.png'; // Update with your image path
        badgeImage.alt = '500 Points Badge';
        console.log("500 gehaald");
        // Append the badge to the badges section
       // const badgesSection = document.getElementById('badges-section');
       // badgesSection.appendChild(badgeImage);
    }

    function displayPopup(text) {
        
        // Create a popup element
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.textContent = text;
    
        // Append the popup to the body
        document.body.appendChild(popup);
    
        // Remove the popup after a certain time (e.g., 5 seconds)
        setTimeout(() => {
            popup.remove();
        }, 5000);
        
    }    

    // function to clear scores from localstorage
    function clearScores() {
        localStorage.removeItem('scores');
    }    
    
    
    window.onload = function() {
        loadTasks();
         badge500= JSON.parse(localStorage.getItem('badge500')) || false;
         if (badge500 === false){
            localStorage.setItem('badge500',false);
         }
         badgeFin20= JSON.parse(localStorage.getItem('badgeFin20')) || false;
         if (badgeFin20 === false){
            localStorage.setItem('badgeFin20',false);
         }
         badgeFree= JSON.parse(localStorage.getItem('badgeFree')) || false;
         if (badgeFree === false){
            localStorage.setItem('badgeFree',false);
         }
         createCounter= JSON.parse(localStorage.getItem('createCounter')) || 0;
         if (createCounter = 0){
            localStorage.setItem('createCounter',0);
         }
         finishedCounter= JSON.parse(localStorage.getItem('createCounter')) || 0;
         if (finishedCounter = 0){
            localStorage.setItem('finishedCounter',0);
         }
         console.log (JSON.parse(localStorage.getItem('createCounter')));
            console.log (JSON.parse(localStorage.getItem('finishedCounter')));
         console.log(JSON.parse(localStorage.getItem('badge500')));
        // Create a dummy json to save to localstorage scores
        check = JSON.parse(localStorage.getItem('scores')) || [];
        if (check.length === 0) {
            const dummyScores = [
                { name: 'Bob', score: 0 },
                { name: 'Alice', score: 5 },
                { name: 'Tester', score: 0 },
                { name: 'Bob', score: 20 },
                { name: 'Tiger', score: 60 },
                { name: 'Eve', score: 100 },
                { name: 'Lars', score: 3 },
                { name: 'Sam', score: 12 },
                { name: 'Frank', score: 88 },
                { name: 'Johnny', score: 8 }
            ];
            localStorage.setItem('scores', JSON.stringify(dummyScores));
        }

        console.log(JSON.parse(localStorage.getItem('scores')));

        
    }

    function checkPoints(){
        badge500= JSON.parse(localStorage.getItem('badge500'));
        badgeFin20= JSON.parse(localStorage.getItem('badgeFin20'));
        badgeFree=JSON.parse(localStorage.getItem('badgeFree'));
         localpoints= JSON.parse(localStorage.getItem('points'));
        if (localpoints >= 100) {
            
         if (badge500 === false){
            
            displayPopup("Congratulations! You reached 500 points!");
            localStorage.setItem('badge500',true);
         }
            
            
        } else {
            if (badge500===true){
                localStorage.setItem('badge500',false);
            }
        }
        finishedCounter= JSON.parse(localStorage.getItem('finishedCounter'));
        if (finishedCounter>=20){
            if (badgeFin20===false){
             displayPopup("Congratulations! You finished 20 tasks!");
             localStorage.setItem('badgeFin20',true);
            }
        }else {
            if (badgeFin20===true){
                localStorage.setItem('badgeFin20',false);
            }
        }
        createCounter=JSON.parse(localStorage.getItem('createCounter'));
        if (createCounter>=20){
            if (badgeFree===false){
                displayPopup("Congratulations! You started 20 tasks!");
                localStorage.setItem('badgeFree',true);
            }
        }else {
            if (badgeFree===true){
                localStorage.setItem('badgeFree',false);
            }
        }


        

    }
