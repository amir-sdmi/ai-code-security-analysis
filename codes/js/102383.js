const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const requestLogger = require("./requestLogger.js"); // Adjust path as needed
require("dotenv").config();

// Gemini dependencies and initialization
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini API configuration
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiModel;
if (geminiApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    geminiModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `Input Data structure:
        {
            "account.asus.com": {
                "clicks": 0,
                "totalLife": 3,
                "activeLife": 2,
                "passiveLife": 1,
                "distractions": 0,
                "urlVisited": [
                    {
                        "domain": "account.asus.com",
                        "url": "https://account.asus.com/in/loginform.aspx?skey=bf1f57ae70334ba78e5df57935f4ea31&returnUrl=https%253A%252F%252Faccount.asus.com%252Finfo.aspx%253Flang%253Den-us%2526site%253Din&id=KUw4PLXzLguhkTpMagUClA%253D%253D",
                        "clicks": 0,
                        "sessionDuration": 3,
                        "activeSession": 2,
                        "passiveSession": 1,
                        "distractions": 0,
                        "sessionStart": 1738485587,
                        "sessionEnd": 1738485590
                    }
                ]
            },
            "mail.google.com": {
                "clicks": 0,
                "totalLife": 8,
                "activeLife": 8,
                "passiveLife": 0,
                "distractions": 0,
                "urlVisited": [
                    {
                        "domain": "mail.google.com",
                        "url": "https://mail.google.com/mail/u/0/#inbox",
                        "clicks": 0,
                        "sessionDuration": 8,
                        "activeSession": 8,
                        "passiveSession": 0,
                        "distractions": 0,
                        "sessionStart": 1738485589,
                        "sessionEnd": 1738485597
                    }
                ]
            },
            "www.youtube.com": {
                "clicks": 2,
                "totalLife": 12,
                "activeLife": 11,
                "passiveLife": 1,
                "distractions": 0,
                "urlVisited": [
                    {
                        "domain": "www.youtube.com",
                        "url": "https://www.youtube.com/",
                        "clicks": 2,
                        "sessionDuration": 12,
                        "activeSession": 11,
                        "passiveSession": 1,
                        "distractions": 0,
                        "sessionStart": 1738485599,
                        "sessionEnd": 1738485611
                    }
                ]
            }
        }
        
        
        this is the structure of input data with start and end times in epoch and in gmt, use this data to give me result in following structure:
        
        
        {
            "date": "YYYY-MM-DD",
            "time": "HH:MM:SS",
            "totalTimeSpentSeconds": "integer",
            "focusedTimeSeconds": "integer",
            "distractedTimeSeconds": "integer",
            "totalSitesVisited": "integer",
            "averageTimePerSiteSeconds": "integer",
            "mostActivePeriod": "morning | afternoon | evening | night",
            "mostPassivePeriod": "morning | afternoon | evening | night",
            "averageProductivityScore": "float (0.0 - 100.0)",
            "averageEngagementLevelPerSite": "low | medium | high",
            "overallUsageIntent": "work | entertainment | learning | socialMedia | shopping | newsResearch ",
            "averageSessionType": "focused | distracted | idle",
            "timeOfDayPattern": [
                {
                    "timePeriod": "morning | afternoon | evening | night",
                    "timeSpentSeconds": "integer"
                }
            ],
            "averageEfficiencyRating": "float (0.0 - 100.0)",
            "mostDistractiveSites": ["listOfDomains"],
            "mostProductiveSites": ["listOfDomains"],
            "topFiveSitesVisited": ["listOfDomains"],
            "bottomFiveSitesVisited": ["listOfDomains"],
            "contextualSummary": "string",
            "anomalyDetection": "string",
            "goalTracking": [
                {
                    "goalDescription": "string",
                    "progressPercentage": "float (0.0 - 100.0)"
                }
            ],
            "recommendations": ["listOfStrings"],
            "domains": {
                "example.com": {
                    "category": "work | entertainment | learning | socialMedia | shopping | newsResearch ",
                    "description": "string",
                    "isProductive": "true | false",
                    "productivityScore": "float (0.0 - 100.0)",
                    "firstAccessedTimestamp": "timestamp",
                    "lastAccessedTimestamp": "timestamp",
                    "totalClicks": "integer",
                    "totalTimeSpentSeconds": "integer",
                    "totalDistractedTimeSeconds": "integer",
                    "averageSessionDurationSeconds": "integer",
                    "engagementLevel": "low | medium | high",
                    "visitIntent": "work | entertainment | learning | socialMedia | shopping | newsResearch ",
                    "sessionType": "focused | distracted | idle",
                    "timeOfDayPattern": [
                        {
                            "timePeriod": "morning | afternoon | evening | night",
                            "timeSpentSeconds": "integer"
                        }
                    ],
                    "usageFrequency": "frequent | occasional | rare",
                    "efficiencyRating": "float (0.0 - 100.0)",
                    "behavioralInsights": "string",
                    "recommendations": ["listOfStrings"]
                }
            }
                
            make sure add related reccomendation to each domain data feild as well as get the combined recommendations feild some clear consise and short recommendations. also if there is no goalTracking available suggest some simple clear generic goal to increase a users productivity`,
    });
}

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
};

