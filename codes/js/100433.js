const parentheses = (str) => {
  let store = [];
  let result = "";
  for (let i = 0; i < str.length; i++) {
    if (str[i] == "(" || str[i] == "[" || str[i] == "{") {
      store.push(str[i]);
    } else {
      let getter = store.pop();
      if (getter == "{" && str[i] != "}") return "invalid";
      else if (getter == "[" && str[i] != "]") return "invalid";
      else if (getter == "(" && str[i] != ")") return "invalid";
    }
  }
  if (store.length === 0) return "valid";
  else return "invalid";
};
console.log(parentheses("{{{"));

//using chatGPT
const isMatch = (str) => {
  let arr = [];

  let brackets = {
    "(": ")",
    "{": "}",
    "[": "]",
  };

  for (let i of str) {
    if (brackets.hasOwnProperty(i)) {
      arr.push(i);
    } else {
      let last = arr.pop();
      if (brackets[last] !== i) {
        return "invalid";
      }
    }
  }
  if (arr.length === 0) return "valid";
  else return "invalid";
};
console.log(isMatch("{{{{}}}}"));
