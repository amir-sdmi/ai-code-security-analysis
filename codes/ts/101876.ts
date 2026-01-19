import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { OpenAI } from 'openai';
import StockAnalysis from '../models/StockAnalysis';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Path to data files
const dataDir = path.join(__dirname, '../data');
const fScoreFile = path.join(dataDir, 'F_SCORE_SAMPLE.xlsx');
const zScoreFile = path.join(dataDir, 'Z_SCORE_SAMPLE.xlsx');
const financialReportFile = path.join(dataDir, 'BCTC_Q1.2025.xlsx');

// Read the analysis prompt
const promptFile = path.join(process.cwd(), 'Prompt-Recommend-Bot.txt');
const analysisPrompt = fs.readFileSync(promptFile, 'utf-8');

/**
 * Read data from Excel file
 */
const readExcelFile = (filePath: string) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error(`Error reading Excel file ${filePath}:`, error);
    throw new Error(`Cannot read Excel file ${path.basename(filePath)}`);
  }
};

/**
 * Find stock data by symbol
 */
const findStockDataBySymbol = (data: any[], symbol: string) => {
  return data.find((item: any) => 
    item.Symbol === symbol || item.SYMBOL === symbol || item.symbol === symbol
  );
};

/**
 * Extract specific financial metrics from F-Score data
 */
const extractFScoreMetrics = (fScore: any) => {
  return {
    f_score: fScore.N ? parseInt(fScore.N) : parseInt(fScore['Tong diem']),
    roa: parseFloat(fScore.ROA) || 0,
    cfo: parseFloat(fScore.CFO) || 0,
    delta_roa: parseFloat(fScore['ΔROA']) || 0,
    cfo_lnst: parseFloat(fScore.CFO_LNST) || 0,
    debt_change: parseFloat(fScore['Δno dai han']) || 0,
    current_ratio_change: parseFloat(fScore['ΔCurrent Ratio']) || 0,
    share_issuance: parseInt(fScore.SLCP_PH) || 0,
    gross_margin_change: parseFloat(fScore['ΔGross Margin']) || 0,
    asset_turnover_change: parseFloat(fScore['ΔAsset Turnover']) || 0
  };
};

/**
 * Extract specific metrics from Z-Score data
 */
const extractZScoreMetrics = (zScore: any) => {
  return {
    z_score: parseFloat(zScore['TONG DIEM']) || 0,
    sector_id: parseInt(zScore.Sector_ID) || 0,
    industry_rank: parseInt(zScore.RANK) || 0
  };
};

/**
 * Extract specific metrics from financial report data
 */
const extractFinancialReportMetrics = (financialReport: any) => {
  return {
    revenue: parseFloat(financialReport.Revenue) || 0,
    gross_profit: parseFloat(financialReport.GrossProfit) || 0,
    net_profit: parseFloat(financialReport.NetProfit) || 0,
    eps: parseFloat(financialReport.EPS) || 0,
    pe_ratio: parseFloat(financialReport.PE) || 0
  };
};

/**
 * Generate analysis using ChatGPT
 */
const generateAnalysis = async (stockData: any) => {
  try {
    const prompt = `${analysisPrompt}\n\nHere is the stock data to analyze:\n${JSON.stringify(stockData, null, 2)}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a financial analyst specializing in stock market analysis." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const analysisText = response.choices[0]?.message?.content || '';
    
    // Extract sections from the analysis
    const sections = extractSections(analysisText);
    
    return {
      full_analysis: analysisText,
      ...sections
    };
  } catch (error) {
    console.error('Error generating analysis with ChatGPT:', error);
    throw new Error('Cannot generate analysis with ChatGPT');
  }
};

/**
 * Extract sections from analysis text
 */
const extractSections = (analysisText: string) => {
  const financialHealthRegex = /1\.\s*Tổng quan sức khỏe tài chính[\s\S]*?(?=2\.\s*So sánh doanh nghiệp với ngành|$)/i;
  const industryComparisonRegex = /2\.\s*So sánh doanh nghiệp với ngành[\s\S]*?(?=3\.\s*Cảnh báo rủi ro|$)/i;
  const riskWarningsRegex = /3\.\s*Cảnh báo rủi ro[\s\S]*?(?=4\.\s*Khuyến nghị đầu tư|$)/i;
  const recommendationRegex = /4\.\s*Khuyến nghị đầu tư[\s\S]*/i;

  const financial_health = (analysisText.match(financialHealthRegex) || [''])[0].trim();
  const industry_comparison = (analysisText.match(industryComparisonRegex) || [''])[0].trim();
  const risk_warnings = (analysisText.match(riskWarningsRegex) || [''])[0].trim();
  const investment_recommendation = (analysisText.match(recommendationRegex) || [''])[0].trim();

  return {
    financial_health,
    industry_comparison,
    risk_warnings,
    investment_recommendation
  };
};

/**
 * Analyze stock by symbol
 */
export const analyzeStock = async (symbol: string) => {
  try {
    // Check if analysis already exists
    const existingAnalysis = await StockAnalysis.findOne({ where: { symbol } });
    if (existingAnalysis) {
      return existingAnalysis;
    }

    // Read data from Excel files
    const fScoreData = readExcelFile(fScoreFile);
    const zScoreData = readExcelFile(zScoreFile);
    const financialReportData = readExcelFile(financialReportFile);

    // Find stock data by symbol
    const fScore = findStockDataBySymbol(fScoreData, symbol);
    const zScore = findStockDataBySymbol(zScoreData, symbol);
    const financialReport = findStockDataBySymbol(financialReportData, symbol);

    if (!fScore || !zScore || !financialReport) {
      throw new Error(`Data for symbol ${symbol} not found in one or more data sources`);
    }

    // Extract specific metrics from data
    const fScoreMetrics = extractFScoreMetrics(fScore);
    const zScoreMetrics = extractZScoreMetrics(zScore);
    const financialMetrics = extractFinancialReportMetrics(financialReport);

    // Combine data
    const stockData = {
      symbol,
      fScore,
      zScore,
      financialReport
    };

    // Generate analysis with ChatGPT
    const analysis = await generateAnalysis(stockData);

    // Save to database with detailed metrics
    const savedAnalysis = await StockAnalysis.create({
      symbol,
      // F-Score metrics
      ...fScoreMetrics,
      // Z-Score metrics
      ...zScoreMetrics,
      // Financial report metrics
      ...financialMetrics,
      // Analysis sections
      financial_health: analysis.financial_health,
      industry_comparison: analysis.industry_comparison,
      risk_warnings: analysis.risk_warnings,
      investment_recommendation: analysis.investment_recommendation,
      raw_data: stockData
    });

    return savedAnalysis;
  } catch (error) {
    console.error(`Error analyzing stock ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get stock analysis by symbol
 */
export const getStockAnalysis = async (symbol: string) => {
  try {
    const analysis = await StockAnalysis.findOne({ where: { symbol } });
    if (!analysis) {
      return null;
    }
    return analysis;
  } catch (error) {
    console.error(`Error getting analysis for stock ${symbol}:`, error);
    throw error;
  }
};

/**
 * Import stock data to database
 */
export const importStockData = async (symbol: string) => {
  try {
    return await analyzeStock(symbol);
  } catch (error) {
    console.error(`Error importing stock data for ${symbol}:`, error);
    throw error;
  }
}; 