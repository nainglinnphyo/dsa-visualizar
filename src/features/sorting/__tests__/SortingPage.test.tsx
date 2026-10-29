import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortingPage } from '../SortingPage';

afterEach(cleanup);

/** The code panel marks the executing line with aria-current="step". */
const activeLines = (): string[] =>
  Array.from(document.querySelectorAll('[aria-current="step"]')).map(
    (node) => node.textContent ?? '',
  );

const applyValues = async (
  user: ReturnType<typeof userEvent.setup>,
  values: string,
): Promise<void> => {
  const field = screen.getByLabelText('Custom values');
  await user.clear(field);
  await user.type(field, values);
  await user.click(screen.getByRole('button', { name: 'Apply' }));
};

describe('SortingPage', () => {
  it('renders a trace for the default algorithm', () => {
    render(<SortingPage />);
    expect(
      screen.getByRole('heading', { name: 'Sorting Visualizer' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^1 \//)).toBeInTheDocument();
  });

  it('sorts custom values and reaches a sorted final state', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await applyValues(user, '5, 1, 4, 2, 8');
    await user.click(screen.getByRole('button', { name: 'Go to last step' }));
    const canvas = screen.getByRole('img', { name: /Array of 5 values/ });
    expect(canvas).toHaveAccessibleName('Array of 5 values: 1, 2, 4, 5, 8');
  });

  it('keeps the code panel in sync when stepping', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    const before = activeLines().join('|');
    await user.click(screen.getByRole('button', { name: 'Step forward' }));
    await user.click(screen.getByRole('button', { name: 'Step forward' }));
    const after = activeLines().join('|');
    expect(after).not.toBe('');
    expect(after).not.toBe(before);
  });

  it('stepping backward restores the earlier state exactly', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await applyValues(user, '3, 1, 2');
    const stepForward = screen.getByRole('button', { name: 'Step forward' });
    await user.click(stepForward);
    await user.click(stepForward);
    const snapshot = {
      canvas: screen
        .getByRole('img', { name: /Array of 3 values/ })
        .getAttribute('aria-label'),
      code: activeLines().join('|'),
    };
    await user.click(stepForward);
    await user.click(screen.getByRole('button', { name: 'Step backward' }));
    expect(
      screen.getByRole('img', { name: /Array of 3 values/ }).getAttribute('aria-label'),
    ).toBe(snapshot.canvas);
    expect(activeLines().join('|')).toBe(snapshot.code);
  });

  it('switching algorithm reloads the trace from the first step', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await user.click(screen.getByRole('button', { name: 'Go to last step' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Algorithm' }),
      'merge-sort',
    );
    expect(screen.getByText(/^1 \//)).toBeInTheDocument();
    expect(screen.getByText('Merge Sort', { selector: 'option' })).toBeInTheDocument();
  });

  it('shows complexity for the selected algorithm', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Algorithm' }),
      'merge-sort',
    );
    const complexity = screen.getByText('Complexity').closest('section') as HTMLElement;
    expect(within(complexity).getAllByText('O(n log n)').length).toBeGreaterThan(0);
  });

  it('reports invalid custom input instead of crashing', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await applyValues(user, 'abc');
    expect(screen.getByRole('alert')).toHaveTextContent('is not a number');
  });

  it('handles a single-value array', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    await applyValues(user, '7');
    expect(
      screen.getByRole('img', { name: 'Array of 1 values: 7' }),
    ).toBeInTheDocument();
  });

  it('explains the counting-sort key range instead of failing silently', async () => {
    const user = userEvent.setup();
    render(<SortingPage />);
    // A 1…99 span is 99 distinct keys, more buckets than counting sort allows.
    await applyValues(user, '1, 99');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Algorithm' }),
      'counting-sort',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/bucket per distinct key/);
    await user.click(
      screen.getByRole('button', { name: /Generate values in range/ }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
