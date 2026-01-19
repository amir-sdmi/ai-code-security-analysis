// AI-powered energy bill parser using Grok API

import type { ExtractedEnergyBillData } from './types.ts';

export class AIEnergyBillParser {
  private grokApiKey: string;
  private apiUrl = 'https://api.x.ai/v1/chat/completions';

  constructor(grokApiKey: string) {
    this.grokApiKey = grokApiKey;
  }

  async parseEnergyBillWithAI(fullText: string, fileName: string): Promise<ExtractedEnergyBillData> {
    console.log('🧠 Starting AI-powered energy bill parsing with Grok...');
    console.log('📄 Text length:', fullText.length, 'characters');

    try {
      const aiResponse = await this.callGrokAPI(fullText);
      const parsedData = this.validateAndNormalizeAIResponse(aiResponse);
      
      console.log('✅ AI parsing completed:', {
        concessionaria: parsedData.concessionaria,
        nome_cliente: parsedData.nome_cliente,
        endereco: parsedData.endereco?.substring(0, 50) + '...',
        uc: parsedData.uc,
        consumo_atual_kwh: parsedData.consumo_atual_kwh,
        historico_length: parsedData.consumo_historico.length
      });

      return parsedData;
    } catch (error) {
      console.error('❌ AI parsing failed:', error.message);
      throw new Error(`AI parsing failed: ${error.message}`);
    }
  }

  private async callGrokAPI(fullText: string): Promise<any> {
    const prompt = this.buildExtractionPrompt(fullText);
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de contas de energia elétrica brasileiras. Sua tarefa é extrair dados específicos do cliente (não da empresa distribuidora) de contas de energia.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'grok-4-0709',
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    };

