import { SUPABASE_KEY, SUPABASE_URL } from "./config.js";
import { firstRow } from "./utils.js";

let db;

function client() {
  if (db) return db;
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Supabase client 로드 실패");
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return db;
}

async function rpc(name, params) {
  const { data, error } = await client().rpc(name, params);
  if (error) throw error;
  return data;
}

export async function fetchProfile(playerKey, displayName) {
  return firstRow(await rpc("vox_coin_profile", {
    p_player_key: playerKey,
    p_display_name: displayName
  }));
}

export async function fetchLeaderboard(playerKey) {
  const rows = await rpc("vox_coin_leaderboard", {
    p_player_key: playerKey
  });
  return Array.isArray(rows) ? rows : [];
}

export async function requestCheckIn(playerKey, displayName) {
  return firstRow(await rpc("vox_check_in", {
    p_player_key: playerKey,
    p_display_name: displayName
  }));
}

export async function requestBet(playerKey, displayName, side, amount) {
  return firstRow(await rpc("vox_roll_bet", {
    p_player_key: playerKey,
    p_display_name: displayName,
    p_side: side,
    p_amount: amount
  }));
}
