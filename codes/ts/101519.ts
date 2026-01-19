import { Injectable } from '@nestjs/common';
// services
import { AiChatGPTRepository } from 'src/ai/repositories/ai.chatgpt.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramAuthRepository } from './telegram.auth.repository';
// telegram
import { AlgorithmService } from 'src/algorithm/algorithm.service';
import { ExchangeBybitRepository } from 'src/exchange/repositories/exchange.bybit.repository';
import { RobotTelegramTradeAutomationRepository } from 'src/robot/repositories/robot.telegram.trade.automation.repository';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { extractTradeDetailFromGPTResponse } from '../utils/extractTradeDetail';
// import { RobotBaseRepository } from 'src/robot/repositories/robot.base.repository';

@Injectable()
export class TelegramEventRepository {
  private queue: NewMessageEvent[] = [];
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authRepo: TelegramAuthRepository,
    private readonly chatgpt: AiChatGPTRepository,
    private readonly bybit: ExchangeBybitRepository,
    private readonly algorithmService: AlgorithmService,
    private readonly telegramTradeAutomation: RobotTelegramTradeAutomationRepository,
    // private readonly robotService: RobotBaseRepository,
  ) {
    // ** Remove this comment **
    // this.robotService.getAllUsersRobots().then(async (usersRobots) => {
    //   usersRobots.forEach((userRobot) => {
    //     if (userRobot.active) this.startListening(userRobot.usersId);
    //   });
    // });
  }

  async startListening(usersId: string) {
    try {
      // Get user session and initialize Telegram client
      const session = await this.authRepo.getUserSession(usersId);
      const client = await this.authRepo.initTelegramClient(usersId, session);

      // Fetch user exchanges and find Bybit exchange
      const userExchanges = await this.prisma.userExchanges.findFirst({
        where: {
          userId: usersId,
          exchangeId: 'bybit',
        },
      });

      // If no exchanges found, return
      if (!userExchanges) {
        console.log('No exchanges found for the user.');
        return { started: false };
      }

      // Fetch user algorithms for Bybit exchange
      const userAlgorithmsList =
        await this.algorithmService.getUserAlgorithmsByExchangeId(
          usersId,
          'bybit',
        );
      if (!userAlgorithmsList) {
        console.log('No algorithms found for the user.');
        return { started: false };
      }
      const { userAlgorithms } = userAlgorithmsList.result;

      // Start listening for new messages
      const started = await new Promise((resolve) => {
        client.addEventHandler(async (event: NewMessageEvent) => {
          this.queue.push(event);
          if (!this.processing) {
            this.processing = true;
            resolve(true);
            while (this.queue.length > 0) {
              const event = this.queue.shift()!;
              try {
                const channelId = event.chatId;
                // Check if the channel has associated algorithm
                const relatedChannelWithAlgorithm = userAlgorithms.find(
                  (al) => al.channelId === channelId.toString(),
                );

                if (!relatedChannelWithAlgorithm) {
                  // console.log(
                  //   'No related channel with algorithm found for channelId:',
                  //   channelId,
                  // );
                  return;
                }

                const message = event.message.message;
                console.log('Received message:', message);

                // Generate completion using ChatGPT
                const gptResponse = await this.chatgpt.generateCompletion(
                  message,
                  true,
                );

                // Extract trade details from GPT response
                const tradeRawDataArray =
                  extractTradeDetailFromGPTResponse(gptResponse);

                console.log(
                  `Extract trade details from GPT response ${tradeRawDataArray}`,
                );

                // If no trade data found, return
                if (!tradeRawDataArray.length) {
                  console.log('No trade data found in the message.');
                  return;
                }

                // Create order for each trade data
                tradeRawDataArray.forEach((rawData) => {
                  console.log('Creating order with data:', rawData);
                  this.bybit.createOrder(
                    usersId,
                    userExchanges.exchangeId,
                    rawData,
                  );
                });
              } catch (error) {
                console.error('Error handling new message:', error);
              } finally {
                this.processing = false;
              }
            }
          }
        }, new NewMessage({}));
      });

      if (started) {
        await this.telegramTradeAutomation.start(usersId);
      }
      return { started };
    } catch (error) {
      console.error('Error starting listening:', error);
      return { started: false };
    }
  }
}
