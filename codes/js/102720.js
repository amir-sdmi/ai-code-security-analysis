/**
 * Cursor Integration for VibeHistory MCP
 * 
 * This file integrates the vibehistory MCP with Cursor.
 * Place this file in your Cursor configuration directory.
 */

const { registerCommandHistoryMCP } = require('vibehistory');

/**
 * Register the Command History MCP with Cursor
 * 
 * @param {Object} registry - Cursor's MCP registry
 */
function register(registry) {
  // Custom configuration
  const config = {
    saveResponses: true,
    storage: {
      useHomeDir: true,
      retentionDays: 30
    },
    modifications: [
      {
        name: 'mask_credentials',
        type: 'mask',
        pattern: 'password\\s*[:=]\\s*\\S+',
        replacement: 'password: [REDACTED]',
        enabled: true
      },
      {
        name: 'mask_api_keys',
        type: 'mask',
        pattern: 'api[-_]?key\\s*[:=]\\s*\\S+',
        replacement: 'api_key: [REDACTED]',
        enabled: true
      },
      {
        name: 'mask_tokens',
        type: 'mask',
        pattern: '(token|auth[-_]?token)\\s*[:=]\\s*\\S+',
        replacement: 'token: [REDACTED]',
        enabled: true
      }
    ]
  };

  // Register the MCP with Cursor
  registerCommandHistoryMCP(registry, config);
  
  console.log('VibeHistory MCP registered successfully!');
}

module.exports = { register }; 