import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { JokeType } from '../../entities/JokeType.entity';
import { Joke } from '../../entities/Joke.entity';

const DATA = [
  {
    joke: 'What do you call a bear with no teeth? A gummy bear!',
    type: 'Animal',
  },
  {
    joke: 'What do you get when you cross an elephant with a rhinoceros? Elephino!',
    type: 'Animal',
  },
  {
    joke: 'Why do cows wear bells? Because their horns don’t work.',
    type: 'Animal',
  },
  {
    joke: 'Why did the hipster burn his tongue? He drank his coffee before it was cool.',
    type: 'Culture',
  },
  {
    joke: 'Why was the math teacher late to work? She took the rhombus.',
    type: 'Education',
  },
  {
    joke: 'Why did the tomato turn red? Because it saw the salad dressing!',
    type: 'Food',
  },
  {
    joke: "What do you call cheese that isn't yours? Nacho cheese.",
    type: 'Food',
  },
  {
    joke: "Why don't eggs tell jokes? They'd crack each other up.",
    type: 'Food',
  },
  {
    joke: 'Why do ghosts love elevators? It lifts their spirits!',
    type: 'Holiday',
  },
  {
    joke: "Why don't skeletons fight each other? They don't have the guts.",
    type: 'Pun',
  },
  {
    joke: 'What do you call fake spaghetti? An impasta!',
    type: 'Pun',
  },
  {
    joke: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
    type: 'Pun',
  },
  {
    joke: 'What do you get when you cross a snowman and a vampire? Frostbite!',
    type: 'Pun',
  },
  {
    joke: 'Why was the stadium so cool? It was filled with fans!',
    type: 'Pun',
  },
  {
    joke: 'What do you get if you cross a cat with a dark horse? Kitty Perry.',
    type: 'Pun',
  },
  {
    joke: 'Why did the coffee file a police report? It got mugged!',
    type: 'Pun',
  },
  {
    joke: 'Why did the bicycle fall over? It was two-tired.',
    type: 'Pun',
  },
  {
    joke: 'Why don’t seagulls fly over the bay? Because then they’d be bagels!',
    type: 'Pun',
  },
  {
    joke: 'I told my wife she should embrace her mistakes. She gave me a hug.',
    type: 'Relationship',
  },
  {
    joke: "Why don't scientists trust atoms? Because they make up everything!",
    type: 'Science',
  },
  {
    joke: 'Why did the golfer bring two pairs of pants? In case he got a hole in one.',
    type: 'Sports',
  },
  {
    joke: "I told my computer I needed a break, and now it won't stop sending me KitKat ads.",
    type: 'Technology',
  },
  {
    joke: "Why don't programmers like nature? It has too many bugs.",
    type: 'Technology',
  },
  {
    joke: 'Why did the smartphone need glasses? It lost all its contacts.',
    type: 'Technology',
  },
  {
    joke: 'I told my wife she was drawing her eyebrows too high. She looked surprised.',
    type: 'Wordplay',
  },
  {
    joke: 'Why did the math book look sad? Because it had too many problems.',
    type: 'Wordplay',
  },
  {
    joke: "I'm reading a book on anti-gravity. It's impossible to put down!",
    type: 'Wordplay',
  },
  {
    joke: 'Parallel lines have so much in common. It’s a shame they’ll never meet.',
    type: 'Wordplay',
  },
  {
    joke: "I asked the librarian if the library had any books on paranoia. She whispered, 'They're right behind you. ,",
    type: 'Wordplay',
  },
  {
    joke: 'I wanted to be a doctor, but I didn’t have the patients.',
    type: 'Wordplay',
  },
];

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for await (const data of DATA) {
      let jokeType = await em.findOne(JokeType, { type: data.type });
      if (!jokeType) {
        jokeType = em.create(JokeType, { type: data.type });
        em.persist(jokeType);
      }

      const joke = em.create(Joke, {
        joke: data.joke,
        type: jokeType,
      });

      em.persist(joke);
    }
    em.flush();
  }
}

// Generated using chatgpt
/**
[{"joke" : "Why don't skeletons fight each other? They don't have the guts.",                                                "type" : "Pun"},
{"joke" : "I told my wife she was drawing her eyebrows too high. She looked surprised.",                                     "type" : "Wordplay"},
{"joke" : "What do you call fake spaghetti? An impasta!",                                                                    "type" : "Pun"},
{"joke" : "Why did the scarecrow win an award? Because he was outstanding in his field!",                                    "type" : "Pun"},
{"joke" : "Why did the math book look sad? Because it had too many problems.",                                               "type" : "Wordplay"},
{"joke" : "I'm reading a book on anti-gravity. It's impossible to put down!",                                                "type" : "Wordplay"},
{"joke" : "What do you get when you cross a snowman and a vampire? Frostbite!",                                              "type" : "Pun"},
{"joke" : "Why was the stadium so cool? It was filled with fans!",                                                           "type" : "Pun"},
{"joke" : "Parallel lines have so much in common. It’s a shame they’ll never meet.",                                         "type" : "Wordplay"},
{"joke" : "I asked the librarian if the library had any books on paranoia. She whispered, 'They're right behind you. ,",     "type" : "Wordplay"},
{"joke" : "What do you get if you cross a cat with a dark horse? Kitty Perry.",                                              "type" : "Pun"},
{"joke" : "Why don't scientists trust atoms? Because they make up everything!",                                              "type" : "Science"},
{"joke" : "I told my computer I needed a break, and now it won't stop sending me KitKat ads.",                               "type" : "Technology"},
{"joke" : "Why did the coffee file a police report? It got mugged!",                                                         "type" : "Pun"},
{"joke" : "Why did the golfer bring two pairs of pants? In case he got a hole in one.",                                      "type" : "Sports"},
{"joke" : "Why don't programmers like nature? It has too many bugs.",                                                        "type" : "Technology"},
{"joke" : "I wanted to be a doctor, but I didn’t have the patients.",                                                        "type" : "Wordplay"},
{"joke" : "What do you call a bear with no teeth? A gummy bear!",                                                            "type" : "Animal"},
{"joke" : "Why did the bicycle fall over? It was two-tired.",                                                                "type" : "Pun"},
{"joke" : "Why was the math teacher late to work? She took the rhombus.",                                                    "type" : "Education"},
{"joke" : "Why did the tomato turn red? Because it saw the salad dressing!",                                                 "type" : "Food"},
{"joke" : "Why don’t seagulls fly over the bay? Because then they’d be bagels!",                                             "type" : "Pun"},
{"joke" : "What do you get when you cross an elephant with a rhinoceros? Elephino!",                                         "type" : "Animal"},
{"joke" : "I told my wife she should embrace her mistakes. She gave me a hug.",                                              "type" : "Relationship"},
{"joke" : "Why do cows wear bells? Because their horns don’t work.",                                                         "type" : "Animal"},
{"joke" : "Why did the hipster burn his tongue? He drank his coffee before it was cool.",                                    "type" : "Culture"},
{"joke" : "Why did the smartphone need glasses? It lost all its contacts.",                                                  "type" : "Technology"},
{"joke" : "Why do ghosts love elevators? It lifts their spirits!",                                                           "type" : "Holiday"},
{"joke" : "What do you call cheese that isn't yours? Nacho cheese.",                                                         "type" : "Food"},
{"joke" : "Why don't eggs tell jokes? They'd crack each other up.",                                                          "type" : "Food"},]

**/
