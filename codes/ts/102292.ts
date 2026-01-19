

import { useCallback } from 'react';
import JSZip from 'jszip';
import { AppIdea, ProjectState, ChatMessage, Agent, RefactorPlan, IdeationResult, GitHubSettings, ApiSettings, TerminalEntry, ProjectFile, AgentName } from '../types.ts';
import { generateUUID } from '../utils/uuid.ts';
import { Action } from '../reducer.ts';
import { 
    performIdeation,
    refinePromptWithIdeation,
    generateAppPlan, 
    generatePlanFromImage,
    generateCodeForFile, 
    chatWithOrchestrator, 
    performSelfDirectedLearning,
    generateTestError,
    debugCode,
    checkForMissingDependencies,
    addPackageDependency,
    refactorCodebase,
    generateCICDFile,
    generateApiClient,
    generateMigrationFile,
    runSecurityAudit,
    parseJsonResponse,
} from '../services/geminiService.ts';
import { claudeCodeService } from '../services/claudeCodeService.ts';
import { ingestRepo, deployToGithub, createGithubProject, createProjectIssue } from '../services/githubService.ts';
import { getRelevantKnowledge, learnFromSuccess } from '../services/knowledgeBaseService.ts';
import { findFileByPath, flattenFileTree, updateFileByPath, addFileByPath as addFileToFileTree } from '../utils/fileTree.ts';


