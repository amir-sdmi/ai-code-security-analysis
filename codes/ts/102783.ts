import * as vscode from 'vscode';
import { OpenAI } from 'openai';
import { PythonFunctionDetector } from '../utils/pythonFunctionDetector';
import { normalizeWhitespace } from '../utils/stringUtils';
import { Advice, AdvicesHolder, CompletionAdvisor } from './completionAdvisor';
import EventEmitter = require('events');

/**
 * Special character used to mark the cursor position in code context.
 * This marker is inserted into the code to provide the AI model with
 * precise information about where completions should be generated.
 */
const CURSOR_MARKER = "█";

/**
 * Core component responsible for generating actual code completion text using AI models.
 * 
 * This class serves as the heavy-lifting component of the completion system,
 * responsible for creating the actual code suggestions that users see as ghost text.
 * It implements sophisticated prompt engineering and post-processing to ensure
 * high-quality, contextually relevant completions.
 * 
 * The generator works in close coordination with the CompletionAdvisor, which
 * provides intelligent guidance about whether completions are needed and what
 * type of completion would be most helpful. This two-stage approach significantly
 * improves completion quality while optimizing API costs.
 * 
 * Key responsibilities:
 * - Prompt construction with rich context and guidance
 * - AI model invocation with appropriate parameters
 * - Post-processing of raw AI responses
 * - Integration with the advice system for intelligent completions
 * - Event-based suggestion delivery for real-time updates
 * 
 * The class uses advanced techniques like hierarchical scope truncation,
 * cursor marking, and sophisticated post-processing to create completions
 * that are both accurate and contextually appropriate.
 */
export class CompletionGenerator {
    /** OpenAI client for API communication */
    private client: OpenAI;
    /** Helper for code preprocessing and context extraction */
    private codePreprocessor: CodePreprocessor;
    /** Helper for cleaning and formatting AI-generated completions */
    private completionPostprocessor: CompletionPostprocessor;
    /** Advisor component for intelligent completion guidance */
    private completionAdvisor: CompletionAdvisor;
    /** Cache for storing and retrieving completion advice */
    private advices: AdvicesHolder;

    /**
     * Initializes the completion generator with all necessary dependencies.
     * 
     * Sets up the complete generation pipeline with specialized components:
     * - OpenAI client for AI model communication
     * - CodePreprocessor for sophisticated code context preparation
     * - CompletionPostprocessor for cleaning and formatting AI responses
     * - CompletionAdvisor for intelligent guidance
     * - AdvicesHolder for caching and retrieving relevant advice
     * 
     * These components work together to create a sophisticated completion
     * system that can generate high-quality, contextually appropriate
     * code suggestions while optimizing for performance and cost.
     * 
     * @param client - OpenAI client instance for API communication
     * @param advices - Cache for storing and retrieving completion advice
     * @param completionAdvisor - Advisor component for intelligent guidance
     */
    constructor(client: OpenAI, advices: AdvicesHolder, completionAdvisor: CompletionAdvisor) {
        this.client = client;
        this.completionPostprocessor = new CompletionPostprocessor();
        this.codePreprocessor = new CodePreprocessor();
        this.advices = advices;
        this.completionAdvisor = completionAdvisor;
    }

    /**
     * Retrieves configuration settings for AI model parameters.
     * 
     * This method reads user-configurable settings from VS Code's configuration
     * system to determine how the AI model should be invoked. It provides
     * sensible defaults while allowing users to customize the completion
     * behavior according to their preferences and requirements.
     * 
     * The configuration includes:
     * - Model selection (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
     * - Maximum token limit for completions
     * - Temperature setting for creativity control
     * 
     * @returns Object containing the current configuration settings
     */
    private getConfig() {
        const config = vscode.workspace.getConfiguration('aiCodeCompletion');
        return {
            model: config.get<string>('model', 'gpt-4o-mini'),
            maxTokens: config.get<number>('maxTokens', 100),
            temperature: config.get<number>('temperature', 0.2)
        };
    }

