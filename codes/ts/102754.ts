/**
 * Cursor Integration
 * Integrates with Cursor IDE using .cursorrules
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { enhancedPromptInjector } from '../core/enhanced-prompt-injector';
import { PromptContext } from '../core/prompt-injector';

export interface CursorRoutesConfig {
  [path: string]: {
    type: 'page' | 'component' | 'feature';
    base?: string;
    use_ui?: boolean;
    localized?: boolean;
    agent?: string;
    must_use_tailwind?: boolean;
    must_use_jsdoc?: boolean;
  };
}

export interface CursorMetadata {
  projectName: string;
  version: string;
  enforceRules: boolean;
  smartAgent: {
    enabled: boolean;
    autoEnrich: boolean;
    validateOnSave: boolean;
  };
}

export class CursorIntegration {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Generate .cursor.routes.json from project structure
   */
  public async generateCursorRoutes(): Promise<void> {
    const routes: CursorRoutesConfig = {
      "src/app": {
        type: "page",
        use_ui: true,
        localized: true,
        agent: "Task Management Smart Agent"
      },
      "src/components/ui": {
        type: "component",
        must_use_tailwind: true,
        must_use_jsdoc: true
      },
      "src/components/layout": {
        type: "component",
        base: "GridLayout System",
        must_use_tailwind: true
      },
      "src/features": {
        type: "feature",
        use_ui: true,
        localized: true
      },
      "src/packages": {
        type: "component",
        must_use_jsdoc: true
      }
    };

    const routesPath = path.join(this.projectRoot, '.cursor.routes.json');
    await fs.writeFile(routesPath, JSON.stringify(routes, null, 2));
  }

  /**
   * Generate .cursor.meta file
   */
  public async generateCursorMeta(): Promise<void> {
    const metadata: CursorMetadata = {
      projectName: "Task Management Application",
      version: "1.0.0",
      enforceRules: true,
      smartAgent: {
        enabled: true,
        autoEnrich: true,
        validateOnSave: true
      }
    };

    const metaPath = path.join(this.projectRoot, '.cursor.meta');
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Sync .cursorrules with CLAUDE.md
   */
  public async syncRules(): Promise<void> {
    try {
      // Check if both files exist
      const cursorRulesPath = path.join(this.projectRoot, '.cursorrules');
      const claudeMdPath = path.join(this.projectRoot, 'CLAUDE.md');

      const [cursorExists, claudeExists] = await Promise.all([
        fs.access(cursorRulesPath).then(() => true).catch(() => false),
        fs.access(claudeMdPath).then(() => true).catch(() => false)
      ]);

      if (!cursorExists && claudeExists) {
        // Generate .cursorrules from CLAUDE.md
        const claudeContent = await fs.readFile(claudeMdPath, 'utf-8');
        const cursorRules = this.convertClaudeMdToCursorRules(claudeContent);
        await fs.writeFile(cursorRulesPath, cursorRules);
        // Successfully generated .cursorrules from CLAUDE.md
      }
    } catch {
      // Error syncing rules - silently handle in production
    }
  }

  /**
   * Convert CLAUDE.md format to .cursorrules format
   */
  private convertClaudeMdToCursorRules(claudeContent: string): string {
    // The .cursorrules file already exists and has a good format
    // This is a placeholder for potential format conversion if needed
    return claudeContent;
  }

  /**
   * Create cursor-specific task prompt
   */
  public async createCursorPrompt(
    taskDescription: string,
    filePath?: string
  ): Promise<string> {
    const context: PromptContext = {
      platform: 'cursor',
      targetDirectory: filePath ? path.dirname(filePath) : undefined,
      component: filePath && filePath.includes('/components/') 
        ? path.basename(filePath, path.extname(filePath)) 
        : undefined,
      feature: filePath && filePath.includes('/features/') 
        ? path.basename(path.dirname(filePath)) 
        : undefined
    };

    return enhancedPromptInjector.generateCursorPrompt(taskDescription, context);
  }

  /**
   * Validate file against cursor rules
   */
  public async validateFile(filePath: string, content: string): Promise<{
    valid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const validation = await enhancedPromptInjector.validateCode(content);
    
    const suggestions: string[] = [];

    // Add path-specific suggestions
    if (filePath.includes('/components/ui/') && !content.includes('JSX.Element')) {
      suggestions.push('UI components should have explicit JSX.Element return type');
    }

    if (filePath.includes('/pages/') && content.includes('<div')) {
      suggestions.push('Pages should use UI components instead of raw HTML elements');
    }

    if (filePath.includes('/features/') && !content.includes('readonly')) {
      suggestions.push('Feature component props should use readonly interfaces');
    }

    return {
      valid: validation.valid,
      errors: validation.errors,
      suggestions: [...validation.warnings, ...suggestions]
    };
  }

  /**
   * Setup Cursor integration
   */
  public async setup(): Promise<void> {
    // Setting up Cursor integration...
    
    await Promise.all([
      this.generateCursorRoutes(),
      this.generateCursorMeta(),
      this.syncRules()
    ]);

    // Cursor integration setup complete!
    // Files created:
    // - .cursor.routes.json
    // - .cursor.meta
    // - .cursorrules (if needed)
  }
}

// Export singleton instance
export const cursorIntegration = new CursorIntegration();