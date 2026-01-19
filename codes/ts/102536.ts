import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export const maxDuration = 30

// Enhanced language detection with better French support
function detectLanguage(text: string): "ar" | "fr" | "en" {
  const lowerText = text.toLowerCase().trim()
  console.log("🗣️ Detecting language for:", lowerText)

  // Arabic detection (highest priority)
  if (/[\u0600-\u06FF]/.test(text)) {
    console.log("✅ Detected: Arabic")
    return "ar"
  }

  // Enhanced French detection
  const frenchIndicators = [
    "je",
    "j'ai",
    "tu",
    "il",
    "elle",
    "nous",
    "vous",
    "ils",
    "elles",
    "mon",
    "ma",
    "mes",
    "ton",
    "ta",
    "tes",
    "son",
    "sa",
    "ses",
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "dans",
    "à",
    "avec",
    "pour",
    "sur",
    "par",
    "sans",
    "sous",
    "perdu",
    "perdue",
    "cherche",
    "trouve",
    "trouvé",
    "téléphone",
    "portable",
    "sac",
    "clé",
    "clés",
    "portefeuille",
    "lunettes",
    "chien",
    "chat",
    "où",
    "quand",
    "comment",
    "pourquoi",
    "c'est",
    "qu'il",
    "qu'elle",
  ]

  // English indicators
  const englishIndicators = [
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "my",
    "your",
    "his",
    "her",
    "the",
    "a",
    "an",
    "in",
    "at",
    "on",
    "with",
    "for",
    "and",
    "or",
    "lost",
    "find",
    "search",
    "looking",
    "missing",
    "found",
    "phone",
    "bag",
    "key",
    "keys",
    "wallet",
    "glasses",
    "dog",
    "cat",
    "where",
    "when",
    "what",
    "how",
    "is",
    "was",
    "have",
    "do",
    "will",
    "can",
  ]

  let frenchScore = 0
  let englishScore = 0

  for (const indicator of frenchIndicators) {
    if (lowerText.includes(indicator)) {
      const weight = ["j'ai", "où", "c'est", "téléphone", "perdu"].includes(indicator) ? 2 : 1
      frenchScore += weight
    }
  }

  for (const indicator of englishIndicators) {
    if (lowerText.includes(indicator)) {
      englishScore++
    }
  }

  console.log(`📊 Language scores - French: ${frenchScore}, English: ${englishScore}`)

  if (frenchScore > englishScore) {
    console.log("✅ Detected: French")
    return "fr"
  } else if (frenchScore === englishScore && frenchScore > 0) {
    console.log("✅ Detected: French (preference)")
    return "fr"
  } else if (englishScore > 0) {
    console.log("✅ Detected: English")
    return "en"
  }

  console.log("✅ Detected: French (default)")
  return "fr"
}

// Function to detect if user is asking about a specific item ID
function isAskingAboutItemId(text: string) {
  const patterns = [
    /\b(item|objet|id|number|numéro|#)\s*(\d+)\b/i,
    /\b(\d+)\s*(item|objet|id|number|numéro)\b/i,
    /^#?\s*(\d+)$/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const numberId = match.find((group) => /^\d+$/.test(group))
      if (numberId) {
        return Number.parseInt(numberId)
      }
    }
  }
  return null
}

