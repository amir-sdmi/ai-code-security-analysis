import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import kebabCase from "lodash.kebabcase";
import fs from "fs";

import client from "./lib/sanity";
import openAI from "./lib/open-ai";
import {
  getFAQ,
  getFinalThoughts,
  getIntro,
  getMeta,
  getPrompt,
  getPromptIntro,
  getPromptsIntro,
  getTitleContent,
  getRedditIntro,
} from "./lib/prompts";
import { ChatCompletion } from "openai/resources";
import { getMarkdown } from "./lib/reddit";
import { getMarkdown as getIGMarkdown } from "./lib/ig";

// chat gpt prompts for keyword research || 10 – 100
// chatgpt prompts for lawyers || 10 – 100
// chatgpt prompts for legal writing || 10 – 100
// chatgpt prompts for newsletter || 0 - 10
// chat gpt prompts for rewriting content || 10 - 100
// chat gpt prompts for website copy || 10 - 100

const keyword = "chat gpt prompts for keyword research";
const seoTitle = "ChatGPT Prompts for Keyword Research";
const slug = slugify(keyword, { lower: true });

const FAQ = [
  "Can I use ChatGPT for keyword research?",
  "Is ChatGPT good for keyword research?",
  "How to use ChatGPT for SEO research?",
];
const useCases = [
  {
    title: "Generate Primary Keyword Ideas",
    role: "specialist in SEO keyword research",
    task: "generate a list of primary keywords for a blog about [topic]",
  },
  {
    title: "Generate Long-Tail Keywords",
    role: "specialist in SEO keyword research",
    task: "generate list of long-tail keywords related to [topic]",
  },
  {
    title: "Suggest Question-Based Keywords",
    role: "specialist in SEO keyword research",
    task: "generate list of keywords related to [topic]",
  },
  {
    title: "Suggest Localized Keyword",
    role: "specialist in SEO keyword research",
    task: "generate list of keywords for a [business] in [location] focusing on given [niche]",
  },
  {
    title: "Cluster Keywords Based on Topic",
    role: "specialist in SEO keyword research",
    task: "cluster keywords around the given [topic]",
  },
  {
    title: "Come Up With Popular Subtopics",
    role: "specialist in SEO keyword research",
    task: "find popular subtopics related to a [topic]",
  },
  {
    title: "Perform Competitor Keyword Analysis",
    role: "specialist in SEO keyword research",
    task: "analyze the top 5 competitors in the [niche] and suggest keywords they are using",
  },
  {
    title: "Do Content Gap Analysis",
    role: "specialist in SEO keyword research",
    task: "identify content gaps in the current online resources about [topic]",
  },
];

const getTitleLink = (title: string) => {
  const titleID = kebabCase(title)
    .split("-")
    .filter((item) => isNaN(Number(item)))
    .join("-");
  return `https://promptadvance.club/chatgpt-prompts/${slug}#to-${titleID}`;
};

const getBonusTitleLink = () => {
  return `https://promptadvance.club/chatgpt-prompts/${slug}#bonus-how-to-use-these-prompts-effectively`;
};

const getH2Title = (title: string, number: number) => `${number}. To ${title}`;

const nanoid = () => uuidv4().replace(/-/g, "").substring(0, 12);

const trimResponse = (choices: ChatCompletion.Choice[]) =>
  choices
    .map((choice) => choice.message?.content)
    .filter((item) => !!item)
    .join("")
    .trim();

const generateRedditIntro = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getRedditIntro(seoTitle),
      },
    ],
    temperature: 0.7,
    model: "gpt-3.5-turbo",
    max_tokens: 2048,
  });

  return trimResponse(choices);
};

const generateTitle = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getTitleContent(keyword),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 2048,
  });

  return trimResponse(choices);
};

const generatePrompt = async (task: string, role: string) => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getPrompt(task, role),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 2048,
  });

  return trimResponse(choices);
};

const generateMeta = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getMeta(seoTitle),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 2048,
  });

  return trimResponse(choices);
};

const generateIntro = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getIntro(seoTitle),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 4048,
  });

  return trimResponse(choices);
};

const generatePromptsIntro = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getPromptsIntro(seoTitle),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 4048,
  });

  return trimResponse(choices);
};

const generatePromptIntro = async (section: string) => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getPromptIntro(seoTitle, section),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 4048,
  });

  return trimResponse(choices);
};

const generateFinalThoughts = async () => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getFinalThoughts(seoTitle),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 4048,
  });

  return trimResponse(choices);
};

const generateFAQ = async (question: string) => {
  const { choices } = await openAI.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getFAQ(question),
      },
    ],
    temperature: 0.7,
    model: "gpt-4",
    max_tokens: 4048,
  });

  return trimResponse(choices);
};

