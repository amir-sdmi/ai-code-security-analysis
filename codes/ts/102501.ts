import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import {
  semanticContentMatching,
  type LegalContext,
  type SemanticMatchResult,
} from "@/lib/semantic-matching";
import {
  detectLegalIntentHybrid,
  type LegalIntentResult,
} from "@/lib/grok-intent";
// 🚀 SPRINT 3: Cache System Integration
import {
  getCachedGrokIntent,
  getCachedGrokSynthesis,
  getCachedMevzuatSearch,
  generateCacheKey,
  updateCacheStats,
} from "@/lib/vercel-cache";
import { dbCache } from "@/lib/db-cache";

// Grok AI client
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// const MEVZUAT_SERVICE_URL = process.env.MEVZUAT_SERVICE_URL || "http://localhost:8080";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MevzuatSearchResult {
  documents: Array<{
    mevzuatId: string;
    mevzuatAdi: string;
    mevzuatNo?: number;
    mevzuatTur: {
      id: number;
      name: string;
      description: string;
    };
    resmiGazeteTarihi?: string;
    resmiGazeteSayisi?: string;
    url?: string;
  }>;
  total_results: number;
  current_page: number;
  page_size: number;
  total_pages: number;
  query_used: unknown;
  error_message?: string;
}

// LegalIntentResult now imported from @/lib/grok-intent

// 🆕 User limits & premium strategy
interface UserAnalysisLimits {
  freeDetailedAnalysisUsed: number;
  freeDetailedAnalysisLimit: number;
  isPremium: boolean;
  premiumTier?: "basic" | "pro" | "enterprise";
}

async function getUserAnalysisLimits(): Promise<UserAnalysisLimits> {
  // _userId: string - currently unused as we're using hardcoded demo limits
  // Production: User limits implemented
  // Şimdilik hardcoded demo limits
  return {
    freeDetailedAnalysisUsed: 0, // Bu gerçekte DB'den gelecek
    freeDetailedAnalysisLimit: 3, // Free users: 3 detailed analysis per month
    isPremium: false, // Clerk'den premium status çek
    premiumTier: undefined,
  };
}

async function incrementUserAnalysisUsage(userId: string): Promise<void> {
  // Production: Increment user detailed analysis usage
  // Database update logic will go here
  void userId; // Temporary to avoid linter error
}

// Intent detection now handled by modular system in @/lib/grok-intent

// 🚀 Akıllı Mevzuat Arama - Çoklu Strateji
async function smartMevzuatSearch(
  intentResult: LegalIntentResult,
  lawTypes: string[] = ["KANUN", "YONETMELIK", "CB_KARARNAME"]
): Promise<MevzuatSearchResult | undefined> {
  console.log(
    `🚀 SPRINT 2: Enhanced search starting for: "${intentResult.searchTerm}"`
  );
  console.log(`🏷️ Domain: ${intentResult.legalDomain}`);

  try {
    // 🆕 SPRINT 2: Use enhanced search with semantic filtering
    const { enhancedMevzuatSearch } = await import("@/lib/semantic-filter");

    const enhancedResult = await enhancedMevzuatSearch(
      intentResult.searchTerm,
      intentResult.legalDomain,
      "fulltext",
      5 // Get top 5 most relevant results
    );

    if (enhancedResult.results.length > 0) {
      console.log(
        `✅ SPRINT 2: Enhanced search found ${enhancedResult.results.length} filtered results`
      );
      console.log(
        `📈 Average relevance: ${enhancedResult.stats.averageRelevance?.toFixed(
          2
        )}`
      );

      // Convert enhanced results to MevzuatSearchResult format
      const convertedResult: MevzuatSearchResult = {
        documents: enhancedResult.results.map((result) => ({
          mevzuatId: result.mevzuatId,
          mevzuatAdi: result.mevzuatAdi,
          mevzuatNo: result.mevzuatNo,
          mevzuatTur: result.mevzuatTur,
          resmiGazeteTarihi: result.resmiGazeteTarihi,
          resmiGazeteSayisi: result.resmiGazeteSayisi,
          url: result.url,
        })),
        total_results: enhancedResult.rawCount,
        current_page: 1,
        page_size: enhancedResult.results.length,
        total_pages: 1,
        query_used: {
          originalQuery: intentResult.searchTerm,
          domain: intentResult.legalDomain,
          enhancedStats: enhancedResult.stats,
        },
      };

      return convertedResult;
    }

    // Fallback to original search if enhanced search fails
    console.log(
      `⚠️ SPRINT 2: Enhanced search found no results, falling back to original search`
    );

    // 🔄 FALLBACK: Original search logic
    const expandedSearchTerms = expandSearchKeywords(
      intentResult.searchTerm,
      intentResult.legalDomain
    );

    let result = await getMevzuatInfo(
      intentResult.searchTerm,
      "fulltext",
      lawTypes
    );

    if (result && result.documents.length > 0) {
      console.log(`✅ Fallback found ${result.documents.length} documents`);
      return result;
    }

    // Try expanded terms
    for (const expandedTerm of expandedSearchTerms) {
      result = await getMevzuatInfo(expandedTerm, "fulltext", lawTypes);
      if (result && result.documents.length > 0) {
        console.log(
          `✅ Fallback found ${result.documents.length} documents with expanded term`
        );
        return result;
      }
    }

    console.log("❌ No documents found with any search strategy");
    return undefined;
  } catch (error) {
    console.error("🚨 SPRINT 2: Enhanced search error:", error);

    // Fallback to original search on error
    console.log("🔄 Falling back to original search due to error");
    const result = await getMevzuatInfo(
      intentResult.searchTerm,
      "fulltext",
      lawTypes
    );

    return result;
  }
}

