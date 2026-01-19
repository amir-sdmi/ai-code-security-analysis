document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const quickQuestions = document.getElementById('quick-questions');

    // API Configuration
    // Note: In a production environment, you should not expose your API key in client-side code
    // Consider using environment variables with a proper backend server for a production app
    const API_KEY = 'API';
    // Updated to use gemini-2.0-flash model as shown in documentation
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // CORS Configuration
    // Set to true if you're experiencing CORS issues (after requesting access at https://cors-anywhere.herokuapp.com/corsdemo)
    const USE_CORS_PROXY = false;
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

    // Pre-defined questions
    const predefinedQuestions = [
        "What's a fun physics experiment I can try at home?",
        "How do plants make their own food?",
        "What causes volcanoes to erupt?",
        "How does electricity work?",
        "What's the water cycle?",
        "How do magnets work?",
        "What is DNA?",
        "How do rockets work?",
        "What causes earthquakes?",
        "How do rainbows form?"
    ];

    // Create quick question buttons
    predefinedQuestions.forEach(question => {
        const button = document.createElement('button');
        button.className = 'quick-question';
        // Truncate long questions for display
        const displayText = question.length > 30 ? question.substring(0, 27) + '...' : question;
        button.textContent = displayText;
        button.title = question; // Show full question on hover
        button.onclick = () => {
            userInput.value = question;
            sendButton.click();
        };
        quickQuestions.appendChild(button);
    });

    // Enhanced Science experiment knowledge base as fallback
    const knowledgeBase = {
        "what's a fun physics experiment i can try at home": "A fun physics experiment you can try at home is the balloon rocket! Here's how to do it:\n\nMaterials needed:\n- A balloon\n- A long piece of string (about 3-5 meters)\n- A plastic straw\n- Tape\n- Two chairs or other objects to tie the string to\n\nSteps:\n1. Thread the string through the straw\n2. Tie the string between two chairs, making sure it's taut\n3. Blow up the balloon but don't tie it - just pinch the end\n4. Tape the balloon to the straw\n5. Let go of the balloon and watch it zoom!\n\nScientific explanation: This demonstrates Newton's Third Law of Motion - for every action, there's an equal and opposite reaction. When the air rushes out of the balloon, it pushes against the air behind it, which in turn pushes the balloon forward.",
        "how do plants make their own food": "Plants make their own food through photosynthesis. Let's do an experiment to see this in action!\n\nMaterials needed:\n- A healthy green plant\n- Aluminum foil\n- Scissors\n- A sunny window\n- Water\n\nSteps:\n1. Cut out a small shape from the aluminum foil\n2. Carefully place the foil shape on a leaf of the plant\n3. Leave the plant in a sunny window for 3-4 days\n4. Water the plant normally\n5. After 3-4 days, remove the foil and observe the leaf\n\nScientific explanation: The covered part of the leaf will be lighter in color because it couldn't make food without sunlight. This shows that plants need sunlight to make their food through photosynthesis.",
        "what causes volcanoes to erupt": "Let's create a model volcano to understand how real volcanoes erupt!\n\nMaterials needed:\n- Baking soda (2 tablespoons)\n- Vinegar (1/2 cup)\n- Red food coloring\n- Dish soap (a few drops)\n- A small bottle or container\n- Playdough or clay (optional)\n\nSteps:\n1. If using playdough, shape it around the container to look like a volcano\n2. Add baking soda to the container\n3. Add a few drops of dish soap and red food coloring\n4. Pour in the vinegar and watch the eruption!\n\nScientific explanation: This demonstrates how pressure builds up in real volcanoes. The baking soda and vinegar react to create carbon dioxide gas, which builds pressure until it erupts, just like magma building pressure in a real volcano.",
        "how does electricity work": "Let's build a simple electric circuit to understand how electricity works!\n\nMaterials needed:\n- A battery (AA or 9V)\n- A small light bulb\n- Two pieces of wire\n- A battery holder (optional)\n- A bulb holder (optional)\n\nSteps:\n1. Connect one wire from the positive terminal of the battery to the light bulb\n2. Connect another wire from the negative terminal of the battery to the light bulb\n3. Watch the bulb light up!\n\nScientific explanation: This shows how electricity flows in a complete circuit. The battery provides the energy, the wires conduct the electricity, and the bulb converts electrical energy into light.",
        "what's the water cycle": "Let's create a model of the water cycle!\n\nMaterials needed:\n- A large glass jar with a lid\n- Hot water\n- Ice cubes\n- A small plate\n\nSteps:\n1. Fill the jar about 1/3 with hot water\n2. Place the plate on top of the jar\n3. Put ice cubes on the plate\n4. Watch as condensation forms and 'rain' falls inside the jar\n\nScientific explanation: This demonstrates the water cycle in miniature. The hot water evaporates, the cold plate causes condensation, and the water droplets fall as 'rain'.",
        "how do magnets work": "Let's explore magnetism with some fun experiments!\n\nMaterials needed:\n- Two bar magnets\n- Paper clips\n- A piece of paper\n- Iron filings (optional)\n\nSteps:\n1. Try to push the magnets together at different ends\n2. Place a magnet under a piece of paper\n3. Sprinkle iron filings on the paper\n4. Observe the pattern they form\n\nScientific explanation: This shows how magnets have two poles (north and south) and how their magnetic fields work. The iron filings align with the magnetic field, showing its pattern.",
        "what is dna": "Let's extract DNA from a strawberry to see it with our own eyes!\n\nMaterials needed:\n- A strawberry\n- Dish soap\n- Salt\n- Water\n- Rubbing alcohol (chilled)\n- A plastic bag\n- A coffee filter\n- A clear glass\n\nSteps:\n1. Mash the strawberry in a plastic bag\n2. Mix water, dish soap, and salt in a cup\n3. Add this mixture to the mashed strawberry\n4. Filter the mixture through a coffee filter\n5. Pour chilled rubbing alcohol into the filtered liquid\n6. Watch as white, stringy DNA appears!\n\nScientific explanation: This shows how DNA can be extracted from cells. The soap breaks down the cell membranes, the salt helps the DNA clump together, and the alcohol makes the DNA visible.",
        "how do rockets work": "Let's build a simple rocket to understand how they work!\n\nMaterials needed:\n- A film canister or small plastic container with a tight lid\n- Alka-Seltzer tablets\n- Water\n- Safety goggles\n\nSteps:\n1. Put on safety goggles\n2. Fill the canister 1/3 with water\n3. Drop in half an Alka-Seltzer tablet\n4. Quickly put the lid on and place it upside down\n5. Stand back and watch it launch!\n\nScientific explanation: This demonstrates how real rockets work. The chemical reaction creates gas, which builds pressure until it's released, propelling the rocket upward.",
        "what causes earthquakes": "Let's create a model to understand how earthquakes happen!\n\nMaterials needed:\n- Two pieces of foam board\n- Sand\n- Small objects (like toy buildings)\n- A ruler\n\nSteps:\n1. Place sand on one piece of foam board\n2. Build small structures on the sand\n3. Place the other foam board on top\n4. Slowly push the top board to simulate tectonic plate movement\n5. Observe how the structures react\n\nScientific explanation: This shows how the movement of tectonic plates can cause earthquakes. The sudden movement of the plates creates seismic waves that shake the ground.",
        "how do rainbows form": "Let's create our own rainbow to understand how they form!\n\nMaterials needed:\n- A glass of water\n- A white piece of paper\n- A sunny window\n\nSteps:\n1. Fill the glass with water\n2. Place it near a sunny window\n3. Hold the white paper behind the glass\n4. Adjust the angle until you see a rainbow!\n\nScientific explanation: This demonstrates how light bends (refracts) when it passes through water, splitting into different colors just like in a real rainbow."
    };

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Handle newlines in the message
        const formattedMessage = message.replace(/\n/g, '<br>');
        contentDiv.innerHTML = formattedMessage;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add animation class
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    // Function to process user input locally (fallback mechanism)
    function processLocalFallback(input) {
        const lowerInput = input.toLowerCase();
        let response = "I'd love to help you explore science! You could ask me about:\n\n1. Different branches of science (physics, chemistry, biology, etc.)\n2. Specific experiments like the volcano or pendulum\n3. How things work in nature\n4. Scientific concepts you're curious about\n5. Future technology and innovations\n\nWhat would you like to learn about?";
        
        // Modified knowledge base responses
        const conversationalKnowledgeBase = {
            "what's a fun physics experiment i can try at home": "There are many fun physics experiments you can try at home! Physics is the study of matter, energy, and the fundamental forces of nature. Experiments help us understand concepts like motion, energy transfer, and forces.\n\nWould you like to try a simple physics experiment at home? A balloon rocket is a great one!\n\nMaterials needed:\n- A balloon\n- A long piece of string (about 3-5 meters)\n- A plastic straw\n- Tape\n- Two chairs or other objects to tie the string to\n\nSteps:\n1. Thread the string through the straw\n2. Tie the string between two chairs, making sure it's taut\n3. Blow up the balloon but don't tie it - just pinch the end\n4. Tape the balloon to the straw\n5. Let go of the balloon and watch it zoom!\n\nThis demonstrates Newton's Third Law of Motion - for every action, there's an equal and opposite reaction. When the air rushes out of the balloon, it pushes against the air behind it, which in turn pushes the balloon forward.",
            
            "how do plants make their own food": "Plants make their own food through a process called photosynthesis. Unlike animals who need to eat food, plants can create their own nutrients using sunlight, water, and carbon dioxide.\n\nDuring photosynthesis, plants use the green pigment called chlorophyll in their leaves to capture energy from sunlight. They combine this energy with water from the soil and carbon dioxide from the air to create glucose (sugar) and oxygen. The glucose provides energy for the plant to grow, while the oxygen is released into the air for us to breathe.\n\nWould you like to try a simple experiment related to photosynthesis at home?\n\nMaterials needed:\n- A healthy green plant\n- Aluminum foil\n- Scissors\n- A sunny window\n- Water\n\nSteps:\n1. Cut out a small shape from the aluminum foil\n2. Carefully place the foil shape on a leaf of the plant\n3. Leave the plant in a sunny window for 3-4 days\n4. Water the plant normally\n5. After 3-4 days, remove the foil and observe the leaf\n\nThe covered part of the leaf will be lighter in color because it couldn't make food without sunlight. This shows that plants need sunlight to make their food through photosynthesis.",
            
            "what causes volcanoes to erupt": "Volcanoes erupt due to pressure building up inside the Earth. Beneath the Earth's crust is the mantle, which contains magma (molten rock). When the pressure from gases in the magma becomes too great, it pushes the magma up through weak spots in the Earth's crust, resulting in a volcanic eruption.\n\nFactors that can trigger eruptions include the buildup of gas pressure, movement of tectonic plates, and changes in the magma's temperature or composition. When magma reaches the surface, it's called lava, which can flow from the volcano along with ash, gas, and rock fragments.\n\nWould you like to try a simple experiment to model a volcanic eruption at home?\n\nMaterials needed:\n- Baking soda (2 tablespoons)\n- Vinegar (1/2 cup)\n- Red food coloring\n- Dish soap (a few drops)\n- A small bottle or container\n- Playdough or clay (optional)\n\nSteps:\n1. If using playdough, shape it around the container to look like a volcano\n2. Add baking soda to the container\n3. Add a few drops of dish soap and red food coloring\n4. Pour in the vinegar and watch the eruption!\n\nThis demonstrates how pressure builds up in real volcanoes. The baking soda and vinegar react to create carbon dioxide gas, which builds pressure until it erupts, similar to how gases in magma create pressure in a real volcano.",
            
            "how does electricity work": "Electricity is the flow of electric charge, typically carried by electrons. It works based on a fundamental property of our universe: opposite charges attract, and like charges repel.\n\nElectricity needs a complete circuit to flow - a continuous path from a power source (like a battery), through wires to a device (like a light bulb), and back to the power source. The battery provides the 'push' (voltage) that moves electrons through the circuit.\n\nWhen we use electrical devices, we're converting electrical energy into other forms - light, heat, motion, or sound. This energy conversion makes electricity so useful in our daily lives.\n\nWould you like to try a simple experiment to see electricity in action?\n\nMaterials needed:\n- A battery (AA or 9V)\n- A small light bulb\n- Two pieces of wire\n- A battery holder (optional)\n- A bulb holder (optional)\n\nSteps:\n1. Connect one wire from the positive terminal of the battery to the light bulb\n2. Connect another wire from the negative terminal of the battery to the light bulb\n3. Watch the bulb light up!\n\nThis shows how electricity flows in a complete circuit. The battery provides the energy, the wires conduct the electricity, and the bulb converts electrical energy into light.",
            
            "what's the water cycle": "The water cycle, also known as the hydrologic cycle, is the continuous movement of water on, above, and below the Earth's surface. It has no beginning or end and involves several key processes:\n\n1. Evaporation: The sun heats water in oceans, lakes, and rivers, turning it into water vapor that rises into the air.\n\n2. Condensation: As water vapor rises and cools, it forms clouds through condensation.\n\n3. Precipitation: When water droplets in clouds become heavy enough, they fall back to Earth as rain, snow, sleet, or hail.\n\n4. Collection: Precipitation is collected in oceans, lakes, rivers, and underground, and the cycle begins again.\n\nThis continuous cycle is essential for life on Earth, providing fresh water and regulating Earth's temperature.\n\nWould you like to try a simple experiment to observe the water cycle in action?\n\nMaterials needed:\n- A large glass jar with a lid\n- Hot water\n- Ice cubes\n- A small plate\n\nSteps:\n1. Fill the jar about 1/3 with hot water\n2. Place the plate on top of the jar\n3. Put ice cubes on the plate\n4. Watch as condensation forms and 'rain' falls inside the jar\n\nThis demonstrates the water cycle in miniature. The hot water evaporates, the cold plate causes condensation, and the water droplets fall as 'rain'.",
            
            "how do magnets work": "Magnets work because of a fascinating property called magnetism, which is a fundamental force of nature. All magnets have two poles - a north pole and a south pole. The basic rule is that opposite poles attract (north attracts south) and like poles repel (north repels north, south repels south).\n\nMagnets create an invisible field around them called a magnetic field. This field can exert force on other magnets or certain metals like iron, nickel, and cobalt. These metals can be attracted to magnets because the magnetic field temporarily aligns the tiny magnetic domains within the metal.\n\nThe Earth itself is like a giant magnet with magnetic poles near the geographic north and south poles, which is why compasses work for navigation!\n\nWould you like to try some simple experiments to explore magnetism?\n\nMaterials needed:\n- Two bar magnets\n- Paper clips\n- A piece of paper\n- Iron filings (optional)\n\nSteps:\n1. Try to push the magnets together at different ends to feel attraction and repulsion\n2. Place a magnet under a piece of paper\n3. Sprinkle iron filings on the paper (or use paper clips if you don't have filings)\n4. Observe the pattern they form, showing the magnetic field lines\n\nThese experiments demonstrate how magnets interact with each other and how their invisible magnetic fields can be visualized.",
            
            "what is dna": "DNA (Deoxyribonucleic Acid) is the molecule that contains the genetic instructions for the development, functioning, growth, and reproduction of all known organisms and many viruses. It's essentially the blueprint or instruction manual for life.\n\nDNA has a unique structure called a double helix, which looks like a twisted ladder. The sides of the ladder are made of sugar and phosphate molecules, while the rungs are made of pairs of chemical bases: adenine (A), thymine (T), guanine (G), and cytosine (C). These bases always pair in a specific way: A with T, and G with C.\n\nThe specific sequence of these base pairs contains the genetic information, similar to how letters form words and sentences in a book. This genetic information determines traits like eye color, height, and susceptibility to certain diseases.\n\nWould you like to try an experiment to actually see DNA with your own eyes?\n\nMaterials needed:\n- A strawberry (or other soft fruits like kiwi or banana)\n- Dish soap\n- Salt\n- Water\n- Rubbing alcohol (chilled in freezer for 30 minutes)\n- A plastic bag\n- A coffee filter\n- A clear glass\n\nSteps:\n1. Mash the strawberry in a plastic bag\n2. Mix 2 tablespoons of water, 1/2 teaspoon of dish soap, and a pinch of salt in a cup\n3. Add this mixture to the mashed strawberry and gently mix for 1 minute\n4. Filter the mixture through a coffee filter into a clear glass\n5. Slowly pour cold rubbing alcohol down the side of the glass (about the same amount as the filtered liquid)\n6. Wait 2-3 minutes and observe the white, stringy material that forms between layers - that's DNA!\n\nThis experiment works because the soap breaks down the cell membranes, the salt helps the DNA clump together, and the alcohol makes the DNA visible by causing it to precipitate out of the solution.",
            
            "how do rockets work": "Rockets work based on Newton's Third Law of Motion: for every action, there is an equal and opposite reaction. When a rocket expels gas out of its engine at high speed (the action), the rocket is pushed in the opposite direction (the reaction).\n\nThe main components of a rocket include:\n1. A combustion chamber where fuel is burned\n2. A propellant (fuel and oxidizer)\n3. A nozzle that accelerates the hot gases and directs them downward\n\nAs the propellant burns, it creates hot, expanding gases that rush out through the nozzle at extremely high speeds. This powerful expulsion of gas generates thrust that propels the rocket upward. The faster the gas exits, the greater the thrust.\n\nWould you like to try making a simple rocket at home?\n\nMaterials needed:\n- A film canister with a snap-on lid (not a screw-top) or an Alka-Seltzer rocket kit\n- Alka-Seltzer tablets\n- Water\n- Safety goggles\n- An open outdoor area\n\nSteps:\n1. Put on safety goggles for protection\n2. Go outside to an open area\n3. Fill the canister 1/3 with water\n4. Drop in half an Alka-Seltzer tablet\n5. Quickly put the lid on securely and place it upside down (lid down)\n6. Stand back and wait for launch!\n\nThis mini rocket works because the Alka-Seltzer and water create a chemical reaction that produces carbon dioxide gas. As the gas builds up inside the sealed container, pressure increases until it pops the lid off, propelling the rocket upward - demonstrating the same principle that real rockets use.",
            
            "what causes earthquakes": "Earthquakes are caused by the movement of tectonic plates - large sections of the Earth's crust that float on the semi-fluid mantle beneath. The Earth's crust isn't one solid piece but is divided into about 20 major plates that are constantly moving, albeit very slowly (a few centimeters per year).\n\nWhen these plates interact at their boundaries, they can:\n1. Move apart from each other (divergent boundaries)\n2. Push against each other (convergent boundaries)\n3. Slide past each other (transform boundaries)\n\nThese movements cause stress to build up along fault lines where the plates meet. When this stress exceeds the strength of the rocks, they suddenly break and shift, releasing energy in the form of seismic waves that we feel as earthquakes. The point where this rupture begins is called the epicenter.\n\nWould you like to try a simple model to understand how earthquakes happen?\n\nMaterials needed:\n- Two pieces of foam board or stiff cardboard\n- Sand or salt\n- Small objects (like toy buildings or blocks)\n- A flat surface\n\nSteps:\n1. Place sand on one piece of foam board\n2. Build small structures on the sand\n3. Place the other foam board partially overlapping the first one\n4. Slowly push the top board horizontally against the bottom one\n5. Observe how the structures react when the pressure causes a sudden shift\n\nThis model demonstrates how pressure builds up between tectonic plates until a sudden release causes an earthquake, creating seismic waves that shake the ground and can damage structures.",
            
            "how do rainbows form": "Rainbows form when sunlight interacts with water droplets in the air through a beautiful process combining reflection, refraction, and dispersion of light.\n\nHere's how it works:\n1. Sunlight (which appears white) is actually made up of all the colors of the rainbow.\n2. When sunlight enters a water droplet, it slows down and bends (refracts).\n3. Different colors bend by different amounts - violet bends the most, red bends the least.\n4. The light then reflects off the back of the droplet.\n5. As the light exits the droplet, it refracts again, further separating the colors.\n\nFor us to see a rainbow, the sun needs to be behind us, and water droplets (from rain or mist) need to be in front of us. The sun's rays enter millions of droplets at different angles, with each droplet acting like a tiny prism, creating the arc of colors we see as a rainbow.\n\nWould you like to create your own rainbow at home?\n\nMaterials needed:\n- A glass of water (a clear glass works best)\n- A white piece of paper or a white wall\n- Sunlight from a window\n\nSteps:\n1. Fill the glass about 3/4 full with water\n2. Place it in direct sunlight near a window\n3. Hold the white paper a few inches behind the glass (or use a white wall)\n4. Adjust the angle of the glass until a rainbow appears on the paper\n\nThis simple experiment demonstrates exactly how rainbows form in nature. The glass of water acts like a raindrop, refracting and dispersing the sunlight into its component colors."
        };
        
        // Check for keywords in the knowledge base
        for (const [keyword, data] of Object.entries(conversationalKnowledgeBase)) {
            if (lowerInput.includes(keyword)) {
                response = data;
                break;
            }
        }
        
        return response;
    }

    // Function to call the Gemini API directly from client-side
    async function callGeminiAPI(input) {
        try {
            console.log("Attempting to call Gemini API with input:", input);
            
            // API Configuration with optional CORS proxy
            let apiUrl = `${API_URL}?key=${API_KEY}`;
            if (USE_CORS_PROXY) {
                apiUrl = `${CORS_PROXY}${API_URL}?key=${API_KEY}`;
            }
            console.log("Using API URL:", apiUrl);
            
            // Request body
            const requestBody = {
                contents: [{
                    role: "user",
                    parts: [{
                        text: `You are a friendly and knowledgeable science guide named Science Guide. When responding to users, follow these guidelines:

1. First, provide a clear, concise explanation of the scientific concept or topic asked about.
2. Use simple language that's easy to understand without sacrificing scientific accuracy.
3. After explaining the concept, ALWAYS ask if they would like to try a related experiment at home with a phrase like "Would you like to try a simple experiment related to this at home?"
4. If the user specifically asks for an experiment, first briefly explain the science behind it, then provide detailed step-by-step instructions with a list of required materials and necessary safety precautions.

Keep your tone friendly, enthusiastic, and conversational. Make science feel accessible and exciting.

User question: ${input}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };
            
            console.log("Sending request with body:", JSON.stringify(requestBody));
            
            // Make the API request
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log("API Response status:", response.status);
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json().catch(e => ({ error: "Could not parse error response" }));
                console.error('API Error Response:', errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            // Parse the response
            const data = await response.json();
            console.log("API Response data:", data);
            
            // Validate response format
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                console.error("Invalid API response format:", data);
                throw new Error('Invalid API response format');
            }

            // Return the text response from the model
            const responseText = data.candidates[0].content.parts[0].text;
            console.log("Received response from Gemini API:", responseText.substring(0, 100) + "...");
            return responseText;
        } catch (error) {
            console.error('API Error:', error);
            alert("Error connecting to Gemini API: " + error.message + ". Using local fallback instead.");
            // Return fallback response from local knowledge base
            return processLocalFallback(input);
        }
    }

    // Function to handle user input
    async function handleUserInput(input) {
        // Show user message
        addMessage(input, true);
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message';
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // Track response start time
            const startTime = new Date().getTime();
            
            // Get response from Gemini API
            const apiResponse = await callGeminiAPI(input);
            
            // Calculate response time
            const endTime = new Date().getTime();
            const responseTime = endTime - startTime;
            
            // Add artificial delay if response comes back too quickly (for better UX)
            // Minimum 1.2 seconds for typing indicator to be visible
            const minTypingTime = 1200;
            if (responseTime < minTypingTime) {
                await new Promise(resolve => setTimeout(resolve, minTypingTime - responseTime));
            }
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add the response with animation
            addMessage(apiResponse);
            
            // Add sound effect for message received (optional)
            // const messageSound = new Audio('message.mp3');
            // messageSound.volume = 0.3;
            // messageSound.play().catch(e => console.log('Audio play prevented by browser policy'));
            
            // Scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error in handleUserInput:', error);
            
            // Add artificial delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add fallback message
            const fallbackResponse = processLocalFallback(input);
            addMessage(fallbackResponse);
            
            // Scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Event listener for send button
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            userInput.value = '';
            handleUserInput(message);
        }
    });

    // Event listener for Enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
}); 
