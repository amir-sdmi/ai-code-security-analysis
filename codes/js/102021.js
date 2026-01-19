// routes/behaviorRoutes.js
const express = require('express');
const router = express.Router();
const Behavior = require('../models/Behavior');
const UserSolution = require('../models/UserSolution');

// ChatGPT Integration for behavior matching only
async function matchBehaviorWithGPT(userDescription) {
  const CHATGPT_API_KEY = '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';
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHATGPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze this cat behavior description and respond ONLY with the most relevant behavior name from this list: 
            furniture_scratching, playful_biting, litter_box_avoidance, excessive_vocalization, excessive_hiding, 
            destructive_chewing, food_aggression, nighttime_activity, overgrooming, window_aggression. 
            Just return the behavior name, nothing else.`
          },
          {
            role: 'user',
            content: userDescription
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response structure from GPT API');
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in matchBehaviorWithGPT:', error);
    return 'excessive_vocalization'; // Default fallback behavior
  }
}

// Helper function to safely map database solutions
function mapDatabaseSolutions(dbBehaviors) {
  const solutions = [];
  if (dbBehaviors && Array.isArray(dbBehaviors)) {
    dbBehaviors.forEach(behavior => {
      if (behavior && behavior.solutions && Array.isArray(behavior.solutions)) {
        behavior.solutions.forEach(solution => {
          solutions.push({
            _id: solution._id,
            behavior: behavior.name || 'Unknown Behavior',
            solution: solution.solution || '',
            effectiveness: solution.effectiveness || 0,
            implementation: solution.implementation || 'medium',
            upvotes: solution.upvotes || 0,
            source: 'database'
          });
        });
      }
    });
  }
  return solutions;
}

// Helper function to safely map user solutions
function mapUserSolutions(userSolutions) {
  const solutions = [];
  if (userSolutions && Array.isArray(userSolutions)) {
    userSolutions.forEach(userSol => {
      solutions.push({
        _id: userSol._id,
        behavior: (userSol.behavior && userSol.behavior.name) || 'User Suggested',
        solution: userSol.solution || '',
        upvotes: userSol.upvotes || 0,
        source: 'user'
      });
    });
  }
  return solutions;
}

// API Endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // 1. First try to match with database behaviors using direct search
    let dbBehaviors = await Behavior.find({
      $or: [
        { name: { $regex: description, $options: 'i' } },
        { description: { $regex: description, $options: 'i' } },
        { categories: { $regex: description, $options: 'i' } }
      ]
    }).populate('solutions');

    // 2. If no direct matches, use ChatGPT to suggest which behavior to look up
    if (dbBehaviors.length === 0) {
      try {
        const suggestedBehavior = await matchBehaviorWithGPT(description);
        dbBehaviors = await Behavior.find({ 
          name: suggestedBehavior 
        }).populate('solutions');
      } catch (gptError) {
        console.error('GPT suggestion failed:', gptError);
      }
    }

    // 3. Get user solutions that match the description
    const userSolutions = await UserSolution.find({
      $or: [
        { solution: { $regex: description, $options: 'i' } }
      ]
    }).populate('behavior');

    // Format response using helper functions
    const response = {
      solutions: [
        ...mapDatabaseSolutions(dbBehaviors),
        ...mapUserSolutions(userSolutions)
      ]
    };

    res.json(response);
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    res.status(500).json({ 
      error: 'Failed to analyze behavior',
      details: error.message 
    });
  }
});

// Upvote endpoint (unchanged)
router.post('/upvote', async (req, res) => {
  try {
    const { solutionId, solutionType, userId } = req.body;
    
    if (!solutionId || !solutionType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (solutionType === 'database') {
      const behavior = await Behavior.findOne({ 'solutions._id': solutionId });
      
      if (!behavior) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      const solution = behavior.solutions.id(solutionId);
      if (solution.votedBy.includes(userId)) {
        return res.status(400).json({ error: 'Already voted' });
      }

      await Behavior.updateOne(
        { 'solutions._id': solutionId },
        { 
          $inc: { 'solutions.$.upvotes': 1 },
          $push: { 'solutions.$.votedBy': userId }
        }
      );
    } else if (solutionType === 'user') {
      const solution = await UserSolution.findById(solutionId);
      
      if (!solution) {
        return res.status(404).json({ error: 'Solution not found' });
      }

      if (solution.votedBy.includes(userId)) {
        return res.status(400).json({ error: 'Already voted' });
      }

      await UserSolution.findByIdAndUpdate(
        solutionId,
        { 
          $inc: { upvotes: 1 },
          $push: { votedBy: userId }
        }
      );
    } else {
      return res.status(400).json({ error: 'Invalid solution type' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error upvoting:', error);
    res.status(500).json({ 
      error: 'Failed to upvote solution',
      details: error.message 
    });
  }
});



router.get('/behaviors-list', async (req, res) => {
  try {
    const behaviors = await Behavior.find({})
      .select('name solutions -_id') // Only get name and solutions fields
      .lean(); // Convert to plain JavaScript object

    if (!behaviors || behaviors.length === 0) {
      return res.status(404).json({ error: 'No behaviors found in database' });
    }

    // Format the response
    const formattedBehaviors = behaviors.map(behavior => ({
      name: behavior.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      solutions: behavior.solutions.map(solution => ({
        text: solution.solution,
        effectiveness: solution.effectiveness,
        upvotes: solution.upvotes
      }))
    }));

    res.json({ behaviors: formattedBehaviors });
  } catch (error) {
    console.error('Error fetching behaviors list:', error);
    res.status(500).json({ 
      error: 'Failed to fetch behaviors list',
      details: error.message 
    });
  }
});


// In your behavior routes file
// Update the /add-solution route in behaviorRoutes.js
router.post('/add-solution', async (req, res) => {
  try {
    const { behaviorName, solution, userId } = req.body;

    // Validate input
    if (!behaviorName || !solution || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          behaviorName: !behaviorName ? 'Behavior name is required' : undefined,
          solution: !solution ? 'Solution is required' : undefined,
          userId: !userId ? 'User ID is required' : undefined
        }
      });
    }

    // Find the behavior by name
    const behavior = await Behavior.findOne({ name: behaviorName.toLowerCase() });
    if (!behavior) {
      return res.status(404).json({ error: 'Behavior not found' });
    }

    // Create new user solution
    const newSolution = new UserSolution({
      behavior: behavior._id,
      solution,
      owner: userId,
      status: 'pending'
    });

    await newSolution.save();

    res.status(201).json({ 
      success: true,
      message: 'Solution submitted for admin approval',
      solution: {
        id: newSolution._id,
        behavior: behavior.name,
        solution: newSolution.solution
      }
    });
  } catch (error) {
    console.error('Error adding solution:', error);
    res.status(500).json({ 
      error: 'Failed to add solution',
      details: error.message 
    });
  }
});

module.exports = router;