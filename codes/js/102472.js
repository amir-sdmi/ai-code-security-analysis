// Script for navigation bar toggle
const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

// Scroll reveal effect on elements with class "scroll-reveal"
const revealElements = document.querySelectorAll('.scroll-reveal');

function revealOnScroll() {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    revealElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;

        if (elementTop < windowHeight - revealPoint) {
            el.classList.add('visible');  // You can define .visible in CSS for opacity and transform
            el.classList.remove('hidden'); // Remove hidden class or set opacity 0/translate-y in CSS
        } else {
            el.classList.remove('visible');
            el.classList.add('hidden');
        }
    });
}

// Highlight active nav link based on scroll position
const navLinks = document.querySelectorAll('#navbar a[href^="#"]');
const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute('href').substring(1);
    return document.getElementById(id);
});

function highlightActiveLink() {
    let scrollPos = window.scrollY + 100;  // Offset for better detection
    let currentIndex = sections.length - 1;

    for (let i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop > scrollPos) {
            currentIndex = i - 1;
            break;
        }
    }

    navLinks.forEach(link => link.classList.remove('active-link')); // Use a CSS class like 'active-link' for styling
    if (currentIndex >= 0) {
        navLinks[currentIndex].classList.add('active-link');
    }
}

// Attach scroll events
window.addEventListener('scroll', () => {
    revealOnScroll();
    highlightActiveLink();
});

// Initialize on page load
window.addEventListener('load', () => {
    revealOnScroll();
    highlightActiveLink();
});


// Select all cart buttons
const cartButtons = document.querySelectorAll('.cart a');

cartButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link action
    const product = button.closest('.pro').querySelector('.des h5').innerText;
    alert(`${product} added to cart!`);
  });
});


const proContainers = document.querySelectorAll('.pro-container');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, { threshold: 0.1 });

proContainers.forEach(container => observer.observe(container));


document.querySelectorAll('button.normal, button.white').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Button clicked! Redirecting or showing more info...');
    // You can add your redirect logic here:
    // window.location.href = 'somepage.html';
  });
});

// AI Fashion Chatbot - Enhanced Version
// DOM Elements
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

