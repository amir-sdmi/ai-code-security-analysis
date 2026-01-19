// AI Services for Movie App - Enhanced with Gemini AI
import { Movie } from "@/types";
import tmdbClient from "@/lib/tmdb-client";
import { geminiAI } from "@/lib/gemini-ai";

export interface UserPreferences {
  favoriteGenres: number[];
  preferredActors: number[];
  watchedMovies: number[];
  ratedMovies: { id: number; rating: number; timestamp: Date }[];
  moodHistory: { mood: string; movies: number[]; timestamp: Date }[];
  searchHistory: string[];
}

export interface AIRecommendation {
  movie: Movie;
  confidence: number;
  reasons: string[];
  category:
    | "genre_match"
    | "actor_preference"
    | "mood_based"
    | "similar_users"
    | "trending";
}

export interface MoodAnalysis {
  primaryMood: string;
  confidence: number;
  recommendedGenres: string[];
  suggestedTone: "light" | "serious" | "adventurous" | "romantic" | "thrilling";
}

export interface ReviewSummary {
  overallSentiment: "positive" | "negative" | "mixed";
  keyPoints: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  themes: string[];
  rating: number;
  trustScore: number;
}

export interface IntelligentCollection {
  id: string;
  name: string;
  description: string;
  movies: Movie[];
  theme: string;
  generatedAt: Date;
  confidence: number;
}

export interface VisualSearchResult {
  movie: Movie;
  confidence: number;
  matchedScene?: string;
  timestamp?: string;
}

export interface UserInteraction {
  type: "watch" | "rate" | "search" | "mood";
  data: {
    movieId?: number;
    rating?: number;
    query?: string;
  };
}

// Mock AI Service Implementation
export class AIMovieService {
  private static instance: AIMovieService;
  private userPreferences: UserPreferences = {
    favoriteGenres: [],
    preferredActors: [],
    watchedMovies: [],
    ratedMovies: [],
    moodHistory: [],
    searchHistory: [],
  };

  static getInstance(): AIMovieService {
    if (!AIMovieService.instance) {
      AIMovieService.instance = new AIMovieService();
    }
    return AIMovieService.instance;
  }

  // Smart Recommendations - Enhanced with Gemini AI
  async getSmartRecommendations(): Promise<AIRecommendation[]> {
    // Show loading state
    await this.delay(1000);

    try {
      // Get user's watch history (simulated for demo)
      const userHistory = await this.getUserWatchHistory();

      // Use Gemini AI to generate intelligent recommendations
      const geminiResult = await geminiAI.generateSmartRecommendations(
        userHistory,
        undefined // mood
      );

      // Transform Gemini results into our format
      const recommendations: AIRecommendation[] =
        geminiResult.recommendations.map((movie, index) => ({
          movie,
          confidence: Math.max(
            0.7,
            geminiResult.analysis.confidence - index * 0.05
          ),
          reasons: [
            ...geminiResult.analysis.reasoning,
            `AI confidence: ${(geminiResult.analysis.confidence * 100).toFixed(
              0
            )}%`,
            "Powered by Google Gemini AI",
          ],
          category:
            index === 0
              ? "genre_match"
              : index === 1
              ? "similar_users"
              : index === 2
              ? "trending"
              : "mood_based",
        }));

      return recommendations.slice(0, 6); // Limit to 6 recommendations
    } catch (error) {
      console.error("Gemini AI recommendation error:", error);
      return this.fallbackRecommendations();
    }
  }

  // Movie Mood Detector - Enhanced with Gemini AI
  async detectMoodAndRecommend(moodDescription: string): Promise<{
    analysis: MoodAnalysis;
    recommendations: Movie[];
  }> {
    await this.delay(1500);

    try {
      // Use Gemini AI for sophisticated mood analysis
      const geminiResult = await geminiAI.analyzeMoodAndRecommend(
        moodDescription,
        { currentActivity: "mood-based-search" }
      );

      const analysis: MoodAnalysis = {
        primaryMood: geminiResult.mood,
        confidence: geminiResult.confidence,
        recommendedGenres: geminiResult.reasoning.slice(0, 3), // Use reasoning as genres
        suggestedTone: this.convertMoodToTone(geminiResult.mood),
      };

      // Gemini provides the movie recommendations
      const recommendations = geminiResult.movies.map((movie) => ({
        ...movie,
        overview: `${movie.overview} - AI selected for your ${geminiResult.mood} mood`,
      }));

      return { analysis, recommendations };
    } catch (error) {
      console.error("Gemini mood detection error:", error);
      // Fallback to simple mood detection
      return this.fallbackMoodDetection(moodDescription);
    }
  }

