import { accountSubmit } from "../controllers/account-submit.js";
import { aiSubmit } from "../controllers/ai-submit.js";
import { entitySubmit } from "../controllers/entity-submit.js";
import { inspirationSubmit } from "../controllers/inspiration-submit.js";
import { mapSubmit } from "../controllers/map-submit.js";
import { workSubmit } from "../controllers/work-submit.js";




/* 龙吟写作 · 表单提交分发 */

    const submitControllers = [entitySubmit, accountSubmit, aiSubmit, inspirationSubmit, mapSubmit, workSubmit];

    document.addEventListener("submit", event => {
      for (const handle of submitControllers) if (handle(event)) return;
    });