// Variables
let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;
const API_KEY = "YOUR_APT_KEY"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Comprehensive Fashion Database
function highlightActiveLink() {
    const sections = document.querySelectorAll("section");
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const link = document.querySelector(`[href="#${section.id}"]`);
        if (!link || !section) return;

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

const fashionDatabase = {
    skinTones: {
        fair: {
            description: "Light complexion with pink or peach undertones",
            bestColors: ["Pastels", "Soft blues", "Lavender", "Mint green", "Dusty pink", "Light gray", "White"],
            jewelry: "Silver or white gold",
            makeup: "Soft pinks, peaches, and light neutrals",
            celebrities: ["Emma Stone", "Nicole Kidman", "Cate Blanchett"],
            images: ["ai_img/fair1.webp", "ai_img/fair2.jpg"]
        },
        light: {
            description: "Light to medium complexion with neutral undertones",
            bestColors: ["Jewel tones", "Emerald green", "Royal blue", "Ruby red", "Purple", "Navy", "Black"],
            jewelry: "Both gold and silver",
            makeup: "Most colors work well - from nudes to bold reds",
            celebrities: ["Jennifer Aniston", "Blake Lively", "Jessica Alba"],
            images: ["ai_img/light1.webp", "ai_img/light2.jpg"]
        },
        medium: {
            description: "Warm golden or olive undertones",
            bestColors: ["Warm reds", "Oranges", "Gold", "Olive green", "Turquoise", "Camel", "Coral"],
            jewelry: "Gold works best",
            makeup: "Bronze, gold, and warm earthy tones",
            celebrities: ["Eva Mendes", "Penélope Cruz", "Sofia Vergara"],
            images: ["ai_img/medium1.webp", "ai_img/medium2.jpeg"]
        },
        tan: {
            description: "Medium to dark with golden undertones",
            bestColors: ["Deep blues", "Rich greens", "Burgundy", "Mustard", "Terracotta", "Cream", "Warm neutrals"],
            jewelry: "Gold or rose gold",
            makeup: "Warm browns, bronze, and golds",
            celebrities: ["Beyoncé", "Jennifer Lopez", "Shakira"],
            images: ["ai_img/tan.jpg", "ai_img/tan2.jpg"]
        },
        dark: {
            description: "Deep complexion with rich undertones",
            bestColors: ["Bright colors", "Electric blue", "Fuchsia", "Emerald", "Pure white", "Gold", "Vibrant prints"],
            jewelry: "Gold or bold statement pieces",
            makeup: "Bold colors - bright lips, shimmering highlights",
            celebrities: ["Lupita Nyong'o", "Naomi Campbell", "Viola Davis"],
            images: ["ai_img/drak1.jpg", "ai_img/drak2.webp"]
        },
        deepDark: {
            description: "Very dark complexion with cool undertones",
            bestColors: ["Royal purple", "Bright red", "Electric blue", "Neon pink", "Metallics", "Pure white", "Black"],
            jewelry: "Gold or high-contrast pieces",
            makeup: "Bold lips, shimmery eyeshadows",
            celebrities: ["Alek Wek", "Duckie Thot", "Adut Akech"],
            images: ["ai_img/deepdark.jpg", "ai_img/deepdark2.jpg"]
        }
    },
    bodyTypes: {
        hourglass: {
            description: "Balanced bust and hips with defined waist",
            dos: [
                "Wrap dresses that cinch at the waist",
                "High-waisted bottoms",
                "Fitted jackets that follow your curves",
                "Belted styles to emphasize waist"
            ],
            donts: [
                "Boxy, shapeless silhouettes",
                "Straight-cut dresses",
                "High-neck tops with full skirts",
                "Overly bulky layers"
            ],
            celebs: ["Kim Kardashian", "Marilyn Monroe", "Sophia Vergara"],
            images: ["ai_img/hourglass1.webp", "ai_img/hourglass2.jpg"]
        },
        rectangle: {
            description: "Balanced bust and hips with minimal waist definition",
            dos: [
                "Peplum tops to create curves",
                "Off-shoulder or cold-shoulder tops",
                "Layered outfits for dimension",
                "A-line skirts to create shape"
            ],
            donts: [
                "Tight, straight-cut clothing",
                "Vertical stripes from head to toe",
                "Boxy crop tops",
                "Overly long tops"
            ],
            celebs: ["Cameron Diaz", "Natalie Portman", "Kate Middleton"],
            images: ["ai_img/rectangle1.webp", "ai_img/rectangle2.jpg"]
        },
        pear: {
            description: "Hips wider than bust with defined waist",
            dos: [
                "Dark-colored bottoms",
                "A-line or fit-and-flare dresses",
                "Structured jackets that hit at hipbone",
                "V-neck or scoop neck tops"
            ],
            donts: [
                "Skinny jeans with cropped tops",
                "Light-colored tight pants",
                "Details at hips (ruffles, pockets)",
                "Super skinny skirts"
            ],
            celebs: ["Jennifer Lopez", "Beyoncé", "Rihanna"],
            images: ["ai_img/pear1.webp", "ai_img/pear2.jpg"]
        },
        apple: {
            description: "Broader shoulders and bust with slimmer hips",
            dos: [
                "V-neck or scoop necklines",
                "Empire waist dresses",
                "Structured blazers",
                "Dark colors on top"
            ],
            donts: [
                "Tight tops with tight bottoms",
                "High necklines",
                "Crop tops",
                "Tapered pants"
            ],
            celebs: ["Oprah Winfrey", "Amy Schumer", "Queen Latifah"],
            images: ["ai_img/apple.webp", "ai_img/apple2.jpeg"]
        },
        invertedTriangle: {
            description: "Broad shoulders with narrow hips",
            dos: [
                "Wide-leg pants",
                "A-line skirts",
                "V-neck tops",
                "Details at hips (pockets, embellishments)"
            ],
            donts: [
                "Puffed sleeves",
                "Shoulder pads",
                "Turtle necks",
                "Strapless tops"
            ],
            celebs: ["Angelina Jolie", "Demi Moore", "Serena Williams"],
            images: ["ai_mg/inverted1.webp", "ai_img/inverted2.webp"]
        }
    },
    heightCategories: {
        petite: {
            description: "Under 5'3\" (160cm)",
            dos: [
                "Monochrome outfits",
                "Vertical stripes",
                "High-waisted bottoms",
                "Fitted silhouettes",
                "Pointed-toe shoes",
                "Cropped jackets"
            ],
            donts: [
                "Oversized clothing",
                "Maxi dresses that are too long",
                "Large prints",
                "Chunky shoes"
            ],
            images: ["ai_img/petite1.jpg", "ai_img/petite2.webp"]
        },
        average: {
            description: "5'4\" to 5'7\" (163-170cm)",
            dos: [
                "Most styles work well",
                "Can experiment with proportions",
                "Mid-length dresses",
                "Various necklines"
            ],
            donts: [
                "Extremely long tops with long skirts",
                "Overly bulky layers"
            ],
            images: ["ai_img/average1.jpg", "ai_img/average2.jpg"]
        },
        tall: {
            description: "Over 5'8\" (173cm)",
            dos: [
                "Maxi dresses and skirts",
                "Wide-leg pants",
                "Oversized silhouettes",
                "Bold prints",
                "Layered looks"
            ],
            donts: [
                "Cropped pants that are too short",
                "Small prints that look disproportionate",
                "Super short skirts unless desired"
            ],
            images: ["ai_img/tall1.webp", "ai_img/tall2.webp"]
        }
    },
    colorSeasons: {
        spring: {
            description: "Warm and bright with yellow undertones",
            bestColors: ["Coral", "Peach", "Camel", "True red", "Emerald green", "Aqua", "Light yellow", "Warm pink"],
            avoid: ["Black", "White", "Cool pastels", "Muted tones"],
            palettes: ["ai_img/spring.jpg"],
            celebs: ["Nicole Kidman", "Jessica Chastain", "Amy Adams"]
        },
        summer: {
            description: "Cool and muted with blue undertones",
            bestColors: ["Powder blue", "Lavender", "Rose", "Soft white", "Dusty pink", "Slate gray", "Mint green"],
            avoid: ["Orange", "Black", "Bright yellow", "Warm browns"],
            palettes: ["ai_img/summer.webp"],
            celebs: ["Meryl Streep", "Mila Kunis", "Gwyneth Paltrow"]
        },
        autumn: {
            description: "Warm and rich with golden undertones",
            bestColors: ["Mustard", "Olive", "Terracotta", "Burnt orange", "Deep teal", "Camel", "Rust", "Gold"],
            avoid: ["Pastels", "Bright cool colors", "Black", "White"],
            palettes: ["ai_img/autumn.jpg"],
            celebs: ["Julia Roberts", "Emma Stone", "Julianne Moore"]
        },
        winter: {
            description: "Cool and clear with blue/pink undertones",
            bestColors: ["True black", "Pure white", "Royal blue", "Fuchsia", "Emerald", "Silver", "Ruby red", "Hot pink"],
            avoid: ["Beige", "Orange", "Muted tones", "Pastels"],
            palettes: ["ai_img/winter.jpg"],
            celebs: ["Anne Hathaway", "Lucy Liu", "Diane Kruger"]
        }
    },
    occasions: {
        office: {
            formal: {
                description: "Corporate professional attire",
                outfits: [
                    "Tailored pantsuit with blouse",
                    "Pencil skirt with button-down shirt",
                    "Dress with blazer",
                    "Trouser with silk top and structured jacket"
                ],
                colors: ["Navy", "Black", "Gray", "White", "Burgundy"],
                shoes: ["Pumps", "Loafers", "Closed-toe heels"],
                accessories: ["Minimal jewelry", "Structured bag", "Watch"],
                images: ["ai_img/office.jpg", "ai_img/office2.png"]
            },
            businessCasual: {
                description: "Smart casual office wear",
                outfits: [
                    "Dark jeans with blazer and blouse",
                    "Midi skirt with tucked-in sweater",
                    "Dress pants with patterned top",
                    "Jumpsuit with cardigan"
                ],
                colors: ["Rich tones", "Subtle patterns", "Dark denim"],
                shoes: ["Ankle boots", "Ballet flats", "Block heels"],
                accessories: ["Statement necklace", "Tote bag", "Scarf"],
                images: ["ai_img/business.jpg", "ai_img/business2.jpg"]
            },
            creative: {
                description: "Artistic and expressive work attire",
                outfits: [
                    "Printed midi dress with ankle boots",
                    "Colored trousers with graphic tee and blazer",
                    "Leather pants with silk blouse",
                    "Maxi skirt with tucked-in turtleneck"
                ],
                colors: ["Bold colors", "Pattern mixes", "Metallics"],
                shoes: ["Statement heels", "Designer sneakers", "Unique boots"],
                accessories: ["Bold jewelry", "Artistic bags", "Hats"],
                images: ["ai_img/creative1.jpg", "ai_img/creative2.jpg"]
            }
        },
        casual: {
            dayOut: {
                description: "Everyday casual wear",
                outfits: [
                    "Jeans with t-shirt and sneakers",
                    "Sundress with sandals",
                    "Joggers with crop top and denim jacket",
                    "Shorts with tank top and cardigan"
                ],
                colors: ["All colors", "Fun patterns", "Denim"],
                shoes: ["Sneakers", "Sandals", "Slides"],
                accessories: ["Crossbody bag", "Sunglasses", "Baseball cap"],
                images: ["ai_img/dayout1.jpg", "ai_img/dayout2.webp"]
            },
            nightOut: {
                description: "Casual evening wear",
                outfits: [
                    "Black jeans with silky top and heels",
                    "Mini dress with ankle boots",
                    "Leather skirt with bodysuit",
                    "Jumpsuit with statement earrings"
                ],
                colors: ["Darker tones", "Jewel tones", "Black"],
                shoes: ["Heels", "Booties", "Strappy sandals"],
                accessories: ["Clutch", "Bold jewelry", "Evening bag"],
                images: ["ai_img/nightout1.jpg", "img/casual-night2.jpg"]
            }
        },
        formal: {
            cocktail: {
                description: "Semi-formal evening attire",
                outfits: [
                    "Little black dress with statement jewelry",
                    "Midi cocktail dress with heels",
                    "Jumpsuit with elegant accessories",
                    "Skirt set with dressy top"
                ],
                colors: ["Black", "Jewel tones", "Metallics"],
                shoes: ["Pumps", "Strappy heels", "Embellished flats"],
                accessories: ["Clutch", "Sparkly jewelry", "Evening wrap"],
                images: ["ai_img/party1.webp", "ai_img/party22.jpg"]
            },
            blackTie: {
                description: "Formal evening wear",
                outfits: [
                    "Floor-length gown",
                    "Formal pantsuit with elegant top",
                    "Sequined evening dress",
                    "Silk slip dress with luxurious wrap"
                ],
                colors: ["Classic black", "Deep jewel tones", "Metallics"],
                shoes: ["High heels", "Evening sandals", "Designer pumps"],
                accessories: ["Evening bag", "Chandelier earrings", "Statement necklace"],
                images: ["ai_img/party2.webp", "ai_img/party4.jpg"]
            }
        },
        seasonal: {
            summer: {
                description: "Hot weather outfits",
                outfits: [
                    "Sundress with sandals",
                    "Linen pants with tank top",
                    "Shorts with breezy blouse",
                    "Romper with sunhat"
                ],
                colors: ["Brights", "Whites", "Pastels"],
                shoes: ["Sandals", "Espadrilles", "Slides"],
                accessories: ["Sunglasses", "Straw bag", "Sunhat"],
                images: ["ai_img/summer1.webp", "ai_img/summer2.jpg"]
            },
            winter: {
                description: "Cold weather outfits",
                outfits: [
                    "Sweater dress with boots",
                    "Jeans with turtleneck and coat",
                    "Wool skirt with tights and boots",
                    "Puffer jacket with leggings"
                ],
                colors: ["Darker tones", "Jewel tones", "Neutrals"],
                shoes: ["Boots", "Loafers", "Winter sneakers"],
                accessories: ["Scarf", "Gloves", "Beanie"],
                images: ["ai_img/winter1.jpg", "ai_img/winter2.jpg"]
            }
        }
    }
};

// Create a chat message element
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    
    let chatContent = className === "outgoing" ? `<p></p>` : `
        <span class="material-symbols-outlined">styler</span>
        <p></p>
        <div class="image-container"></div>
    `;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
};

