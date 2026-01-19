import Page from "../models/page.model.js";
import mongoose from "mongoose";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY not found. AI features requiring this key will be disabled.");
}

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const extractTextFromTiptap = (content) => {
  let text = '';
  if (!content || !content.content || !Array.isArray(content.content)) {
    return text;
  }
  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach(node => {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        traverse(node.content);
      }
    });
  }
  traverse(content.content);
  return text.trim();
};

export const generateTagsFromContent = async (title, tiptapContent) => {
  const contentText = extractTextFromTiptap(tiptapContent);
  let combinedText = `Title: ${title}\n\nContent: ${contentText}`;
  const MAX_TEXT_LENGTH = 4000;
  if (combinedText.length > MAX_TEXT_LENGTH) {
    combinedText = combinedText.substring(0, MAX_TEXT_LENGTH) + "...";
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found for tag generation.");
    return [];
  }
  try {
    const prompt = `Analyze the following page title and content. Identify the 3 to 5 most relevant semantic concepts or keywords that would be useful as tags. Return these tags ONLY as a comma-separated string. For example: "Artificial Intelligence, Machine Learning, Productivity Tools". Do NOT include any other explanatory text, greetings, or preambles. Avoid generic tags like "page", "document", "text", or "content".\n\nTitle: ${title}\nContent: ${contentText}`;
    console.log("Sending request to Gemini (via OpenAI SDK proxy) for tag generation...");
    const response = await openai.chat.completions.create({
      model: "gemini-1.5-flash-latest",
      messages: [
        { role: "system", content: "You are an API that returns a comma-separated list of tags based on provided text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 60,
    });
    const messageContent = response.choices[0]?.message?.content;
    if (messageContent) {
      console.log("Gemini raw response for tags:", messageContent);
      const cleanedContent = messageContent.replace(/^["'\s]+|["'\s]+$/g, '');
      const tags = cleanedContent.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0 && tag.toLowerCase() !== 'n/a');
      console.log("Parsed tags:", tags);
      return tags.slice(0, 5);
    } else {
      console.warn("Gemini (via OpenAI SDK proxy) did not return content for tags.");
      return [];
    }
  } catch (error) {
    console.error("Error generating tags with Gemini (via OpenAI SDK proxy):", error.message);
    return []; 
  }
};

export const generateEmbeddingForContent = async (text) => {
  if (!text || text.trim().length === 0) {
    console.warn("Content is empty, skipping embedding generation.");
    return [];
  }
  if (!genAI) {
    console.warn("Gemini client (genAI) not initialized. GEMINI_API_KEY might be missing. Skipping embedding generation.");
    return [];
  }
  try {
    console.log("Sending request to Gemini (Google SDK) for embedding generation...");
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text.substring(0, 20000));
    const embedding = result.embedding;
    if (embedding && embedding.values) {
      console.log("Embedding generated successfully via Google SDK.");
      return embedding.values;
    } else {
      console.warn("Gemini (Google SDK) did not return valid embedding data.", result);
      return [];
    }
  } catch (error) {
    console.error("Error generating embedding with Gemini (Google SDK):", error.message);
    if (error.response) {
      console.error("API Error Response Data (Google SDK):", error.response.data);
    }
    return [];
  }
};

export const extractPageIdsFromContent = (content) => {
  const linkedPageIds = new Set();
  if (!content || !content.content || !Array.isArray(content.content)) {
    return [];
  }
  function traverse(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach(node => {
      if (node.marks && Array.isArray(node.marks)) {
        node.marks.forEach(mark => {
          if (mark.type === 'link' && mark.attrs && mark.attrs.href) {
            const match = mark.attrs.href.match(/\/page\/([a-fA-F0-9]{24})$/);
            if (match && match[1] && mongoose.Types.ObjectId.isValid(match[1])) {
              linkedPageIds.add(match[1]);
            }
          }
        });
      }
      if (node.content && Array.isArray(node.content)) {
        traverse(node.content);
      }
    });
  }
  traverse(content.content);
  return Array.from(linkedPageIds);
};

export const createPage = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, parentPageId, icon, coverImage, properties, editorContent } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Page title is required" });
    }
    const pageTitle = title.trim();
    const currentEditorContent = editorContent || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] };
    let initialTags = [];
    let initialEmbedding = [];
    const extractedText = extractTextFromTiptap(currentEditorContent);

    if (process.env.GEMINI_API_KEY) {
        initialTags = await generateTagsFromContent(pageTitle, currentEditorContent);
        if (extractedText) {
            initialEmbedding = await generateEmbeddingForContent(extractedText);
        }
    } else {
        console.warn("GEMINI_API_KEY not found. Skipping AI features for new page.");
    }

    const page = await Page.create({
      title: pageTitle,
      workspaceId,
      parentPageId: parentPageId || null,
      icon: icon || null,
      coverImage: coverImage || null,
      editorContent: currentEditorContent,
      properties: properties || {},
      tags: initialTags,
      outgoingLinks: extractPageIdsFromContent(currentEditorContent),
      contentEmbedding: initialEmbedding,
    });

    res.status(201).json({ success: true, page });
  } catch (error) {
    console.error("Create page error:", error);
    res.status(500).json({ success: false, message: "Failed to create page" });
  }
};