// 🆕 Keyword expansion system
function expandSearchKeywords(
  searchTerm: string,
  legalDomain: string
): string[] {
  const keywordMap: Record<string, string[]> = {
    // Turizm related expansions
    turizm: [
      "turizm",
      "otel",
      "konaklama",
      "tatil evi",
      "kısa süreli kiralama",
    ],
    konut: ["konut", "ev", "mesken", "ikametgah", "bina"],
    "turizm konut": [
      "turizm teşvik",
      "konaklama",
      "tatil evi kiralama",
      "kısa süreli kiralama",
    ],

    // Ceza hukuku expansions
    hırsızlık: [
      "hırsızlık",
      "çalma",
      "mal varlığına karşı suçlar",
      "mala zarar verme",
    ],
    suç: ["suç", "ceza", "kabahat", "yaptırım"],

    // İş hukuku expansions
    işçi: ["işçi", "çalışan", "personel", "iş sözleşmesi"],
    hakları: ["hakları", "yükümlülükler", "sosyal güvenlik", "kıdem"],

    // İdare hukuku expansions
    ruhsat: ["ruhsat", "izin", "lisans", "yetki belgesi"],
    belediye: ["belediye", "büyükşehir", "il özel idare", "mahalli idare"],
  };

  const expandedTerms: string[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  // Direct keyword mapping
  if (keywordMap[lowerSearchTerm]) {
    expandedTerms.push(...keywordMap[lowerSearchTerm]);
  }

  // Partial matching for compound terms
  Object.keys(keywordMap).forEach((key) => {
    if (lowerSearchTerm.includes(key) && key !== lowerSearchTerm) {
      expandedTerms.push(...keywordMap[key]);
    }
  });

  // Domain-specific additions
  const domainExpansions = getDomainKeywords(legalDomain);
  expandedTerms.push(...domainExpansions);

  // Remove duplicates and original term
  return [...new Set(expandedTerms)]
    .filter((term) => term.toLowerCase() !== lowerSearchTerm && term.length > 2)
    .slice(0, 3); // Max 3 expanded terms
}

// 🆕 Domain-specific keyword mapping
function getDomainKeywords(legalDomain: string): string[] {
  const domainMap: Record<string, string[]> = {
    "Turizm Hukuku": ["turizm teşvik", "konaklama", "otel işletme"],
    "Ceza Hukuku": ["türk ceza kanunu", "ceza muhakemesi"],
    "İş Hukuku": ["iş kanunu", "sendikalar", "toplu iş sözleşmesi"],
    "İdare Hukuku": ["belediye kanunu", "idari usul", "kamu yönetimi"],
    "Medeni Hukuk": ["türk medeni kanunu", "aile hukuku", "miras"],
    "Ticaret Hukuku": ["türk ticaret kanunu", "şirketler", "ticari işletme"],
    "Sigorta Hukuku": ["sigorta kanunu", "sosyal güvenlik", "tazminat"],
  };

  return domainMap[legalDomain] || [];
}

// MCP'den mevzuat bilgisi çekme
async function getMevzuatInfo(
  searchTerm: string,
  searchType: string,
  lawTypes: string[] = ["KANUN"]
): Promise<MevzuatSearchResult | undefined> {
  try {
    // 🔍 DEBUG: MCP arama parametrelerini kontrol et
    console.log("🔎 === MCP SEARCH DEBUG ===");
    console.log("🔍 Search term:", searchTerm);
    console.log("📋 Search type:", searchType);
    console.log("⚖️ Law types:", lawTypes);

    const searchParams =
      searchType === "title"
        ? { mevzuatAdi: searchTerm, mevzuatTurleri: lawTypes }
        : { phrase: searchTerm, mevzuatTurleri: lawTypes };

    console.log("📤 Search params:", JSON.stringify(searchParams, null, 2));

    const response = await fetch(`http://localhost:3000/api/mevzuat/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...searchParams,
        pageNumber: 1,
        pageSize: 3, // Sadece ilk 3 sonuç - token tasarrufu
        sortField: "RESMI_GAZETE_TARIHI",
        sortDirection: "desc",
      }),
    });

    console.log("📥 MCP Response status:", response.status);

    if (!response.ok) {
      console.error(
        "❌ MCP response not OK:",
        response.status,
        response.statusText
      );
      throw new Error(`MCP error: ${response.status}`);
    }

    const data: MevzuatSearchResult = await response.json();

    console.log("✅ MCP Search Results:");
    console.log("📊 Total results:", data.total_results);
    console.log("📄 Documents found:", data.documents?.length || 0);
    if (data.documents?.length > 0) {
      console.log("📋 First document:", data.documents[0].mevzuatAdi);
    }
    console.log("🔎 === MCP SEARCH DEBUG END ===");

    return data;
  } catch (error) {
    console.error("❌ MCP search error:", error);
    return undefined;
  }
}

// 🆕 Phase 4: Advanced Semantic Content Matching
async function getSemanticMevzuatContent(
  mevzuatId: string,
  userQuery: string,
  legalContext: LegalContext
): Promise<
  { content: string; semanticResult: SemanticMatchResult } | undefined
> {
  try {
    console.log("🔬 === SEMANTIC CONTENT DEBUG ===");
    console.log("📄 Mevzuat ID:", mevzuatId);
    console.log("❓ User Query:", userQuery);
    console.log("🏷️ Keywords:", legalContext.keywords);

    // MCP'den mevzuat detayını çek
    const response = await fetch(`http://localhost:3000/api/mevzuat/detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mevzuatId: mevzuatId,
        keywords: legalContext.keywords,
        userQuery: userQuery,
      }),
    });

    console.log("📥 MCP Detail Response status:", response.status);

    if (!response.ok) {
      console.error(`❌ Detailed content fetch failed: ${response.status}`);
      return undefined;
    }

    const detailData = await response.json();
    console.log("📊 Detail Data Keys:", Object.keys(detailData));
    console.log("📝 Content length:", detailData.content?.length || 0);
    console.log("📝 Text length:", detailData.text?.length || 0);
    console.log("📝 Articles count:", detailData.articles?.length || 0);

    const fullContent = detailData.content || detailData.text || "";
    console.log("📄 Full content length:", fullContent.length);

    if (!fullContent) {
      console.log("❌ No content found in detail data");
      console.log("🔍 Available fields:", Object.keys(detailData));
      return undefined;
    }

    console.log("🚀 Starting semantic matching...");
    // 🚀 Semantic matching ile en ilgili içerikleri bul
    const semanticResult = await semanticContentMatching(
      userQuery,
      fullContent,
      legalContext,
      5 // Max 5 chunk
    );

    console.log("✅ Semantic matching completed");
    console.log("📊 Chunks found:", semanticResult.chunks.length);
    console.log("📊 Average score:", semanticResult.averageScore);

    // En iyi chunk'ları birleştir
    const relevantContent = semanticResult.chunks
      .map((chunk) => `## ${chunk.reasoning}\n\n${chunk.text}`)
      .join("\n\n---\n\n");

    console.log("📄 Relevant content length:", relevantContent.length);
    console.log("🔬 === SEMANTIC CONTENT DEBUG END ===");

    return {
      content: relevantContent,
      semanticResult,
    };
  } catch (error) {
    console.error("❌ Semantic content fetch error:", error);
    return undefined;
  }
}