    console.log('🚀 Calling Grok API...');
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid Grok API response structure');
    }

    return result.choices[0].message.content;
  }

  private buildExtractionPrompt(fullText: string): string {
    return `
IMPORTANTE: Analise este texto de uma conta de energia elétrica e extraia APENAS os dados DO CLIENTE, não da empresa distribuidora.

TEXTO DA CONTA:
${fullText}

INSTRUÇÕES CRÍTICAS PARA IDENTIFICAÇÃO DO CLIENTE:
1. IGNORE completamente dados da empresa CEEE/distribuidora (endereços empresariais, nomes de empresas)
2. O UC (Unidade Consumidora) geralmente marca onde começam os dados do cliente - procure por números de 10 dígitos
3. Dados do cliente aparecem APÓS o UC e geralmente incluem:
   - Nome da pessoa física ou jurídica (não "CEEE" ou "ENERGIA ELÉTRICA")
   - Endereço residencial/comercial (não sede empresarial)
4. Endereços da empresa geralmente contêm: "CLOVIS PAIM GRIVOT", "CENTRO EMPRESARIAL", "SEDE", "FARROUPILHA"
5. Procure por nomes de PESSOAS reais (ex: "CAROLINE SOUZA GHESSI") não nomes de empresas

INSTRUÇÕES ESPECÍFICAS PARA HISTÓRICO DE CONSUMO:
1. Procure por gráficos ou tabelas de consumo mensal
2. Busque padrões como: "JAN/24 189", "FEV/24 254", "MAR/24 420"
3. Também procure por: "janeiro 2024: 189 kWh", "fevereiro: 254", etc.
4. Valores de consumo geralmente estão entre 50-2000 kWh
5. Se encontrar apenas médias calculadas, use-as
6. Priorize dados reais sobre estimativas

ESTRUTURA TÍPICA DA CONTA CEEE:
- Cabeçalho com logo e dados da CEEE (IGNORAR)
- UC (10 dígitos) seguido dos dados do cliente
- Dados de consumo e histórico
- Valores e vencimento

EXTRAIA e retorne APENAS um JSON válido com esta estrutura:
{
  "concessionaria": "CEEE" ou nome da distribuidora,
  "nome_cliente": "Nome completo da pessoa física ou jurídica cliente",
  "endereco": "Endereço residencial/comercial do cliente (não da distribuidora)",
  "cidade": "Cidade do cliente",
  "estado": "Estado (ex: RS)",
  "uc": "Número da Unidade Consumidora",
  "tarifa_kwh": valor numérico da tarifa por kWh,
  "consumo_atual_kwh": valor numérico do consumo atual,
  "periodo": "Período de referência da conta",
  "data_vencimento": "Data de vencimento",
  "consumo_historico": [
    {"mes": "janeiro", "consumo": 300, "ano": "2024"},
    {"mes": "fevereiro", "consumo": 280, "ano": "2024"}
  ]
}

VALIDAÇÃO FINAL:
- Nome do cliente deve ser uma PESSOA, não empresa
- Endereço deve ser residencial/comercial, não sede da CEEE
- Histórico de consumo deve ter valores > 0
- UC deve ter exatamente 10 dígitos

Se não conseguir identificar algum campo, use:
- "N/A" para textos
- 0 para números
- [] para arrays

RETORNE APENAS O JSON, sem explicações adicionais.
`;
  }

  private validateAndNormalizeAIResponse(aiResponse: string): ExtractedEnergyBillData {
    console.log('🔍 Validating AI response...');
    
    try {
      // Limpar response e extrair JSON
      let cleanResponse = aiResponse.trim();
      
      // Se a resposta contém markdown, extrair o JSON
      if (cleanResponse.includes('```json')) {
        const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[1];
        }
      } else if (cleanResponse.includes('```')) {
        const jsonMatch = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[1];
        }
      }

      const parsedData = JSON.parse(cleanResponse);
      
      // Validar estrutura básica
      const requiredFields = ['concessionaria', 'nome_cliente', 'endereco', 'uc'];
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          console.warn(`⚠️ Missing field ${field}, using default`);
        }
      }

      // Normalizar e validar dados
      const normalized: ExtractedEnergyBillData = {
        concessionaria: parsedData.concessionaria || 'CEEE',
        nome_cliente: parsedData.nome_cliente || 'Cliente não identificado',
        endereco: parsedData.endereco || 'Endereço não identificado',
        cidade: parsedData.cidade || 'N/A',
        estado: parsedData.estado || 'N/A',
        uc: parsedData.uc || 'N/A',
        tarifa_kwh: this.parseNumber(parsedData.tarifa_kwh, 0.75),
        consumo_atual_kwh: this.parseNumber(parsedData.consumo_atual_kwh, 0),
        periodo: parsedData.periodo || 'N/A',
        data_vencimento: parsedData.data_vencimento || 'N/A',
        consumo_historico: this.parseConsumptionHistory(parsedData.consumo_historico)
      };

      // Validações de qualidade
      this.validateExtractedData(normalized);

      return normalized;
    } catch (error) {
      console.error('❌ Error parsing AI response:', error.message);
      console.log('Raw AI response:', aiResponse);
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  }

  private parseNumber(value: any, defaultValue: number): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(',', '.'));
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return defaultValue;
  }

  private parseConsumptionHistory(history: any): Array<{mes: string, consumo: number, ano?: string}> {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .filter(item => item && typeof item === 'object' && item.mes && typeof item.consumo === 'number')
      .map(item => ({
        mes: item.mes,
        consumo: item.consumo,
        ano: item.ano || undefined
      }))
      .slice(0, 12); // Máximo 12 meses
  }

  private validateExtractedData(data: ExtractedEnergyBillData): void {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validar se não confundiu dados da empresa com cliente
    const businessKeywords = ['ceee', 'energia', 'elétrica', 'distribuidora', 'clovis paim grivot', 'farroupilha'];
    const nameAndAddress = `${data.nome_cliente} ${data.endereco}`.toLowerCase();
    
    for (const keyword of businessKeywords) {
      if (nameAndAddress.includes(keyword)) {
        issues.push(`Possível confusão com dados da empresa: contém "${keyword}"`);
      }
    }

    // Validar UC
    if (data.uc !== 'N/A') {
      if (data.uc.length !== 10) {
        issues.push(`UC deve ter 10 dígitos, encontrado: ${data.uc.length}`);
      }
      if (!/^\d+$/.test(data.uc)) {
        issues.push('UC deve conter apenas números');
      }
    }

    // Validar tarifa
    if (data.tarifa_kwh < 0.3 || data.tarifa_kwh > 3.0) {
      warnings.push(`Tarifa ${data.tarifa_kwh} fora da faixa esperada (0.3-3.0)`);
    }

    // Validar histórico de consumo
    if (data.consumo_historico.length === 0) {
      warnings.push('Nenhum histórico de consumo encontrado');
    } else {
      const zeroConsumption = data.consumo_historico.filter(item => item.consumo === 0).length;
      if (zeroConsumption > 0) {
        warnings.push(`${zeroConsumption} meses com consumo zero no histórico`);
      }
    }

    // Validar consumo atual
    if (data.consumo_atual_kwh <= 0) {
      warnings.push('Consumo atual não identificado');
    }

    // Calcular score de qualidade
    const qualityScore = this.calculateDataQualityScore(data);

    if (issues.length > 0) {
      console.error('❌ Critical validation issues:', issues);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Validation warnings:', warnings);
    }

    console.log('📊 Enhanced data quality metrics:', {
      qualityScore: `${(qualityScore * 100).toFixed(1)}%`,
      hasClientName: data.nome_cliente !== 'Cliente não identificado',
      hasAddress: data.endereco !== 'Endereço não identificado',
      hasUC: data.uc !== 'N/A',
      hasConsumption: data.consumo_atual_kwh > 0,
      hasHistory: data.consumo_historico.length > 0,
      historyMonths: data.consumo_historico.length,
      avgMonthlyConsumption: data.consumo_historico.length > 0 
        ? Math.round(data.consumo_historico.reduce((sum, item) => sum + item.consumo, 0) / data.consumo_historico.length)
        : 0,
      criticalIssues: issues.length,
      warnings: warnings.length
    });
  }

  private calculateDataQualityScore(data: ExtractedEnergyBillData): number {
    let score = 0;
    const maxScore = 10;

    // Nome do cliente (peso 2)
    if (data.nome_cliente !== 'Cliente não identificado' && data.nome_cliente !== 'N/A') {
      score += 2;
    }

    // Endereço (peso 2)
    if (data.endereco !== 'Endereço não identificado' && data.endereco !== 'N/A') {
      score += 2;
    }

    // UC (peso 1)
    if (data.uc !== 'N/A' && data.uc.length === 10) {
      score += 1;
    }

    // Consumo atual (peso 1)
    if (data.consumo_atual_kwh > 0) {
      score += 1;
    }

    // Histórico de consumo (peso 2)
    if (data.consumo_historico.length > 0) {
      score += 1;
      // Bonus se tem histórico com valores reais
      const realValues = data.consumo_historico.filter(item => item.consumo > 0).length;
      if (realValues >= data.consumo_historico.length * 0.8) { // 80% dos valores são reais
        score += 1;
      }
    }

    // Tarifa (peso 1)
    if (data.tarifa_kwh > 0.3 && data.tarifa_kwh < 3.0) {
      score += 1;
    }

    // Dados básicos (peso 1)
    if (data.concessionaria !== 'N/A' && data.cidade !== 'N/A') {
      score += 1;
    }

    return score / maxScore;
  }
}