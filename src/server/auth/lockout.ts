const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
export const MANUAL_LOCK = new Date("9999-01-01T00:00:00.000Z");

export function lockoutAfterFailure(failures: number, now: Date) {
  const next = failures + 1;
  if (next >= 20) return { failures: next, lockedUntil: MANUAL_LOCK };
  if (next >= 10)
    return { failures: next, lockedUntil: new Date(now.getTime() + ONE_HOUR) };
  if (next >= 5)
    return {
      failures: next,
      lockedUntil: new Date(now.getTime() + FIFTEEN_MINUTES),
    };
  return { failures: next, lockedUntil: null as Date | null };
}

export function isLocked(lockedUntil: Date | null, now: Date) {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

export function isManualLock(lockedUntil: Date | null) {
  return lockedUntil !== null && lockedUntil.getTime() >= MANUAL_LOCK.getTime();
}
