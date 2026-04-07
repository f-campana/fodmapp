export type {
  BearerProtectedApiAuth,
  PreviewProtectedApiAuth,
  ProtectedApiAuth,
  ProtectedApiAuthInput,
  RuntimeProtectedApiAuth,
} from "./core/auth";
export {
  buildProtectedApiHeaders,
  normalizeProtectedApiAuth,
} from "./core/auth";
export { requestJson } from "./core/client";
export type { ApiClientConfig } from "./core/config";
export { buildApiUrl, resolveApiBase } from "./core/config";
export type { ApiResult } from "./core/result";
export { mapApiResult } from "./core/result";
export type { CuratedFoodDetailPageData } from "./public/foods";
export {
  getCuratedFoodDetailPageData,
  searchCuratedFoods,
} from "./public/foods";
export type { CuratedSwapListOptions } from "./public/swaps";
export { listCuratedSwaps } from "./public/swaps";
export {
  createCustomFoodRecord,
  deleteCustomFoodRecord,
  listCustomFoodRecords,
  updateCustomFoodRecord,
} from "./tracking/custom-foods";
export { getTrackingFeed } from "./tracking/feed";
export {
  createMealEntry,
  deleteMealEntry,
  listMealEntries,
  updateMealEntry,
} from "./tracking/meals";
export {
  createSavedMealRecord,
  deleteSavedMealRecord,
  listSavedMealRecords,
  updateSavedMealRecord,
} from "./tracking/saved-meals";
export type {
  TrackingHubReadModel,
  TrackingHubReadOptions,
} from "./tracking/summaries";
export {
  getTrackingHubReadModel,
  getWeeklyTrackingSummary,
} from "./tracking/summaries";
export {
  createSymptomEntry,
  deleteSymptomEntry,
  listSymptomEntries,
  updateSymptomEntry,
} from "./tracking/symptoms";
export type {
  CuratedFood,
  CuratedFoodProfile,
  CuratedFoodSearchResult,
  CuratedFoodSummary,
  CuratedSwap,
  CuratedSwapList,
  CustomFoodDraft,
  CustomFoodRecord,
  MealEntry,
  MealEntryDraft,
  SavedMealDraft,
  SavedMealRecord,
  SymptomEntry,
  SymptomEntryDraft,
  TrackingFeed,
  TrackingItemDraft,
  TrackingLoggedItem,
  WeeklyTrackingSummary,
} from "@fodmapp/domain";
