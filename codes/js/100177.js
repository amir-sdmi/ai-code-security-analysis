// --------------------------------------------------------------------------
// -- utilities-array.js
// -- initial author: Renick Bell (renick@gmail.com)
// -- initial creation date: Fri Jul 7 10:57 AM CST 2023
// -- contributors: Yiler Huang (yiler7777@gmail.com); Steve Wang (stevesg168@gmail.com)
// -- license: GPL 3.0
// --------------------------------------------------------------------------
function buildArray(n, fillFunction) {
    let outputArray = [];
    for (let i = 0; i < n; i++) {
        outputArray.push(fillFunction(i))
    }
    return outputArray
}

//Generated with Chatgpt:
function adjustArrayLength(number, array) {
    const arrayLength = array.length;
    if (arrayLength === number) {
        return array;
    } else if (arrayLength < number) {
        const numCopies = Math.ceil(number / arrayLength);
        return array.concat(...Array(numCopies).fill(array)).slice(0, number);
    } else {
        return array.slice(0, number);
    }
}
