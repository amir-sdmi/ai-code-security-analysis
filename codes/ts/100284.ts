import { xai } from "@ai-sdk/xai"
import { experimental_generateImage } from "ai"
import { NextResponse } from "next/server"

export const maxDuration = 30 // Set max duration to 30 seconds for image generation

export async function POST(req: Request) {
  try {
    const { title } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required for image generation" }, { status: 400 })
    }

    // Update the prompt to create better poster designs
    const prompt = `Create a high-quality, professional poster design for "${title}". 
The image should be visually striking with vibrant colors, clear imagery, and suitable for a wall poster. 
Make it look like a professional movie or music poster with artistic composition and visual appeal. 
Style: modern, aesthetic, high-contrast. Resolution: high-quality.`

    // Generate the image using Grok
    const { image } = await experimental_generateImage({
      model: xai.image("grok-2-image"),
      prompt: prompt,
      // You can adjust these parameters as needed
      aspectRatio: "2:3", // Portrait orientation for posters
    })

    // Return the base64 image data
    return NextResponse.json({ imageData: image.base64 })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