  // Visual Search - Enhanced with Gemini AI (Mock implementation)
  async searchByImage(): Promise<VisualSearchResult[]> {
    await this.delay(3000);

    try {
      // In a real implementation, this would use computer vision API
      // For demo purposes, we'll return some popular/trending movies as "matches"
      const searchResults = await tmdbClient.getTrendingMovies("day");

      if (searchResults.results.length > 0) {
        // Return first few results as potential matches
        return searchResults.results.slice(0, 2).map((movie, index) => ({
          movie: {
            ...movie,
            overview: "Visual match found in uploaded scene",
          },
          confidence: 0.87 - index * 0.1, // Decreasing confidence for subsequent results
          matchedScene:
            index === 0 ? "Action sequence" : "Character dialogue scene",
          timestamp: index === 0 ? "1:23:45" : "0:45:12",
        }));
      }

      return [];
    } catch (error) {
      console.error("Error in visual search:", error);
      return [];
    }
  }

  // AI Reviews Summary - Enhanced with Gemini AI
  async summarizeReviews(): Promise<ReviewSummary> {
    await this.delay(1500);

    try {
      // In a real implementation, we'd fetch actual reviews from TMDB or other sources
      // For demo, we'll simulate reviews and use Gemini for analysis
      const mockReviews = [
        "Amazing cinematography and storytelling, truly a masterpiece!",
        "The acting was phenomenal, especially the lead performances.",
        "A bit slow in the middle, but the ending was worth it.",
        "Not what I expected, but still a solid film overall.",
        "Incredible visual effects and sound design.",
      ];

      // Use Gemini AI for intelligent review analysis
      const geminiResult = await geminiAI.summarizeReviews(
        "Current Movie", // In real app, this would be the actual movie title
        mockReviews
      );

      return {
        overallSentiment: geminiResult.sentiment,
        keyPoints: {
          positive: geminiResult.keyPoints.positive,
          negative: geminiResult.keyPoints.negative,
          neutral: [], // Add the missing neutral field
        },
        themes: geminiResult.keyPoints.themes,
        rating: 8.5, // Could be calculated from review sentiment
        trustScore: geminiResult.trustScore,
      };
    } catch (error) {
      console.error("Gemini review analysis error:", error);
      // Fallback to mock analysis
      return {
        overallSentiment: "positive",
        keyPoints: {
          positive: [
            "Outstanding cinematography and visual effects",
            "Compelling character development and performances",
          ],
          negative: ["Pacing issues in the second act"],
          neutral: ["Runtime may not suit all viewers"],
        },
        themes: ["heroism", "sacrifice", "redemption"],
        rating: 8.2,
        trustScore: 0.75,
      };
    }
  }

  // Intelligent Collections Generator - Enhanced with Gemini AI
  async generateIntelligentCollections(): Promise<IntelligentCollection[]> {
    await this.delay(2000);

    try {
      // Use Gemini AI to generate intelligent, themed collections
      const geminiResult = await geminiAI.generateIntelligentCollections(
        "personalized collections",
        this.userPreferences
      );

      // Return Gemini-generated collections or fallback to TMDB-based ones
      if (geminiResult.collections.length > 0) {
        return geminiResult.collections.map((collection, index) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          movies: collection.movies,
          theme:
            index === 0 ? "discovery" : index === 1 ? "wellness" : "trending",
          generatedAt: new Date(),
          confidence: collection.confidence,
        }));
      }

      // Fallback to TMDB-based collections if Gemini fails
      const [popularMovies, topRatedMovies] = await Promise.all([
        tmdbClient.getPopularMovies(1),
        tmdbClient.getTopRatedMovies(1),
      ]);

