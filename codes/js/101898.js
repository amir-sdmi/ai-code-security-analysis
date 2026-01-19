import Post from "../models/Post.js";
// import fs from "fs";
// import path from "path";
import main from "../config/gemini.js"; // Assuming you have a function to generate content using Gemini or similar service

import { imagekit } from "../config/imageKit.js"; // Assuming you have configured ImageKit or similar service

// Function to get all posts
export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find({ isPublished: false }).populate(
			"author",
			"username email"
		);
		res.status(200).json(posts);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching posts", error: error.message });
	}
};

// Function to get posts by user ID
export const getPostsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const posts = await Post.find({ author: userId }).populate(
            "author",
            "username email"
        );
        res.status(200).json(posts);
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching posts by user", error: error.message });
    }
};

// Get recent posts
export const getRecentPosts = async (req, res) => {
    try {
        const posts = await Post.find({ isPublished: true })
            .sort({ createdAt: -1 }) // Sort by creation date, most recent first
            .limit(5) // Limit to 5 recent posts
            .populate("author", "username email");
        res.status(200).json(posts);
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching recent posts", error: error.message });
    }
};

// Function to create a new post
// export const createPost = async (req, res) => {
// 	try {
// 		const { title, description, category } = req.body;
// 		const author = req.user.userId; // Assuming user is authenticated and user info is in req.user

// 		const imageFile = req.file ? req.file.path : null; // Assuming file upload middleware is used

// 		const fileBuffer = imageFile ? fs.readFileSync(imageFile) : null;

// 		if (imageFile && !fileBuffer) {
// 			return res.status(400).json({ message: "Image file not found" });
// 		}

// 		// If using ImageKit or similar service, you can upload the image here
// 		const response = await imagekit.upload({
// 			file: fileBuffer, // Buffer of the image file
// 			fileName: path.basename(imageFile), // Name of the file
// 			folder: "blog_posts", // Optional folder in ImageKit
// 		});

// 		if (imageFile) {
// 			fs.unlinkSync(imageFile); // Remove local file after upload
// 		}

// 		// optimization through imagekit
// 		const optimizedImageURL = await imagekit.url({
// 			path: response.filePath, // Path returned by ImageKit
// 			transformation: [
// 				{
// 					width: 1280, // Desired width
// 					format: "webp",
// 					quality: "auto", // Auto quality
// 				},
// 			],
// 		});

// 		const image = optimizedImageURL; // Use the optimized image URL

// 		const newPost = new Post({
// 			title,
// 			description,
// 			category,
// 			image,
// 			author,
// 		});

// 		await newPost.save();
// 		res.status(201).json(newPost);
// 	} catch (error) {
// 		res
// 			.status(500)
// 			.json({ message: "Error creating post", error: error.message });
// 	}
// };


export const createPost = async (req, res) => {
	try {
		const { title, description, category } = req.body;
		const author = req.user.userId;

		let image = null;

		if (req.file && req.file.buffer) {
			// Upload directly from buffer to ImageKit
			const response = await imagekit.upload({
				file: req.file.buffer,
				fileName: req.file.originalname,
				folder: "blog_posts",
			});

			// Get optimized image URL
			image = imagekit.url({
				path: response.filePath,
				transformation: [
					{
						width: 1280,
						format: "webp",
						quality: "auto",
					},
				],
			});
		}

		const newPost = new Post({
			title,
			description,
			category,
			image,
			author,
		});

		await newPost.save();
		res.status(201).json(newPost);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error creating post", error: error.message });
	}
};


// Function to get a post by ID
export const getPostById = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id).populate(
			"author",
			"username email"
		);
		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}
		res.status(200).json(post);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching post", error: error.message });
	}
};

// Function to update a post
export const updatePost = async (req, res) => {
	try {
		const { title, description, category, image } = req.body;
		const post = await Post.findByIdAndUpdate(
			req.params.id,
			{ title, description, category, image },
			{ new: true }
		).populate("author", "username email");

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}
		res.status(200).json(post);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error updating post", error: error.message });
	}
};

// Function to delete a post
export const deletePost = async (req, res) => {
	try {
		const post = await Post.findByIdAndDelete(req.params.id);
		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}
		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error deleting post", error: error.message });
	}
};

// toggle post publication status
export const togglePostPublication = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.isPublished = !post.isPublished; // Toggle the publication status
        await post.save();

        res.status(200).json({ message: "Post publication status updated", post });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error updating post publication status", error: error.message });
    }
};

export const generateContent = async (req, res) => {
	try {
		const { prompt } = req.body;

		// Assuming you have a function to generate content using Gemini or similar service
		const generatedContent = await main(prompt + ' Generate a blog content 145 words for this topic in simple text format'); // Replace with your content generation logic

		res.status(200).json({ content: generatedContent });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error generating content", error: error.message });
	}
}
