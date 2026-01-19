import OpenAI from 'openai';
import { DOCUMENT_FIELD_MAPPING, UNIVERSAL_FIELDS, VALIDATION_FIELDS } from '../config/document-fields.js';

export class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }

  async analyzeDocument(fileBase64, documentType = null, ocrData = null, fileType = 'image') {
    try {
      const prompt = this.buildPrompt(documentType, ocrData);
      
      // Determine the appropriate MIME type based on file type
      const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${fileBase64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.05 // Lower temperature for more consistent extraction
      });

      let jsonContent = response.choices[0].message.content.trim();
      
      // Clean up potential markdown code blocks and other formatting
      jsonContent = this.cleanJsonResponse(jsonContent);
      
      const extractedData = JSON.parse(jsonContent);
      return this.processExtractedData(extractedData);
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  async analyzeDocumentText(extractedText, documentType = null, ocrData = null) {
    try {
      const prompt = this.buildTextPrompt(extractedText, documentType, ocrData);
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.05
      });

      let jsonContent = response.choices[0].message.content.trim();
      
      // Clean up potential markdown code blocks and other formatting
      jsonContent = this.cleanJsonResponse(jsonContent);
      
      const extractedData = JSON.parse(jsonContent);
      return this.processExtractedData(extractedData);
    } catch (error) {
      console.error('Error analyzing document text:', error);
      throw new Error(`Document text analysis failed: ${error.message}`);
    }
  }

  buildTextPrompt(extractedText, documentType, ocrData = null) {
    const fieldMapping = documentType ? this.getFieldMappingForType(documentType) : null;
    
    return `
You are an expert Indian financial document analyzer. Analyze the provided text extracted from a document and extract structured data with maximum precision.

EXTRACTED TEXT:
${extractedText}

CRITICAL INSTRUCTIONS:
1. ACCURACY FIRST: Extract exactly what you see in the text
2. INDIAN FORMATS: Use DD/MM/YYYY for dates, ₹ for currency
3. FIELD MAPPING: Extract only fields that are clearly present in the text
4. CONFIDENCE SCORING: Be conservative with confidence scores

DOCUMENT CLASSIFICATION:
${documentType ? `Document type provided: ${documentType}` : 'Auto-classify from these types: LIFE_INSURANCE, HEALTH_INSURANCE, MUTUAL_FUND, BANK_STATEMENT, etc.'}

${fieldMapping ? `
REQUIRED FIELDS FOR ${documentType}:
${JSON.stringify(fieldMapping, null, 2)}
` : ''}

UNIVERSAL NOMINEE FIELDS (Always extract if present):
- Nominee Name: Full name of beneficiary/nominee
- Nominee Relationship: Wife, Husband, Son, Daughter, Father, Mother, Self, etc.
- Nominee Percentage: Share percentage (should total 100% for all nominees)

OUTPUT FORMAT (JSON only):
{
  "documentClassification": {
    "type": "DETECTED_DOCUMENT_TYPE",
    "category": "MAIN_CATEGORY",
    "confidence": 0.95,
    "detectedInsurer": "LIC|ICICI|SBI|etc"
  },
  "extractedFields": {
    // All fields extracted from the text
    "nomineeName": "EXACT_NOMINEE_NAME",
    "nomineeRelationship": "Wife|Husband|Son|etc",
    "nomineePercentage": 100
  },
  "validation": {
    "confidenceScore": 0.88,
    "dataQualityAssessment": "High|Medium|Low",
    "fieldConfidences": {
      "fieldName": 0.95
    },
    "extractionNotes": ["notes_about_extraction"]
  },
  "rawText": "${extractedText.substring(0, 500)}..."
}

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no explanations.
Start directly with { and end with }.
`;
  }

  buildPrompt(documentType, ocrData = null) {
    const fieldMapping = documentType ? this.getFieldMappingForType(documentType) : null;
    
    let ocrContext = '';
    if (ocrData) {
      ocrContext = `
OCR EXTRACTED TEXT (for reference):
${ocrData.text}

STRUCTURED OCR DATA:
${JSON.stringify(ocrData.keyValuePairs, null, 2)}
`;
    }
    
    return `
You are an expert Indian financial document analyzer with ChatGPT-level accuracy. Your task is to extract structured data from the document image with maximum precision.

${ocrContext}

CRITICAL INSTRUCTIONS:
1. ACCURACY FIRST: Double-check all numerical values, especially policy numbers, amounts, and dates
2. INDIAN FORMATS: Use DD/MM/YYYY for dates, ₹ for currency, Indian name formats
3. FIELD MAPPING: Extract exactly the fields shown in the document, don't invent data
4. CONFIDENCE SCORING: Be conservative - if unsure, mark confidence as low

DOCUMENT CLASSIFICATION:
Classify from these exact types:
- LIFE_INSURANCE (LIC, ICICI Prudential, etc.)
- HEALTH_INSURANCE, MOTOR_INSURANCE, PROPERTY_INSURANCE
- PAN_CARD, AADHAAR_CARD, PASSPORT
- BANK_STATEMENT, FIXED_DEPOSIT
- MUTUAL_FUND, DEMAT_STATEMENT, BOND_CERTIFICATE
- EPF_STATEMENT (Employee Provident Fund)
- PPF_STATEMENT (Public Provident Fund)
- RSU_STATEMENT (Restricted Stock Units)
- PORTFOLIO_STATEMENT (Investment Holdings)
- ALTERNATIVE_INVESTMENT (P2P, Invoice Discounting)
- CAPITAL_STATEMENT (Alternative Capital/Fund)
- NPS_STATEMENT (National Pension System)
- PROPERTY_DEED, LOAN_STATEMENT, CREDIT_CARD

EXTRACTION RULES:
${fieldMapping ? `
REQUIRED FIELDS FOR ${documentType}:
${JSON.stringify(fieldMapping, null, 2)}
` : ''}

SPECIFIC PATTERNS TO LOOK FOR:
- Policy Numbers: Usually 6-12 digits for LIC, may contain letters for private insurers
- PAN: AAAAA9999A format (5 letters + 4 digits + 1 letter)
- Aadhaar: 12 digits, may have spaces
- Amounts: Look for ₹, Rs., lakhs, crores - convert to numeric
- Dates: DD/MM/YYYY, DD-MM-YYYY, or spelled out months
- Names: Exact as written, maintain case and spacing
- Addresses: Complete addresses with pin codes

UNIVERSAL NOMINEE FIELDS (ALWAYS EXTRACT):
- Nominee Name: Full name of beneficiary/nominee
- Nominee Relationship: Wife, Husband, Son, Daughter, Father, Mother, Self, etc.
- Nominee Percentage: Share percentage (should total 100% for all nominees)
- Multiple Nominees: If more than one nominee, extract all with their percentages

VALIDATION CHECKS:
- Cross-check ages with dates of birth
- Verify premium amounts seem reasonable vs sum assured
- Check if nominee shares add up to 100%
- Validate mandatory fields for document type

OUTPUT FORMAT (JSON only):
{
  "documentClassification": {
    "type": "EXACT_DOCUMENT_TYPE",
    "category": "MAIN_CATEGORY",
    "confidence": 0.95,
    "detectedInsurer": "LIC|ICICI|SBI|etc"
  },
  "extractedFields": {
    "policyNumber": "exact_as_written",
    "policyHolderName": "EXACT_NAME_AS_SHOWN",
    "sumAssured": 3500000,
    "premium": 180387,
    "commencementDate": "12/09/2016",
    "maturityDate": "12/09/2050",
    
    // UNIVERSAL NOMINEE FIELDS (Always include)
    "nomineeName": "EXACT_NOMINEE_NAME",
    "nomineeRelationship": "Wife|Husband|Son|Daughter|Father|Mother|Self",
    "nomineePercentage": 100,
    "additionalNominees": [
      {
        "nomineeName": "SECOND_NOMINEE_NAME",
        "relationship": "Son",
        "percentage": 50
      }
    ]
    // ... all other visible fields
  },
  "validation": {
    "confidenceScore": 0.88,
    "dataQualityAssessment": "High|Medium|Low",
    "fieldConfidences": {
      "policyNumber": 0.95,
      "policyHolderName": 0.92
    },
    "extractionNotes": ["any_special_observations"],
    "missingInformationFlags": ["list_missing_fields"]
  },
  "rawText": "complete_visible_text_from_document"
}

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no explanations, no additional text.
Do NOT wrap the JSON in backticks or code blocks.
Start directly with { and end with }.
Be extremely precise with numerical values and exact text extraction.
`;
  }

  getFieldMappingForType(documentType) {
    for (const category of Object.values(DOCUMENT_FIELD_MAPPING)) {
      for (const type of Object.values(category)) {
        if (type.type === documentType) {
          return type.fields;
        }
      }
    }
    return null;
  }

  processExtractedData(data) {
    // Add processing timestamp
    if (!data.metadata) {
      data.metadata = {};
    }
    data.metadata.processingTimestamp = new Date().toISOString();

    // Validate required fields based on document type
    const validationResults = this.validateExtractedData(data);
    data.validation = { ...data.validation, ...validationResults };

    // Calculate overall confidence score
    data.validation.overallConfidence = this.calculateOverallConfidence(data);

    return data;
  }

  validateExtractedData(data) {
    const validation = {
      requiredFieldsMissing: [],
      formatValidationErrors: [],
      dataConsistencyIssues: []
    };

    if (!data.documentClassification?.type) {
      validation.requiredFieldsMissing.push('documentType');
      return validation;
    }

    const fieldMapping = this.getFieldMappingForType(data.documentClassification.type);
    if (!fieldMapping) {
      return validation;
    }

    // Check required fields
    for (const [fieldName, fieldConfig] of Object.entries(fieldMapping)) {
      if (fieldConfig.required && !data.extractedFields[fieldName]) {
        validation.requiredFieldsMissing.push(fieldName);
      }

      // Validate patterns (PAN, Aadhaar, etc.)
      if (fieldConfig.pattern && data.extractedFields[fieldName]) {
        const regex = new RegExp(fieldConfig.pattern);
        if (!regex.test(data.extractedFields[fieldName])) {
          validation.formatValidationErrors.push(`${fieldName}: Invalid format`);
        }
      }

      // Validate enums
      if (fieldConfig.enum && data.extractedFields[fieldName]) {
        if (!fieldConfig.enum.includes(data.extractedFields[fieldName])) {
          validation.formatValidationErrors.push(`${fieldName}: Invalid value`);
        }
      }
    }

    return validation;
  }

  cleanJsonResponse(jsonContent) {
    // Remove markdown code blocks
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    // Remove any leading/trailing whitespace or non-JSON content
    jsonContent = jsonContent.trim();
    
    // Find the first { and last } to extract only the JSON part
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    
    return jsonContent;
  }

  calculateOverallConfidence(data) {
    if (!data.validation?.fieldConfidences) {
      return data.validation?.confidenceScore || 0.5;
    }

    const confidenceValues = Object.values(data.validation.fieldConfidences);
    const avgConfidence = confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
    
    // Factor in missing required fields
    const missingFieldsPenalty = (data.validation.requiredFieldsMissing?.length || 0) * 0.1;
    
    return Math.max(0, avgConfidence - missingFieldsPenalty);
  }

  async classifyDocument(fileBase64, fileType = 'image') {
    try {
      const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Classify this Indian financial document. Return only JSON:

DOCUMENT TYPES:
- LIFE_INSURANCE, HEALTH_INSURANCE, MOTOR_INSURANCE, PROPERTY_INSURANCE
- PAN_CARD, AADHAAR_CARD, PASSPORT
- BANK_STATEMENT, FIXED_DEPOSIT
- MUTUAL_FUND, DEMAT_STATEMENT, BOND_CERTIFICATE
- EPF_STATEMENT (Employee Provident Fund)
- PPF_STATEMENT (Public Provident Fund) 
- RSU_STATEMENT (Restricted Stock Units)
- PORTFOLIO_STATEMENT (Investment Holdings)
- ALTERNATIVE_INVESTMENT (P2P, Invoice Discounting)
- CAPITAL_STATEMENT (Alternative Capital/Fund)
- NPS_STATEMENT (National Pension System)
- PROPERTY_DEED, LOAN_STATEMENT, CREDIT_CARD

{
  "type": "DOCUMENT_TYPE",
  "category": "MAIN_CATEGORY", 
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${fileBase64}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      let jsonContent = response.choices[0].message.content.trim();
      jsonContent = this.cleanJsonResponse(jsonContent);
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error classifying document:', error);
      throw new Error(`Document classification failed: ${error.message}`);
    }
  }
}