// Display images in the chat
const displayImages = (chatElement, images) => {
    const imageContainer = chatElement.querySelector(".image-container");
    imageContainer.innerHTML = ''; // Clear previous images
    imageContainer.style.display = 'flex'; // Show container
    
    if (images && images.length > 0) {
        images.forEach(imgSrc => {
            const imgWrapper = document.createElement('div');
            imgWrapper.style.margin = '5px';
            imgWrapper.style.textAlign = 'center';
            
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            imgElement.alt = "Fashion example";
            imgElement.style.width = '100px';
            imgElement.style.height = '150px';
            imgElement.style.objectFit = 'cover';
            imgElement.style.borderRadius = '8px';
            imgElement.onerror = function() {
               // If image fails to load, show a placeholder
                this.src = 'https://via.placeholder.com/100x150?text=Image+Not+Found';
            };
            
            imgWrapper.appendChild(imgElement);
            imageContainer.appendChild(imgWrapper);
        });
    } else {
        imageContainer.style.display = 'none'; // Hide if no images
    }
};

// Generate response based on user message
const generateResponse = (chatElement, userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Check for skin tone queries
    for (const tone in fashionDatabase.skinTones) {
        if (message.includes(tone) || message.includes(fashionDatabase.skinTones[tone].description.toLowerCase())) {
            const toneData = fashionDatabase.skinTones[tone];
            let response = `For ${tone} skin tones (${toneData.description}), here are some recommendations:\n\n`;
            response += `Best colors: ${toneData.bestColors.join(", ")}\n`;
            response += `Jewelry: ${toneData.jewelry}\n`;
            response += `Makeup suggestions: ${toneData.makeup}\n`;
            response += `Celebrities with similar tones: ${toneData.celebrities.join(", ")}`;
            
            chatElement.querySelector("p").textContent = response;
            const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    imageContainer.style.display = 'flex';
    imageContainer.style.flexWrap = 'wrap';
    imageContainer.style.gap = '10px';
    imageContainer.style.marginTop = '15px';
    
    toneData.images.forEach(imgSrc => {
        const imgElement = document.createElement('img');
        imgElement.src = imgSrc;
        imgElement.alt = `${tone} skin tone fashion example`;
        imgElement.style.width = '100px';
        imgElement.style.height = '150px';
        imgElement.style.objectFit = 'cover';
        imgElement.style.borderRadius = '8px';
        imageContainer.appendChild(imgElement);
    });
    
    // Append images after the message
    chatElement.appendChild(imageContainer);
    return;
}
    }
    
    // Check for body type queries
    for (const type in fashionDatabase.bodyTypes) {
        if (message.includes(type) || message.includes(fashionDatabase.bodyTypes[type].description.toLowerCase())) {
            const typeData = fashionDatabase.bodyTypes[type];
            let response = `For ${type} body type (${typeData.description}), here are some suggestions:\n\n`;
                        response += `DOs:\n- ${typeData.dos.join("\n- ")}\n\n`;
            response += `DON'Ts:\n- ${typeData.donts.join("\n- ")}\n\n`;
            response += `Celebrities with similar body type: ${typeData.celebs.join(", ")}`;
            
            chatElement.querySelector("p").textContent = response;
            displayImages(chatElement, typeData.images);
            return;
        }
    }
    
    // Check for height category queries
    for (const height in fashionDatabase.heightCategories) {
        if (message.includes(height)) {
            const heightData = fashionDatabase.heightCategories[height];
            let response = `For ${height} height (${heightData.description}), here are some tips:\n\n`;
            response += `DOs:\n- ${heightData.dos.join("\n- ")}\n\n`;
            response += `DON'Ts:\n- ${heightData.donts.join("\n- ")}`;
            
            chatElement.querySelector("p").textContent = response;
            displayImages(chatElement, heightData.images);
            return;
        }
    }
    
    // Check for color season queries
    for (const season in fashionDatabase.colorSeasons) {
        if (message.includes(season)) {
            const seasonData = fashionDatabase.colorSeasons[season];
            let response = `For ${season} color season (${seasonData.description}), here are recommendations:\n\n`;
            response += `Best colors: ${seasonData.bestColors.join(", ")}\n`;
            response += `Colors to avoid: ${seasonData.avoid.join(", ")}\n`;
            response += `Celebrities with similar coloring: ${seasonData.celebs.join(", ")}`;
            
            chatElement.querySelector("p").textContent = response;
            displayImages(chatElement, seasonData.palettes);
            return;
        }
    }
    
    // Check for occasion queries
    for (const occasionType in fashionDatabase.occasions) {
        for (const occasion in fashionDatabase.occasions[occasionType]) {
            if (message.includes(occasion) || message.includes(occasionType)) {
                const occasionData = fashionDatabase.occasions[occasionType][occasion];
                let response = `For ${occasionType} ${occasion} (${occasionData.description}), consider these options:\n\n`;
                response += `Outfit ideas:\n- ${occasionData.outfits.join("\n- ")}\n\n`;
                response += `Recommended colors: ${occasionData.colors.join(", ")}\n`;
                response += `Shoe suggestions: ${occasionData.shoes.join(", ")}\n`;
                response += `Accessories: ${occasionData.accessories.join(", ")}`;
                
                chatElement.querySelector("p").textContent = response;
                displayImages(chatElement, occasionData.images);
                return;
            }
        }
    }
    
    // If no match found in database, use Gemini API
    fetchGeminiResponse(chatElement, userMessage);
};