// Dictionnaire de traduction vers le français
const translationDictionary = {
  // Electronics - Électronique
  phone: "téléphone",
  smartphone: "téléphone",
  mobile: "téléphone",
  هاتف: "téléphone",
  laptop: "ordinateur",
  computer: "ordinateur",
  pc: "ordinateur",
  حاسوب: "ordinateur",
  كمبيوتر: "ordinateur",
  tablet: "tablette",
  لوحي: "tablette",
  تابلت: "tablette",

  // Personal items - Objets personnels
  wallet: "portefeuille",
  محفظة: "portefeuille",
  key: "clé",
  keys: "clés",
  مفتاح: "clé",
  مفاتيح: "clés",
  bag: "sac",
  حقيبة: "sac",
  backpack: "sac",
  watch: "montre",
  ساعة: "montre",
  glasses: "lunettes",
  نظارات: "lunettes",
  ring: "bague",
  خاتم: "bague",

  // Animals - Animaux
  dog: "chien",
  كلب: "chien",
  cat: "chat",
  قط: "chat",
  pet: "animal",
  حيوان: "animal",

  // Documents
  passport: "passeport",
  جواز: "passeport",
  card: "carte",
  بطاقة: "carte",
  document: "document",
  وثيقة: "document",

  // Other items - Autres objets
  umbrella: "parapluie",
  مظلة: "parapluie",
  bicycle: "vélo",
  bike: "vélo",
  دراجة: "vélo",
  book: "livre",
  كتاب: "livre",
  money: "argent",
  مال: "argent",

  // Cities - Villes
  casa: "casablanca",
  "الدار البيضاء": "casablanca",
  الرباط: "rabat",
  مراكش: "marrakech",
  marrakesh: "marrakech",
  فاس: "fes",
  fez: "fes",
  طنجة: "tanger",
  tangier: "tanger",
  أغادير: "agadir",
  مكناس: "meknes",
  وجدة: "oujda",
  القنيطرة: "kenitra",
  تطوان: "tetouan",

  // Colors - Couleurs
  black: "noir",
  white: "blanc",
  red: "rouge",
  blue: "bleu",
  green: "vert",
  yellow: "jaune",
  أسود: "noir",
  أبيض: "blanc",
  أحمر: "rouge",
  أزرق: "bleu",
  أخضر: "vert",
  أصفر: "jaune",

  // Brands - Marques (keep as is but add common variations)
  iphone: "apple",
  آيفون: "apple",

  // Actions - Actions
  lost: "perdu",
  find: "trouve",
  search: "cherche",
  looking: "cherche",
  missing: "perdu",
  found: "trouvé",
}

// Fonction pour convertir les mots en français
function translateToFrench(text: string): string {
  let translatedText = text.toLowerCase()

  console.log("🔄 Original text:", text)

  // Replace each word/phrase with its French equivalent
  for (const [original, french] of Object.entries(translationDictionary)) {
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
    if (translatedText.includes(original.toLowerCase())) {
      translatedText = translatedText.replace(regex, french)
      console.log(`🔄 Translated "${original}" → "${french}"`)
    }
  }

  console.log("✅ Final translated text:", translatedText)
  return translatedText
}

// Fonction simplifiée pour extraire les mots-clés (maintenant en français)
function extractItemKeywords(text: string) {
  // D'abord traduire le texte en français
  const translatedText = translateToFrench(text)
  const lowerText = translatedText.toLowerCase()
  const originalLower = text.toLowerCase()

  // Mots-clés français pour les objets
  const frenchItems = [
    "téléphone",
    "portable",
    "ordinateur",
    "tablette",
    "portefeuille",
    "clé",
    "clés",
    "sac",
    "montre",
    "lunettes",
    "bague",
    "chien",
    "chat",
    "animal",
    "passeport",
    "carte",
    "document",
    "parapluie",
    "vélo",
    "livre",
    "argent",
  ]

  // Marques qui indiquent généralement des appareils électroniques
  const brandNames = [
    "samsung",
    "apple",
    "huawei",
    "xiaomi",
    "nokia",
    "sony",
    "lg",
    "motorola",
    "oneplus",
    "oppo",
    "vivo",
    "realme",
  ]

  const foundItems = []

  // Chercher les objets français dans le texte traduit ET original
  for (const item of frenchItems) {
    if (lowerText.includes(item) || originalLower.includes(item)) {
      foundItems.push(item)
    }
  }

  // Chercher les marques
  const foundBrands = brandNames.filter((brand) => lowerText.includes(brand))
  if (foundBrands.length > 0 && foundItems.length === 0) {
    foundItems.push("téléphone") // Assume it's a phone if only brand is mentioned
  }

  // Ajouter les marques trouvées
  foundItems.push(...foundBrands)

  console.log("📱 Extracted French keywords:", foundItems)
  return [...new Set(foundItems)] // Remove duplicates
}