    /**************************************************
     * Completion Generation
     **************************************************/
    /**
     * Main entry point for generating code completion suggestions.
     * 
     * This method orchestrates the entire completion generation workflow,
     * from initial context analysis to final suggestion delivery. It implements
     * a sophisticated multi-stage process that ensures high-quality completions
     * while optimizing for performance and cost.
     * 
     * **Key Features:**
     * - **Event-based delivery**: Returns an Event<string> that can emit multiple
     *   suggestions, allowing for real-time updates and retries
     * - **Intelligent advice integration**: Uses cached advice or generates new
     *   advice to guide completion generation
     * - **Sophisticated context preparation**: Creates rich, focused prompts
     *   using hierarchical scope analysis and cursor marking
     * - **Error handling**: Implements comprehensive error handling and cleanup
     * - **Staleness prevention**: Uses timestamps to prevent outdated suggestions
     * 
     * **Workflow:**
     * 1. Validates document language and creates event emitter
     * 2. Prepares code context with cursor markers and scope analysis
     * 3. Retrieves or generates completion advice
     * 4. Constructs sophisticated AI prompts with guidance
     * 5. Invokes AI model with appropriate parameters
     * 6. Post-processes and validates the response
     * 7. Emits the final suggestion through the event system
     * 
     * The method is designed to handle the asynchronous nature of AI calls
     * gracefully while providing real-time feedback to the completion system.
     * 
     * @param document - The text document to generate completions for
     * @param position - The cursor position where completion is needed
     * @returns Event<string> that will emit the generated completion text
     */
    public generateSuggestion(document: vscode.TextDocument, position: vscode.Position): vscode.Event<string> {

        const time = Date.now()

        const eventEmitter = new vscode.EventEmitter<string>();
        const emitSuggestion = (completion: string | null) => {
            if (!completion || completion.trim().length === 0) {
                return
            }
            this.advices.clearAdvicesBefore(time - 100)
            eventEmitter.fire(completion);
        }

        const discloseAndHandleError = (err: Error) => {
            console.error(err)
            eventEmitter.dispose()
        }

        try {
            if (document.languageId !== 'python') {
                eventEmitter.dispose()
                return eventEmitter.event
            }

            // get the complete code from the document
            const completeCode = document.getText();
            const codeWithCursorMarker = this.codePreprocessor.insertCursorMarkerIntoCode(completeCode, position, "# insert your completion here", "# stop here, do not repeat any of the code that follows");  // Create a version of the code with a cursor marker

            const codeContext = this.codePreprocessor.extractContext(codeWithCursorMarker, position);
            const codeWithUnimportantScopesTruncated = this.codePreprocessor.truncateUnimportantScopes(codeWithCursorMarker, completeCode, position); // Use sophisticated function detection instead of simple radius

            const bestSuitableAdvice = this.advices.getMostSuitableAdvice(document, position)

            if(!bestSuitableAdvice){
                    this.completionAdvisor.generateCompletionAdvice(document, position).then((completionAdvice) => {
                        if(completionAdvice.isSuggestionNeeded === false){
                            eventEmitter.dispose()
                            return eventEmitter.event
                        }
                        this.generateCompletion(codeContext, codeWithUnimportantScopesTruncated, completionAdvice as Advice).then(emitSuggestion).catch(discloseAndHandleError).finally(() => eventEmitter.dispose())
                    }).catch(discloseAndHandleError)
            }else if(bestSuitableAdvice.isSuggestionNeeded === false){
                eventEmitter.dispose()
                return eventEmitter.event
            }else{
                this.generateCompletion(codeContext, codeWithUnimportantScopesTruncated, bestSuitableAdvice).then(emitSuggestion).catch(discloseAndHandleError)
            }

            return eventEmitter.event;
        } catch (error) {
            console.error(error);
            eventEmitter.dispose()
            return eventEmitter.event;
        }
    }

    /**
     * Generates the actual completion text using the AI model.
     * 
     * This method handles the core AI completion generation process, including
     * prompt construction, model invocation, and initial response processing.
     * It uses the advice from the CompletionAdvisor to create more targeted
     * and relevant completions.
     * 
     * The method implements sophisticated prompt engineering techniques:
     * - **Context preparation**: Uses preprocessed code with cursor markers
     * - **Guidance integration**: Incorporates advisor suggestions for better quality
     * - **Parameter optimization**: Adjusts token limits based on suggestion size
     * - **Response validation**: Ensures the completion is valid and non-empty
     * 
     * The completion is then passed through the postprocessor for cleaning
     * and formatting before being returned to the caller.
     * 
     * @param codeContext - The prepared code context with cursor markers
     * @param codeWithUnimportantScopesTruncated - Hierarchically truncated code context
     * @param completionAdvice - Guidance from the completion advisor
     * @returns Promise resolving to the generated completion text, or null if generation failed
     */
    private async generateCompletion(codeContext: string, codeWithUnimportantScopesTruncated: string, completionAdvice: Advice) {
        const prompt = this.generatePrompt(codeContext, codeWithUnimportantScopesTruncated, completionAdvice);
        const config = this.getConfig();

        const response = await this.client.completions.create({
            model: config.model,
            prompt: prompt,
            max_tokens: completionAdvice?.suggestionSize === "inline" ? 30 : 100,
            temperature: config.temperature,
        });

        let completion = response.choices[0].text.trimEnd();

        if (!completion) {
            return null;
        }

        completion = this.completionPostprocessor.postprocessCompletion(completion, codeContext, completionAdvice?.suggestionSize);

        return completion;
    }

