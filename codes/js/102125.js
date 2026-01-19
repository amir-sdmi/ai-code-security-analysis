// ========================================================================
// 1. SETUP & INITIALIZATION
// ========================================================================
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express App
const app = express();
const PORT = 3000;

// Initialize Google Gemini AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Using gemini-pro, as it was confirmed to work after the last fix

// Middleware
app.use(express.static('public')); // Serve static files from the 'public' folder
app.use(express.json()); // Parse JSON bodies for API requests (needed for the chatbot)

// ========================================================================
// 2. HARD-CODED "DATABASE" (WITH NEW DATA FIELDS)
// ========================================================================

const partyDatabase = {
    bjp: {
        id: "bjp",
        name: "Bhartiya Janata Party (BJP)",
        logo: "images/bjp-logo.png",
        tagline: "A Right-wing party focusing on nationalism, development, and cultural identity.",
        status: "Ruling Party",
        lokSabhaSeats: "303 (2019)",
        trustScore: "75%",
        history: [
            { year: "1980", event: "Founded by members of the former Jana Sangh." },
            { year: "2014", event: "Won a majority in the Lok Sabha with Narendra Modi as Prime Minister." },
            { year: "2019", event: "Re-elected with an even larger majority." }
        ],
        // NEW: Core Ideology
        coreIdeology: [
            "Integral Humanism: Holistic development of individual and society.",
            "Hindutva: Cultural nationalism and emphasis on Indian identity.",
            "Good Governance: Focus on efficiency, transparency, and development."
        ],
        // NEW: Economic Stance
        economicStance: [
            "Market-oriented reforms with social welfare programs.",
            "Emphasis on 'Make in India' to boost domestic manufacturing.",
            "Infrastructure development (roads, railways, digital) as a growth driver."
        ],
        manifesto: [
            { icon: "fas fa-landmark", title: "Nationalism & Security", points: ["Annulled Article 370.", "Zero tolerance policy towards terrorism."] },
            { icon: "fas fa-briefcase", title: "Economy", points: ["Goal to make India a $5 trillion economy.", "Focus on 'Make in India' initiative."] }
        ],
        promises: [
            { status: "fulfilled", text: "Annulment of Article 370 in Jammu & Kashmir.", icon: "fa-check-circle" },
            { status: "in-progress", text: "Construction of Ram Mandir in Ayodhya.", icon: "fa-clock-rotate-left" }
        ],
        politicians: [
            { id: "modi", name: "Narendra Modi", role: "Prime Minister" },
            { id: "shah", name: "Amit Shah", role: "Home Minister" }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/BJP4India/",
            twitter: "https://twitter.com/BJP4India",
            youtube: "https://www.youtube.com/user/BJP4India"
        }
    },
    inc: {
        id: "inc",
        name: "Indian National Congress (INC)",
        logo: "images/inc-logo.png",
        tagline: "A Centre-left party focusing on social democracy, secularism, and welfare.",
        status: "Opposition",
        lokSabhaSeats: "52 (2019)",
        trustScore: "62%",
        history: [
            { year: "1885", event: "Founded during the British Raj to obtain a greater share in government." },
            { year: "2004", event: "Led the UPA coalition to victory, with Manmohan Singh as Prime Minister." }
        ],
        // NEW: Core Ideology
        coreIdeology: [
            "Gandhian Secularism: Upholding pluralism and equal rights for all religions.",
            "Social Democracy: Commitment to social justice, equality, and welfare state.",
            "Inclusive Growth: Policies aimed at uplifting marginalized sections of society."
        ],
        // NEW: Economic Stance
        economicStance: [
            "Historically a mixed economy, now leaning towards liberalized markets with strong social safety nets.",
            "Emphasis on direct benefit transfers and poverty alleviation schemes like NYAY.",
            "Promoting agriculture and rural development as key economic drivers."
        ],
        manifesto: [
            { icon: "fas fa-users", title: "Social Justice", points: ["Promised a Right to Healthcare Act.", "Focus on NYAY scheme for minimum income."] }
        ],
        promises: [
            { status: "fulfilled", text: "Introduced the MGNREGA employment scheme (during UPA).", icon: "fa-check-circle" }
        ],
        politicians: [
            { id: "gandhi", name: "Rahul Gandhi", role: "Member of Parliament" }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/IndianNationalCongress/",
            twitter: "https://twitter.com/INCIndia",
            youtube: "https://www.youtube.com/user/incindia"
        }
    },
    aap: {
        id: "aap",
        name: "Aam Aadmi Party (AAP)",
        logo: "images/aap-logo.png",
        tagline: "A Centre party focused on anti-corruption and governance reform.",
        status: "National Party",
        lokSabhaSeats: "1 (2019)",
        trustScore: "68%",
        history: [
            { year: "2012", event: "Founded following the 'India Against Corruption' movement." },
            { year: "2015", event: "Won a historic majority in the Delhi Assembly elections." }
        ],
        // NEW: Core Ideology
        coreIdeology: [
            "Anti-Corruption: Primary focus on eradicating corruption from public life.",
            "Swaraj: Decentralized governance and direct democracy.",
            "Populist Policies: Emphasis on free basic services (water, electricity, education, health)."
        ],
        // NEW: Economic Stance
        economicStance: [
            "Focus on improving public services and social welfare through government spending.",
            "Fiscal prudence and efficient tax collection to fund schemes.",
            "Support for small and medium enterprises."
        ],
        manifesto: [
            { icon: "fas fa-graduation-cap", title: "Education", points: ["Reformed government schools in Delhi."] },
            { icon: "fas fa-heartbeat", title: "Healthcare", points: ["Launched the Mohalla Clinic initiative."] }
        ],
        promises: [
            { status: "fulfilled", text: "Providing free electricity up to 200 units in Delhi.", icon: "fa-check-circle" }
        ],
        politicians: [
            { id: "kejriwal", name: "Arvind Kejriwal", role: "Chief Minister of Delhi" }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/AamAadmiParty/",
            twitter: "https://twitter.com/AamAadmiParty",
            youtube: "https://www.youtube.com/user/AamAadmiParty"
        }
    },
    tmc: {
        id: "tmc",
        name: "All India Trinamool Congress (TMC)",
        logo: "images/tmc-logo.png",
        tagline: "A regional party with a strong base in West Bengal, advocating for federal rights.",
        status: "State Party",
        lokSabhaSeats: "22 (2019)",
        trustScore: "65%",
        history: [ { year: "1998", event: "Founded by Mamata Banerjee after leaving the Indian National Congress." } ],
        // NEW: Core Ideology
        coreIdeology: [
            "Ma Mati Manush (Mother, Motherland, People): Emphasis on Bengali identity and welfare.",
            "Secularism: Upholding communal harmony.",
            "Federalism: Advocating for stronger state rights and greater autonomy."
        ],
        // NEW: Economic Stance
        economicStance: [
            "Focus on agricultural development and farmer welfare.",
            "Emphasis on social schemes and direct benefit transfers to citizens.",
            "Promoting industrialization while balancing environmental concerns."
        ],
        manifesto: [ { icon: "fas fa-female", title: "Women's Empowerment", points: ["Kanyashree Prakalpa scheme for girls."] } ],
        promises: [ { status: "fulfilled", text: "Kanyashree Prakalpa scheme has received international recognition.", icon: "fa-check-circle" } ],
        politicians: [ { id: "banerjee", name: "Mamata Banerjee", role: "Chief Minister of West Bengal" } ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/AITMC/",
            twitter: "https://twitter.com/AITCofficial",
            youtube: "https://www.youtube.com/user/AITCofficial"
        }
    }
};

