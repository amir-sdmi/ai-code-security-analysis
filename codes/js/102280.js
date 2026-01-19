const admin = require('firebase-admin');

class ReportsService {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Process newly created report
   */
  async processNewReport(reportId, reportData) {
    try {
      console.log('Processing new report:', reportId);

      // Validate report data
      const validationResult = this.validateReport(reportData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid report data: ${validationResult.errors.join(', ')}`);
      }

      // AI-powered categorization and priority assessment
      const aiAnalysis = await this.analyzeWithAI(reportData);
      
      // Geocoding and location validation
      const locationData = await this.enrichLocationData(reportData.location);
      
      // Update report with processed information
      const processedData = {
        ...reportData,
        aiAnalysis,
        locationData,
        status: 'pending',
        priority: aiAnalysis.priority || 'medium',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        assignedTo: null,
        estimatedResolution: this.calculateEstimatedResolution(aiAnalysis.priority, reportData.category)
      };

      await this.db.collection('reports').doc(reportId).update(processedData);

      // Create activity log
      await this.createActivityLog(reportId, 'created', {
        message: 'Report created and processed',
        processedBy: 'system'
      });

      // Assign to appropriate department
      await this.assignToDepart reportment(reportId, reportData.category);

      console.log('Report processed successfully:', reportId);
      return { success: true, analysis: aiAnalysis };
    } catch (error) {
      console.error('Error processing report:', error);
      
      // Create error log
      await this.createActivityLog(reportId, 'error', {
        message: 'Failed to process report',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Validate report data
   */
  validateReport(reportData) {
    const errors = [];
    
    if (!reportData.title || reportData.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    
    if (!reportData.description || reportData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    
    if (!reportData.category) {
      errors.push('Category is required');
    }
    
    if (!reportData.location || !reportData.location.latitude || !reportData.location.longitude) {
      errors.push('Valid location coordinates are required');
    }
    
    // Validate location bounds (example for a city)
    if (reportData.location) {
      const { latitude, longitude } = reportData.location;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        errors.push('Invalid location coordinates');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * AI analysis of report content (mocked for MVP)
   */
  async analyzeWithAI(reportData) {
    try {
      // Mock AI analysis - in production, integrate with Gemini API
      const analysis = {
        sentiment: this.analyzeSentiment(reportData.description),
        priority: this.assessPriority(reportData),
        tags: this.extractTags(reportData.title + ' ' + reportData.description),
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        suggestedCategory: this.suggestCategory(reportData),
        estimatedSeverity: this.estimateSeverity(reportData)
      };

      // Analyze media if present
      if (reportData.mediaUrls && reportData.mediaUrls.length > 0) {
        analysis.mediaAnalysis = await this.analyzeMedia(reportData.mediaUrls);
      }

      return analysis;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return {
        sentiment: 'neutral',
        priority: 'medium',
        tags: [],
        confidence: 0.5,
        suggestedCategory: reportData.category,
        estimatedSeverity: 'moderate'
      };
    }
  }

  /**
   * Analyze sentiment of report description
   */
  analyzeSentiment(text) {
    const urgentWords = ['urgent', 'emergency', 'critical', 'dangerous', 'severe'];
    const negativeWords = ['broken', 'damaged', 'problem', 'issue', 'failure'];
    const positiveWords = ['fixed', 'improved', 'working', 'good', 'excellent'];

    const textLower = text.toLowerCase();
    
    if (urgentWords.some(word => textLower.includes(word))) {
      return 'urgent';
    } else if (negativeWords.some(word => textLower.includes(word))) {
      return 'negative';
    } else if (positiveWords.some(word => textLower.includes(word))) {
      return 'positive';
    }
    
    return 'neutral';
  }

  /**
   * Assess priority based on multiple factors
   */
  assessPriority(reportData) {
    let score = 0;
    
    // Category-based scoring
    const categoryScores = {
      'Safety': 3,
      'Infrastructure': 2,
      'Utilities': 2,
      'Traffic': 1,
      'Sanitation': 1,
      'Other': 0
    };
    
    score += categoryScores[reportData.category] || 0;
    
    // Text analysis scoring
    const urgentKeywords = ['emergency', 'urgent', 'critical', 'dangerous'];
    const description = reportData.description.toLowerCase();
    
    if (urgentKeywords.some(keyword => description.includes(keyword))) {
      score += 2;
    }
    
    // Time-based scoring (reports during odd hours might be more urgent)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 1;
    }
    
    // Convert score to priority
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Extract relevant tags from text
   */
  extractTags(text) {
    const commonTags = {
      'road': ['road', 'street', 'highway', 'path'],
      'water': ['water', 'leak', 'pipe', 'drainage'],
      'electricity': ['electricity', 'power', 'light', 'cable'],
      'waste': ['garbage', 'trash', 'waste', 'litter'],
      'traffic': ['traffic', 'signal', 'jam', 'congestion'],
      'safety': ['safety', 'crime', 'accident', 'danger']
    };
    
    const extractedTags = [];
    const textLower = text.toLowerCase();
    
    for (const [tag, keywords] of Object.entries(commonTags)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        extractedTags.push(tag);
      }
    }
    
    return extractedTags;
  }

  /**
   * Suggest category based on content analysis
   */
  suggestCategory(reportData) {
    const text = (reportData.title + ' ' + reportData.description).toLowerCase();
    
    const categoryKeywords = {
      'Infrastructure': ['road', 'bridge', 'building', 'construction'],
      'Utilities': ['water', 'electricity', 'power', 'gas'],
      'Sanitation': ['garbage', 'waste', 'cleaning', 'drainage'],
      'Traffic': ['traffic', 'signal', 'parking', 'vehicle'],
      'Safety': ['crime', 'accident', 'danger', 'emergency']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return reportData.category;
  }

  /**
   * Estimate severity level
   */
  estimateSeverity(reportData) {
    const text = (reportData.title + ' ' + reportData.description).toLowerCase();
    
    if (text.includes('emergency') || text.includes('critical') || text.includes('dangerous')) {
      return 'severe';
    } else if (text.includes('urgent') || text.includes('major') || text.includes('significant')) {
      return 'moderate';
    }
    
    return 'minor';
  }

  /**
   * Analyze media content (mocked for MVP)
   */
  async analyzeMedia(mediaUrls) {
    try {
      // Mock media analysis - in production, use Gemini Vision API
      return {
        hasImages: mediaUrls.length > 0,
        imageCount: mediaUrls.length,
        detectedObjects: ['road', 'vehicle', 'infrastructure'],
        confidence: 0.85,
        description: 'AI detected infrastructure-related objects in the image'
      };
    } catch (error) {
      console.error('Error analyzing media:', error);
      return {
        hasImages: false,
        error: 'Failed to analyze media'
      };
    }
  }

  /**
   * Enrich location data with additional information
   */
  async enrichLocationData(location) {
    try {
      // Mock location enrichment - in production, use Google Maps Geocoding API
      return {
        ...location,
        address: 'Mock Address, City, State',
        ward: 'Ward 15',
        district: 'Central District',
        pincode: '110001',
        nearbyLandmarks: ['City Center', 'Metro Station'],
        administrativeArea: 'Municipal Corporation Area'
      };
    } catch (error) {
      console.error('Error enriching location data:', error);
      return location;
    }
  }

  /**
   * Calculate estimated resolution time
   */
  calculateEstimatedResolution(priority, category) {
    const baseTimes = {
      'Safety': 24,      // 24 hours
      'Utilities': 48,   // 48 hours
      'Infrastructure': 168, // 1 week
      'Traffic': 72,     // 3 days
      'Sanitation': 48,  // 48 hours
      'Other': 120       // 5 days
    };
    
    const priorityMultipliers = {
      'high': 0.5,
      'medium': 1,
      'low': 2
    };
    
    const baseHours = baseTimes[category] || 120;
    const multiplier = priorityMultipliers[priority] || 1;
    
    return Math.round(baseHours * multiplier);
  }

  /**
   * Assign report to appropriate department
   */
  async assignToDepartment(reportId, category) {
    try {
      const departmentMapping = {
        'Infrastructure': 'public_works',
        'Utilities': 'utilities_dept',
        'Sanitation': 'sanitation_dept',
        'Traffic': 'traffic_dept',
        'Safety': 'police_dept',
        'Other': 'general_admin'
      };
      
      const department = departmentMapping[category] || 'general_admin';
      
      await this.db.collection('reports').doc(reportId).update({
        assignedDepartment: department,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create activity log
      await this.createActivityLog(reportId, 'assigned', {
        message: `Report assigned to ${department}`,
        department
      });
      
      return { success: true, department };
    } catch (error) {
      console.error('Error assigning to department:', error);
      throw error;
    }
  }

  /**
   * Create activity log for report
   */
  async createActivityLog(reportId, action, metadata = {}) {
    try {
      await this.db.collection('reportLogs').add({
        reportId,
        action,
        metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      });
    } catch (error) {
      console.error('Error creating activity log:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(reportId, newStatus, updatedBy, comments = '') {
    try {
      await this.db.collection('reports').doc(reportId).update({
        status: newStatus,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: updatedBy
      });
      
      // Create activity log
      await this.createActivityLog(reportId, 'status_updated', {
        oldStatus: 'pending', // In a real app, fetch the old status
        newStatus,
        updatedBy,
        comments
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  /**
   * Get reports by location radius
   */
  async getReportsByLocation(latitude, longitude, radiusKm = 5) {
    try {
      // Simple implementation - in production, use GeoFirestore for efficient geo queries
      const snapshot = await this.db.collection('reports').get();
      const reports = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.location) {
          const distance = this.calculateDistance(
            latitude, longitude,
            data.location.latitude, data.location.longitude
          );
          
          if (distance <= radiusKm) {
            reports.push({
              id: doc.id,
              ...data,
              distance
            });
          }
        }
      });
      
      return reports.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error getting reports by location:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates
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

module.exports = new ReportsService();