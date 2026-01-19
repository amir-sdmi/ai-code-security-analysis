// RECIPE ENHANCEMENT SYSTEM
// This is the main file that combines all recipe enhancement functionality
// Created for PantryPal AI project to demonstrate DeepSeek API integration

// Import functionality from the component parts
const part1 = require('./combined-part1');
const part2 = require('./combined-part2');

// Environment setup
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const fs = require('fs');
const path = require('path');

// Combine all recipes from different batches
const allRecipes = [
  ...part1.allRecipes,
  ...part2.additionalRecipes,
  ...part2.finalBatchRecipes
];

// Create a recipe name mapping for reporting
const recipeNameMapping = {};
allRecipes.forEach(recipe => {
  recipeNameMapping[recipe.id.toString()] = recipe.title;
});

// Main function to enhance all recipes in batches
async function enhanceAllRecipes() {
  console.log('RECIPE ENHANCEMENT SYSTEM');
  console.log('=========================');
  console.log(`Total recipes to enhance: ${allRecipes.length}`);
  console.log('This system uses DeepSeek AI API to generate recipe-specific enhancements');
  console.log('Enhancements are categorized into: Healthier, Faster, Tastier, and Other');
  console.log('All enhancements are stored in Supabase database for comparison with scraped data');
  console.log('=========================\n');
  
  // Process recipes in batches
  const batchSize = 10;
  const totalBatches = Math.ceil(allRecipes.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, allRecipes.length);
    const batch = allRecipes.slice(start, end);
    
    console.log(`\nProcessing Batch ${i + 1} of ${totalBatches} (Recipes ${start + 1}-${end})...`);
    
    // Use the enhanced processing function with retry mechanism
    await part2.processRecipesWithRetry(batch);
    
    console.log(`Batch ${i + 1} complete!`);
    
    // Add a delay between batches
    if (i < totalBatches - 1) {
      console.log('Waiting before processing next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Generate a comprehensive report
  console.log('\nGenerating final enhancement report...');
  const totalEnhanced = await part2.generateEnhancementReport();
  
  console.log(`\nRecipe Enhancement System Complete!`);
  console.log(`Successfully enhanced ${totalEnhanced} recipes using DeepSeek AI`);
  console.log('These enhancements can now be compared with scraped data');
}

// Function to demonstrate the enhancement process for a single recipe
async function demonstrateEnhancement(recipeId) {
  // Find the recipe
  const recipe = allRecipes.find(r => r.id.toString() === recipeId.toString());
  
  if (!recipe) {
    console.error(`Recipe with ID ${recipeId} not found!`);
    return;
  }
  
  console.log(`Demonstrating enhancement process for: ${recipe.title}`);
  console.log('Original Recipe Instructions:');
  console.log(recipe.instructions);
  console.log('\nGenerating enhancements using DeepSeek AI...');
  
  // Generate enhancements with retry
  const enhancements = await part2.generateEnhancementsWithRetry(recipe);
  
  if (!enhancements) {
    console.error('Failed to generate enhancements!');
    return;
  }
  
  // Display the enhancements by category
  console.log('\nEnhancements Generated:');
  console.log('=====================');
  
  console.log('\nHEALTHIER:');
  enhancements.categorized.healthier.forEach((enhancement, i) => {
    console.log(`${i + 1}. ${enhancement}`);
  });
  
  console.log('\nFASTER:');
  enhancements.categorized.faster.forEach((enhancement, i) => {
    console.log(`${i + 1}. ${enhancement}`);
  });
  
  console.log('\nTASTIER:');
  enhancements.categorized.tastier.forEach((enhancement, i) => {
    console.log(`${i + 1}. ${enhancement}`);
  });
  
  if (enhancements.categorized.other.length > 0) {
    console.log('\nOTHER:');
    enhancements.categorized.other.forEach((enhancement, i) => {
      console.log(`${i + 1}. ${enhancement}`);
    });
  }
  
  console.log('\nDemonstration complete!');
}

// Export functionality for use in other scripts
module.exports = {
  enhanceAllRecipes,
  demonstrateEnhancement,
  allRecipes,
  recipeNameMapping
};

// If this script is run directly (not imported), run the demonstration
if (require.main === module) {
  // Check if a recipe ID was provided as a command line argument
  const recipeId = process.argv[2];
  
  if (recipeId) {
    // Demonstrate enhancement for a specific recipe
    demonstrateEnhancement(recipeId);
  } else {
    // Show usage instructions
    console.log('Recipe Enhancement System');
    console.log('------------------------');
    console.log('Usage:');
    console.log('  node recipe-enhancement-system.js [recipeId]');
    console.log('');
    console.log('Examples:');
    console.log('  node recipe-enhancement-system.js 654959   # Enhance Spaghetti with Smoked Salmon');
    console.log('  node recipe-enhancement-system.js          # Show this help message');
    console.log('');
    console.log('Available Recipes:');
    
    // Display a sample of available recipes
    const sampleRecipes = allRecipes.slice(0, 5);
    sampleRecipes.forEach(recipe => {
      console.log(`  ${recipe.id}: ${recipe.title}`);
    });
    console.log(`  ... and ${allRecipes.length - 5} more recipes`);
  }
}
