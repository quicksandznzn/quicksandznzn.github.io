import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Moon, Sun } from '@phosphor-icons/react';
import { s } from '../styles/ui';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'), []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };
  const label = theme === 'dark' ? '亮色' : '暗色';
  return <button type="button" onClick={toggle} {...stylex.props(s.themeButton)} aria-label={`切换到${label}模式`} title={`切换到${label}模式`}>{theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}</button>;
}
