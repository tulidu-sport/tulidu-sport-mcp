#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { login, clearCredentials, getValidAccessToken } from './auth.js';
import {
  listTournaments,
  getTournament,
  getTournamentGames,
  getLeaderboard,
  getMyPredictions,
  getMyProfile,
  getMyTournaments,
  getMatchStats,
  getMatchEvents,
  getHeadToHead,
  getTeamStats,
  makePrediction,
  NotLoggedInError,
} from './api.js';

const server = new McpServer({
  name: 'tulidu-sport',
  version: '0.1.0',
});

function wrapTool(fn: () => Promise<unknown>) {
  return async () => {
    try {
      const result = await fn();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      if (e instanceof NotLoggedInError) {
        return { content: [{ type: 'text' as const, text: e.message }], isError: true };
      }
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
    }
  };
}

// Auth tools
server.tool('tulidu_login', 'Log in to Tulidu Sport via browser OAuth. Run this first if not authenticated.', {}, async () => {
  try {
    await login();
    return { content: [{ type: 'text', text: 'Logged in successfully.' }] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { content: [{ type: 'text', text: `Login failed: ${msg}` }], isError: true };
  }
});

server.tool('tulidu_logout', 'Log out from Tulidu Sport and remove local credentials.', {}, async () => {
  clearCredentials();
  return { content: [{ type: 'text', text: 'Logged out. Credentials removed.' }] };
});

server.tool('tulidu_status', 'Check whether you are currently logged in to Tulidu Sport.', {}, async () => {
  const token = await getValidAccessToken();
  const text = token ? 'Logged in.' : 'Not logged in. Run tulidu_login first.';
  return { content: [{ type: 'text', text }] };
});

// Tournament tools
server.tool('list_tournaments', 'List all available Tulidu Sport tournaments.', {}, wrapTool(listTournaments));

server.tool('get_tournament', 'Get details of a specific tournament.', { tournament_id: z.string() }, ({ tournament_id }) =>
  wrapTool(() => getTournament(tournament_id))(),
);

server.tool('list_my_tournaments', 'List tournaments the logged-in user has joined.', {}, wrapTool(getMyTournaments));

server.tool('get_tournament_games', 'List all games/fixtures in a tournament.', { tournament_id: z.string() }, ({ tournament_id }) =>
  wrapTool(() => getTournamentGames(tournament_id))(),
);

server.tool('get_leaderboard', 'Get the leaderboard rankings for a tournament.', { tournament_id: z.string() }, ({ tournament_id }) =>
  wrapTool(() => getLeaderboard(tournament_id))(),
);

server.tool('get_my_predictions', 'Get the logged-in user\'s predictions for a tournament.', { tournament_id: z.string() }, ({ tournament_id }) =>
  wrapTool(() => getMyPredictions(tournament_id))(),
);

// Profile
server.tool('get_my_profile', 'Get the logged-in user\'s profile including vCoin balance.', {}, wrapTool(getMyProfile));

// Game stats
server.tool('get_match_stats', 'Get live or final stats for a match (shots, possession, etc.).', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getMatchStats(game_id))(),
);

server.tool('get_match_events', 'Get events for a match (goals, cards, substitutions).', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getMatchEvents(game_id))(),
);

server.tool('get_head_to_head', 'Get historical head-to-head record for the two teams in a match.', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getHeadToHead(game_id))(),
);

server.tool('get_team_stats', 'Get season stats and recent form for a team.', { team_id: z.string() }, ({ team_id }) =>
  wrapTool(() => getTeamStats(team_id))(),
);

// Predictions (write)
server.tool(
  'make_prediction',
  'Submit or update a score prediction for a game. IMPORTANT: always confirm with the user before calling this — predictions affect their tournament score.',
  {
    game_id: z.string().describe('The game document ID'),
    home_score: z.number().int().min(0).describe('Predicted home team score'),
    away_score: z.number().int().min(0).describe('Predicted away team score'),
  },
  ({ game_id, home_score, away_score }) =>
    wrapTool(() => makePrediction(game_id, home_score, away_score))(),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
