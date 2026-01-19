const promise1 = new Promise(function (resolve, reject) {
  //creating an instance of a Promise object.
  //Below is the example of the asyn operation for which we are using promise
  setTimeout(() => {
    console.log("promise1 created");
    resolve(); //this is method call for promise1.then()
  }, 1000);
});

promise1.then(function () {
  console.log("promise1 consumed"); //only after the setTimeout function is completed this code will run.
});

// Creation and Comsumption of promise without giving its refernce to a variable
new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log("promise2 created");
    resolve();
  }, 1000);
}).then(() => {
  console.log("promise2 consumed");
});

const promise3 = new Promise(function (resolve, reject) {
  setTimeout(() => {
    console.log("promise3 created");
    resolve({ name: "Subham", age: "20" });
  }, 1000);
});

promise3.then(function (user) {
  console.log("Promise3 resolved for:");
  console.log(user.name, user.age);
});

const promise4 = new Promise(function (resolve, reject) {
  setTimeout(() => {
    const error = false;
    if (!error) {
      resolve({ username: "subham321", pass: 123 });
    } else {
      reject("something went wrong");
    }
  }, 1000);
});

promise4
  .then(function (user) {
    return user.username; //then if the promise is fullfiled
  })
  .then(function (uname) {
    console.log(`User is ${uname}`); //chaining (used during DB connection)
  })
  .catch(function (error) {
    console.log(error); //catch if the promise is rejected
  })
  .finally(function () {
    //this will always execute
    console.log("The promise is either resolved/fullfilled or rejected");
  });

const promise5 = new Promise(function (resolve, reject) {
  setTimeout(() => {
    const error = false;
    if (!error) {
      resolve({ JavaScript: "subham321", pass: 123 });
    } else {
      reject("JS went wrong");
    }
  }, 1000);
});

async function consumePromise5() {
  try {
    const response = await promise5; //Learn in detail using ChatGpt and make note in copy
    console.log(response);
  } catch (error) {
    console.log("ERROR");
  }
}

consumePromise5();

async function getUsers() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    console.log(typeof response);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log("Error occured");
  }
}
getUsers();

fetch("https://jsonplaceholder.typicode.com/users")
  .then(function (response) {
    return response.json(); //Parsing the necessary data
  })
  .then(function (data) {
    console.log(data);
  })
  .catch(function () {
    console.log("Something went WRONG");
  })
  .finally(function () {
    console.log(
      "Fetch promise is either fullfilled(.then) or rejected(.catch)"
    );
  });

//the reason Fetch operation is done at first than any of the above operation because when fetch is requested it gets a special high priority queue ie micro task queue/Fetch queue in event loop.
