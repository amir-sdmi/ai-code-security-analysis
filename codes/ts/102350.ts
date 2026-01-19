/**
 * Unified AI Service
 * Combines DeepSeek and Gemini capabilities for comprehensive AI features
 */

import { DeepSeekService } from './deepseek-service';
import { GeminiService } from './gemini-service';
import { 
  AIResponse, 
  AISearchQuery, 
  VisionAnalysis, 
  ProductRecognition,
  SmartQRContent,
  NFCPayload,
  P2POrderTracking,
  AIRecommendation
} from './types';

export class UnifiedAIService {
  private deepseek: DeepSeekService;
  private gemini: GeminiService;
  private cacheEnabled: boolean = true;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(deepseekKey: string, geminiKey: string) {
    this.deepseek = new DeepSeekService(deepseekKey);
    this.gemini = new GeminiService(geminiKey);
  }

  /**
   * Intelligent product search combining text and visual inputs
   */
  async smartSearch(query: AISearchQuery, image?: string | Buffer): Promise<AIResponse> {
    try {
      // If image is provided, use hybrid search
      if (image) {
        const [textResults, visualResults] = await Promise.all([
          this.deepseek.searchProducts(query),
          this.gemini.findSimilarProducts(image, []) // Will need product catalog
        ]);

        return {
          success: true,
          data: {
            searchType: 'hybrid',
            textResults: textResults.data,
            visualResults: visualResults,
            combined: this.combineSearchResults(textResults.data, visualResults)
          }
        };
      }

      // Text-only search
      return await this.deepseek.searchProducts(query);
    } catch (error) {
      console.error('Smart search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate enhanced QR codes with AI-optimized content
   */
  async generateSmartQR(type: string, data: any): Promise<SmartQRContent> {
    const cacheKey = `qr-${type}-${JSON.stringify(data)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Generate optimized content with DeepSeek
      const qrResponse = await this.deepseek.generateQRContent(type, data);
      
      if (!qrResponse.success) {
        throw new Error(qrResponse.error || 'QR generation failed');
      }

      const smartQR: SmartQRContent = {
        version: 1,
        type: type as any,
        payload: qrResponse.data.qrPayload,
        metadata: {
          created: new Date(),
          expires: this.calculateExpiry(type),
          aiGenerated: true,
          security: {
            signature: this.generateSignature(qrResponse.data.qrPayload),
            algorithm: 'SHA256'
          }
        }
      };

      this.setCache(cacheKey, smartQR);
      return smartQR;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analyze product for automatic listing creation
   */
  async analyzeProductForListing(image: string | Buffer, vendorContext?: any): Promise<AIResponse> {
    try {
      // Get visual analysis from Gemini
      const visualAnalysis = await this.gemini.analyzeProductImage(image);
      
      if (!visualAnalysis.success) {
        return { success: false, error: visualAnalysis.error };
      }

      // Generate enhanced description with DeepSeek
      const descriptionData = {
        productType: visualAnalysis.productType,
        features: visualAnalysis.features,
        suggestedName: visualAnalysis.suggestedName,
        vendorContext
      };

      const enhancedDescription = await this.deepseek.generateProductDescription(descriptionData);

      // Combine results
      return {
        success: true,
        data: {
          visual: visualAnalysis,
          description: enhancedDescription.data,
          listing: {
            name: visualAnalysis.suggestedName,
            category: visualAnalysis.category,
            description: enhancedDescription.data?.description || visualAnalysis.description,
            features: [...visualAnalysis.features, ...(enhancedDescription.data?.features || [])],
            tags: this.generateTags(visualAnalysis, enhancedDescription.data),
            pricing: this.suggestPricing(visualAnalysis.category, visualAnalysis.quality.score)
          }
        }
      };
    } catch (error) {
      console.error('Product analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Smart NFC tag programming
   */
  async generateNFCPayload(type: string, data: any): Promise<NFCPayload> {
    try {
      // Generate compact payload for NFC constraints
      const qrContent = await this.generateSmartQR(type, data);
      
      const nfcPayload: NFCPayload = {
        tagId: this.generateTagId(),
        type: type as any,
        data: {
          primary: {
            id: data.id,
            type: type,
            v: 1 // version
          },
          fallback: `https://kfar.market/${type}/${data.id}`,
          actions: this.generateNFCActions(type, data)
        },
        security: {
          encrypted: false, // Can be enhanced based on requirements
          signature: qrContent.metadata.security.signature
        }
      };

      return nfcPayload;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process P2P order with smart tracking
   */
  async createP2PTracking(orderData: any): Promise<P2POrderTracking> {
    try {
      // Generate unique verification codes
      const verificationQR = await this.generateSmartQR('p2p', {
        orderId: orderData.id,
        buyer: orderData.buyerId,
        seller: orderData.sellerId
      });

      const tracking: P2POrderTracking = {
        orderId: orderData.id,
        status: 'pending',
        participants: {
          buyer: orderData.buyerId,
          seller: orderData.sellerId
        },
        timeline: [{
          event: 'Order created',
          timestamp: new Date(),
          verified: true
        }],
        verification: {
          method: 'qr',
          code: verificationQR.metadata.security.signature.substring(0, 8),
          expiresAt: verificationQR.metadata.expires
        }
      };

      return tracking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate personalized recommendations
   */
  async getRecommendations(userId: string, context?: any): Promise<AIRecommendation[]> {
    try {
      const searchQuery: AISearchQuery = {
        text: 'personalized product recommendations',
        context: {
          userId,
          preferences: context?.preferences || [],
          history: context?.history || []
        }
      };

      const recommendations = await this.deepseek.searchProducts(searchQuery);
      
      if (!recommendations.success) return [];

      // Transform to recommendation format
      return (recommendations.data?.suggestions || []).map((item: any) => ({
        productId: item.id || '',
        score: item.score || 0.7,
        reason: item.reason || 'Based on your preferences',
        personalized: true,
        tags: item.tags || []
      }));
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  /**
   * Multi-language support
   */
  async translateContent(content: string | any, targetLanguage: string): Promise<any> {
    if (typeof content === 'string') {
      return await this.deepseek.translate(content, targetLanguage);
    }

    // Handle object translation
    const translatedObj: any = {};
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'string') {
        const translation = await this.deepseek.translate(value, targetLanguage);
        translatedObj[key] = translation.translatedText;
      } else {
        translatedObj[key] = value;
      }
    }

    return translatedObj;
  }

  /**
   * Verify product quality for vendors
   */
  async verifyProductQuality(image: string | Buffer, productType: string): Promise<AIResponse> {
    return await this.gemini.assessProductQuality(image, productType);
  }

  /**
   * Generate insights for vendors
   */
  async generateVendorInsights(vendorId: string, data: any): Promise<AIResponse> {
    try {
      const prompt = {
        text: `Generate business insights for vendor ${vendorId}`,
        context: {
          salesData: data.sales,
          products: data.products,
          customerFeedback: data.feedback
        }
      };

      const insights = await this.deepseek.searchProducts(prompt);
      
      return {
        success: true,
        data: {
          insights: insights.data,
          recommendations: await this.generateBusinessRecommendations(data)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods
  
  private combineSearchResults(textResults: any, visualResults: any): any[] {
    const combined = new Map();
    
    // Add text results with weights
    textResults?.suggestions?.forEach((item: any) => {
      combined.set(item.id, {
        ...item,
        score: (item.score || 0.5) * 0.6, // 60% weight for text
        source: ['text']
      });
    });

    // Add/update with visual results
    visualResults?.matches?.forEach((match: any) => {
      const existing = combined.get(match.productId);
      if (existing) {
        existing.score += match.similarity * 0.4; // 40% weight for visual
        existing.source.push('visual');
      } else {
        combined.set(match.productId, {
          id: match.productId,
          score: match.similarity * 0.4,
          source: ['visual']
        });
      }
    });

    // Sort by combined score
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Top 20 results
  }

  private calculateExpiry(type: string): Date {
    const expiry = new Date();
    switch (type) {
      case 'payment':
        expiry.setMinutes(expiry.getMinutes() + 5); // 5 minutes
        break;
      case 'p2p':
        expiry.setHours(expiry.getHours() + 24); // 24 hours
        break;
      case 'collection':
        expiry.setHours(expiry.getHours() + 48); // 48 hours
        break;
      default:
        expiry.setDate(expiry.getDate() + 30); // 30 days
    }
    return expiry;
  }

  private generateSignature(data: any): string {
    // Simple signature generation - should use proper crypto in production
    const str = JSON.stringify(data);
    
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        // Browser environment with crypto support
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else if (typeof global !== 'undefined' && global.crypto && global.crypto.randomBytes) {
        // Node.js environment
        return global.crypto.randomBytes(32).toString('hex');
      } else {
        // Try require crypto for Node.js
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
      }
    } catch (e) {
      // Complete fallback using multiple entropy sources
      const timestamp = Date.now();
      const random1 = Math.random().toString(36).substr(2);
      const random2 = Math.random().toString(36).substr(2);
      const dataHash = str.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      return `${timestamp}${random1}${random2}${Math.abs(dataHash)}`
        .padEnd(64, '0')
        .substr(0, 64);
    }
  }

  private generateTagId(): string {
    return `NFC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNFCActions(type: string, data: any): any[] {
    const baseUrl = 'https://kfar.market';
    const actions = [];

    switch (type) {
      case 'product':
        actions.push(
          { type: 'view', label: 'View Product', url: `${baseUrl}/product/${data.id}` },
          { type: 'cart', label: 'Add to Cart', data: { productId: data.id } }
        );
        break;
      case 'vendor':
        actions.push(
          { type: 'view', label: 'Visit Store', url: `${baseUrl}/store/${data.id}` },
          { type: 'follow', label: 'Follow Vendor', data: { vendorId: data.id } }
        );
        break;
      case 'collection':
        actions.push(
          { type: 'unlock', label: 'Open Locker', data: { lockerId: data.lockerId } },
          { type: 'confirm', label: 'Confirm Pickup', data: { orderId: data.orderId } }
        );
        break;
    }

    return actions;
  }

  private generateTags(visual: VisionAnalysis, description: any): string[] {
    const tags = new Set<string>();
    
    // Add visual-based tags
    visual.features.forEach(f => tags.add(f.toLowerCase()));
    if (visual.category) tags.add(visual.category.toLowerCase());
    
    // Add description-based tags
    if (description?.keywords) {
      description.keywords.forEach((k: string) => tags.add(k.toLowerCase()));
    }
    
    // Add quality tags
    if (visual.quality.score >= 8) tags.add('premium');
    if (visual.quality.score >= 6) tags.add('fresh');
    
    return Array.from(tags);
  }

  private suggestPricing(category: string, qualityScore: number): any {
    // Basic pricing suggestion logic
    const basePrices: Record<string, number> = {
      'produce': 15,
      'dairy-alternatives': 25,
      'meat-alternatives': 45,
      'beverages': 20,
      'snacks': 18,
      'prepared-foods': 35
    };

    const base = basePrices[category] || 20;
    const qualityMultiplier = 0.8 + (qualityScore / 10) * 0.4; // 0.8x to 1.2x based on quality
    
    return {
      suggested: Math.round(base * qualityMultiplier),
      range: {
        min: Math.round(base * qualityMultiplier * 0.8),
        max: Math.round(base * qualityMultiplier * 1.2)
      },
      confidence: qualityScore / 10
    };
  }

  private async generateBusinessRecommendations(data: any): Promise<string[]> {
    const recommendations = [];
    
    // Simple rule-based recommendations
    if (data.sales?.trend === 'declining') {
      recommendations.push('Consider promotional pricing for slow-moving items');
    }
    if (data.products?.some((p: any) => p.stock < 10)) {
      recommendations.push('Restock low inventory items');
    }
    if (data.feedback?.averageRating < 4) {
      recommendations.push('Address customer feedback to improve ratings');
    }
    
    return recommendations;
  }

  // Cache management
  
  private getCached(key: string): any {
    if (!this.cacheEnabled) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.cacheEnabled) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Cleanup old entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}