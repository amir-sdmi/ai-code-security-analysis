import express from 'express';
import {
  generateNPC,
  getUserNPCs,
  getNPC,
  updateNPC,
  deleteNPC,
  getCampaignNPCs,
  regenerateNPC
} from '../controllers/npcgenerator.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/npc-generator/generate
 * @desc    Generate a new NPC using ChatGPT
 * @access  Private
 * @body    {
 *            role: string (required),
 *            storyFit: string (required),
 *            desiredTraits: {
 *              race?: string,
 *              name?: string,
 *              class?: string,
 *              personalityTraits?: string,
 *              appearance?: string,
 *              other?: string
 *            },
 *            includeStats?: boolean,
 *            campaignContext?: string,
 *            campaignId?: string,
 *            generationSettings?: {
 *              creativityLevel?: 'conservative' | 'balanced' | 'creative',
 *              settingStyle?: 'high-fantasy' | 'low-fantasy' | 'modern' | 'sci-fi' | 'custom',
 *              tone?: 'serious' | 'lighthearted' | 'dark' | 'comedic' | 'neutral'
 *            }
 *          }
 */
router.post('/generate', generateNPC);

/**
 * @route   GET /api/npc-generator/my-npcs
 * @desc    Get all NPCs created by the current user
 * @access  Private
 * @query   {
 *            campaignId?: string,
 *            role?: string,
 *            page?: number (default: 1),
 *            limit?: number (default: 10)
 *          }
 */
router.get('/my-npcs', getUserNPCs);

/**
 * @route   GET /api/npc-generator/:id
 * @desc    Get a specific NPC by ID
 * @access  Private
 * @params  { id: string }
 */
router.get('/:id', getNPC);

/**
 * @route   PUT /api/npc-generator/:id
 * @desc    Update an existing NPC
 * @access  Private
 * @params  { id: string }
 * @body    Any fields from the NPC model that need to be updated
 */
router.put('/:id', updateNPC);

/**
 * @route   DELETE /api/npc-generator/:id
 * @desc    Delete an NPC (soft delete)
 * @access  Private
 * @params  { id: string }
 */
router.delete('/:id', deleteNPC);

/**
 * @route   GET /api/npc-generator/campaign/:campaignId
 * @desc    Get all NPCs for a specific campaign
 * @access  Private
 * @params  { campaignId: string }
 */
router.get('/campaign/:campaignId', getCampaignNPCs);

/**
 * @route   POST /api/npc-generator/:id/regenerate
 * @desc    Regenerate an existing NPC with the same parameters
 * @access  Private
 * @params  { id: string }
 */
router.post('/:id/regenerate', regenerateNPC);

// Additional utility routes

/**
 * @route   GET /api/npc-generator/stats/summary
 * @desc    Get summary statistics about user's NPCs
 * @access  Private
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const NPCGenerator = (await import('../models/npcgenerator.model.js')).default;

    // Get various statistics
    const totalNPCs = await NPCGenerator.countDocuments({ 
      createdBy: userId, 
      isActive: true 
    });

    const npcsByRole = await NPCGenerator.aggregate([
      { $match: { createdBy: userId, isActive: true } },
      { $group: { 
        _id: '$generationRequest.role', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const npcsByCampaign = await NPCGenerator.aggregate([
      { $match: { createdBy: userId, isActive: true, campaignId: { $ne: null } } },
      { $group: { 
        _id: '$campaignId', 
        count: { $sum: 1 } 
      }},
      { $lookup: {
        from: 'campaigns',
        localField: '_id',
        foreignField: '_id',
        as: 'campaign'
      }},
      { $unwind: '$campaign' },
      { $project: {
        campaignName: '$campaign.name',
        count: 1
      }},
      { $sort: { count: -1 } }
    ]);

    const withStats = await NPCGenerator.countDocuments({
      createdBy: userId,
      isActive: true,
      'generatedNPC.stats.abilityScores.strength': { $exists: true }
    });

    res.json({
      success: true,
      data: {
        totalNPCs,
        npcsByRole,
        npcsByCampaign,
        npcsWithStats: withStats,
        npcsWithoutStats: totalNPCs - withStats
      }
    });

  } catch (error) {
    console.error('Error fetching NPC statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NPC statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/npc-generator/search
 * @desc    Search NPCs by name, role, or other criteria
 * @access  Private
 * @query   {
 *            q: string (search term),
 *            campaignId?: string,
 *            page?: number,
 *            limit?: number
 *          }
 */
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, campaignId, page = 1, limit = 10 } = req.query;
    const NPCGenerator = (await import('../models/npcgenerator.model.js')).default;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    let searchQuery = {
      createdBy: userId,
      isActive: true,
      $or: [
        { 'generatedNPC.name': { $regex: q, $options: 'i' } },
        { 'generationRequest.role': { $regex: q, $options: 'i' } },
        { 'generatedNPC.race': { $regex: q, $options: 'i' } },
        { 'generatedNPC.occupation': { $regex: q, $options: 'i' } },
        { 'generatedNPC.location': { $regex: q, $options: 'i' } }
      ]
    };

    if (campaignId) {
      searchQuery.campaignId = campaignId;
    }

    const skip = (page - 1) * limit;
    const npcs = await NPCGenerator.find(searchQuery)
      .select('-generatedNPC.aiResponse -generatedNPC.aiPromptUsed')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NPCGenerator.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        npcs,
        searchTerm: q,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: skip + npcs.length < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error searching NPCs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search NPCs',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/npc-generator/:id/favorite
 * @desc    Toggle favorite status for an NPC
 * @access  Private
 * @params  { id: string }
 */
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const NPCGenerator = (await import('../models/npcgenerator.model.js')).default;

    const npc = await NPCGenerator.findOne({
      _id: id,
      createdBy: userId,
      isActive: true
    });

    if (!npc) {
      return res.status(404).json({
        success: false,
        message: 'NPC not found'
      });
    }

    // Toggle favorite status (add this field to your model if needed)
    const currentTags = npc.tags || [];
    const isFavorite = currentTags.includes('favorite');
    
    if (isFavorite) {
      npc.tags = currentTags.filter(tag => tag !== 'favorite');
    } else {
      npc.tags = [...currentTags, 'favorite'];
    }

    await npc.save();

    res.json({
      success: true,
      message: `NPC ${isFavorite ? 'removed from' : 'added to'} favorites`,
      data: {
        id: npc._id,
        isFavorite: !isFavorite,
        tags: npc.tags
      }
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle favorite status',
      error: error.message
    });
  }
});

export default router;
