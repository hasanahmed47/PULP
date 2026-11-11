import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { flavours } from '../data/flavours';
import { flavourDetails } from '../data/flavourDetails';
import { GoodInsides } from './GoodInsides';

vi.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

afterEach(cleanup);

function renderSection() {
  render(<GoodInsides />);
  return screen.getByRole('region', { name: 'Flavour details' });
}

function readNutrition(section) {
  return within(section).getAllByRole('definition').map((value) => value.textContent);
}

it('has details for every flavour', () => {
  for (const flavour of flavours) {
    const details = flavourDetails[flavour.id];
    expect(details, flavour.id).toBeDefined();
    expect(details.serves.length, flavour.id).toBeGreaterThan(0);
    expect(details.nutrition.calories, flavour.id).toBeTruthy();
    expect(details.ingredients, flavour.id).toBeTruthy();
  }
});

it('starts on the first flavour and keeps the id the hero link points to', () => {
  const section = renderSection();

  expect(section.id).toBe('good-insides');
  expect(section.dataset.flavour).toBe(flavours[0].id);
  expect(within(section).getByRole('heading', { level: 2 }).textContent).toContain(flavours[0].name);
});

it('switches name, nutrition, ingredients, picker and eye together', async () => {
  const user = userEvent.setup();
  const section = renderSection();
  const target = flavours[2];
  const { nutrition, ingredients } = flavourDetails[target.id];

  await user.click(within(section).getByRole('button', { name: target.name }));

  expect(section.dataset.flavour).toBe(target.id);
  expect(within(section).getByRole('heading', { level: 2 }).textContent).toContain(target.name);
  expect(readNutrition(section)).toEqual([nutrition.calories, nutrition.sugar, nutrition.fat, nutrition.serving, nutrition.abv]);
  expect(within(section).getByText(ingredients).closest('[aria-hidden]').getAttribute('aria-hidden')).toBe('false');
  expect(within(section).getByRole('button', { name: target.name }).getAttribute('aria-pressed')).toBe('true');
  expect(within(section).getByRole('button', { name: `Show ${target.name}` }).getAttribute('aria-pressed')).toBe('true');
  expect(section.querySelector('.can-carousel__eye').style.getPropertyValue('--index')).toBe('2');
  expect(section.querySelectorAll('[aria-pressed="true"]')).toHaveLength(2);
});

it('lets the dots under the can choose a flavour too', async () => {
  const user = userEvent.setup();
  const section = renderSection();
  const target = flavours[3];

  await user.click(within(section).getByRole('button', { name: `Show ${target.name}` }));

  expect(section.dataset.flavour).toBe(target.id);
  expect(within(section).getByRole('button', { name: target.name }).getAttribute('aria-pressed')).toBe('true');
});

it('shakes through the serves, wraps around and restarts on a new flavour', async () => {
  const user = userEvent.setup();
  const section = renderSection();
  const { serves } = flavourDetails[flavours[0].id];
  const shake = within(section).getByRole('button', { name: /shake for a serve/i });

  expect(within(section).getByRole('heading', { level: 3, name: serves[0].name })).toBeTruthy();

  for (let step = 1; step <= serves.length; step += 1) {
    await user.click(shake);
    expect(within(section).getByRole('heading', { level: 3, name: serves[step % serves.length].name })).toBeTruthy();
  }
  expect(shake.textContent).toContain(`1/${serves.length}`);

  await user.click(shake);
  await user.click(within(section).getByRole('button', { name: flavours[1].name }));

  expect(shake.textContent).toContain(`1/${flavourDetails[flavours[1].id].serves.length}`);
});

it('hides the copy of unselected flavours from assistive technology', () => {
  const section = renderSection();
  const hidden = section.querySelectorAll('.spot-stack__layer[aria-hidden="true"]');
  const stacksPerFlavour = 3;

  expect(hidden).toHaveLength((flavours.length - 1) * stacksPerFlavour);
  for (const layer of hidden) expect(layer.hasAttribute('inert')).toBe(true);
});

it('has no purchase controls', () => {
  const section = renderSection();

  expect(within(section).queryByRole('button', { name: /bag|cart|buy|bouquet/i })).toBeNull();
});
