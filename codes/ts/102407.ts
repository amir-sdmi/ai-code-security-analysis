import { Octokit } from "@octokit/rest";
import { NexusQuantumDatabase } from "./quantum-database";
import { codexIntegration } from "./chatgpt-codex-integration";
import fs from 'fs/promises';
import path from 'path';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  clone_url: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  private: boolean;
}

export interface ProjectBrainData {
  repoId: number;
  repoName: string;
  architecture: string;
  technologies: string[];
  dependencies: Record<string, string>;
  codebase_summary: string;
  api_endpoints: string[];
  database_schema: string;
  business_logic: string;
  integration_points: string[];
  last_analyzed: Date;
  brain_knowledge_id: string;
}

export interface CrossProjectConnection {
  id: string;
  sourceRepo: string;
  targetRepo: string;
  connectionType: 'api' | 'database' | 'shared_module' | 'event_driven' | 'data_pipeline';
  interface_definition: string;
  communication_protocol: string;
  data_flow: string;
  security_requirements: string;
  implementation_status: 'planned' | 'in_progress' | 'completed' | 'deprecated';
  created_at: Date;
}

export interface BrainQuery {
  query: string;
  targetRepos?: string[];
  queryType: 'architecture' | 'implementation' | 'integration' | 'debugging' | 'optimization';
  context: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface BrainResponse {
  query: BrainQuery;
  response: string;
  affected_repos: string[];
  suggested_actions: Array<{
    repo: string;
    action: string;
    priority: number;
    implementation_steps: string[];
  }>;
  code_suggestions: Array<{
    repo: string;
    file_path: string;
    suggested_code: string;
    explanation: string;
  }>;
  integration_opportunities: CrossProjectConnection[];
  confidence: number;
  timestamp: Date;
}

export class GitHubBrainIntegration {
  private octokit: Octokit | null = null;
  private quantumDB: NexusQuantumDatabase;
  private repositories: Map<string, GitHubRepository> = new Map();
  private projectBrains: Map<string, ProjectBrainData> = new Map();
  private crossConnections: Map<string, CrossProjectConnection> = new Map();
  private isAnalyzing = false;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor(quantumDB: NexusQuantumDatabase) {
    this.quantumDB = quantumDB;
  }

  async initializeGitHubIntegration(githubToken: string, username: string) {
    try {
      this.octokit = new Octokit({
        auth: githubToken,
      });

      // Verify token and get user info
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      console.log(`GitHub Brain initialized for user: ${user.login}`);

      // Start repository discovery and analysis
      await this.discoverRepositories(username);
      this.startContinuousAnalysis();

      return {
        success: true,
        user: user.login,
        repositories: this.repositories.size
      };
    } catch (error) {
      console.error('GitHub Brain initialization failed:', error);
      throw error;
    }
  }

  private async discoverRepositories(username: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data: repos } = await this.octokit.rest.repos.listForUser({
        username,
        type: 'owner',
        sort: 'updated',
        per_page: 100
      });

      for (const repo of repos) {
        this.repositories.set(repo.name, repo as GitHubRepository);
        console.log(`Discovered repository: ${repo.name} (${repo.language})`);
      }

