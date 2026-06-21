import { RANK_LIMIT, ROLL_SPIN_INTERVAL } from "./config.js";
import { formatCoins, toInt, toPositiveInt } from "./utils.js";

const els = {
  rankList: document.getElementById("rankList"),
  selfRank: document.getElementById("selfRank"),
  playerName: document.getElementById("playerName"),
  coinBalance: document.getElementById("coinBalance"),
  checkInStatus: document.getElementById("checkInStatus"),
  checkInBtn: document.getElementById("checkInBtn"),
  betAmount: document.getElementById("betAmount"),
  betBtn: document.getElementById("betBtn"),
  diceBox: document.getElementById("diceBox"),
  resultText: document.getElementById("resultText"),
  systemLog: document.getElementById("systemLog"),
  portalLock: document.getElementById("portalLock"),
  sessionStatus: document.getElementById("sessionStatus"),
  coinShopToggle: document.getElementById("coinShopToggle"),
  coinShopPanel: document.getElementById("coinShopPanel"),
  coinShopClose: document.getElementById("coinShopClose")
};

const choiceButtons = Array.from(document.querySelectorAll(".choice-button"));
const amountButtons = Array.from(document.querySelectorAll(".amount-shortcuts button"));

function div(className, text) {
  const node = document.createElement("div");
  node.className = className;
  node.textContent = text;
  return node;
}

function rankValue(row) {
  return toInt(row.rank_position ?? row.rankPosition, 0);
}

function playerKeyOf(row) {
  return String(row.player_key ?? row.playerKey ?? "");
}

function createRankRow(row, playerKey) {
  const item = document.createElement("div");
  const isSelf = playerKeyOf(row) === playerKey;
  item.className = `rank-row${isSelf ? " self" : ""}`;
  item.append(
    div("rank-no", String(rankValue(row) || "--")),
    div("rank-name", row.display_name || row.displayName || "UNKNOWN"),
    div("rank-coin", formatCoins(row.coins))
  );
  return item;
}

export function setLog(message) {
  els.systemLog.textContent = message;
}

export function setBusyView(busy, locked) {
  const disabled = Boolean(busy || locked);
  els.checkInBtn.disabled = disabled;
  els.betBtn.disabled = disabled;
  choiceButtons.forEach((button) => {
    button.disabled = disabled;
  });
  amountButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

export function showLocked() {
  document.body.classList.add("locked");
  els.portalLock.classList.remove("hidden");
  els.sessionStatus.textContent = "LOCKED";
  els.playerName.textContent = "PORTAL REQUIRED";
  els.checkInStatus.textContent = "차단됨";
  els.selfRank.textContent = "포털 로그인 필요";
  setLog("867988 메인 포털 로그인 세션을 찾지 못했습니다.");
}

export function showActive() {
  document.body.classList.remove("locked");
  els.portalLock.classList.add("hidden");
  els.sessionStatus.textContent = "ACTIVE";
}

export function setPlayerName(name) {
  els.playerName.textContent = name;
}

export function renderProfile(profile) {
  if (!profile) return;
  els.playerName.textContent = profile.displayName;
  els.coinBalance.textContent = formatCoins(profile.coins);
  if (typeof profile.canCheckIn === "boolean") {
    els.checkInStatus.textContent = profile.canCheckIn ? "지급 가능" : "지급 완료";
  }
}

export function renderLeaderboard(rows, playerKey) {
  const list = Array.isArray(rows) ? rows : [];
  const topRows = list
    .filter((row) => rankValue(row) > 0 && rankValue(row) <= RANK_LIMIT)
    .sort((a, b) => rankValue(a) - rankValue(b));
  const selfRow = list.find((row) => playerKeyOf(row) === playerKey);

  if (!topRows.length) {
    const empty = document.createElement("div");
    empty.className = "rank-row";
    empty.append(div("rank-no", "--"), div("rank-name", "NO DATA"), div("rank-coin", "0"));
    els.rankList.replaceChildren(empty);
  } else {
    els.rankList.replaceChildren(...topRows.map((row) => createRankRow(row, playerKey)));
  }

  els.selfRank.textContent = selfRow ? `${rankValue(selfRow)}위 · ${formatCoins(selfRow.coins)} 코인` : "순위 산출 대기";
}

export function setChoiceView(side) {
  choiceButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.side === side);
  });
}

export function readBetAmount() {
  return toPositiveInt(els.betAmount.value);
}

export function writeBetAmount(value) {
  els.betAmount.value = value ? String(value) : "";
}

export function showResult(text, type) {
  els.resultText.textContent = text;
  els.resultText.classList.remove("win", "lose");
  if (type) els.resultText.classList.add(type);
}

export function setDiceValue(value) {
  els.diceBox.textContent = String(value || "?");
}

export function startDiceSpin() {
  let active = true;
  els.diceBox.classList.add("rolling");
  const timer = setInterval(() => {
    els.diceBox.textContent = String(Math.floor(Math.random() * 6) + 1);
  }, ROLL_SPIN_INTERVAL);

  return () => {
    if (!active) return;
    active = false;
    clearInterval(timer);
    els.diceBox.classList.remove("rolling");
  };
}

function setCoinShopOpen(open) {
  if (!els.coinShopPanel || !els.coinShopToggle) return;
  els.coinShopPanel.classList.toggle("hidden", !open);
  els.coinShopToggle.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("shop-open", open);
  if (open) els.coinShopClose?.focus({ preventScroll: true });
}

function toggleCoinShop() {
  setCoinShopOpen(els.coinShopPanel.classList.contains("hidden"));
}

export function bindViewEvents(handlers) {
  els.checkInBtn.addEventListener("click", handlers.checkIn);
  els.betBtn.addEventListener("click", handlers.placeBet);
  els.betAmount.addEventListener("input", handlers.amountInput);
  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => handlers.choice(button.dataset.side));
  });
  amountButtons.forEach((button) => {
    button.addEventListener("click", () => handlers.fillAmount(button.dataset.fill));
  });
  if (els.coinShopToggle && els.coinShopPanel) {
    els.coinShopToggle.addEventListener("click", toggleCoinShop);
    els.coinShopClose?.addEventListener("click", () => setCoinShopOpen(false));
    els.coinShopPanel.addEventListener("click", (event) => {
      if (event.target === els.coinShopPanel) setCoinShopOpen(false);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setCoinShopOpen(false);
    });
  }
}
