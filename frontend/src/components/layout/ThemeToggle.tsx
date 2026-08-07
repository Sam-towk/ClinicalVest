import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getCurrentTheme, type Theme } from '@/lib/theme';
import { IconButton } from '../ui/IconButton';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <IconButton label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} onClick={toggle}>
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </IconButton>
  );
}
