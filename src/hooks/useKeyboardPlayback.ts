import { useEffect } from 'react';
import type { PlaybackController } from '@/engine/playback-controller';

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

/** Space = play/pause, arrows = step, Home/End = jump, R = reset. */
export function useKeyboardPlayback(
  controller: PlaybackController,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          controller.toggle();
          break;
        case 'ArrowRight':
          event.preventDefault();
          controller.next();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          controller.previous();
          break;
        case 'Home':
          event.preventDefault();
          controller.first();
          break;
        case 'End':
          event.preventDefault();
          controller.last();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          controller.reset();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, enabled]);
}