// Grok'a gönderilecek sistem mesajı
function createSystemPrompt(
  mevzuatData: MevzuatSearchResult | undefined,
  intentResult?: LegalIntentResult,
  semanticContent?: string | undefined,
  semanticResult?: SemanticMatchResult,
  requestDetailedAnalysis?: boolean
): string {
  let prompt = `Sen JurisGen AI, Türk hukuku konusunda uzman bir yapay zeka asistanısın.

ÖZELLİKLERİN:
• Türk hukuku ve mevzuatı hakkında detaylı bilgiye sahipsin
• Net, anlaşılır ve yapıcı cevaplar verirsin
• Yasal dayanakları belirtirsin
• Profesyonel ama dostane bir dil kullanırsın

🚨 KRİTİK KAYNAK DOĞRULAMA KURALLARI:
• SADECE aşağıda verilen mevzuat listesindeki kanunlardan bilgi kullan
• Hiçbir zaman olmayan madde numarası veya mevzuat referansı verme
• Eğer spesifik madde bilgisi yoksa "genel hukuki bilgiler" olarak belirt
• "Madde X" diyorsan, o maddenin içeriği mutlaka aşağıdaki kaynaklarda olmalı
• Şüphen varsa "Bu konuda uzman görüşü alınmalı" de, uydurma

KURALLARIN:
• Hukuki tavsiye değil, bilgilendirme amaçlı yanıt ver
• Kesin hüküm bildirmekten kaçın, "uzman görüşü alınmalı" ifadesi kullan
• Mevzuat kaynaklarını belirt`;

  if (requestDetailedAnalysis) {
    prompt += `\n\n🔬 DETAYLI ANALİZ MODU AKTIF:
• Mevzuat metinlerinden doğrudan alıntı yap
• Madde numaralarını belirt
• Spesifik hukuki referanslar ver
• Daha detaylı ve kaynak gösterebilen cevap ver
• Hangi mevzuattan hangi bilgiyi aldığını açıkça belirt
• "Bu bilgi [Mevzuat Adı] Madde X'den alınmıştır" şeklinde kaynak göster
• ⚠️ UYARI: Sadece aşağıda verilen kaynaklardaki bilgileri kullan!`;
  }

  if (intentResult?.needsLegalResearch) {
    prompt += `\n\nTESPİT EDİLEN HUKUK ALANI: ${intentResult.legalDomain}`;
    if (intentResult.mainLegislation) {
      prompt += `\nİLGİLİ ANA MEVZUAT: ${intentResult.mainLegislation}`;
    }
    prompt += `\nGÜVEN SKORU: ${(intentResult.confidence * 100).toFixed(0)}%`;
  }

  if (mevzuatData && mevzuatData.documents.length > 0) {
    prompt += `\n\n📋 BULUNAN MEVZUAT BİLGİLERİ (SADECE BUNLARI KULLAN):
${mevzuatData.documents
  .filter((doc) => doc.mevzuatAdi)
  .map(
    (doc) =>
      `• ${doc.mevzuatAdi || "İsimsiz Mevzuat"} (${
        doc.mevzuatTur?.name || "Bilinmeyen Tür"
      }${doc.mevzuatNo ? " No: " + doc.mevzuatNo : ""})${
        doc.resmiGazeteTarihi ? "\n  RG Tarihi: " + doc.resmiGazeteTarihi : ""
      }`
  )
  .join("\n")}

🚨 ÖNEMLİ: Yukarıdaki mevzuat listesinde OLMAYAN hiçbir kanun veya maddeye referans verme!
Eğer spesifik madde içeriği yoksa "Bu konuda [Mevzuat Adı]'nda düzenleme bulunmaktadır ancak detay bilgi için uzman görüşü alınmalıdır" şeklinde cevap ver.`;

    if (mevzuatData.total_results > 3) {
      prompt += `\n\n(Toplam ${mevzuatData.total_results} ilgili mevzuat bulundu, en güncel 3'ü gösterildi)`;
    }
  } else if (intentResult?.needsLegalResearch) {
    prompt += `\n\n⚠️ UYARI: Spesifik mevzuat bulunamadı. Genel hukuki bilgilerden yararlanıyorsun.
Cevabında "Bu bilgi genel hukuki bilgilerden alınmıştır, spesifik mevzuat metni bulunamadı. Kesin bilgi için uzman görüşü alınmalıdır." şeklinde belirt.
🚨 HİÇBİR ZAMAN spesifik madde numarası veya mevzuat adı uydurma!`;
  }

  if (semanticContent && semanticResult) {
    prompt += `\n\n🎯 SEMANTİK ANALİZ SONUÇLARI:
• Toplam ${semanticResult.totalChunks} bölüm analiz edildi
• Ortalama uyum skoru: ${(semanticResult.averageScore * 100).toFixed(1)}%
• İşlem süresi: ${semanticResult.processingTime}ms
• En iyi eşleşme skoru: ${
      semanticResult.bestMatch
        ? (semanticResult.bestMatch.score * 100).toFixed(1) + "%"
        : "N/A"
    }

DETAYLI MEVZUAT İÇERİĞİ (SADECE BUNLARI KULLAN):
${semanticContent}

🚨 KAYNAK DOĞRULAMA: Yukarıdaki içerikte olmayan hiçbir madde veya bilgiyi referans gösterme!`;
  }

  return prompt;
}

