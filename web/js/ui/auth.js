import { APP_CONTRACTS } from "../core/state.js";
import { state } from "../core/store.js";
import { activePageLabel } from "./shell.js";





/* 龙吟写作 · 登录与注册视图 */
    export function renderAuth() {
      const root = document.getElementById("auth-root");
      document.title = state.authView ? `龙吟写作 · ${state.authView === "register" ? "注册" : "登录"}` : `龙吟写作 · ${activePageLabel()}`;
      if (!state.authView) { root.innerHTML = ""; return; }
      const register = state.authView === "register";
      const passwordHint = `至少 ${APP_CONTRACTS.limits.passwordMin} 个字符`;
      root.innerHTML = `<div class="auth-screen"><div class="auth-stage"><section class="auth-intro"><div class="auth-brand"><span class="brand-mark">龙</span><span>龙吟写作</span></div><div class="auth-intro-copy"><span>PRIVATE WRITING ROOM</span><h2>让故事<br>回到一张安静的纸上。</h2><p>大纲、人物、地图与正文都在同一个私人书房里。登录后继续你正在写的那一章。</p></div><div class="auth-ink" aria-hidden="true">墨</div></section><div class="auth-wrap"><div class="auth-card"><div class="auth-heading"><svg class="auth-logo" viewBox="0 0 52 52" role="img" aria-label="龙吟写作标志"><rect x="2" y="2" width="48" height="48" rx="14" fill="#326b55"/><path d="M15 15v17c0 4 3 6 7 6h13" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/><path d="M20 18c4-5 13-5 15 1 2 5-3 9-8 7-3-1-4-4-2-6 1-2 4-2 6-1" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="31.5" cy="17.5" r="1.3" fill="#ffffff"/><path d="M33 31l4 5-7 1 3-6z" fill="#ffffff"/></svg><h1>${register ? "创建账户" : "登录账户"}</h1><p>${register ? "建立你的私人书房，数据留在自己的服务器。" : "回到灯下，继续那个还没有写完的故事。"}</p></div><form id="auth-form" data-kind="${register ? "register" : "login"}" novalidate>
        <div class="form-field"><label for="auth-email">账户</label><input class="auth-input" id="auth-email" name="email" type="text" autocomplete="username" placeholder="邮箱或用户名"><div class="field-error" data-error-for="email"></div></div>
        <div class="form-field"><label for="auth-password">密码</label><div class="password-field"><input class="auth-input" id="auth-password" name="password" type="password" autocomplete="${register ? "new-password" : "current-password"}" placeholder="${register ? passwordHint : "输入密码"}"><button type="button" class="password-toggle" data-password-target="auth-password">显示</button></div><div class="field-error" data-error-for="password"></div></div>
        ${register ? `<div class="form-field"><label for="auth-confirm">确认密码</label><div class="password-field"><input class="auth-input" id="auth-confirm" name="confirm" type="password" autocomplete="new-password" placeholder="再次输入密码"><button type="button" class="password-toggle" data-password-target="auth-confirm">显示</button></div><div class="field-error" data-error-for="confirm"></div></div><div class="form-options"><label class="check-label"><input type="checkbox" name="agreement"><span>我已阅读并同意 <button type="button" class="text-button" data-dialog="terms">服务条款</button> 与 <button type="button" class="text-button" data-dialog="privacy">隐私政策</button></span></label></div><div class="field-error" data-error-for="agreement" style="margin:-12px 0 14px"></div>` : `<div class="form-options auth-login-links"><span>没有账户？<button type="button" class="text-button" data-auth="register">立即注册</button></span><button type="button" class="text-button" data-dialog="forgot">忘记密码？</button></div>`}
        <button class="auth-submit" type="submit">${register ? "创建账户" : "登录"}</button>
      </form>${register ? `<div class="auth-switch">已有账户？<button data-auth="login">返回登录</button></div>` : ""}</div></div></div></div>`;
    }

    export function openAuth(view) {
      state.authView = view;
      history.replaceState(null, "", `${location.href.split("#")[0]}#${view}`);
      renderAuth();
    }
