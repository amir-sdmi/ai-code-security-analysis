// Load environment variables first
require('dotenv').config();

const { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('node:path');
const Database = require('better-sqlite3'); // Import database driver
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Global Variables (Initialize later) ---
let store; 
let db;
let tray = null;
let mainWindow = null;
let inputWindow = null;
let isTracking = false;
let timerId = null;
let currentIntervalMinutes;
let currentSoundEnabled;
let trackingInterval;
let genAI; // Gemini AI client
// -----------------------------------------

// --- Gemini Setup ---
function setupGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('DEBUG: GEMINI_API_KEY check failed. Value is undefined or empty.');
        console.error('ERROR: GEMINI_API_KEY not found in environment variables.');
        console.error('Categorization will default to \'Neutral\'. Please ensure you have a .env file with your key.');
        genAI = null;
        return;
    } else {
        // Avoid logging the full key, just confirm it's loaded
        console.log('DEBUG: GEMINI_API_KEY seems to be loaded from .env.');
    }
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        console.log('Gemini AI Client Initialized Successfully.');
    } catch (error) {
        console.error('Error initializing Gemini AI Client:', error);
        genAI = null;
    }
}
// --------------------

// --- Database Setup Function ---
function setupDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'tracklet.db');
    try {
        db = new Database(dbPath, { /* verbose: console.log */ });
        console.log(`DEBUG: Database object created for path: ${dbPath}`);
        console.log(`Database connected at: ${dbPath}`);

        // Check if the column exists before trying to add it
        const columnCheckStmt = db.prepare(`
            SELECT COUNT(*) as count FROM pragma_table_info('logs') WHERE name = 'productivity_category'
        `);
        const columnExists = columnCheckStmt.get().count > 0;

        const createTableStmt = `
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                activity TEXT NOT NULL,
                productivity_category TEXT DEFAULT 'Neutral' -- Add the new column with a default
            )
        `;
        db.exec(createTableStmt);
        console.log('\'Logs\' table checked/created.');

        // Add the column if it doesn't exist (for existing installations)
        if (!columnExists) {
            try {
                db.exec(`ALTER TABLE logs ADD COLUMN productivity_category TEXT DEFAULT 'Neutral'`);
                console.log('Added productivity_category column to existing logs table.');
            } catch (alterError) {
                // Ignore error if column already exists (might happen in rare race conditions)
                if (!alterError.message.includes('duplicate column name')) {
                    console.error('Error adding productivity_category column:', alterError);
                }
            }
        }

    } catch (error) {
        console.error('Database connection error:', error);
        db = null;
    }

    // Setup Gemini Client
    setupGemini();

    // Setup IPC Handlers (now that store and Gemini are initialized)
    setupIpcHandlers();
}
// ---------------------------

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // Close DB connection before quitting if it was opened
    // Note: db might not be initialized yet here, but check is safe
    if (db) db.close(); 
    app.quit();
}

// --- Initialize Function (Async) ---
async function initializeApp() {
    // Dynamically import electron-store
    const { default: Store } = await import('electron-store');

    // Initialize Settings Store
    store = new Store({
        defaults: {
            intervalMinutes: 30,
            soundEnabled: true,
        }
    });
    console.log('Settings store initialized.');

    // Load settings from store
    currentIntervalMinutes = store.get('intervalMinutes');
    currentSoundEnabled = store.get('soundEnabled');
    trackingInterval = currentIntervalMinutes * 60 * 1000; 
    console.log(`Initial settings loaded: Interval=${currentIntervalMinutes}min, Sound=${currentSoundEnabled}`);

    // Setup Database
    setupDatabase();

    // Setup Tray Icon
    setupTray();
}
// ---------------------------------

// --- Function Definitions (Moved here, no changes inside them) ---
const createWindow = () => {
  // Prevent creating multiple windows
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Optional: Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object
    console.log('DEBUG: mainWindow closed event fired.');
    mainWindow = null;
    updateMenu(); // Update menu to show 'Show Dashboard' again
    console.log('DEBUG: mainWindow set to null and updateMenu called after close.');
  });

  updateMenu(); // Update menu to disable 'Show Dashboard'
};