    /**
     * Creates a hypothetical completion example to guide the AI model.
     * 
     * This method implements an advanced prompt engineering technique called
     * "few-shot learning" by providing the AI model with an example of what
     * a good completion might look like. This significantly improves the
     * quality and consistency of generated completions.
     * 
     * The method analyzes the code structure around the cursor and creates
     * a realistic example that demonstrates the expected completion style
     * and format. For inline completions, it focuses on single-line examples;
     * for block completions, it provides multi-line examples.
     * 
     * The hypothetical completion serves as a "seed" that biases the AI model
     * toward generating completions that match the expected style and format,
     * leading to more consistent and useful suggestions.
     * 
     * @param codeWithUnimportantScopesTruncated - The code context with cursor markers
     * @param oneLine - Whether to create a single-line or multi-line example
     * @returns A hypothetical completion example to guide the AI model
     */
    private createHypotheticalCompletion(codeWithUnimportantScopesTruncated: string, oneLine: boolean): string {
        const lines = codeWithUnimportantScopesTruncated.split('\n');

        const linesBeforeCursor = [];
        const linesAfterCursor = [];

        let lineContainingCursurWithCursorMarker: string | undefined;

        let cursorFound = false;

        for (const line of lines) {
            if (line.includes(CURSOR_MARKER)) {
                cursorFound = true;
                lineContainingCursurWithCursorMarker = line;
                break;
            }
            else if (cursorFound) {
                linesAfterCursor.push(line);
            }
            else {
                linesBeforeCursor.push(line);
            }
        }

        if (!cursorFound) {
            throw new Error("No cursor marker '█' found in code.");
        }

        const oneLineHypotheticalCompletion = lineContainingCursurWithCursorMarker?.replace(CURSOR_MARKER, "") || "";

        if(oneLine && oneLineHypotheticalCompletion.trim().length > 0){
            return oneLineHypotheticalCompletion;
        }

        const hypotheticalCompletion = linesBeforeCursor.join("\n") + "\n" + lineContainingCursurWithCursorMarker?.replace(CURSOR_MARKER, "");
        return hypotheticalCompletion;
    }

