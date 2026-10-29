import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  PlaybackController,
  type PlaybackSnapshot,
} from '@/engine/playback-controller';

export interface UsePlaybackResult {
  controller: PlaybackController;
  playback: PlaybackSnapshot;
}

/**
 * Binds a `PlaybackController` to the component lifecycle: one controller per
 * mount, re-loaded whenever the trace length changes, disposed on unmount so
 * no timer outlives the component.
 */
export function usePlayback(
  total: number,
  options: {
    autoPlay?: boolean;
    initialSpeed?: number;
    /** Changing this reloads the trace even when its length is unchanged. */
    traceKey?: string | number;
  } = {},
): UsePlaybackResult {
  const { autoPlay = false, initialSpeed = 2, traceKey } = options;

  const controller = useMemo(
    () => new PlaybackController({ total, speed: initialSpeed }),
    // The controller is intentionally created once; `total` is applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => controller.dispose(), [controller]);

  useEffect(() => {
    controller.load(total, { keepPlaying: autoPlay });
  }, [controller, total, autoPlay, traceKey]);

  const playback = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return { controller, playback };
}
