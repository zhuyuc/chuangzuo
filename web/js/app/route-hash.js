/* 龙吟写作 · 路由哈希（无副作用叶子模块） */
export const ROUTE_PAGES = ["dashboard", "writing", "outline", "materials", "inspiration", "characters", "maps", "weapons"];

export function routeFromHash() {
  const match = location.hash.match(/^#\/([a-z]+)$/);
  return match && ROUTE_PAGES.includes(match[1]) ? match[1] : null;
}

export function syncRouteHash(page) {
  const target = `#/${page}`;
  if (location.hash !== target) history.replaceState(null, "", target);
}