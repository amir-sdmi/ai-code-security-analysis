import { ImageAnalysisService } from './imageAnalysisService';

export interface ComicPanel {
  panel: number;
  caption: string;
  imageUrl: string;
  prompt: string;
}

export interface ComicData {
  title: string;
  panels: ComicPanel[];
  theme: string;
}

export class ComicService {
  private static readonly FALLBACK_API_URL = 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5';
  
  static async generateComic(
    storyPrompt: string, 
    theme: string, 
    characterImage?: string
  ): Promise<ComicData> {
    console.log('Generating comic with:', { storyPrompt, theme, hasImage: !!characterImage });
    
    try {
      // First, analyze the uploaded image to get character description
      let characterDescription = "a young adventurer";
      if (characterImage) {
        try {
          characterDescription = await ImageAnalysisService.analyzeUploadedImage(characterImage);
          console.log('Character description:', characterDescription);
        } catch (error) {
          console.error('Failed to analyze image:', error);
        }
      }
      
      const title = this.generateTitle(storyPrompt, characterDescription);
      const storyPanels = this.generatePersonalizedStoryPanels(storyPrompt, theme, characterDescription);
      
      // Generate images for each panel
      const panelsWithImages = await Promise.all(
        storyPanels.map(async (panel, index) => {
          try {
            const imageUrl = await this.generatePanelImage(panel.prompt, theme, index, characterDescription);
            return { ...panel, imageUrl };
          } catch (error) {
            console.error(`Failed to generate image for panel ${panel.panel}:`, error);
            return {
              ...panel,
              imageUrl: this.getThemeBasedPlaceholder(theme, panel.panel)
            };
          }
        })
      );
      
      return {
        title,
        panels: panelsWithImages,
        theme
      };
    } catch (error) {
      console.error('Comic generation failed:', error);
      return this.generateMockComic(storyPrompt, theme, characterImage);
    }
  }

  private static async generatePanelImage(
    prompt: string, 
    theme: string, 
    panelIndex: number, 
    characterDescription: string
  ): Promise<string> {
    try {
      console.log(`Generating image for panel ${panelIndex + 1} with ChatGPT API`);
      
      // Import and use the API module
      const { generateComicImage } = await import('../api/generate-comic-image');
      const imageUrl = await generateComicImage(`${prompt}, ${theme} style`, characterDescription);
      
      console.log(`Successfully generated image for panel ${panelIndex + 1}`);
      return imageUrl;
    } catch (error) {
      console.error(`Failed to generate image for panel ${panelIndex + 1}:`, error);
      return this.getThemeBasedPlaceholder(theme, panelIndex + 1);
    }
  }


  private static getThemeBasedPlaceholder(theme: string, panelNumber: number): string {
    const themeEmojis = {
      adventure: '🏴‍☠️',
      space: '🚀',
      forest: '🌳',
      magic: '✨',
      ocean: '🌊',
      castle: '🏰'
    };
    
    const emoji = themeEmojis[theme as keyof typeof themeEmojis] || '🎨';
    return `https://via.placeholder.com/400x300/6366f1/ffffff?text=${emoji}+Panel+${panelNumber}`;
  }

  private static generateTitle(prompt: string, characterDescription: string): string {
    const heroName = characterDescription.includes('young') ? 'Young Hero' : 'Brave Explorer';
    const words = prompt.split(' ').slice(0, 3);
    return `${heroName}'s ${words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')} Adventure`;
  }