// Fonction simplifiée pour extraire les villes (maintenant en français)
function extractCities(text: string) {
  // D'abord traduire le texte en français
  const translatedText = translateToFrench(text)
  const lowerText = translatedText.toLowerCase()
  const originalLower = text.toLowerCase()

  // Villes françaises
  const frenchCities = [
    "rabat",
    "casablanca",
    "marrakech",
    "fes",
    "tanger",
    "agadir",
    "meknes",
    "oujda",
    "kenitra",
    "tetouan",
  ]

  const foundCities = []

  // Chercher les villes françaises dans le texte traduit ET original
  for (const city of frenchCities) {
    if (lowerText.includes(city) || originalLower.includes(city)) {
      foundCities.push(city)
    }
  }

  console.log("🏙️ Extracted French cities:", foundCities)
  return [...new Set(foundCities)] // Remove duplicates
}

// Enhanced function to analyze conversation context
function analyzeConversationContext(messages: any[]) {
  let lastUserMessage = ""
  let lastAssistantMessage = ""
  const conversationItems = []
  const conversationCities = []
  let userLanguage = "fr" // Default to French

  const recentMessages = messages.slice(-4)

  for (const message of recentMessages) {
    if (message.role === "user") {
      lastUserMessage = message.content
      userLanguage = detectLanguage(message.content)
      const items = extractItemKeywords(message.content)
      const cities = extractCities(message.content)
      conversationItems.push(...items)
      conversationCities.push(...cities)
    } else if (message.role === "assistant") {
      lastAssistantMessage = message.content
    }
  }

  // Check if this is a new search
  const currentItems = extractItemKeywords(lastUserMessage)
  const currentCities = extractCities(lastUserMessage)
  const currentLanguage = detectLanguage(lastUserMessage)

  const isNewSearch =
    currentItems.length > 0 &&
    currentCities.length === 0 &&
    (lastAssistantMessage.includes("matching items") ||
      lastAssistantMessage.includes("objets correspondants") ||
      lastAssistantMessage.includes("عناصر مطابقة") ||
      lastAssistantMessage.includes("No matches found") ||
      lastAssistantMessage.includes("Aucune correspondance") ||
      lastAssistantMessage.includes("لم يتم العثور"))

  const isWaitingForCity =
    lastAssistantMessage.includes("City is required") ||
    lastAssistantMessage.includes("Ville requise") ||
    lastAssistantMessage.includes("المدينة مطلوبة") ||
    lastAssistantMessage.includes("city you lost it in") ||
    lastAssistantMessage.includes("ville vous l'avez perdu") ||
    lastAssistantMessage.includes("quelle ville") ||
    lastAssistantMessage.includes("which city") ||
    lastAssistantMessage.includes("تحديد المدينة") ||
    lastAssistantMessage.includes("specify the city")

  const isWaitingForDetails =
    lastAssistantMessage.includes("More details needed") ||
    lastAssistantMessage.includes("Plus de détails") ||
    lastAssistantMessage.includes("تفاصيل أكثر") ||
    lastAssistantMessage.includes("need more information") ||
    lastAssistantMessage.includes("plus d'informations")

  return {
    lastUserMessage,
    lastAssistantMessage,
    conversationItems: isNewSearch ? currentItems : [...new Set(conversationItems)],
    conversationCities: isNewSearch ? currentCities : [...new Set(conversationCities)],
    isWaitingForCity,
    isWaitingForDetails,
    userLanguage: currentLanguage,
    isNewSearch,
  }
}

