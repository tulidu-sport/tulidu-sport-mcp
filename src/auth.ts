import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import open from 'open';

const TULIDU_API = process.env.TULIDU_API_URL ?? 'https://api.tulidu.com';
const CREDENTIALS_PATH = path.join(os.homedir(), '.tulidu', 'credentials.json');

interface Credentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

function saveCredentials(creds: Credentials) {
  const dir = path.dirname(CREDENTIALS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function clearCredentials() {
  try {
    fs.unlinkSync(CREDENTIALS_PATH);
  } catch {}
}

async function refreshTokens(refreshToken: string): Promise<Credentials> {
  const res = await fetch(`${TULIDU_API}/api/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidAccessToken(): Promise<string | null> {
  const creds = loadCredentials();
  if (!creds) return null;

  // Refresh if expiring within 5 minutes
  if (Date.now() > creds.expiresAt - 5 * 60 * 1000) {
    try {
      const fresh = await refreshTokens(creds.refreshToken);
      saveCredentials(fresh);
      return fresh.accessToken;
    } catch {
      clearCredentials();
      return null;
    }
  }

  return creds.accessToken;
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function deriveCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function login(): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);
  const state = generateState();

  // Find a free port for the local callback server
  const port = await getFreePort();
  const redirectUri = `http://localhost:${port}/callback`;

  const authUrl = new URL('https://tulidu.com/mcp-auth');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log(`\nOpening browser for Tulidu login...`);
  console.log(`If the browser doesn't open, visit:\n${authUrl.toString()}\n`);

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      if (url.pathname !== '/callback') return;

      const returnedState = url.searchParams.get('state');
      const returnedCode = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      if (error || returnedState !== state || !returnedCode) {
        res.end('<html><body><h2>Access denied. You can close this tab.</h2></body></html>');
        server.close();
        reject(new Error(error ?? 'Invalid callback'));
        return;
      }

      res.end('<html><body><h2>Login successful! You can close this tab.</h2></body></html>');
      server.close();
      resolve(returnedCode);
    });

    server.listen(port, () => void open(authUrl.toString()));
    server.on('error', reject);
    setTimeout(() => { server.close(); reject(new Error('Login timed out after 5 minutes')); }, 5 * 60 * 1000);
  });

  const res = await fetch(`${TULIDU_API}/api/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };

  saveCredentials({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  console.log('Login successful. Credentials saved to ~/.tulidu/credentials.json');
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, () => {
      const addr = server.address();
      server.close(() => resolve((addr as { port: number }).port));
    });
    server.on('error', reject);
  });
}
