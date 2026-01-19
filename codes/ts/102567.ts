// src/extension.ts

import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

//--- GLOBAL VARIABLES ---
let genAI: GoogleGenerativeAI | undefined;
let model: any | null = null;
let dashboardPanel: vscode.WebviewPanel | undefined = undefined;
let currentUser: User | null = null; // To store current authenticated user
let db: any; // Firestore instance
let currentProjectId: string | null = null; // To store the currently active project ID

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBULMaWY0EVdgmxDFLAutIBTua_IPOiAFc",
    authDomain: "gemini-code-assitance-6c7b1.firebaseapp.com",
    projectId: "gemini-code-assitance-6c7b1",
    storageBucket: "gemini-code-assitance-6c7b1.firebasestorage.app",
    messagingSenderId: "910709124426",
    appId: "1:910709124426:web:513d6e33d075f65fdc25b3",
    measurementId: "G-7YQYYYTLGZ"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
db = getFirestore(firebaseApp); // Initialize Firestore

// --- INTERFACES AND HELPER FUNCTIONS FOR TASK MANAGEMENT ---
interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'inprogress' | 'done';
    priority: 'low' | 'medium' | 'high';
    details?: string;
    documentationLinks?: { title: string, url: string }[];
}

interface Project {
    id: string;
    name: string;
    ownerId: string;
    members: string[]; // Array of user UIDs
}

/**
 * Get tasks from Firestore for the current project.
 */
async function getTasks(context: vscode.ExtensionContext, projectId: string): Promise<Task[]> {
    if (!projectId) {
        return [];
    }
    try {
        const tasksCol = collection(db, 'projects', projectId, 'tasks');
        const taskSnapshot = await getDocs(tasksCol);
        const tasksList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
        return tasksList.map(task => {
            const defaults = {
                description: '',
                priority: 'medium',
                status: 'todo',
                details: '',
                documentationLinks: []
            };
            return { ...defaults, ...task };
        });
    } catch (error) {
        console.error("Error getting tasks from Firestore:", error);
        vscode.window.showErrorMessage(`Failed to load tasks: ${error}`);
        return [];
    }
}

/**
 * Save tasks to Firestore for the current project.
 * This function now takes the full list of tasks for the project and updates them.
 */
async function saveTasks(context: vscode.ExtensionContext, projectId: string, tasks: Task[]) {
    // This function is primarily a placeholder for future batch updates or reordering logic.
    // Individual task operations (add, update, delete) are handled directly in message handlers.
    // For now, it sorts tasks but doesn't perform Firestore writes here.
    tasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityA = a.priority || 'medium';
        const priorityB = b.priority || 'medium';
        return priorityOrder[priorityA] - priorityOrder[priorityB];
    });
    // The actual Firestore updates are done within the individual message handlers for addTask, updateTaskStatus, etc.
}

/**
 * Get projects for the current user from Firestore.
 */
