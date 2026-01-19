/**
 * Test script for the updated AI Parser using DeepSeek Chat model
 * 
 * This script tests the AI Parser Service with the DeepSeek Chat model
 * using the provided tab-delimited timetable format.
 */

import aiParserService, { parseTimetableText } from './src/services/aiParserService.js';

// Sample tab-delimited timetable data that was giving issues previously
const sampleTimetable = `Day 1\tDay 2\tDay 3\tDay 4\tDay 5\tDay 6\tDay 7\tDay 8\tDay 9\tDay 10
Period 1
8:35am–9:35am
Specialist Mathematics
(10SPE251101)
M 07 Mr Paul Jefimenko
Mathematics - Advanced
(10MAA251105)
M 05 Mr Scott Kertes
Physics
(10PHY251102)
S 01 Mr Paul Jefimenko
Biology Units 1 & 2
(11BIO251101)
S 06 Mr Andrew Savage
War Boom and Bust
(10WBB251102)
C 07 Ms Dianne McKenzie
Specialist Mathematics
(10SPE251101)
M 07 Mr Paul Jefimenko
English
(10ENG251108)
A 08 Mr Robert Hassell
Physics
(10PHY251102)
S 01 Mr Paul Jefimenko
Specialist Mathematics
(10SPE251101)
M 07 Mr Paul Jefimenko
Biology Units 1 & 2
(11BIO251101)
S 06 Mr Andrew Savage`;

async function testAiParser() {
  console.log("=== Testing AI Parser with DeepSeek Chat Model ===");
  
  try {
    console.log("Calling AI parser (this may take some time)...");
    const result = await parseTimetableText(sampleTimetable);
    
    // Check if we got a valid result
    if (!result) {
      console.log("❌ ERROR: Parser returned null or undefined result");
      return;
    }
    
    // Count classes parsed
    let totalClasses = 0;
    for (const day in result.classes) {
      for (const period in result.classes[day]) {
        totalClasses += result.classes[day][period].length;
      }
    }
    
    console.log(`Parser found ${totalClasses} total classes`);
    
    if (totalClasses > 0) {
      // Check for expected Day 1, Period 1 class
      const day1Period1 = result.classes["Day 1"]["Period 1"][0] || {};
      
      console.log("\nSample class from Day 1, Period 1:");
      console.log(JSON.stringify(day1Period1, null, 2));
      
      if (day1Period1.subject === "Specialist Mathematics" && 
          day1Period1.code === "10SPE251101" &&
          day1Period1.room === "M 07" &&
          day1Period1.teacher === "Mr Paul Jefimenko") {
        console.log("✅ SUCCESS: Correctly parsed the first class!");
      } else {
        console.log("❌ FAIL: Class details don't match expected values");
        console.log("Expected: 'Specialist Mathematics' with code '10SPE251101'");
        console.log(`Got: '${day1Period1.subject}' with code '${day1Period1.code}'`);
      }
      
      // Print some statistics about the parsed data
      console.log("\nClasses found by day:");
      for (const day in result.classes) {
        let dayTotal = 0;
        for (const period in result.classes[day]) {
          dayTotal += result.classes[day][period].length;
        }
        console.log(`${day}: ${dayTotal} classes`);
      }
      
      return result;
    } else {
      console.log("❌ FAIL: No classes found in the parsed result");
      return null;
    }
  } catch (error) {
    console.error("Error during test:", error);
    return null;
  }
}

// Run the test
(async () => {
  try {
    console.log("Starting AI Parser test with DeepSeek Chat model...");
    const result = await testAiParser();
    
    if (result) {
      console.log("\n=== Test Summary ===");
      console.log("AI Parser successfully processed the timetable");
      console.log(`Days found: ${result.days.length}`);
      console.log(`Periods found: ${result.periods.length}`);
      console.log("Test completed successfully!");
    } else {
      console.log("\nAI Parser test failed.");
    }
  } catch (e) {
    console.error("Test runner error:", e);
  }
})();
