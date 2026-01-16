# ⚡ Disposable Email Service

A high-performance, self-hosted, lightweight disposable email service.
Built with **Node.js (Fastify)**, **SQLite**, and **Svelte**.

**100% Open Source | Local First | No Paid APIs**

---

## 🚀 Features

- **Instant Inbox**: Generate random email addresses instantly.
- **Real-time Updates**: Emails appear instantly without refreshing (SSE).
- **Raw & HTML Support**: View full email content safely.
- **Privacy Focused**: Runs locally, data stored in SQLite.
- **Lightweight**: Minimal memory footprint.
- **SMTP Server Included**: Receives emails directly on port 2525 (configurable).

## 🛠 Tech Stack

- **Backend**: Node.js, Fastify, SMTP-Server, SQLite (`better-sqlite3`).
- **Frontend**: Svelte 5, Tailwind CSS, Vite.
- **Deployment**: Docker, Docker Compose.

## 🌐 Custom Domain (DNS Setup)

To use your own domain (e.g., `develo.in`), configure the following DNS records:

1.  **A Record**: Point `mail.develo.in` (or your root domain) to your server's public IP.
2.  **MX Record**:
    - **Type**: MX
    - **Name**: `@` (or `develo.in`)
    - **Mail Server**: `mail.develo.in` (or your server IP/hostname)
    - **Priority**: 10
3.  **SPF Record** (TXT): `v=spf1 mx ~all` (Allows your server to receive/send valid mail).

**Important**: Ensure Port 25 (or 2525) is open on your firewall.

## 🏁 Quick Start

### 1. Docker (Recommended)

```bash
docker-compose up -d --build
```
Access the app at `http://localhost:3000`.
Send test emails to `anything@localhost` (ensure your SMTP client uses port 2525).

### 2. Local Development

**Prerequisites:** Node.js v18+.

#### Backend
```bash
cd backend
npm install
npm start
```
*Server runs on port 3000, SMTP on 2525.*

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on port 5173 (proxies to backend).*

## ⚙️ Configuration

Environment variables can be set in `.env` or Docker.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP API Port |
| `SMTP_PORT` | 2525 | SMTP Listening Port |
| `SMTP_DOMAIN` | localhost | Domain for email generation |
| `DB_PATH` | emails.db | Path to SQLite database |
| `EMAIL_RETENTION_MINUTES` | 60 | Auto-delete emails older than X mins |

## 🏗 Architecture

1. **SMTP Listener**: The Node.js application listens on port 2525 using `smtp-server`. It parses incoming raw email streams and extracts sender, recipient, subject, and body.
2. **Storage**: Parsed emails are stored synchronously in a local SQLite database file.
3. **API**: The Fastify HTTP server exposes endpoints to create inboxes and fetch emails.
4. **Real-time**: When an email is received, the SMTP layer emits an event. The API layer (monitoring this event) streams the new email to connected clients via Server-Sent Events (SSE).

## 🛡 Security Notes

- **Input Sanitization**: HTML emails are rendered in a sandboxed `iframe` to prevent XSS.
- **Rate Limiting**: Not enabled by default (add fastify-rate-limit for public deployment).
- **SMTP**: This is an open relay for *incoming* mail only. It does not send outbound mail.

## 📄 License

MIT.
