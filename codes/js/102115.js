import OpenAI from 'openai';
import CompanyRecord from '../models/company_model';

export async function createCompanyRecord(recordFields) {
  try {
    const newCompanyRecord = new CompanyRecord();
    newCompanyRecord.companyName = recordFields.companyName;
    newCompanyRecord.name = recordFields.companyName.toLowerCase();
    newCompanyRecord.productCategories = recordFields.productCategories;
    newCompanyRecord.categorizedScores = recordFields.categorizedScores;
    newCompanyRecord.overallScore = recordFields.overallScore;
    newCompanyRecord.summary = recordFields.summary;
    newCompanyRecord.logoImage = recordFields.logoImage;
    const savedRecord = await newCompanyRecord.save();
    return savedRecord;
  } catch (error) {
    throw new Error(`create company record error: ${error}`);
  }
}

export async function getCompanyRecords() {
  try {
    const records = await CompanyRecord.find();
    return records;
  } catch (error) {
    throw new Error(`get company records error: ${error}`);
  }
}

export async function getCompanyRecord(id) {
  try {
    const record = await CompanyRecord.findById(id);
    return record;
  } catch (error) {
    throw new Error(`get company record error: ${error}`);
  }
}

export async function deleteCompanyRecord(id) {
  try {
    const res = await CompanyRecord.findByIdAndDelete(id);
    return res;
  } catch (error) {
    throw new Error(`delete company record error: ${error}`);
  }
}

export async function deleteAllCompanyRecords() {
  try {
    const res = await CompanyRecord.deleteMany();
    return res;
  } catch (error) {
    throw new Error(`delete all company records error: ${error}`);
  }
}

export async function updateCompanyRecord(id, recordFields) {
  try {
    const res = await CompanyRecord.findByIdAndUpdate(id, recordFields, {
      new: true,
    });
    return res;
  } catch (error) {
    throw new Error(`update company record error: ${error}`);
  }
}

export async function getPopularCompanies(category) {
  if (category === 'All'){
    try {
      const gradesList = ['A-', 'A', 'A+', 'B+'];
      const res = await CompanyRecord.find({
        overallScore: { $in: gradesList },
      });
      return res;
    } catch (error) {
      throw new Error(`Couldn't get the requested companies' info: ${error}`);
    }
  }
  else {
    try {
      const gradesList = ['A-', 'A', 'A+', 'B+'];
      const res = await CompanyRecord.find({
        overallScore: { $in: gradesList },
        productCategories: category,
      });
      return res;
    } catch (error) {
      throw new Error(`Couldn't get the requested companies' info: ${error}`);
    }
  }
}

export async function getBoycottedCompanies(category) {
  if (category === 'All'){
    try {
      const gradesList = [
        'B',
        'B-',
        'C+',
        'C',
        'C-',
        'D+',
        'D',
        'D-',
        'E+',
        'E',
        'E-',
        'F',
      ];
      const res = await CompanyRecord.find({
        overallScore: { $in: gradesList },
      });
      return res;
    } catch (error) {
      throw new Error(`Couldn't get the requested companies' info: ${error}`);
    }
  }
  else {
    try {
      const gradesList = [
        'B',
        'B-',
        'C+',
        'C',
        'C-',
        'D+',
        'D',
        'D-',
        'E+',
        'E',
        'E-',
        'F',
      ];
      const res = await CompanyRecord.find({
        overallScore: { $in: gradesList },
        productCategories: category,
      });
      return res;
    } catch (error) {
      throw new Error(`Couldn't get the requested companies' info: ${error}`);
    }
  }
}

// I wrote this method using ChatGPT and https://platform.openai.com/docs/api-reference/introduction
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function fetchCompanyInfoFromChatGpt(companyName) {
  console.log('\nI am here - about to use chatgpt!');
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'You are an API that provides detailed information about the ethical performance of companies based on their name.',
      },
      {
        role: 'user',
        content: `Provide detailed information about the ethical performance of the company named ${companyName}. 
        If the provided company name is misspelled or unclear, retrieve information for a company with a name similar to the one provided, ensuring accuracy and relevance even in cases of minor misspellings or ambiguity.
        Please refrain from providing explanations regarding the selection process of the company for which information is requested. Simply proceed with providing the requested metadata.
        Here is the requested metadata:
        - CompanyName (Just the company name. Don't add any other explanation)
        - Categorized Scores:
          - Climate and Sustainability: 
            -Score
            -Explanation
          - Livable Wage: 
            -Score
            -Explanation
          - Diversity, Equity, and Inclusion:
            -Score
            -Explanation
          - Child Labor:
            -Score
            -Explanation
          - Human Rights Violations:
            -Score
            -Explanation
          - Animal Cruelty:
            -Score
            -Explanation
        - Product Categories (Ensure that the categories you choose are among the following list of 10 categories: Technology, Healthcare, Finance, Consumer_Goods, Retail, Automotive, Energy, Telecommunications, Food, Beverage, Transportation, Logistics)
        - Overall Score
        - Summary: Provide a summarized explanation of the overall score
        - logoImage: Provide the 200x200 pixel logo image of the company. Provide just the image url (for example: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png) and no other explanation. Ensure that this image url is a valid url for this company's logo image.
        Please provide the scores in the form of letter grades (such as A+, C-, B, D, etc) and be very thorough and critical in your evaluation of each company's performance. 
        If a company has ties with Israel, rate its overall score as an 'F' as well as its human rights violations score as an F.
        We aim to ensure the most accurate analysis of each company possible. Don't format the response in a markdown format.
        Please provide the answer in exactly the requested format.
        `,
      },
    ],
    max_tokens: 500,
    n: 1,
    stop: null,
    temperature: 0.7,
  });

  let companyData;
  try {
    companyData = parseCompanyData(response.choices[0].message.content);
  } catch (parseError) {
    throw new Error('Failed to parse company data');
  }
  return companyData;
}

