import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:os');
vi.mock('node:path');

// Import after mocks are declared
import { getVSCodeStoragePath } from '@/storage-path-helper.js';

describe('Storage Path Helper', () => {
  beforeEach(() => {
    // Don't use clearAllMocks as it removes implementations
    // Reset environment variables
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.APPDATA;

    // Setup the mock implementation for each test
    vi.mocked(path.join).mockImplementation((...args) => {
      const separator = process.platform === 'win32' ? '\\' : '/';
      return args.filter((arg) => arg && arg !== 'undefined').join(separator);
    });
  });

  describe('getVSCodeStoragePath', () => {
    it('should return Cursor storage path on macOS when using Cursor', () => {
      // Set up all mocks before calling the function
      vi.mocked(os.homedir).mockReturnValue('/Users/test');

      // Mock vscode env
      const vscode = (
        global as typeof global & { vscode: typeof import('vscode') }
      ).vscode;
      vscode.env = {
        appName: 'Cursor'
      } as unknown as typeof import('vscode').env;

      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      });

      const storagePath = getVSCodeStoragePath();

      expect(storagePath).toBe(
        '/Users/test/Library/Application Support/Cursor'
      );
    });

    it('should return Code storage path on macOS when using VSCode', () => {
      const vscode = (
        global as typeof global & { vscode: typeof import('vscode') }
      ).vscode;
      vscode.env = {
        appName: 'Visual Studio Code'
      } as unknown as typeof import('vscode').env;

      vi.mocked(os.homedir).mockReturnValue('/Users/test');
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      });

      const storagePath = getVSCodeStoragePath();

      expect(storagePath).toBe('/Users/test/Library/Application Support/Code');
    });

    it('should return correct path on Windows', () => {
      const vscode = (
        global as typeof global & { vscode: typeof import('vscode') }
      ).vscode;
      vscode.env = {
        appName: 'Cursor'
      } as unknown as typeof import('vscode').env;

      process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const storagePath = getVSCodeStoragePath();

      expect(storagePath).toBe('C:\\Users\\test\\AppData\\Roaming\\Cursor');
    });

    it('should use XDG_CONFIG_HOME on Linux when set', () => {
      const vscode = (
        global as typeof global & { vscode: typeof import('vscode') }
      ).vscode;
      vscode.env = {
        appName: 'Cursor'
      } as unknown as typeof import('vscode').env;

      process.env.XDG_CONFIG_HOME = '/custom/config';
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const storagePath = getVSCodeStoragePath();

      expect(storagePath).toBe('/custom/config/Cursor');
    });

    it('should use default .config directory on Linux when XDG_CONFIG_HOME not set', () => {
      const vscode = (
        global as typeof global & { vscode: typeof import('vscode') }
      ).vscode;
      vscode.env = {
        appName: 'Cursor'
      } as unknown as typeof import('vscode').env;

      vi.mocked(os.homedir).mockReturnValue('/home/user');
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const storagePath = getVSCodeStoragePath();

      expect(storagePath).toBe('/home/user/.config/Cursor');
    });
  });
});
