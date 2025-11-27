// backend/config.js

// In a real production app, use dotenv and process.env
// For this prototype, we allow setting keys here or via environment variables

export const SOCIAL_CONFIG = {
    twitter: {
        apiKey: process.env.TWITTER_API_KEY || '',
        apiSecret: process.env.TWITTER_API_SECRET || '',
        accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
        accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
        bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
    },
    discord: {
        // Webhooks are the easiest way to post messages to a channel
        webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
        // Or use a bot token
        botToken: process.env.DISCORD_BOT_TOKEN || ''
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || ''
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || ''
    }
};
