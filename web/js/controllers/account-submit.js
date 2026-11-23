import { render } from "../app/render.js";
import { submitAuth } from "../app/session.js";
import { api, isValidAccountName } from "../core/api.js";
import { APP_CONTRACTS } from "../core/state.js";
import { state } from "../core/store.js";
import { notify, notifyError } from "../core/utils.js";





/* 龙吟写作 · 账户与登录表单提交 */
export function accountSubmit(event) {
  if (event.target.id === "pen-name-form") {
    event.preventDefault();
    const form = event.target;
    const penName = form.elements.penName.value.trim();
    if (penName.length > APP_CONTRACTS.limits.penNameMax) { form.querySelector("[data-error-for=penName]").textContent = APP_CONTRACTS.messages.penNameTooLong; return true; }
    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    submitButton.textContent = "保存中…";
    api("/account/profile", { method: "PUT", body: JSON.stringify({ penName }) })
      .then(data => {
        state.profile = { ...state.profile, ...(data.profile || {}) };
        state.dialog = null;
        render();
        notify(penName ? "作者笔名已保存" : "已清除作者笔名");
      })
      .catch(error => {
        submitButton.disabled = false;
        submitButton.textContent = "保存";
        notifyError(`保存失败：${error.message}（点击提示可复制）`);
      });
    return true;
  }
  if (event.target.id !== "auth-form") return false;
  event.preventDefault();
  const form = event.target;
  const register = form.dataset.kind === "register";
  const submitButton = form.querySelector(".auth-submit");
  const runSubmit = async () => {
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    submitButton.disabled = true;
    submitButton.textContent = register ? "创建中…" : "登录中…";
    try {
      await submitAuth(register, email, password);
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = register ? "创建账户" : "登录";
      const field = /账户|邮箱/.test(error.message) ? "email" : "password";
      const box = form.querySelector(`[data-error-for="${field}"]`);
      if (box) box.textContent = error.message;
      else notifyError(error.message);
    }
  };
  if (!register) { runSubmit(); return true; }
  form.querySelectorAll(".field-error").forEach(error => error.textContent = "");
  form.querySelectorAll(".auth-input").forEach(input => input.classList.remove("invalid"));
  const setError = (name, message) => {
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) error.textContent = message;
    const input = form.elements[name];
    if (input && input.classList) input.classList.add("invalid");
  };
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  let valid = true;
  if (!email) { setError("email", "请输入账户。"); valid = false; }
  else if (!isValidAccountName(email)) { setError("email", APP_CONTRACTS.messages.invalidAccount); valid = false; }
  if (!password) { setError("password", "请输入密码。"); valid = false; }
  else if (register && password.length < APP_CONTRACTS.limits.passwordMin) { setError("password", APP_CONTRACTS.messages.invalidPassword); valid = false; }
  if (register && form.elements.confirm.value !== password) { setError("confirm", "两次输入的密码不一致。"); valid = false; }
  if (register && !form.elements.agreement.checked) { setError("agreement", "请先阅读并同意服务条款与隐私政策。"); valid = false; }
  if (valid) runSubmit();
  return true;
}