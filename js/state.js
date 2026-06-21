import { cleanName, toInt } from "./utils.js";

const state = {
  playerKey: "",
  displayName: "",
  coins: 0,
  selectedSide: "",
  busy: false,
  locked: false
};

export function getState() {
  return state;
}

export function setIdentity(identity) {
  state.playerKey = identity.playerKey;
  state.displayName = identity.displayName;
}

export function setBusy(value) {
  state.busy = Boolean(value);
}

export function setLocked(value) {
  state.locked = Boolean(value);
}

export function setSelectedSide(side) {
  state.selectedSide = side === "odd" || side === "even" ? side : "";
}

export function applyProfile(profile) {
  if (!profile || typeof profile !== "object") return null;

  const playerKey = String(profile.player_key || profile.playerKey || state.playerKey || "").trim();
  const displayName = cleanName(profile.display_name || profile.displayName || state.displayName || "");
  const coins = Math.max(0, toInt(profile.coins, state.coins));
  const hasCheckIn = Object.prototype.hasOwnProperty.call(profile, "can_check_in") || Object.prototype.hasOwnProperty.call(profile, "canCheckIn");

  state.playerKey = playerKey;
  state.displayName = displayName;
  state.coins = coins;

  return {
    playerKey,
    displayName,
    coins,
    canCheckIn: hasCheckIn ? Boolean(profile.can_check_in ?? profile.canCheckIn) : undefined,
    alreadyChecked: Boolean(profile.already_checked ?? profile.alreadyChecked),
    diceValue: profile.dice_value ?? profile.diceValue,
    payout: profile.payout,
    won: Boolean(profile.won)
  };
}
