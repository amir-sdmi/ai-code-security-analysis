import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcuts {
  [key: string]: KeyboardShortcut;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    // Register shortcuts with Cursor
    const registerShortcuts = () => {
      // @ts-ignore - Cursor's global API
      if (window.cursor?.registerKeyboardShortcuts) {
        // @ts-ignore - Cursor's global API
        window.cursor.registerKeyboardShortcuts(
          Object.entries(shortcuts).map(([id, shortcut]) => ({
            id,
            key: shortcut.key,
            description: shortcut.description,
            category: 'Calendar',
            action: () => {
              // Explicitly return undefined for synchronous actions
              shortcut.action();
              return undefined;
            },
          }))
        );
      }
    };

    // Handle keyboard events
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when modal is open
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Check for modifier keys (Ctrl/Cmd + key)
      const isModifierPressed = e.ctrlKey || e.metaKey;
      if (isModifierPressed) return;

      const key = e.key.toLowerCase();
      const shortcut = Object.values(shortcuts).find(s => s.key.toLowerCase() === key);

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    // Register shortcuts with Cursor
    registerShortcuts();

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      // @ts-ignore - Cursor's global API
      if (window.cursor?.unregisterKeyboardShortcuts) {
        // @ts-ignore - Cursor's global API
        window.cursor.unregisterKeyboardShortcuts(Object.keys(shortcuts));
      }
    };
  }, [shortcuts]);
} 