import { SOCIAL_CONFIG } from '../config.js';
import { TwitterApi } from 'twitter-api-v2';

// Helper for logging
const log = (platform, msg) => console.log(`[SocialService:${platform}] ${msg}`);

/**
 * Posts content to Discord via Webhook
 */
export const postToDiscord = async (content) => {
    if (!SOCIAL_CONFIG.discord.webhookUrl) {
        log('Discord', 'No Webhook URL configured. Simulating post.');
        return { success: true, simulated: true, platformId: `mock-discord-${Date.now()}` };
    }

    try {
        const response = await fetch(SOCIAL_CONFIG.discord.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });

        if (!response.ok) throw new Error(`Discord API Error: ${response.statusText}`);
        
        log('Discord', 'Posted successfully.');
        return { success: true, platformId: `discord-${Date.now()}` };
    } catch (error) {
        console.error('Discord Post Failed:', error);
        throw error;
    }
};

/**
 * Posts content to Telegram via Bot API
 */
export const postToTelegram = async (content) => {
    const { botToken, chatId } = SOCIAL_CONFIG.telegram;
    
    if (!botToken || !chatId) {
        log('Telegram', 'Missing Bot Token or Chat ID. Simulating post.');
        return { success: true, simulated: true, platformId: `mock-telegram-${Date.now()}` };
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: content
            })
        });

        const data = await response.json();
        if (!data.ok) throw new Error(`Telegram API Error: ${data.description}`);

        log('Telegram', 'Posted successfully.');
        return { success: true, platformId: data.result.message_id };
    } catch (error) {
        console.error('Telegram Post Failed:', error);
        throw error;
    }
};

/**
 * Posts content to Twitter (X)
 * Uses 'twitter-api-v2' for OAuth 1.0a signing.
 */
export const postToTwitter = async (content) => {
    const { apiKey, apiSecret, accessToken, accessSecret } = SOCIAL_CONFIG.twitter;

    if (!apiKey || !accessToken || !apiSecret || !accessSecret) {
        log('Twitter', 'Missing API Keys. Simulating post.');
        return { success: true, simulated: true, platformId: `mock-tweet-${Date.now()}` };
    }

    try {
        const client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        const tweet = await client.v2.tweet(content);
        log('Twitter', `Posted successfully. ID: ${tweet.data.id}`);
        return { success: true, platformId: tweet.data.id };
    } catch (error) {
        console.error('Twitter Post Failed:', error);
        throw error;
    }
};

/**
 * Main Router
 */
export const postToSocial = async (platform, content) => {
    switch (platform.toLowerCase()) {
        case 'discord': return await postToDiscord(content);
        case 'telegram': return await postToTelegram(content);
        case 'twitter': 
        case 'x':
            return await postToTwitter(content);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
};
