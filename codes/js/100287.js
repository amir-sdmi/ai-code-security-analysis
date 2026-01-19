const emcees = ['nas', 'kendrick', 'rakim']
const producers = ['dre', 'kanye', 'premier']

// emcees.push(producers)

// console.log(emcees);
// console.log(emcees.length);// the entire producers array is considered as an element
// console.log(emcees[3][1]);// use 2 [] to enter the entire array item

// const hip_hop = emcees.concat(producers)
// console.log(hip_hop); // 

const community = [...emcees, ...producers]
// console.log(community);

const lmao = [1, 2, 3, [4, 5, 6], 7, 8, [9, 10, 11, [12, 13]]]
// const lol = lmao.flat(Infinity)
// console.log(lol);
// console.log(lmao.flat(Infinity));

// console.log(Array.isArray("Mukthikanth"));
// console.log(Array.from("Mukthikanth"));
// console.log(Array.from({name: "Mukthikanth"})); // interesting use chatgpt
// console.log(Object.values({name: "Mukthikanth"}));
// console.log(Object.keys({name: "Mukthikanth"}));
// console.log(Object.entries({name: "Mukthikanth"}));

let score1 = 100
let score2 = 200
let score3 = 300

console.log(Array.of(score1, score2, score3));



