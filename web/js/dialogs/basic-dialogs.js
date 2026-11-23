import { APP_CONTRACTS } from "../core/state.js";
import { state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { aiContextChips } from "../domain/ai/context.js";
import { AI_BASEURL_PRESETS, AI_LABELS } from "../domain/ai/labels.js";
import { selectOptions } from "./entity-config.js";





/* 龙吟写作 · 基础弹窗内容 */
    export function renderAIDialog(root) {
        const result = state.aiResult;
        const label = AI_LABELS[state.aiAction] || "AI";
        const body = !result ? "" : result.loading
          ? '<div class="ai-loading"><i></i><i></i><i></i>正在读取当前作品上下文…</div>'
          : result.kind === "list"
            ? result.rows.map((row, index) => `<div class="ai-row"><div class="grow"><strong>${escapeHtml(row.main)}</strong><small>${escapeHtml(row.sub)}</small></div><div class="acts">${row.apply ? `<button class="button" data-ai-adopt-row="${index}">采纳</button>` : ""}${row.jump ? `<button class="button" data-ai-jump="${index}">定位</button>` : ""}<button class="button" data-ai-drop-row="${index}">丢弃</button></div></div>`).join("") || '<div class="empty-state compact"><strong>没有建议</strong><p>当前数据没有需要处理的内容。</p></div>'
            : `<div class="ai-result">${escapeHtml(result.body)}</div>`;
        const adoptable = result && !result.loading && result.kind === "text" && !result.noAdopt;
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-lg"><div class="dialog-header"><div><h1>AI · ${escapeHtml(label.replace(/^AI\s+/, ""))}</h1><p>${escapeHtml(state.ai.model)} · 模拟结果，采纳前不会写入任何数据</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body">${result && !result.loading ? `<div class="ai-chips">${aiContextChips()}</div>` : ""}${body}</div><div class="dialog-actions">${result && !result.loading && result.kind === "text" ? `<button class="button" data-ai-copy>复制</button><button class="button" data-ai-retry>重试</button>` : ""}${adoptable ? '<button class="button primary" data-ai-adopt>采纳</button>' : ""}<button class="button" data-dialog-close>${result?.kind === "list" ? "关闭" : "丢弃"}</button></div></section></div>`;
        return;
    }

    export function renderPenNameDialog(root) {
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-sm"><div class="dialog-header"><div><h1>设置作者笔名</h1><p>笔名只用于工作台与作品卡署名，不影响登录账户。</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="pen-name-form" novalidate><div class="dialog-body"><div class="form-field"><label for="pen-name">作者笔名</label><input class="auth-input" id="pen-name" name="penName" maxlength="${APP_CONTRACTS.limits.penNameMax}" value="${escapeHtml(state.profile?.penName || "")}" placeholder="例如：长夜客" autofocus><div class="field-error" data-error-for="penName"></div></div><p class="detail-copy">最多 ${APP_CONTRACTS.limits.penNameMax} 个字符。留空保存可以清除笔名。</p></div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">保存</button></div></form></section></div>`;
        return;
    }

    export function renderSettingsDialog(root) {
        const themeMode = localStorage.getItem("longyin.theme") || "light";
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>设置</h1><p>配置只存本地账户；备份导出时密钥脱敏。留空访问地址或密钥则使用离线模拟。</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="ai-settings-form"><div class="dialog-body"><div class="form-field"><label for="theme-mode">外观</label><select class="dialog-select" id="theme-mode" name="theme"><option value="light" ${themeMode === "light" ? "selected" : ""}>浅色</option><option value="dark" ${themeMode === "dark" ? "selected" : ""}>深色</option><option value="system" ${themeMode === "system" ? "selected" : ""}>跟随系统</option></select></div><div class="form-field"><label for="ai-provider">Provider</label><select class="dialog-select" id="ai-provider" name="provider">${selectOptions([["OpenAI 兼容", "OpenAI 兼容"], ["Anthropic 兼容", "Anthropic 兼容"], ["本地 Ollama", "本地 Ollama"], ["自定义 baseURL", "自定义 baseURL"]], state.ai.provider)}</select></div><div class="form-field"><label for="ai-model">Model</label><input class="auth-input" id="ai-model" name="model" value="${escapeHtml(state.ai.model)}"></div><div class="form-field"><label for="ai-key">API Key（本地加密保存）</label><input class="auth-input" id="ai-key" name="apiKey" type="password" placeholder="${state.ai.hasKey ? `已保存 ${escapeHtml(state.ai.apiKeyMasked || "****")}，留空保持不变` : "sk-… 留空则使用离线模拟"}" value=""></div>${state.ai.hasKey ? '<div class="form-options"><button type="button" class="text-button" data-ai-clear-key>清除已保存的密钥</button></div>' : ""}<div class="form-field"><label for="ai-baseurl">访问地址（baseURL）</label><input class="auth-input" id="ai-baseurl" name="baseUrl" placeholder="${escapeHtml(AI_BASEURL_PRESETS[state.ai.provider] || "https://api.example.com/v1")}" value="${escapeHtml(state.ai.baseUrl || "")}"><div class="ai-test" id="ai-test-status">留空访问地址则使用离线模拟，无需测试。</div></div><div class="form-options"><label class="check-label"><input type="checkbox" name="includeText" ${state.ai.includeText ? "checked" : ""}><span>允许把正文片段加入上下文</span></label></div><div class="form-options"><label class="check-label"><input type="checkbox" name="enabled" ${state.ai.enabled ? "checked" : ""}><span>启用 AI 功能</span></label></div></div><div class="dialog-actions"><button type="button" class="button push-left" data-ai-test>测试连接</button><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">保存</button></div></form></section></div>`;
    }

    export function renderLegalDialog(root) {
        const copy = {
          terms: ["服务条款", "龙吟写作运行在你自己的本地服务器上：账户、作品与设置数据全部保存在本机 data 目录，不上传任何第三方服务。你对本机数据拥有完全控制权，也自行承担备份义务（可使用“服务器与备份”页生成备份文件）。软件按现状提供，不因内容丢失承担赔偿责任。"],
          privacy: ["隐私政策", "我们只收集运行所必需的数据：账户标识（邮箱或用户名）、密码哈希、你创建的作品内容与 AI 设置。API 密钥以加密形式存于本机，接口与备份导出均脱敏。AI 调用仅发送你当前作品的上下文片段；关闭“允许把正文片段加入上下文”后只发送设定摘要。无任何遥测与第三方统计。"],
          forgot: ["找回密码", "本地服务器不提供邮件找回。请到服务器数据目录 data/accounts 下删除对应账户目录中的 account.json 密码字段不可行时，直接删除该账户目录并重新注册；作品正文仍保留在 works 子目录，可在新账户中通过备份恢复流程取回。"]
        }[state.dialog];
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-md"><div class="dialog-header"><div><h1>${copy[0]}</h1><p>本地服务器版本 · 生效于首次启动</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body"><p class="detail-copy">${copy[1]}</p></div><div class="dialog-actions"><button class="button primary" data-dialog-close>我知道了</button></div></section></div>`;
    }

    export function renderConfirmDialog(root) {
        const confirmState = state.confirm || {};
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-sm"><div class="dialog-header"><div><h1>请确认</h1></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body"><p class="detail-copy">${escapeHtml(confirmState.message || "")}</p></div><div class="dialog-actions"><button class="button" data-dialog-close>取消</button><button class="button ${confirmState.danger ? "danger-button" : "primary"}" data-confirm-ok>确认</button></div></section></div>`;
    }

    export function renderNewWorldDialog(root) {
        const options = [
          ["character", "人物", "身份、动机、弱点和秘密", "人"],
          ["place", "地点", "地图上的城、山、渡口与遗迹", "址"],
          ["faction", "势力", "组织、国家、教团、行会与家族", "势"],
          ["species", "种族", "智慧种族、异变生物与神话族裔", "族"],
          ["item", "装备", "武器、防具与有代价的奇物", "刃"],
          ["event", "事件", "战争、灾变、加冕与叛逃", "事"],
          ["rule", "规则", "力量、科技、宗教与经济的底层法则", "则"]
        ];
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-lg new-world-dialog"><div class="dialog-header"><div><h1>新增世界观设定</h1><p>先选择条目类型，再填写它的档案与关系。</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body"><div class="new-world-grid">${options.map(([kind, label, description, mark]) => `<button class="new-world-option" data-new-world-kind="${kind}"><span>${mark}</span><div><strong>${label}</strong><small>${description}</small></div></button>`).join("")}</div></div><div class="dialog-actions"><button class="button" data-dialog-close>取消</button></div></section></div>`;
    }