const politicianDatabase = {
    modi: {
        name: "Narendra Modi", role: "Prime Minister of India", photo: "images/modi-photo.jpeg",
        // NEW: Bio expanded
        bio: "Narendra Damodardas Modi (born 17 September 1950) is an Indian politician who has served as the 14th and current Prime Minister of India since 2014. He was the Chief Minister of Gujarat from 2001 to 2014 and is the Member of Parliament for Varanasi. A member of the Bharatiya Janata Party (BJP) and the Rashtriya Swayamsevak Sangh (RSS), he is the longest-serving Prime Minister from a non-Congress party.",
        // NEW: Political Journey
        politicalJourney: [
            { year: "1987", event: "Joined the BJP." },
            { year: "1995", event: "Became National Secretary of BJP." },
            { year: "2001-2014", event: "Served as Chief Minister of Gujarat." },
            { year: "2014", event: "Became Prime Minister of India." }
        ],
        // NEW: Education
        education: [
            { degree: "B.A. (Political Science)", institution: "Delhi University" },
            { degree: "M.A. (Political Science)", institution: "Gujarat University" }
        ],
        performance: { attendance: "85%", debates: "37", bills: "0", questions: "220" },
        controversies: [
            { year: "2016", event: "Oversaw the demonetisation of ₹500 and ₹1000 banknotes, which caused widespread disruption." },
            { year: "2019", event: "The Citizenship Amendment Act (CAA) passed under his government sparked nationwide protests." }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/narendramodi",
            twitter: "https://twitter.com/narendramodi",
            youtube: "https://www.youtube.com/c/NarendraModi"
        }
    },
    shah: {
        name: "Amit Shah", role: "Home Minister", photo: "images/shah-photo.jpg",
        // NEW: Bio expanded
        bio: "Amit Anil Chandra Shah (born 22 October 1964) is an Indian politician who is currently serving as the Minister of Home Affairs since 2019. He served as the President of the Bharatiya Janata Party (BJP) from 2014 to 2020. He is a close associate of Prime Minister Narendra Modi.",
        // NEW: Political Journey
        politicalJourney: [
            { year: "1987", event: "Joined BJP as an activist." },
            { year: "1997", event: "Elected as MLA in Gujarat Assembly." },
            { year: "2010-2014", event: "Served as Gujarat Home Minister." },
            { year: "2014-2020", event: "Served as National President of BJP." }
        ],
        // NEW: Education
        education: [
            { degree: "B.Sc. (Biochemistry)", institution: "Gujarat University" }
        ],
        performance: { attendance: "92%", debates: "112", bills: "2", questions: "150" },
        controversies: [
            { year: "2010", event: "Was arrested in relation to the Sohrabuddin Sheikh case, later acquitted." }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/AmitShah",
            twitter: "https://twitter.com/AmitShah"
        }
    },
    gandhi: {
        name: "Rahul Gandhi", role: "Member of Parliament", photo: "images/gandhi-photo.jpg",
        // NEW: Bio expanded
        bio: "Rahul Gandhi (born 19 June 1970) is an Indian politician and a prominent member of the Indian National Congress. He served as the President of the Indian National Congress from 2017 to 2019.",
        // NEW: Political Journey
        politicalJourney: [
            { year: "2004", event: "Elected to Lok Sabha from Amethi." },
            { year: "2007", event: "Appointed General Secretary of AICC." },
            { year: "2013", event: "Became Vice-President of INC." },
            { year: "2017-2019", event: "Served as President of INC." }
        ],
        // NEW: Education
        education: [
            { degree: "B.A. (International Relations)", institution: "Rollins College, USA" },
            { degree: "M.Phil. (Development Studies)", institution: "Trinity College, Cambridge" }
        ],
        performance: { attendance: "52%", debates: "14", bills: "0", questions: "0" },
        controversies: [
            { year: "2019", event: "Resigned as party president following the party's poor performance in the general election." }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/RahulGandhi",
            twitter: "https://twitter.com/RahulGandhi"
        }
    },
    kejriwal: {
        name: "Arvind Kejriwal", role: "Chief Minister of Delhi", photo: "images/kejriwal-photo.jpg",
        // NEW: Bio expanded
        bio: "Arvind Kejriwal (born 16 August 1968) is an Indian politician and a former Indian Revenue Service officer who is the current and 7th Chief Minister of Delhi since 2015. He is the national convener of the Aam Aadmi Party (AAP).",
        // NEW: Political Journey
        politicalJourney: [
            { year: "1995", event: "Joined Indian Revenue Service (IRS)." },
            { year: "2006", event: "Awarded Ramon Magsaysay Award for his RTI work." },
            { year: "2012", event: "Founded the Aam Aadmi Party (AAP)." },
            { year: "2013-2014", event: "Served first term as Chief Minister of Delhi." },
            { year: "2015", event: "Began second term as Chief Minister of Delhi." }
        ],
        // NEW: Education
        education: [
            { degree: "B.Tech. (Mechanical Engineering)", institution: "IIT Kharagpur" }
        ],
        performance: { attendance: "N/A", debates: "N/A", bills: "N/A", questions: "N/A" },
        controversies: [
            { year: "2014", event: "Resigned as Chief Minister of Delhi after 49 days, a move that was widely criticized." }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/ArvindKejriwal",
            twitter: "https://twitter.com/ArvindKejriwal"
        }
    },
    banerjee: {
        name: "Mamata Banerjee", role: "Chief Minister of West Bengal", photo: "images/banerjee-photo.jpg",
        // NEW: Bio expanded
        bio: "Mamata Banerjee (born 5 January 1955) is an Indian politician who is serving as the 8th and current Chief Minister of West Bengal since 2011. She is the founder and chairperson of the All India Trinamool Congress (AITC) party.",
        // NEW: Political Journey
        politicalJourney: [
            { year: "1984", event: "Elected as MP to the 8th Lok Sabha." },
            { year: "1998", event: "Founded All India Trinamool Congress (AITC)." },
            { year: "1999-2001", event: "Served as Union Minister of Railways." },
            { year: "2011", event: "Became Chief Minister of West Bengal, ending 34 years of Left Front rule." }
        ],
        // NEW: Education
        education: [
            { degree: "B.A. (History)", institution: "Jogamaya Devi College" },
            { degree: "M.A. (Islamic History)", institution: "University of Calcutta" },
            { degree: "B.Ed.", institution: "Shri Shikshayatan College" },
            { degree: "L.L.B.", institution: "Jogesh Chandra Chaudhuri Law College" }
        ],
        performance: { attendance: "N/A", debates: "N/A", bills: "N/A", questions: "N/A" },
        controversies: [
            { year: "2012", event: "Faced criticism for the handling of the Park Street rape case." }
        ],
        // NEW: Social Media
        socialMedia: {
            facebook: "https://www.facebook.com/MamataBanerjeeOfficial",
            twitter: "https://twitter.com/MamataOfficial"
        }
    }
};

