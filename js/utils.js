import { MAX_NAME_LENGTH } from "./config.js";

export function formatCoins(value) {
  const number = Math.trunc(Number(value));
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : "0";
}

export function cleanName(value) {
  const name = String(value || "").trim().slice(0, MAX_NAME_LENGTH);
  return name || "UNKNOWN";
}

export function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function firstRow(data) {
  return Array.isArray(data) ? data[0] : data;
}

export function toInt(value, fallback = 0) {
  const number = Math.trunc(Number(value));
  return Number.isFinite(number) ? number : fallback;
}

export function toPositiveInt(value) {
  const number = toInt(value, 0);
  return number > 0 ? number : 0;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function errorText(error) {
  return error && error.message ? error.message : String(error || "알 수 없는 오류");
}
