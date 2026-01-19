// Purpose: DTO for game data in games controller.
// Used Github Copilot to generate the class
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GameDTO {
  // For all the ApiProperty decorators, I used the example value from the provided JSON file with ChatGPT's response
  @ApiProperty({
    description: 'Unique identifier for the game',
    example: 'playngo_legacy-of-dead',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Slug for the game, typically used in URLs',
    example: 'playngo-legacy-of-dead',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    description: 'Title of the game',
    example: 'Legacy of Dead',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Name of the provider of the game',
    example: 'Play\'n GO',
  })
  @IsString()
  providerName: string;

  @ApiProperty({
    description: 'URL to the thumbnail image of the game',
    example: '//images.ctfassets.net/5acrbcz937qe/3tqUiWTXh5AbOmcyQoR7zJ/606fcd268a6a24c14ba86ad55dc8d4cd/LegacyOfDead_280x280.jpg',
  })
  @IsUrl()
  thumbUrl: string;

  constructor(id: string, slug: string, title: string, providerName: string, thumbUrl: string) {
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.providerName = providerName;
    this.thumbUrl = thumbUrl;
  }
}
