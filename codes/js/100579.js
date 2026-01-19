// Dates

let myDate = new Date()
// console.log((myDate));
// console.log((myDate.toString()));
// console.log((myDate.toDateString()));
// console.log((myDate.toISOString()));
// console.log((myDate.toJSON()));
// console.log((myDate.toLocaleString()));
// console.log((myDate.toLocaleDateString()));
// console.log((myDate.toTimeString()));
// console.log((myDate.toLocaleTimeString()));

// console.log(typeof myDate); // dates are object


// let myCreatedDate = new Date(2024, 11, 25, 14, 30)
// Date( year, month, date, hour, minutes, seconds, milliseconds) and month starts from 0 as it is a array
//let myCreatedDate = new Date("2024-12-25") 
let myCreatedDate = new Date("01-14-2025")
// let myCreatedDate = new Date("26-01-2025")
// console.log(myCreatedDate.toLocaleString());// invalid output

// The JavaScript Date constructor expects date strings in a format that follows the ISO 8601 standard (YYYY-MM-DD), or a format that JavaScript can easily parse, such as MM/DD/YYYY


//let myTimestamp = new Date().getTime() // Output is in milliseconds from jan 1 1970
let myTimestamp = Date.now()// best way to get timestamp
// console.log(myTimestamp);
// console.log(myCreatedDate.getTime()); // gets the timestamp of mycreated date in milliseconds
// console.log(Math.floor(Date.now()/1000)); // timestamp in seconds

let newDate = new Date()
// console.log(newDate);
// console.log(newDate.getMonth());
// console.log(newDate.getDay()); // days are normal like 1 for monday

newDate.toLocaleString('default',{
    weekday: "short"
})

console.log(newDate);
// use chatgpt
// ctrl + space for suggestions



