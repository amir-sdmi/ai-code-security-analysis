// Those are functions related to messages utils
import { query } from '../db/pg';

export async function getMessagesForServerById(serverId: string) {
    // First, get all channel IDs that belong to this server
    const channels = await query(
        `
        SELECT id FROM app.channels 
        WHERE server_id = $1
        `,
        [serverId]
    );
    
    const channelIds = channels.rows.map(channel => channel.id);
    
    if (channelIds.length === 0) {
        return [];
    }
    
    // Then get messages for those channels
    const messages = await query(
        `
        SELECT 
            m.id, 
            m.content AS message, 
            m.created_at,
            m.sender_id,
            u.username,
            u.avatar_url
        FROM 
            app.messages m
        JOIN 
            app.users u ON m.sender_id = u.id
        WHERE 
            m.channel_id = ANY($1)
        ORDER BY 
            m.created_at ASC
        `,
        [channelIds]
    );
    
    return messages.rows;
}

// This function will get all messages for a specific channel
// This function will use a cursor to limit the amount of messages
// Give me messages for this channel, optionally filtering by those older than a given timestamp(type shit)
// No i did not write this, yes it was written by copilot
export async function getMessagesForChannelById(
    channelId: string,
    cursor: string | null = null,
    limit: number = 20
) {
    // Check if the channel exists
    const channelCheck = await query(
        `SELECT id FROM app.channels WHERE id = $1`,
        [channelId]
    );

    if (channelCheck.rows.length === 0) {
        throw new Error("Channel not found");
    }

    // Use a conditional clause for the cursor.
    // If cursor is null, the condition ($2::timestamp IS NULL OR ...) will always be true.
    const messages = await query(
        `
            SELECT
                m.id,
                m.content AS message,
                m.created_at,
                m.sender_id,
                u.username,
                u.avatar_url
            FROM
                app.messages m
                    JOIN
                app.users u ON m.sender_id = u.id
            WHERE
                m.channel_id = $1
              AND ($2::timestamp IS NULL OR m.created_at < $2)
            ORDER BY
                m.created_at desc
                LIMIT $3
        `,
        [channelId, cursor, limit]
    );

    return messages.rows;
}


// This function will send a message to a specific channel in a server
// Message is an object that contains the message content and other metadata
export async function sendMessageByChannel(userId: string, serverId: string, channelId: string, message: string) {
    // Verify channel belongs to server
    const channelCheck = await query(
        `SELECT id FROM app.channels WHERE id = $1 AND server_id = $2`,
        [channelId, serverId]
    );
    
    if (channelCheck.rows.length === 0) {
        throw new Error("Channel not found in the specified server");
    }
    
    // Insert the message
    const result = await query(
        `
        INSERT INTO app.messages (content, sender_id, channel_id)
        VALUES ($1, $2, $3)
        RETURNING id, created_at
        `,
        [message, userId, channelId]
    );

    return result.rows[0];
}