async function getUserProjects(userId: string): Promise<Project[]> {
    if (!userId) {
        return [];
    }
    try {
        const projectsRef = collection(db, 'projects');
        // Query for projects where the user is either the owner or a member
        const q = query(projectsRef, where('members', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
    } catch (error) {
        console.error("Error getting user projects from Firestore:", error);
        vscode.window.showErrorMessage(`Failed to load projects: ${error}`);
        return [];
    }
}

// --- EXTENSION ACTIVATION FUNCTION ---
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "gemini-code-assistant" is now active!');

    // Initialize Gemini API if API Key is already set (from previous session or config)
    const storedApiKey = context.workspaceState.get<string>('geminiCodeAssistant.apiKey');
    if (storedApiKey) {
        initializeGemini(storedApiKey);
    }

    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (dashboardPanel) {
            dashboardPanel.webview.postMessage({ command: 'authStatus', user: currentUser ? { uid: currentUser.uid, email: currentUser.email || 'N/A' } : null });
            if (currentUser) {
                // Load projects for the new user
                const projects = await getUserProjects(currentUser.uid);
                dashboardPanel.webview.postMessage({ command: 'loadProjects', projects: projects });
                
                // If there's a stored currentProjectId, try to load its tasks
                const storedProjectId = context.workspaceState.get<string>('geminiCodeAssistant.currentProjectId');
                if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
                    currentProjectId = storedProjectId;
                    dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: currentProjectId });
                    // Explicitly assert currentProjectId as non-null with '!'
                    const tasks = await getTasks(context, currentProjectId!); 
                    dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: tasks });
                } else {
                    currentProjectId = null; // Clear if no valid project is stored
                    dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: null }); // Ensure UI reflects no project selected
                    dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] }); // Clear tasks
                }

            } else {
                currentProjectId = null; // Clear current project on logout
                dashboardPanel.webview.postMessage({ command: 'loadProjects', projects: [] }); // Clear projects
                dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: null }); // Ensure UI reflects no project selected
                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] }); // Clear tasks if logged out
            }
        }
        if (!user) {
            vscode.window.showInformationMessage('You have been logged out.');
        }
    });

    const disposables = [
        vscode.commands.registerCommand('gemini-code-assistant.generateCode', async () => {
            if (!model) { return vscode.window.showErrorMessage('Gemini API is not initialized. Please set your API Key in the dashboard.'); }
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return vscode.window.showInformationMessage('No active text editor found.'); }
            const selectedText = editor.document.getText(editor.selection);
            if (!selectedText) { return vscode.window.showInformationMessage('Please select some text to generate code from.'); }

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Generating code with Gemini..." }, async () => {
                try {
                    const prompt = `Generate code based on the following context/description:\n\n${selectedText}\n\nProvide only the code block.`;
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const generatedText = response.text();
                    const codeMatch = generatedText.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
                    const codeToInsert = codeMatch ? codeMatch[1] : generatedText;
                    editor.edit(editBuilder => editBuilder.replace(editor.selection, codeToInsert));
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to generate code: ${error.message}`);
                    console.error("Gemini API Call Error:", error);
                }
            });
        }),

        vscode.commands.registerCommand('gemini-code-assistant.showDashboard', () => {
            if (dashboardPanel) {
                return dashboardPanel.reveal(vscode.ViewColumn.Two);
            }

            dashboardPanel = vscode.window.createWebviewPanel('taskDashboard', 'Project Dashboard', vscode.ViewColumn.Two, { enableScripts: true, retainContextWhenHidden: true });
            dashboardPanel.onDidDispose(() => { dashboardPanel = undefined; }, null, context.subscriptions);
            
            // Pass initial API key and auth status to webview
            const initialApiKey = context.workspaceState.get<string>('geminiCodeAssistant.apiKey', '');
            dashboardPanel.webview.html = getWebviewContent(
                dashboardPanel.webview, 
                initialApiKey, 
                currentUser ? { uid: currentUser.uid, email: currentUser.email || 'N/A' } : null // Ensure email is always a string for the webview
            );
            
            // Send initial projects and tasks if user is already logged in
            if (currentUser) {
                getUserProjects(currentUser.uid).then(projects => {
                    if (dashboardPanel) {
                        dashboardPanel.webview.postMessage({ command: 'loadProjects', projects: projects });
                        const storedProjectId = context.workspaceState.get<string>('geminiCodeAssistant.currentProjectId');
                        if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
                            currentProjectId = storedProjectId;
                            dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: currentProjectId });
                            // Explicitly assert currentProjectId as non-null with '!'
                            getTasks(context, currentProjectId!).then(tasks => { 
                                if (dashboardPanel) {
                                    dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: tasks });
                                }
                            });
                        } else {
                            dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: null });
                            dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] });
                        }
                    }
                });
            } else {
                dashboardPanel.webview.postMessage({ command: 'loadProjects', projects: [] });
                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] });
            }

            dashboardPanel.webview.onDidReceiveMessage(async message => {
                switch (message.command) {
                    case 'setApiKey':
                        const newApiKey = message.apiKey;
                        await context.workspaceState.update('geminiCodeAssistant.apiKey', newApiKey);
                        initializeGemini(newApiKey);
                        if (newApiKey) {
                            vscode.window.showInformationMessage('Gemini API Key saved and initialized.');
                        } else {
                            vscode.window.showInformationMessage('Gemini API Key cleared.');
                        }
                        break;
                    case 'login':
                        try {
                            const userCredential = await signInWithEmailAndPassword(auth, message.email, message.password);
                            vscode.window.showInformationMessage(`Logged in as ${userCredential.user.email}`);
                            // Auth state change listener will handle updating currentUser and tasks/projects
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Login failed: ${error.message}`);
                            console.error("Firebase Login Error:", error);
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'showError', message: `Login failed: ${error.message}` });
                            }
                        }
                        break;
                    case 'register':
                        try {
                            const userCredential = await createUserWithEmailAndPassword(auth, message.email, message.password);
                            vscode.window.showInformationMessage(`Account created and logged in as ${userCredential.user.email}`);
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'clearAuthFields' });
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Registration failed: ${error.message}`);
                            console.error("Firebase Registration Error:", error);
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'showError', message: `Registration failed: ${error.message}` });
                            }
                        }
                        break;
                    case 'logout':
                        try {
                            await signOut(auth);
                            vscode.window.showInformationMessage('Logged out successfully.');
                            // Auth state change listener will handle updating currentUser and tasks/projects
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Logout failed: ${error.message}`);
                            console.error("Firebase Logout Error:", error);
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'showError', message: `Logout failed: ${error.message}` });
                            }
                        }
                        break;
                    case 'createProject':
                        if (!currentUser) { return vscode.window.showErrorMessage('Please log in to create a project.'); }
                        try {
                            const newProjectRef = doc(collection(db, 'projects'));
                            const newProject: Project = {
                                id: newProjectRef.id,
                                name: message.projectName,
                                ownerId: currentUser.uid,
                                members: [currentUser.uid] // Owner is automatically a member
                            };
                            await setDoc(newProjectRef, newProject);
                            vscode.window.showInformationMessage(`Project "${newProject.name}" created.`);
                            
                            // Update currentProjectId and load tasks for the new project
                            currentProjectId = newProject.id;
                            await context.workspaceState.update('geminiCodeAssistant.currentProjectId', currentProjectId);
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'projectCreated', project: newProject });
                                dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: currentProjectId });
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] }); // New project has no tasks initially
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to create project: ${error.message}`);
                            console.error("Firebase Project Creation Error:", error);
                        }
                        break;
                    case 'selectProject':
                        if (!currentUser) { return vscode.window.showErrorMessage('Please log in to select a project.'); }
                        const selectedProjectId = message.projectId;
                        currentProjectId = selectedProjectId;
                        await context.workspaceState.update('geminiCodeAssistant.currentProjectId', currentProjectId);
                        vscode.window.showInformationMessage(`Project selected: ${message.projectName}`);
                        if (dashboardPanel) {
                            dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: currentProjectId });
                            // Explicitly assert currentProjectId as non-null with '!'
                            const tasks = await getTasks(context, currentProjectId!);
                            dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: tasks });
                        }
                        break;
                    case 'addTask':
                        if (!currentUser || !currentProjectId) { return vscode.window.showErrorMessage('Please log in and select a project to add tasks.'); }
                        try {
                            const newTask: Task = { id: '', title: message.title, description: '', status: 'todo', priority: 'medium' };
                            const tasksCol = collection(db, 'projects', currentProjectId, 'tasks');
                            const docRef = doc(tasksCol); // Create a new document reference with an auto-generated ID
                            newTask.id = docRef.id; // Assign the auto-generated ID to the task
                            await setDoc(docRef, newTask); // Set the document with the task data
                            vscode.window.showInformationMessage('Task added.');
                            // Reload tasks to update UI
                            const updatedTasks = await getTasks(context, currentProjectId); // No '!' needed as currentProjectId is checked above
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: updatedTasks });
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to add task: ${error.message}`);
                            console.error("Firebase Add Task Error:", error);
                        }
                        break;
                    case 'updateTaskStatus':
                        if (!currentUser || !currentProjectId) { return vscode.window.showErrorMessage('Please log in and select a project to update tasks.'); }
                        try {
                            const taskRef = doc(db, 'projects', currentProjectId, 'tasks', message.taskId);
                            await updateDoc(taskRef, { status: message.newStatus });
                            vscode.window.showInformationMessage('Task status updated.');
                            // Reload tasks to update UI
                            const updatedTasks = await getTasks(context, currentProjectId); // No '!' needed as currentProjectId is checked above
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: updatedTasks });
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to update task status: ${error.message}`);
                            console.error("Firebase Update Task Status Error:", error);
                        }
                        break;
                    case 'deleteTask':
                        if (!currentUser || !currentProjectId) { return vscode.window.showErrorMessage('Please log in and select a project to delete tasks.'); }
                        try {
                            const taskRef = doc(db, 'projects', currentProjectId, 'tasks', message.taskId);
                            await deleteDoc(taskRef);
                            vscode.window.showInformationMessage('Task deleted.');
                            // Reload tasks to update UI
                            const updatedTasks = await getTasks(context, currentProjectId); // No '!' needed as currentProjectId is checked above
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: updatedTasks });
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to delete task: ${error.message}`);
                            console.error("Firebase Delete Task Error:", error);
                        }
                        break;
                    case 'updateTaskPriority':
                        if (!currentUser || !currentProjectId) { return vscode.window.showErrorMessage('Please log in and select a project to update tasks.'); }
                        try {
                            const taskRef = doc(db, 'projects', currentProjectId, 'tasks', message.taskId);
                            await updateDoc(taskRef, { priority: message.newPriority });
                            vscode.window.showInformationMessage('Task priority updated.');
                            // Reload tasks to update UI
                            const updatedTasks = await getTasks(context, currentProjectId); // No '!' needed as currentProjectId is checked above
                            if (dashboardPanel) {
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: updatedTasks });
                            }
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to update task priority: ${error.message}`);
                            console.error("Firebase Update Task Priority Error:", error);
                        }
                        break;
                    case 'getTaskDetails':
                        if (!currentUser || !currentProjectId) { return vscode.window.showErrorMessage('Please log in and select a project to get task details.'); }
                        if (!model) {
                            vscode.window.showErrorMessage('Gemini API is not initialized. Please set your API Key.');
                            return;
                        }
                        
                        try {
                            const taskRef = doc(db, 'projects', currentProjectId, 'tasks', message.taskId);
                            const taskDoc = await getDoc(taskRef);
                            if (!taskDoc.exists()) {
                                vscode.window.showErrorMessage('Task not found.');
                                return;
                            }
                            const taskToDetail = { id: taskDoc.id, ...taskDoc.data() } as Task;

                            if (taskToDetail.details && taskToDetail.documentationLinks && taskToDetail.documentationLinks.length > 0) {
                                console.log(`Task details for ${message.taskId} already exist. Displaying cached data.`);
                                if (dashboardPanel) {
                                    dashboardPanel.webview.postMessage({ command: 'displayTaskDetails', task: taskToDetail });
                                }
                                break;
                            }

                            vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                title: "Gemini is generating task details and documentation..."
                            }, async () => {
                                try {
                                    const prompt = `Based on the following task, provide a detailed breakdown of what needs to be done. Include specific actionable steps and sub-tasks. Also, suggest 3-5 highly relevant documentation links (URLs with a title) that would be helpful for completing this task. Format the output as a JSON object with two fields: "details" (string, markdown allowed for formatting steps) and "documentationLinks" (an array of objects, each with "title" and "url"). Ensure the documentation links are valid and directly related. Do not include any other text or markdown outside the JSON object.

