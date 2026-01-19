import createDebug from 'debug';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';
import { Context } from 'telegraf';

const debug = createDebug('bot:command_summarize');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarize(ctx: CommandContextExtn & Context) {
  debug('Triggered "summarize" command with args:', ctx.args);

  if (ctx.args.length === 0) {
    ctx.reply('Please provide a URL to summarize');
    return;
  }

  const url = ctx.args[0];
  if (!isValidUrl(url)) {
    ctx.reply(`Invalid URL provided: ${url}`);
    return;
  }

  const loadingMessage = await ctx.reply('Processing the link… ⌛️');

  try {
    const summary = await getSummary(url);
    if (!summary) {
      ctx.deleteMessage(loadingMessage.message_id);
      ctx.reply('Failed to extract content from the link');
      return;
    }

    const sanitized = escapeTelegramMarkdown(summary);

    debug('Sending summary:', sanitized);
    ctx.deleteMessage(loadingMessage.message_id);
    ctx.replyWithMarkdownV2(sanitized);
  } catch (error) {
    console.log('Error processing link:', error);
    ctx.reply('Failed to process the link' + error);
  }
}

async function getSummary(url: string): Promise<string | null> {
  try {
    // Fetch the web page content
    const response = await fetch(url);
    const html = await response.text();

    // Extract main content
    const mainContent = extractMainContent(html);
    if (!isValidContent(mainContent)) {
      return null;
    }

    // Send the main content to ChatGPT API for processing
    return await sendToChatGPT(mainContent);
  } catch (error) {
    throw new Error('Failed to process the link');
  }
}

function isValidContent(content: string): boolean {
  return content.length > 100;
}

function extractMainContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove unnecessary elements
  $('script, style, nav, header, footer, aside, iframe').remove();

  // Extract text from body or main content area
  let content = $('main').text() || $('article').text() || $('body').text();

  debug('Extracted content:', content);

  // Clean up the content
  content = content.replace(/\s+/g, ' ').trim();

  return content;
}

const prompt = `
  Summarize the main points from the content below.
  DON'T include read more sentences or unnecessary details.
  YOU MUST use Telegram MarkdownV2 format for
  API response. For example, use *** for bold, ___ for italic.
`;

async function sendToChatGPT(content: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarizes the main content from web pages.',
        },
        {
          role: 'user',
          content: `${prompt}\n${content}`,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No content extracted';
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw new Error('Failed to process content with ChatGPT');
  }
}

function escapeTelegramMarkdown(text: string): string {
  return text
    .replace(/_/g, '\\\_')
    .replace(/\[/g, '\\\[')
    .replace(/\]/g, '\\\]')
    .replace(/`/g, '\\\`')
    .replace(/\#/g, '\\\#')
    .replace(/\./g, '\\\.')
    .replace(/\-/g, '\\\-')
    .replace(/\(/g, '\\\(')
    .replace(/\)/g, '\\\)')
    .replace(/\!/g, '\\\!');
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
