import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { eq } from 'drizzle-orm'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { db, schema } from '~/lib/drizzle'
import type { Comment } from '~/types'
import { deepSeek } from '~/utils/ai'

// Define the result schema for sensitive content check
const SensitiveCheckResultSchema = z.object({
	results: z.array(
		z.object({
			id: z.number(),
			sensitive: z.boolean(),
			reason: z.string(),
		}),
	),
})

type SensitiveCheckResult = z.infer<typeof SensitiveCheckResultSchema>

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const id = params.id
	invariant(id, 'id is required')

	const translateComment = await db.query.translateComments.findFirst({
		where: (tc, { eq }) => eq(tc.id, id),
	})

	if (!translateComment || !translateComment.comments || translateComment.comments.length === 0) {
		return json({ success: false, message: 'No comments found to check' })
	}

	// Create input for AI model
	const commentsToCheck = translateComment.comments.map((comment, index) => ({
		id: index,
		author: comment.author,
		content: comment.content,
		translatedContent: comment.translatedContent || '',
	}))

	// Create a prompt for the AI model to check for sensitive content
	const systemPrompt = `You are an expert content moderator specialized in identifying sensitive content in social media comments, particularly those that might be problematic for audiences in China. 
Your task is to analyze comments and identify ones containing potentially sensitive content based on Chinese standards and regulations.`

	const prompt = `I need you to review a list of comments from a video and identify which ones contain potentially sensitive content according to Chinese standards and regulations. 
Please focus on the following categories:
1. Political content (mentions of Chinese politics, government criticism, controversial political figures)
2. Social issues that are sensitive in China
3. Content that might violate Chinese content policies
4. Adult or sexual content
5. Violence or graphic descriptions
6. Separatism or territorial issues
7. Religious content that might be considered sensitive
8. Historical events that are politically sensitive in China

Analyze both the original content and its translation for each comment. Return your analysis as an object with a "results" property containing an array. Each item in the array should have:
- "id": the comment ID number
- "sensitive": boolean flag indicating if the comment is sensitive (true) or not (false)
- "reason": a brief explanation of why the comment is sensitive, or empty string if not sensitive

Here are the comments to analyze:
${JSON.stringify(commentsToCheck, null, 2)}`

	try {
		// Directly use deepSeek.generateObject instead of aiGenerateText
		const sensitiveAnalysis = await deepSeek.generateObject<SensitiveCheckResult>({
			system: systemPrompt,
			prompt: prompt,
			schema: SensitiveCheckResultSchema,
			maxTokens: 4000,
		})

		// Update comments with sensitivity flags
		const checkedComments = translateComment.comments.map((comment, index) => {
			const result = sensitiveAnalysis.results.find((r) => r.id === index)
			return {
				...comment,
				sensitive: result?.sensitive || false,
				sensitiveReason: result?.reason || '',
			}
		})

		// Update the translate comment with the sensitivity flags
		await db.update(schema.translateComments).set({ comments: checkedComments }).where(eq(schema.translateComments.id, id))

		return json({
			success: true,
			message: 'Comments checked for sensitive content',
			results: sensitiveAnalysis.results.filter((r) => r.sensitive),
		})
	} catch (error) {
		console.error('Error analyzing comments:', error)
		return json({ success: false, message: 'Error analyzing comments', error: String(error) })
	}
}
