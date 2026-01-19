import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
import { NFTBaseData } from 'src/models';
import { PinataSDK } from 'pinata';
import { CreateNFTMetadataRequest } from './app.controller';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI();

@Injectable()
export class AppService {
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl: string =
    'https://api.openai.com/v1/chat/completions';
  private readonly pinata: PinataSDK;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.pinata = new PinataSDK({
      pinataJwt: this.configService.get<string>('PINATA_JWT'),
      pinataGateway: this.configService.get<string>('GATEWAY_URL'),
    });
  }

  async getChatGptResponse(prompt: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.openaiApiKey}`,
    };

    const data = {
      model: 'gpt-4', // Use the model you have access to
      messages: [{ role: 'user', content: prompt }],
    };

    try {
      const response = await axios.post(this.openaiApiUrl, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error communicating with ChatGPT API', error);
      throw error;
    }
  }

  async analyzeImage(image: string) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Write me what item is on the image. You answer should containt two sentence. First, the name of the image (max 20 char.). Second, the description (max 100 char.). There should not be anything else in answer. Only these two sentence. No fields name. Sentences should be separated by dot, not other sign. If you doubt a lot on what is on the image just give it some fancy name and description.',
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
    });
    return response;
  }

  private getShakeNFTsPrompt(data: NFTBaseData[]) {
    const formattedNFTs = data.map((nft, index) => {
      return `${index + 1}. Name: ${nft.name}.`;
    });
    const combination = formattedNFTs.join(' ');
    return `Please generate a unique image that combines the following items: ${combination}.`;
  }

  async shakeNFTs(data: NFTBaseData[]) {
    const shakeNFTsPrompt = this.getShakeNFTsPrompt(data);
    console.log('shakeNFTsPrompt: ', shakeNFTsPrompt);
    const openaiImage = await openai.images.generate({
      model: 'dall-e-2',
      prompt: shakeNFTsPrompt,
      n: 1,
      size: '256x256',
      response_format: 'url', // url or b64_json
    });
    console.log('openaiImage.data[0].url: ', openaiImage.data[0].url);
    const analyzeImageResponse = await this.analyzeImage(
      openaiImage.data[0].url,
    );
    const content = analyzeImageResponse.choices[0].message.content;
    console.log('content: ', content);
    const fields = content.split('.').map((i) => i.trim());
    const metadata: CreateNFTMetadataRequest = {
      name: fields[0],
      description: fields[1],
      imageUrl: openaiImage.data[0].url,
    };
    console.log('metadata: ', metadata);
    const response = await this.createNFTMetadata(metadata, 'url');
    return response;
  }

  private combineNFTsTextsToPrompt(nftArray: NFTBaseData[]): string {
    const formattedNFTs = nftArray.map((nft, index) => {
      return `${index + 1}. Name: ${nft.name}.`;
    });
    const combination = formattedNFTs.join(' ');
    return `Please generate a unique image that combines the following items. Provide a new name and a brief description (maximum 200 characters) for the generated image. Here is the input data: ${combination}.`;
  }

  async createNFTMetadata(
    data: CreateNFTMetadataRequest,
    type: 'url' | 'base64',
  ) {
    try {
      const id = uuidv4();
      let uploadImageResponse;
      if (type === 'url') {
        uploadImageResponse = await this.pinata.upload.url(data.imageUrl, {
          metadata: { name: `${id}_${data.name}` },
        });
      } else if (type === 'base64') {
        uploadImageResponse = await this.pinata.upload.base64(
          data.imageUrl.split(',')[1],
          {
            metadata: { name: `${id}_${data.name}` },
          },
        );
      }

      const json = JSON.stringify({
        name: data.name,
        description: data.description,
        image: `${this.pinata.config.pinataGateway}/ipfs/${uploadImageResponse.IpfsHash}`,
      });
      const file = new File([json], `${id}.json`, {
        type: 'application/json',
      });
      const uploadJsonResponse = await this.pinata.upload.file(file);
      return uploadJsonResponse;
    } catch (error) {
      console.log(error);
    }
  }
}
