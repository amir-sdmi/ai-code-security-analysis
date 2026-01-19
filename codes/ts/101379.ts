
import { DocumentSummary, PDFDocument, RelatedDocument, SearchResult } from '@/types';
import * as pdfjs from 'pdfjs-dist';
import { generateDocumentSummary, findRelatedDocuments, enhancedSearch } from '@/utils/geminiService';

// Need to set the worker source for pdf.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const parsePDF = async (file: File): Promise<PDFDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      content: fullText,
      dateAdded: new Date(),
      fileType: 'pdf',
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
};

export const searchInPDF = (document: PDFDocument, query: string): string[] => {
  if (!query.trim()) return [];
  
  const lowerCaseQuery = query.toLowerCase();
  const lowerCaseContent = document.content.toLowerCase();
  
  // Simple search implementation
  const paragraphs = document.content.split('\n\n');
  const results = paragraphs.filter(paragraph => 
    paragraph.toLowerCase().includes(lowerCaseQuery)
  );
  
  return results;
};

// Advanced search with AI context awareness
export const smartSearch = async (documents: PDFDocument[], query: string): Promise<SearchResult[]> => {
  try {
    // Use the enhanced search from geminiService
    return await enhancedSearch(query, documents);
  } catch (error) {
    console.error('Error in smart search:', error);
    return [];
  }
};

// Helper function to calculate a simple relevance score
const calculateRelevanceScore = (text: string, query: string): number => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Count occurrences of the query in the text
  const occurrences = (lowerText.match(new RegExp(lowerQuery, 'g')) || []).length;
  
  // Consider text length for normalization
  const lengthFactor = 1 / Math.sqrt(text.length);
  
  // Consider position (earlier mentions are more relevant)
  const position = lowerText.indexOf(lowerQuery);
  const positionFactor = position >= 0 ? 1 / (1 + position / 100) : 0;
  
  return (occurrences * 0.5) + (lengthFactor * 0.2) + (positionFactor * 0.3);
};

// Get related documents based on content similarity
export const getRelatedDocuments = async (
  documentId: string, 
  allDocuments: PDFDocument[]
): Promise<RelatedDocument[]> => {
  try {
    const sourceDoc = allDocuments.find(doc => doc.id === documentId);
    if (!sourceDoc || allDocuments.length <= 1) return [];
    
    // Get documents excluding the source
    const otherDocs = allDocuments.filter(doc => doc.id !== documentId);
    
    // Use Gemini API to find related documents
    return await findRelatedDocuments(sourceDoc, otherDocs);
  } catch (error) {
    console.error('Error getting related documents:', error);
    return [];
  }
};

// Summarize document
export const summarizeDocument = async (document: PDFDocument): Promise<DocumentSummary> => {
  try {
    const summary = await generateDocumentSummary(document.content);
    
    return {
      id: crypto.randomUUID(),
      documentId: document.id,
      content: summary,
      dateGenerated: new Date()
    };
  } catch (error) {
    console.error('Error summarizing document:', error);
    throw new Error('Failed to generate document summary');
  }
};
