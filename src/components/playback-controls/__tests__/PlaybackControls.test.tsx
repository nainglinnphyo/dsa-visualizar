import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PlaybackControls } from '../PlaybackControls';
import { usePlayback } from '@/hooks/usePlayback';
import { useKeyboardPlayback } from '@/hooks/useKeyboardPlayback';

function Harness({ total = 5, keyboard = true }: { total?: number; keyboard?: boolean }) {
  const { controller, playback } = usePlayback(total);
  useKeyboardPlayback(controller, keyboard);
  return (
    <>
      <PlaybackControls controller={controller} playback={playback} />
      <output data-testid="index">{playback.index}</output>
    </>
  );
}

/** Mounts, steps forward, then unmounts — used to assert timer cleanup. */
function Unmountable() {
  const [mounted, setMounted] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setMounted(false)}>
        unmount
      </button>
      {mounted && <Harness />}
    </>
  );
}

afterEach(cleanup);

describe('PlaybackControls', () => {
  it('starts at the first step with backward controls disabled', () => {
    render(<Harness />);
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step backward' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeEnabled();
  });

  it('steps forward and backward', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Step forward' }));
    await user.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByTestId('index')).toHaveTextContent('2');
    await user.click(screen.getByRole('button', { name: 'Step backward' }));
    expect(screen.getByTestId('index')).toHaveTextContent('1');
  });

  it('disables forward controls at the end', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Go to last step' }));
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go to last step' })).toBeDisabled();
  });

  it('reset returns to the first step', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Go to last step' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('scrubbing seeks to an exact step', async () => {
    render(<Harness />);
    const scrubber = screen.getByRole('slider', { name: 'Scrub to step' });
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(scrubber, { target: { value: '3' } });
    expect(screen.getByTestId('index')).toHaveTextContent('3');
  });

  it('changes the playback speed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const fourTimes = screen.getByRole('button', { name: '4×' });
    expect(fourTimes).toHaveAttribute('aria-pressed', 'false');
    await user.click(fourTimes);
    expect(fourTimes).toHaveAttribute('aria-pressed', 'true');
  });

  it('plays and pauses on the space bar', async () => {
    vi.useFakeTimers();
    try {
      render(<Harness />);
      const { act } = await import('react');
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
      // The default rate is 2 steps per second, so one step is 500ms.
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('index')).toHaveTextContent('1');
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('steps with the arrow keys and resets with R', async () => {
    const { act } = await import('react');
    render(<Harness />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(screen.getByTestId('index')).toHaveTextContent('2');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(screen.getByTestId('index')).toHaveTextContent('1');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('ignores keyboard shortcuts while typing in a field', async () => {
    const { act } = await import('react');
    render(
      <>
        <input aria-label="field" />
        <Harness />
      </>,
    );
    const field = screen.getByLabelText('field');
    field.focus();
    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('disables playback for a single-step trace', () => {
    render(<Harness total={1} />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('reports an empty trace without crashing', () => {
    render(<Harness total={0} />);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    expect(screen.getByText('No trace loaded.')).toBeInTheDocument();
  });

  it('clears its timer when the component unmounts', async () => {
    vi.useFakeTimers();
    try {
      const { act } = await import('react');
      render(<Unmountable />);
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      });
      act(() => {
        screen.getByRole('button', { name: 'unmount' }).click();
      });
      // A leaked timer would throw an update-on-unmounted-component warning.
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(10_000);
        });
      }).not.toThrow();
      expect(screen.queryByTestId('index')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
