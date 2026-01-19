import OpenAI from "openai";
import { storage } from "./storage";
import { sendTelegramMessage } from "./telegram";
import { Representative, Invoice, Payment } from "@shared/schema";

// xAI Grok API client
const grok = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

export interface PerformanceAnalysis {
  representativeId: number;
  representativeName: string;
  currentWeekSales: number;
  previousWeekSales: number;
  threeWeeksAgoSales: number;
  percentageDropLastWeek: number;
  percentageDropThreeWeeks: number;
  isInactive: boolean;
  insights: string;
  recommendations: string;
}

export interface WeeklyReport {
  totalSales: number;
  activeRepresentatives: number;
  inactiveRepresentatives: Representative[];
  performanceDrops: PerformanceAnalysis[];
  newInvoices: Invoice[];
  overduePayments: { representative: Representative; amount: number; daysPastDue: number }[];
  aiInsights: string;
}

export class AIAnalyticsService {
  
  /**
   * Analyze representative performance using AI
   */
  async analyzeRepresentativePerformance(
    representative: Representative,
    invoices: Invoice[],
    payments: Payment[]
  ): Promise<PerformanceAnalysis> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Calculate sales for different periods
    const currentWeekInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= oneWeekAgo && inv.status === 'paid'
    );
    const previousWeekInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= twoWeeksAgo && 
      new Date(inv.createdAt) < oneWeekAgo && 
      inv.status === 'paid'
    );
    const threeWeeksAgoInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= threeWeeksAgo && 
      new Date(inv.createdAt) < twoWeeksAgo && 
      inv.status === 'paid'
    );

    const currentWeekSales = currentWeekInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const previousWeekSales = previousWeekInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const threeWeeksAgoSales = threeWeeksAgoInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const percentageDropLastWeek = previousWeekSales > 0 
      ? ((previousWeekSales - currentWeekSales) / previousWeekSales) * 100 
      : 0;
    
    const percentageDropThreeWeeks = threeWeeksAgoSales > 0 
      ? ((threeWeeksAgoSales - currentWeekSales) / threeWeeksAgoSales) * 100 
      : 0;

    const isInactive = currentWeekSales === 0 && previousWeekSales === 0;

    // Generate AI insights using Grok
    const prompt = `
    تحلیل عملکرد نماینده فروش:
    نام: ${representative.fullName}
    فروش هفته جاری: ${currentWeekSales.toLocaleString()} تومان
    فروش هفته قبل: ${previousWeekSales.toLocaleString()} تومان  
    فروش سه هفته قبل: ${threeWeeksAgoSales.toLocaleString()} تومان
    کاهش درصدی نسبت به هفته قبل: ${percentageDropLastWeek.toFixed(1)}%
    کاهش درصدی نسبت به سه هفته قبل: ${percentageDropThreeWeeks.toFixed(1)}%
    
    لطفاً یک تحلیل کامل و پیشنهادات عملی برای بهبود عملکرد ارائه دهید. پاسخ را به صورت JSON با فیلدهای insights و recommendations بدهید.
    `;

    try {
      const response = await grok.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "شما یک تحلیلگر خبره فروش هستید. تحلیل‌های دقیق و پیشنهادات عملی ارائه دهید. پاسخ را به فارسی و در قالب JSON بدهید."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        representativeId: representative.id,
        representativeName: representative.fullName,
        currentWeekSales,
        previousWeekSales,
        threeWeeksAgoSales,
        percentageDropLastWeek,
        percentageDropThreeWeeks,
        isInactive,
        insights: aiResponse.insights || 'تحلیل موجود نیست',
        recommendations: aiResponse.recommendations || 'پیشنهادی موجود نیست'
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        representativeId: representative.id,
        representativeName: representative.fullName,
        currentWeekSales,
        previousWeekSales,
        threeWeeksAgoSales,
        percentageDropLastWeek,
        percentageDropThreeWeeks,
        isInactive,
        insights: 'خطا در تحلیل هوشمند',
        recommendations: 'لطفاً دوباره تلاش کنید'
      };
    }
  }

  /**
   * Generate comprehensive weekly report
   */
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const representatives = await storage.getAllRepresentatives();
    const invoices = await storage.getAllInvoices();
    const payments = await storage.getAllPayments();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate weekly metrics
    const weeklyInvoices = invoices.filter(inv => new Date(inv.createdAt) >= oneWeekAgo);
    const paidWeeklyInvoices = weeklyInvoices.filter(inv => inv.status === 'paid');
    const totalSales = paidWeeklyInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Analyze each representative
    const performanceAnalyses: PerformanceAnalysis[] = [];
    const inactiveReps: Representative[] = [];

    for (const rep of representatives) {
      const repInvoices = invoices.filter(inv => inv.representativeId === rep.id);
      const repPayments = payments.filter(pay => pay.representativeId === rep.id);
      
      const analysis = await this.analyzeRepresentativePerformance(rep, repInvoices, repPayments);
      performanceAnalyses.push(analysis);

      if (analysis.isInactive) {
        inactiveReps.push(rep);
      }
    }

    // Find significant performance drops
    const performanceDrops = performanceAnalyses.filter(analysis => 
      analysis.percentageDropLastWeek >= 20 || analysis.percentageDropThreeWeeks >= 20
    );

    // Calculate overdue payments
    const overduePayments = invoices
      .filter(inv => inv.status === 'pending' && new Date(inv.dueDate) < now)
      .map(inv => {
        const representative = representatives.find(rep => rep.id === inv.representativeId);
        const daysPastDue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          representative: representative!,
          amount: inv.amount,
          daysPastDue
        };
      });

    // Generate AI insights for overall performance
    const aiInsights = await this.generateOverallInsights({
      totalSales,
      activeRepresentatives: representatives.length - inactiveReps.length,
      inactiveCount: inactiveReps.length,
      performanceDropsCount: performanceDrops.length,
      overdueCount: overduePayments.length
    });

    return {
      totalSales,
      activeRepresentatives: representatives.length - inactiveReps.length,
      inactiveRepresentatives: inactiveReps,
      performanceDrops,
      newInvoices: weeklyInvoices,
      overduePayments,
      aiInsights
    };
  }

  /**
   * Generate overall business insights using AI
   */
  private async generateOverallInsights(metrics: {
    totalSales: number;
    activeRepresentatives: number;
    inactiveCount: number;
    performanceDropsCount: number;
    overdueCount: number;
  }): Promise<string> {
    const prompt = `
    تحلیل کلی عملکرد سیستم:
    فروش کل هفته: ${metrics.totalSales.toLocaleString()} تومان
    نمایندگان فعال: ${metrics.activeRepresentatives}
    نمایندگان غیرفعال: ${metrics.inactiveCount}
    نمایندگان با کاهش عملکرد: ${metrics.performanceDropsCount}
    فاکتورهای معوقه: ${metrics.overdueCount}
    
    یک تحلیل کلی از وضعیت کسب‌وکار و پیشنهادات استراتژیک ارائه دهید.
    `;

    try {
      const response = await grok.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "شما یک مشاور کسب‌وکار خبره هستید. تحلیل‌های استراتژیک و عملی ارائه دهید."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      return response.choices[0].message.content || 'تحلیل کلی موجود نیست';
    } catch (error) {
      console.error('AI Overall Analysis Error:', error);
      return 'خطا در تولید تحلیل کلی';
    }
  }

  /**
   * Send automated weekly reports to Telegram
   */
  async sendWeeklyReportToTelegram(): Promise<void> {
    const report = await this.generateWeeklyReport();

    // Format and send inactive representatives alert
    if (report.inactiveRepresentatives.length > 0) {
      const inactiveMessage = `🚨 گزارش نمایندگان غیرفعال:

${report.inactiveRepresentatives.map(rep => 
  `• ${rep.fullName} (@${rep.adminUsername})`
).join('\n')}

تعداد کل: ${report.inactiveRepresentatives.length} نماینده`;

      await sendTelegramMessage(inactiveMessage);
    }

    // Send performance drops alert
    if (report.performanceDrops.length > 0) {
      const dropsMessage = `📉 هشدار کاهش عملکرد:

${report.performanceDrops.map(drop => 
  `• ${drop.representativeName}: کاهش ${drop.percentageDropLastWeek.toFixed(1)}% نسبت به هفته قبل`
).join('\n')}`;

      await sendTelegramMessage(dropsMessage);
    }

    // Send overdue payments alert
    if (report.overduePayments.length > 0) {
      const overdueMessage = `⏰ گزارش پرداخت‌های معوقه:

${report.overduePayments.map(payment => 
  `• ${payment.representative.fullName}: ${payment.amount.toLocaleString()} تومان (${payment.daysPastDue} روز تأخیر)`
).join('\n')}`;

      await sendTelegramMessage(overdueMessage);
    }

    // Send weekly summary
    const summaryMessage = `📊 گزارش هفتگی سیستم:

💰 فروش کل: ${report.totalSales.toLocaleString()} تومان
👥 نمایندگان فعال: ${report.activeRepresentatives}
📋 فاکتورهای جدید: ${report.newInvoices.length}

🤖 تحلیل هوشمند:
${report.aiInsights}`;

    await sendTelegramMessage(summaryMessage);

    // Store the report in database
    await storage.createAnalyticsReport({
      type: 'weekly_performance',
      period: 'week',
      data: report,
      insights: report.aiInsights,
      recommendations: report.performanceDrops.map(drop => drop.recommendations).join('\n')
    });
  }

  /**
   * Check for performance drops and send alerts
   */
  async checkPerformanceDrops(): Promise<void> {
    const representatives = await storage.getAllRepresentatives();
    
    for (const rep of representatives) {
      const invoices = await storage.getInvoicesByRepresentative(rep.id);
      const payments = await storage.getPaymentsByRepresentative(rep.id);
      
      const analysis = await this.analyzeRepresentativePerformance(rep, invoices, payments);
      
      // Alert for 20% drop compared to last week
      if (analysis.percentageDropLastWeek >= 20) {
        const message = `⚠️ هشدار کاهش عملکرد:

نماینده: ${rep.fullName}
کاهش فروش: ${analysis.percentageDropLastWeek.toFixed(1)}% نسبت به هفته قبل
فروش فعلی: ${analysis.currentWeekSales.toLocaleString()} تومان
فروش قبلی: ${analysis.previousWeekSales.toLocaleString()} تومان

💡 توصیه هوشمند:
${analysis.recommendations}`;

        await sendTelegramMessage(message);
      }

      // Alert for 20% drop compared to three weeks ago
      if (analysis.percentageDropThreeWeeks >= 20) {
        const message = `📉 هشدار کاهش عملکرد طولانی‌مدت:

نماینده: ${rep.fullName}
کاهش فروش: ${analysis.percentageDropThreeWeeks.toFixed(1)}% نسبت به سه هفته قبل
فروش فعلی: ${analysis.currentWeekSales.toLocaleString()} تومان
فروش سه هفته قبل: ${analysis.threeWeeksAgoSales.toLocaleString()} تومان

🔍 تحلیل:
${analysis.insights}`;

        await sendTelegramMessage(message);
      }
    }
  }

  /**
   * Send collective weekly invoices to Telegram
   */
  async sendWeeklyInvoicesToTelegram(): Promise<void> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyInvoices = await storage.getAllInvoices();
    const thisWeekInvoices = weeklyInvoices.filter(inv => 
      new Date(inv.createdAt) >= oneWeekAgo
    );

    if (thisWeekInvoices.length === 0) {
      return;
    }

    // Group invoices by representative
    const groupedInvoices = thisWeekInvoices.reduce((acc, invoice) => {
      if (!acc[invoice.representativeId]) {
        acc[invoice.representativeId] = [];
      }
      acc[invoice.representativeId].push(invoice);
      return acc;
    }, {} as Record<number, typeof thisWeekInvoices>);

    const representatives = await storage.getAllRepresentatives();
    
    let message = `📋 فاکتورهای هفته جاری:\n\n`;
    
    for (const [repId, invoices] of Object.entries(groupedInvoices)) {
      const representative = representatives.find(rep => rep.id === parseInt(repId));
      if (!representative) continue;
      
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidCount = invoices.filter(inv => inv.status === 'paid').length;
      
      message += `👤 ${representative.fullName}:
• تعداد فاکتور: ${invoices.length}
• مبلغ کل: ${totalAmount.toLocaleString()} تومان
• پرداخت شده: ${paidCount}/${invoices.length}
${invoices.map(inv => 
  `  - ${inv.amount.toLocaleString()} تومان (${inv.status === 'paid' ? '✅ پرداخت شده' : '⏳ در انتظار'})`
).join('\n')}

`;
    }

    const totalWeeklyAmount = thisWeekInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    message += `💰 مجموع فروش هفته: ${totalWeeklyAmount.toLocaleString()} تومان`;

    await sendTelegramMessage(message);
  }
}

export const aiAnalytics = new AIAnalyticsService();