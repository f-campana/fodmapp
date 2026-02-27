import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardSnapshot, getFoodById, listFoods } from '../src/data/repository';

test('listFoods returns all foods for empty query', async () => {
  const foods = await listFoods('');
  assert.ok(foods.length >= 3);
});

test('listFoods filters by tag/category/name', async () => {
  const byTag = await listFoods('lactose');
  assert.equal(byTag.length, 1);
  assert.equal(byTag[0]?.id, 'milk');

  const byName = await listFoods('garlic');
  assert.equal(byName[0]?.id, 'garlic');
});

test('getFoodById returns undefined for unknown food', async () => {
  const food = await getFoodById('unknown-food');
  assert.equal(food, undefined);
});

test('dashboard snapshot counts are coherent', async () => {
  const snapshot = await getDashboardSnapshot();
  assert.ok(snapshot.trackedFoods > 0);
  assert.ok(snapshot.availableSwaps >= snapshot.trackedFoods);
  assert.ok(snapshot.highRiskFoods >= 1);
});
