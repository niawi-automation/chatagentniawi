import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      themes={['light', 'dark', 'system']}
      storageKey="niawi-theme"
      disableTransitionOnChange={false}
      forcedTheme={undefined}
    >
      <ThemeContextWrapper>{children}</ThemeContextWrapper>
    </NextThemeProvider>
  );
};

const ThemeContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const contextValue: ThemeContextType = {
    theme: theme || 'dark',
    setTheme,
    toggleTheme
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
