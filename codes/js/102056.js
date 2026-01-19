import express from 'express';
import Book from '../models/Book.js';
import User from '../models/user.model.js';  
import authenticateUser from '../middlewares/authenticateUser.js';  
import { OpenAI } from 'openai';

const router = express.Router();

// Initialize OpenAI client  
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate a summary for a single page using ChatGPT
async function generatePageSummary(pageText) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or another suitable model
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes text." },
        { role: "user", content: `Summarize the following text with formatting and markdown: "${pageText}"` },
      ],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating page summary:", error);
    return null;
  }
}

// Route to generate and return the complete book summary (checks database first)
router.get('/api/books/:bookId/summary', async (req, res) => {
  const bookId = req.params.bookId;

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if the book summary already exists in the database
    if (book.bookSummary && Object.keys(book.bookSummary).length > 0) {
      return res.json({ summary: book.bookSummary });
    }

    if (!book.pages || book.pages.length === 0) {
      return res.status(400).json({ message: 'Book has no pages to summarize.' });
    }

    const completeSummary = {};
    for (const page of book.pages) {
      const summary = await generatePageSummary(page.text);
      if (summary) {
        completeSummary[page.pageNumber] = summary;
      } else {
        console.warn(`Failed to generate summary for page ${page.pageNumber}`);
         
      }
    }

    // Save the generated summary to the database for future requests
    book.bookSummary = completeSummary;
    await book.save();

    res.json({ summary: completeSummary });

  } catch (error) {
    console.error('Error generating complete book summary:', error);
    res.status(500).json({ message: 'Failed to generate complete book summary.' });
  }
});

// Create a new book with initial pages and optional category/subcategory
router.post('/api/books', async (req, res) => {
  try {
    const { pages, category, subcategory } = req.body;
    const bookData = {
      pages: pages,
    };
    if (category) {
      bookData.category = category;
    }
    if (subcategory) {
      bookData.subcategory = subcategory;
    }

    const book = await Book.create(bookData);
    res.json({ success: true, bookId: book._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all books with title, coverPage, category, and subcategory
router.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find({}, 'title coverPage category subcategory');
    res.json({ success: true, books });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update page summary (audio removed)
router.patch('/api/books/:bookId/page/:pageNumber', async (req, res) => {
  try {
    const update = {};
    // Only allow summary updates
    if (req.body.summary) update['pages.$.summary'] = req.body.summary;

    const book = await Book.findOneAndUpdate(
      { _id: req.params.bookId, 'pages.pageNumber': parseInt(req.params.pageNumber) },
      { $set: update },
      { new: true }
    );

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch book by ID
router.get('/api/books/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update book metadata (title/covers/category/subcategory)
router.patch('/api/books/:bookId', async (req, res) => {
  try {
    const { title, coverPage, endCoverPage, category, subcategory } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (coverPage !== undefined) updates.coverPage = coverPage;
    if (endCoverPage !== undefined) updates.endCoverPage = endCoverPage;
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = subcategory;

    const book = await Book.findByIdAndUpdate(
      req.params.bookId,
      { $set: updates },
      { new: true }
    );

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to handle when a user starts reading a book
router.patch('/api/books/:bookId/start-reading', authenticateUser, async (req, res) => {

  try {
    const bookId = req.params.bookId;
    const userId = req.userId;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const category = book.category || 'Other';
    const subcategory = book.subcategory || '';

    const categoryScore = user.knowledgeScores.get(category)?.score || 0;
    const subcategoryScore = user.knowledgeScores.get(category)?.subcategories?.get(subcategory) || 0;

    // console.log(`User ID: ${userId}, Book ID: ${bookId} - Before start reading: Category Score=${categoryScore}, Subcategory Score=${subcategoryScore}`);

    user.knowledgeScores.set(category, {
      score: categoryScore + 0.5,
      subcategories: new Map(user.knowledgeScores.get(category)?.subcategories).set(subcategory, subcategoryScore + 1),
    });

    await user.save();

    const updatedCategoryScore = user.knowledgeScores.get(category)?.score;
    const updatedSubcategoryScore = user.knowledgeScores.get(category)?.subcategories?.get(subcategory);

    console.log(`User ID: ${userId}, Book ID: ${bookId} - After start reading: Category Score=${updatedCategoryScore}, Subcategory Score=${updatedSubcategoryScore}`);

    res.json({ success: true, message: 'Book reading started, user knowledge score updated.' });
  } catch (error) {
    console.error('Error starting to read book (user-specific):', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to handle when a user completes reading a book
router.patch('/api/books/:bookId/complete-reading', authenticateUser, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const category = book.category || 'Other';
    const subcategory = book.subcategory || '';

    const categoryScore = user.knowledgeScores.get(category)?.score || 0;
    const subcategoryScore = user.knowledgeScores.get(category)?.subcategories?.get(subcategory) || 0;

    console.log(`User ID: ${userId}, Book ID: ${bookId} - Before complete reading: Category Score=${categoryScore}, Subcategory Score=${subcategoryScore}`);

    user.knowledgeScores.set(category, {
      score: categoryScore + 1,
      subcategories: new Map(user.knowledgeScores.get(category)?.subcategories).set(subcategory, subcategoryScore + 2),
    });

    await user.save();

    const updatedCategoryScore = user.knowledgeScores.get(category)?.score;
    const updatedSubcategoryScore = user.knowledgeScores.get(category)?.subcategories?.get(subcategory);

    console.log(`User ID: ${userId}, Book ID: ${bookId} - After complete reading: Category Score=${updatedCategoryScore}, Subcategory Score=${updatedSubcategoryScore}`);

    res.json({ success: true, message: 'Book reading completed, user knowledge score updated.' });
  } catch (error) {
    console.error('Error completing reading book (user-specific):', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


router.post('/api/books/:bookId/bookmarks', authenticateUser, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { pageNumber, color, textSnippet } = req.body;
    const newBookmark = { pageNumber, color, textSnippet };
    book.bookmarks.push(newBookmark);
    await book.save();

    res.json({ success: true, bookmarks: book.bookmarks });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to remove a bookmark
router.delete('/api/books/:bookId/bookmarks/:pageNumber', authenticateUser, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const pageNumberToDelete = parseInt(req.params.pageNumber);
    book.bookmarks = book.bookmarks.filter(
      (bookmark) => bookmark.pageNumber !== pageNumberToDelete
    );
    await book.save();

    res.json({ success: true, bookmarks: book.bookmarks });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/summary/five-pages', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Please provide a summary of the following text, focusing on the main points and key events. Text: ${text}
        also i want the response with formatting Structured way, like heading paragraph bullet points, and other things.`
      }]
    });

    res.json({
      summary: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;