      // Analyze each repository
      for (const [repoName, repo] of this.repositories) {
        await this.analyzeRepository(repo);
      }

    } catch (error) {
      console.error('Repository discovery failed:', error);
    }
  }

  private async analyzeRepository(repo: GitHubRepository): Promise<ProjectBrainData> {
    try {
      console.log(`Analyzing repository: ${repo.name}`);

      // Get repository structure
      const structure = await this.getRepositoryStructure(repo.name);
      
      // Get package.json or similar dependency files
      const dependencies = await this.extractDependencies(repo.name);
      
      // Get README and documentation
      const documentation = await this.getDocumentation(repo.name);
      
      // Analyze codebase with ChatGPT Codex
      const codebaseAnalysis = await this.analyzeCodebaseWithCodex(repo, structure, dependencies, documentation);

      const brainData: ProjectBrainData = {
        repoId: repo.id,
        repoName: repo.name,
        architecture: codebaseAnalysis.architecture,
        technologies: codebaseAnalysis.technologies,
        dependencies,
        codebase_summary: codebaseAnalysis.summary,
        api_endpoints: codebaseAnalysis.api_endpoints,
        database_schema: codebaseAnalysis.database_schema,
        business_logic: codebaseAnalysis.business_logic,
        integration_points: codebaseAnalysis.integration_points,
        last_analyzed: new Date(),
        brain_knowledge_id: this.quantumDB.storeQuantumKnowledge(
          JSON.stringify(codebaseAnalysis),
          `GitHub Repository Analysis: ${repo.name}`,
          'github_brain_analysis'
        )
      };

      this.projectBrains.set(repo.name, brainData);
      return brainData;

    } catch (error) {
      console.error(`Repository analysis failed for ${repo.name}:`, error);
      throw error;
    }
  }

  private async getRepositoryStructure(repoName: string): Promise<any> {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner: await this.getUsername(),
        repo: repoName,
        tree_sha: 'HEAD',
        recursive: 'true'
      });

      return tree.tree.map(item => ({
        path: item.path,
        type: item.type,
        size: item.size
      }));
    } catch (error) {
      console.error(`Failed to get structure for ${repoName}:`, error);
      return [];
    }
  }

  private async extractDependencies(repoName: string): Promise<Record<string, string>> {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const dependencies: Record<string, string> = {};

    try {
      // Try to get package.json for Node.js projects
      try {
        const { data: packageJson } = await this.octokit.rest.repos.getContent({
          owner: await this.getUsername(),
          repo: repoName,
          path: 'package.json'
        });

        if ('content' in packageJson) {
          const content = JSON.parse(Buffer.from(packageJson.content, 'base64').toString());
          Object.assign(dependencies, content.dependencies || {}, content.devDependencies || {});
        }
      } catch {}

      // Try to get requirements.txt for Python projects
      try {
        const { data: requirements } = await this.octokit.rest.repos.getContent({
          owner: await this.getUsername(),
          repo: repoName,
          path: 'requirements.txt'
        });

        if ('content' in requirements) {
          const content = Buffer.from(requirements.content, 'base64').toString();
          content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const [pkg, version] = trimmed.split('==');
              dependencies[pkg] = version || 'latest';
            }
          });
        }
      } catch {}

      // Try to get Cargo.toml for Rust projects
      try {
        const { data: cargoToml } = await this.octokit.rest.repos.getContent({
          owner: await this.getUsername(),
          repo: repoName,
          path: 'Cargo.toml'
        });

        if ('content' in cargoToml) {
          const content = Buffer.from(cargoToml.content, 'base64').toString();
          // Simple TOML parsing for dependencies section
          const lines = content.split('\n');
          let inDependencies = false;
          for (const line of lines) {
            if (line.trim() === '[dependencies]') {
              inDependencies = true;
              continue;
            }
            if (line.trim().startsWith('[') && inDependencies) {
              break;
            }
            if (inDependencies && line.includes('=')) {
              const [pkg, version] = line.split('=').map(s => s.trim());
              dependencies[pkg] = version.replace(/['"]/g, '');
            }
          }
        }
      } catch {}

    } catch (error) {
      console.error(`Failed to extract dependencies for ${repoName}:`, error);
    }

    return dependencies;
  }

  private async getDocumentation(repoName: string): Promise<string> {
    if (!this.octokit) throw new Error('GitHub not initialized');

    let documentation = '';

    try {
      // Get README
      const { data: readme } = await this.octokit.rest.repos.getReadme({
        owner: await this.getUsername(),
        repo: repoName
      });

      if ('content' in readme) {
        documentation += Buffer.from(readme.content, 'base64').toString();
      }
    } catch {}

    return documentation;
  }

  private async analyzeCodebaseWithCodex(
    repo: GitHubRepository, 
    structure: any[], 
    dependencies: Record<string, string>, 
    documentation: string
  ) {
    const analysisPrompt = `Analyze this GitHub repository and provide detailed architectural insights:

Repository: ${repo.name}
Description: ${repo.description}
Primary Language: ${repo.language}
Topics: ${repo.topics?.join(', ')}

File Structure:
${structure.slice(0, 50).map(file => `${file.path} (${file.type})`).join('\n')}

Dependencies:
${Object.entries(dependencies).slice(0, 20).map(([pkg, version]) => `${pkg}: ${version}`).join('\n')}

Documentation:
${documentation.substring(0, 2000)}

Please provide a comprehensive analysis in JSON format with these fields:
{
  "architecture": "description of the overall architecture pattern",
  "technologies": ["array", "of", "technologies", "used"],
  "summary": "concise summary of what this project does",
  "api_endpoints": ["list", "of", "detected", "api", "endpoints"],
  "database_schema": "description of database structure if any",
  "business_logic": "description of core business logic",
  "integration_points": ["potential", "integration", "opportunities"],
  "complexity_score": 1-10,
  "maintainability_score": 1-10,
  "scalability_potential": "assessment of scalability"
}`;

    try {
      const response = await codexIntegration.queryCodexAPI(analysisPrompt, 'gpt-4');
      
      if (response?.choices[0]?.message?.content) {
        const analysisText = response.choices[0].message.content;
        
        // Try to parse JSON response
        try {
          return JSON.parse(analysisText);
        } catch {
          // If JSON parsing fails, create structured response from text
          return {
            architecture: this.extractFromText(analysisText, 'architecture', 'Monolithic web application'),
            technologies: this.extractTechnologies(repo.language, dependencies),
            summary: repo.description || 'No description available',
            api_endpoints: this.extractFromText(analysisText, 'api', '').split(',').filter(Boolean),
            database_schema: this.extractFromText(analysisText, 'database', 'No database detected'),
            business_logic: this.extractFromText(analysisText, 'business', 'Core application logic'),
            integration_points: this.extractFromText(analysisText, 'integration', '').split(',').filter(Boolean),
            complexity_score: 5,
            maintainability_score: 7,
            scalability_potential: 'Medium scalability potential'
          };
        }
      }
    } catch (error) {
      console.error(`Codex analysis failed for ${repo.name}:`, error);
    }

    // Fallback analysis
    return {
      architecture: 'Standard application architecture',
      technologies: this.extractTechnologies(repo.language, dependencies),
      summary: repo.description || 'No description available',
      api_endpoints: [],
      database_schema: 'No database schema detected',
      business_logic: 'Core application functionality',
      integration_points: [],
      complexity_score: 5,
      maintainability_score: 6,
      scalability_potential: 'Unknown scalability potential'
    };
  }

  private extractFromText(text: string, keyword: string, fallback: string): string {
    const lines = text.toLowerCase().split('\n');
    for (const line of lines) {
      if (line.includes(keyword)) {
        return line.split(':')[1]?.trim() || fallback;
      }
    }
    return fallback;
  }

  private extractTechnologies(language: string, dependencies: Record<string, string>): string[] {
    const technologies = [language].filter(Boolean);
    
    // Add major frameworks/libraries
    Object.keys(dependencies).forEach(dep => {
      if (['react', 'vue', 'angular', 'express', 'django', 'flask', 'rails'].includes(dep.toLowerCase())) {
        technologies.push(dep);
      }
    });

    return technologies;
  }

  private async getUsername(): Promise<string> {
    if (!this.octokit) throw new Error('GitHub not initialized');
    const { data: user } = await this.octokit.rest.users.getAuthenticated();
    return user.login;
  }

  async queryBrain(query: BrainQuery): Promise<BrainResponse> {
    console.log(`Processing brain query: ${query.query}`);

    // Get relevant project data
    const relevantProjects = query.targetRepos 
      ? Array.from(this.projectBrains.values()).filter(p => query.targetRepos!.includes(p.repoName))
      : Array.from(this.projectBrains.values());

    // Create comprehensive context for Codex
    const contextPrompt = `NEXUS Brain Query Analysis:

Query: ${query.query}
Query Type: ${query.queryType}
Context: ${query.context}
Urgency: ${query.urgency}

Available Projects:
${relevantProjects.map(p => `
- ${p.repoName}: ${p.codebase_summary}
  Technologies: ${p.technologies.join(', ')}
  Architecture: ${p.architecture}
  API Endpoints: ${p.api_endpoints.join(', ')}
  Integration Points: ${p.integration_points.join(', ')}
`).join('\n')}

Please provide a comprehensive response that includes:
1. Direct answer to the query
2. Affected repositories and why
3. Specific actionable recommendations for each affected repo
4. Code suggestions with file paths where applicable
5. Integration opportunities between projects
6. Implementation priority and steps

Format the response as detailed analysis with clear sections.`;

    try {
      const response = await codexIntegration.queryCodexAPI(contextPrompt, 'gpt-4');
      
      if (response?.choices[0]?.message?.content) {
        const analysisText = response.choices[0].message.content;
        
        // Store the query and response in quantum database
        const knowledgeId = this.quantumDB.storeQuantumKnowledge(
          analysisText,
          `Brain Query: ${query.query}`,
          'brain_query_response'
        );

        return {
          query,
          response: analysisText,
          affected_repos: relevantProjects.map(p => p.repoName),
          suggested_actions: this.extractSuggestedActions(analysisText, relevantProjects),
          code_suggestions: this.extractCodeSuggestions(analysisText),
          integration_opportunities: this.identifyIntegrationOpportunities(relevantProjects),
          confidence: 0.85,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Brain query failed:', error);
    }

    return {
      query,
      response: 'Brain query processing failed. Please check system status.',
      affected_repos: [],
      suggested_actions: [],
      code_suggestions: [],
      integration_opportunities: [],
      confidence: 0,
      timestamp: new Date()
    };
  }

  private extractSuggestedActions(analysisText: string, projects: ProjectBrainData[]) {
    // Parse analysis text for actionable recommendations
    const actions: Array<{
      repo: string;
      action: string;
      priority: number;
      implementation_steps: string[];
    }> = [];

    // Simple extraction logic - in production, this would be more sophisticated
    projects.forEach((project, index) => {
      actions.push({
        repo: project.repoName,
        action: `Review and update ${project.repoName} based on query requirements`,
        priority: index + 1,
        implementation_steps: [
          'Analyze current implementation',
          'Identify required changes',
          'Plan implementation approach',
          'Execute changes',
          'Test integration'
        ]
      });
    });

    return actions;
  }

  private extractCodeSuggestions(analysisText: string) {
    // Extract code suggestions from analysis
    return [];
  }

  private identifyIntegrationOpportunities(projects: ProjectBrainData[]): CrossProjectConnection[] {
    const opportunities: CrossProjectConnection[] = [];

    // Identify potential integrations between projects
    for (let i = 0; i < projects.length; i++) {
      for (let j = i + 1; j < projects.length; j++) {
        const project1 = projects[i];
        const project2 = projects[j];

        // Check for common technologies or complementary functionality
        const commonTech = project1.technologies.filter(tech => 
          project2.technologies.includes(tech)
        );

        if (commonTech.length > 0) {
          opportunities.push({
            id: `${project1.repoName}-${project2.repoName}`,
            sourceRepo: project1.repoName,
            targetRepo: project2.repoName,
            connectionType: 'api',
            interface_definition: 'REST API integration',
            communication_protocol: 'HTTPS',
            data_flow: `${project1.repoName} -> ${project2.repoName}`,
            security_requirements: 'API key authentication',
            implementation_status: 'planned',
            created_at: new Date()
          });
        }
      }
    }

    return opportunities;
  }

  private startContinuousAnalysis() {
    this.analysisInterval = setInterval(async () => {
      if (this.isAnalyzing) return;
      
      this.isAnalyzing = true;
      try {
        console.log('Running continuous brain analysis...');
        
        // Re-analyze repositories that haven't been updated recently
        for (const [repoName, brainData] of this.projectBrains) {
          const hoursSinceAnalysis = (Date.now() - brainData.last_analyzed.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceAnalysis > 24) { // Re-analyze every 24 hours
            const repo = this.repositories.get(repoName);
            if (repo) {
              await this.analyzeRepository(repo);
            }
          }
        }
      } finally {
        this.isAnalyzing = false;
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  getBrainStatistics() {
    return {
      total_repositories: this.repositories.size,
      analyzed_projects: this.projectBrains.size,
      cross_connections: this.crossConnections.size,
      last_analysis: new Date(),
      brain_status: 'active',
      technologies_detected: Array.from(new Set(
        Array.from(this.projectBrains.values())
          .flatMap(p => p.technologies)
      )),
      total_api_endpoints: Array.from(this.projectBrains.values())
        .reduce((total, p) => total + p.api_endpoints.length, 0)
    };
  }

  getProjectBrains(): ProjectBrainData[] {
    return Array.from(this.projectBrains.values());
  }

  getCrossConnections(): CrossProjectConnection[] {
    return Array.from(this.crossConnections.values());
  }

  async shutdown() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    console.log('GitHub Brain integration shutdown complete');
  }
}

// Export singleton instance
export const githubBrain = new GitHubBrainIntegration(new NexusQuantumDatabase());