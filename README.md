# Tulidu Sport MCP: World Cup, Team Stats, and Tournament Predictions for AI

Connect Claude, Codex, and other MCP clients to [Tulidu Sport](https://tulidu.com) so your AI assistant can explore World Cup games, tournament fixtures, team form, head-to-head records, live match stats, leaderboards, vCoin profile data, and your score predictions.

Use it to ask questions like "what World Cup games are coming up?", "is there a live game right now?", "show the live events and stats for this match", "which predictions am I missing?", "show my tournament leaderboard", or "give me team stats before I predict this match."

## Requirements

- Node.js 18 or newer
- `npx` available on your PATH
- A browser available for Tulidu OAuth login
- Network access to `https://tulidu.com` and `https://api.tulidu.com`

## Installation: Claude Desktop

Add this to your Claude Desktop config.

Mac:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Config:

```json
{
  "mcpServers": {
    "tulidu": {
      "command": "npx",
      "args": ["-y", "tulidu-sport-mcp"]
    }
  }
}
```

Restart Claude Desktop, then ask Claude to run:

```text
tulidu_login
```

A browser window opens at `https://tulidu.com/mcp-auth`. Sign in, allow access, and return to Claude.

Verify the connection:

```text
tulidu_status
list_my_tournaments
```

## Installation: Codex

Add this to your Codex config.

Config path:

```text
~/.codex/config.toml
```

Config:

```toml
[mcp_servers.tulidu]
command = "npx"
args = ["-y", "tulidu-sport-mcp"]
```

Restart Codex, then ask Codex to run:

```text
tulidu_login
```

A browser window opens at `https://tulidu.com/mcp-auth`. Sign in, allow access, and return to Codex.

Verify the connection:

```text
tulidu_status
list_my_tournaments
```

## Local or Staging API

By default, the MCP server uses:

```text
https://api.tulidu.com
```

To point it at another API, set `TULIDU_API_URL` in the MCP server environment.

Claude Desktop example:

```json
{
  "mcpServers": {
    "tulidu": {
      "command": "npx",
      "args": ["-y", "tulidu-sport-mcp"],
      "env": {
        "TULIDU_API_URL": "http://127.0.0.1:3001"
      }
    }
  }
}
```

Codex example:

```toml
[mcp_servers.tulidu]
command = "npx"
args = ["-y", "tulidu-sport-mcp"]

[mcp_servers.tulidu.env]
TULIDU_API_URL = "http://127.0.0.1:3001"
```

## Available Tools

| Tool | Description |
|---|---|
| `tulidu_login` | Log in via browser OAuth |
| `tulidu_logout` | Remove local Tulidu credentials |
| `tulidu_status` | Check whether you are logged in |
| `list_tournaments` | List all available tournaments |
| `get_tournament` | Get tournament details |
| `list_my_tournaments` | List tournaments the logged-in user joined |
| `get_tournament_games` | List games/fixtures in a tournament |
| `get_leaderboard` | Get tournament rankings |
| `get_my_predictions` | Get your submitted predictions for a tournament |
| `get_my_profile` | Get your profile and vCoin balance |
| `get_match_events` | Game tab: goals, cards, substitutions, penalties, and match timeline events |
| `get_match_stats` | Game tab: live or final match stats such as possession, shots, corners, fouls, saves, and pass accuracy |
| `get_match_lineup` | Game tab: formations, coaches, starting XI, and substitutes |
| `get_league_standings` | Game tab: league standings table for the fixture league |
| `get_head_to_head` | Game tab: historical head-to-head record for the two teams |
| `get_team_stats` | Get season stats and recent form for a team |
| `make_prediction` | Submit or update a score prediction |

## Game Detail Tabs

Tulidu game pages have five useful tabs. The MCP exposes each one directly:

- Events: use `get_match_events` for live or finished match timelines. Scheduled games may return no events yet.
- Stats: use `get_match_stats` for live or final match statistics. Scheduled games may not have stats until kickoff.
- Lineup: use `get_match_lineup` for formations, coaches, starting XI, and substitutes. Lineups are usually available close to kickoff, live, or after kickoff.
- Standings: use `get_league_standings` with the fixture `leagueId` from `get_tournament_games`.
- History: use `get_head_to_head` before predictions or whenever the user asks about previous meetings between the teams.

The MCP also includes prompt templates such as `inspect_game_tabs` and `prepare_match_prediction_context` for clients that surface MCP prompts.

## Write Tool Safety

`make_prediction` changes real tournament predictions and can affect tournament scoring. Assistants should ask for explicit user confirmation before calling it.

## Credentials

After login, credentials are stored locally at:

```text
~/.tulidu/credentials.json
```

The access token refreshes automatically. To clear credentials, run:

```text
tulidu_logout
```

## Troubleshooting

If the browser does not open, copy the login URL printed by the MCP server and open it manually.

If login times out, run `tulidu_login` again. The OAuth flow waits up to 5 minutes.

If tools say you are not logged in, run `tulidu_status`. If needed, run `tulidu_logout` and then `tulidu_login`.

If `npx` cannot find the package, confirm Node.js 18+ is installed and that your MCP client can access the npm registry.

## License

MIT
