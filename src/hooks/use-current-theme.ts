import { useTheme } from 'next-themes';

export const useCurrentTheme = () => {
  const { theme, systemTheme } = useTheme();
  return theme === 'dark' || theme === 'light' ? theme : systemTheme;
};