// Check if user is searching for items - Version corrigée
function isSearchingForItems(text: string, context: any = null) {
  console.log("🔍 Checking if searching for items:", text)

  // Traduire d'abord le texte pour détecter les mots-clés
  const translatedText = translateToFrench(text)
  console.log("🔄 Translated text for search detection:", translatedText)

  // Mots-clés qui indiquent une recherche d'objet perdu (plus complets)
  const lostKeywords = [
    // Français
    "perdu",
    "perdus",
    "perdue",
    "perdues",
    "cherche",
    "recherche",
    "trouve",
    "trouvé",
    "retrouve",
    "retrouver",
    // Anglais
    "lost",
    "missing",
    "search",
    "looking",
    "find",
    "found",
    // Arabe
    "فقدت",
    "فقد",
    "ضاع",
    "ضائع",
    "مفقود",
    "مفقودة",
    "أبحث",
    "ابحث",
    "أريد",
    "أجد",
    "وجدت",
  ]

  // Vérifier si le texte contient des mots-clés de perte
  const hasLostKeyword = lostKeywords.some((keyword) => {
    const textLower = text.toLowerCase()
    const translatedLower = translatedText.toLowerCase()
    return textLower.includes(keyword.toLowerCase()) || translatedLower.includes(keyword.toLowerCase())
  })

  console.log("🔍 Has lost keyword:", hasLostKeyword)

  // Check context first
  if (context) {
    if (context.isWaitingForCity && context.conversationItems.length > 0) {
      const cities = extractCities(text)
      console.log("🏙️ Waiting for city, found cities:", cities)
      if (cities.length > 0) return true
    }

    if (context.isWaitingForDetails && context.conversationCities.length > 0) {
      const items = extractItemKeywords(text)
      console.log("📱 Waiting for details, found items:", items)
      if (items.length > 0) return true
    }

    if (context.conversationItems.length > 0 && extractCities(text).length > 0) {
      console.log("🔄 Context items + new city")
      return true
    }

    if (context.conversationCities.length > 0 && extractItemKeywords(text).length > 0) {
      console.log("🔄 Context city + new items")
      return true
    }
  }

  // Check current message
  const hasCity = extractCities(text).length > 0
  const hasItem = extractItemKeywords(text).length > 0

  console.log("🏙️ Has city:", hasCity, extractCities(text))
  console.log("📱 Has item:", hasItem, extractItemKeywords(text))

  // Nouvelle logique : Si on a un mot-clé de perte ET (une ville OU un objet), c'est une recherche
  // OU si on a à la fois une ville ET un objet (même sans mot-clé explicite)
  const isSearch = (hasLostKeyword && (hasCity || hasItem)) || (hasCity && hasItem)

  console.log("✅ Final search decision:", isSearch)
  return isSearch
}