export const useProjectOrchestrator = (state: ProjectState, dispatch: React.Dispatch<Action>) => {
    const { 
        projectPlan, originalPrompt, chatHistory, selectedFilePath, agents, githubSettings 
    } = state;
    
    const isBuildingRef = { current: false }; // Use a ref-like object to track build status across async calls

    const addMessage = useCallback((role: ChatMessage['role'], content: string) => {
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { id: generateUUID(), role, content, timestamp: new Date().toISOString() } });
    }, [dispatch]);

    const addTerminalEntry = useCallback((agent: AgentName, message: string, status: TerminalEntry['status'] = 'info') => {
        dispatch({ type: 'ADD_TERMINAL_ENTRY', payload: { agent, message, status } });
    }, [dispatch]);

    const updateAgentStatus = useCallback((agentName: Agent['name'], status: Agent['status']) => {
        dispatch({ type: 'UPDATE_AGENT_STATUS', payload: { name: agentName, status }});
    }, [dispatch]);


    const handleAppIdeaSubmit = useCallback(async (idea: AppIdea) => {
        dispatch({ type: 'RESET_STATE' });
        
        if (idea.githubRepoUrl) {
            // MCP: Codebase Ingestion
            dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: `Ingesting repo from ${idea.githubRepoUrl}...` } });
            updateAgentStatus('Orchestrator', 'Ingesting');
            try {
                const plan = await ingestRepo(idea.githubRepoUrl);
                if (!plan) throw new Error("Could not ingest the repository. Please check the URL and ensure it's a public repository.");
                dispatch({ type: 'SET_PLAN', payload: plan });
                addMessage('system', `Successfully ingested code from ${idea.githubRepoUrl}.`);
            } catch(e) {
                const error = e instanceof Error ? e.message : "An unknown error occurred.";
                dispatch({ type: 'SET_ERROR', payload: error });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
                updateAgentStatus('Orchestrator', 'Idle');
            }

        } else {
            // Standard Ideation Flow
            dispatch({ type: 'START_IDEATION', payload: { prompt: idea.prompt } });
            updateAgentStatus('Market Analyst', 'Researching...');
            updateAgentStatus('Product Strategist', 'Thinking...');
            dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Analyzing competitors and ideating features...' } });
            
            try {
                const result = await performIdeation(idea);
                 if (!result) throw new Error("The AI failed to generate a valid ideation analysis.");
                dispatch({ type: 'SET_IDEATION_RESULT', payload: result });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during ideation.";
                dispatch({ type: 'SET_ERROR', payload: errorMessage });
                addMessage('system', `Error during ideation: ${errorMessage}`);
            } finally {
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
                updateAgentStatus('Market Analyst', 'Idle');
                updateAgentStatus('Product Strategist', 'Idle');
            }
        }
    }, [dispatch, addMessage, updateAgentStatus]);
    
    const handleFinalizeIdea = useCallback(async (selectedFeatures: string[]) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Refining idea and creating project plan...' }});
        updateAgentStatus('Orchestrator', 'Planning');
        
        try {
            const refinedPrompt = await refinePromptWithIdeation(originalPrompt, selectedFeatures);
            if (!refinedPrompt) throw new Error("Could not refine the prompt.");
            
            dispatch({ type: 'START_PLANNING', payload: { prompt: refinedPrompt }});
            
            const plan = await generateAppPlan({ prompt: refinedPrompt });
            if (!plan) throw new Error("The AI failed to generate a valid plan.");
            
            dispatch({ type: 'SET_PLAN', payload: plan });

        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during planning.";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            addMessage('assistant', `I'm sorry, I ran into an error while planning: ${errorMessage}`);
        } finally {
             dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            updateAgentStatus('Orchestrator', 'Idle');
        }
    }, [originalPrompt, dispatch, addMessage, updateAgentStatus]);
    
    const handleDebugCode = async (filePath: string): Promise<boolean> => {
        if (!projectPlan) return false;
        const fileToDebug = findFileByPath(projectPlan.fileStructure, filePath);
        if (!fileToDebug || !fileToDebug.code || !fileToDebug.testError) return false;

        updateAgentStatus('Debugger', 'Debugging');
        addTerminalEntry('Debugger', `Attempting to fix bug in ${filePath}...`);
        
        try {
            const fixedCode = await debugCode(fileToDebug.code, fileToDebug.testError);
            if (fixedCode) {
                dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: filePath, code: fixedCode } });
                addTerminalEntry('Debugger', `Successfully applied a fix to ${filePath}. Re-running tests...`, 'success');
                updateAgentStatus('Debugger', 'Idle');
                return true;
            }
            throw new Error("Debugger could not generate a fix.");
        } catch (e) {
            addTerminalEntry('Debugger', `Failed to fix the bug in ${filePath}.`, 'error');
            updateAgentStatus('Debugger', 'Idle');
            return false;
        }
    };

    const handleRunTests = async (filePath: string): Promise<boolean> => {
        if (!projectPlan) return false;
        const fileToTest = findFileByPath(projectPlan.fileStructure, filePath);
        if (!fileToTest || !fileToTest.code) return false;
        
        updateAgentStatus('QA Engineer', 'Testing');
        addTerminalEntry('QA Engineer', `Running tests on ${filePath}...`);

        const { isSuccess, errorMessage } = await generateTestError(fileToTest.code);

        if(isSuccess) {
            dispatch({ type: 'UPDATE_FILE_TEST_STATUS', payload: { path: filePath, testStatus: 'passing' } });
            addTerminalEntry('QA Engineer', `Tests PASSED for ${filePath}`, 'success');
            updateAgentStatus('QA Engineer', 'Idle');
            learnFromSuccess(filePath, fileToTest.code);
            return true;
        } else {
            addTerminalEntry('QA Engineer', `Tests FAILED for ${filePath}: ${errorMessage}`, 'error');
            dispatch({ type: 'UPDATE_FILE_TEST_STATUS', payload: { path: filePath, testStatus: 'failing', testError: errorMessage } });
            
            // Self-Healing Loop
            updateAgentStatus('QA Engineer', 'Idle');
            addMessage('system', `Tests failed for \`${filePath}\`. Handing off to Debugger agent for self-healing.`);
            const fixed = await handleDebugCode(filePath);
            if (fixed) {
                // Rerun tests after fix
                return await handleRunTests(filePath);
            } else {
                addMessage('assistant', `I tried to fix \`${filePath}\` but couldn't resolve the issue. You may need to manually edit the code or ask me for specific changes.`);
                return false;
            }
        }
    };

    const handleGenerateCode = useCallback(async (filePath: string): Promise<boolean> => {
        if (!projectPlan) return false;

        const fileToGenerate = findFileByPath(projectPlan.fileStructure, filePath);
        if (!fileToGenerate || fileToGenerate.type === 'directory') return false;
        
        // Try Claude Code first, fallback to Gemini agents
        const useClaudeCode = await claudeCodeService.connect();
        const coderName = useClaudeCode ? 'Claude Code' : 
            (fileToGenerate.path.includes('src/components') || fileToGenerate.path.endsWith('.css') || fileToGenerate.path.endsWith('tailwind.config.js') ? 'Frontend Expert' : 'Backend Expert');
        
        dispatch({ type: 'SET_ERROR', payload: null });
        updateAgentStatus(coderName, 'Coding');

        if (!isBuildingRef.current) {
           addMessage('system', `(Consulting knowledge base for patterns related to \`${filePath}\`...)`);
           addMessage('assistant', `On it! Generating code for \`${filePath}\`...`);
           dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: `AI is writing code for ${filePath}...` } });
        }
        addTerminalEntry(coderName, `Generating code for ${filePath}...`);

        try {
            dispatch({ type: 'SET_FILE_STATUS', payload: { path: filePath, status: 'generating' } });
            const allFiles = flattenFileTree(projectPlan.fileStructure);
            let code: string;
            let planModificationRequest: any;

            if (useClaudeCode) {
                // Use Claude Code service
                const result = await claudeCodeService.generateCodeForFile(fileToGenerate, projectPlan, allFiles);
                if (result) {
                    code = result.code;
                    planModificationRequest = result.planModificationRequest;
                } else {
                    throw new Error('Claude Code service failed to generate code');
                }
            } else {
                // Fallback to Gemini service
                const knowledge = getRelevantKnowledge(filePath);
                const result = await generateCodeForFile(fileToGenerate, projectPlan, knowledge, allFiles);
                code = result.code;
                planModificationRequest = result.planModificationRequest;
            }

            // Adaptive Planning Loop
            if (planModificationRequest?.action === 'createFile') {
                const newFilePath = planModificationRequest.path;
                addMessage('assistant', `(Adaptive Planning) I realized I need a new file: ${planModificationRequest.reason}. I've added \`${newFilePath}\` to the file tree.`);
                dispatch({ type: 'ADD_FILE', payload: { path: newFilePath } });
            }

            dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: filePath, code: code } });
            addTerminalEntry(coderName, `Code generation complete for ${filePath}.`, 'success');
            
            if (!isBuildingRef.current) {
                addMessage('assistant', `I've finished writing the code for \`${filePath}\`. You can review it in the editor.`);
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            dispatch({ type: 'SET_ERROR', payload: `Failed to generate code for ${filePath}.` });
            dispatch({ type: 'SET_FILE_STATUS', payload: { path: filePath, status: 'error' } });
             addTerminalEntry(coderName, `Code generation failed for ${filePath}.`, 'error');
            if (!isBuildingRef.current) {
                addMessage('assistant', `Sorry, I hit a snag while generating code for \`${filePath}\`: ${errorMessage}`);
            }
            return false;
        } finally {
            updateAgentStatus(coderName, 'Idle');
            if (!isBuildingRef.current) {
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            }
        }
    }, [projectPlan, addMessage, addTerminalEntry, updateAgentStatus, dispatch]);
    
    const handleBuildProject = useCallback(async () => {
        if (!projectPlan) return;
        isBuildingRef.current = true;
        dispatch({ type: 'SET_BUILD_STATUS', payload: true });
        addMessage('system', 'Starting full project build...');
        dispatch({ type: 'CLEAR_TERMINAL' });

        const filesToBuild = flattenFileTree(projectPlan.fileStructure).filter(f => f.type === 'file' && f.status !== 'generated');

        for (const file of filesToBuild) {
            addTerminalEntry('Orchestrator', `--- Starting work on ${file.path} ---`);
            const generated = await handleGenerateCode(file.path);
            if (!generated) {
                addMessage('system', `Build failed on ${file.path}. Halting process.`);
                addTerminalEntry('Orchestrator', `Build HALTED due to error in ${file.path}.`, 'error');
                break; // Stop build on failure
            }
            // Automated TDD Loop
            const testsPassed = await handleRunTests(file.path);
            if (!testsPassed) {
                addMessage('system', `Tests failed for ${file.path} and could not be self-healed. Halting build.`);
                addTerminalEntry('Orchestrator', `Build HALTED due to unresolvable test failure in ${file.path}.`, 'error');
                break;
            }
        }

        addMessage('system', 'Full project build process finished.');
        isBuildingRef.current = false;
        dispatch({ type: 'SET_BUILD_STATUS', payload: false });
    }, [projectPlan, handleGenerateCode, handleRunTests, addMessage, addTerminalEntry, dispatch]);

    const handleRefactorProject = useCallback(async () => {
        if (!projectPlan) return;
        
        addMessage('system', 'Analyzing codebase for refactoring opportunities...');
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Senior Architect is analyzing the code...' } });
        updateAgentStatus('Senior Architect', 'Thinking...');

        try {
            const allFiles = flattenFileTree(projectPlan.fileStructure);
            const plan = await refactorCodebase(allFiles);
            if (plan) {
                 addMessage('assistant', `I've analyzed the codebase and have a refactoring suggestion: ${plan.reasoning}. Do you want me to proceed?`);
                 // Here you could add a state to wait for user confirmation
                 // For now, we'll just log it.
                 // TODO: Add proper logging service
                 // console.log("Refactor plan:", plan);
            } else {
                addMessage('assistant', 'I reviewed the codebase and it looks quite clean. I don\'t have any major refactoring suggestions at this time.');
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "Unknown error";
            addMessage('system', `Code refactoring analysis failed: ${error}`);
        } finally {
             dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
             updateAgentStatus('Senior Architect', 'Idle');
        }
    }, [projectPlan, addMessage, updateAgentStatus, dispatch]);
    
    const handleDownloadZip = useCallback(() => {
        if (!projectPlan) return;
        const zip = new JSZip();
        const allFiles = flattenFileTree(projectPlan.fileStructure);
        allFiles.forEach(file => {
            if (file.type === 'file' && file.code) {
                zip.file(file.path, file.code);
            } else if (file.type === 'directory') {
                zip.folder(file.path);
            }
        });
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${projectPlan.projectName || 'project'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [projectPlan]);

     return {
        handleAppIdeaSubmit,
        handleFinalizeIdea,
        handleGenerateCode,
        handleCodeChange: (newCode: string) => {
             if (!selectedFilePath) return;
             dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: selectedFilePath, code: newCode } });
        },
        handleSelectFile: (path: string | null) => dispatch({ type: 'SELECT_FILE', payload: path }),
        handleSendMessage: async (message: string) => {
            addMessage('user', message);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });
            updateAgentStatus('Claude Code', 'Thinking...');
            
            try {
                const currentFile = selectedFilePath && projectPlan ? findFileByPath(projectPlan.fileStructure, selectedFilePath) : null;
                
                // Try Claude Code first
                let response: string;
                const claudeAvailable = await claudeCodeService.connect();
                
                if (claudeAvailable) {
                    const claudeResponse = await claudeCodeService.chat(message, chatHistory, projectPlan, currentFile);
                    if (claudeResponse) {
                        response = claudeResponse;
                    } else {
                        // Fallback to Gemini
                        response = await chatWithOrchestrator([...chatHistory, { id: 'temp', role: 'user', content: message, timestamp: '' }], projectPlan, currentFile);
                    }
                } else {
                    // Use Gemini directly
                    response = await chatWithOrchestrator([...chatHistory, { id: 'temp', role: 'user', content: message, timestamp: '' }], projectPlan, currentFile);
                }
                
                const parsed = parseJsonResponse<{ explanation: string, code: string }>(response);
                if (parsed && parsed.code && parsed.explanation && selectedFilePath) {
                    addMessage('assistant', parsed.explanation);
                    dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: selectedFilePath, code: parsed.code } });
                } else {
                     addMessage('assistant', response);
                }

            } catch(e) {
                const error = e instanceof Error ? e.message : "An unknown error occurred";
                addMessage('assistant', `I'm sorry, I encountered an error: ${error}`);
            } finally {
                updateAgentStatus('Claude Code', 'Idle');
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            }
        },
        handleBuildProject,
        handleRunTests: () => {
            if (selectedFilePath) {
                handleRunTests(selectedFilePath);
            }
        },
        handleRefactorProject,
        handleDownloadZip,
        // ... other MCP handlers
        handleGenerateCICD: async () => {
            if (!projectPlan) return;
            const code = await generateCICDFile(projectPlan);
            if (code) {
                dispatch({ type: 'ADD_FILE', payload: { path: '.github/workflows/ci.yml' } });
                dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: '.github/workflows/ci.yml', code } });
                addMessage('system', 'CI/CD workflow file generated.');
            }
        },
        handleGenerateDbMigration: async () => {
            if (!projectPlan) return;
            const code = await generateMigrationFile(projectPlan);
             if (code) {
                dispatch({ type: 'ADD_FILE', payload: { path: 'db/migrations/001_initial_schema.sql' } });
                dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: 'db/migrations/001_initial_schema.sql', code } });
                addMessage('system', 'Database migration file generated.');
            }
        },
        handleGenerateApiClient: async () => {
            if (!projectPlan) return;
            const openapiFile = findFileByPath(projectPlan.fileStructure, 'openapi.yaml');
            if (openapiFile?.code) {
                const code = await generateApiClient(openapiFile.code);
                 if (code) {
                    dispatch({ type: 'ADD_FILE', payload: { path: 'src/services/apiClient.ts' } });
                    dispatch({ type: 'UPDATE_FILE_CODE', payload: { path: 'src/services/apiClient.ts', code } });
                    addMessage('system', 'API Client SDK generated.');
                }
            }
        },
        handleSecurityAudit: async () => {
            if (!projectPlan) return;
            const allFiles = flattenFileTree(projectPlan.fileStructure);
            const report = await runSecurityAudit(projectPlan, allFiles);
            addTerminalEntry('Security Analyst', '--- Security Audit Report ---', 'info');
            addTerminalEntry('Security Analyst', report, 'info');
        },
        handleImageUpload: async (file: File) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageBase64 = (e.target?.result as string).split(',')[1];
                dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Analyzing image...' } });
                const plan = await generatePlanFromImage(state.originalPrompt || "App based on uploaded design", imageBase64);
                if (plan) {
                    dispatch({ type: 'SET_PLAN', payload: plan });
                } else {
                     dispatch({ type: 'SET_ERROR', payload: "Failed to generate plan from image." });
                }
                 dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            };
            reader.readAsDataURL(file);
        },
        handleDeployToGithub: async () => {
            if (!projectPlan || !githubSettings.token || !githubSettings.repoName) return;
            await deployToGithub(githubSettings.token, githubSettings.repoName, projectPlan.fileStructure, "Initial commit by Autonomous Agent");
            addMessage('system', `Successfully deployed to GitHub: https://github.com/${githubSettings.repoName}`);
        },
        handleSyncIssues: async () => {
            if (!projectPlan || !githubSettings.token || !githubSettings.repoName) return;
             await createGithubProject(githubSettings.token, githubSettings.repoName, projectPlan.projectName);
             const files = flattenFileTree(projectPlan.fileStructure).filter(f => f.type === 'file');
             for(const file of files) {
                 await createProjectIssue(githubSettings.token, githubSettings.repoName, `Implement ${file.path}`, `Generate, test, and debug the file: ${file.path}`);
             }
             addMessage('system', 'Successfully synced tasks to GitHub Issues.');
        },
        handleSimulateProductionError: () => {
            addMessage('system', `(Alert Received) A critical error 'TypeError: Cannot read properties of undefined (reading 'map')' was detected in production. A high-priority task has been added to the plan to address this.`);
            dispatch({ type: 'ADD_FILE', payload: { path: 'src/emergency_fix/fix_prod_error.ts' } });
        },
        handleSetGithubSettings: (settings: GitHubSettings) => {
            dispatch({ type: 'SET_GITHUB_SETTINGS', payload: settings });
        },
        
        handleSetApiSettings: (settings: ApiSettings) => {
            dispatch({ type: 'SET_API_SETTINGS', payload: settings });
        },
    };
};