const app = express();
const PORT = process.env.PORT;
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
AUTH_USERNAME = process.env.AUTH_USERNAME;
AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const TOKENS = {}; // Store rolling tokens

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
// Enable trust proxy
app.set("trust proxy", 1);
app.use(requestLogger); // Log all incoming requests
// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
});
app.use(limiter);

// Middleware for authentication
function authenticate(req, res, next) {
    const token = req.body["accessToken"];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
}

// Route to obtain new tokens
app.post("/auth", (req, res) => {
    const { username, password } = req.body;
    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ user: AUTH_USERNAME }, SECRET_KEY, {
        expiresIn: "3h",
    });
    const refreshToken = jwt.sign({ user: AUTH_USERNAME }, REFRESH_SECRET, {
        expiresIn: "24h",
    });
    TOKENS[refreshToken] = true;

    res.json({ accessToken, refreshToken });
});

// Refresh token route
app.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !TOKENS[refreshToken]) {
        return res.status(403).json({ error: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });

        const newAccessToken = jwt.sign({ user: decoded.user }, SECRET_KEY, {
            expiresIn: "3h",
        });
        res.json({ accessToken: newAccessToken });
    });
});

// Helper function to ensure data types
function ensureCorrectDataTypes(obj) {
    if (Array.isArray(obj)) {
        return obj.map(ensureCorrectDataTypes);
    } else if (typeof obj === "object" && obj !== null) {
        const converted = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                let value = obj[key];
                if (
                    typeof value === "string" &&
                    !isNaN(value) &&
                    value.trim() !== ""
                ) {
                    if (value.includes(".")) {
                        converted[key] = parseFloat(value); // Convert to float if it has a decimal
                    } else {
                        converted[key] = parseInt(value, 10); // Convert to integer otherwise
                    }
                } else if (typeof value === "boolean") {
                    converted[key] = value; // Keep boolean as is
                } else if (typeof value === "number") {
                    converted[key] = value; // Keep number as is
                } else if (Array.isArray(value) || typeof value === "object") {
                    converted[key] = ensureCorrectDataTypes(value); // Recursively fix arrays/objects
                } else {
                    converted[key] = value.toString(); // Convert everything else to string
                }
            }
        }
        return converted;
    }
    return obj;
}

// Helper function to process data
function processData(data) {
    // 1. Get the current date/time
    const now = new Date();

    // 2. Convert current time to IST.
    //    First, get the UTC time by adding the local timezone offset, then add IST offset (5 hours 30 minutes)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // now in UTC in ms
    const istOffset = 5.5 * 60 * 60000; // IST offset in ms (5.5 hours)
    const istTime = new Date(utcTime + istOffset);
    const istEpochSeconds = Math.floor(istTime.getTime() / 1000);

    // 4. Format the IST date as YYYYMMDD.
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-indexed
    const day = String(istTime.getDate()).padStart(2, "0");

    const yyyymmdd = `${year}${month}${day}`;

    const totalTimeSpentSeconds = parseInt(
        Object.values(data).reduce((acc, site) => acc + site.totalLife, 0)
    );
    const focusedTimeSeconds = Object.values(data).reduce(
        (acc, site) => acc + site.activeLife,
        0
    );
    const distractedTimeSeconds = totalTimeSpentSeconds - focusedTimeSeconds;
    const totalSitesVisited = Object.keys(data).length;
    const averageTimePerSiteSeconds = totalSitesVisited
        ? parseFloat((totalTimeSpentSeconds / totalSitesVisited).toFixed(2))
        : 0;

    return {
        date: parseInt(yyyymmdd),
        time: istEpochSeconds,
        totalTimeSpentSeconds,
        focusedTimeSeconds,
        distractedTimeSeconds,
        totalSitesVisited,
        averageTimePerSiteSeconds,
        mostActivePeriod: "morning", // Placeholder
        mostPassivePeriod: "night", // Placeholder
        averageProductivityScore: 80.5, // Placeholder
        averageEngagementLevelPerSite: "medium", // Placeholder
        overallUsageIntent: "work", // Placeholder
        averageSessionType: "focused", // Placeholder
        timeOfDayPattern: [], // Placeholder
        averageEfficiencyRating: 85.0, // Placeholder
        mostDistractiveSites: [], // Placeholder
        mostProductiveSites: [], // Placeholder
        topFiveSitesVisited: [], // Placeholder
        bottomFiveSitesVisited: [], // Placeholder
        contextualSummary: "", // Placeholder
        anomalyDetection: "", // Placeholder
        goalTracking: [], // Placeholder
        recommendations: [], // Placeholder
        domains: {}, // Placeholder for detailed domain insights
    };
}