      return [
        {
          id: "ai-hidden-gems",
          name: "AI-Selected Hidden Gems",
          description: "Underrated masterpieces discovered by AI analysis",
          movies: topRatedMovies.results.slice(5, 10),
          theme: "discovery",
          generatedAt: new Date(),
          confidence: 0.85,
        },
        {
          id: "ai-mood-boosters",
          name: "AI Mood Enhancement Collection",
          description: "Films scientifically proven to improve your mood",
          movies: popularMovies.results.slice(0, 6),
          theme: "wellness",
          generatedAt: new Date(),
          confidence: 0.82,
        },
      ];
    } catch (error) {
      console.error("Gemini collection generation error:", error);
      return this.fallbackCollections();
    }
  }

  // Fallback collections when AI is unavailable
  private async fallbackCollections(): Promise<IntelligentCollection[]> {
    try {
      const popular = await tmdbClient.getPopularMovies(1);
      return [
        {
          id: "fallback-popular",
          name: "Popular Movies",
          description: "Currently popular movies",
          movies: popular.results.slice(0, 8),
          theme: "trending",
          generatedAt: new Date(),
          confidence: 0.6,
        },
      ];
    } catch (error) {
      console.error("Error generating intelligent collections:", error);
      // Fallback to empty collections if TMDB fails
      return [
        {
          id: "empty-collection",
          name: "Collections Unavailable",
          description: "Unable to generate collections at this time",
          movies: [],
          theme: "discovery",
          generatedAt: new Date(),
          confidence: 0.0,
        },
      ];
    }
  }

  // Update user preferences based on interactions
  updateUserPreferences(interaction: UserInteraction) {
    switch (interaction.type) {
      case "watch":
        if (interaction.data.movieId) {
          this.userPreferences.watchedMovies.push(interaction.data.movieId);
        }
        break;
      case "rate":
        if (interaction.data.movieId && interaction.data.rating) {
          this.userPreferences.ratedMovies.push({
            id: interaction.data.movieId,
            rating: interaction.data.rating,
            timestamp: new Date(),
          });
        }
        break;
      case "search":
        if (interaction.data.query) {
          this.userPreferences.searchHistory.push(interaction.data.query);
        }
        break;
    }
  }

  private getMoodGenres(mood: string): string[] {
    const genreMap: Record<string, string[]> = {
      happy: ["Comedy", "Animation", "Family", "Musical"],
      sad: ["Drama", "Romance", "Biography"],
      excited: ["Action", "Adventure", "Thriller", "Science Fiction"],
      romantic: ["Romance", "Drama", "Comedy"],
      adventurous: ["Adventure", "Action", "Fantasy", "Science Fiction"],
    };
    return genreMap[mood] || ["Drama", "Comedy"];
  }

  private getMoodTone(
    mood: string
  ): "light" | "serious" | "adventurous" | "romantic" | "thrilling" {
    const toneMap: Record<
      string,
      "light" | "serious" | "adventurous" | "romantic" | "thrilling"
    > = {
      happy: "light",
      sad: "serious",
      excited: "thrilling",
      romantic: "romantic",
      adventurous: "adventurous",
    };
    return toneMap[mood] || "light";
  }

  // Helper method to convert mood to tone for Gemini AI integration
  private convertMoodToTone(
    mood: string
  ): "light" | "serious" | "adventurous" | "romantic" | "thrilling" {
    const moodToTone: Record<
      string,
      "light" | "serious" | "adventurous" | "romantic" | "thrilling"
    > = {
      happy: "light",
      cheerful: "light",
      upbeat: "light",
      sad: "serious",
      melancholy: "serious",
      depressed: "serious",
      excited: "thrilling",
      thrilled: "thrilling",
      pumped: "thrilling",
      romantic: "romantic",
      love: "romantic",
      adventure: "adventurous",
      adventurous: "adventurous",
      explore: "adventurous",
    };
    return moodToTone[mood.toLowerCase()] || "light";
  }

  // Fallback mood detection when Gemini AI is unavailable
  private async fallbackMoodDetection(moodDescription: string): Promise<{
    analysis: MoodAnalysis;
    recommendations: Movie[];
  }> {
    const moodKeywords = {
      happy: ["happy", "joy", "cheerful", "upbeat", "fun"],
      sad: ["sad", "depressed", "melancholy", "crying", "emotional"],
      excited: ["excited", "thrilled", "pumped", "energetic"],
      romantic: ["romantic", "love", "date night", "relationship"],
      adventurous: ["adventure", "explore", "journey", "travel"],
    };

    let detectedMood = "neutral";
    let confidence = 0.5;

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const matches = keywords.filter((keyword) =>
        moodDescription.toLowerCase().includes(keyword)
      );
      if (matches.length > 0) {
        detectedMood = mood;
        confidence = Math.min(0.95, 0.6 + matches.length * 0.1);
        break;
      }
    }

    const analysis: MoodAnalysis = {
      primaryMood: detectedMood,
      confidence,
      recommendedGenres: this.getMoodGenres(detectedMood),
      suggestedTone: this.getMoodTone(detectedMood),
    };

    try {
      const trending = await tmdbClient.getTrendingMovies("day");
      const recommendations = trending.results.slice(0, 4).map((movie) => ({
        ...movie,
        overview: `Fallback recommendation for ${detectedMood} mood`,
      }));

      return { analysis, recommendations };
    } catch (error) {
      console.error("Fallback mood detection error:", error);
      return {
        analysis,
        recommendations: [],
      };
    }
  }

  // Helper method to get user's watch history (simulated)
  private async getUserWatchHistory(): Promise<Movie[]> {
    try {
      // In a real app, this would fetch from user's actual history
      // For demo, we'll use a mix of popular and trending movies
      const [popular, trending] = await Promise.all([
        tmdbClient.getPopularMovies(1),
        tmdbClient.getTrendingMovies("week"),
      ]);

      // Return a mix as simulated user history
      return [...popular.results.slice(0, 3), ...trending.results.slice(0, 2)];
    } catch (error) {
      console.error("Error fetching user history:", error);
      return [];
    }
  }

  // Fallback recommendations when Gemini AI is unavailable
  private async fallbackRecommendations(): Promise<AIRecommendation[]> {
    try {
      const popular = await tmdbClient.getPopularMovies(1);
      return popular.results.slice(0, 3).map((movie, index) => ({
        movie,
        confidence: 0.7 - index * 0.1,
        reasons: ["Popular recommendation", "Fallback mode active"],
        category: "trending" as const,
      }));
    } catch (error) {
      console.error("Fallback recommendations error:", error);
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiService = AIMovieService.getInstance();