export const getPages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const pages = await Page.find({ workspaceId, parentPageId: null, deletedAt: null });
    res.status(200).json({ success: true, pages });
  } catch (error) {
    console.error("Get pages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pages" });
  }
};

export const getPage = async (req, res) => {
  try {
    const { workspaceId, pageId } = req.params;
    const page = await Page.findOne({ _id: pageId, workspaceId, deletedAt: null });
    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error("Get page error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch page" });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { workspaceId, pageId } = req.params;
    const { title, icon, coverImage, properties, editorContent, tags: manualTags } = req.body;
    
    console.log(`[updatePage] Received for pageId ${pageId}:`, JSON.stringify(req.body, null, 2));

    const updateObj = {};
    let titleChanged = false;
    let contentChanged = false;
    let newPlainTextContent = null;

    const currentPageData = await Page.findById(pageId).select('title editorContent tags contentEmbedding');
    if (!currentPageData) {
        return res.status(404).json({ success: false, message: "Page not found for update" });
    }

    if (title !== undefined) {
      updateObj.title = title.trim();
      if (updateObj.title !== currentPageData.title) titleChanged = true;
    }
    if (icon !== undefined) updateObj.icon = icon;
    if (coverImage !== undefined) updateObj.coverImage = coverImage;
    if (properties !== undefined) updateObj.properties = properties;
    if (editorContent !== undefined) {
      updateObj.editorContent = editorContent;
      newPlainTextContent = extractTextFromTiptap(editorContent);
      if (JSON.stringify(editorContent) !== JSON.stringify(currentPageData.editorContent)) contentChanged = true;
      updateObj.outgoingLinks = extractPageIdsFromContent(editorContent);
    }

    if (manualTags !== undefined) {
      updateObj.tags = manualTags;
      console.log(`[updatePage] Using manually provided tags for pageId ${pageId}:`, manualTags);
    } else if ((titleChanged || contentChanged) && process.env.GEMINI_API_KEY) {
      const titleForTags = titleChanged ? updateObj.title : currentPageData.title;
      const contentForTags = contentChanged ? updateObj.editorContent : currentPageData.editorContent;
      console.log(`[updatePage] Regenerating AI tags for pageId ${pageId} due to content/title change.`);
      const aiGeneratedTags = await generateTagsFromContent(titleForTags, contentForTags);
      const existingTags = currentPageData.tags || [];
      const combinedTags = new Set([...existingTags, ...aiGeneratedTags]);
      updateObj.tags = Array.from(combinedTags).slice(0, 10);
      console.log(`[updatePage] Merged AI tags with existing for pageId ${pageId}:`, updateObj.tags);
    } else if (titleChanged || contentChanged) {
      console.warn(`[updatePage] GEMINI_API_KEY not found or no manual tags sent. Skipping AI tag update for pageId ${pageId}.`);
    }

    let newEmbedding = null;
    if (contentChanged && process.env.GEMINI_API_KEY && newPlainTextContent) {
        console.log(`[updatePage] Regenerating content embedding for pageId ${pageId} due to content change.`);
        newEmbedding = await generateEmbeddingForContent(newPlainTextContent);
        updateObj.contentEmbedding = newEmbedding;
    } else if (contentChanged) {
        console.warn(`[updatePage] GEMINI_API_KEY not found or content empty. Skipping embedding generation for pageId ${pageId}.`);
        updateObj.contentEmbedding = []; 
    }

    if (Object.keys(updateObj).length === 0 && manualTags === undefined) {
      return res.status(400).json({ success: false, message: "No update fields provided" });
    }
    
    console.log(`[updatePage] Final updateObj for pageId ${pageId}:`, JSON.stringify(updateObj, null, 2));

    const updatedPage = await Page.findOneAndUpdate(
      { _id: pageId, workspaceId, deletedAt: null },
      { $set: updateObj },
      { new: true }
    );

    if (!updatedPage) {
      return res.status(404).json({ success: false, message: "Page not found during update operation" });
    }

    res.status(200).json({ success: true, page: updatedPage });
  } catch (error) {
    console.error("Update page error:", error);
    res.status(500).json({ success: false, message: "Failed to update page" });
  }
};