Task Title: "${taskToDetail.title}"
Task Description: "${taskToDetail.description}"

JSON Output:`;

                                    console.log("Sending prompt to Gemini:", prompt);
                                    const result = await model.generateContent(prompt);
                                    const responseText = result.response.text();
                                    console.log("Gemini raw response:", responseText);

                                    let jsonString = responseText.replace(/```json\n|\n```/g, '').trim();
                                    let detailResponse;
                                    try {
                                        detailResponse = JSON.parse(jsonString);
                                        console.log("Parsed Gemini response:", detailResponse);
                                    } catch (parseError) {
                                        console.error("Failed to parse JSON from Gemini response:", parseError);
                                        detailResponse = {
                                            details: `Failed to parse Gemini's response. Raw response: \n${responseText}`,
                                            documentationLinks: []
                                        };
                                    }
                                    
                                    taskToDetail.details = detailResponse.details || 'No detailed information provided by Gemini.';
                                    taskToDetail.documentationLinks = detailResponse.documentationLinks || [];

                                    // Update task in Firestore
                                    await updateDoc(taskRef, {
                                        details: taskToDetail.details,
                                        documentationLinks: taskToDetail.documentationLinks
                                    });

                                    if (dashboardPanel) {
                                        dashboardPanel.webview.postMessage({ command: 'displayTaskDetails', task: taskToDetail });
                                    }
                                } catch (error: any) {
                                    vscode.window.showErrorMessage(`Failed to generate task details: ${error.message}`);
                                    console.error("Error generating task details with Gemini:", error);
                                }
                            });
                        } catch (error: any) {
                            vscode.window.showErrorMessage(`Failed to retrieve task details: ${error.message}`);
                            console.error("Firebase Get Task Details Error:", error);
                        }
                        break;
                    case 'requestProjectsAndTasks': // Handle custom command to request projects and tasks after login
                        if (currentUser && dashboardPanel) {
                            const projects = await getUserProjects(currentUser.uid);
                            dashboardPanel.webview.postMessage({ command: 'loadProjects', projects: projects });

                            const storedProjectId = context.workspaceState.get<string>('geminiCodeAssistant.currentProjectId');
                            if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
                                currentProjectId = storedProjectId;
                                dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: currentProjectId });
                                // Explicitly assert currentProjectId as non-null with '!'
                                const tasks = await getTasks(context, currentProjectId!);
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: tasks });
                            } else {
                                currentProjectId = null;
                                dashboardPanel.webview.postMessage({ command: 'projectSelected', projectId: null });
                                dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: [] });
                            }
                        }
                        break;
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        break;
                }
            }, undefined, context.subscriptions);
        }),

        vscode.commands.registerCommand('gemini-code-assistant.generateTasksFromOverview', async () => {
            if (!currentUser) { return vscode.window.showErrorMessage('Please log in to generate tasks.'); }
            if (!currentProjectId) { return vscode.window.showErrorMessage('Please select a project to generate tasks for.'); }
            if (!model) { return vscode.window.showErrorMessage('Gemini API is not initialized. Please set your API Key in the dashboard.'); }
            
            const editor = vscode.window.activeTextEditor;
            let overviewText = editor?.document.getText(editor.selection);
            if (!overviewText) {
                overviewText = await vscode.window.showInputBox({ prompt: "Enter a project overview or a feature description", placeHolder: "e.g., Build a user login feature with email and password" });
            }
            if (!overviewText) { return; }

            await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Gemini is creating tasks..." }, async () => {
                const userForTasks = currentUser; 
                if (!userForTasks) {
                    vscode.window.showErrorMessage('Authentication session expired. Please log in again.');
                    return;
                }

                try {
                    const prompt = `Based on the following project overview, break it down into smaller, actionable tasks. Return the result as a JSON array of objects, where each object has a "title" and a "description". Provide ONLY the JSON array, without any other text or markdown formatting. Overview: "${overviewText}"\nJSON Output:`;
                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();
                    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
                    if (!jsonMatch) { throw new Error("Could not find a valid JSON array in the Gemini response."); }
                    
                    const newTasks: { title: string, description: string }[] = JSON.parse(jsonMatch[0]);
                    const tasksCol = collection(db, 'projects', currentProjectId!, 'tasks'); // currentProjectId is guaranteed here
                    
                    let addedCount = 0;
                    for (const task of newTasks) { // Iterate through newTasks, not tasksToAdd directly
                        const docRef = doc(tasksCol); // Create a new document reference with an auto-generated ID
                        await setDoc(docRef, {
                            id: docRef.id, // Assign the ID from Firestore
                            title: task.title,
                            description: task.description || '',
                            status: 'todo',
                            priority: 'medium'
                        });
                        addedCount++;
                    }

                    vscode.window.showInformationMessage(`${addedCount} new tasks have been added.`);
                    // Reload tasks to update UI
                    // Explicitly assert currentProjectId as non-null with '!'
                    const allTasks = await getTasks(context, currentProjectId!);
                    if (dashboardPanel) {
                        dashboardPanel.webview.postMessage({ command: 'loadTasks', tasks: allTasks });
                    }
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to generate tasks: ${error.message}`);
                    console.error("Error generating tasks with Gemini:", error);
                }
            });
        })
    ];

    context.subscriptions.push(...disposables);
}

export function deactivate() {}

function initializeGemini(apiKey: string) {
    if (apiKey) {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            vscode.window.showInformationMessage('Gemini API initialized successfully.');
        } catch (error) {
            console.error("Error initializing GoogleGenerativeAI:", error);
            vscode.window.showErrorMessage(`Failed to initialize Gemini API. Check your API Key.`);
            model = null; // Ensure model is null on error
        }
    } else {
        model = null; // Clear model if API key is empty
        vscode.window.showWarningMessage('Gemini API Key is not set. Please set it in the dashboard to use Gemini features.');
    }
}

function getWebviewContent(webview: vscode.Webview, initialApiKey: string, user: { uid: string, email: string } | null): string {
    const nonce = Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
    
    // Thêm các miền Firebase liên quan đến Auth và Firestore
    const csp = `default-src 'none'; script-src 'nonce-${nonce}' https://cdn.tailwindcss.com https://www.gstatic.com; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; connect-src https://*.firebaseio.com wss://*.firebaseio.com https://firebaseauth.googleapis.com https://firestore.googleapis.com;`; 

    // Chú ý: Ở đây chúng ta đang xây dựng một chuỗi HTML lớn.
    // Các template literals (dấu backtick ``) bên trong script sẽ cần được thoát (escaped)
    // hoặc thay thế bằng cách nối chuỗi truyền thống ('string' + variable + 'string').
    // Tôi đã chuyển tất cả các template literals trong phần JavaScript của webview
    // sang nối chuỗi bằng dấu cộng để tránh lỗi.
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Project Dashboard</title>
    <style>
        body { background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); font-family: var(--vscode-font-family); }
        .kanban-column { background-color: var(--vscode-side-bar-background); }
        .task-card { background-color: var(--vscode-editor-widget-background); border: 1px solid var(--vscode-widget-border, transparent); }
        .task-card:hover { background-color: var(--vscode-list-hover-background); }
        input[type="text"], input[type="email"], input[type="password"], select { background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
        button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border, transparent); }
        button:hover { background-color: var(--vscode-button-hover-background); }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
            padding-top: 60px;
            }
        .modal-content {
            background-color: var(--vscode-editor-background);
            margin: 5% auto;
            padding: 20px;
            border: 1px solid var(--vscode-widget-border);
            width: 80%;
            max-width: 700px;
            border-radius: 8px;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
        }
        .close-button {
            color: var(--vscode-editor-foreground);
            float: right;
            font-size: 28px;
            font-weight: bold;
        }
        .close-button:hover,
        .close-button:focus {
            color: #aaa;
            text-decoration: none;
            cursor: pointer;
        }
    </style>
