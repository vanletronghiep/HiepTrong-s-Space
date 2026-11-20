/**
 * Routes hidden from the site. Their code, API routes and stored data stay intact.
 * To reactivate a page, delete its line here.
 */
export const HIDDEN_ROUTES: readonly string[] = [
  '/ai-engineering',
  '/apcs',
  '/flashcards',
  '/entertainment',
  '/milestones',
  '/achievements',
];

export function isRouteHidden(route: string): boolean {
  const normalized = route.length > 1 ? route.replace(/\/+$/, '') : route;
  return HIDDEN_ROUTES.includes(normalized);
}
