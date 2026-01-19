// AI Handler for FVTT AI NPC Generator

const GEMINI_MODEL = "gemini-1.5-flash-latest"; // As used in the macro

export const processWithGemini = async (userPrompt, defaultName) => {
    const apiKey = game.settings.get('fvtt-ai-npc-generator', 'geminiApiKey');
    if (!apiKey) {
        ui.notifications.error("Gemini API Key not set in module settings.");
        return null;
    }

    const systemInstruction = `You are an expert D&D 5e monster designer and a Foundry VTT data architect.
Your task is to generate a complete and valid JSON object representing a D&D 5e monster stat block for Foundry VTT, specifically for the "dnd5e" system (latest 2024 rules where applicable).
The output MUST be a single, valid JSON object and NOTHING ELSE. Do not include any explanatory text, markdown backticks like \`\`\`json, or any content outside of the JSON structure.
Ensure all string values are properly escaped for JSON.

The JSON structure MUST follow this Foundry VTT Actor data model:

{
  "name": "string (Monster Name)",
  "type": "npc",
  "img": "icons/svg/mystery-man.svg", // Default, can be overridden if user specifies an icon path
  "system": {
    "abilities": {
      "str": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } },
      "dex": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } },
      "con": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } },
      "int": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } },
      "wis": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } },
      "cha": { "value": 10, "proficient": 0, "max": null, "bonuses": { "check": "", "save": "" }, "check": { "roll": { "min": null, "max": null, "mode": 0 } }, "save": { "roll": { "min": null, "max": null, "mode": 0 } } }
    },
    "attributes": {
      "ac": { "flat": 10, "calc": "natural" }, // if natural armor. Use "default" for calc if monster wears armor (defined in items).
      "hp": { "value": 10, "max": 10, "temp": null, "tempmax": null, "formula": "2d8+2" }, // Adjust formula based on CR
      "init": { "ability": "dex", "bonus": "" }, // ability can be "" if no specific ability for init
      "movement": { "walk": 30, "burrow": 0, "climb": 0, "fly": 0, "swim": 0, "units": "ft", "hover": false },
      "senses": { "darkvision": 60, "blindsight": 0, "tremorsense": 0, "truesight": 0, "units": "ft", "special": "" }, // darkvision is common
      "spellcasting": "" // e.g., "wis", "int", "cha", or "" if not a spellcaster
    },
    "details": {
      "biography": { "value": "<p>Generated description.</p>", "public": "" },
      "alignment": "Unaligned", // e.g., "Chaotic Evil", "Neutral Good"
      "race": null, // or string e.g. "Goblin"
      "type": { "value": "humanoid", "subtype": "", "swarm": "", "custom": "" }, // e.g. value: "fiend", subtype: "devil"
      "cr": 1, // Challenge Rating
      "source": { "revision": 1, "rules": "2024", "custom": "AI Generated" }
    },
    "bonuses": { // Global bonuses, usually empty strings for new monsters
      "mwak": { "attack": "", "damage": "" }, "rwak": { "attack": "", "damage": "" },
      "msak": { "attack": "", "damage": "" }, "rsak": { "attack": "", "damage": "" },
      "abilities": { "check": "", "save": "", "skill": "" }, "spell": { "dc": "" }
    },
    "skills": { // Include relevant skills. value: 0 (not proficient), 1 (proficient)
      "acr": { "ability": "dex", "value": 0, "bonuses": { "check": "", "passive": "" } },
      "ste": { "ability": "dex", "value": 0, "bonuses": { "check": "", "passive": "" } },
      "prc": { "ability": "wis", "value": 0, "bonuses": { "check": "", "passive": "" } }
      // Add other skills as needed, following the same structure.
    },
    "traits": {
      "size": "med", // e.g., "tiny", "sm", "med", "lg", "huge", "grg"
      "di": { "value": [], "bypasses": [], "custom": "" }, // damage immunities
      "dr": { "value": [], "bypasses": [], "custom": "" }, // damage resistances
      "dv": { "value": [], "bypasses": [], "custom": "" }, // damage vulnerabilities
      "ci": { "value": [], "custom": "" }, // condition immunities
      "languages": { "value": ["common"], "custom": "", "communication": {} }
    },
    "spells": { // Only if spellcaster. value = number of slots. override = null.
      // "spell1": { "value": 0, "override": null }, ... up to spell9
      // "pact": { "value": 0, "override": null }
    },
    "resources": { // For legendary actions/resistances
      "legact": { "value": 0, "max": 0 },
      "legres": { "value": 0, "max": 0 },
      "lair": { "value": false, "initiative": null, "inside": false }
    }
  },
  "prototypeToken": {
    "name": "string (Monster Name)", // Should match actor name
    "displayName": 50, // Default: Show on hover
    "actorLink": false,
    "appendNumber": true,
    "prependAdjective": false,
    "width": 1, "height": 1, // Based on size, e.g. med=1, lg=2, huge=3
    "texture": { "src": "icons/svg/mystery-man.svg", "scaleX": 1, "scaleY": 1, "offsetX": 0, "offsetY": 0, "rotation": 0, "tint": "#ffffff", "alphaThreshold": 0.75, "fit":"contain", "anchorX": 0.5, "anchorY": 0.5 },
    "light": { "bright": 0, "dim": 0, "angle": 360, "color": null, "animation": { "type": null, "speed": 5, "intensity": 5 }, "attenuation": 0.5, "luminosity": 0.5, "saturation":0, "contrast":0, "shadows":0, "darkness": {"min":0, "max":1}, "negative":false, "priority":0, "alpha":0.5, "coloration":1 },
    "sight": { "enabled": true, "range": 0, "angle": 360, "visionMode": "basic", "color": null, "attenuation": 0.1, "brightness": 0, "saturation": 0, "contrast": 0 }, // if monster has darkvision, range = darkvision value, visionMode = "darkvision"
    "disposition": -1, // -1 hostile, 0 neutral, 1 friendly
    "displayBars": 40, // Default: Show on hover/target
    "bar1": { "attribute": "attributes.hp" },
    "bar2": { "attribute": null }
  },
  "items": [
    // Items are CRITICAL. Include attacks, features, spells (if spellcaster).
    // Each item MUST have a unique 16-character LOWERCASE alphanumeric "_id". Generate one if unsure.
    /* Example Melee Weapon Attack Item:
    {
      "_id": "a1b2c3d4e5f6g7h8", // Replace with a NEW unique 16-char ID
      "name": "Claw",
      "type": "weapon",
      "img": "icons/creatures/claws/claw-talon-hook-white.webp",
      "system": {
        "description": { "value": "<p>Melee Weapon Attack.</p>", "chat": "" },
        "type": { "value": "natural" }, // "natural", "simpleM", "martialR", etc.
        "equipped": true,
        "activities": {
          "uniqueActivityID1": { // Generate a unique ID for the activity key
            "type": "attack",
            "activation": { "type": "action", "value": 1, "condition": "" },
            "duration": { "value": null, "units": "inst" },
            "range": { "value": 5, "long": null, "units": "ft" },
            "target": { "value": 1, "type": "creature", "units": "", "prompt": true },
            "attack": { "ability": "str", "bonus": "", "critical": { "threshold": null }, "type": {"value":"melee", "classification":"weapon"} }, // ability can be "dex"
            "damage": { "includeBase": true, "parts": [ { "number": 1, "denomination": 6, "types": ["slashing"], "bonus":"" } ] } // parts array defines all damage if includeBase is false
          }
        },
        "properties": [], // e.g. ["fin", "reach"]
        "proficient": true, // Typically true for monster attacks
        "quantity": 1, "weight": { "value": 0, "units": "lb" }, "price": { "value": 0, "denomination": "gp" },
        "attunement": "", "rarity": ""
      }
    }
    */
    /* Example Feature Item (e.g., Undead Fortitude):
    {
      "_id": "i9j0k1l2m3n4o5p6", // Replace with a NEW unique 16-char ID
      "name": "Undead Fortitude",
      "type": "feat",
      "img": "icons/magic/death/undead-risen-bone-skull.webp",
      "system": {
        "description": { "value": "<p>If damage reduces the undead to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the undead drops to 1 hit point instead.</p>", "chat": "" },
        "type": { "value": "monster" }, // or "class", "race", etc.
        "identifier": "undead-fortitude", // A unique machine-readable identifier for the feature
        "uses": { "value": null, "max": "", "per": null }, // For limited use features
        "activation": { "type": "", "cost": null, "condition": "" }, // If the feature has an activation cost
        "duration": { "value": null, "units": "" },
        "range": { "value": null, "units": "" },
        "target": { "value": null, "units": "", "type": "" }
      }
    }
    */
    /* Example Spell Item (if spellcaster):
    {
      "_id": "q7r8s9t0u1v2w3x4", // Replace with a NEW unique 16-char ID
      "name": "Fireball",
      "type": "spell",
      "img": "icons/magic/fire/explosion-fireball-medium-orange.webp",
      "system": {
        "description": { "value": "<p>A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame...</p>" },
        "level": 3,
        "school": "evo", // Evocation
        "properties": ["vocal", "somatic", "material"],
        "materials": { "value": "A tiny ball of bat guano and sulfur.", "consumed": false, "cost": 0, "supply": 0 },
        "activation": { "type": "action", "value": 1, "condition": "" },
        "duration": { "value": null, "units": "inst" },
        "range": { "value": 150, "units": "ft" },
        "target": { "value": 20, "units": "ft", "type": "radius", "prompt": true },
        "activities": {
           "uniqueActivityID2": { // Generate a unique ID for the activity key
              "type": "save", // For spells requiring a save
              "activation": { "type": "action", "value": 1 },
              "duration": { "units": "inst" },
              "range": { "value": 150, "units": "ft" },
              "target": { "value": 20, "units": "ft", "type": "radius", "prompt": true },
              "save": { "ability": "dex", "dc": null, "scaling": "spellcasting" }, // dc: null means it will use spellcasting DC
              "damage": { "parts": [ { "number": 8, "denomination": 6, "types": ["fire"], "bonus":"" } ] }
           }
        },
        "preparation": { "mode": "prepared", "prepared": true } // Or "always" for innate, "pact" for pact magic etc.
      }
    }
    */
  ]
}

CRITICAL REMINDERS:
1.  The entire output MUST be a single JSON object. No extra text or markdown.
2.  Every item in the "items" array MUST have a unique 16-character lowercase alphanumeric "_id". Generate a new random one for each item.
3.  For items with "activities" (like attacks or spells), the key for each activity within the "activities" object MUST also be a unique 16-character lowercase alphanumeric ID.
4.  Base all stats (abilities, HP, AC, attack bonuses, damage dice, save DCs) on the user's requested CR and creature concept.
5.  Populate the "items" array with features, attacks, and spells appropriate to the creature concept and CR. If the user requests specific attacks or features, prioritize those.
6.  Ensure all ability scores, HP, AC, CR, movement speeds, senses ranges, etc., are numbers, not strings (unless the schema explicitly shows a string like hp.formula).
7.  Pay close attention to the nested structures, especially for "abilities", "skills", "attributes", "prototypeToken", and "items" with their "activities". Empty objects {} or arrays [] are fine if no data is applicable for a sub-section. Null is also acceptable for many optional fields.
8.  For "prototypeToken.sight", if the creature has darkvision > 0, set "visionMode": "darkvision" and "range" to the darkvision value. Otherwise, "visionMode": "basic" and "range": 0 (or specific other senses).
9.  For "prototypeToken.texture.src", use "icons/svg/mystery-man.svg" unless a specific icon is requested or appropriate for the monster type.
10. For "prototypeToken.width" and "prototypeToken.height": 1 for Medium or smaller, 2 for Large, 3 for Huge, 4 for Gargantuan.
11. Actor AC: \`system.attributes.ac.calc\` should be "natural" and \`system.attributes.ac.flat\` should be the AC value if the creature has natural armor. If it wears armor, that armor should be an "equipment" type item in the "items" array, and \`system.attributes.ac.calc\` should be "default".

User's request for the monster:
---
${userPrompt}
---
Generate ONLY the JSON object. Adhere strictly to the structure and examples provided.
`;

    const requestBody = {
      contents: [{
        parts: [{ text: systemInstruction }]
      }],
      generationConfig: {
        temperature: 0.7, // Slightly lower temp might help with stricter adherence
      }
    };

    // ... (rest of the function remains the same: fetch call, response handling, JSON parsing)
    // Ensure console logs include "AI NPC Generator |" prefix for easy filtering.

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("AI NPC Generator | Gemini API Error:", errorData);
            ui.notifications.error(`Gemini API Error: ${errorData.error?.message || response.statusText}. Check console (F12).`);
            return null;
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error("AI NPC Generator | Unexpected Gemini API response structure:", data);
            ui.notifications.error("Unexpected response from Gemini. Check console (F12).");
            return null;
        }

        let jsonString = data.candidates[0].content.parts[0].text;
        // Remove markdown backticks if present
        const markdownMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch?.[1]) {
            jsonString = markdownMatch[1];
        }

        console.log("AI NPC Generator | Raw JSON from Gemini:", jsonString);

        try {
            const actorJson = JSON.parse(jsonString);
            console.log("AI NPC Generator | Parsed Actor JSON:", actorJson);
            return actorJson;
        } catch (e) {
            console.error("AI NPC Generator | Error parsing JSON from Gemini:", e);
            ui.notifications.error("Failed to parse JSON from Gemini. Check console (F12) for raw response and error.");
            return null;
        }

    } catch (error)
        console.error("AI NPC Generator | Error during Gemini API call:", error);
        ui.notifications.error("Error communicating with Gemini API. Check console (F12).");
        return null;
    }
};

// Placeholder for OpenAI functionality (remains the same)
export const processWithOpenAI = async (userPrompt, defaultName) => {
    const apiKey = game.settings.get('fvtt-ai-npc-generator', 'openAiApiKey');
    if (!apiKey) {
        ui.notifications.error("OpenAI API Key not set in module settings.");
        return null;
    }
    console.warn("AI NPC Generator | processWithOpenAI is a placeholder and not yet implemented.");
    ui.notifications.warn("OpenAI processing is not yet implemented in this module.");
    return null;
};
