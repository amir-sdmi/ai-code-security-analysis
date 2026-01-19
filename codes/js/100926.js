export const convertViewCount = (viewCount) => {
  if (viewCount >= 1000000) {
    return (viewCount / 1000000).toFixed(0) + "M";
  } else if (viewCount >= 1000) {
    return (viewCount / 1000).toFixed(0) + "K";
  } else {
    return viewCount.toString();
  }
};

// Array of sample user names
const userNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Grace",
  "Henry",
  "Isabel",
  "Jack",
  "Karen",
];

// Array of sample AI-related messages
const messages = [
  "Hey, have you heard about ChatGPT? 🙌 It's an amazing AI language model!😃",
  "I just had a conversation with ChatGPT and it was mind-blowing!😮",
  "Artificial Intelligence is changing the world, and 🎊 ChatGPT is at the forefront!🎊 ",
  "I can't believe how smart ChatGPT is 🙌. It can answer almost anything!🤯",
  "AI is the future,🎊 and ChatGPT is leading the way.",
  "I wonder how ChatGPT is trained 🙄 It's so knowledgeable!",
  "ChatGPT can generate human-like text. It's both fascinating and scary. 😱",
  "Talking to AI feels like talking to a real human sometimes. It's amazing! 😃",
  "ChatGPT is revolutionizing natural language processing. 🎊",
  "AI is transforming various industries, 🎊 from healthcare to finance.",
];

// Function to generate a random message object
export const generateRandomMessage = ()=>{
  const randomUserName =
    userNames[Math.floor(Math.random() * userNames.length)];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  return { name: randomUserName, message: randomMessage };
}

const commentMessages = [
  "Who will win the match? Manchester United or Real Madrid?",
  "Key players to watch out for in this game?",
  "Predict the scoreline for the match.",
  "Memorable past encounters between these giants?",
  "Formation and tactics to expect from both teams?",
  "Injuries affecting the game?",
  "Best goalscorer in the Manchester United vs Real Madrid rivalry?",
  "Thoughts on the coaches?",
  "Importance of this high-profile match?",
  "How will this match impact their respective leagues?",
  "Will Cristiano Ronaldo shine against his former club?",
  "The midfield battle will be crucial.",
  "Can Real Madrid's defense handle United's attack?",
  "Predict the first goalscorer of the game.",
  "Fans eagerly waiting for this epic clash.",
  "An exciting showdown between footballing giants.",
  "Both teams aiming for European glory.",
  "It's more than just a rivalry; it's history in the making.",
  "Fans, get ready for a football spectacle.",
  "Who holds the upper hand in this contest?"
];

export const generateRandomCommentMessage = ()=>{
  const randomMessage = commentMessages[Math.floor(Math.random() * messages.length)];
  return randomMessage;
}