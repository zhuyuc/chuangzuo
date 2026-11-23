import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { storyEntities } from "../domain/entities.js";
import { renderAIDialog, renderConfirmDialog, renderLegalDialog, renderNewWorldDialog, renderPenNameDialog, renderSettingsDialog } from "./basic-dialogs.js";
import { renderEditWorkDialog, renderHistoryDialog, renderInspirationDialog, renderNewMapDialog, renderRemoveRefDialog, renderRenameMapDialog, renderSecretDialog, renderWorkSwitchDialog } from "./data-dialogs.js";
import { entityConfig, entityRecord } from "./entity-config.js";
import { renderEntityDialog, workFormMarkup } from "./entity-dialog.js";
import { renderTypographyDialog } from "./typography-dialog.js";





/* 龙吟写作 · 弹窗分发与确认 */
    export function openEntityDialog(kind, id) {
      const record = entityRecord(kind, id);
      if ((kind === "relationship") && storyEntities().length < 2) { notify("请先创建至少两条世界观设定"); return; }
      state.dialog = "entity";
      state.entityType = kind;
      state.entityId = id || null;
      state.entityRecord = record;
      renderDialog();
    }

    export function renderDialog() {
      const root = document.getElementById("dialog-root");
      if (!state.dialog) { root.innerHTML = ""; return; }
      if (state.dialog === "entity") { root.innerHTML = renderEntityDialog(entityConfig(state.entityType, state.entityRecord)); return; }
      if (state.dialog === "ai") { renderAIDialog(root); return; }
      if (state.dialog === "pen-name") { renderPenNameDialog(root); return; }
      if (state.dialog === "ai-settings") { renderSettingsDialog(root); return; }
      if (state.dialog === "terms" || state.dialog === "privacy" || state.dialog === "forgot") { renderLegalDialog(root); return; }
      if (state.dialog === "confirm") { renderConfirmDialog(root); return; }
      if (state.dialog === "new-world-entry") { renderNewWorldDialog(root); return; }
      if (state.dialog === "inspiration") { renderInspirationDialog(root); return; }
      if (state.dialog === "typography") { renderTypographyDialog(root); return; }
      if (state.dialog === "remove-ref") { renderRemoveRefDialog(root); return; }
      if (state.dialog === "work-switch") { renderWorkSwitchDialog(root); return; }
      if (state.dialog === "history") { renderHistoryDialog(root); return; }
      if (state.dialog === "secret") { renderSecretDialog(root); return; }
      if (state.dialog === "new-map") { renderNewMapDialog(root); return; }
      if (state.dialog === "rename-map") { renderRenameMapDialog(root); return; }
      if (state.dialog === "edit-work") { renderEditWorkDialog(root); return; }
      root.innerHTML = workFormMarkup();
    }

    export function openDialog(dialog) { state.dialog = dialog; renderDialog(); }

    export function askConfirm(message, onOk, danger = false) {
      state.confirm = { message, onOk, danger };
      state.dialogBeforeConfirm = state.dialog;
      state.dialog = "confirm";
      renderDialog();
    }

    export function closeDialog() {
      if (state.dialog === "confirm" && state.dialogBeforeConfirm) {
        state.dialog = state.dialogBeforeConfirm;
        state.dialogBeforeConfirm = null;
      } else {
        state.dialog = null;
      }
      renderDialog();
    }
