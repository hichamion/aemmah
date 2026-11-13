import { useEffect, useState } from 'react';

/**
 * Display settings of this browser (stored only on the device, localStorage — strictly necessary storage
 * of the visitor's own choice). Applied as classes on <html>; an inline script in index.html applies
 * the theme before the first paint, so there is no light flash in dark mode.
 */
export type ThemeChoice = 'light' | 'dark' | 'auto';
export interface Settings {
  theme: ThemeChoice;
  /** Root text size: 1 = normal. */
  fontScale: 1 | 1.1 | 1.2;
  reduceMotion: boolean;
  showIntro: boolean;
}

const KEY = 'aemmah-settings';
export const DEFAULT_SETTINGS: Settings = { theme: 'light', fontScale: 1, reduceMotion: false, showIntro: true };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // storage blocked or corrupt: defaults
  }
  return DEFAULT_SETTINGS;
}

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
export const isDark = (s: Settings) => s.theme === 'dark' || (s.theme === 'auto' && systemDark());

export function applySettings(s: Settings) {
  const root = document.documentElement;
  const dark = isDark(s);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.classList.toggle('reduce-motion', s.reduceMotion);
  root.style.fontSize = s.fontScale === 1 ? '' : `${s.fontScale * 100}%`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c1d22' : '#0c1d22');
}

let current = loadSettings();
const listeners = new Set<(s: Settings) => void>();

export function getSettings() {
  return current;
}

export function saveSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
  applySettings(current);
  listeners.forEach((l) => l(current));
}

export function resetSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  current = DEFAULT_SETTINGS;
  applySettings(current);
  listeners.forEach((l) => l(current));
}

/** Call once at start-up: applies the settings and follows the system theme in "auto" mode. */
export function initSettings() {
  applySettings(current);
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => applySettings(current));
}

export function useSettings(): Settings {
  const [s, setS] = useState(current);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

/** True when animations should stay still (system preference or the setting). */
export const prefersStill = () =>
  current.reduceMotion || (typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