// Fetch response from Gemini API for queries not in database
const fetchGeminiResponse = (chatElement, userMessage) => {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a fashion stylist assistant. Provide detailed fashion advice for: "${userMessage}". 
                    Include outfit suggestions, color recommendations, and styling tips. Keep response under 500 characters.`
                }]
            }]
        })
    };
    
    chatElement.querySelector("p").textContent = "Consulting my fashion expertise...";
    
    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            try {
                let geminiResponse = data.candidates[0].content.parts[0].text;
                
                // Remove Markdown formatting if any slips through
                geminiResponse = geminiResponse
                    .replace(/\*\*/g, '')  // Remove **bold**
                    .replace(/\*/g, '')     // Remove *italics*
                    .replace(/`/g, '');    // Remove `code` marks
                
                chatElement.querySelector("p").textContent = geminiResponse;
            } catch {
                chatElement.querySelector("p").textContent = "I couldn't find specific fashion advice for that. Could you try rephrasing?";
            }
        })
        .catch(() => {
            chatElement.querySelector("p").textContent = "Oops! My fashion connection failed. Please try again later.";
        });
};

// Handle user chat input
const handleChat = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    
    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi, userMessage);
    }, 600);
};

// Event listeners
// Event listeners
chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => {
    document.body.classList.remove("show-chatbot");
    document.querySelector('.chatbot').classList.remove('fullscreen');
});

// Enhanced chatbot toggler with double-click functionality
let lastClickTime = 0;
chatbotToggler.addEventListener("click", (e) => {
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // If double click (within 300ms)
    if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
        document.querySelector('.chatbot').classList.toggle('fullscreen');
    } else {
        document.body.classList.toggle("show-chatbot");
    }
    
    lastClickTime = currentTime;
});

// Auto fullscreen on small devices
function checkScreenSize() {
    const chatbot = document.querySelector('.chatbot');
    if (window.innerWidth <= 490) {
        chatbot.classList.add('fullscreen');
    } else {
        chatbot.classList.remove('fullscreen');
    }
}

// Check on load and resize
window.addEventListener('DOMContentLoaded', () => {
    checkScreenSize();
    
    setTimeout(() => {
        const welcomeChatLi = createChatLi("Hello! I'm your Fashion AI Assistant. Ask me about styling tips, color recommendations, or outfit ideas for any occasion.", "incoming");
        chatbox.appendChild(welcomeChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
    }, 1000);
});

window.addEventListener('resize', checkScreenSize);
