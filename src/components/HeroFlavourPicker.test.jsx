import { StrictMode, useImperativeHandle } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { Hero } from '../sections/Hero';

const scene = vi.hoisted(() => ({
  setRotation: vi.fn(),
  setFlavourBlend: vi.fn(),
  setPointer: vi.fn(),
}));

vi.mock('./CanScene', () => ({
  CanScene: function MockCanScene({ ref, allFlavours }) {
    useImperativeHandle(ref, () => scene, []);
    return <div data-testid="can" data-all-flavours={allFlavours} />;
  },
}));
vi.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../hooks/useVisibility', () => ({ useVisibility: () => true }));
vi.mock('../lib/animation', () => ({ gsap: {} }));
vi.mock('./AnchorLink', () => ({
  AnchorLink: function MockAnchorLink({ children, ...props }) {
    return <a {...props}>{children}</a>;
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('keeps hero colour, pressed chips, can flavour and live text in sync', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const user = userEvent.setup();
  render(<StrictMode><Hero /></StrictMode>);
  const hero = screen.getByRole('region', { name: /flavour/i });
  const picker = within(hero).getByRole('group', { name: 'Choose a flavour' });
  const chips = within(picker).getAllByRole('button');
  const announcement = hero.querySelector('[aria-live="polite"]');

  function expectSelection(index, id, name) {
    chips.forEach((chip, chipIndex) => {
      expect(chip.getAttribute('aria-pressed')).toBe(String(chipIndex === index));
    });
    expect(hero.dataset.flavour).toBe(id);
    expect(announcement.textContent.trim()).toBe(`${name} selected`);
  }

  expect(chips).toHaveLength(4);
  expect(screen.getByTestId('can').dataset.allFlavours).toBe('true');
  expectSelection(0, 'blood-orange', 'Blood Orange');
  await user.click(chips[1]);
  expectSelection(1, 'passionfruit-yuzu', 'Passionfruit Yuzu');
  expect(scene.setFlavourBlend).toHaveBeenLastCalledWith(0, 1, 1);
  await user.tab();
  expect(document.activeElement).toBe(chips[2]);
  await user.keyboard('{Enter}');
  expectSelection(2, 'blueberry', 'Blueberry');
  expect(scene.setFlavourBlend).toHaveBeenLastCalledWith(1, 2, 1);
  await user.tab();
  await user.keyboard(' ');
  expectSelection(3, 'lime-basil', 'Lime Basil');
  expect(scene.setFlavourBlend).toHaveBeenLastCalledWith(2, 3, 1);
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});
