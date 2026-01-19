import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateWillWithGemini } from '@/lib/gemini'
import { generateWillHTML } from '@/lib/will-generator'
import { WillData } from '@/types/will-types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { willId, language = 'en', data } = await request.json()

    // If data is provided directly (for immediate generation), use it
    if (data) {
      // For English, use manual generator for consistent formatting
      if (language === 'en') {
        // Ensure data has all required fields for manual generator
        const transformedData: WillData = {
          ...data,
          residualClause: data.residualClause || "All remaining assets not specifically mentioned in this will shall be distributed equally among all named beneficiaries.",
          // Add missing fields for proper type compatibility
          movableAssets: {
            ...data.movableAssets,
            bankAccounts: data.movableAssets.bankAccounts.map((acc: any) => ({
              ...acc,
              sharePercentage: acc.sharePercentage || "100%"
            })),
            insurancePolicies: data.movableAssets.insurancePolicies.map((policy: any) => ({
              ...policy,
              sharePercentage: policy.sharePercentage || "100%"
            })),
            stocks: data.movableAssets.stocks.map((stock: any) => ({
              ...stock,
              sharePercentage: stock.sharePercentage || "100%",
              accountNumber: stock.accountNumber || undefined
            })),
            mutualFunds: data.movableAssets.mutualFunds.map((fund: any) => ({
              ...fund,
              sharePercentage: fund.sharePercentage || "100%",
              distributor: fund.distributor || "N/A"
            }))
          },
          physicalAssets: {
            jewellery: data.physicalAssets.jewellery.map((item: any) => ({
              ...item,
              sharePercentage: item.sharePercentage || "100%"
            }))
          },
          immovableAssets: data.immovableAssets.map((asset: any) => ({
            ...asset,
            sharePercentage: asset.sharePercentage || "100%"
          })),
          guardianClause: data.guardianClause ? {
            ...data.guardianClause,
            condition: data.guardianClause.condition || "In the event of my death and the existence of minor children"
          } : undefined
        }
        
        const generatedHtml = generateWillHTML(transformedData)
        
        return NextResponse.json({ 
          success: true,
          message: 'Will generated successfully in English',
          html: generatedHtml,
          useManual: false, // Always return HTML for consistency
        })
      }
      
      // For other languages, use Gemini for translation
      try {
        const generatedHtml = await generateWillWithGemini(data, language)
        
        return NextResponse.json({ 
          success: true,
          message: `Will generated successfully in ${language}`,
          html: generatedHtml,
        })
      } catch (error: any) {
        console.error('Gemini generation error:', error)
        
        // Enhanced error handling with specific error types
        if (error.message === 'GEMINI_OVERLOADED') {
          return NextResponse.json({ 
            error: 'GEMINI_OVERLOADED',
            message: 'AI service is temporarily overloaded. Please try again in a few minutes.'
          }, { status: 503 })
        } else if (error.message === 'GEMINI_AUTH_FAILED') {
          return NextResponse.json({ 
            error: 'GEMINI_AUTH_FAILED', 
            message: 'AI service authentication failed. Please contact support.'
          }, { status: 401 })
        } else {
          return NextResponse.json({ 
            error: 'GEMINI_FAILED',
            message: 'Failed to generate document in selected language. Please try again or use English version.'
          }, { status: 500 })
        }
      }
    }

    // Otherwise, fetch from database (existing functionality)
    if (!willId) {
      return NextResponse.json({ error: 'Will ID or data is required' }, { status: 400 })
    }

    // Fetch complete will data
    const will = await prisma.will.findUnique({
      where: { 
        id: willId,
        userId: session.user.id,
      },
      include: {
        testator: true,
        beneficiaries: true,
        bankAccounts: true,
        insurancePolicies: true,
        stocks: true,
        mutualFunds: true,
        jewellery: true,
        immovableAssets: true,
        executors: true,
        witnesses: true,
      },
      // Ensure residualClause is selected
    })

    if (!will) {
      return NextResponse.json({ error: 'Will not found' }, { status: 404 })
    }

    if (!will.testator) {
      return NextResponse.json({ error: 'Testator information is required' }, { status: 400 })
    }

    if (will.beneficiaries.length === 0) {
      return NextResponse.json({ error: 'At least one beneficiary is required' }, { status: 400 })
    }

    if (will.executors.length === 0) {
      return NextResponse.json({ error: 'At least one executor is required' }, { status: 400 })
    }

    if (will.witnesses.length < 2) {
      return NextResponse.json({ error: 'At least two witnesses are required' }, { status: 400 })
    }

    // Transform data for Will AI
    const willData: WillData = {
      residualClause: "All remaining assets not specifically mentioned in this will shall be distributed equally among all named beneficiaries.",
      testator: {
        fullName: will.testator.fullName,
        age: will.testator.age,
        occupation: will.testator.occupation,
        address: will.testator.address,
        idNumber: will.testator.idNumber,
      },
      beneficiaries: will.beneficiaries.map((b: { id: any; name: any; relation: any; idNumber: any; address: any; age: any; percentage: any }) => ({
        id: b.id,
        name: b.name,
        relation: b.relation,
        idNumber: b.idNumber,
        address: b.address,
        age: b.age,
        percentage: b.percentage || undefined,
      })),
      movableAssets: {
        bankAccounts: will.bankAccounts.map((a: { id: any; bankName: any; accountNumber: any; accountType: any; branch: any; beneficiaryId: any; sharePercentage?: any }) => ({
          id: a.id,
          bankName: a.bankName,
          accountNumber: a.accountNumber,
          accountType: a.accountType,
          branch: a.branch,
          beneficiaryId: a.beneficiaryId,
          sharePercentage: a.sharePercentage || "100%",
        })),
        insurancePolicies: will.insurancePolicies.map((p: { id: any; policyNumber: any; company: any; policyType: any; sumAssured: any; beneficiaryId: any; sharePercentage?: any }) => ({
          id: p.id,
          policyNumber: p.policyNumber,
          company: p.company,
          policyType: p.policyType,
          sumAssured: p.sumAssured,
          beneficiaryId: p.beneficiaryId,
          sharePercentage: p.sharePercentage || "100%",
        })),
        stocks: will.stocks.map((s: { id: any; company: any; numberOfShares: any; certificateNumber: any; beneficiaryId: any; sharePercentage?: any; accountNumber?: any }) => ({
          id: s.id,
          company: s.company,
          numberOfShares: s.numberOfShares,
          certificateNumber: s.certificateNumber || undefined,
          beneficiaryId: s.beneficiaryId,
          sharePercentage: s.sharePercentage || "100%",
          accountNumber: s.accountNumber || undefined,
        })),
        mutualFunds: will.mutualFunds.map((f: { id: any; fundName: any; folioNumber: any; units: any; beneficiaryId: any; sharePercentage?: any; distributor?: any; accountNumber?: any }) => ({
          id: f.id,
          fundName: f.fundName,
          folioNumber: f.folioNumber,
          units: f.units,
          beneficiaryId: f.beneficiaryId,
          sharePercentage: f.sharePercentage || "100%",
          distributor: f.distributor || "N/A",
          accountNumber: f.accountNumber || "N/A",
        })),
      },
      physicalAssets: {
        jewellery: will.jewellery.map((j: { id: any; description: any; estimatedValue: any; location: any; beneficiaryId: any; sharePercentage?: any; type?: any; invoiceNumber?: any }) => ({
          id: j.id,
          description: j.description,
          estimatedValue: j.estimatedValue,
          location: j.location,
          beneficiaryId: j.beneficiaryId,
          sharePercentage: j.sharePercentage || "100%",
          type: j.type || "N/A",
          invoiceNumber: j.invoiceNumber || "N/A",
        })),
      },
      immovableAssets: will.immovableAssets.map((a: { id: any; propertyType: any; description: any; location: any; surveyNumber: any; registrationNumber: any; estimatedValue: any; beneficiaryId: any; sharePercentage?: any; name?: any }) => ({
        id: a.id,
        propertyType: a.propertyType,
        description: a.description,
        location: a.location,
        surveyNumber: a.surveyNumber || undefined,
        registrationNumber: a.registrationNumber || undefined,
        estimatedValue: a.estimatedValue,
        beneficiaryId: a.beneficiaryId,
        sharePercentage: a.sharePercentage || "100%",
        name: a.name || a.description || "Property",
      })),
      guardianClause: will.guardianName ? {
        condition: "In the event of my death and the existence of minor children",
        guardian: {
          name: will.guardianName,
          relation: will.guardianRelation || '',
          address: will.guardianAddress || '',
          phone: will.guardianPhone || '',
          email: will.guardianEmail || undefined,
        },
        minorChildren: will.minorChildren || [],
      } : undefined,
      liabilities: will.liabilities || [],
      executors: will.executors.map((e: { id: any; name: any; relation: any; address: any; phone: any; email: any; isPrimary: any }) => ({
        id: e.id,
        name: e.name,
        relation: e.relation,
        address: e.address,
        phone: e.phone,
        email: e.email || undefined,
        isPrimary: e.isPrimary,
      })),
      witnesses: will.witnesses.map((w: { id: any; name: any; address: any; phone: any; occupation: any; idNumber: any }) => ({
        id: w.id,
        name: w.name,
        address: w.address,
        phone: w.phone,
        occupation: w.occupation,
        idNumber: w.idNumber,
      })),
      dateOfWill: will.dateOfWill?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      placeOfWill: will.placeOfWill || '',
      specialInstructions: will.specialInstructions || undefined,
    }

    let generatedHtml: string;

    // For English, use manual generator for consistent formatting
    if (!language || language === 'en') {
      generatedHtml = generateWillHTML(willData)
    } else {
      // For other languages, use Gemini for translation
      try {
        generatedHtml = await generateWillWithGemini(willData, language)
      } catch (error: any) {
        console.error('Gemini generation error:', error)
        
        // Enhanced error handling with specific error types
        if (error.message === 'GEMINI_OVERLOADED') {
          return NextResponse.json({ 
            error: 'GEMINI_OVERLOADED',
            message: 'AI service is temporarily overloaded. Please try again in a few minutes.'
          }, { status: 503 })
        } else if (error.message === 'GEMINI_AUTH_FAILED') {
          return NextResponse.json({ 
            error: 'GEMINI_AUTH_FAILED', 
            message: 'AI service authentication failed. Please contact support.'
          }, { status: 401 })
        } else {
          return NextResponse.json({ 
            error: 'GEMINI_FAILED',
            message: 'Failed to generate document in selected language. Please try again or use English version.'
          }, { status: 500 })
        }
      }
    }

    // Update will with generated content
    await prisma.will.update({
      where: { id: willId },
      data: {
        generatedHtml,
        generatedAt: new Date(),
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({ 
      success: true,
      message: 'Will generated successfully',
      html: generatedHtml,
    })

  } catch (error) {
    console.error('Error generating will:', error)
    return NextResponse.json(
      { error: 'Failed to generate will' },
      { status: 500 }
    )
  }
}