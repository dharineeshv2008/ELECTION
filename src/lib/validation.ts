export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  // Advanced fingerprinting based on browser characteristics
  const fingerprint = [
    navigator.userAgent,
    window.screen.width,
    window.screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language
  ].join('|');

  // Using btoa for a base64 encoded fingerprint as requested
  // This produces a consistent string for the same browser environment
  try {
    return btoa(unescape(encodeURIComponent(fingerprint)));
  } catch (e) {
    // Fallback if btoa fails
    return fingerprint.replace(/[^a-zA-Z0-9]/g, '');
  }
}

export function hasVotedLocally(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('vote_submitted') === 'true';
}

export function markAsVotedLocally(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vote_submitted', 'true');
}

export const DEADLINE = new Date('2026-04-17T00:00:00');

export function isDeadlinePassed(): boolean {
  return new Date() > DEADLINE;
}
