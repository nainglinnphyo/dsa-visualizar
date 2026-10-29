import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaybackController, SPEED_MAX, SPEED_MIN } from '../playback-controller';

describe('PlaybackController', () => {
  let controller: PlaybackController;

  beforeEach(() => {
    vi.useFakeTimers();
    controller = new PlaybackController({ total: 5, speed: 1 });
  });

  afterEach(() => {
    controller.dispose();
    vi.useRealTimers();
  });

  it('starts paused at the first step', () => {
    expect(controller.getSnapshot()).toMatchObject({
      index: 0,
      total: 5,
      isPlaying: false,
      atStart: true,
      atEnd: false,
    });
  });

  it('steps forward and backward without leaving the range', () => {
    controller.next();
    controller.next();
    expect(controller.getSnapshot().index).toBe(2);
    controller.previous();
    expect(controller.getSnapshot().index).toBe(1);
    controller.previous();
    controller.previous();
    expect(controller.getSnapshot().index).toBe(0);
    expect(controller.getSnapshot().atStart).toBe(true);
  });

  it('clamps forward navigation at the last step', () => {
    for (let i = 0; i < 20; i += 1) controller.next();
    expect(controller.getSnapshot().index).toBe(4);
    expect(controller.getSnapshot().atEnd).toBe(true);
  });

  it('advances one step per tick while playing', () => {
    controller.play();
    expect(controller.getSnapshot().isPlaying).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(controller.getSnapshot().index).toBe(1);
    vi.advanceTimersByTime(2000);
    expect(controller.getSnapshot().index).toBe(3);
  });

  it('stops playing when it reaches the end', () => {
    controller.play();
    vi.advanceTimersByTime(10_000);
    expect(controller.getSnapshot().index).toBe(4);
    expect(controller.getSnapshot().isPlaying).toBe(false);
  });

  it('never runs two timers at once', () => {
    controller.play();
    controller.play();
    controller.play();
    vi.advanceTimersByTime(1000);
    expect(controller.getSnapshot().index).toBe(1);
  });

  it('pausing stops the timer', () => {
    controller.play();
    vi.advanceTimersByTime(1000);
    controller.pause();
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().index).toBe(1);
    expect(controller.getSnapshot().isPlaying).toBe(false);
  });

  it('stepping pauses playback', () => {
    controller.play();
    controller.next();
    expect(controller.getSnapshot().isPlaying).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().index).toBe(1);
  });

  it('replays from the start when play is pressed at the end', () => {
    controller.last();
    controller.play();
    expect(controller.getSnapshot().index).toBe(0);
    expect(controller.getSnapshot().isPlaying).toBe(true);
  });

  it('reset returns to the first step and pauses', () => {
    controller.play();
    vi.advanceTimersByTime(2000);
    controller.reset();
    expect(controller.getSnapshot()).toMatchObject({
      index: 0,
      isPlaying: false,
    });
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().index).toBe(0);
  });

  it('applies a new speed immediately while playing', () => {
    controller.play();
    controller.setSpeed(4);
    vi.advanceTimersByTime(250);
    expect(controller.getSnapshot().index).toBe(1);
    vi.advanceTimersByTime(250);
    expect(controller.getSnapshot().index).toBe(2);
  });

  it('clamps speed into the supported range', () => {
    controller.setSpeed(1000);
    expect(controller.getSnapshot().speed).toBe(SPEED_MAX);
    controller.setSpeed(0);
    expect(controller.getSnapshot().speed).toBe(SPEED_MIN);
  });

  it('loading a new trace resets position and stops playback', () => {
    controller.play();
    vi.advanceTimersByTime(2000);
    controller.load(3);
    expect(controller.getSnapshot()).toMatchObject({
      index: 0,
      total: 3,
      isPlaying: false,
    });
    vi.advanceTimersByTime(5000);
    expect(controller.getSnapshot().index).toBe(0);
  });

  it('can keep playing across a reload', () => {
    controller.load(4, { keepPlaying: true });
    expect(controller.getSnapshot().isPlaying).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(controller.getSnapshot().index).toBe(1);
  });

  it('treats a single-step trace as already finished', () => {
    controller.load(1);
    controller.play();
    expect(controller.getSnapshot().isPlaying).toBe(false);
    expect(controller.getSnapshot().atEnd).toBe(true);
  });

  it('handles an empty trace without throwing', () => {
    controller.load(0);
    controller.play();
    controller.next();
    expect(controller.getSnapshot()).toMatchObject({
      index: 0,
      total: 0,
      atEnd: true,
    });
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    controller.next();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    controller.next();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot object between changes', () => {
    const first = controller.getSnapshot();
    expect(controller.getSnapshot()).toBe(first);
    controller.next();
    expect(controller.getSnapshot()).not.toBe(first);
  });

  it('dispose clears any pending timer', () => {
    controller.play();
    controller.dispose();
    vi.advanceTimersByTime(10_000);
    expect(controller.getSnapshot().index).toBe(0);
  });

  it('seek moves to an exact step and clamps out-of-range targets', () => {
    controller.seek(3);
    expect(controller.getSnapshot().index).toBe(3);
    controller.seek(99);
    expect(controller.getSnapshot().index).toBe(4);
    controller.seek(-5);
    expect(controller.getSnapshot().index).toBe(0);
  });

  it('forward then backward navigation is symmetric', () => {
    const visited: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      controller.next();
      visited.push(controller.getSnapshot().index);
    }
    const back: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      back.push(controller.getSnapshot().index);
      controller.previous();
    }
    expect(visited).toEqual([1, 2, 3, 4]);
    expect(back).toEqual([4, 3, 2, 1]);
    expect(controller.getSnapshot().index).toBe(0);
  });
});
