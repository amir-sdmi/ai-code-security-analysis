import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { File, FileDocument } from '../files/file.schema';
import { Template, TemplateDocument } from '../templates/template.schema';
import { GeneratedDocument, GeneratedDocumentDocument } from '../generated-documents/generated-document.schema';
import { GridFSBucket } from 'mongodb';
import * as pdfParse from 'pdf-parse';
import { ChatGptService } from '../services/chatgpt.service';
import { LatexService } from '../services/latex.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResumeService {
  private gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
    @InjectModel(GeneratedDocument.name) private generatedDocumentModel: Model<GeneratedDocumentDocument>,
    @InjectConnection() private connection: Connection,
    private chatGptService: ChatGptService,
    private latexService: LatexService,
  ) {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }
    this.gridFSBucket = new GridFSBucket(this.connection.db);
  }

  async generateResume(
    userId: string,
    templateId: string,
    documentId: string,
    instructions: string,
  ): Promise<{ 
    generatedDocumentId: string; 
    message: string; 
    previewUrl: string;
  }> {
    // Fetch the document
    const document = await this.fileModel.findOne({
      _id: documentId,
      userId: new Types.ObjectId(userId),
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Fetch the template
    const template = await this.templateModel.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const { main_tex_id, main_cls_id } = template;

    try {
      // Step 1: Extract PDF content
      const extractedPdfContent = await this.extractPdfContent(document);

      // Step 2: Get template files (.tex and optional .cls)
      const templateFileContents = await this.latexService.getTemplateFiles(
        main_tex_id.toString(), 
        main_cls_id ? main_cls_id.toString() : undefined
      );

      // Step 3: Generate customized LaTeX using ChatGPT
      const customizedLatex = await this.chatGptService.generateCustomizedLatex(
        templateFileContents.texContent,
        extractedPdfContent,
        instructions,
      );

      // Step 4: Compile LaTeX to PDF
      const pdfBuffer = await this.latexService.compileLatexToPdf(
        customizedLatex,
        templateFileContents.clsContent,
        templateFileContents.clsFileName,
      );

      // Step 5: Store the generated PDF in GridFS
      const gridFSId = await this.storePdfInGridFS(pdfBuffer, userId);

      // Step 6: Create generated document record
      const generatedDocument = await this.createGeneratedDocument(
        userId,
        templateId,
        documentId,
        gridFSId,
        customizedLatex,
        instructions,
      );

      return {
        generatedDocumentId: (generatedDocument._id as Types.ObjectId).toString(),
        message: 'Resume generated successfully',
        previewUrl: `/api/generated-documents/${(generatedDocument._id as Types.ObjectId).toString()}/preview`,
      };

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to generate resume: ${error.message}`);
    }
  }

  private async extractPdfContent(document: FileDocument): Promise<string> {
    try {
      // Verify it's a PDF file
      if (document.mimetype !== 'application/pdf') {
        throw new BadRequestException('Document must be a PDF file');
      }

      // Download the file from GridFS
      const downloadStream = this.gridFSBucket.openDownloadStream(document.gridFSId);
      
      // Collect the file data
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('end', async () => {
          try { 
            const buffer = Buffer.concat(chunks);
            
            // Parse PDF and extract text
            const pdfData = await pdfParse(buffer);
            
            if (!pdfData.text || pdfData.text.trim().length === 0) {
              throw new BadRequestException('PDF document appears to be empty or contains no readable text');
            }

            resolve(pdfData.text);
          } catch (error) {
            reject(new BadRequestException(`Failed to extract text from PDF: ${error.message}`));
          }
        });

        downloadStream.on('error', (error) => {
          reject(new BadRequestException(`Failed to download document: ${error.message}`));
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process document: ${error.message}`);
    }
  }

  private async storePdfInGridFS(pdfBuffer: Buffer, userId: string): Promise<Types.ObjectId> {
    return new Promise((resolve, reject) => {
      const filename = `generated-resume-${uuidv4()}.pdf`;
      const uploadStream = this.gridFSBucket.openUploadStream(filename, {
        metadata: {
          userId: new Types.ObjectId(userId),
          contentType: 'application/pdf',
          generatedAt: new Date(),
        },
      });

      uploadStream.on('finish', () => {
        resolve(uploadStream.id as Types.ObjectId);
      });

      uploadStream.on('error', (error) => {
        reject(new BadRequestException(`Failed to store PDF: ${error.message}`));
      });

      uploadStream.end(pdfBuffer);
    });
  }

  private async createGeneratedDocument(
    userId: string,
    templateId: string,
    sourceDocumentId: string,
    pdfGridFSId: Types.ObjectId,
    latexContent: string,
    instructions: string,
  ): Promise<GeneratedDocumentDocument> {
    // Generate a unique name for the document
    const documentName = `Resume ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const generatedDocument = new this.generatedDocumentModel({
      name: documentName,
      userId: new Types.ObjectId(userId),
      templateId: new Types.ObjectId(templateId),
      sourceDocumentId: new Types.ObjectId(sourceDocumentId),
      pdfGridFSId,
      latexContent,
      instructions,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await generatedDocument.save();
  }
} 