const createInputWindow = () => {
  // Close existing input window if any
  if (inputWindow) {
    inputWindow.close();
  }

  inputWindow = new BrowserWindow({
    width: 400, 
    height: 280,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    frame: false, // Important for transparency
    show: false, // Don't show until ready
    transparent: true, // Enable window transparency
    // backgroundColor: '#00000000', // Optional: Explicitly set transparent background
    vibrancy: 'sidebar', // macOS vibrancy effect (adjust as needed)
    webPreferences: {
      preload: path.join(__dirname, 'inputPreload.js'), // Separate preload for this window
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  inputWindow.loadFile(path.join(__dirname, 'input.html'));

  // Show window smoothly when ready
  inputWindow.once('ready-to-show', () => {
    inputWindow.show();
    // Optionally focus the window/input field
    // inputWindow.focus(); 
    // inputWindow.webContents.executeJavaScript('document.getElementById("activity-input")?.focus();', true);
  });

  inputWindow.on('closed', () => {
    inputWindow = null;
  });
};

async function categorizeActivity(activityText) {
    if (!genAI) {
        console.warn('Gemini client not available, defaulting category to Neutral.');
        return 'Neutral';
    }

    if (!activityText || activityText.trim().length === 0) {
        console.warn('Cannot categorize empty activity text, defaulting to Neutral.');
        return 'Neutral';
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const prompt = `Categorize the following user activity into one of these categories: Productive, Unproductive. Only respond with one of those two words. Activity: "${activityText}"`;

    try {
        console.log(`DEBUG: Requesting categorization for: "${activityText}"`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        console.log(`DEBUG: Raw Gemini response text: "${text}"`); // Log the raw response

        // Validate response
        if (['Productive', 'Neutral', 'Unproductive'].includes(text)) {
            console.log(`DEBUG: Valid category determined: "${text}"`);
            return text;
        } else {
            console.warn(`DEBUG: Unexpected response from Gemini: "${text}". Defaulting to Neutral.`);
            return 'Neutral';
        }
    } catch (error) {
        console.error('DEBUG: Error calling Gemini API:', error);
        console.warn('DEBUG: Defaulting category to Neutral due to API error.');
        return 'Neutral';
    }
}

function recordLog(activity, category = 'Neutral') {
  if (!db) {
    console.error('Cannot add log: Database not available.');
    return { success: false, error: 'Database connection failed.' };
  }
  if (!activity || activity.trim().length === 0) {
      // Don't log empty entries silently when triggered internally
      console.warn('Attempted to log empty activity.');
      return { success: false, error: 'Activity cannot be empty.' };
  }

  console.log('Main process: Recording log activity:', activity, 'Category:', category);
  try {
    // Include the category in the INSERT statement
    const stmt = db.prepare('INSERT INTO logs (activity, productivity_category) VALUES (?, ?)');
    const info = stmt.run(activity.trim(), category);
    const newLogId = info.lastInsertRowid;
    console.log('Log added successfully via recordLog, ID:', newLogId);

    // Fetch the newly added log including the category
    const fetchStmt = db.prepare('SELECT id, timestamp, activity, productivity_category FROM logs WHERE id = ?');
    const newLog = fetchStmt.get(newLogId);

    // Notify renderer if the dashboard window is open
    if (mainWindow && newLog) {
       console.log('Sending logs:updated to dashboard window');
       mainWindow.webContents.send('logs:updated', newLog); // Send the full log object
    }
    return { success: true, id: newLogId };
  } catch (error) {
    console.error('Failed to add log via recordLog:', error);
    return { success: false, error: error.message };
  }
}

function startTracking() {
  // 1. Clear any existing timer FIRST to prevent duplicates
  if (timerId) {
    console.log('Clearing previous timer before starting/restarting...');
    clearInterval(timerId);
    timerId = null;
  }

  // 2. Set state to tracking (if not already set)
  // This flag mainly controls the menu item label
  if (!isTracking) {
      console.log('Setting tracking state to true.');
      isTracking = true;
  }

  // 3. Start the new timer using the current interval settings
  console.log(`Starting/Restarting tracking timer with interval: ${currentIntervalMinutes} minutes (${trackingInterval}ms)...`);
  timerId = setInterval(() => {
    console.log('Timer fired: Triggering notification.');

    // --- Create and show Notification ---
    const notification = new Notification({
        title: 'Tracklet',
        body: 'What are you working on right now?',
        silent: !currentSoundEnabled,
        timeoutType: 'never' // Keep notification until dismissed (Windows)
    });

    notification.on('click', (event, arg) => {
        console.log('Notification clicked.');
        createInputWindow();
    });
    
    notification.show();
    // --- End Notification ---

  }, trackingInterval);

  // 4. Update the menu to reflect the active state
  updateMenu();
}

function pauseTracking() {
  if (!isTracking || !timerId) return;
  console.log('Pausing tracking...');
  isTracking = false;
  clearInterval(timerId);
  timerId = null;
  updateMenu();
}

function updateMenu() {
  if (!tray) return; // Don't try to update if tray doesn't exist

  const contextMenuTemplate = [
    {
      label: 'Show Dashboard',
      click: () => {
        createWindow();
      },
      enabled: !mainWindow // Disable if window is already open
    },
    { type: 'separator' },
    {
      label: isTracking ? 'Pause Tracking' : 'Start Tracking',
      click: () => {
        if (isTracking) {
          pauseTracking();
        } else {
          startTracking();
        }
      },
    },
    { type: 'separator' },
    { label: 'Quit Tracklet', click: () => app.quit() },
  ];

  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
  tray.setContextMenu(contextMenu);
}

// --- Setup IPC Handlers Function ---
function setupIpcHandlers() {
    ipcMain.handle('settings:get', async () => {
        console.log('Main process: Received settings:get request');
        if (!store) return { intervalMinutes: 30, soundEnabled: true }; // Fallback if store not ready
        return {
            intervalMinutes: store.get('intervalMinutes'),
            soundEnabled: store.get('soundEnabled'),
        };
    });

    ipcMain.handle('settings:save', async (event, settings) => {
        console.log('Main process: Received settings:save request with:', settings);
        if (!store) return { success: false, error: 'Settings store not initialized.' }; // Guard

        try {
            const requestedInterval = parseFloat(settings.intervalMinutes);
            const newInterval = !isNaN(requestedInterval) && requestedInterval >= 0.5 ? requestedInterval : 0.5;
            const newSoundEnabled = !!settings.soundEnabled;

            store.set('intervalMinutes', newInterval);
            store.set('soundEnabled', newSoundEnabled);
            console.log('Settings saved to store.');

            currentIntervalMinutes = newInterval;
            currentSoundEnabled = newSoundEnabled;
            trackingInterval = currentIntervalMinutes * 60 * 1000; 

            console.log(`In-memory settings updated: Interval=${currentIntervalMinutes}min, Sound=${currentSoundEnabled}, IntervalMs=${trackingInterval}`);

            if (isTracking) {
                console.log('Restarting tracking timer with new interval...');
                startTracking(); 
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to save settings:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('log:add', async (event, activity) => {
        return recordLog(activity); // Uses global recordLog
    });

    ipcMain.handle('logs:get', async () => {
        if (!db) {
            console.error('Cannot get logs: Database not available.');
            return []; 
        }
        try {
            console.log('Main process: Received logs:get request');
            const stmt = db.prepare('SELECT id, timestamp, activity FROM logs ORDER BY timestamp DESC');
            const logs = stmt.all();
            console.log(`Returning ${logs.length} logs.`);
            return logs; 
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            return []; 
        }
    });

    ipcMain.on('input:close', () => {
        console.log('Received input:close request.')
        if (inputWindow) {
            inputWindow.close();
        }
    });

    // Fetch Logs & Calculate Productivity
    ipcMain.handle('db:get-logs', async (event, timePeriod = 'today') => { // Accept timePeriod, default to 'today'
        if (!db) {
            console.error('IPC db:get-logs: Database not available.');
            return { logs: [], stats: { productivityScore: 0, productiveTime: 0, neutralTime: 0, unproductiveTime: 0, totalTime: 0 }, heatmapData: {} };
        }
        try {
            console.log(`IPC db:get-logs: Requesting data for period: ${timePeriod}`);
            let whereClause = "";
            let queryParams = [];

            switch (timePeriod) {
                case 'today':
                    whereClause = "WHERE date(timestamp, 'localtime') = date('now', 'localtime')";
                    break;
                case 'yesterday':
                    whereClause = "WHERE date(timestamp, 'localtime') = date('now', '-1 day', 'localtime')";
                    break;
                case 'last7days':
                    // Get logs from 6 days ago up to and including today
                    whereClause = "WHERE date(timestamp, 'localtime') >= date('now', '-6 days', 'localtime') AND date(timestamp, 'localtime') <= date('now', 'localtime')";
                    break;
                // Add default case? Maybe fall back to 'today' or handle error?
                // For now, if invalid period, it fetches all logs (empty whereClause)
                // Let's default to today if invalid to be safe
                default:
                    console.warn(`IPC db:get-logs: Invalid timePeriod '${timePeriod}'. Defaulting to 'today'.`);
                    whereClause = "WHERE date(timestamp, 'localtime') = date('now', 'localtime')";
                    timePeriod = 'today'; // Correct the period for logging/display
            }

            // Fetch logs including the new category, filtered and ordered by timestamp
            const sql = `SELECT id, timestamp, activity, productivity_category FROM logs ${whereClause} ORDER BY timestamp DESC`;
            console.log(`IPC db:get-logs: Executing SQL: ${sql}`);
            const stmt = db.prepare(sql);
            const logs = stmt.all(...queryParams); // Use queryParams if needed in future

            // --- Simplified Calculation Logic (remains the same, operates on filtered logs) ---
            let productiveTime = 0;
            let neutralTime = 0;
            let unproductiveTime = 0;
            let totalTrackedTime = 0; 

            // Use the globally stored interval duration from currentIntervalMinutes
            console.log(`DEBUG: Calculating stats using interval: ${currentIntervalMinutes} minutes per log.`);

            logs.forEach(log => {
                const category = log.productivity_category || 'Neutral';
                if (category === 'Productive') {
                    productiveTime += currentIntervalMinutes; // Use global variable
                } else if (category === 'Unproductive') {
                    unproductiveTime += currentIntervalMinutes; // Use global variable
                } else { // Neutral or unknown
                    neutralTime += currentIntervalMinutes; // Use global variable
                }
            });

            totalTrackedTime = productiveTime + unproductiveTime + neutralTime;
            console.log(`DEBUG: Calculated times based on interval (Prod/Neut/Unprod/Total): ${productiveTime.toFixed(2)} / ${neutralTime.toFixed(2)} / ${unproductiveTime.toFixed(2)} / ${totalTrackedTime.toFixed(2)}`);
            // --- End Simplified Calculation Logic ---

            // --- Calculate Heatmap Data ---
            const heatmapData = {};
            // Use a set to track unique dates for potential Y-axis labels
            const uniqueDates = new Set(); 

            logs.forEach(log => {
                try {
                    const logDate = new Date(log.timestamp + 'Z'); // Assume UTC, parse
                    // Format date as YYYY-MM-DD using local time for grouping
                    const dateKey = logDate.toLocaleDateString('sv-SE'); // 'sv-SE' gives YYYY-MM-DD format
                    const hourKey = logDate.getHours(); // 0-23 based on local time
                    uniqueDates.add(dateKey); // Add date to set

                    if (!heatmapData[dateKey]) {
                        heatmapData[dateKey] = {};
                    }
                    if (!heatmapData[dateKey][hourKey]) {
                        heatmapData[dateKey][hourKey] = { productive: 0, unproductive: 0, neutral: 0, total: 0 };
                    }

                    const category = log.productivity_category || 'Neutral';
                    const duration = currentIntervalMinutes; // Use the interval time

                    if (category === 'Productive') {
                        heatmapData[dateKey][hourKey].productive += duration;
                    } else if (category === 'Unproductive') {
                        heatmapData[dateKey][hourKey].unproductive += duration;
                    } else {
                        heatmapData[dateKey][hourKey].neutral += duration;
                    }
                    heatmapData[dateKey][hourKey].total += duration;
                } catch (e) {
                    console.error(`Error processing log timestamp for heatmap: ${log.timestamp}`, e);
                }
            });
            console.log("DEBUG: Calculated heatmap data structure.");
            // --- End Heatmap Data Calculation ---

            const productivityScore = totalTrackedTime > 0
                ? Math.round((productiveTime / totalTrackedTime) * 100)
                : 0;
            console.log(`DEBUG: Final Score: ${productivityScore}%`); // Log final score

            const stats = {
                productivityScore,
                productiveTime: Math.round(productiveTime), // Send rounded minutes
                neutralTime: Math.round(neutralTime),       // Include neutral time
                unproductiveTime: Math.round(unproductiveTime),
                totalTime: Math.round(totalTrackedTime)
            };
            // ------------------------------------

            console.log('IPC db:get-logs: Returning logs, stats, and heatmap data');
            // Return logs, stats, AND heatmapData
            return { logs, stats, heatmapData };
        } catch (error) {
            console.error('IPC db:get-logs: Failed to fetch logs:', error);
            // Return default empty state on error, including heatmapData
             return { logs: [], stats: { productivityScore: 0, productiveTime: 0, neutralTime: 0, unproductiveTime: 0, totalTime: 0 }, heatmapData: {} };
        }
    });

    // --- NEW: IPC Handler for Calendar Heatmap Data ---
    ipcMain.handle('db:get-calendar-data', async (event, days = 120) => {
        if (!db) {
            console.error('IPC db:get-calendar-data: Database not available.');
            return {}; // Return empty object on error
        }
        console.log(`IPC db:get-calendar-data: Requesting data for the last ${days} days.`);
        try {
            // Fetch logs within the date range
            const sql = `
                SELECT 
                    date(timestamp, 'localtime') as log_date, 
                    productivity_category
                FROM logs 
                WHERE date(timestamp, 'localtime') >= date('now', ? , 'localtime')
                  AND date(timestamp, 'localtime') <= date('now', 'localtime')
            `;
            const params = [`-${days - 1} days`]; // e.g., -119 days to include today
            const stmt = db.prepare(sql);
            const logs = stmt.all(params);

            // Calculate daily stats
            const dailyData = {};
            const intervalMinutes = store.get('intervalMinutes', 30);

            logs.forEach(log => {
                const dateKey = log.log_date;
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = { productive: 0, unproductive: 0, neutral: 0, total: 0 };
                }

                const category = log.productivity_category || 'Neutral';
                
                if (category === 'Productive') {
                    dailyData[dateKey].productive += intervalMinutes;
                } else if (category === 'Unproductive') {
                    dailyData[dateKey].unproductive += intervalMinutes;
                } else {
                    dailyData[dateKey].neutral += intervalMinutes;
                }
                dailyData[dateKey].total += intervalMinutes;
            });

            // Calculate percentage for each day
            Object.keys(dailyData).forEach(dateKey => {
                const day = dailyData[dateKey];
                day.productivityPercent = day.total > 0 
                    ? Math.round((day.productive / day.total) * 100)
                    : 0;
            });

            console.log(`IPC db:get-calendar-data: Processed data for ${Object.keys(dailyData).length} days.`);
            return dailyData;

        } catch (error) {
            console.error('IPC db:get-calendar-data: Failed to fetch or process data:', error);
            return {}; // Return empty object on error
        }
    });
    // --- END Calendar Handler ---

    // Submit Log (handle category if provided, otherwise default)
    ipcMain.handle('log:submit', async (event, activity) => {
        console.log('DEBUG: IPC log:submit invoked. Raw activity received:', activity); // LOG 1: Confirm invocation
        if (!activity || activity.trim().length === 0) {
            console.warn('IPC log:submit: Activity is empty. Skipping categorization and logging.');
            return { success: false, error: 'Activity cannot be empty.' };
        }
        // Categorize the activity using Gemini
        console.log('DEBUG: IPC log:submit: Calling categorizeActivity...'); // LOG 2: Before categorization
        const category = await categorizeActivity(activity);
        console.log(`DEBUG: IPC log:submit: categorizeActivity returned: ${category}`); // LOG 3: After categorization
        // Record the log with the determined category
        const result = recordLog(activity, category);
        console.log(`DEBUG: IPC log:submit: recordLog result:`, result); // LOG 4: After recording
        return result;
    });

    // Delete Log
    ipcMain.handle('db:delete-log', async (event, id) => {
        if (!db) {
            console.error('IPC db:delete-log: Database not available.');
            return { success: false, error: 'Database connection failed.' };
        }
        console.log('IPC db:delete-log: Deleting log with ID:', id);
        try {
            const stmt = db.prepare('DELETE FROM logs WHERE id = ?');
            const info = stmt.run(id);
            if (info.changes > 0) {
                console.log('Log deleted successfully, ID:', id);
                // Notify renderer to refresh the log list
                if (mainWindow) {
                    mainWindow.webContents.send('logs:deleted', id); // Send deleted ID
                }
                return { success: true };
            } else {
                console.warn('IPC db:delete-log: No log found with ID:', id);
                return { success: false, error: 'Log not found.' };
            }
        } catch (error) {
            console.error('IPC db:delete-log: Failed to delete log:', error);
            return { success: false, error: error.message };
        }
    });
}
// --------------------------------

// --- Setup Tray Function ---
function setupTray() {
    console.log('Creating 1x1 PNG data URL nativeImage...');
    const minimalIconDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const icon = nativeImage.createFromDataURL(minimalIconDataURL);
    if (process.platform === 'darwin') {
        icon.isTemplateImage = true; 
    }
    console.log('1x1 PNG nativeImage created.');

    try {
        console.log('Attempting to create Tray...');
        tray = new Tray(icon);
        console.log('Tray created successfully.');
        tray.setToolTip('Tracklet - Time Tracker');
        console.log('Tooltip set.');
        updateMenu(); // Initial menu setup
        console.log('Initial context menu set.');
    } catch (error) {
        console.error('Error creating tray or setting menu:', error);
    }
}
// -------------------------


// --- App Lifecycle Events ---
app.whenReady().then(async () => {
    console.log('App is ready. Initializing...');
    await initializeApp(); // Run the async initialization
    console.log('Initialization complete.');

    // Optional: Create the main window on startup?
    // createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        // Standard check: Only create if absolutely no windows are open.
        if (BrowserWindow.getAllWindows().length === 0) { 
            createWindow(); 
        } else if (mainWindow && !mainWindow.isFocused()) {
            // If main window exists but isn't focused, focus it.
            // This prevents creating multiple main windows if one exists but is hidden/minimized
            mainWindow.focus();
        } else if (inputWindow && !inputWindow.isFocused()){
            // Optional: If input window exists and isn't focused, focus it.
            inputWindow.focus();
        }
    });
});

app.on('window-all-closed', (e) => {
    if (process.platform === 'darwin') {
        app.dock?.hide();
    }
    // Don't quit
});

app.on('will-quit', () => {
    if (db) {
        db.close();
        console.log('Database connection closed.');
    }
});
// ---------------------------

// --- Deprecated Code/Placeholders (Keep for reference or remove) ---
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// --- Placeholder Icon Creation ---
// You should replace 'iconTemplate.png' with your actual icon file.
// For testing, create a simple 16x16 png in src/assets/iconTemplate.png
// Example: A small black square.
// If you don't have an image tool handy, you can skip creating the file for now,
// but Electron might show a default icon or no icon.
// Make sure to create an `assets` folder inside `src`.
