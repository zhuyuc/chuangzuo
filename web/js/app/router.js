import { state } from "../core/store.js";
import { render } from "./render.js";
import { syncRouteHash } from "./route-hash.js";

/* 龙吟写作 · 路由 */
    export { ROUTE_PAGES, routeFromHash, syncRouteHash } from "./route-hash.js";

    export function navigate(page) {
      state.page = page;
      syncRouteHash(page);
      render();
    }