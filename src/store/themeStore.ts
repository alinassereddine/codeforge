/**
 * Theme Store
 * 
 * Manages application theme state with persistence to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'night-blue';

interface ThemeStore {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (theme) => {
                set({ theme });
                // Apply theme class to document
                document.documentElement.setAttribute('data-theme', theme);
            },
        }),
        {
            name: 'codeforge-theme',
            onRehydrateStorage: () => (state) => {
                // Apply theme on app load
                if (state?.theme) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                }
            },
        }
    )
);
