import assert from "node:assert/strict";
import test from "node:test";

import { createCatalogSearchRequestTracker } from "../src/lib/catalog.ts";

void test("catalog search request tracker invalidates older requests when a new search begins", () => {
  const tracker = createCatalogSearchRequestTracker();
  const firstRequestId = tracker.begin();
  const secondRequestId = tracker.begin();

  assert.equal(tracker.isCurrent(firstRequestId), false);
  assert.equal(tracker.isCurrent(secondRequestId), true);
});
