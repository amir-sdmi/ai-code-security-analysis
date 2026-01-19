/* tslint:disable */
/* eslint-disable */

/**
 * Summary of Copilot usage.
 */
export interface CopilotUsageMetrics {

  /**
   * Breakdown of Copilot code completions usage by language and editor
   */
  breakdown: (Array<{

/**
 * The language in which Copilot suggestions were shown to users in the specified editor.
 */
'language'?: string;

/**
 * The editor in which Copilot suggestions were shown to users for the specified language.
 */
'editor'?: string;

/**
 * The number of Copilot suggestions shown to users in the editor specified during the day specified.
 */
'suggestions_count'?: number;

/**
 * The number of Copilot suggestions accepted by users in the editor specified during the day specified.
 */
'acceptances_count'?: number;

/**
 * The number of lines of code suggested by Copilot in the editor specified during the day specified.
 */
'lines_suggested'?: number;

/**
 * The number of lines of code accepted by users in the editor specified during the day specified.
 */
'lines_accepted'?: number;

/**
 * The number of users who were shown Copilot completion suggestions in the editor specified during the day specified.
 */
'active_users'?: number;
[key: string]: any;
}>) | null;

  /**
   * The date for which the usage metrics are reported, in `YYYY-MM-DD` format.
   */
  day: string;

  /**
   * The total number of Copilot code completion suggestions accepted by users.
   */
  total_acceptances_count?: number;

  /**
   * The total number of users who interacted with Copilot Chat in the IDE during the day specified.
   */
  total_active_chat_users?: number;

  /**
   * The total number of users who were shown Copilot code completion suggestions during the day specified.
   */
  total_active_users?: number;

  /**
   * The total instances of users who accepted code suggested by Copilot Chat in the IDE (panel and inline).
   */
  total_chat_acceptances?: number;

  /**
   * The total number of chat turns (prompt and response pairs) sent between users and Copilot Chat in the IDE.
   */
  total_chat_turns?: number;

  /**
   * The total number of lines of code completions accepted by users.
   */
  total_lines_accepted?: number;

  /**
   * The total number of lines of code completions suggested by Copilot.
   */
  total_lines_suggested?: number;

  /**
   * The total number of Copilot code completion suggestions shown to users.
   */
  total_suggestions_count?: number;
}