// I got the following methods from chatgpt
const axios = require('axios');

async function isValidUrl(url) {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function parseCompanyData(responseContent) {
  const companyNameMatch = responseContent.match(/- CompanyName: (.+)/);
  const companyName = companyNameMatch ? companyNameMatch[1].trim() : '';
  const categorizedScores = {};
  const scoresRegex = /- (.+?):\s+- Score: (.+?)\s+- Explanation: (.+)/g;
  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = scoresRegex.exec(responseContent)) !== null) {
    const category = match[1].trim();
    const score = match[2].trim();
    const explanation = match[3].trim();
    categorizedScores[category] = { score, explanation };
  }

  const productCategoriesMatch = responseContent.match(/- Product Categories: (.+)/);
  const productCategories = productCategoriesMatch
    ? productCategoriesMatch[1].split(',').map((category) => {
      return category.trim();
    })
    : [];

  const overallScoreMatch = responseContent.match(/- Overall Score: (.+)/);
  const overallScore = overallScoreMatch ? overallScoreMatch[1].trim() : '';

  const summaryMatch = responseContent.match(/- Summary: (.+)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  const logoMatch = responseContent.match(/- logoImage: (.+)/);
  const logoImageUrl = logoMatch ? logoMatch[1].trim() : '';

  let logoImage;
  console.log('\nThe logoImageUrl here is: ', logoImageUrl);
  const isValidImage = await isValidUrl(logoImageUrl);
  if (isValidImage) {
    logoImage = logoImageUrl;
  } else {
    logoImage = 'https://media.giphy.com/media/UYBDCJjwOd9Re/giphy.gif';
  }

  const companyData = {
    companyName,
    categorizedScores,
    productCategories,
    overallScore,
    summary,
    logoImage,
  };

  return companyData;
}

async function validateGPTAPIResults(companyData) {
  if (
    Object.values(companyData).some(
      (value) => { return value === '' || (typeof value === 'object' && Object.keys(value).length === 0); },
    )
  ) {
    return false;
  }
  return true;
}

export async function getCompanyInfo(companyName) {
  try {
    const res = await CompanyRecord.findOne({
      name: companyName.toLowerCase(),
    });
    if (!res) {
      let companyInfo = await fetchCompanyInfoFromChatGpt(companyName);
      let isValidResults = await validateGPTAPIResults(companyInfo);
      console.log('\nFirst time query');

      if (!isValidResults) {
        // Retry fetching company info
        companyInfo = await fetchCompanyInfoFromChatGpt(companyName);
        isValidResults = await validateGPTAPIResults(companyInfo);
        console.log('\nSecond time query');
      }

      if (!isValidResults) {
        throw new Error(`Invalid results received for ${companyName}`);
      }

      const result = await createCompanyRecord({
        companyName: companyInfo.companyName,
        productCategories: companyInfo.productCategories,
        categorizedScores: companyInfo.categorizedScores,
        overallScore: companyInfo.overallScore,
        summary: companyInfo.summary,
        logoImage: companyInfo.logoImage,
      });

      return result;
    }
    return res;
  } catch (error) {
    throw new Error(`Couldn't get the requested company's info: ${error}`);
  }
}

export async function fetchProductInfo(barcode) {
  console.log('\nThe barcode is: ', barcode);
  const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
  const url = `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    // Access and return the info of the manufacturer from the response data
    const product = response.data.products[0];
    const manufacturer = product ? (product.manufacturer || product.brand) : null;
    console.log('\nThe manufacturer is: ', manufacturer);
    const companyInfo = await getCompanyInfo(manufacturer);
    console.log('\nThe companyInfo related to the product is: ', companyInfo);
    return companyInfo;
  } catch (error) {
    console.error(`Error fetching product info: ${error}`);
    throw error;
  }
}
