export const REG_NO_REGEX = /^9276(25|24|23)B[A-Z]{2}\d{3}$/;

export function validateRegNo(regNo: string): boolean {
  return REG_NO_REGEX.test(regNo);
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let deviceId = localStorage.getItem('voting_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('voting_device_id', deviceId);
  }
  return deviceId;
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