// Get item by ID
async function getItemById(itemId: number) {
  try {
    if (!process.env.DB_HOST) {
      throw new Error("Database not configured")
    }

    const sql = `
      SELECT 
        f.id,
        f.discription as description,
        f.ville as city_id,
        f.cat_ref as category_ref,
        f.marque,
        f.modele,
        f.color,
        f.type,
        f.etat,
        f.postdate,
        c.cname as category_name,
        v.ville as city
      FROM fthings f
      LEFT JOIN catagoery c ON f.cat_ref = c.cid
      LEFT JOIN ville v ON f.ville = v.id
      WHERE f.id = ?
      LIMIT 1
    `

    const results = await query(sql, [itemId])
    const resultArray = Array.isArray(results) ? results : []
    return resultArray.length > 0 ? resultArray[0] : null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// Extract search terms with context
function extractSearchTerms(text: string, context: any = null) {
  let city = extractCities(text)[0] || null
  let keywords = extractItemKeywords(text)

  // Only use context if it's not a new search AND we're missing info
  if (!context?.isNewSearch) {
    if (!city && context?.conversationCities.length > 0) {
      city = context.conversationCities[0]
    }

    if (keywords.length === 0 && context?.conversationItems.length > 0) {
      keywords = context.conversationItems
    }
  }

  return {
    originalText: text,
    keywords: keywords,
    city: city,
  }
}

// Generate multilingual responses
function generateResponse(type: string, data: any, language: string) {
  const responses = {
    missingCity: {
      ar: `🏙️ **المدينة مطلوبة للبحث!**\n\nللعثور على العنصر المفقود، أحتاج إلى معرفة المدينة:\n\n**مثال:** "فقدت هاتفي في الدار البيضاء"\n\n**المدن:** الرباط، الدار البيضاء، مراكش، فاس، طنجة، أغادير\n\nيرجى تحديد المدينة! 📍`,
      fr: `🏙️ **Ville requise pour la recherche !**\n\nPour trouver votre objet perdu, j'ai besoin de savoir dans quelle ville :\n\n**Exemple :** "J'ai perdu mon téléphone à Casablanca"\n\n**Villes :** Rabat, Casablanca, Marrakech, Fès, Tanger, Agadir\n\nVeuillez spécifier la ville ! 📍`,
      en: `🏙️ **City is required for search!**\n\nTo find your lost item, I need to know the city:\n\n**Example:** "I lost my phone in Casablanca"\n\n**Cities:** Rabat, Casablanca, Marrakech, Fes, Tanger, Agadir\n\nPlease specify the city! 📍`,
    },
    missingDetails: {
      ar: `📝 **تفاصيل أكثر مطلوبة!**\n\nوجدت المدينة "${data.city}" لكن أحتاج مزيد من المعلومات:\n\n• **ما هو العنصر؟** (هاتف، محفظة، مفاتيح)\n• **اللون؟** (أسود، أبيض، أحمر)\n• **العلامة التجارية؟** (سامسونغ، آبل)\n\n**مثال:** "فقدت هاتف سامسونغ أسود في ${data.city}"\n\nيرجى المزيد من التفاصيل! 🔍`,
      fr: `📝 **Plus de détails nécessaires !**\n\nJ'ai trouvé la ville "${data.city}" mais j'ai besoin de plus d'informations :\n\n• **Quel objet ?** (téléphone, portefeuille, clés)\n• **Couleur ?** (noir, blanc, rouge)\n• **Marque ?** (Samsung, Apple)\n\n**Exemple :** "J'ai perdu mon téléphone Samsung noir à ${data.city}"\n\nVeuillez fournir plus de détails ! 🔍`,
      en: `📝 **More details needed!**\n\nI found the city "${data.city}" but need more information:\n\n• **What item?** (phone, wallet, keys)\n• **Color?** (black, white, red)\n• **Brand?** (Samsung, Apple)\n\n**Example:** "I lost my black Samsung phone in ${data.city}"\n\nPlease provide more details! 🔍`,
    },
    searchResults: {
      ar: `وجدت ${data.count} عناصر مطابقة في ${data.city}! تحقق من البطاقات أدناه.`,
      fr: `J'ai trouvé ${data.count} objets correspondants à ${data.city} ! Consultez les cartes ci-dessous.`,
      en: `I found ${data.count} matching items in ${data.city}! Check the cards below.`,
    },
    noResults: {
      ar: `❌ **لم يتم العثور على مطابقات في ${data.city}**\n\n🆕 **إنشاء إعلان:**\n[نشر إعلان جديد](https://mafqoodat.ma/post.php)\n\n🔍 **جرب كلمات مختلفة**`,
      fr: `❌ **Aucune correspondance trouvée à ${data.city}**\n\n🆕 **Créer une annonce :**\n[Publier une nouvelle annonce](https://mafqoodat.ma/post.php)\n\n🔍 **Essayez différents mots-clés**`,
      en: `❌ **No matches found in ${data.city}**\n\n🆕 **Create a post:**\n[Post New Ad](https://mafqoodat.ma/post.php)\n\n🔍 **Try different keywords**`,
    },
  }

  return responses[type]?.[language] || responses[type]?.fr || "Erreur de génération de réponse"
}

// Recherche simplifiée dans la base de données (maintenant uniquement en français)
async function searchDatabase(searchTerms: any) {
  try {
    if (!process.env.DB_HOST) {
      throw new Error("Database not configured")
    }

    if (!searchTerms.city) {
      return { results: [], missingCity: true }
    }

    if (!searchTerms.keywords || searchTerms.keywords.length === 0) {
      return { results: [], missingKeywords: true }
    }

    let sql = `
      SELECT 
        f.id,
        f.discription as description,
        f.ville as city_id,
        f.cat_ref as category_ref,
        f.marque,
        f.modele,
        f.color,
        f.type,
        f.etat,
        f.postdate,
        c.cname as category_name,
        v.ville as city
      FROM fthings f
      LEFT JOIN catagoery c ON f.cat_ref = c.cid
      LEFT JOIN ville v ON f.ville = v.id
      WHERE 1=1
    `

    const params = []

    // Add city filter (now searching for French city names)
    sql += ` AND LOWER(v.ville) LIKE LOWER(?)`
    params.push(`%${searchTerms.city}%`)

    // Add keyword conditions (now searching with French keywords)
    if (searchTerms.keywords.length > 0) {
      sql += ` AND (`
      const conditions = []

      searchTerms.keywords.forEach((keyword) => {
        const kw = `%${keyword}%`
        conditions.push(`(
          LOWER(f.discription) LIKE LOWER(?) OR
          LOWER(c.cname) LIKE LOWER(?) OR
          LOWER(f.marque) LIKE LOWER(?) OR
          LOWER(f.modele) LIKE LOWER(?) OR
          LOWER(f.color) LIKE LOWER(?) OR
          LOWER(f.type) LIKE LOWER(?)
        )`)
        params.push(kw, kw, kw, kw, kw, kw)
      })

      sql += conditions.join(" OR ")
      sql += `)`
    }

    sql += ` ORDER BY f.postdate DESC LIMIT 20`

    console.log("🔍 Executing French-normalized search")
    console.log("🏙️ City:", searchTerms.city)
    console.log("📱 Keywords:", searchTerms.keywords)

    const results = await query(sql, params)
    const resultArray = Array.isArray(results) ? results : []

    console.log(`✅ Found ${resultArray.length} results with French search`)

    return { results: resultArray, missingCity: false, missingKeywords: false }
  } catch (error) {
    console.error("Database search error:", error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]
    const userInput = lastMessage?.content || ""

    console.log("🔍 Processing user input:", userInput)

    // Analyze conversation context
    const context = analyzeConversationContext(messages)
    console.log("📋 Context:", {
      userLanguage: context.userLanguage,
      isNewSearch: context.isNewSearch,
      conversationItems: context.conversationItems,
      conversationCities: context.conversationCities,
    })

    // Check if user is asking about a specific item ID
    const itemId = isAskingAboutItemId(userInput)
    if (itemId) {
      if (!process.env.DB_HOST) {
        const errorMessages = {
          ar: "❌ قاعدة البيانات غير متصلة. لا يمكنني البحث عن تفاصيل العناصر الآن.",
          fr: "❌ Base de données non connectée. Je ne peux pas rechercher les détails des objets pour le moment.",
          en: "❌ Database not connected. I can't search for item details right now.",
        }
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: errorMessages[context.userLanguage] || errorMessages.fr,
        })
      }

      try {
        const item = await getItemById(itemId)

        if (item) {
          const responses = {
            ar: `🎯 **تم العثور على العنصر #${item.id}!**\n\n📍 **المدينة:** ${item.city || "غير معروفة"}\n📝 **الوصف:** ${item.description || "لا يوجد وصف"}\n\n**التفاصيل:**\n${item.category_name ? `• **الفئة:** ${item.category_name}\n` : ""}${item.marque ? `• **العلامة التجارية:** ${item.marque}\n` : ""}${item.modele ? `• **الطراز:** ${item.modele}\n` : ""}${item.color ? `• **اللون:** ${item.color}\n` : ""}${item.type ? `• **النوع:** ${item.type}\n` : ""}${item.etat ? `• **الحالة:** ${item.etat}\n` : ""}\n${item.postdate ? `📅 **تاريخ النشر:** ${new Date(item.postdate).toLocaleDateString()}\n` : ""}\n🔗 **[اتصل بالواجد](https://mafqoodat.ma/trouve.php?contact=${item.id})**`,
            fr: `🎯 **Objet #${item.id} trouvé !**\n\n📍 **Ville :** ${item.city || "Inconnue"}\n📝 **Description :** ${item.description || "Aucune description disponible"}\n\n**Détails :**\n${item.category_name ? `• **Catégorie :** ${item.category_name}\n` : ""}${item.marque ? `• **Marque :** ${item.marque}\n` : ""}${item.modele ? `• **Modèle :** ${item.modele}\n` : ""}${item.color ? `• **Couleur :** ${item.color}\n` : ""}${item.type ? `• **Type :** ${item.type}\n` : ""}${item.etat ? `• **État :** ${item.etat}\n` : ""}\n${item.postdate ? `📅 **Posté le :** ${new Date(item.postdate).toLocaleDateString()}\n` : ""}\n🔗 **[Contacter le trouveur](https://mafqoodat.ma/trouve.php?contact=${item.id})**`,
            en: `🎯 **Item #${item.id} found!**\n\n📍 **City:** ${item.city || "Unknown"}\n📝 **Description:** ${item.description || "No description available"}\n\n**Details:**\n${item.category_name ? `• **Category:** ${item.category_name}\n` : ""}${item.marque ? `• **Brand:** ${item.marque}\n` : ""}${item.modele ? `• **Model:** ${item.modele}\n` : ""}${item.color ? `• **Color:** ${item.color}\n` : ""}${item.type ? `• **Type:** ${item.type}\n` : ""}${item.etat ? `• **Condition:** ${item.etat}\n` : ""}\n${item.postdate ? `📅 **Posted:** ${new Date(item.postdate).toLocaleDateString()}\n` : ""}\n🔗 **[Contact the finder](https://mafqoodat.ma/trouve.php?contact=${item.id})**`,
          }

          return NextResponse.json({
            id: Date.now().toString(),
            role: "assistant",
            content: responses[context.userLanguage] || responses.fr,
          })
        } else {
          const notFoundMessages = {
            ar: `❌ **العنصر #${itemId} غير موجود**\n\nلم أتمكن من العثور على عنصر بالرقم #${itemId} في قاعدة البيانات.`,
            fr: `❌ **Objet #${itemId} non trouvé**\n\nJe n'ai pas pu trouver un objet avec l'ID #${itemId} dans notre base de données.`,
            en: `❌ **Item #${itemId} not found**\n\nI couldn't find an item with ID #${itemId} in our database.`,
          }
          return NextResponse.json({
            id: Date.now().toString(),
            role: "assistant",
            content: notFoundMessages[context.userLanguage] || notFoundMessages.fr,
          })
        }
      } catch (error) {
        const errorMessages = {
          ar: `❌ **خطأ في البحث عن العنصر #${itemId}**\n\nحدثت مشكلة في الوصول إلى قاعدة البيانات.`,
          fr: `❌ **Erreur lors de la recherche de l'objet #${itemId}**\n\nIl y a eu un problème d'accès à la base de données.`,
          en: `❌ **Error looking up Item #${itemId}**\n\nThere was a problem accessing the database.`,
        }
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: errorMessages[context.userLanguage] || errorMessages.fr,
        })
      }
    }

    // Check if user is searching for lost items
    const isSearchQuery = isSearchingForItems(userInput, context)
    console.log("🔍 Is search query:", isSearchQuery)

    if (isSearchQuery) {
      if (!process.env.DB_HOST) {
        const errorMessages = {
          ar: "❌ قاعدة البيانات غير متصلة. لا يمكنني البحث عن العناصر المفقودة الآن.",
          fr: "❌ Base de données non connectée. Je ne peux pas rechercher d'objets perdus pour le moment.",
          en: "❌ Database not connected. I can't search for lost items right now.",
        }
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: errorMessages[context.userLanguage] || errorMessages.fr,
        })
      }

      // Extract search terms with context
      const searchTerms = extractSearchTerms(userInput, context)
      console.log("🔍 Search terms:", searchTerms)
      const searchResult = await searchDatabase(searchTerms)

      // Handle missing city
      if (searchResult.missingCity) {
        const response = generateResponse("missingCity", {}, context.userLanguage)
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        })
      }

      // Handle missing keywords
      if (searchResult.missingKeywords) {
        const response = generateResponse("missingDetails", { city: searchTerms.city }, context.userLanguage)
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        })
      }

      // Handle search results
      if (searchResult.results.length > 0) {
        const response = generateResponse(
          "searchResults",
          { count: searchResult.results.length, city: searchTerms.city },
          context.userLanguage,
        )

        const missingPersons = searchResult.results.map((item) => ({
          id: item.id.toString(),
          description: item.description || "Aucune description disponible",
          city: item.city || "Inconnue",
          category_name: item.category_name,
          marque: item.marque,
          modele: item.modele,
          color: item.color,
          type: item.type,
          etat: item.etat,
          postdate: item.postdate,
          contactUrl: `https://mafqoodat.ma/trouve.php?contact=${item.id}`,
        }))

        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: response,
          missingPersons: missingPersons,
        })
      } else {
        const response = generateResponse("noResults", { city: searchTerms.city }, context.userLanguage)
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        })
      }
    } else {
      // Use ChatGPT API for general conversation with fallback
      console.log("💬 Using general conversation mode")

      // Fallback response if OpenAI is not available
      const fallbackResponses = {
        ar: "أنا هنا لمساعدتك في العثور على الأشياء المفقودة في المغرب. إذا فقدت شيئًا، أخبرني بنوع الشيء والمدينة وسأبحث لك في قاعدة البيانات!",
        fr: "Je suis là pour vous aider à retrouver vos objets perdus au Maroc. Si vous avez perdu quelque chose, dites-moi quel objet et dans quelle ville, et je rechercherai dans notre base de données !",
        en: "I'm here to help you find your lost items in Morocco. If you've lost something, tell me what item and which city, and I'll search our database for you!",
      }

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: fallbackResponses[context.userLanguage] || fallbackResponses.fr,
        })
      }

      try {
        const systemPrompts = {
          ar: "أنت مساعد لمنصة مغربية للأشياء المفقودة والموجودة تسمى مفقودات. تساعد المستخدمين في العثور على الأشياء المفقودة. رد دائماً بالعربية. كن مفيداً ومتعاطفاً.",
          fr: "Tu es un assistant pour une plateforme marocaine d'objets perdus et trouvés appelée Mafqoodat. Tu aides les utilisateurs avec les objets perdus et trouvés. Réponds toujours en français. Sois utile et empathique.",
          en: "You are an assistant for a Moroccan lost and found platform called Mafqoodat. You help users with lost and found items. Always respond in English. Be helpful and empathetic.",
        }

        const { text } = await generateText({
          model: openai("gpt-4o"),
          messages: [
            {
              role: "system",
              content: systemPrompts[context.userLanguage] || systemPrompts.fr,
            },
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
        })

        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: text,
        })
      } catch (error) {
        console.error("OpenAI API error:", error)
        return NextResponse.json({
          id: Date.now().toString(),
          role: "assistant",
          content: fallbackResponses[context.userLanguage] || fallbackResponses.fr,
        })
      }
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({
      id: Date.now().toString(),
      role: "assistant",
      content: "Une erreur s'est produite. Veuillez réessayer ou actualiser la page.",
    })
  }
}
