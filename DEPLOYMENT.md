# Haven Multi-Channel AI Agent - Server Deployment Guide

This guide walks you through deploying the **Multi-Channel AI Agent** on your Linux VPS (Ubuntu/Debian) using Docker Compose and Caddy (for automated SSL certificates).

---

## 1. Prerequisites

1. **A Linux Server/VPS** (Ubuntu 22.04 or 24.04 LTS, min 2GB RAM).
2. **Domain Name**: A DNS A record pointing to your server IP (e.g. `n8n.yourdomain.com`).
3. **Docker & Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
4. **API Keys & Credentials**:
   - **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
   - **Google Cloud Console Project** with **Google Sheets API** and **Gmail API** enabled, and an **OAuth 2.0 Client ID**.
   - **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications) (if using Discord).

---

## 2. Server Setup & Configuration

### Step 1: Clone or Copy Project Files to the Server
```bash
git clone https://github.com/Nabeel063/Multi-Channel-AI-Agent.git /opt/haven-agent
cd /opt/haven-agent
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
nano .env
```
Set your domain and tokens:
```env
DOMAIN_NAME=n8n.yourdomain.com
PROTOCOL=https
WEBHOOK_URL=https://n8n.yourdomain.com/
TIMEZONE=UTC

# Discord Bot Token (optional, if using Discord relay)
DISCORD_BOT_TOKEN=your_token_here
```

### Step 3: Start Services
```bash
docker compose up -d --build
```
Check status:
```bash
docker compose ps
docker compose logs -f
```
Caddy will automatically provision a Let's Encrypt SSL certificate for your domain.

---

## 3. Google Sheets CRM Setup

1. Open [Google Sheets](https://sheets.new) and create a spreadsheet titled **Haven_CRM**.
2. Create 5 sheets (tabs) with the exact names:
   - `Customers`
   - `Listings`
   - `KnowledgeBase`
   - `Conversations`
   - `Handoffs`
3. Import the corresponding CSV templates from the `crm_sheets/` folder:
   - File -> Import -> Upload `crm_sheets/Customers.csv` -> Replace current sheet.
   - Repeat for `Listings.csv`, `KnowledgeBase.csv`, `Conversations.csv`, and `Handoffs.csv`.
4. Copy your Google Sheet ID from the browser URL:
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

---

## 4. Google Cloud Console & OAuth Configuration

1. In Google Cloud Console, enable **Google Sheets API** and **Gmail API**.
2. Create an **OAuth 2.0 Client ID** (Web application):
   - **Authorized redirect URIs**: `https://n8n.yourdomain.com/rest/oauth2-credential/callback`
3. Note your **Client ID** and **Client Secret**.

---

## 5. Configure n8n Workflow

1. Open `https://n8n.yourdomain.com` in your browser and complete the initial account setup.
2. In n8n, create your credentials:
   - **Google Gemini(PaLM) API**: Enter your Gemini API key.
   - **Google Sheets OAuth2 API**: Enter Client ID & Secret, click "Connect my account".
   - **Gmail OAuth2 API**: Enter Client ID & Secret, click "Connect my account".
3. Import the workflow:
   - Click **Add Workflow** -> **Import from File** -> select `Multi-Channel AI Agent.json`.
4. Update Node Parameters:
   - On each Google Sheets node (`Get Customers`, `Upsert Customer`, `Get Knowledge Base`, `Search Listings`, `Update Customer Profile`, `Log Conversation`, `Log Handoff`, `Find Duplicate Row`, `Delete Duplicate Row`):
     - Select your **Google Sheets account** credential.
     - Choose your **Haven_CRM** spreadsheet.
   - In **Notify Broker** (Gmail node):
     - Set `To` email to your broker inbox (where qualified leads and alerts should arrive).
   - In **Gemini Chat Model** node:
     - Select your Gemini credential and choose `gemini-1.5-flash` or `gemini-2.0-flash`.
5. Click **Save** and toggle workflow to **Active**.

---

## 6. Channel Setup

### Channel 1: Website Chat Widget
- Open `haven-chat-widget.html`.
- Either change line 40 to `https://n8n.yourdomain.com/webhook/haven-website-chat`, or simply open the file in your browser with the URL parameter:
  ```
  haven-chat-widget.html?webhook=https://n8n.yourdomain.com/webhook/haven-website-chat
  ```

### Channel 2: Discord Bot
1. In [Discord Developer Portal](https://discord.com/developers/applications):
   - Create an Application -> Bot.
   - Under **Privileged Gateway Intents**, enable **Message Content Intent**.
   - Copy the bot token into your `.env` as `DISCORD_BOT_TOKEN`.
   - Under **OAuth2 -> URL Generator**, select `bot` scope with permissions `Send Messages`, `Read Messages/View Channels`, and invite the bot to your server.
2. Restart the discord relay container:
   ```bash
   docker compose restart discord-relay
   ```

### Channel 3: Email (Gmail)
- In the `Email Trigger (Gmail)` node in n8n, optionally set a filter label (e.g. `label:HavenInquiries`) so only dedicated customer messages trigger the workflow.

---

## 7. Testing & Verification

1. **Website Chat Test**:
   Send a message via `haven-chat-widget.html` -> Check n8n execution log -> Verify customer record in Google Sheets.
2. **Discord Test**:
   Send a message in your Discord channel -> Bot should respond with property recommendations and photos.
3. **Email Test**:
   Send an email to your connected Gmail address -> Workflow replies in thread with HTML formatted text and photos.
4. **Lead Qualification & Broker Handoff**:
   State your budget, neighborhood, and request a viewing -> Verify entry added to `Handoffs` tab and email sent to broker.
