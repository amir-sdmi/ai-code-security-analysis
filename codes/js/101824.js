const axios = require('axios');

class NewsService {
  constructor() {
    this.sources = [
      'https://newsapi.org/v2/everything', // Example API
      // Add more news sources as needed
    ];
  }

  /**
   * Scrape and process news from various sources
   * Returns processed news items
   */
  async scrapeAndProcessNews() {
    try {
      // Mock news data for MVP - in production, integrate with real news APIs
      const mockNews = this.generateMockNews();
      
      // Process each news item (summarization, categorization)
      const processedNews = await Promise.all(
        mockNews.map(item => this.processNewsItem(item))
      );
      
      return processedNews.filter(item => item !== null);
    } catch (error) {
      console.error('Error scraping news:', error);
      return this.generateMockNews(); // Fallback to mock data
    }
  }

  /**
   * Process individual news item with AI
   */
  async processNewsItem(newsItem) {
    try {
      // Mock AI processing - in production, use Gemini API
      const processed = {
        ...newsItem,
        summary: this.generateSummary(newsItem.content),
        category: this.categorizeNews(newsItem.title),
        priority: this.assessPriority(newsItem.title, newsItem.content),
        sentiment: this.analyzeSentiment(newsItem.content),
        processedAt: new Date().toISOString()
      };
      
      return processed;
    } catch (error) {
      console.error('Error processing news item:', error);
      return null;
    }
  }

  /**
   * Generate summary using mock AI
   */
  generateSummary(content) {
    // Mock summarization - in production, use Gemini API
    const sentences = content.split('. ');
    return sentences.slice(0, 2).join('. ') + '.';
  }

  /**
   * Categorize news based on content
   */
  categorizeNews(title) {
    const categories = {
      'traffic': ['traffic', 'road', 'highway', 'congestion', 'transport'],
      'weather': ['weather', 'rain', 'storm', 'temperature', 'climate'],
      'infrastructure': ['construction', 'building', 'infrastructure', 'development'],
      'utilities': ['water', 'electricity', 'power', 'utility', 'outage'],
      'health': ['health', 'hospital', 'medical', 'healthcare', 'clinic'],
      'safety': ['police', 'crime', 'safety', 'accident', 'emergency']
    };
    
    const titleLower = title.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  /**
   * Assess priority level
   */
  assessPriority(title, content) {
    const highPriorityKeywords = ['emergency', 'urgent', 'critical', 'alert', 'breaking'];
    const mediumPriorityKeywords = ['important', 'significant', 'major'];
    
    const text = (title + ' ' + content).toLowerCase();
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Analyze sentiment
   */
  analyzeSentiment(content) {
    // Mock sentiment analysis
    const negativeWords = ['problem', 'issue', 'crisis', 'damage', 'failure'];
    const positiveWords = ['improvement', 'success', 'opening', 'launch', 'completion'];
    
    const contentLower = content.toLowerCase();
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Generate mock news for development
   */
  generateMockNews() {
    const mockNewsItems = [
      {
        id: `news_${Date.now()}_1`,
        title: 'New Metro Line Opens Next Month',
        content: 'The city announces the opening of the Blue Line metro extension, connecting downtown to the airport. This will significantly reduce travel time and ease traffic congestion in the city center.',
        publishedAt: new Date().toISOString(),
        source: 'City Transport Authority',
        location: {
          latitude: 28.6139,
          longitude: 77.2090
        },
        imageUrl: null
      },
      {
        id: `news_${Date.now()}_2`,
        title: 'Water Supply Maintenance Scheduled',
        content: 'Municipal corporation announces scheduled maintenance of water supply systems in sectors 15-18. Residents are advised to store water in advance as supply will be interrupted from 9 AM to 5 PM tomorrow.',
        publishedAt: new Date().toISOString(),
        source: 'Municipal Corporation',
        location: {
          latitude: 28.6200,
          longitude: 77.2150
        },
        imageUrl: null
      },
      {
        id: `news_${Date.now()}_3`,
        title: 'Heavy Rain Alert Issued',
        content: 'The meteorological department has issued a yellow alert for heavy rainfall in the next 48 hours. Citizens are advised to avoid waterlogged areas and take necessary precautions.',
        publishedAt: new Date().toISOString(),
        source: 'Weather Department',
        location: {
          latitude: 28.6139,
          longitude: 77.2090
        },
        imageUrl: null
      }
    ];
    
    return mockNewsItems;
  }

  /**
   * Search news by location
   */
  async getNewsByLocation(latitude, longitude, radius = 10) {
    try {
      // Mock implementation - in production, filter by actual location
      const allNews = await this.scrapeAndProcessNews();
      
      // Simple distance-based filtering (mock)
      return allNews.filter(news => {
        if (!news.location) return false;
        
        const distance = this.calculateDistance(
          latitude, longitude,
          news.location.latitude, news.location.longitude
        );
        
        return distance <= radius;
      });
    } catch (error) {
      console.error('Error getting news by location:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates (in km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new NewsService();