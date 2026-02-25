/**
 * Vibration and haptic feedback utilities.
 * navigator.vibrate() works on Android Chrome; limited/no support on iOS Safari.
 */

const PATTERN_NEW_MESSAGE = [100, 50, 100];
const PATTERN_LIGHT = [50];

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/** Vibrate on new incoming message (double pulse). */
export function vibrateNewMessage(): void {
  if (canVibrate()) {
    navigator.vibrate(PATTERN_NEW_MESSAGE);
  }
}

/** Light haptic pulse for UI feedback. */
export function vibrateLight(): void {
  if (canVibrate()) {
    navigator.vibrate(PATTERN_LIGHT);
  }
}