</head>
<body class="p-4">
    <div class="dashboard-container space-y-4">
        <div class="header p-4 rounded-lg shadow-md">
            <h1 class="text-2xl font-bold mb-4">Project Kanban</h1>

            <!-- User Authentication Section -->
            <div id="authSection" class="mb-4">
                <h2 class="text-xl font-semibold mb-2">Authentication</h2>
                <div id="loggedInState" class="${user ? '' : 'hidden'}">
                    <p>Logged in as: <span id="userEmail" class="font-medium">${user ? user.email : ''}</span></p>
                    <button id="logoutBtn" class="px-4 py-2 rounded-md font-semibold mt-2">Logout</button>
                </div>
                <div id="loggedOutState" class="${user ? 'hidden' : ''}">
                    <div class="flex flex-col gap-2 mb-2">
                        <input type="email" id="emailInput" class="p-2 rounded-md" placeholder="Email">
                        <input type="password" id="passwordInput" class="p-2 rounded-md" placeholder="Password">
                    </div>
                    <div class="flex gap-2">
                        <button id="loginBtn" class="px-4 py-2 rounded-md font-semibold flex-grow">Login</button>
                        <button id="registerBtn" class="px-4 py-2 rounded-md font-semibold flex-grow">Register</button>
                    </div>
                    <div id="authError" class="text-red-500 mt-2 hidden"></div>
                </div>
            </div>

            <!-- Gemini API Key Configuration -->
            <div class="mb-4">
                <h2 class="text-xl font-semibold mb-2">Gemini API Key</h2>
                <div class="flex gap-2">
                    <input type="text" id="apiKeyInput" class="flex-grow p-2 rounded-md" placeholder="Enter your Gemini API Key" value="${initialApiKey}">
                    <button id="saveApiKeyBtn" class="px-4 py-2 rounded-md font-semibold">Save API Key</button>
                </div>
            </div>

            <!-- Project Selection/Creation (visible when logged in) -->
            <div id="projectManagementSection" class="${user ? '' : 'hidden'}">
                <h2 class="text-xl font-semibold mb-2">Projects</h2>
                <div class="flex gap-2 mb-2">
                    <select id="projectSelect" class="flex-grow p-2 rounded-md">
                        <option value="">-- Select a Project --</option>
                    </select>
                    <button id="selectProjectBtn" class="px-4 py-2 rounded-md font-semibold">Select</button>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="newProjectInput" class="flex-grow p-2 rounded-md" placeholder="Create new project...">
                    <button id="createProjectBtn" class="px-4 py-2 rounded-md font-semibold">Create Project</button>
                </div>
                <p id="currentProjectDisplay" class="mt-2 text-sm text-gray-400">Current Project: None</p>
            </div>

            <!-- Task Management Section (visible only when logged in AND project selected) -->
            <div id="taskManagementSection" class="${user && currentProjectId ? '' : 'hidden'}">
                <div class="add-task-form flex gap-2 mt-4">
                    <input type="text" id="newTaskInput" class="flex-grow p-2 rounded-md" placeholder="Add a new task and press Enter...">
                    <button id="addTaskBtn" class="px-4 py-2 rounded-md font-semibold">Add Task</button>
                </div>
            </div>
        </div>
        <div id="kanban-board" class="grid grid-cols-1 md:grid-cols-3 gap-4 ${user && currentProjectId ? '' : 'hidden'}">
            <div class="kanban-column rounded-lg p-3" data-status="todo"><h2 class="text-lg font-bold mb-3 px-1">To Do</h2><div class="column-tasks space-y-3 min-h-[200px]"></div></div>
            <div class="kanban-column rounded-lg p-3" data-status="inprogress"><h2 class="text-lg font-bold mb-3 px-1">In Progress</h2><div class="column-tasks space-y-3 min-h-[200px]"></div></div>
            <div class="kanban-column rounded-lg p-3" data-status="done"><h2 class="text-lg font-bold mb-3 px-1">Done</h2><div class="column-tasks space-y-3 min-h-[200px]"></div></div>
        </div>
        <div id="notLoggedInMessage" class="${user ? 'hidden' : ''} text-center p-8 text-xl text-gray-500">
            Please log in to view and manage your projects and tasks.
        </div>
        <div id="noProjectSelectedMessage" class="${user && !currentProjectId ? '' : 'hidden'} text-center p-8 text-xl text-gray-500">
            Please select or create a project to view and manage tasks.
        </div>
    </div>

    <!-- Task Details Modal -->
    <div id="taskDetailsModal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2 id="modalTaskTitle" class="text-xl font-bold mb-2"></h2>
            <p id="modalTaskDescription" class="text-sm text-gray-500 mb-4"></p>
            <div class="mt-4">
                <h3 class="font-semibold text-lg mb-2">Details:</h3>
                <p id="modalTaskDetails" class="whitespace-pre-wrap"></p>
            </div>
            <div class="mt-4">
                <h3 class="font-semibold text-lg mb-2">Documentation:</h3>
                <ul id="modalDocumentationLinks" class="list-disc pl-5"></ul>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            
            const columns = {
                todo: document.querySelector('[data-status="todo"] .column-tasks'),
                inprogress: document.querySelector('[data-status="inprogress"] .column-tasks'),
                done: document.querySelector('[data-status="done"] .column-tasks')
            };

            const priorityStyles = {
                high: { badge: 'bg-red-500 text-white', border: 'border-red-500' },
                medium: { badge: 'bg-yellow-500 text-black', border: 'border-yellow-500' },
                low: { badge: 'bg-green-500 text-white', border: 'border-green-500' }
            };

            // Modal elements
            const taskDetailsModal = document.getElementById('taskDetailsModal');
            const closeButton = document.querySelector('.close-button');
            const modalTaskTitle = document.getElementById('modalTaskTitle');
            const modalTaskDescription = document.getElementById('modalTaskDescription');
            const modalTaskDetails = document.getElementById('modalTaskDetails');
            const modalDocumentationLinks = document.getElementById('modalDocumentationLinks');

            closeButton.onclick = () => { taskDetailsModal.style.display = 'none'; };
            window.onclick = (event) => {
                if (event.target == taskDetailsModal) {
                    taskDetailsModal.style.display = 'none';
                }
            };

            // Auth Elements
            const loggedInState = document.getElementById('loggedInState');
            const loggedOutState = document.getElementById('loggedOutState');
            const userEmailSpan = document.getElementById('userEmail');
            const loginBtn = document.getElementById('loginBtn');
            const registerBtn = document.getElementById('registerBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const emailInput = document.getElementById('emailInput');
            const passwordInput = document.getElementById('passwordInput');
            const authErrorDiv = document.getElementById('authError');

            // API Key Elements
            const apiKeyInput = document.getElementById('apiKeyInput');
            const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');

            // Project Management Elements
            const projectManagementSection = document.getElementById('projectManagementSection');
            const projectSelect = document.getElementById('projectSelect');
            const selectProjectBtn = document.getElementById('selectProjectBtn');
            const newProjectInput = document.getElementById('newProjectInput');
            const createProjectBtn = document.getElementById('createProjectBtn');
            const currentProjectDisplay = document.getElementById('currentProjectDisplay');

            // Task Management Elements
            const taskManagementSection = document.getElementById('taskManagementSection');
            const kanbanBoard = document.getElementById('kanban-board');
            const notLoggedInMessage = document.getElementById('notLoggedInMessage');
            const noProjectSelectedMessage = document.getElementById('noProjectSelectedMessage');

            let currentProjectId = null; // Client-side tracking of selected project (can be set by backend)

            function updateAuthUI(user) {
                if (user) {
                    loggedInState.classList.remove('hidden');
                    loggedOutState.classList.add('hidden');
                    userEmailSpan.textContent = user.email;
                    projectManagementSection.classList.remove('hidden'); // Show project section
                    notLoggedInMessage.classList.add('hidden'); // Hide not logged in message
                    authErrorDiv.classList.add('hidden'); // Hide any auth errors
                    authErrorDiv.textContent = '';
                } else {
                    loggedInState.classList.add('hidden');
                    loggedOutState.classList.remove('hidden');
                    userEmailSpan.textContent = '';
                    projectManagementSection.classList.add('hidden'); // Hide project section
                    taskManagementSection.classList.add('hidden'); // Hide task section
                    kanbanBoard.classList.add('hidden'); // Hide kanban board
                    notLoggedInMessage.classList.remove('hidden'); // Show not logged in message
                    noProjectSelectedMessage.classList.add('hidden'); // Hide no project message
                    clearAuthFields(); // Clear email/password fields on logout
                    projectSelect.innerHTML = '<option value="">-- Select a Project --</option>'; // Clear projects dropdown
                    currentProjectDisplay.textContent = 'Current Project: None';
                    currentProjectId = null; // Clear client-side project ID
                }
            }

            function updateProjectUI(selectedProjectId) {
                currentProjectId = selectedProjectId; // Update client-side state
                if (selectedProjectId) {
                    taskManagementSection.classList.remove('hidden');
                    kanbanBoard.classList.remove('hidden');
                    noProjectSelectedMessage.classList.add('hidden');
                    const selectedOption = projectSelect.querySelector('option[value="' + selectedProjectId + '"]');
                    if (selectedOption) {
                        currentProjectDisplay.textContent = 'Current Project: ' + selectedOption.textContent;
                    }
                } else {
                    taskManagementSection.classList.add('hidden');
                    kanbanBoard.classList.add('hidden');
                    noProjectSelectedMessage.classList.remove('hidden');
                    currentProjectDisplay.textContent = 'Current Project: None';
                }
            }

            function clearAuthFields() {
                emailInput.value = '';
                passwordInput.value = '';
            }

            function createTaskElement(task) {
                const card = document.createElement('div');
                const pStyles = priorityStyles[task.priority] || priorityStyles.medium;
                // Sửa lỗi: Thay thế template literal bằng nối chuỗi
                card.className = 'task-card p-3 rounded-lg shadow-sm cursor-grab flex flex-col gap-2 border-l-4 ' + pStyles.border;
                card.dataset.taskId = task.id;
                card.draggable = true;
                // Sửa lỗi: Thay thế template literal bằng nối chuỗi cho innerHTML
                card.innerHTML = 
                    '<div class="flex justify-between items-start">' +
                        '<p class="font-semibold break-words pr-2">' + (task.title || 'Untitled Task') + '</p>' +
                        '<button class="delete-task-btn text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg></button>' +
                    '</div>' +
                    '<div class="flex items-center justify-between text-xs">' +
                        '<span class="px-2 py-0.5 rounded-full font-medium ' + pStyles.badge + '">' + (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) + '</span>' +
                        '<select class="priority-select p-1 rounded-md">' +
                            '<option value="low" ' + (task.priority === 'low' ? 'selected' : '') + '>Low</option>' +
                            '<option value="medium" ' + (task.priority === 'medium' ? 'selected' : '') + '>Medium</option>' +
                            '<option value="high" ' + (task.priority === 'high' ? 'selected' : '') + '>High</option>' +
                        '</select>' +
                    '</div>';
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-task-btn') && !e.target.closest('.priority-select')) {
                        vscode.postMessage({ command: 'getTaskDetails', taskId: task.id });
                    }
                });
                return card;
            }

            function renderTasks(tasks) {
                Object.values(columns).forEach(col => {
                    if (col) { col.innerHTML = ''; }
                });

                if (!tasks) return;
                
                tasks.forEach(task => {
                    if (task && task.status && columns[task.status]) {
                        try {
                            const taskElement = createTaskElement(task);
                            columns[task.status].appendChild(taskElement);
                        } catch(e) {
                            console.error('Failed to create task element for:', task, e);
                        }
                    }
                });
            }
            
            function displayTaskDetails(task) {
                console.log("Displaying task details for:", task);
                modalTaskTitle.textContent = task.title;
                modalTaskDescription.textContent = task.description;
                modalTaskDetails.innerHTML = task.details || 'No detailed information available.';

                modalDocumentationLinks.innerHTML = '';
                if (task.documentationLinks && task.documentationLinks.length > 0) {
                    task.documentationLinks.forEach(link => {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = link.url;
                        a.textContent = link.title;
                        a.target = '_blank';
                        a.className = 'text-blue-400 hover:underline';
                        li.appendChild(a);
                        modalDocumentationLinks.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'No documentation links available.';
                    modalDocumentationLinks.appendChild(li);
                }
                taskDetailsModal.style.display = 'block';
            }

            function populateProjectSelect(projects) {
                projectSelect.innerHTML = '<option value="">-- Select a Project --</option>';
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
                // Set the current selected project if one exists
                if (currentProjectId) {
                    projectSelect.value = currentProjectId;
                }
            }

            // Initial UI update based on passed user status
            updateAuthUI(${JSON.stringify(user)});
            // The logic below in window.addEventListener for 'authStatus' now handles loading projects/tasks based on backend state.

            window.addEventListener('message', event => {
                if (event.data.command === 'loadTasks') {
                    renderTasks(event.data.tasks);
                } else if (event.data.command === 'displayTaskDetails') {
                    displayTaskDetails(event.data.task);
                } else if (event.data.command === 'authStatus') {
                    updateAuthUI(event.data.user);
                    if (event.data.user) {
                        // If user logs in, request projects and then tasks
                        vscode.postMessage({ command: 'requestProjectsAndTasks' }); 
                    } else {
                        renderTasks([]); // Clear tasks if logged out
                        updateProjectUI(null); // Clear project UI state
                    }
                } else if (event.data.command === 'showError') {
                    authErrorDiv.textContent = event.data.message;
                    authErrorDiv.classList.remove('hidden');
                } else if (event.data.command === 'clearAuthFields') {
                    clearAuthFields();
                } else if (event.data.command === 'loadProjects') {
                    populateProjectSelect(event.data.projects);
                } else if (event.data.command === 'projectCreated') {
                    // Add the new project to the dropdown and select it
                    const newProject = event.data.project;
                    const option = document.createElement('option');
                    option.value = newProject.id;
                    option.textContent = newProject.name;
                    projectSelect.appendChild(option);
                    projectSelect.value = newProject.id;
                    updateProjectUI(newProject.id); // Update UI for newly created project
                } else if (event.data.command === 'projectSelected') {
                    currentProjectId = event.data.projectId; // Update client-side current project ID
                    updateProjectUI(event.data.projectId);
                    projectSelect.value = event.data.projectId; // Ensure dropdown reflects selection
                } else if (event.data.command === 'requestInitialData') {
                    // This command is sent on webview load. We use it to trigger initial data load.
                    // This is handled by the authStateChanged listener in the extension.ts
                    // which will send 'authStatus' and then 'loadProjects' and 'loadTasks'.
                }
            });

            // API Key handlers
            saveApiKeyBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'setApiKey', apiKey: apiKeyInput.value });
            });

            // Auth handlers
            loginBtn.addEventListener('click', () => {
                authErrorDiv.classList.add('hidden'); // Clear previous error
                authErrorDiv.textContent = '';
                vscode.postMessage({ command: 'login', email: emailInput.value, password: passwordInput.value });
            });
            registerBtn.addEventListener('click', () => {
                authErrorDiv.classList.add('hidden'); // Clear previous error
                authErrorDiv.textContent = '';
                vscode.postMessage({ command: 'register', email: emailInput.value, password: passwordInput.value });
            });
            logoutBtn.addEventListener('click', () => {
                authErrorDiv.classList.add('hidden'); // Clear previous error
                authErrorDiv.textContent = '';
                vscode.postMessage({ command: 'logout' });
            });

            // Project handlers
            createProjectBtn.addEventListener('click', () => {
                if (newProjectInput.value) {
                    vscode.postMessage({ command: 'createProject', projectName: newProjectInput.value });
                    newProjectInput.value = '';
                } else {
                    vscode.postMessage({ command: 'showError', message: 'Please enter a project name.' });
                }
            });

            selectProjectBtn.addEventListener('click', () => {
                const selectedId = projectSelect.value;
                if (selectedId) {
                    const selectedName = projectSelect.options[projectSelect.selectedIndex].text;
                    vscode.postMessage({ command: 'selectProject', projectId: selectedId, projectName: selectedName });
                } else {
                    vscode.postMessage({ command: 'showError', message: 'Please select a project.' });
                }
            });


            const addTaskBtn = document.getElementById('addTaskBtn');
            const newTaskInput = document.getElementById('newTaskInput');
            function handleAddTask() {
                // Only allow adding tasks if project is selected (UI state check)
                if (newTaskInput.value && currentProjectId) { // Check currentProjectId from client-side state
                    vscode.postMessage({ command: 'addTask', title: newTaskInput.value });
                    newTaskInput.value = '';
                } else if (!currentProjectId) { // No project selected
                    vscode.postMessage({ command: 'showError', message: 'Please select a project to add tasks.' });
                } else { // Not logged in (though UI should prevent this case)
                    vscode.postMessage({ command: 'showError', message: 'Please log in and select a project to add tasks.' });
                }
            }
            addTaskBtn.addEventListener('click', handleAddTask);
            newTaskInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAddTask());

            const board = document.getElementById('kanban-board');
            board.addEventListener('click', (e) => {
                const target = e.target.closest('.delete-task-btn');
                if (target) {
                    const taskCard = target.closest('.task-card');
                    if (taskCard) vscode.postMessage({ command: 'deleteTask', taskId: taskCard.dataset.taskId });
                }
            });
            board.addEventListener('change', (e) => {
                const target = e.target.closest('.priority-select');
                if (target) {
                    const taskCard = target.closest('.task-card');
                    if (taskCard) vscode.postMessage({ command: 'updateTaskPriority', taskId: taskCard.dataset.taskId, newPriority: target.value });
                }
            });
            
            let draggedTaskId = null;
            board.addEventListener('dragstart', e => {
                const card = e.target.closest('.task-card');
                // Allow drag only if currentProjectId is set
                if (!currentProjectId) { // Check currentProjectId from client-side state
                    e.preventDefault(); // Prevent dragging if no project selected
                    vscode.postMessage({ command: 'showError', message: 'Please select a project to move tasks.' });
                    return;
                }
                if (card) { draggedTaskId = card.dataset.taskId; e.target.classList.add('opacity-50'); }
            });
            board.addEventListener('dragend', e => {
                const card = e.target.closest('.task-card');
                if(card) { card.classList.remove('opacity-50'); }
                draggedTaskId = null; 
            });
            Object.values(columns).forEach(column => {
                if (!column) return;
                const colEl = column.parentElement;
                colEl.addEventListener('dragover', e => { e.preventDefault(); colEl.classList.add('bg-blue-500', 'bg-opacity-20'); });
                colEl.addEventListener('dragleave', e => { colEl.classList.remove('bg-blue-500', 'bg-opacity-20'); });
                colEl.addEventListener('drop', e => {
                    e.preventDefault();
                    colEl.classList.remove('bg-blue-500', 'bg-opacity-20');
                    // Only allow drop if currentProjectId is set
                    if (draggedTaskId && !currentProjectId) { // Check currentProjectId from client-side state
                        vscode.postMessage({ command: 'showError', message: 'Please select a project to move tasks.' });
                        draggedTaskId = null; // Clear dragged task to prevent accidental updates
                        return;
                    }
                    if (draggedTaskId) {
                        vscode.postMessage({ command: 'updateTaskStatus', taskId: draggedTaskId, newStatus: colEl.dataset.status });
                    }
                });
            });

            // Request initial data when dashboard is loaded if user is already authenticated
            // This is handled by the authStateChanged listener in the extension.ts which fires on extension activation and user login.
            // We can keep this for redundancy or initial webview load, but ensure it doesn't cause duplicate calls.
            // A dedicated 'webviewReady' message might be cleaner.
            // For now, let's rename the existing one to be more specific for initial state.
            // vscode.postMessage({ command: 'requestInitialData' }); 
            // The logic below in window.addEventListener for 'authStatus' now handles loading projects/tasks.

            // Backend needs a way to send the initial currentProjectId to the webview
            // after the projects are loaded. This is done in onAuthStateChanged and showDashboard commands.
            // The client-side currentProjectId is updated via 'projectSelected' message.

        }());
    </script>
</body>
</html>`;
}