// -------------------------------
// Gemini API Call Helper Function
// -------------------------------
async function callGemini(inputData) {
    if (!geminiModel) {
        throw new Error("Gemini model is not configured.");
    }

    // Start a chat session with Gemini
    const chatSession = geminiModel.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [{ text: JSON.stringify(inputData, null, 2) }],
            },
        ],
    });

    // Await Gemini's response
    const result = await chatSession.sendMessage(
        "Please process the data as specified."
    );

    // Depending on the API, you may need to parse the response
    // Here we assume Gemini returns valid JSON as text.
    try {
        const parsedResponse = JSON.parse(result.response.text());
        return parsedResponse;
    } catch (error) {
        throw new Error("Failed to parse Gemini response: " + error.message);
    }
}

// -------------------------------
// Data processing route
// -------------------------------
app.post("/process", async (req, res) => {
    try {
        // Extract the accessToken and the actual site data
        const { accessToken, ...data } = req.body;
        if (!accessToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Verify the token first
        jwt.verify(accessToken, SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Invalid token" });
            }
            req.user = decoded; // attach user info if needed

            // 1. Compute your baseline data using your local function.
            const baseline = processData(data);

            // 2. Get the Gemini result by calling its API.
            var geminiData;
            try {
                geminiData = await callGemini(data);
            } catch (geminiErr) {
                console.error("Gemini processing failed:", geminiErr);
                return res
                    .status(500)
                    .json({ error: "Gemini processing failed" });
            }

            geminiData = ensureCorrectDataTypes(geminiData);

            // 3. Recalculate the baseline fields from gemini.domains.
            const domains = geminiData.domains || {};
            let computedTotalTimeSpentSeconds = 0;
            let computedFocusedTimeSeconds = 0;
            let computedDistractedTimeSeconds = 0;
            let domainCount = 0;
            let timePatternTotals = {}; // e.g. { morning: 300, afternoon: 120, ... }

            // We'll also prepare an array for top/bottom sites calculations
            const domainArray = [];

            for (const domainKey in domains) {
                if (!domains.hasOwnProperty(domainKey)) continue;
                const domain = domains[domainKey];
                domainCount++;
                computedTotalTimeSpentSeconds += domain.totalTimeSpentSeconds;
                const focused =
                    domain.totalTimeSpentSeconds -
                    domain.totalDistractedTimeSeconds;
                computedFocusedTimeSeconds += focused;
                computedDistractedTimeSeconds +=
                    domain.totalDistractedTimeSeconds;

                // Save the domain info for top/bottom calculations
                domainArray.push({
                    domain: domainKey,
                    totalTimeSpentSeconds: domain.totalTimeSpentSeconds,
                });

                // Process each domain's timeOfDayPattern
                if (
                    domain.timeOfDayPattern &&
                    Array.isArray(domain.timeOfDayPattern)
                ) {
                    domain.timeOfDayPattern.forEach((tp) => {
                        if (!timePatternTotals[tp.timePeriod]) {
                            timePatternTotals[tp.timePeriod] = 0;
                        }
                        timePatternTotals[tp.timePeriod] += tp.timeSpentSeconds;
                    });
                }
            }

            const computedTotalSitesVisited = domainCount;
            const computedAverageTimePerSiteSeconds =
                computedTotalSitesVisited > 0
                    ? Math.floor(
                          computedTotalTimeSpentSeconds /
                              computedTotalSitesVisited
                      )
                    : 0;

            // Compute a weighted average efficiency rating.
            let totalEfficiencyWeighted = 0;
            for (const domainKey in domains) {
                if (!domains.hasOwnProperty(domainKey)) continue;
                const domain = domains[domainKey];
                totalEfficiencyWeighted +=
                    domain.efficiencyRating * domain.totalTimeSpentSeconds;
            }
            const computedAverageEfficiencyRating =
                computedTotalTimeSpentSeconds > 0
                    ? parseFloat(
                          (
                              totalEfficiencyWeighted /
                              computedTotalTimeSpentSeconds
                          ).toFixed(2)
                      )
                    : 0;

            // Calculate mostActivePeriod (the period with maximum time)
            // and mostPassivePeriod (the period with minimum time).
            let computedMostActivePeriod = null;
            let computedMostPassivePeriod = null;
            if (Object.keys(timePatternTotals).length > 0) {
                let maxTime = -Infinity;
                let minTime = Infinity;
                for (const period in timePatternTotals) {
                    if (timePatternTotals[period] > maxTime) {
                        maxTime = timePatternTotals[period];
                        computedMostActivePeriod = period;
                    }
                    if (timePatternTotals[period] < minTime) {
                        minTime = timePatternTotals[period];
                        computedMostPassivePeriod = period;
                    }
                }
            }

            // 4. Calculate topFiveSitesVisited and bottomFiveSitesVisited from baseline domain data.
            //    We'll sort based on totalTimeSpentSeconds.
            let topFiveSitesVisited = [];
            let bottomFiveSitesVisited = [];
            if (domainArray.length > 0) {
                // Sort descending for top five.
                const sortedDescending = [...domainArray].sort(
                    (a, b) => b.totalTimeSpentSeconds - a.totalTimeSpentSeconds
                );
                topFiveSitesVisited = sortedDescending
                    .slice(0, 5)
                    .map((item) => item.domain);
                // Sort ascending for bottom five.
                const sortedAscending = [...domainArray].sort(
                    (a, b) => a.totalTimeSpentSeconds - b.totalTimeSpentSeconds
                );
                bottomFiveSitesVisited = sortedAscending
                    .slice(0, 5)
                    .map((item) => item.domain);
            }

            // 5. Merge the objects:
            //    - Use the recalculated baseline fields (now including top/bottom five).
            //    - Use baseline.date and baseline.time.
            //    - For all other fields, use gemini's values.
            const mergedResult = {
                // Fields from baseline (with recalculation from Gemini domains)
                date: baseline.date,
                time: baseline.time,
                totalTimeSpentSeconds: computedTotalTimeSpentSeconds,
                focusedTimeSeconds: computedFocusedTimeSeconds,
                distractedTimeSeconds: computedDistractedTimeSeconds,
                totalSitesVisited: computedTotalSitesVisited,
                averageTimePerSiteSeconds: computedAverageTimePerSiteSeconds,
                mostActivePeriod: computedMostActivePeriod,
                mostPassivePeriod: computedMostPassivePeriod,
                averageEfficiencyRating: computedAverageEfficiencyRating,
                topFiveSitesVisited,
                bottomFiveSitesVisited,
                // Everything else from Gemini
                averageProductivityScore: geminiData.averageProductivityScore,
                averageEngagementLevelPerSite:
                    geminiData.averageEngagementLevelPerSite,
                overallUsageIntent: geminiData.overallUsageIntent,
                averageSessionType: geminiData.averageSessionType,
                timeOfDayPattern: geminiData.timeOfDayPattern,
                mostDistractiveSites: geminiData.mostDistractiveSites,
                mostProductiveSites: geminiData.mostProductiveSites,
                contextualSummary: geminiData.contextualSummary,
                anomalyDetection: geminiData.anomalyDetection,
                goalTracking: geminiData.goalTracking,
                recommendations: geminiData.recommendations,
                domains: geminiData.domains,
            };

            // 6. Return the merged single cohesive object.
            res.json(mergedResult);
        });
    } catch (error) {
        console.error("Error in /process:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/echo", async (req, res) => {
    try {
        const { accessToken, ...data } = req.body;
        if (!accessToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        jwt.verify(accessToken, SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Invalid token" });
            }

            const sanitizedReq = {
                headers: req.headers,
                body: req.body,
                query: req.query,
                params: req.params,
                method: req.method,
                url: req.url,
                path: req.path,
                hostname: req.hostname,
                protocol: req.protocol,
            };

            res.json({ sanitizedReq, user: decoded });
        });
    } catch (error) {
        console.error("Error in /echo:", error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
