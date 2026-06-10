import { getValidAccessToken } from './auth.js';

const TULIDU_API = process.env.TULIDU_API_URL ?? 'https://api.tulidu.com';

export class NotLoggedInError extends Error {
  constructor() {
    super('Not logged in. Run /tulidu-login first.');
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = await getValidAccessToken();
  if (!token) throw new NotLoggedInError();

  const res = await fetch(`${TULIDU_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) throw new NotLoggedInError();
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function listTournaments() {
  return apiFetch('/api/tournaments');
}

export async function getTournament(tournamentId: string) {
  return apiFetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`);
}

export async function getTournamentGames(tournamentId: string) {
  return apiFetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/fixtures`);
}

export async function getLeaderboard(tournamentId: string) {
  return apiFetch(`/api/leaderboards/tournament/${encodeURIComponent(tournamentId)}`);
}

export async function getMyPredictions(tournamentId: string) {
  return apiFetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/guesses/me`);
}

export async function getMyProfile() {
  return apiFetch('/api/me');
}

export async function getMyTournaments() {
  return apiFetch('/api/leaderboards/mine');
}

export async function getMatchStats(gameId: string) {
  return apiFetch(`/api/games/${encodeURIComponent(gameId)}/stats`);
}

export async function getMatchEvents(gameId: string) {
  return apiFetch(`/api/games/${encodeURIComponent(gameId)}/events`);
}

export async function getMatchLineup(gameId: string) {
  return apiFetch(`/api/games/${encodeURIComponent(gameId)}/lineup`);
}

export async function getHeadToHead(gameId: string) {
  return apiFetch(`/api/games/${encodeURIComponent(gameId)}/headtohead`);
}

export async function getLeagueStandings(leagueId: string) {
  return apiFetch(`/api/leagues/${encodeURIComponent(leagueId)}/standings`);
}

export async function getTeamStats(teamId: string) {
  return apiFetch(`/api/teams/${encodeURIComponent(teamId)}/page`);
}

export async function makePrediction(gameId: string, homeScore: number, awayScore: number) {
  return apiFetch('/api/predictions', {
    method: 'POST',
    body: JSON.stringify({ gameId, homeScore, awayScore }),
  });
}
