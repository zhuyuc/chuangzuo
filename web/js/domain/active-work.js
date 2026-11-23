/* 龙吟写作 · 当前作品选择 */
import { state, works } from "../core/store.js";

export function activeWork() { return works.find(item => item.id === state.currentWork) || works[0]; }

export function activeData() { return activeWork().data; }