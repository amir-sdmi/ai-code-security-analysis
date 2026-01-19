import { GoogleGenAI } from "@google/genai";
import { Config, AnalysisResult } from "./types.js";
import { MCPManager } from "./mcps/manager.js";
import { logger } from "./utils/logger.js";
import { ApplicationError, withRetry } from "./utils/error-handler.js";

export class PRAnalyzer {
  private ai: GoogleGenAI;
  private mcpManager: MCPManager;
  private config: Config;

  constructor(config: Config) {
    this.config = config;

    // Initialize Google AI with Vertex AI
    if (config.google.useVertexAI) {
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: config.google.cloudProject,
        location: config.google.cloudLocation,
      });
    } else {
      // Using Gemini Developer API (requires API key)
      if (!config.gemini.apiKey) {
        throw new ApplicationError(
          "Gemini API key is required when not using Vertex AI"
        );
      }
      this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }

    // Initialize MCP manager
    this.mcpManager = new MCPManager(config);
  }

  async analyzeAndNotify(): Promise<AnalysisResult> {
    try {
      logger.info("🚀 Starting PR analysis...");

      // Connect to all MCP servers
      await this.mcpManager.connectAll();
      logger.info("✅ Connected to all MCP servers");

      // Check connection status
      const status = this.mcpManager.getStatus();
      logger.info(
        `MCP Status: ${status.totalConnected}/${status.totalClients} clients connected`
      );

      // Use sequential thinking to plan the analysis
      const thinkingClient = this.mcpManager.getSequentialThinkingClient();
      const thinkingResult = await thinkingClient.analyzeComplexProblem(
        `Analyze pull requests from team repositories in ${this.config.github.organization}. The analysis will automatically discover team memberships for the authenticated user and focus on repositories associated with those teams (excluding the "global" team).`
      );

      logger.info("🧠 Analysis strategy completed", {
        thoughtCount: thinkingResult.length,
        finalThought:
          thinkingResult[thinkingResult.length - 1]?.content.substring(0, 200) +
          "...",
      });

      // Fetch actual PR data using GitHub MCP client
      logger.info("📊 Fetching real PR data from GitHub...");
      const githubClient = this.mcpManager.getGitHubClient();
      const prResult = await githubClient.getRealPRsForTeam(
        this.config.github.organization
        // No longer passing casUsers - will be discovered automatically
      );

      if (!prResult.success || !prResult.data) {
        throw new Error("Failed to fetch PR data from GitHub");
      }

      const pullRequests = prResult.data;
      logger.info(
        `Retrieved ${pullRequests.length} pull requests for analysis`
      );

      // Process and format PR data
      const formattedOutput = this.formatPRAnalysisForSlack(pullRequests);

      // Use Gemini for additional insights with enhanced error handling
      const insightsPrompt = this.createInsightsPrompt(pullRequests);
      logger.info("🤖 Generating AI insights with Gemini 2.0 Flash...");

      let aiInsights: string;
      try {
        // Validate API configuration before making the call
        if (!this.config.gemini.apiKey && !this.config.google.useVertexAI) {
          throw new Error("No Gemini API key or Vertex AI configuration found");
        }

        const response = await withRetry(
          async () => {
            logger.debug("Making Gemini API request...", {
              model: "gemini-2.0-flash-exp",
              useVertexAI: this.config.google.useVertexAI,
              hasApiKey: !!this.config.gemini.apiKey,
            });

            return await this.ai.models.generateContent({
              model: "gemini-2.0-flash-exp",
              contents: [{ parts: [{ text: insightsPrompt }] }],
            });
          },
          {
            maxAttempts: 3,
            baseDelay: 2000,
            backoffFactor: 2,
          }
        );

        aiInsights =
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          "AI insights generation completed";

        logger.info("✅ AI insights generated successfully");
      } catch (error) {
        const errorDetails = this.analyzeGeminiError(error);
        logger.error("❌ Failed to generate AI insights", {
          error: error instanceof Error ? error.message : String(error),
          errorType: errorDetails.type,
          useVertexAI: this.config.google.useVertexAI,
          hasApiKey: !!this.config.gemini.apiKey,
          diagnostics: errorDetails.diagnostics,
        });

        aiInsights = errorDetails.userMessage;
      }

      const finalMessage = `${formattedOutput}\n\n💡 **AI Insights:**\n${aiInsights}`;

      logger.info("📊 Analysis completed", {
        resultLength: finalMessage.length,
        prCount: pullRequests.length,
      });

      // Send to Slack
      const slackClient = this.mcpManager.getSlackClient();
      await slackClient.postMessage(this.config.slack.channelId, finalMessage);

      logger.info("📱 Message sent to Slack");

      return {
        success: true,
        message: "Analysis completed and sent to Slack successfully",
        repository: this.config.github.organization,
        period: `${new Date(Date.now() - this.config.analysis.maxPrAgeMonths * 30 * 24 * 60 * 60 * 1000).toISOString()} to ${new Date().toISOString()}`,
        analyzedAt: new Date().toISOString(),
        totalPRs: 0, // Would be populated from actual analysis
        averageReviewTime: 0,
        mergeRate: 0,
        topContributors: [],
        teamMetrics: {
          totalContributors: 0,
          activePeriod: `${this.config.analysis.maxPrAgeMonths} months`,
          totalPRs: 0,
          avgReviewTime: 0,
          mergeRate: 0,
          collaborationScore: 0,
          codeQualityScore: 0,
          velocityTrend: "stable" as const,
        },
        keyInsights: [],
        recommendations: [],
        pullRequests: [],
      };
    } catch (error) {
      logger.error("❌ Analysis failed:", error);

      // Try to send error notification to Slack
      try {
        const slackClient = this.mcpManager.getSlackClient();
        await slackClient.postMessage(
          this.config.slack.channelId,
          `❌ PR Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } catch (slackError) {
        logger.error("Failed to send error notification to Slack:", slackError);
      }

      throw new ApplicationError("Analysis failed", {
        cause: error as Error,
        retryable: true,
      });
    } finally {
      // Clean up connections
      await this.mcpManager.disconnectAll();
    }
  }

  // Method to test connections without running full analysis
  async testConnections(): Promise<void> {
    logger.info("🔍 Testing connections...");

    try {
      // Connect to all MCP servers
      await this.mcpManager.connectAll();

      // Run health checks
      const status = await this.mcpManager.runHealthChecks();

      logger.info("✅ Connection test results:", {
        connectedClients: status.totalConnected,
        totalClients: status.totalClients,
        allHealthy: status.allConnected,
        clientStatus: status.clients,
      });

      // Test Gemini connection
      logger.info("Testing Gemini connection...");
      const testResponse = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ parts: [{ text: "Hello, this is a connection test." }] }],
      });

      if (testResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
        logger.info("✅ Gemini AI connection successful");
      }

      logger.info("🎉 All connections successful!");
    } catch (error) {
      logger.error("❌ Connection test failed:", error);
      throw new ApplicationError("Connection test failed", {
        cause: error as Error,
      });
    } finally {
      await this.mcpManager.disconnectAll();
    }
  }

  /**
   * Format PR analysis results for Slack with comprehensive details (ENHANCED)
   */
  private formatPRAnalysisForSlack(pullRequests: any[]): string {
    if (!pullRequests || pullRequests.length === 0) {
      return ":warning: **No PRs found that match the criteria.**\n\nThis could indicate:\n• No open PRs from team members\n• All PRs are in repositories where team hasn't been active\n• Check team member configuration in GITHUB_CAS_USERS";
    }

    const currentDate = new Date();
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let message = `:mag: **PR Analysis Results for BV Engineering Team**\n`;
    message += `Generated: ${dateFormatter.format(currentDate)}\n`;

    // Sort PRs by priority: team members first, then by age (oldest first for urgent attention)
    const teamMembers = this.config.github.casUsers;
    const sortedPRs = pullRequests.sort((a, b) => {
      const aIsTeamMember = teamMembers.includes(a.user.login);
      const bIsTeamMember = teamMembers.includes(b.user.login);
      if (aIsTeamMember && !bIsTeamMember) return -1;
      if (!aIsTeamMember && bIsTeamMember) return 1;
      const ageA = Date.now() - new Date(a.created_at).getTime();
      const ageB = Date.now() - new Date(b.created_at).getTime();
      return ageB - ageA;
    });

    const displayLimit = Math.min(this.config.analysis.outputLimit, 25);
    const topPRs = sortedPRs.slice(0, displayLimit);
    const teamMemberPRs = topPRs.filter((pr) =>
      teamMembers.includes(pr.user.login)
    );
    const urgentPRs = topPRs.filter(
      (pr) =>
        (Date.now() - new Date(pr.created_at).getTime()) /
          (1000 * 60 * 60 * 24) >
        5
    );
    const criticalPRs = topPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes("fix") ||
        pr.title.toLowerCase().includes("critical") ||
        pr.title.toLowerCase().includes("hotfix") ||
        pr.title.toLowerCase().includes("security") ||
        pr.title.toLowerCase().includes("urgent")
    );

    if (topPRs.length > 0) {
      message += `\n:chart_with_upwards_trend: **Overview:** ${topPRs.length} PRs analyzed | ${teamMemberPRs.length} from team | ${urgentPRs.length} urgent | ${criticalPRs.length} critical\n\n`;
    }

    topPRs.forEach((pr) => {
      const ageInfo = this.calculatePRAgeInfo(pr.created_at);
      const impact = this.calculatePRImpact(pr);
      const isTeamMember = teamMembers.includes(pr.user.login);
      const prNumber = pr.number || "N/A";
      const reviewStatus = this.calculateReviewStatus(pr);
      const titleEmoji = isTeamMember ? ":memo:" : ":page_facing_up:";
      const priorityEmoji = this.getPriorityEmoji(pr);
      const prUrl = pr.html_url
        ? `<${pr.html_url}|#${pr.number}>`
        : `#${pr.number}`;
      const lastUpdated = pr.updated_at
        ? new Date(pr.updated_at).toLocaleString()
        : "N/A";
      const reviewers =
        pr.requested_reviewers && pr.requested_reviewers.length > 0
          ? pr.requested_reviewers.map((r: any) => r.login).join(", ")
          : "None";
      const allLabels =
        pr.labels && pr.labels.length > 0
          ? pr.labels.map((label: any) => `[36m${label.name}[0m`).join(", ")
          : "None";
      const branchInfo =
        pr.head && pr.base
          ? `[33m${pr.head.ref}[0m → [33m${pr.base.ref}[0m`
          : "";
      const jiraLink = this.extractJiraTicket(pr.body || pr.title);
      const description = this.extractDetailedPRSummary(pr.body || pr.title);
      const blocked =
        pr.labels &&
        pr.labels.some((l: any) => l.name.toLowerCase().includes("block"))
          ? ":no_entry: BLOCKED"
          : "";
      const mergeableStatus =
        pr.mergeable === false
          ? ":warning: Conflicts"
          : pr.mergeable === true
            ? ":white_check_mark: Mergeable"
            : "";
      const draftStatus = pr.draft ? ":construction: Draft" : "";
      const actionRequired =
        impact.score >= 4 || ageInfo.emoji === "🔥" || blocked
          ? ":point_right: **Action Required:** "
          : "";

      message += `${titleEmoji} **${pr.title}** - *${pr.user.login}*${isTeamMember ? " :star:" : ""} ${prUrl}\n`;
      message += `   :date: ${ageInfo.text} | Repository: ${pr.base.repo.name} | PR #${prNumber}\n`;
      if (branchInfo) message += `   :git: ${branchInfo}`;
      if (draftStatus) message += ` | ${draftStatus}`;
      if (mergeableStatus) message += ` | ${mergeableStatus}`;
      if (blocked) message += ` | ${blocked}`;
      message += `\n`;
      message += `   :dart: ${description}\n`;
      if (jiraLink) message += `   :ticket: ${jiraLink}\n`;
      message += `   :bar_chart: Impact: ${impact.level}${priorityEmoji} | Files: ${pr.changed_files || 0} | +${pr.additions || 0}/-${pr.deletions || 0} lines`;
      if (reviewStatus.info) message += ` | ${reviewStatus.info}`;
      if (allLabels && allLabels !== "None")
        message += ` | Labels: ${allLabels}`;
      message += `\n`;
      message += `   :busts_in_silhouette: Reviewers: ${reviewers} | Last updated: ${lastUpdated}`;
      if (actionRequired) {
        message += `\n   ${actionRequired}`;
        if (ageInfo.emoji === "🔥")
          message += `Long-standing PR needs immediate attention. `;
        if (impact.score >= 4)
          message += `High-impact changes require thorough review. `;
        if (blocked) message += `Blocked PR. `;
        if (pr.title.toLowerCase().includes("security"))
          message += `Security-related changes should be prioritized.`;
      }
      message += `\n\n`;
    });

    // Add comprehensive statistics section
    message += this.generateDetailedStats(topPRs, pullRequests.length);

    return message;
  }

  /**
   * Generate detailed statistics section
   */
  private generateDetailedStats(displayedPRs: any[], totalPRs: number): string {
    const teamMembers = this.config.github.casUsers;

    // Calculate various metrics
    const teamMemberPRs = displayedPRs.filter((pr) =>
      teamMembers.includes(pr.user.login)
    );
    const externalPRs = displayedPRs.filter(
      (pr) => !teamMembers.includes(pr.user.login)
    );

    const urgentPRs = displayedPRs.filter((pr) => {
      const daysDiff =
        (Date.now() - new Date(pr.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysDiff > 5;
    });

    const criticalPRs = displayedPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes("fix") ||
        pr.title.toLowerCase().includes("critical") ||
        pr.title.toLowerCase().includes("security")
    );

    const featurePRs = displayedPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes("feat") ||
        pr.title.toLowerCase().includes("feature")
    );

    const snykPRs = displayedPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes("snyk") ||
        pr.user.login.toLowerCase().includes("appsec")
    );

    const draftPRs = displayedPRs.filter((pr) => pr.draft);

    // Repository analysis
    const repositories = [
      ...new Set(displayedPRs.map((pr) => pr.base.repo.name)),
    ];
    const topRepositories = this.getTopRepositories(displayedPRs);

    // Author analysis
    const topAuthors = this.getTopAuthors(displayedPRs);

    let stats = `:chart_with_upwards_trend: **Detailed Analysis:**\n`;

    // Priority actions
    if (urgentPRs.length > 0) {
      stats += `:exclamation: **${urgentPRs.length} PR${urgentPRs.length > 1 ? "s" : ""} need urgent attention** (>5 days old)\n`;
    }
    if (criticalPRs.length > 0) {
      stats += `:rotating_light: **${criticalPRs.length} critical fix${criticalPRs.length > 1 ? "es" : ""}** require immediate review\n`;
    }
    if (featurePRs.length > 0) {
      stats += `:sparkles: **${featurePRs.length} feature PR${featurePRs.length > 1 ? "s are" : " is"}** ready for review\n`;
    }
    if (snykPRs.length > 0) {
      stats += `:shield: **${snykPRs.length} security update${snykPRs.length > 1 ? "s" : ""}** from automated scanning\n`;
    }

    // Team vs external PRs
    stats += `\n:busts_in_silhouette: **Team Breakdown:**\n`;
    stats += `:star: Team Member PRs: ${teamMemberPRs.length}/${displayedPRs.length}\n`;
    if (externalPRs.length > 0) {
      stats += `:handshake: External/Dependency PRs: ${externalPRs.length}\n`;
    }
    if (draftPRs.length > 0) {
      stats += `:construction: Draft PRs: ${draftPRs.length}\n`;
    }

    // Repository insights
    stats += `\n:file_folder: **Repository Activity:**\n`;
    stats += `:bar_chart: Active repositories: ${repositories.length}\n`;
    if (topRepositories.length > 0) {
      stats += `:trophy: Most active: ${topRepositories
        .slice(0, 3)
        .map((r: any) => `${r.name} (${r.count})`)
        .join(", ")}\n`;
    }

    // Author insights
    if (topAuthors.length > 0) {
      stats += `\n:technologist: **Top Contributors:**\n`;
      topAuthors.slice(0, 5).forEach((author: any, index: number) => {
        const emoji = author.isTeamMember ? ":star:" : ":handshake:";
        stats += `:${index + 1}${this.getNumberEmoji(index + 1)}: ${author.name} (${author.count} PRs) ${emoji}\n`;
      });
    }

    // Data completeness note
    if (totalPRs > displayedPRs.length) {
      stats += `\n:information_source: Showing top ${displayedPRs.length} of ${totalPRs} total PRs\n`;
    }

    // Add timestamp and next analysis info
    stats += `\n:clock1: Analysis completed at ${new Date().toLocaleTimeString()}\n`;
    stats += `:repeat: Next automated analysis: ${this.getNextAnalysisTime()}\n`;

    return stats;
  }

  /**
   * Calculate PR age information with appropriate formatting
   */
  private calculatePRAgeInfo(createdAt: string): {
    text: string;
    emoji: string;
  } {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays < 1) {
      return {
        text: `Open for ${diffHours} hours`,
        emoji: "",
      };
    } else if (diffDays === 1) {
      return {
        text: `Open for 1 day`,
        emoji: "",
      };
    } else if (diffDays <= 5) {
      return {
        text: `Open for ${diffDays} days 📅`,
        emoji: "📅",
      };
    } else if (diffDays <= 7) {
      return {
        text: `Open for ${diffDays} days ⚠️`,
        emoji: "⚠️",
      };
    } else {
      return {
        text: `Open for ${diffDays} days 🔥`,
        emoji: "🔥",
      };
    }
  }

  /**
   * Calculate PR impact level based on changes and content
   */
  private calculatePRImpact(pr: any): { level: string; score: number } {
    let score = 0;

    // Base score on number of files changed
    if (pr.changed_files) {
      if (pr.changed_files >= 15) score += 3;
      else if (pr.changed_files >= 8) score += 2;
      else if (pr.changed_files >= 3) score += 1;
    }

    // Factor in lines changed
    const totalLines = (pr.additions || 0) + (pr.deletions || 0);
    if (totalLines >= 1000) score += 3;
    else if (totalLines >= 500) score += 2;
    else if (totalLines >= 100) score += 1;

    // Factor in type of change
    const title = pr.title.toLowerCase();
    if (
      title.includes("fix") ||
      title.includes("critical") ||
      title.includes("hotfix")
    ) {
      score += 2; // Fixes are high impact
    }
    if (title.includes("feat") || title.includes("feature")) {
      score += 1; // Features are medium impact
    }
    if (title.includes("security") || title.includes("vulnerability")) {
      score += 3; // Security changes are critical
    }

    if (score >= 6) return { level: "Critical", score };
    if (score >= 4) return { level: "High", score };
    if (score >= 2) return { level: "Medium", score };
    return { level: "Low", score };
  }

  /**
   * Create prompt for AI insights based on actual PR data
   */
  private createInsightsPrompt(pullRequests: any[]): string {
    const prSummary = pullRequests.map((pr) => ({
      title: pr.title,
      author: pr.user.login,
      repository: pr.base.repo.name,
      daysOld: Math.floor(
        (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      filesChanged: pr.changed_files || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
    }));

    return `Analyze the following pull request data and provide ${this.config.analysis.maxResultsLimit} concise, actionable insights for the engineering team. Focus on priorities, patterns, and recommendations.

PR Data:
${JSON.stringify(prSummary, null, 2)}

Team Members: ${this.config.github.casUsers.join(", ")}
Organization: ${this.config.github.organization}

Provide insights in bullet points, each starting with "•" and focusing on:
1. PRs requiring urgent attention (>5 days old or critical fixes)
2. Development patterns or collaboration opportunities
3. Workflow or process recommendations
4. Who is the PR owner

Keep each insight to 1-3 lines maximum.`;
  }

  /**
   * Calculate review status information
   */
  private calculateReviewStatus(pr: any): { info: string } {
    let info = "";

    if (pr.draft) {
      info += ":construction: Draft";
    }

    if (pr.mergeable === false) {
      info += info ? " | " : "";
      info += ":warning: Conflicts";
    }

    return { info };
  }

  /**
   * Get priority emoji based on PR characteristics
   */
  private getPriorityEmoji(pr: any): string {
    const title = pr.title.toLowerCase();

    if (title.includes("critical") || title.includes("hotfix")) {
      return " :rotating_light:";
    }
    if (title.includes("security") || title.includes("vulnerability")) {
      return " :shield:";
    }
    if (title.includes("fix") || title.includes("bug")) {
      return " :bug:";
    }
    if (title.includes("feat") || title.includes("feature")) {
      return " :sparkles:";
    }
    if (title.includes("chore") || title.includes("refactor")) {
      return " :wrench:";
    }
    if (title.includes("docs") || title.includes("documentation")) {
      return " :memo:";
    }

    return "";
  }

  /**
   * Extract detailed PR summary with better formatting
   */
  private extractDetailedPRSummary(text: string): string {
    if (!text) return "No description available";

    // Clean up common markdown patterns
    let cleanText = text
      .replace(/#+\s*/g, "") // Remove markdown headers
      .replace(/\*\*/g, "") // Remove bold formatting
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/\[.*?\]\(.*?\)/g, (match) => {
        // Keep link text but remove URL
        const linkText = match.match(/\[(.*?)\]/);
        return linkText ? linkText[1] : match;
      })
      .replace(/```[\s\S]*?```/g, "[code block]") // Replace code blocks
      .replace(/`([^`]+)`/g, "$1") // Remove inline code formatting
      .replace(/\r\n/g, " ") // Replace line breaks
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Extract first meaningful sentence
    const sentences = cleanText.split(/[.!?]\s+/);
    let summary = sentences[0];

    // If first sentence is too short, try to include more context
    if (summary.length < 30 && sentences.length > 1) {
      summary = sentences.slice(0, 2).join(". ");
    }

    // Limit length for Slack
    if (summary.length > 150) {
      summary = summary.substring(0, 150) + "...";
    }

    return summary || "No description available";
  }

  /**
   * Extract Jira ticket information
   */
  private extractJiraTicket(text: string): string | null {
    if (!text) return null;

    // Look for Jira ticket patterns
    const jiraPatterns = [
      /\[([A-Z]+-\d+)\]/g, // [PD-123456]
      /([A-Z]+-\d+)/g, // PD-123456
      /jira.*?browse\/([A-Z]+-\d+)/gi, // JIRA links
    ];

    for (const pattern of jiraPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const ticket = matches[0].replace(/[\[\]]/g, "");
        return `[${ticket}](https://bazaarvoice.atlassian.net/browse/${ticket})`;
      }
    }

    return null;
  }

  /**
   * Get top repositories by PR count
   */
  private getTopRepositories(
    prs: any[]
  ): Array<{ name: string; count: number }> {
    const repoCount = new Map<string, number>();

    prs.forEach((pr) => {
      const repoName = pr.base.repo.name;
      repoCount.set(repoName, (repoCount.get(repoName) || 0) + 1);
    });

    return Array.from(repoCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get top authors by PR count
   */
  private getTopAuthors(
    prs: any[]
  ): Array<{ name: string; count: number; isTeamMember: boolean }> {
    const authorCount = new Map<string, number>();
    const teamMembers = this.config.github.casUsers;

    prs.forEach((pr) => {
      const author = pr.user.login;
      authorCount.set(author, (authorCount.get(author) || 0) + 1);
    });

    return Array.from(authorCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        isTeamMember: teamMembers.includes(name),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get number emoji for rankings
   */
  private getNumberEmoji(num: number): string {
    const emojis = ["", ":one:", ":two:", ":three:", ":four:", ":five:"];
    return emojis[num] || ":hash:";
  }

  /**
   * Get next analysis time (placeholder for scheduling info)
   */
  private getNextAnalysisTime(): string {
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 24); // Assume daily runs
    return nextRun.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Analyze Gemini API errors and provide detailed diagnostics
   */
  private analyzeGeminiError(error: unknown): {
    type: string;
    userMessage: string;
    diagnostics: Record<string, any>;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";

    // Network connectivity issues
    if (
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      return {
        type: "NetworkError",
        userMessage:
          "🔌 **Network Issue**: Unable to connect to Gemini API. This could be due to:\n" +
          "• Firewall or proxy blocking requests\n" +
          "• Network connectivity issues\n" +
          "• Gemini API service temporarily unavailable\n" +
          "• DNS resolution problems\n" +
          "\n*Basic PR data is available above.*",
        diagnostics: {
          suggestion: "Check network connectivity and firewall settings",
          retryRecommended: true,
          possibleCauses: ["firewall", "proxy", "dns", "service_outage"],
        },
      };
    }

    // Authentication issues
    if (
      errorMessage.includes("API key") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("403") ||
      errorMessage.includes("401")
    ) {
      return {
        type: "AuthenticationError",
        userMessage:
          "🔑 **Authentication Issue**: Problem with Gemini API credentials:\n" +
          `• Using Vertex AI: ${this.config.google.useVertexAI ? "Yes" : "No"}\n` +
          `• API Key configured: ${!!this.config.gemini.apiKey ? "Yes" : "No"}\n` +
          "• Please verify your API key or Google Cloud authentication\n" +
          "\n*Basic PR data is available above.*",
        diagnostics: {
          suggestion:
            "Verify API key in .env file or Google Cloud authentication",
          retryRecommended: false,
          useVertexAI: this.config.google.useVertexAI,
          hasApiKey: !!this.config.gemini.apiKey,
        },
      };
    }

    // Rate limiting / quota issues
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("rate")
    ) {
      return {
        type: "QuotaError",
        userMessage:
          "⏱️ **API Quota Exceeded**: Gemini API usage limits reached:\n" +
          "• Daily/monthly quota may be exhausted\n" +
          "• Check your Google Cloud billing and quota settings\n" +
          "• Try again later or upgrade your plan\n" +
          "\n*Basic PR data is available above.*",
        diagnostics: {
          suggestion: "Check quota limits in Google Cloud Console",
          retryRecommended: true,
          retryAfter: "1 hour",
        },
      };
    }

    // Timeout issues
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT")
    ) {
      return {
        type: "TimeoutError",
        userMessage:
          "⏰ **Request Timeout**: Gemini API request took too long:\n" +
          "• API response was slower than expected\n" +
          "• Large prompt or network latency issues\n" +
          "• Will retry automatically\n" +
          "\n*Basic PR data is available above.*",
        diagnostics: {
          suggestion: "Reduce prompt size or check network latency",
          retryRecommended: true,
          possibleCauses: ["large_prompt", "network_latency", "api_load"],
        },
      };
    }

    // Model or content issues
    if (
      errorMessage.includes("model") ||
      errorMessage.includes("content") ||
      errorMessage.includes("safety")
    ) {
      return {
        type: "ContentError",
        userMessage:
          "📝 **Content Issue**: Problem with the request content:\n" +
          "• Model may not be available\n" +
          "• Content might violate safety policies\n" +
          "• Request format may be invalid\n" +
          "\n*Basic PR data is available above.*",
        diagnostics: {
          suggestion: "Check prompt content and model availability",
          retryRecommended: false,
          model: "gemini-2.0-flash-exp",
        },
      };
    }

    // Generic error
    return {
      type: "GenericError",
      userMessage: `⚠️ **AI Analysis Unavailable**: ${errorMessage}\n\n*PR analysis data is still available above.*`,
      diagnostics: {
        suggestion: "Check logs for more details and try again",
        retryRecommended: true,
        errorName,
        rawMessage: errorMessage,
      },
    };
  }
}
