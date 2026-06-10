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
  getMatchLineup,
  getHeadToHead,
  getLeagueStandings,
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

// Game detail tabs
server.tool('get_match_events', 'Game tab: events. Get match timeline events such as goals, cards, substitutions, penalties, players, assists, and elapsed minute. Best for live or finished games; scheduled games may return an empty list.', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getMatchEvents(game_id))(),
);

server.tool('get_match_stats', 'Game tab: stats. Get live or final match stats such as possession, shots, corners, fouls, offsides, yellow cards, saves, pass accuracy, and elapsed minute. Use for live or finished games; scheduled games may have no stats yet.', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getMatchStats(game_id))(),
);

server.tool('get_match_lineup', 'Game tab: lineup. Get confirmed lineups, formations, coaches, starting XI, and substitutes for both teams. Use close to kickoff, live, or after kickoff; scheduled games may return no lineup yet.', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getMatchLineup(game_id))(),
);

server.tool('get_league_standings', 'Game tab: standings. Get standings table for a league, including rank, points, played, wins, draws, losses, goals, and form. Use the leagueId from a fixture returned by get_tournament_games or live game lists.', { league_id: z.string() }, ({ league_id }) =>
  wrapTool(() => getLeagueStandings(league_id))(),
);

server.tool('get_head_to_head', 'Game tab: history. Get historical head-to-head record for the two teams in a match. Use before predictions or when the user asks about past meetings/history between teams.', { game_id: z.string() }, ({ game_id }) =>
  wrapTool(() => getHeadToHead(game_id))(),
);

server.tool('get_team_stats', 'Get season stats and recent form for a team.', { team_id: z.string() }, ({ team_id }) =>
  wrapTool(() => getTeamStats(team_id))(),
);

server.registerPrompt(
  'inspect_game_tabs',
  {
    title: 'Inspect Tulidu game tabs',
    description: 'Use the right Tulidu MCP tools for a game detail page: events, stats, lineup, standings, and history.',
    argsSchema: {
      game_id: z.string().describe('Game document ID from get_tournament_games, for example a tournament fixture id or game doc id.'),
      league_id: z.string().optional().describe('League ID from the fixture. Required for standings.'),
    },
  },
  ({ game_id, league_id }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Inspect Tulidu game ${game_id}.`,
            'Use these game-tab tools when relevant:',
            '- Events: call get_match_events for goals, cards, substitutions, penalties, players, assists, and elapsed minutes. Best for live/finished games; scheduled games may be empty.',
            '- Stats: call get_match_stats for possession, shots, corners, fouls, offsides, cards, saves, pass accuracy, and elapsed minute. Best for live/finished games; scheduled games may not have stats yet.',
            '- Lineup: call get_match_lineup for formations, coaches, starting XI, and substitutes. Usually available close to kickoff, live, or after kickoff.',
            league_id
              ? `- Standings: call get_league_standings with league_id ${league_id} for the league table.`
              : '- Standings: first get the fixture leagueId, then call get_league_standings for the league table.',
            '- History: call get_head_to_head for previous meetings between the teams.',
            'If a tab has no data yet, say it is not available yet and explain when it is normally available.',
          ].join('\n'),
        },
      },
    ],
  }),
);

server.registerPrompt(
  'prepare_match_prediction_context',
  {
    title: 'Prepare Tulidu match prediction context',
    description: 'Collect the useful game tabs before helping a user decide a score prediction.',
    argsSchema: {
      game_id: z.string().describe('Game document ID from get_tournament_games.'),
      league_id: z.string().optional().describe('League ID from the fixture, used for standings.'),
    },
  },
  ({ game_id, league_id }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Prepare prediction context for Tulidu game ${game_id}.`,
            'Before suggesting a prediction, gather available context:',
            '1. get_head_to_head for history between the two teams.',
            '2. get_match_lineup if kickoff is near, live, or already started.',
            '3. get_match_stats and get_match_events if the game is live or finished.',
            league_id ? `4. get_league_standings with league_id ${league_id}.` : '4. get_league_standings after finding the fixture leagueId.',
            '5. get_team_stats for each team when team IDs are available and accepted by the API.',
            'Do not call make_prediction unless the user explicitly confirms the exact score.',
          ].join('\n'),
        },
      },
    ],
  }),
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
