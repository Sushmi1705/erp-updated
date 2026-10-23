import { useCallback, useSyncExternalStore } from 'react';

/* Two widths, because a phone and a tablet are not the same problem.
 *
 *   NARROW (≤ 640)   one thumb, one column. A ten-column table here is a row
 *                    of fragments, so lists become one card per record.
 *   TOUCH  (≤ 1024)  a finger, not a mouse. The menu is a drawer over the
 *                    page, dialogs are bottom sheets, and controls are sized
 *                    for a fingertip — but an iPad at 768 or 1024 has room
 *                    for a real table and should get one.
 *
 * Above 1024 the desktop layout stands: a permanent menu column beside the
 * work. 1024 rather than 820 because that is an iPad landscape, held in two
 * hands on the shop floor, and it wants the drawer as much as portrait does.
 *
 * useSyncExternalStore rather than useState + useEffect: matchMedia is the
 * external store it exists for, and it reads the true width on the first
 * render — a state-and-effect version renders one layout and then corrects
 * itself, which is a visible flash of the wrong screen.
 */
export const NARROW_BREAKPOINT = 640;
export const TOUCH_BREAKPOINT = 1024;

const NARROW_Q = `(max-width: ${NARROW_BREAKPOINT}px)`;
const TOUCH_Q = `(max-width: ${TOUCH_BREAKPOINT}px)`;

const subscribeTo = (query) => (onChange) => {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

const subscribeNarrow = subscribeTo(NARROW_Q);
const subscribeTouch = subscribeTo(TOUCH_Q);

/** Phone width: one card per record, one column of everything. */
export const useIsNarrow = () => {
  const getSnapshot = useCallback(() => window.matchMedia(NARROW_Q).matches, []);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribeNarrow, getSnapshot, getServerSnapshot);
};

/** Phone or tablet: drawer menu, bottom sheets, fingertip-sized controls. */
export const useIsMobile = () => {
  const getSnapshot = useCallback(() => window.matchMedia(TOUCH_Q).matches, []);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribeTouch, getSnapshot, getServerSnapshot);
};

// The older name, kept so nothing has to change to keep meaning "touch".
export const MOBILE_BREAKPOINT = TOUCH_BREAKPOINT;

export default useIsMobile;
