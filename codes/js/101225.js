// Upvote endpoint for comments
import { verifyAuth } from '@/utils/auth';
import { prisma } from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = await verifyAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized action" });

    const { id, diff } = req.body;
    if (!id || typeof diff !== 'number') {
        return res.status(400).json({ error: "Invalid parameters" });
    }

    // GENERATED WITH CHATGPT
    try {
        // Check if a vote already exists for this user and comment
        const existingVote = await prisma.commentVote.findUnique({
            where: {
                userId_commentId: { userId: Number(userId), commentId: Number(id) },
            }
        });

        // If user is trying to upvote
        if (diff === 1) {
            if (existingVote) {
                if (existingVote.type === "UPVOTE") {
                    return res.status(409).json({ error: "You have already upvoted this comment post." });
                } else if (existingVote.type === "DOWNVOTE") {
                    // Decrement downvotes by 1
                    await prisma.comment.update({
                        where: { id: Number(id) },
                        data: {
                            downvotes: { decrement: 1 },
                        }
                    });
                    await prisma.commentVote.update({
                        where: { id: existingVote.id },
                        data: { type: "UPVOTE" }
                    });
                }
                // Increment upvotes by 1
                await prisma.comment.update({
                    where: { id: Number(id) },
                    data: {
                        upvotes: { increment: 1 },
                    }
                });
                await prisma.commentVote.update({
                    where: { id: existingVote.id },
                    data: { type: "UPVOTE" }
                });
            } else {
                // Add a new UPVOTE
                await prisma.comment.update({
                    where: { id: Number(id) },
                    data: { upvotes: { increment: 1 } }
                });
                console.log("userId: " + userId + ", commentId: " + id);
                await prisma.commentVote.create({
                    data: {
                        userId: Number(userId),
                        commentId: Number(id),
                        type: "UPVOTE"
                    }
                });
            }
        } else if (diff === -1) {
            if (existingVote) {
                if (existingVote.type === "UPVOTE") {
                    await prisma.comment.update({
                        where: { id: Number(id) },
                        data: {
                            upvotes: { decrement: 1 },
                        }
                    });
                }
                await prisma.commentVote.update({
                    where: { id: existingVote.id },
                    data: { type: "" }
                });
            } else {
                return res.status(400).json({ error: "Cannot unupvote a post you haven't upvoted" })
            }
        } else {
            return res.status(400).json({ error: "Invalid diff value" });
        }

        const updatedComment = await prisma.comment.findUnique({
            where: { id: Number(id) }
        });

        return res.status(200).json(updatedComment);

    } catch (err) {
        console.error("Error updating comment:", err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
