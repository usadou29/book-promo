import type { BrevoConfig } from './types';

const STORAGE_KEY = 'bp_brevo_config';

export function loadBrevoConfig(): BrevoConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BrevoConfig;
  } catch {
    return null;
  }
}

export function saveBrevoConfig(config: BrevoConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
