// Example script that uses both OpenAI API and PDF converter
import callChatGPT from './openai.js';
import convertMarkdownToPdf from './pdf.js';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate markdown content using ChatGPT and convert it to PDF
 * @param {string} prompt - The prompt to send to ChatGPT
 * @param {string} outputMarkdownFile - Path to save the markdown file
 * @param {string} outputPdfFile - Path to save the PDF file
 */
async function generateMarkdownAndConvertToPdf(prompt, outputMarkdownFile, outputPdfFile) {
  try {
    console.log('🤖 Generating markdown content using ChatGPT...');

    // Call ChatGPT to generate markdown content
    const markdownContent = await callChatGPT({
      prompt: `Generate a markdown document about: ${prompt}. Include headings, lists, code blocks, and a table.`,
      maxTokens: 1000,
      temperature: 0.7,
      isJsonResponse: false
    });

    console.log('✅ Markdown content generated successfully!');

    // Save the markdown content to a file
    const markdownPath = join(__dirname, outputMarkdownFile);
    await fs.writeFile(markdownPath, markdownContent);
    console.log(`📝 Markdown file saved to: ${markdownPath}`);

    // Convert the markdown file to PDF
    console.log('🔄 Converting markdown to PDF...');
    const pdfPath = await convertMarkdownToPdf(
      markdownPath,
      join(__dirname, outputPdfFile),
      {
        pdf: {
          format: 'A4',
          orientation: 'portrait',
          border: {
            top: '20mm',
            left: '20mm',
            bottom: '20mm',
            right: '20mm'
          }
        },
        ghStyle: true,
        defaultStyle: true
      }
    );

    console.log('🎉 Process completed successfully!');
    console.log(`📄 PDF file saved to: ${pdfPath}`);

    return {
      markdownPath,
      pdfPath
    };
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Export the function
export { generateMarkdownAndConvertToPdf };

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const topic = process.argv[2] || 'The benefits of using Markdown for documentation';
  const outputMarkdown = process.argv[3] || 'ai-generated.md';
  const outputPdf = process.argv[4] || 'ai-generated.pdf';

  console.log(`Topic: ${topic}`);
  console.log(`Output Markdown: ${outputMarkdown}`);
  console.log(`Output PDF: ${outputPdf}`);

  generateMarkdownAndConvertToPdf(topic, outputMarkdown, outputPdf)
    .then(() => console.log('Done!'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
} 