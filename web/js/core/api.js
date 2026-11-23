import { APP_CONTRACTS } from "./state.js";

/* 龙吟写作 · HTTP 与会话 */

    const API_TOKEN_KEY = "longyin_token";
    const API_PREFIX = APP_CONTRACTS.apiPrefix || "/api/v1";

    export function apiToken() { return localStorage.getItem(API_TOKEN_KEY) || ""; }

    export async function api(path, options = {}) {
      const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
      const token = apiToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = path.startsWith("/api/") ? path : `${API_PREFIX}${path}`;
      const response = await fetch(url, { ...options, headers });
      let payload = null;
      try { payload = await response.json(); } catch (error) { payload = null; }
      if (response.status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
        window.dispatchEvent(new CustomEvent("longyin:unauthorized"));
        throw new Error(payload?.message || "登录已失效，请重新登录。");
      }
      if (!response.ok || !payload || payload.code !== 200) {
        const error = new Error(payload?.message || `请求失败（HTTP ${response.status}）。`);
        error.status = response.status;
        error.details = payload?.details;
        throw error;
      }
      return payload.data;
    }

    export function isValidAccountName(value) {
      const v = String(value || "").trim();
      if (!v) return false;
      if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return v.length >= APP_CONTRACTS.limits.accountNameMin && v.length <= APP_CONTRACTS.limits.accountNameMax && !/\s/.test(v);
    }