// ========================================================================
// 3. API ENDPOINTS (No Change Here)
// ========================================================================
app.get('/api/parties', (req, res) => { const allPartyCardData = Object.values(partyDatabase).map(party => ({ id: party.id, name: party.name, logo: party.logo, tagline: party.tagline, status: party.status, lokSabhaSeats: party.lokSabhaSeats, trustScore: party.trustScore })); res.json(allPartyCardData); });
app.get('/api/party/:partyId', (req, res) => { const data = partyDatabase[req.params.partyId]; if (data) { const fullPoliticianData = data.politicians.map(p => ({ ...p, photo: politicianDatabase[p.id].photo })); res.json({ ...data, politicians: fullPoliticianData }); } else { res.status(404).json({ error: "Party not found" }); } });
app.get('/api/politician/:politicianId', (req, res) => { const data = politicianDatabase[req.params.politicianId]; if (data) res.json(data); else res.status(404).json({ error: "Politician not found" }); });
app.post('/api/chatbot', async (req, res) => {
    try {
        const { question, history } = req.body;
        if (!question) { return res.status(400).json({ error: 'No question provided.' }); }
        const context = `You are a helpful political assistant for an app called VoteWise. Answer the user's question based ONLY on the following context. If the answer isn't in the context, say "I don't have that specific information."\n\nCONTEXT:\n${JSON.stringify({ parties: partyDatabase, politicians: politicianDatabase })}`;
        const fullPrompt = `${context}\n\nCONVERSATION HISTORY:\n${history}\n\nUSER QUESTION:\n${question}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const answer = response.text();
        res.json({ answer: answer });
    } catch (error) {
        console.error("Error with AI Chatbot:", error);
        res.status(500).json({ error: 'Failed to get a response from the AI.' });
    }
});

// ========================================================================
// 4. START THE SERVER (No Change Here)
// ========================================================================
app.listen(PORT, () => {
    console.log(`✅ VoteWise server is running at http://localhost:${PORT}`);
});