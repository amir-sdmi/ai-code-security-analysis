import { string } from 'yup';

type License = {
  sources: string[];
  title: string;
  license: string;
  disclaimer: string;
};
export const licenses: License[] = [
  {
    sources: [
      'Sneaky Snitch by Kevin MacLeod',
      'Monkeys Spinning Monkeys Kevin MacLeod',
      'Fluffing a Duck Kevin MacLeod',
    ],
    title: 'Music promoted by https://www.chosic.com/free-music/all/',
    license: 'Creative Commons CC BY 3.0',
    disclaimer:
      'This work is licensed under a Creative Commons Attribution 3.0 International License.',
  },
  {
    sources: [
      'Adventure by Alexander Nakarada',
      'Fast Feel Banana Peel by Alexander Nakarada',
    ],
    title: 'Music promoted by https://www.chosic.com/free-music/all/',
    license: 'Attribution 4.0 International (CC BY 4.0)',
    disclaimer:
      'This work is licensed under a Creative Commons Attribution 4.0 International License.',
  },
  {
    sources: [
      'Story texts generated using ChatGPT by OpenAI',
      'Story images generated using DALL·E by OpenAI',
    ],
    title: 'Content created with assistance from OpenAI',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    disclaimer:
      'This content was created with the assistance of AI tools provided by OpenAI, including ChatGPT for text generation and DALL·E for image creation. This work is licensed under a Creative Commons Attribution 4.0 International License.',
  },
];