export const deletePage = async (req, res) => {
  try {
    const { workspaceId, pageId } = req.params;
    const page = await Page.findOneAndUpdate(
      { _id: pageId, workspaceId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }
    res.status(200).json({ success: true, message: "Page deleted", page });
  } catch (error) {
    console.error("Delete page error:", error);
    res.status(500).json({ success: false, message: "Failed to delete page" });
  }
};

export const getPageSuggestions = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { query } = req.query;
    let searchTerms = [];
    let filter = { workspaceId, deletedAt: null };

    if (query && query.trim().length > 0) {
      const originalQuery = query.trim();
      searchTerms.push(originalQuery);

      if (process.env.GEMINI_API_KEY) {
        try {
          const expansionPrompt = `Given the search query "${originalQuery}" for finding a page in a personal knowledge base, suggest 2-3 alternative keywords or short phrases that are semantically related or could be synonyms. Return these ONLY as a comma-separated string. For example, if the query is "AI advancements", you might return "artificial intelligence progress, machine learning updates".`;
          console.log(`[getPageSuggestions] Sending query "${originalQuery}" to Gemini for expansion...`);
          const response = await openai.chat.completions.create({
            model: "gemini-1.5-flash-latest",
            messages: [
              { role: "system", content: "You are an assistant that expands search queries with related terms." },
              { role: "user", content: expansionPrompt },
            ],
            temperature: 0.4,
            max_tokens: 50,
          });
          const messageContent = response.choices[0]?.message?.content;
          if (messageContent) {
            console.log(`[getPageSuggestions] Gemini expansion for "${originalQuery}":`, messageContent);
            const expandedTerms = messageContent.split(',').map(term => term.trim()).filter(term => term.length > 0);
            searchTerms.push(...expandedTerms);
          }
        } catch (aiError) {
          console.error("[getPageSuggestions] Error expanding query with Gemini:", aiError.message);
          // If AI expansion fails, we still have the original query term
        }
      }
      const uniqueSearchTerms = Array.from(new Set(searchTerms));
      if (uniqueSearchTerms.length > 0) {
        filter.$or = uniqueSearchTerms.map(term => ({ title: { $regex: term, $options: 'i' } }));
      } else {
        // This case should ideally not be reached if originalQuery was pushed and is non-empty
        // but as a fallback, if somehow all terms are filtered out, don't apply $or
        // This would mean it fetches recents, similar to an empty query
         console.warn("[getPageSuggestions] Query was provided, but no valid search terms remained after processing.");
      }
    } else {
      // If query is empty or whitespace, we will fetch recent pages (handled by the default filter and sort)
      console.log("[getPageSuggestions] No query provided or query is empty. Fetching recent pages.");
    }

    const pages = await Page.find(filter)
      .select('_id title icon')
      .sort({ updatedAt: -1 })
      .limit(10);
      
    const suggestions = pages.map(page => ({ 
      id: page._id, 
      title: page.title, 
      icon: page.icon 
    }));
    
    res.status(200).json({ success: true, suggestions });

  } catch (error) {
    console.error("Get page suggestions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch page suggestions" });
  }
};

export const getPageGraphData = async (req, res) => {
  try {
    const { workspaceId, pageId } = req.params;
    const currentPage = await Page.findOne({ _id: pageId, workspaceId, deletedAt: null })
      .populate('outgoingLinks', '_id title icon');
    if (!currentPage) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }
    const incomingLinksResults = await Page.find({
      workspaceId,
      outgoingLinks: pageId,
      deletedAt: null,
    }).select('_id title icon');
    res.status(200).json({ 
      success: true, 
      node: {
        id: currentPage._id,
        title: currentPage.title,
        icon: currentPage.icon,
      },
      outgoingLinks: currentPage.outgoingLinks.map(link => ({
        id: link._id,
        title: link.title,
        icon: link.icon,
      })),
      incomingLinks: incomingLinksResults.map(link => ({
        id: link._id,
        title: link.title,
        icon: link.icon,
      })),
    });
  } catch (error) {
    console.error("Get page graph data error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch page graph data" });
  }
};