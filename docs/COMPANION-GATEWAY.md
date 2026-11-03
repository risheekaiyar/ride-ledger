# Authenticated native companion gateway

`scripts/companion-server.cjs` supplies a single-owner HTTPS API for the Android companion. It is separate from the local web preview server. No deployment is performed by this repository.

Requirements: Node 24, a trusted TLS certificate and key, a persistent writable directory, a Meta API key, and a randomly generated client bearer token containing at least 32 characters of high entropy (hex or URL-safe base64, without padding). Configure credentials securely; never commit them. The client token is not the Meta provider key.

Server configuration:
- `ODO_META_API_KEY`: server-only provider key.
- `ODO_CLIENT_TOKEN_SHA256`: hexadecimal SHA-256 digest of the client token. The server stores only this digest in configuration.
- `ODO_TLS_CERT_FILE`, `ODO_TLS_KEY_FILE`: certificate chain and private key file paths. The client must trust the certificate; TLS verification must remain enabled.
- `ODO_QUOTA_FILE`: persistent SQLite database path outside the checkout. Do not delete this file to restart the service.
- `ODO_LIFETIME_REQUEST_LIMIT`: explicit total request allowance, 1–10000. Previously reserved requests remain consumed across restarts. Increasing this limit is an explicit administrative budget change.
- `ODO_GATEWAY_HOST`, `ODO_GATEWAY_PORT`: defaults are loopback and 8443. Bind a reachable interface only as part of a deliberate secured deployment.

Run `node scripts/companion-server.cjs`. Native clients send the client token as `Authorization: Bearer …` to `GET /api/muse/status` and `POST /api/muse/insights`. Browser Origin/Fetch-Metadata requests are rejected, and no CORS permission is granted. The loopback web server retains its existing same-origin API.

The gateway reserves requests in a SQLite transaction before contacting Meta. Failures still consume an allowance because provider billing may already have occurred. Multiple connections share the reservation count. This is a persistent request cap, not a dollar cap: output tokens are separately bounded by the runtime. Restoring an older database snapshot can restore old quota state; keep the live database durable and never deploy multiple hosts with separate copies of the quota file. Multi-user accounts, rotation UI and distributed billing controls are not implemented.

The server does not log request bodies, tokens or provider responses. Use only Meta models. The current model remains `muse-spark-1.3`.

Tests use an ephemeral self-signed certificate trusted explicitly by the test client, a synthetic bearer token, a temporary database and a mocked provider. They do not disable TLS verification or call Meta.

## Android connection and overlay

In Odo Settings, choose **Configure secure connection** and enter the HTTPS gateway authority (no path/query) and client token. The Meta provider key must never be entered in the phone. The native client verifies the normal platform TLS trust chain, rejects redirects, bounds request/response sizes and encrypts the token using an Android Keystore AES-GCM key. Disconnect clears the stored endpoint and encrypted token.

Enable the companion bubble in Settings, grant display-over-other-apps permission, then enable it again. Drag the bubble to move it; tap to expand chat. The expanded window has a drag handle, full-app button, collapse control and close control. The foreground notification also dismisses the service. Revoking overlay permission stops the service. The overlay reads the same local ride journal through app-owned WebView assets and exposes only the companion transport bridge. No recorder bridge or remote page is loaded in the overlay. Use it after parking.

`node scripts/overlay-smoke.cjs` tests the narrow overlay layout and a simulated native bridge in Chromium. Device validation remains outstanding: Android Keystore persistence, gateway certificate trust, foreground-service lifecycle, overlay gestures, soft keyboard, rotation, task switching and permission revocation. No device or production deployment is implied by the browser tests.
