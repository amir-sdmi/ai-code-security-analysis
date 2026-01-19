import GPT from '../core/GPT';
import github from '../lib/github';
import logger from '../lib/logger';
import BaseController from './BaseController';
import { BaseContext, RegexMatchedContext } from './types';

export default class GitHubController extends BaseController {
  /**
   * List all open issues
   * @param ctx Context
   * @returns List of issues
   */
  static async listIssues(ctx: BaseContext) {
    this.showTypingAction(ctx);
    try {
      const issues = await github.getIssues();
      const issuesList = issues.map(issue => `\\- [\\#${issue.number}](${issue.html_url}) ${issue.title}`).join('\n');
      const content = `*Issues Abiertos*\n\n${issuesList}`;
      ctx.replyWithMarkdownV2(content, { disable_web_page_preview: true });
    } catch (error) {
      logger.error(error);
      ctx.reply('Hubo un error al obtener los issues');
    }
  }

  /**
   * Create an issue using ChatGPT API to generate the description
   * @param ctx Context
   * @returns Created issue
   */
  static async createIssue(ctx: RegexMatchedContext) {
    this.showTypingAction(ctx);
    const { title, description } = ctx.match?.groups || {};
    try {
      const user = ctx.from?.username || ctx.from?.first_name;
      const gptDescription = await GPT.issueDescription(title, description);
      const issue = await github.setIssue(title, `${gptDescription}\n\nCreado por ${user}`);

      const content = `*Issue creado*\n\n[\\#${issue.number}](${issue.html_url}) ${issue.title}`;
      ctx.replyWithMarkdownV2(content, { disable_web_page_preview: true });
    } catch (error) {
      logger.error(error);
      ctx.reply('Hubo un error al intentar crear el issue');
    }
  }
}