  private static generatePersonalizedStoryPanels(
    prompt: string, 
    theme: string, 
    characterDescription: string
  ): Omit<ComicPanel, 'imageUrl'>[] {
    const themeStories = {
      adventure: [
        `${characterDescription} discovers a mysterious treasure map hidden in an old chest`,
        `Setting sail on a brave journey across the sparkling blue ocean`,
        `Landing on a magical island filled with colorful flowers and friendly animals`,
        `Exploring ancient caves and solving clever puzzles along the way`,
        `Finding the golden treasure chest and sharing it with new friends`,
        `Returning home as a celebrated hero with amazing stories to tell`
      ],
      space: [
        `${characterDescription} builds an amazing rocket ship in the backyard`,
        `Blasting off into the starry cosmos on an incredible space adventure`,
        `Landing on a colorful alien planet with floating crystals and glowing plants`,
        `Meeting friendly alien creatures who speak in musical sounds`,
        `Working together to solve an intergalactic puzzle and save the planet`,
        `Flying home with new alien friends and cosmic wisdom`
      ],
      forest: [
        `${characterDescription} enters a magical forest where trees whisper secrets`,
        `Meeting talking woodland animals who become trusted guides`,
        `Discovering a hidden fairy ring that glows with rainbow light`,
        `Learning ancient forest magic from wise old tree spirits`,
        `Using newfound powers to help forest creatures solve their problems`,
        `Becoming the forest guardian and protector of all woodland friends`
      ],
      magic: [
        `${characterDescription} finds a glowing magic wand hidden in the attic`,
        `Learning to cast colorful spells that make flowers bloom and stars dance`,
        `Opening a shimmering portal to a wonderful fantasy realm`,
        `Meeting a wise wizard who teaches amazing magical lessons`,
        `Using magic powers to help solve problems and spread happiness`,
        `Returning home as a skilled young magician with a heart full of joy`
      ],
      ocean: [
        `${characterDescription} dives into crystal clear ocean waters`,
        `Swimming alongside playful dolphins and colorful tropical fish`,
        `Discovering an underwater city made of coral and sea shells`,
        `Meeting beautiful mermaids who show hidden ocean treasures`,
        `Helping sea creatures clean up their ocean home`,
        `Surfacing with new ocean friends and a promise to protect the seas`
      ],
      castle: [
        `${characterDescription} approaches a magnificent castle on a hilltop`,
        `Meeting a kind royal family who welcomes them with open arms`,
        `Learning about castle life and helping with royal duties`,
        `Discovering a problem that threatens the peaceful kingdom`,
        `Using cleverness and courage to save the day`,
        `Being honored as a hero in the royal court with a grand celebration`
      ]
    };

    const stories = themeStories[theme as keyof typeof themeStories] || themeStories.adventure;
    
    return stories.map((story, index) => ({
      panel: index + 1,
      caption: `Panel ${index + 1}: ${story}`,
      prompt: `${story}, ${theme} adventure, featuring ${characterDescription}`
    }));
  }

  private static generateMockComic(storyPrompt: string, theme: string, characterImage?: string): ComicData {
    const characterDescription = characterImage ? "a young adventurer" : "a brave hero";
    const mockPanels = this.generatePersonalizedStoryPanels(storyPrompt, theme, characterDescription).map(panel => ({
      ...panel,
      imageUrl: this.getThemeBasedPlaceholder(theme, panel.panel)
    }));

    return {
      title: this.generateTitle(storyPrompt, characterDescription),
      panels: mockPanels,
      theme
    };
  }

  static async generatePDF(comicData: ComicData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas not supported');
    
    canvas.width = 800;
    canvas.height = 1200;
    
    // Simple PDF-like layout
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(comicData.title, canvas.width / 2, 50);
    
    // Add panels in a grid
    const panelsPerRow = 2;
    const panelWidth = 350;
    const panelHeight = 200;
    const startX = 50;
    const startY = 100;
    
    // Load and draw images
    const imagePromises = comicData.panels.map(async (panel, index) => {
      const row = Math.floor(index / panelsPerRow);
      const col = index % panelsPerRow;
      const x = startX + col * (panelWidth + 50);
      const y = startY + row * (panelHeight + 100);
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = panel.imageUrl;
        });
        
        // Draw image
        ctx.drawImage(img, x, y, panelWidth, panelHeight);
      } catch (error) {
        console.log(`Could not load image for panel ${panel.panel}`);
        // Draw placeholder rectangle
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, panelWidth, panelHeight);
        ctx.fillStyle = 'gray';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Panel ${panel.panel}`, x + panelWidth/2, y + panelHeight/2);
      }
      
      // Add panel text
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      const words = panel.caption.split(' ');
      let line = '';
      let lineY = y + panelHeight + 20;
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > panelWidth && line !== '') {
          ctx.fillText(line, x, lineY);
          line = word + ' ';
          lineY += 20;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, x, lineY);
    });
    
    await Promise.all(imagePromises);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }
}
