import { PORTAL_STORAGE_KEY, ROLL_MIN_DURATION } from "./config.js";
import { fetchLeaderboard, fetchProfile, requestBet, requestCheckIn } from "./api.js";
import { loadPortalIdentity } from "./session.js";
import { applyProfile, getState, setBusy, setIdentity, setLocked, setSelectedSide } from "./state.js";
import { delay, errorText, formatCoins } from "./utils.js";
import {
  bindViewEvents,
  readBetAmount,
  renderLeaderboard,
  renderProfile,
  setBusyView,
  setChoiceView,
  setDiceValue,
  setLog,
  setPlayerName,
  showActive,
  showLocked,
  showResult,
  startDiceSpin,
  writeBetAmount
} from "./view.js";

function syncBusy(value) {
  setBusy(value);
  const state = getState();
  setBusyView(state.busy, state.locked);
}

function lockTerminal() {
  setLocked(true);
  syncBusy(false);
  showLocked();
  setBusyView(false, true);
}

function unlockTerminal() {
  setLocked(false);
  showActive();
  setBusyView(false, false);
}

function updateProfile(profile) {
  const current = applyProfile(profile);
  renderProfile(current);
  return current;
}

async function refreshLeaderboard() {
  const state = getState();
  const rows = await fetchLeaderboard(state.playerKey);
  renderLeaderboard(rows, state.playerKey);
}

async function refreshProfile() {
  const state = getState();
  const profile = await fetchProfile(state.playerKey, state.displayName);
  updateProfile(profile);
}

async function checkIn() {
  const state = getState();
  if (state.busy || state.locked) return;

  syncBusy(true);
  try {
    const profile = await requestCheckIn(state.playerKey, state.displayName);
    const current = updateProfile(profile);
    setLog(current.alreadyChecked ? "오늘의 출석 보상은 이미 지급되었습니다." : "출석 처리 완료. 10,000 코인이 지급되었습니다.");
    await refreshLeaderboard();
  } catch (error) {
    setLog(`출석 처리 실패: ${errorText(error)}`);
  } finally {
    syncBusy(false);
  }
}

async function placeBet() {
  const state = getState();
  if (state.busy || state.locked) return;

  const amount = readBetAmount();
  if (!state.selectedSide) {
    setLog("홀 또는 짝을 선택하십시오.");
    return;
  }
  if (!amount) {
    setLog("배팅 금액을 입력하십시오.");
    return;
  }
  if (amount > state.coins) {
    setLog("보유 코인보다 큰 금액은 배팅할 수 없습니다.");
    return;
  }

  syncBusy(true);
  showResult("주사위 굴림 중", "");
  const stopSpin = startDiceSpin();

  try {
    const [result] = await Promise.all([
      requestBet(state.playerKey, state.displayName, state.selectedSide, amount),
      delay(ROLL_MIN_DURATION)
    ]);
    stopSpin();
    setDiceValue(result.dice_value ?? result.diceValue);
    const current = updateProfile(result);
    const sideName = state.selectedSide === "odd" ? "홀" : "짝";

    if (current.won) {
      showResult(`승리 · ${sideName} 적중`, "win");
      setLog(`주사위 ${current.diceValue}. ${formatCoins(current.payout)} 코인 보상 처리 완료.`);
    } else {
      showResult(`패배 · ${sideName} 실패`, "lose");
      setLog(`주사위 ${current.diceValue}. ${formatCoins(amount)} 코인이 차감되었습니다.`);
    }

    await refreshLeaderboard();
  } catch (error) {
    stopSpin();
    const message = errorText(error);
    setLog(message.includes("NOT_ENOUGH_COINS") ? "코인이 부족합니다." : `배팅 처리 실패: ${message}`);
  } finally {
    syncBusy(false);
  }
}

function chooseSide(side) {
  const state = getState();
  if (state.locked) return;
  setSelectedSide(side);
  setChoiceView(getState().selectedSide);
}

function fillAmount(type) {
  const state = getState();
  if (state.locked) return;

  if (state.coins <= 0) {
    writeBetAmount("");
    setLog("사용 가능한 코인이 없습니다. 출석 보상을 먼저 확인하십시오.");
    return;
  }

  const fixedAmount = Number(type);
  const amount = type === "half"
    ? Math.floor(state.coins / 2)
    : type === "max"
      ? state.coins
      : fixedAmount;

  writeBetAmount(Math.min(Math.max(1, amount), state.coins));
}

function normalizeAmountInput() {
  writeBetAmount(readBetAmount());
}

async function boot() {
  bindViewEvents({
    checkIn,
    placeBet,
    choice: chooseSide,
    fillAmount,
    amountInput: normalizeAmountInput
  });

  window.addEventListener("storage", (event) => {
    if (event.key === PORTAL_STORAGE_KEY) location.reload();
  });

  const identity = loadPortalIdentity();
  if (!identity) {
    lockTerminal();
    return;
  }

  setIdentity(identity);
  setPlayerName(identity.displayName);
  unlockTerminal();

  syncBusy(true);
  try {
    await refreshProfile();
    await refreshLeaderboard();
    setLog("포털 세션 확인 완료. 배팅 터미널이 활성화되었습니다.");
  } catch (error) {
    setLog(`Supabase 연결 실패: ${errorText(error)}`);
  } finally {
    syncBusy(false);
  }
}

boot();