    /**
     * Generates the complete prompt for the AI model with sophisticated engineering.
     * 
     * This method constructs a comprehensive prompt that provides the AI model
     * with all the context and guidance needed to generate high-quality
     * completions. It implements several advanced prompt engineering techniques:
     * 
     * **System Prompt Features:**
     * - Clear instructions about cursor position and completion constraints
     * - Detailed rules about not repeating existing code
     * - Guidance on integrating completions seamlessly with existing code
     * - Emphasis on continuing from partial identifiers
     * 
     * **User Prompt Features:**
     * - The actual code context with cursor markers
     * - Specific guidance from the completion advisor
     * - Clear formatting instructions for the response
     * 
     * **Assistant Prompt Features:**
     * - A hypothetical completion example to guide the model
     * - Structured format that demonstrates expected output style
     * 
     * The prompt uses the ChatML format with system, user, and assistant
     * messages to provide the most effective context for the AI model.
     * 
     * @param codeContext - The prepared code context with cursor markers
     * @param codeWithUnimportantScopesTruncated - Hierarchically truncated code context
     * @param completionAdvice - Guidance from the completion advisor
     * @returns The complete prompt string for the AI model
     */
    private generatePrompt(codeContext: string, codeWithUnimportantScopesTruncated: string, completionAdvice: Advice | null): string {

        const suggestionSize = completionAdvice?.suggestionSize || "";

        const preparedCodeContext = codeContext
        const hypotheticalCompletion = this.createHypotheticalCompletion(codeWithUnimportantScopesTruncated, completionAdvice?.suggestionSize === "inline");

        const systemPrompt = `You are a powerful code completion assistant designed to assist users in writing high-quality Python code. You will be given the current code the user is working on, where the user's cursor is marked by the symbol █. This cursor will appear exactly once in the code. Along with the code, you will receive additional context such as surrounding code, comments, imports, and variable declarations to help you understand how to complete the code accurately.
You are responsible for generating comprehensive and intelligent ${suggestionSize} completion.

Make sure to generate completions starting exactly at the cursor position. You must integrate your ${suggestionSize} completion seamlessly with the existing code before and after the cursor. If any part of the completion already exists after the cursor, do not rewrite it—only insert the code that is not already present. Under no circumstances should you modify, overwrite, or repeat any existing code that follows the cursor.

If the user has partially typed a keyword, variable name, or any identifier, continue from where they left off. Your response should include only the code you insert at the cursor position. Do not repeat any existing code or provide explanations.

Here is the code the user is working on:`

        const userPrompt = `My code is:
\`\`\`python
${preparedCodeContext.trim()}
\`\`\`

Tip: ${completionAdvice?.advice || ""}

In your response write "My ${suggestionSize} completion is:" and then the code completion you suggest.
`
        const assistantPrompt = `My ${suggestionSize} completion is:
\`\`\`python
${hypotheticalCompletion}`

        const prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n${assistantPrompt}`

        return prompt;
    }
}

/**
 * Sophisticated code preprocessing component for AI completion generation.
 * 
 * This class handles the complex task of preparing code context for AI models
 * in a way that maximizes completion quality while minimizing token usage.
 * It implements several advanced techniques:
 * 
 * 1. **Hierarchical Scope Analysis**: Uses Python AST parsing to understand
 *    code structure and create intelligent context truncation
 * 
 * 2. **Cursor Marking**: Inserts special markers to precisely indicate
 *    where completions should be generated
 * 
 * 3. **Context Extraction**: Creates focused, relevant context windows
 *    that provide enough information without overwhelming the AI model
 * 
 * 4. **Indentation Management**: Handles complex indentation scenarios
 *    to ensure generated completions align properly with existing code
 * 
 * The preprocessor works closely with the PythonFunctionDetector to create
 * sophisticated, contextually aware code representations that lead to
 * higher-quality completions.
 */
export class CodePreprocessor {
    /** Analyzer for Python code structure and scope detection */
    private pythonDetector: PythonFunctionDetector;

    /**
     * Initializes the code preprocessor with Python analysis capabilities.
     * 
     * Sets up the PythonFunctionDetector for sophisticated code structure
     * analysis, enabling the preprocessor to create intelligent context
     * representations that maximize completion quality.
     */
    constructor() {
        this.pythonDetector = new PythonFunctionDetector();
    }

    /**
     * Creates a hierarchically truncated code representation for AI processing.
     * 
     * This method implements an advanced technique for reducing token usage
     * while preserving semantic context. It analyzes the Python code structure
     * and creates a representation where:
     * 
     * - **Innermost scope**: Contains the full code with cursor markers
     * - **Parent scopes**: Show only signatures and key elements with ellipsis
     * - **Global scope**: Provides minimal context for imports and top-level code
     * 
     * This approach dramatically reduces token usage while maintaining
     * the semantic context needed for high-quality completions. The AI model
     * can understand the broader code structure without being overwhelmed
     * by irrelevant details from distant scopes.
     * 
     * @param codeWithCursor - Array of code lines with cursor markers
     * @param code - The complete original code for scope analysis
     * @param position - The cursor position for scope determination
     * @returns Hierarchically truncated code representation optimized for AI processing
     */
    public truncateUnimportantScopes(codeWithCursor: string[], code: string, position: vscode.Position) {
        let codeWithScope = codeWithCursor.join('\n');

        const parentScopes = this.pythonDetector.getAllParentScopes(code, position.line);

        if (parentScopes.length > 0) {
            // Create hierarchical scope representation with truncated parent scopes
            codeWithScope = this.createHierarchicalScopeWithTruncation(parentScopes, code, position, (scope, index, position) => {
                const isInnermost = index === 0;
                const cursorLineInScope = position.line - scope.startLine;
                const scopeContainsCursor = cursorLineInScope >= 0 && cursorLineInScope < scope.content.split('\n').length;
                return isInnermost && scopeContainsCursor;
            });
        } else {
            console.warn("No scopes found");
            return "";
        }

        return codeWithScope;
    }

    /**
     * Creates a truncated representation of a scope showing only essential elements.
     * 
     * This method implements intelligent scope summarization by extracting
     * only the most important elements of a scope (typically the signature
     * and key structural elements) while indicating truncated content with
     * ellipsis. This dramatically reduces token usage while preserving
     * the semantic context needed for understanding the code structure.
     * 
     * The method handles complex indentation scenarios to ensure the
     * truncated scope aligns properly with the original code structure.
     * 
     * @param scope - The scope object containing start/end lines and content
     * @param originalCode - The complete original code for indentation reference
     * @returns Truncated scope representation with signature and ellipsis
     */
    public createTruncatedScope(scope: any, originalCode: string): string {
        const scopeLines = scope.content.split('\n');
        const originalLines = originalCode.split('\n');

        if (scopeLines.length === 0) {
            return '';
        }

        const result: string[] = [];

        // Get the original indentation for the first line
        const originalStartLine = originalLines[scope.startLine];
        const originalIndentation = this.getIndentation(originalStartLine);

        // Add the first line (signature) with proper indentation
        const firstLine = scopeLines[0];
        const firstLineIndentation = this.getIndentation(firstLine);
        const indentationDifference = originalIndentation.length - firstLineIndentation.length;
        const additionalIndentation = indentationDifference > 0 ? ' '.repeat(indentationDifference) : '';

        result.push(additionalIndentation + firstLine);

        // Add ellipsis to indicate truncated content
        const ellipsisIndentation = originalIndentation + '    '; // Add 4 spaces for ellipsis
        result.push(ellipsisIndentation + '...');

        return result.join('\n');
    }

    /**
     * Creates a complete hierarchical scope representation with intelligent truncation.
     * 
     * This method orchestrates the creation of a sophisticated code representation
     * that shows the full innermost scope (where the cursor is) while providing
     * truncated versions of parent scopes. This approach maximizes context
     * relevance while minimizing token usage.
     * 
     * The method processes scopes from outermost to innermost, applying
     * different strategies based on whether the scope contains the cursor:
     * 
     * - **Cursor-containing scope**: Full content with cursor markers
     * - **Parent scopes**: Truncated signatures with ellipsis
     * - **Indentation alignment**: Ensures proper alignment with original code
     * 
     * The result is a focused, contextually rich representation that provides
     * the AI model with exactly the information it needs for high-quality
     * completions without unnecessary token overhead.
     * 
     * @param parentScopes - Array of scope objects from outermost to innermost
     * @param originalCode - The complete original code for reference
     * @param position - The cursor position for scope analysis
     * @param keepScope - Function that determines which scopes to show in full
     * @returns Hierarchical scope representation optimized for AI processing
     */
    public createHierarchicalScopeWithTruncation(parentScopes: any[], originalCode: string, position: vscode.Position, keepScope: (scope: any, index: number, position: vscode.Position) => boolean): string {
        if (parentScopes.length === 0) {
            return '';
        }

        const lines: string[] = [];

        // Process scopes from outermost to innermost (reverse order)
        for (let i = parentScopes.length - 1; i >= 0; i--) {
            const scope = parentScopes[i];

            const cursorLineInScope = position.line - scope.startLine;

            if (keepScope(scope, i, position)) {
                // For the innermost scope, show the full content with cursor
                const fixedContent = this.fixScopeIndentation(scope.content, scope, originalCode);

                // Add cursor marker to the innermost scope
                const scopeLines = fixedContent.split('\n');

                const currentScopeLine = scopeLines[cursorLineInScope];
                const beforeCursor = currentScopeLine.substring(0, position.character);
                const afterCursor = currentScopeLine.substring(position.character);

                scopeLines[cursorLineInScope] = beforeCursor + CURSOR_MARKER + afterCursor;
                lines.push(scopeLines.join('\n'));

            } else {
                // For parent scopes, show truncated version
                const truncatedScope = this.createTruncatedScope(scope, originalCode);
                lines.push(truncatedScope);
            }
        }

        // Remove duplicate lines that might occur from overlapping scopes
        const uniqueLines = this.removeDuplicateLines(lines.join('\n'));
        return uniqueLines;
    }

    /**
     * Extracts the current line with cursor marker for context analysis.
     * 
     * This method creates a representation of the current line that includes
     * the cursor marker at the exact position where the user is typing.
     * This provides precise context for the AI model about where completions
     * should be generated.
     * 
     * @param code - The complete code text
     * @param position - The cursor position to mark
     * @returns The current line with cursor marker inserted
     */
    public getCursorLineWithMarker(code: string, position: vscode.Position): string {
        const lines = code.split('\n');
        const currentLine = lines[position.line];
        const beforeCursor = currentLine.substring(0, position.character);
        const afterCursor = currentLine.substring(position.character);

        return beforeCursor + CURSOR_MARKER + afterCursor;
    }

    /**
     * Inserts cursor markers and optional comments into the code.
     * 
     * This method creates a modified version of the code that includes
     * cursor markers and optional comments to guide the AI model. It
     * handles the complex task of inserting markers and comments at
     * the correct positions while maintaining proper indentation.
     * 
     * The method can insert comments before and/or after the cursor
     * position, which are used to provide additional guidance to the
     * AI model about what kind of completion is expected.
     * 
     * @param code - The original code text
     * @param position - The cursor position to mark
     * @param commentBeforeCursor - Optional comment to insert before the cursor
     * @param commentAfterCursor - Optional comment to insert after the cursor
     * @returns Array of code lines with markers and comments inserted
     */
    public insertCursorMarkerIntoCode(code: string, position: vscode.Position, commentBeforeCursor: string | null, commentAfterCursor: string | null) {
        const lines = code.split('\n');
        

        if(commentBeforeCursor){
            commentBeforeCursor = this.getIndentation(lines[position.line]) + commentBeforeCursor;
        }
        if(commentAfterCursor){
            commentAfterCursor = this.getIndentation(lines[position.line]) + commentAfterCursor;
        }

        lines[position.line] = this.getCursorLineWithMarker(code, position);

        // add comment before the cursor
        if(commentBeforeCursor){
            lines.splice(position.line, 0, commentBeforeCursor);
            if(commentAfterCursor){
                lines.splice(position.line + 2, 0, commentAfterCursor);
            }
        } 
        // add comment after the cursor
        else if(commentAfterCursor){
            lines.splice(position.line + 1, 0, commentAfterCursor); 
        }

        return lines;
    }

    /**
     * Extracts a focused context window around the cursor position.
     * 
     * This method creates a context window that provides the AI model
     * with relevant surrounding code without overwhelming it with
     * distant, irrelevant content. It implements intelligent context
     * extraction that balances completeness with focus.
     * 
     * The method uses configurable line limits to create context windows
     * that are large enough to provide meaningful context but small
     * enough to avoid token waste and maintain focus on the relevant
     * code area.
     * 
     * @param codeWithCursor - Array of code lines with cursor markers
     * @param position - The cursor position for context extraction
     * @param linesBeforeCursor - Number of lines to include before the cursor
     * @param linesAfterCursor - Number of lines to include after the cursor
     * @returns Focused context window around the cursor position
     */
    public extractContext(codeWithCursor: string[], position: vscode.Position, linesBeforeCursor: number = 60, linesAfterCursor: number = 30): string {
        const startLine = Math.max(0, position.line - linesBeforeCursor);
        const endLine = Math.min(codeWithCursor.length - 1, position.line + linesAfterCursor);

        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            context += codeWithCursor[i] + '\n';
        }

        return context;
    }

    /**
     * Fixes indentation alignment between scope content and original code.
     * 
     * This method handles the complex task of ensuring that scope content
     * aligns properly with the original code structure. It calculates
     * indentation differences and applies corrections to maintain
     * proper code formatting.
     * 
     * The method is essential for creating accurate code representations
     * that preserve the original formatting while providing the AI model
     * with properly structured context.
     * 
     * @param scopeContent - The content of the scope to fix
     * @param scope - The scope object containing position information
     * @param originalCode - The original code for indentation reference
     * @returns Scope content with corrected indentation
     */
    public fixScopeIndentation(scopeContent: string, scope: any, originalCode: string): string {
        if (!scopeContent || !scope || !originalCode) {
            return scopeContent;
        }

        const originalLines = originalCode.split('\n');
        const scopeLines = scopeContent.split('\n');

        if (scopeLines.length === 0 || originalLines.length === 0) {
            return scopeContent;
        }

        // Get the original indentation of the scope's start line
        const originalStartLine = originalLines[scope.startLine];
        const originalIndentation = this.getIndentation(originalStartLine);

        // Get the current indentation of the first line in the scope
        const scopeFirstLine = scopeLines[0];
        const scopeFirstLineIndentation = this.getIndentation(scopeFirstLine);

        // Calculate the difference in indentation
        const indentationDifference = originalIndentation.length - scopeFirstLineIndentation.length;

        if (indentationDifference > 0) {
            // Add the missing indentation to the first line
            const additionalIndentation = ' '.repeat(indentationDifference);
            scopeLines[0] = additionalIndentation + scopeFirstLine;
            return scopeLines.join('\n');
        }

        return scopeContent;
    }

    /**
     * Extracts the indentation (leading whitespace) from a line.
     * 
     * This helper method analyzes a line of code to determine its
     * indentation level, which is essential for maintaining proper
     * code structure in generated completions.
     * 
     * @param line - The line of code to analyze
     * @returns The indentation string (spaces/tabs) at the beginning of the line
     */
    public getIndentationOfLine(line: string) {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    /**
     * Extracts the indentation (leading whitespace) from a line.
     * 
     * This method uses regex to identify and extract the leading
     * whitespace characters from a line of code. It's used throughout
     * the preprocessor for indentation analysis and correction.
     * 
     * @param line - The line of code to analyze
     * @returns The indentation string (spaces/tabs) at the beginning of the line
     */
    public getIndentation(line: string): string {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    /**
     * Removes duplicate consecutive lines from hierarchical scope representations.
     * 
     * This method cleans up hierarchical scope representations by removing
     * duplicate lines that can occur when scopes overlap or when multiple
     * scope levels contain the same content. This ensures clean, focused
     * context for the AI model.
     * 
     * The method preserves the order of lines while removing exact duplicates,
     * ensuring that the context remains coherent and properly structured.
     * 
     * @param text - The text to clean of duplicate lines
     * @returns Text with duplicate consecutive lines removed
     */
    public removeDuplicateLines(text: string): string {
        const lines = text.split('\n');
        const uniqueLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const previousLine = i > 0 ? lines[i - 1] : null;

            // Skip if this line is the same as the previous line
            if (currentLine !== previousLine) {
                uniqueLines.push(currentLine);
            }
        }

        return uniqueLines.join('\n');
    }
}

/**
 * Sophisticated post-processing component for cleaning and formatting AI completions.
 * 
 * This class handles the complex task of transforming raw AI-generated completions
 * into clean, properly formatted code that integrates seamlessly with the user's
 * existing code. It implements several advanced processing techniques:
 * 
 * 1. **Markup Removal**: Strips AI model artifacts like end tokens and code blocks
 * 2. **Indentation Correction**: Ensures proper Python indentation alignment
 * 3. **Whitespace Normalization**: Standardizes whitespace for consistency
 * 4. **Repetition Prevention**: Removes duplicated code that might be generated
 * 5. **Size Enforcement**: Ensures completions match the expected size (inline vs block)
 * 
 * The postprocessor is essential for creating completions that feel natural
 * and integrate smoothly with the user's coding workflow.
 */
class CompletionPostprocessor {
    /**
     * Main post-processing method that cleans and formats AI-generated completions.
     * 
     * This method implements a comprehensive pipeline for transforming raw
     * AI responses into clean, usable code completions. It handles multiple
     * aspects of completion quality:
     * 
     * **Cleaning Operations:**
     * - Removes AI model artifacts (end tokens, code blocks)
     * - Strips cursor markers from the completion
     * - Normalizes whitespace for consistency
     * 
     * **Formatting Operations:**
     * - Corrects indentation to match Python standards
     * - Handles empty line scenarios appropriately
     * - Ensures proper alignment with existing code
     * 
     * **Validation Operations:**
     * - Removes code repetitions and stop markers
     * - Enforces size constraints (inline vs block)
     * - Validates completion quality and relevance
     * 
     * The method uses sophisticated algorithms to ensure that completions
     * are not only syntactically correct but also contextually appropriate
     * and well-integrated with the user's existing code.
     * 
     * @param completion - The raw AI-generated completion text
     * @param codeContext - The original code context for reference
     * @param suggestionSize - Whether the completion should be inline or block
     * @returns Clean, formatted completion text ready for insertion
     */
    public postprocessCompletion(completion: string, codeContext: string, suggestionSize: "inline" | "block") {
        if (completion.endsWith("<|im_end|>")) {
            completion = completion.substring(0, completion.lastIndexOf("<|im_end|>"));
        }

        // everything after the the last ``` should be removed including the ```
        const lastBacktickIndex = completion.lastIndexOf("```");
        if (lastBacktickIndex !== -1) {
            completion = completion.substring(0, lastBacktickIndex);
        }

        completion = completion.replace(CURSOR_MARKER, "");

        completion = normalizeWhitespace(completion, 4);

        const cursorLineEmpty = this.lineContainingCursurIsEmpty(codeContext);
        // correct the indentation of each of the lines: round to the nearest multiple of 4 (choose the smallest multiple of 4)
        completion = this.fixIndentation(completion, cursorLineEmpty);

        completion = this.cutIfCodeRepeats(completion);

        if(suggestionSize === "inline"){
            // get only the first line
            const lines = completion.split('\n');
            completion = lines[0];
        }
        return completion;
    }