const run = async () => {
  try {
    const body: any[] = [];
    // Generate details
    const title = await generateTitle();
    const description = await generateMeta();
    const promptsIntro = await generatePromptsIntro();
    const finalThoughts = await generateFinalThoughts();
    const generatedUseCases: { title: string; prompt: string }[] = [];

    // Generate body
    const intro = await generateIntro();

    // Add intro
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: intro,
        },
      ],
    });

    // Add list
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: ["strong"],
          text: `These are the best ${seoTitle}:`,
        },
      ],
    });

    for (const useCase of useCases) {
      const linkKey = nanoid();

      body.push({
        _key: nanoid(),
        level: 1,
        _type: "block",
        style: "normal",
        listItem: "number",
        markDefs: [
          {
            _type: "link",
            href: getTitleLink(useCase.title),
            _key: linkKey,
          },
        ],
        children: [
          {
            _key: nanoid(),
            _type: "span",
            marks: [linkKey],
            text: useCase.title,
          },
        ],
      });
    }

    const tipKey = nanoid();

    // Add intro suffix
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [
        {
          _type: "link",
          href: getBonusTitleLink(),
          _key: tipKey,
        },
      ],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: `In the next section, we'll take a closer look at each aspect of [something] (along with the prompt examples). And if you read till the end, you'll also find a little tip to `,
        },
        {
          _key: nanoid(),
          _type: "span",
          marks: [tipKey],
          text: `use these prompts more effectively`,
        },
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: ".",
        },
      ],
    });

    // Add Prompts Section
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "h1",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: seoTitle,
        },
      ],
    });

    // Add Prompts Section Intro
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: promptsIntro,
        },
      ],
    });

    for (const useCase of useCases) {
      const index =
        useCases.findIndex((item) => item.title === useCase.title) + 1;

      // Add title
      body.push({
        _key: nanoid(),
        _type: "block",
        style: "h2",
        markDefs: [],
        children: [
          {
            _key: nanoid(),
            _type: "span",
            marks: [],
            text: getH2Title(useCase.title, index),
          },
        ],
      });

      // Add Prompt Intro
      const promptIntro = await generatePromptIntro(useCase.title);
      body.push({
        _key: nanoid(),
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _key: nanoid(),
            _type: "span",
            marks: [],
            text: promptIntro,
          },
        ],
      });

      // Add Prompt
      const prompt = await generatePrompt(useCase.task, useCase.role);

      generatedUseCases.push({ title: useCase.title, prompt });

      body.push({
        content: prompt,
        _type: "prompt",
        _key: nanoid(),
      });
    }

    body.push({
      _type: "promptBonus",
      _key: nanoid(),
    });

    // Add Final Thoughts Title
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "h1",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: "Final Thoughts",
        },
      ],
    });

    // Add Final Thoughts Body
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: finalThoughts,
        },
      ],
    });

    // Add FAQ Title
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "h1",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: "FAQ",
        },
      ],
    });

    // Add FAQ Intro
    body.push({
      _key: nanoid(),
      _type: "block",
      style: "normal",
      markDefs: [],
      children: [
        {
          _key: nanoid(),
          _type: "span",
          marks: [],
          text: `Let's also address some of the common questions about [something]`,
        },
      ],
    });

    // Add FAQs
    for (const question of FAQ) {
      // Add Question
      body.push({
        _key: nanoid(),
        _type: "block",
        style: "h3",
        markDefs: [],
        children: [
          {
            _key: nanoid(),
            _type: "span",
            marks: [],
            text: question,
          },
        ],
      });

      // Generate answer
      const answer = await generateFAQ(question);

      // Add Answer
      body.push({
        _key: nanoid(),
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [
          {
            _key: nanoid(),
            _type: "span",
            marks: [],
            text: answer,
          },
        ],
      });
    }

    // Create markdown for Reddit post
    const redditIntro = await generateRedditIntro();

    const draftPath = `./drafts/${slug}`;

    fs.mkdirSync(draftPath);
    fs.writeFileSync(
      `${draftPath}/reddit.md`,
      getMarkdown(redditIntro, generatedUseCases, slug)
    );

    // Create markdown for IG post
    fs.writeFileSync(
      `${draftPath}/ig-reel.md`,
      getIGMarkdown(generatedUseCases)
    );

    await client.create({
      _id: `drafts.${uuidv4()}`,
      _type: "blogPost",
      title,
      seoTitle,
      description,
      category: {
        _ref: "2c2de5c8-7adc-4f80-981b-f636e4fadb56",
        _type: "reference",
      },
      slug: {
        _type: "slug",
        current: slug,
      },
      author: {
        _ref: "19d9966c-0afc-448b-8e53-24df4317dd6a",
        _type: "reference",
      },
      body,
    });
  } catch (error) {
    console.log(error);
  }
};

run();
