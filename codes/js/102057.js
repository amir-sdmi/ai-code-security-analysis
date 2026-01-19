// DOM Elements (assuming these are already defined)
const platformTabs = document.querySelectorAll('.platform-tab');
const searchInput = document.getElementById('game-search');
const resultsSection = document.getElementById('results-section');
const aiResponseSection = document.getElementById('ai-response');
const aiContentDisplay = document.getElementById('ai-content');
const aiImagesGrid = document.getElementById('ai-images');
const gamesGrid = document.getElementById('games-grid');
const noResultsSection = document.getElementById('no-results');
const loadingSection = document.getElementById('loading-section');

let currentSelectedPlatform = 'all';

// --- Platform Selection ---
function selectPlatform(element, platformName) {
    platformTabs.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
    currentSelectedPlatform = platformName;
    console.log(`Selected platform: ${currentSelectedPlatform}`);
    // Optional: if results are visible, trigger a new search for the selected platform
    // if (resultsSection.style.display !== 'none' || noResultsSection.style.display !== 'none') {
    //     searchGames();
    // }
}

// --- Gemini API Integration (Conceptual) ---
async function fetchGamesFromGemini(query, platform) {
    console.log(`Conceptual Fetch: Querying Gemini for "${query}" on platform "${platform}"`);
    // ** 1. Define API Endpoint and Parameters **
    // const GEMINI_API_ENDPOINT = "YOUR_GEMINI_API_ENDPOINT_HERE"; // Replace with actual endpoint
    // const API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // IMPORTANT: Never hardcode API keys in client-side JS for production. Use a backend proxy.

    // Construct the request payload or URL parameters based on Gemini API docs.
    // This is a hypothetical example.
    // const requestBody = {
    //     query: query,
    //     platform: platform,
    //     max_results: 10, // example parameter
    //     // You'd need to specify that you want video URLs, download links, etc.
    //     // e.g., required_fields: ["title", "description", "videoUrl", "thumbnailUrl", "downloadLink", "platforms", "aiSummary", "aiImages"]
    // };

    try {
        // ** 2. Make the API Call (Conceptual) **
        // const response = await fetch(GEMINI_API_ENDPOINT, {
        //     method: 'POST', // or 'GET', depending on API
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${API_KEY}` // Example authorization
        //     },
        //     body: JSON.stringify(requestBody)
        // });

        // if (!response.ok) {
        //     throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        // }
        // const data = await response.json();
        // console.log("Received data from Gemini (conceptual):", data);

        // ** 3. Process and Return Data (Conceptual) - Simulate for now **
        // For demonstration, we'll return the same mock data structure.
        // The actual 'data' object from Gemini would need to be mapped to this structure.
        // For example:
        // return {
        //     games: data.results.map(game => ({
        //         id: game.gemini_id, // or generate one
        //         title: game.title,
        //         description: game.description,
        //         platforms: game.platforms_supported,
        //         rating: game.rating_score,
        //         releaseDate: game.release_year,
        //         videoUrl: game.video_link, // CRUCIAL
        //         thumbnailUrl: game.video_thumbnail, // CRUCIAL
        //         downloadLink: game.official_download_page, // CRUCIAL
        //         badge: game.highlight_tag
        //     })),
        //     aiSummary: data.ai_generated_summary,
        //     aiImages: data.ai_generated_images_urls
        // };
        
        // Simulating a delay and returning mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        console.warn("Using MOCK DATA because Gemini API is not actually called.");
        return generateMockResults(query, platform); // Fallback to mock data generator

    } catch (error) {
        console.error("Error fetching data from Gemini (conceptual):", error);
        // Return a structure that indicates an error or empty results
        return { games: [], aiSummary: "حدث خطأ أثناء محاولة الاتصال بـ Gemini.", aiImages: [] };
    }
}

// --- Search Functionality ---
async function searchGames() { // Made async to await fetchGamesFromGemini
    const query = searchInput.value.trim();
    console.log(`Searching for: "${query}" on platform: "${currentSelectedPlatform}"`);

    if (!query) {
        console.log("Search query is empty.");
        const originalPlaceholder = searchInput.placeholder;
        searchInput.placeholder = "الرجاء إدخال مصطلح للبحث!";
        searchInput.style.borderColor = "var(--accent)"; // Highlight border
        setTimeout(() => {
            searchInput.placeholder = originalPlaceholder;
            searchInput.style.borderColor = ""; // Revert border
        }, 3000);
        return;
    }

    loadingSection.style.display = 'flex';
    resultsSection.style.display = 'none';
    noResultsSection.style.display = 'none';
    aiResponseSection.style.display = 'none';

    // Call the conceptual Gemini fetch function
    const results = await fetchGamesFromGemini(query, currentSelectedPlatform);

    loadingSection.style.display = 'none';
    if (results && results.games && results.games.length > 0) {
        displayAiResponse(results.aiSummary, results.aiImages);
        displayGames(results.games);
        resultsSection.style.display = 'block';
        aiResponseSection.style.display = 'block';
    } else {
        // Display AI summary even if no games or if there was an error message from fetchGamesFromGemini
        displayAiResponse(results.aiSummary || "لم يتم العثور على نتائج أو حدث خطأ.", results.aiImages || []);
        aiResponseSection.style.display = 'block';
        showNoResults(); // Show "no results for games"
    }
}


function generateMockResults(query, platform) {
    // (This function remains the same as in the previous step)
    const allGames = [
        { 
            id: 1, title: "مغامرة الفضاء", description: "لعبة مغامرات في الفضاء الشاسع لاستكشاف كواكب جديدة ومحاربة الأعداء.",
            platforms: ["PC", "PlayStation"], rating: 4.5, releaseDate: "2023-03-15",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
            thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", 
            downloadLink: "https://store.example.com/spaceadventure",
            badge: "جديد"
        },
        { 
            id: 2, title: "سباق الصحراء", description: "سباقات مثيرة في بيئات صحراوية قاسية مع تخصيص المركبات.",
            platforms: ["Xbox", "PC"], rating: 4.2, releaseDate: "2022-11-01",
            videoUrl: "https://www.youtube.com/watch?v=exampleVideo2", 
            thumbnailUrl: "https://img.youtube.com/vi/hashID_of_video2/hqdefault.jpg", // Placeholder for actual thumbnail
            downloadLink: "https://store.example.com/desertrace",
            badge: "الأكثر مبيعاً"
        },
        { 
            id: 3, title: "ألغاز الغابة المسحورة", description: "حل الألغاز المعقدة في غابة سحرية مليئة بالأسرار.",
            platforms: ["Nintendo Switch", "iOS", "Android"], rating: 4.7, releaseDate: "2023-01-20",
            videoUrl: "https://www.youtube.com/watch?v=exampleVideo3",
            thumbnailUrl: "https://img.youtube.com/vi/hashID_of_video3/hqdefault.jpg", // Placeholder
            downloadLink: "https://store.example.com/forestpuzzle"
        },
         { 
            id: 4, title: "محاكي الطيران 2024", description: "تجربة طيران واقعية فوق مدن العالم الشهيرة.",
            platforms: ["PC", "macOS"], rating: 4.8, releaseDate: "2023-10-10",
            videoUrl: "https://www.youtube.com/watch?v=exampleVideo4",
            thumbnailUrl: "https://img.youtube.com/vi/hashID_of_video4/hqdefault.jpg", // Placeholder
            downloadLink: "https://store.example.com/flightsim",
            badge: "واقعية"
        },
        { 
            id: 5, title: "مزرعة الأحلام", description: "ابن مزرعتك الخاصة وحقق أحلامك الريفية.",
            platforms: ["iOS", "Android", "Website"], rating: 4.3, releaseDate: "2022-05-25",
            videoUrl: "https://www.youtube.com/watch?v=exampleVideo5",
            thumbnailUrl: "https://img.youtube.com/vi/hashID_of_video5/hqdefault.jpg", // Placeholder
            downloadLink: "https://store.example.com/dreamfarm"
        }
    ];

    let filteredGames = allGames;
    if (platform.toLowerCase() !== 'all') {
        filteredGames = allGames.filter(game => 
            game.platforms.map(p => p.toLowerCase()).includes(platform.toLowerCase())
        );
    }

    if (query) {
        const lowerQuery = query.toLowerCase();
        filteredGames = filteredGames.filter(game => 
            game.title.toLowerCase().includes(lowerQuery) || 
            game.description.toLowerCase().includes(lowerQuery)
        );
    }
    
    let aiSummary = `بناءً على بحثك عن "${query}" لمنصة "${currentSelectedPlatform}", هذه بعض الاقتراحات:`;
    if (filteredGames.length === 0) {
        aiSummary = `لم نجد توصيات محددة لـ "${query}" على منصة "${currentSelectedPlatform}". قد ترغب في تجربة مصطلحات بحث أوسع أو التحقق من منصة "الكل".`;
    } else {
         aiSummary += ` وجدنا ${filteredGames.length} لعبة قد تستمتع بها.`;
    }

    const aiImages = filteredGames.length > 0 ? 
        [
            "https://via.placeholder.com/200x150.png?text=Gemini+Idea+1",
            "https://via.placeholder.com/200x150.png?text=Gemini+Idea+2",
            "https://via.placeholder.com/200x150.png?text=Gemini+Idea+3"
        ] : [];

    return { games: filteredGames, aiSummary: aiSummary, aiImages: aiImages };
}

// --- Display Logic (remains the same as in previous step) ---
function displayGames(gamesData) {
    gamesGrid.innerHTML = ''; 
    if (!gamesData || gamesData.length === 0) { return; }

    gamesData.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
        let platformTagsHtml = game.platforms.map(plat => `<span class="platform-tag">${plat}</span>`).join('');

        // Create the game image div
        const gameImageDiv = document.createElement('div');
        gameImageDiv.classList.add('game-image');
        gameImageDiv.style.backgroundImage = `url('${game.thumbnailUrl}')`;
        gameImageDiv.style.backgroundSize = 'cover';
        gameImageDiv.style.backgroundPosition = 'center';
        gameImageDiv.setAttribute('role', 'button'); // Accessibility: role
        gameImageDiv.setAttribute('tabindex', '0');  // Accessibility: make focusable
        gameImageDiv.addEventListener('click', () => openGameVideo(game.videoUrl));
        gameImageDiv.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                openGameVideo(game.videoUrl);
            }
        });

        gameCard.innerHTML = `
            ${game.badge ? `<div class="game-badge">${game.badge}</div>` : ''}
            ${/* Placeholder for gameImageDiv to be inserted below */}
            <div class="game-content">
                <h4 class="game-title">${game.title}</h4>
                <div class="game-meta">
                    <span><i class="fas fa-star game-rating"></i> ${game.rating || 'N/A'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${game.releaseDate || 'غير معروف'}</span>
                </div>
                <p class="game-description">${game.description}</p>
                <a href="${game.downloadLink}" class="game-download-link" target="_blank">
                    <i class="fas fa-download"></i> تحميل اللعبة
                </a>
                <div class="game-platforms">
                    ${platformTagsHtml}
                </div>
            </div>
        `;
        // Insert the gameImageDiv before the game-content
        gameCard.insertBefore(gameImageDiv, gameCard.querySelector('.game-content'));
        
        gamesGrid.appendChild(gameCard);
    });
}

function openGameVideo(videoUrl) {
    console.log("Attempting to open video: ", videoUrl);
    if (videoUrl && videoUrl !== 'undefined' && videoUrl !== 'null') { // Check for placeholder strings too
        window.open(videoUrl, '_blank');
    } else {
        alert("رابط الفيديو غير متوفر حالياً!");
    }
}

function displayAiResponse(aiText, aiImagesData) {
    aiContentDisplay.innerHTML = ''; 
    aiImagesGrid.innerHTML = '';    

    if (aiText) {
        const p = document.createElement('p');
        p.textContent = aiText;
        aiContentDisplay.appendChild(p);
    }

    if (aiImagesData && aiImagesData.length > 0) {
        aiImagesData.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "AI Generated Image";
            img.classList.add('ai-image');
            aiImagesGrid.appendChild(img);
        });
    }
}

function showNoResults() {
    resultsSection.style.display = 'none'; 
    noResultsSection.style.display = 'block';
    console.log("Showing no results message for games.");
}

// --- Event Handlers ---
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchGames();
    }
}

function setSearchExample(query) {
    searchInput.value = query;
    searchGames();
}

// --- Initial Page Load Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initial sections hidden via HTML.");
});
