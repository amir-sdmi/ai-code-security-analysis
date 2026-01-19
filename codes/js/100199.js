export function randomNum(min, max) {
    // min and max are not inclusive
    return min + (max * Math.random())
}

export const randomNums = (min, max, n) => {
    return Array(n).fill().map(() => randomNum(min, max))
}

const randomString = function (length) { // Function generated with ChatGPT
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}  
export { randomString }

const Randomizer = {
    randomNum,
    randomNums,
    randomString
}

export { Randomizer as default }


