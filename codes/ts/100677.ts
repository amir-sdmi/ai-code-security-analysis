import { ChatCompletionMessageParam } from 'openai/resources';
import { Message } from 'telegraf/typings/core/types/typegram';

import { espiId } from '../config';
import GPT from '../core/GPT';
import { axiosClient } from '../lib/http-clients';
import BaseController from './BaseController';
import { RegexMatchedContext, VoiceMessageContext } from './types';

export default class GPTController extends BaseController {
  private static maxAudioSize = 10 * 1024 * 1024; // 10MB

  /**
   * Handle incoming question asking to ChatGPT API
   */
  static async handleQuestion(ctx: RegexMatchedContext) {
    this.showTypingAction(ctx);
    const question = (ctx.match?.groups?.question || '').trim();
    if (question.length < 7) {
      ctx.reply('Muy cortito amigo');
      return;
    }

    const reply = ctx.message.reply_to_message as Message.TextMessage;
    const contextText = reply?.text || '';
    const contextRole = reply?.from?.id === espiId ? 'system' : 'user';
    const context: ChatCompletionMessageParam | undefined = contextText
      ? { role: contextRole, content: contextText }
      : undefined;
    const answer = await GPT.ask(question, context);
    ctx.reply(answer);
  }

  /**
   * Transcript audio using ChatGPT API
   */
  static async transcriptAudio(ctx: VoiceMessageContext) {
    this.showTypingAction(ctx);
    const voice = ctx.message?.voice;
    const link = await ctx.telegram.getFileLink(voice.file_id);
    const { data: buffer } = await axiosClient.get<Uint8Array>(link.href, { responseType: 'arraybuffer' });

    // If audio is too big, don't transcribe it and return
    if (buffer.length > this.maxAudioSize) {
      ctx.reply('El audio es muy grande, no puedo transcribirlo');
      return;
    }

    // Transcript audio and reply with it
    const transcription = await GPT.transcript(buffer, ctx.message?.message_id);
    ctx.reply(transcription);
  }
}
