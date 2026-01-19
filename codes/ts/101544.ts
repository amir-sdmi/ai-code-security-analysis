// Created by luxcium with Copilot
// src/core/auth/tokenManager.ts

import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';
import * as os from 'os';
import { Tokens, getTokens, setTokens } from './tokenVault';
import axios from 'axios';

// The token manager handles automatic persistence of Questrade tokens
// and ensures they are refreshed before expiry

const TOKEN_FILE_PATH = path.join('.keys', '.questrade-sdk-tokens.json');

/**
 * Load tokens from persistent storage
 * @returns Loaded tokens or null if not found
 */
export async function loadTokensFromFile(): Promise<Tokens | null> {
  try {
    await fs.mkdir(path.dirname(TOKEN_FILE_PATH), { recursive: true });
    const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
    const tokens = JSON.parse(data) as Tokens;

    // Validate the token structure
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at || !tokens.api_server) {
      return null;
    }

    return tokens;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Save tokens to persistent storage
 * @param tokens - Tokens to save
 */
export async function saveTokensToFile(tokens: Tokens): Promise<void> {
  await fs.mkdir(path.dirname(TOKEN_FILE_PATH), { recursive: true });
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
}

/**
 * Exchange a refresh token for access token and API server
 * @param refreshToken - The Questrade refresh token
 * @returns Tokens object with access_token, refresh_token, expires_at and api_server
 */
export async function exchangeRefreshToken(refreshToken: string): Promise<Tokens> {
  try {
    // Create form data for token exchange
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    // Make the token exchange request
    const response = await axios.post(
      'https://login.questrade.com/oauth2/token',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Convert API response to our Tokens format
    const tokens: Tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: Date.now() + (response.data.expires_in * 1000),
      api_server: response.data.api_server,
    };

    return tokens;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Failed to exchange refresh token: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to exchange refresh token: ${error.message}`);
  }
}

/**
 * Initialize the token manager, loading tokens from storage or env
 * This will set up tokens in the vault for use by the SDK
 */
export async function initializeTokens(): Promise<Tokens> {
  // Step 1: Try to load from file
  const storedTokens = await loadTokensFromFile();

  if (storedTokens) {
    // Check if token needs refresh (if expiring in < 5 minutes)
    if (storedTokens.expires_at - Date.now() < 5 * 60 * 1000) {
      try {
        const newTokens = await exchangeRefreshToken(storedTokens.refresh_token);
        setTokens(newTokens);
        await saveTokensToFile(newTokens);
        return newTokens;
      } catch (error) {
        // If refresh fails, fall back to env or fail
        console.warn('Failed to refresh stored token, falling back to environment');
      }
    } else {
      // Token still valid, use it
      setTokens(storedTokens);
      return storedTokens;
    }
  }

  // Step 2: Try to load from environment
  config(); // Ensure environment is loaded
  const refreshToken = process.env.QUESTRADE_ACCESS_TOKEN;

  if (!refreshToken) {
    throw new Error('No valid token found in storage or environment. Set QUESTRADE_ACCESS_TOKEN.');
  }

  // Exchange the refresh token
  const newTokens = await exchangeRefreshToken(refreshToken);
  setTokens(newTokens);
  await saveTokensToFile(newTokens);
  return newTokens;
}

/**
 * Ensure the token is valid and refreshed if needed
 * This should be called before any API request
 */
export async function ensureValidToken(): Promise<Tokens> {
  try {
    const tokens = getTokens();

    // If token is expiring soon (within 60 seconds), refresh it
    if (tokens.expires_at - Date.now() < 60 * 1000) {
      const newTokens = await exchangeRefreshToken(tokens.refresh_token);
      setTokens(newTokens);
      await saveTokensToFile(newTokens);
      return newTokens;
    }

    return tokens;
  } catch (error) {
    // If getting tokens fails, try to initialize
    return initializeTokens();
  }
}

// Created by luxcium © 2025 (MIT) with Copilot