// Enhanced system prompt for Sprint 4 Enhanced Search integration
function createEnhancedSystemPrompt(
  enhancedSearchResponse: any,
  intentResult: any,
  semanticContent?: string,
  semanticResult?: SemanticMatchResult,
  isPremium: boolean = false
): string {
  let prompt = `Sen JurisGen AI, Türk hukuku konusunda uzman bir yapay zeka asistanısın.

ÖZELLİKLERİN:
• Türk hukuku ve mevzuatı hakkında detaylı bilgiye sahipsin
• Net, anlaşılır ve yapıcı cevaplar verirsin
• Yasal dayanakları belirtirsin
• Profesyonel ama dostane bir dil kullanırsın

🚨 KRİTİK KAYNAK DOĞRULAMA KURALLARI:
• SADECE aşağıda verilen mevzuat listesindeki kanunlardan bilgi kullan
• Hiçbir zaman olmayan madde numarası veya mevzuat referansı verme
• Eğer spesifik madde bilgisi yoksa "genel hukuki bilgiler" olarak belirt
• "Madde X" diyorsan, o maddenin içeriği mutlaka aşağıdaki kaynaklarda olmalı
• Şüphen varsa "Bu konuda uzman görüşü alınmalı" de, uydurma

KURALLARIN:
• Hukuki tavsiye değil, bilgilendirme amaçlı yanıt ver
• Kesin hüküm bildirmekten kaçın, "uzman görüşü alınmalı" ifadesi kullan
• Mevzuat kaynaklarını belirt`;

  if (isPremium) {
    prompt += `\n\n💎 PREMIUM KULLANICI - DETAYLI ANALİZ MODU:
• Mevzuat metinlerinden doğrudan alıntı yap
• Madde numaralarını belirt
• Spesifik hukuki referanslar ver
• Daha detaylı ve kaynak gösterebilen cevap ver
• Hangi mevzuattan hangi bilgiyi aldığını açıkça belirt
• "Bu bilgi [Mevzuat Adı] Madde X'den alınmıştır" şeklinde kaynak göster
• ⚠️ UYARI: Sadece aşağıda verilen kaynaklardaki bilgileri kullan!`;
  }

  // Intent detection results
  if (intentResult) {
    prompt += `\n\n🤖 AI INTENT DETECTION SONUÇLARI:
• Tespit Edilen Hukuk Alanı: ${intentResult.domain}
• Güven Skoru: ${(intentResult.confidence * 100).toFixed(0)}%
• Detection Method: ${intentResult.method}
• Anahtar Kelimeler: ${intentResult.keywords.join(", ")}`;
  }

  // Enhanced Search results
  if (enhancedSearchResponse?.results?.length > 0) {
    prompt += `\n\n🚀 SPRINT 4 ENHANCED SEARCH SONUÇLARI:
📊 Bulunan Mevzuat: ${enhancedSearchResponse.results.length} belge
📈 Toplam Tarama: ${enhancedSearchResponse.rawCount || "N/A"} belge
⚡ İşlem Süresi: Yüksek performans

📋 BULUNAN MEVZUAT BİLGİLERİ (SADECE BUNLARI KULLAN):
${enhancedSearchResponse.results
  .map(
    (doc: any, index: number) =>
      `${index + 1}. ${doc.mevzuatAdi || "İsimsiz Mevzuat"} (${
        doc.mevzuatTur?.name || "Bilinmeyen Tür"
      })
   • Relevance Score: ${(doc.relevanceScore * 100).toFixed(1)}%
   • Filter Reason: ${doc.filterReason || "N/A"}
   • Mevzuat ID: ${doc.mevzuatId}`
  )
  .join("\n")}

🎯 SPRINT 4 ÖZELLİKLERİ KULLANILDI:
• Query Expansion: Sorgu genişletildi
• Confidence Scoring: Güven skorları hesaplandı  
• Intent Classification: Hukuk alanı tespit edildi
• Result Ranking: Sonuçlar akıllı sıralandı

🚨 ÖNEMLİ: Yukarıdaki mevzuat listesinde OLMAYAN hiçbir kanun veya maddeye referans verme!`;

    // Enhanced Search stats
    if (enhancedSearchResponse.stats) {
      prompt += `\n\n📊 ENHANCED SEARCH İSTATİSTİKLERİ:
• Original Count: ${enhancedSearchResponse.stats.originalCount || 0}
• Filtered Count: ${enhancedSearchResponse.stats.filteredCount || 0}
• Final Count: ${enhancedSearchResponse.stats.finalCount || 0}
• Average Relevance: ${(
        (enhancedSearchResponse.stats.averageRelevance || 0) * 100
      ).toFixed(1)}%`;
    }
  } else {
    prompt += `\n\n⚠️ UYARI: Enhanced Search sonuç bulamadı. Genel hukuki bilgilerden yararlanıyorsun.
Cevabında "Bu bilgi genel hukuki bilgilerden alınmıştır, spesifik mevzuat metni bulunamadı. Kesin bilgi için uzman görüşü alınmalıdır." şeklinde belirt.
🚨 HİÇBİR ZAMAN spesifik madde numarası veya mevzuat adı uydurma!`;
  }

  // Premium semantic content
  if (isPremium && semanticContent && semanticResult) {
    prompt += `\n\n🔬 PREMIUM SEMANTİK ANALİZ SONUÇLARI:
• Toplam ${semanticResult.totalChunks} bölüm analiz edildi
• Ortalama uyum skoru: ${(semanticResult.averageScore * 100).toFixed(1)}%
• İşlem süresi: ${semanticResult.processingTime}ms
• En iyi eşleşme skoru: ${
      semanticResult.bestMatch
        ? (semanticResult.bestMatch.score * 100).toFixed(1) + "%"
        : "N/A"
    }

💎 DETAYLI MEVZUAT İÇERİĞİ (PREMIUM - SADECE BUNLARI KULLAN):
${semanticContent}

🚨 KAYNAK DOĞRULAMA: Yukarıdaki içerikte olmayan hiçbir madde veya bilgiyi referans gösterme!`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // User limits check - Premium gets semantic content
    const userLimits = await getUserAnalysisLimits();

    // 🚀 NEW APPROACH: Use Enhanced Search API for all users
    console.log("🚀 Using Enhanced Search API for chat...");

    // Step 1: Get intent detection for domain classification
    const startTime = Date.now();
    const intentResult = await getCachedGrokIntent(message, () =>
      detectLegalIntentHybrid(message)
    );
    const intentTime = Date.now() - startTime;
    console.log(`⚡ Intent Detection: ${intentTime}ms`);

    // Step 2: Use Enhanced Search API (Sprint 4 features)
    const enhancedSearchStartTime = Date.now();
    let enhancedSearchResponse;

    try {
      const enhancedSearchUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/enhanced-search`;
      const searchResponse = await fetch(enhancedSearchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          domain: intentResult.domain,
          maxResults: 5,
        }),
      });

      if (searchResponse.ok) {
        enhancedSearchResponse = await searchResponse.json();
        console.log(
          `🎯 Enhanced Search: ${
            enhancedSearchResponse.results?.length || 0
          } results`
        );
      } else {
        console.warn("Enhanced Search API failed, falling back to legacy");
        enhancedSearchResponse = null;
      }
    } catch (error) {
      console.error("Enhanced Search API error:", error);
      enhancedSearchResponse = null;
    }

    const enhancedSearchTime = Date.now() - enhancedSearchStartTime;
    console.log(`⚡ Enhanced Search: ${enhancedSearchTime}ms`);

    // Step 3: Premium users get additional semantic content analysis
    let semanticContent: string | undefined = undefined;
    let semanticResult: SemanticMatchResult | undefined = undefined;

    if (userLimits.isPremium && enhancedSearchResponse?.results?.length > 0) {
      console.log("💎 Premium user - adding semantic content analysis...");

      const legalContext: LegalContext = {
        domain: intentResult.domain,
        legislation: intentResult.domain.replace(" Hukuku", "") || "Genel",
        keywords: intentResult.keywords,
        userQuery: message,
        confidence: intentResult.confidence,
      };

      const semanticData = await getSemanticMevzuatContent(
        enhancedSearchResponse.results[0].mevzuatId,
        message,
        legalContext
      );

      if (semanticData) {
        semanticContent = semanticData.content;
        semanticResult = semanticData.semanticResult;
        console.log("🔬 Semantic content analysis completed");
      }
    }

    // Step 4: Create system prompt based on Enhanced Search results
    const systemPrompt = createEnhancedSystemPrompt(
      enhancedSearchResponse,
      intentResult,
      semanticContent,
      semanticResult,
      userLimits.isPremium
    );

    // Step 5: Generate AI response with Grok
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const synthesisStartTime = Date.now();
    const synthesisKey = JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 100),
      })),
      maxTokens: userLimits.isPremium ? 3000 : 1500,
    });

    // Try database cache first for Grok responses
    let response = await dbCache.getGrokResponse(synthesisKey, "synthesis");
    let completion: any = null;

    if (!response) {
      // Call Grok AI if not cached
      completion = await grok.chat.completions.create({
        model: "grok-3-mini",
        messages: messages,
        max_tokens: userLimits.isPremium ? 3000 : 1500,
        temperature: 0.3,
      });

      response = completion.choices[0]?.message?.content;

      // Cache the response
      if (response) {
        await dbCache.setGrokResponse(
          synthesisKey,
          "synthesis",
          {
            response,
            usage: completion.usage,
          },
          30
        ); // 30 minutes TTL for synthesis
      }
    } else {
      // Use cached response
      completion = { usage: response.usage || { total_tokens: 0 } };
      response = response.response;
      console.log("🎯 DB CACHE HIT - Grok Synthesis");
    }

    const synthesisTime = Date.now() - synthesisStartTime;
    console.log(`⚡ Grok Synthesis: ${synthesisTime}ms`);

    if (!response) {
      throw new Error("No response from AI");
    }

    // Step 6: Prepare response data
    const responseData = {
      response,
      mevzuatInfo:
        enhancedSearchResponse?.results?.length > 0
          ? {
              foundDocuments: enhancedSearchResponse.results.length,
              totalResults:
                enhancedSearchResponse.rawCount ||
                enhancedSearchResponse.results.length,
              searchKeywords: intentResult.keywords,
              aiIntent: {
                legalDomain: intentResult.domain,
                mainLegislation:
                  intentResult.domain.replace(" Hukuku", "") || "Genel",
                confidence: intentResult.confidence,
                searchType: "enhanced" as const,
              },
              // 🆕 Enhanced Search metadata
              enhancedSearchMetadata: {
                method: "sprint4_enhanced_search",
                stats: enhancedSearchResponse.stats,
                processingTime: enhancedSearchTime,
                sprint4FeaturesUsed: [
                  "query_expansion",
                  "confidence_scoring",
                  "intent_classification",
                  "result_ranking",
                ],
              },
              // 🆕 Semantic analysis info (Premium only)
              semanticAnalysis: semanticResult
                ? {
                    totalChunks: semanticResult.totalChunks,
                    averageScore: semanticResult.averageScore,
                    processingTime: semanticResult.processingTime,
                    bestMatchScore: semanticResult.bestMatch?.score || 0,
                    chunksUsed: semanticResult.chunks.length,
                    premiumFeature: true,
                  }
                : undefined,
            }
          : undefined,
      tokenUsage: {
        totalTokens: completion.usage?.total_tokens || 0,
        estimatedCost: `$${(
          (completion.usage?.total_tokens || 0) * 0.000001
        ).toFixed(6)}`,
      },
      analysisMode: userLimits.isPremium ? "premium_enhanced" : "free_enhanced",
      userLimits: {
        isPremium: userLimits.isPremium,
        tier:
          userLimits.premiumTier || (userLimits.isPremium ? "basic" : "free"),
        featuresUsed: [
          "enhanced_search",
          "sprint4_features",
          ...(userLimits.isPremium ? ["semantic_analysis"] : []),
        ],
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
