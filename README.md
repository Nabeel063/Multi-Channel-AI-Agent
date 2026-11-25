# Multi-Channel-AI-Agent

A multi-channel AI agent for a fictional real estate agency, built with **n8n**, **Google Gemini** and **Google Sheets**.

Customers can write on **website chat, email or Discord**. One automation receives every message, recognises the customer, keeps a single profile in a simulated CRM, replies with Gemini, and hands the conversation to a human broker when needed.

> All businesses, customers, listings and messages in this project are fictional. No real customer data or production systems are used.

<img width="1198" height="319" alt="image" src="https://github.com/user-attachments/assets/5c0f15f4-b2fd-4ef4-a0c3-c62eefde126b" />

## Features

- **Three channels, one system.** Website chat, Gmail and Discord share the same profile, knowledge base, AI instructions and business rules.
- **One customer, many channels.** Customers are matched by email, phone, Discord ID or website session.
- **Automatic duplicate merge.** If a second profile is created before the customer reveals their email, the profiles are merged into the oldest one and the duplicate row is deleted.
- **Lead qualification and scoring.** Budget, area, timeline and financing are collected and scored from 0 to 100.
- **Property matching with photos.** Gemini searches a Listings sheet through a tool and shares photo links.
- **Channel-appropriate replies.** Text and images on the website, plain text on Discord, HTML with inline photos by email.
- **Human handoff.** Complaints, requests for a person, commission, legal or tax questions, offers and qualified leads go to a broker with a summary.

## How it works
<img width="1773" height="861" alt="architecture" src="https://github.com/user-attachments/assets/a96827b1-6337-4a13-b932-a09a4493e6bf" />

1. A message arrives and is converted into one standard format.
2. The Customers sheet is searched for a match on email, phone, Discord ID or Web session.
3. The profile is created or updated. Duplicate rows are merged and deleted.
4. The prompt is built from the customer record and the knowledge base.
5. The Gemini agent answers as JSON, using the Search Listings tool and per-customer memory.
6. Code parses the answer, updates the profile and lead score, and decides whether to hand off.
7. The exchange is logged and the reply is sent on the same channel.

## Quick start

**Requirements:** n8n (self-hosted), a Google account (Sheets and Gmail), a Google Gemini API key, Node.js 18 or later.

1. **CRM.** Import the workbook for your version into Google Sheets (File, Import, Create new spreadsheet). Do not rename the tabs or header rows.
2. **Credentials.** In n8n, create credentials for Google Gemini, Google Sheets and Gmail.
3. **Workflow.** Import the workflow JSON. On every Google Sheets node choose your spreadsheet and tab, attach credentials, and set the broker email in the **Notify Broker** node. Pick a Gemini Flash model in **Gemini Chat Model**.
4. **Gmail.** Restrict the Gmail trigger to a dedicated label or mailbox so only test messages are answered.
5. **Activate** the workflow.
6. **Website chat.** Set `WEBHOOK_URL` in `website-chat-widget.html` to your n8n webhook, then open the file in a browser.
7. **Discord.** Create a bot in the Discord Developer Portal and enable **Message Content Intent**. Then run:

```
cd channels
npm install
set DISCORD_BOT_TOKEN=your_token
set N8N_WEBHOOK_URL=http://localhost:5678/webhook/haven-discord
node discord-relay-bot.js
```

On macOS or Linux use `export` instead of `set`. The bot reads environment variables, so never commit a token.

## Customer identity

Matching runs in this order and stops at the first priority that finds a profile:

| Priority | Identifier |
|---|---|
| 1 | Email address (sender, widget field, or typed in a message) |
| 2 | Phone number (last 10 digits) |
| 3 | Discord ID |
| 4 | Website session ID |

New identifiers only fill blank fields. Existing data is never overwritten. When a new identifier links two rows, the oldest profile is kept and the other row is merged into it and deleted.

## Documentation

Full documentation is in `Haven_Multi_Channel_AI_Agent.docx`: architecture, integrations, prompts, CRM schema, business logic & testing.

## License

MIT. See `LICENSE`.