    /**
     * Removes code that repeats after stop markers or contains repetition indicators.
     * 
     * This method implements intelligent repetition detection to prevent
     * the AI model from generating duplicate or irrelevant code. It looks
     * for specific markers like "stop here" comments and removes any
     * content that follows them.
     * 
     * The method is essential for ensuring that completions are focused
     * and relevant, preventing the AI from generating unnecessary or
     * repetitive code that could confuse users.
     * 
     * @param completion - The completion text to check for repetitions
     * @returns Completion text with repetitions and stop markers removed
     */
    private cutIfCodeRepeats(completion: string) {
        const lines = completion.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().includes("stop here")) {
                return lines.slice(0, i).join('\n');
            }
        }
        return completion;
    }

    /**
     * Corrects indentation to ensure proper Python formatting.
     * 
     * This method implements sophisticated indentation correction that
     * ensures generated completions align properly with the existing
     * code structure. It handles several complex scenarios:
     * 
     * - **Empty line scenarios**: Adjusts indentation when the cursor
     *   is on an empty line vs. a line with existing content
     * - **Python standards**: Rounds indentation to multiples of 4
     *   spaces for Pythonic formatting
     * - **Context alignment**: Ensures completions align with the
     *   surrounding code structure
     * 
     * The method uses configurable indentation rules to create
     * completions that feel natural and integrate seamlessly with
     * the user's existing code style.
     * 
     * @param completion - The completion text to fix indentation for
     * @param cursorLineEmpty - Whether the cursor line is empty
     * @returns Completion text with corrected indentation
     */
    private fixIndentation(completion: string, cursorLineEmpty: boolean) {
        const lines = completion.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!cursorLineEmpty && i === 0) {
                continue;
            }
            const line = lines[i];
            const prefix = line.match(/^\s*/)?.[0] || '';
            const prefixLength = prefix.length;
            const roundedPrefixLength = Math.round(prefixLength / 4) * 4;
            lines[i] = ' '.repeat(roundedPrefixLength) + line.substring(prefixLength);
        }
        completion = lines.join('\n');
        return completion;
    }

    /**
     * Determines whether the line containing the cursor is empty.
     * 
     * This method analyzes the code context to determine if the cursor
     * is positioned on an empty line. This information is crucial for
     * proper indentation handling, as empty lines require different
     * indentation strategies than lines with existing content.
     * 
     * The method handles various edge cases including whitespace-only
     * lines and cursor markers, ensuring accurate detection of truly
     * empty lines.
     * 
     * @param codeWithUnimportantScopesTruncated - The code context to analyze
     * @returns true if the cursor line is empty, false otherwise
     */
    private lineContainingCursurIsEmpty(codeWithUnimportantScopesTruncated: string) {
        const lines = codeWithUnimportantScopesTruncated.split('\n');

        let lineContainingCursurWithCursorMarker: string | undefined;

        for (const line of lines) {
            if (line.includes(CURSOR_MARKER)) {
                lineContainingCursurWithCursorMarker = line;
                break;
            }
        }

        const lineContainingCursurIsEmpty = (lineContainingCursurWithCursorMarker?.replace(/\t/g, "    ").replace(CURSOR_MARKER, "") || "").trim().length === 0;

        return lineContainingCursurIsEmpty;
    }
}
