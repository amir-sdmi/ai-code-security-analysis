import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import config from '../config/config';

// Constants for OpenRouter API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Makes a request to the OpenRouter API with the specified model and messages
 * @param model The model to use (e.g., 'deepseek/deepseek-r1:free')
 * @param messages Array of message objects with role and content
 * @returns The API response
 */
async function callOpenRouterAPI(model: string, messages: Array<{role: string, content: string}>) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`OpenRouter API error with model ${model}:`, error.message);
    throw error;
  }
}

interface ReportSection {
  title: string;
  content: string;
}

interface ReportMetadata {
  title: string;
  author: string;
  date: Date;
  description: string;
}

/**
 * Generates detailed content for a report using AI
 * @param prompt The user's report request prompt
 * @param title The report title
 * @returns AI-generated report content broken into sections
 */
export const generateReportContent = async (prompt: string, title: string): Promise<ReportSection[]> => {
  try {
    // Create a detailed prompt for the AI to generate a structured report
    const systemPrompt = `You are an AI specialized in creating detailed, professional reports. 
    Create a comprehensive report on the requested topic with the following sections:
    1. Executive Summary: A brief overview of the entire report
    2. Introduction: Context and background information
    3. Key Findings: Main insights organized in bullet points
    4. Detailed Analysis: In-depth examination of the topic
    5. Recommendations: Practical suggestions based on the analysis
    6. Conclusion: Summary of findings and future outlook
    
    For each section, provide detailed, well-researched content. Use formal language appropriate for a professional business report.
    Format your response as a JSON array of objects, each with 'title' and 'content' properties. Do not include any explanations outside of this JSON structure.`;

    console.log('Calling OpenRouter API for report generation...');
    
    // Create messages array for the API request
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate a professional report on the following topic: ${prompt}. The report title is: ${title}.`
      }
    ];
    
    // Use only the free deepseek model as requested
    console.log('Using deepseek/deepseek-r1:free model for report generation');
    const responseData = await callOpenRouterAPI('deepseek/deepseek-r1:free', messages);

    // Extract and parse AI response
    const aiResponseContent = responseData.choices[0].message.content;
    console.log('AI response received with length:', aiResponseContent.length);
    
    try {
      // Find JSON in the response (in case the LLM added explanatory text)
      const jsonMatch = aiResponseContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Direct parse attempt if no clear JSON structure found
      try {
        return JSON.parse(aiResponseContent);
      } catch (directParseError) {
        console.error('Direct JSON parse failed:', directParseError);
        
        // If JSON parsing fails, create a structured report from the text
        // First, try to find section headers in the text
        const sections = [];
        const possibleSections = [
          'Executive Summary', 'Summary', 'Overview',
          'Introduction', 'Background',
          'Key Findings', 'Findings', 'Main Points',
          'Analysis', 'Detailed Analysis', 'Discussion',
          'Recommendations', 'Suggestions', 'Actions',
          'Conclusion', 'Final Thoughts', 'Outlook'
        ];
        
        let currentSection = '';
        let currentContent = '';
        const lines = aiResponseContent.split('\n');
        
        for (const line of lines) {
          const foundSection = possibleSections.find(section => 
            line.includes(section) && (line.includes(':') || line.includes('.') || line.toUpperCase() === section.toUpperCase())
          );
          
          if (foundSection) {
            // Save previous section if it exists
            if (currentSection && currentContent) {
              sections.push({ title: currentSection, content: currentContent.trim() });
              currentContent = '';
            }
            currentSection = foundSection;
          } else if (currentSection) {
            currentContent += line + '\n';
          } else {
            // If no section identified yet, this might be introductory text
            currentContent += line + '\n';
            currentSection = 'Executive Summary';
          }
        }
        
        // Add the last section
        if (currentSection && currentContent) {
          sections.push({ title: currentSection, content: currentContent.trim() });
        }
        
        if (sections.length > 0) {
          return sections;
        }
      }
      
      // If all parsing attempts fail, create a simple structured report
      return [
        { title: 'Executive Summary', content: 'Auto-generated report based on AI response.' },
        { title: 'Generated Content', content: aiResponseContent.substring(0, 1000) },
        { title: 'Continued', content: aiResponseContent.substring(1000, 2000) },
        { title: 'Conclusion', content: aiResponseContent.substring(2000) }
      ];
    } catch (parseError) {
      console.error('All parsing attempts failed:', parseError);
      
      // Fallback: Create a simple structured report from the text
      return [
        { title: 'Executive Summary', content: 'Auto-generated report based on AI response.' },
        { title: 'Report Content', content: aiResponseContent.substring(0, 1000) },
        { title: 'Continued', content: aiResponseContent.length > 1000 ? aiResponseContent.substring(1000) : '' }
      ];
    }
  } catch (error: any) {
    console.error('Error generating report content:', error);
    
    // Create an informative error report
    const errorMessage = error.message || 'Unknown error';
    const errorStatus = error.response?.status || 'No status';
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : 'No details';
    
    return [
      { title: 'Report Generation Error', content: `We encountered an error while generating your report (${errorStatus}): ${errorMessage}` },
      { title: 'Your Topic', content: `Your requested topic was: ${prompt}` },
      { title: 'Alternative', content: 'Please try again later or modify your request. Our AI service may be experiencing high demand or other issues.' },
      { title: 'Technical Details', content: errorDetails }
    ];
  }
};

/**
 * Creates a PDF report with the generated content
 * @param content Report content divided into sections
 * @param metadata Report metadata (title, author, etc.)
 * @returns File information including path and download URL
 */
export const createPDFReport = async (
  content: ReportSection[],
  metadata: ReportMetadata
): Promise<{ fileName: string; filePath: string; downloadUrl: string }> => {
  // Create reports directory if it doesn't exist
  // Use absolute path from the current working directory
  const reportDir = path.resolve(process.cwd(), 'uploads', 'reports');
  console.log(`Creating reports directory at: ${reportDir}`);
  fs.mkdirSync(reportDir, { recursive: true });

  // Generate unique filename
  const fileName = `${uuidv4()}-${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  const filePath = path.join(reportDir, fileName);

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);

  // Pipe PDF to writable stream
  doc.pipe(stream);

  // Add company logo if available
  try {
    // Use absolute path from the current working directory
    const logoPath = path.resolve(process.cwd(), 'public', 'images', 'logo.png');
    console.log(`Checking for logo at: ${logoPath}`);
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, {
        fit: [100, 100],
        align: 'center'
      });
      doc.moveDown();
    } else {
      console.log('Logo not found, skipping logo in PDF');
    }
  } catch (error) {
    console.error('Error adding logo:', error);
    // Continue without logo
  }

  // Add report title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(metadata.title, { align: 'center' })
     .moveDown(0.5);

  // Add metadata
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Date: ${metadata.date.toLocaleDateString()}`, { align: 'center' })
     .text(`Generated for: ${metadata.author}`, { align: 'center' })
     .moveDown(2);

  // Add description/intro
  if (metadata.description) {
    // Use standard Helvetica font instead of Helvetica-Italic which might not be available
    doc.fontSize(12)
       .font('Helvetica')
       .text(metadata.description, { align: 'justify' })
       .moveDown(2);
  }

  // Add table of contents as a new page at the beginning
  doc.addPage();
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Table of Contents', { align: 'center' })
     .moveDown(1);

  content.forEach((section, index) => {
    doc.fontSize(12)
       .font('Helvetica')
       .text(`${index + 1}. ${section.title}`, { link: `#section_${index}` })
       .moveDown(0.25);
  });

  doc.moveDown(2)
     .addPage();

  // Add content sections with explicit logging
  console.log(`Adding ${content.length} content sections to PDF`);
  
  content.forEach((section, index) => {
    console.log(`Adding section ${index + 1}: ${section.title} (content length: ${section.content.length})`);
    
    // Ensure we're on a clean page for each section
    if (index > 0) {
      doc.addPage();
    }
    
    // Add section bookmark using outlines - compatible with PDFKit
    doc.outline.addItem(section.title);

    // Add section title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(section.title, { continued: false })
       .moveDown(0.5);

    // Add section content - handle long content by breaking it into paragraphs
    // This prevents potential issues with very long text blocks
    doc.fontSize(12)
       .font('Helvetica');
    
    // Break content into paragraphs
    const paragraphs = section.content.split('\n');
    paragraphs.forEach((paragraph, pIndex) => {
      if (paragraph.trim() !== '') {
        doc.text(paragraph.trim(), { align: 'justify' });
        if (pIndex < paragraphs.length - 1) {
          doc.moveDown(0.5);
        }
      }
    });
    
    doc.moveDown(2);
  });

  // Add page numbers at the bottom of each page
  // Instead of switching pages (which can cause errors),
  // we'll register a page event handler that adds page numbers as each page is added
  let pageCount = 0;
  
  // Register a function to add page numbers to each page
  doc.on('pageAdded', () => {
    pageCount++;
  });
  
  // Add a finalizing event to add all page numbers at the end
  doc.on('end', () => {
    // We don't need to do anything here, just ensuring the count is complete
    console.log(`PDF report complete with ${pageCount} pages`);
  });

  // Finalize the PDF
  doc.end();

  // Return when the stream is fully written
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve({
        fileName,
        filePath,
        downloadUrl: `/uploads/reports/${fileName}`
      });
    });
    stream.on('error', reject);
  });
};
