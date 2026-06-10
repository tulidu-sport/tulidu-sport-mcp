# tulidu-sport-mcp

MCP server for [Tulidu Sport](https://app.tulidu.com) — lets AI tools like Claude, Cursor, and Windsurf query your tournaments, leaderboards, predictions, and match stats.

> **Work in progress.** Auth flow is implemented; tools are being added.

## Setup (Claude Desktop)

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "tulidu": {
      "command": "npx",
      "args": ["-y", "@tulidu/mcp"]
    }
  }
}
```

Restart Claude Desktop, then ask Claude to run `tulidu_login` to authenticate.

## Available tools

| Tool | Description |
|---|---|
| `tulidu_login` | Open browser to log in |
| `tulidu_logout` | Remove local credentials |
| `tulidu_status` | Check login status |
| `list_tournaments` | List all tournaments |
| `get_tournament` | Get tournament details |
| `list_my_tournaments` | Tournaments you've joined |
| `get_tournament_games` | Games in a tournament |
| `get_leaderboard` | Tournament rankings |
| `get_my_predictions` | Your submitted predictions |
| `get_my_profile` | Your profile + vCoin balance |
| `get_match_stats` | Live/final match stats |
| `get_match_events` | Goals, cards, subs |
| `get_head_to_head` | H2H record for a match |
| `get_team_stats` | Team season form |
| `make_prediction` | Submit a score prediction |

## Credentials

After login, credentials are stored at `~/.tulidu/credentials.json` (access token + refresh token). The access token refreshes automatically.

## License

MIT
