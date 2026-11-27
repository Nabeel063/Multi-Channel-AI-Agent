const { Client, GatewayIntentBits } = require('discord.js');

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/haven-discord';

if (!DISCORD_BOT_TOKEN || DISCORD_BOT_TOKEN.includes('your_discord_bot_token')) {
  console.warn('⚠️ DISCORD_BOT_TOKEN is not configured. Discord relay bot will not start until configured.');
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

client.on('ready', () => {
  console.log(`✅ Haven Discord Relay Bot logged in as ${client.user.tag}`);
  console.log(`📡 Relay target: ${N8N_WEBHOOK_URL}`);
});

client.on('messageCreate', async (message) => {
  // Ignore messages sent by bots (including ourselves)
  if (message.author.bot) return;

  // Trim and check content
  const content = message.content ? message.content.trim() : '';
  if (!content) return;

  try {
    const payload = {
      message: content,
      username: message.author.username,
      discord_id: message.author.id,
      channel_id: message.channel.id,
      message_id: message.id
    };

    // Forward to n8n webhook
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`n8n webhook responded with status ${res.status}: ${res.statusText}`);
      return;
    }

    const data = await res.json();
    if (data && data.reply) {
      // Split reply if longer than Discord's 2000 character limit
      const replyText = data.reply;
      if (replyText.length <= 2000) {
        await message.reply(replyText);
      } else {
        const chunks = replyText.match(/[\s\S]{1,1950}/g) || [replyText];
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      }

      // If there are property images returned, post them as links
      if (Array.isArray(data.images) && data.images.length > 0) {
        for (const imgUrl of data.images) {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
            await message.channel.send(imgUrl);
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to relay message to n8n:', err.message);
  }
});

client.login(DISCORD_BOT_TOKEN).catch((err) => {
  console.error('Discord login error:', err.message);
  process.exit(1);
});
