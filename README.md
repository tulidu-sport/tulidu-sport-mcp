# Tulidu Sport MCP: World Cup, Team Stats, and Tournament Predictions for AI

Connect Claude, Codex, and other MCP clients to [Tulidu Sport](https://tulidu.com) so your AI assistant can explore World Cup games, tournament fixtures, team form, head-to-head records, live match stats, leaderboards, vCoin profile data, and your score predictions.

Use it to ask questions like "what World Cup games are coming up?", "which predictions am I missing?", "show my tournament leaderboard", or "give me team stats before I predict this match."

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
| `get_match_stats` | Get live or final match stats |
| `get_match_events` | Get goals, cards, substitutions, and match events |
| `get_head_to_head` | Get historical head-to-head record for a match |
| `get_team_stats` | Get season stats and recent form for a team |
| `make_prediction` | Submit or update a score prediction |

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
