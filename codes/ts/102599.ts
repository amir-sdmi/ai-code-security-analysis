import mammoth from 'mammoth';
import type { Patient } from '@/types/patient';

// Using OpenRouter API with deepseek-r1t-chimera model
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Interface for the raw data returned by Mistral AI
 */
interface RawExtractedData {
  id_number?: string;
  admission_date?: string;
  full_name?: string;
  gender?: string;
  date_of_birth?: string;
  chief_complaint?: string;
  present_illness?: string;
  current_diagnosis?: string[];
  current_treatment?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date: string;
    notes: string;
  }>;
  vital_signs?: {
    temperature?: string | number;
    pulse?: string | number;
    respiration?: string | number;
    blood_pressure?: string;
    weight?: string | number;
    height?: string | number;
  };
  past_medical_history?: {
    // Cardiovascular
    hypertension?: boolean;
    coronary_artery_disease?: boolean;
    atrial_fibrillation?: boolean;
    heart_failure?: boolean;
    cerebral_infarction?: boolean;
    // Endocrine
    diabetes_type1?: boolean;
    diabetes_type2?: boolean;
    hyperthyroidism?: boolean;
    hypothyroidism?: boolean;
    // Respiratory
    asthma?: boolean;
    copd?: boolean;
    // Kidney
    acute_kidney_injury?: boolean;
    chronic_kidney_disease?: boolean;
    // Liver
    fatty_liver?: boolean;
    cirrhosis?: boolean;
    // Infectious
    hepatitis?: boolean;
    tuberculosis?: boolean;
    // Vaccination History
    vaccination_history?: Array<{
      vaccine_name: string;
      date: string;
      notes?: string;
    }>;
  };
  family_status?: {
    father?: {
      status: 'alive' | 'deceased';
      death_reason?: string;
    };
    mother?: {
      status: 'alive' | 'deceased';
      death_reason?: string;
    };
    hereditary_diseases?: string[];
    infectious_diseases?: string[];
    cancer_history?: string[];
  };
  neurological_exam?: {
    pupil_size_left?: string | number;
    pupil_size_right?: string | number;
    light_reflex?: string;
    muscle_strength_left_upper?: number | null;
    muscle_strength_right_upper?: number | null;
    muscle_strength_left_lower?: number | null;
    muscle_strength_right_lower?: number | null;
    babinski_sign?: string;
  };
  allergies?: { name: string; reaction: string }[];
  surgical_history?: { procedure: string; date: string; notes: string }[];
  drug_use_history?: { drug_name: string; duration: string; notes: string }[];
  habits?: {
    smoking?: boolean;
    cigarettes_per_day?: number;
    smoking_duration?: string;
    alcohol?: boolean;
    alcohol_quantity?: string;
    alcohol_duration?: string;
    toxic_exposure?: boolean;
    toxic_type?: string;
    toxic_duration?: string;
    residence_in_epidemic_region?: boolean;
    epidemic_region_details?: string;
    exposure_to_infected_water?: boolean;
    infected_water_details?: string;
  };
}

/**
 * Extracts text content from a Word document
 */
export async function extractTextFromWordFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file'));
      }
      
      try {
        const arrayBuffer = event.target.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Processes text content using Hugging Face models to extract structured patient information
 */
export async function extractPatientDataWithAI(
  textContent: string
): Promise<Partial<Patient>> {
  try {
    console.log("Starting patient data extraction with AI...");
    
    // Create a prompt suitable for the DeepSeek Instruct model with more explicit instructions
    const prompt = `<s>[INST] 
You are a medical data extraction assistant. First, translate the provided medical document to professional medical English, maintaining all medical terminology and clinical details. Then, extract the following patient information accurately from the translated text and return it as a valid JSON object.
IMPORTANT: Your response must be a valid JSON object only, with no additional text or explanation before or after the JSON.
Translation Guidelines:
1. Maintain all medical terminology and clinical terms in their proper English form
2. Preserve numerical values, measurements, and units exactly as written
3. Keep dates in their original format for extraction
4. Maintain the professional medical tone and clinical accuracy
5. Ensure all medical abbreviations are properly translated to their full English forms

Required fields:
- id_number: The patient's security/ID number (look for terms like "ID", "Security ID", "Patient ID", "ID Number", "Security Number", "Patient Number", "MRN", "Medical Record Number")
- admission_date: The date of admission (format: YYYY-MM-DD)
- full_name: The patient's complete name
- date_of_birth: The patient's birthdate (format: YYYY-MM-DD)
- gender: The patient's gender (Male or Female)
- chief_complaint: The main reason for the patient's visit
- present_illness: A summary of the current illness history
- current_diagnosis: Array of current diagnoses
- current_treatment: Array of current medications with the following structure:
  {
    "name": "Medication name",
    "dosage": "Dosage amount and unit (e.g., '500mg', '10ml')",
    "frequency": "How often taken (e.g., 'twice daily', 'every 8 hours')",
    "start_date": "When medication was started (YYYY-MM-DD format if available)",
    "end_date": "When medication was stopped (YYYY-MM-DD format if available)",
    "notes": "Any additional notes about the medication"
  }

- past_medical_history: Object containing boolean values for:
  - hypertension: true/false
  - coronary_artery_disease: true/false
  - atrial_fibrillation: true/false
  - heart_failure: true/false
  - cerebral_infarction: true/false
  - diabetes_type1: true/false
  - diabetes_type2: true/false
  - hyperthyroidism: true/false
  - hypothyroidism: true/false
  - asthma: true/false
  - copd: true/false
  - acute_kidney_injury: true/false
  - chronic_kidney_disease: true/false
  - fatty_liver: true/false
  - cirrhosis: true/false
  - hepatitis: true/false
  - tuberculosis: true/false
  - vaccination_history: Array of objects with:
    {
      "vaccine_name": "Name of the vaccine",
      "date": "Date of vaccination (YYYY-MM-DD)",
      "notes": "Additional notes about the vaccination"
    }

- allergies: Array of objects with:
  {
    "name": "Allergen name",
    "reaction": "Reaction description"
  }

- surgical_history: Array of objects with:
  {
    "procedure": "Surgery name",
    "date": "Date of surgery (YYYY-MM-DD)",
    "notes": "Additional notes"
  }

- drug_use_history: Array of objects with:
  {
    "drug_name": "Drug name",
    "duration": "Duration of use",
    "notes": "Additional notes"
  }

- habits: Object containing:
  - smoking: true/false
  - cigarettes_per_day: number
  - smoking_duration: string
  - alcohol: true/false
  - alcohol_quantity: string
  - alcohol_duration: string
  - toxic_exposure: true/false
  - toxic_type: string
  - toxic_duration: string
  - residence_in_epidemic_region: true/false
  - epidemic_region_details: string
  - exposure_to_infected_water: true/false
  - infected_water_details: string

- neurological_examination: Object containing:
  - pupil_size_left: number
  - pupil_size_right: number
  - light_reflex: string
  - muscle_strength_left_upper: number
  - muscle_strength_right_upper: number
  - muscle_strength_left_lower: number
  - muscle_strength_right_lower: number
  - babinski_sign: string

- family_status: Object containing:
  - father: Object with:
    - status: "alive" or "deceased"
    - death_reason: "Reason for death if deceased"
  - mother: Object with:
    - status: "alive" or "deceased"
    - death_reason: "Reason for death if deceased"
  - hereditary_diseases: Array of hereditary diseases in the family
  - infectious_diseases: Array of infectious diseases in the family
  - cancer_history: Array of cancer history in the family

IMPORTANT: 
1. First translate the entire document to professional medical English
2. For medications, extract each medication separately with its complete details
3. For dosage, include both the amount and unit (e.g., "500mg", "10ml")
4. For frequency, be specific about how often the medication is taken
5. Include start and end dates if mentioned in the document
6. For medical conditions, set the value to true ONLY if explicitly mentioned as present
7. For allergies, surgical history, and drug use, extract ALL mentioned items
8. For habits, extract detailed information about smoking, alcohol, and toxic exposure
9. For neurological examination, extract all available measurements and findings
10. If a field is not mentioned in the document, leave it as an empty string or false for booleans

Medical document:
${textContent.substring(0, 4000)}
[/INST]</s>`;

    // Make multiple attempts to call the API with increasing timeout
    let attempts = 0;
    const maxAttempts = 3;
    const timeouts = [60000, 65000, 70000]; // Progressive timeouts: 30s, 45s, 60s
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const currentTimeout = timeouts[attempts - 1];
        console.log(`API attempt ${attempts}/${maxAttempts} with timeout ${currentTimeout}ms`);
        
        let timeoutId: NodeJS.Timeout | null = null;
        const controller = new AbortController();
        
        // Create a promise that will reject after the timeout
        const timeoutPromise = new Promise<Response>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error(`Request timed out after ${currentTimeout}ms`));
          }, currentTimeout);
        });
        
        // Create the fetch promise
        const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        console.log("API Key present:", !!apiKey);
        
        const fetchPromise = fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey || ''}`,
            'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
            'X-Title': 'Medical Data Extraction' // Optional but helpful
          },
          body: JSON.stringify({
            model: 'tngtech/deepseek-r1t-chimera:free',
            messages: [
              {
                role: 'system',
                content: 'You are a medical data extraction assistant. Extract patient information from medical documents and return it as a valid JSON object.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.01,
            max_tokens: 2000
          }),
          signal: controller.signal
        });
        
        // Race the fetch against the timeout
        let response: Response;
        try {
          response = await Promise.race([fetchPromise, timeoutPromise]);
          // Clear the timeout if the fetch wins
          if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Request aborted due to timeout after ${currentTimeout}ms`);
            if (attempts >= maxAttempts) {
              console.log("Maximum attempts reached, falling back to direct extraction");
              const directExtraction = extractPatientDataDirectly(textContent);
              console.log("DIRECT EXTRACTION RESULT:", JSON.stringify(directExtraction, null, 2));
              return directExtraction;
            }
            // Wait before retrying with longer timeout
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw error;
        }
        
        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("API response received:", result);
        
        // For OpenRouter, extract the generated text from the response
        let generatedText = '';
        if (result.choices && result.choices[0]?.message?.content) {
          generatedText = result.choices[0].message.content;
          console.log("Generated text:", generatedText);
          
          // Try to find JSON in the response
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            console.log("Extracted JSON string:", jsonString);
            
            try {
              // Parse the JSON response
              const rawExtractedData = JSON.parse(jsonString);
              console.log("SUCCESSFULLY PARSED JSON:", JSON.stringify(rawExtractedData, null, 2));
              
              // Transform the raw JSON into the expected Patient structure
              const extractedData = transformToPatientStructure(rawExtractedData);
              console.log("TRANSFORMED TO PATIENT STRUCTURE:", JSON.stringify(extractedData, null, 2));
              
              // If critical fields are missing, use direct extraction as fallback
              if (!extractedData.full_name || !extractedData.chief_complaint) {
                console.log("Critical fields missing from AI extraction, enhancing with direct extraction");
                const directlyExtracted = extractPatientDataDirectly(textContent);
                console.log("DIRECT EXTRACTION RESULT:", JSON.stringify(directlyExtracted, null, 2));
                
                // Merge the data, prioritizing AI extraction for fields it found
                const mergedData = { ...directlyExtracted, ...extractedData };
                console.log("MERGED RESULT:", JSON.stringify(mergedData, null, 2));
                return mergedData;
              }
              
              return extractedData;
            } catch (parseError) {
              console.error("JSON parse error:", parseError);
              console.log("Raw generated text:", generatedText);
              throw new Error('Failed to parse JSON from AI response');
            }
          } else {
            console.log("No JSON found in response, using pattern matching extraction");
            const directExtraction = extractPatientDataDirectly(textContent);
            console.log("DIRECT EXTRACTION RESULT:", JSON.stringify(directExtraction, null, 2));
            return directExtraction;
          }
        } else {
          console.log("No content in response, using pattern matching extraction");
          const directExtraction = extractPatientDataDirectly(textContent);
          console.log("DIRECT EXTRACTION RESULT:", JSON.stringify(directExtraction, null, 2));
          return directExtraction;
        }
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts >= maxAttempts) {
          console.log("All API attempts failed, falling back to direct extraction");
          // If all attempts fail, fall back to direct pattern matching
          const directExtraction = extractPatientDataDirectly(textContent);
          console.log("DIRECT EXTRACTION RESULT:", JSON.stringify(directExtraction, null, 2));
          return directExtraction;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Failed to extract data after multiple attempts');
  } catch (error) {
    console.error('AI extraction error:', error);
    
    // As a last resort fallback, use direct pattern matching
    try {
      const directExtraction = extractPatientDataDirectly(textContent);
      console.log("LAST RESORT DIRECT EXTRACTION:", JSON.stringify(directExtraction, null, 2));
      return directExtraction;
    } catch (fallbackError) {
      console.error('Even fallback extraction failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
}

/**
 * Transforms raw AI extracted data into the proper Patient interface structure
 */
function transformToPatientStructure(rawData: RawExtractedData): Partial<Patient> {
  console.log("Raw data for transformation:", JSON.stringify(rawData, null, 2));
  
  const patientData: Partial<Patient> = {
    security_id: rawData.id_number || '',
    admission_date: rawData.admission_date || '',
    full_name: rawData.full_name || '',
    gender: rawData.gender || '',
    chief_complaint: rawData.chief_complaint || '',
    present_illness: rawData.present_illness || '',
    diagnoses: rawData.current_diagnosis || [],
    current_treatment: rawData.current_treatment ? rawData.current_treatment.map(treatment => ({
      name: treatment.name || '',
      dosage: treatment.dosage || '',
      frequency: treatment.frequency || '',
      start_date: treatment.start_date || '',
      end_date: treatment.end_date || '',
      notes: treatment.notes || ''
    })) : []
  };

  console.log("Transformed security_id:", patientData.security_id);
  console.log("Raw id_number:", rawData.id_number);

  // Handle date_of_birth to birth_date mapping
  if (rawData.date_of_birth) {
    patientData.birth_date = rawData.date_of_birth;
  }

  // Handle vital signs
  if (rawData.vital_signs) {
    patientData.vital_signs = {
      temperature: 0,
      pulse: 0,
      respiration: 0,
      blood_pressure: rawData.vital_signs.blood_pressure || "",
      weight: rawData.vital_signs.weight ? parseFloat(rawData.vital_signs.weight.toString()) : null,
      height: rawData.vital_signs.height ? parseFloat(rawData.vital_signs.height.toString()) : null
    };

    // Parse numeric values from strings with units
    if (typeof rawData.vital_signs.temperature === 'string') {
      const tempMatch = rawData.vital_signs.temperature.match(/([0-9.]+)/);
      if (tempMatch && tempMatch[1]) {
        patientData.vital_signs.temperature = parseFloat(tempMatch[1]);
      }
    } else if (typeof rawData.vital_signs.temperature === 'number') {
      patientData.vital_signs.temperature = rawData.vital_signs.temperature;
    }

    if (typeof rawData.vital_signs.pulse === 'string') {
      const pulseMatch = rawData.vital_signs.pulse.match(/([0-9]+)/);
      if (pulseMatch && pulseMatch[1]) {
        patientData.vital_signs.pulse = parseInt(pulseMatch[1], 10);
      }
    } else if (typeof rawData.vital_signs.pulse === 'number') {
      patientData.vital_signs.pulse = rawData.vital_signs.pulse;
    }

    if (typeof rawData.vital_signs.respiration === 'string') {
      const respMatch = rawData.vital_signs.respiration.match(/([0-9]+)/);
      if (respMatch && respMatch[1]) {
        patientData.vital_signs.respiration = parseInt(respMatch[1], 10);
      }
    } else if (typeof rawData.vital_signs.respiration === 'number') {
      patientData.vital_signs.respiration = rawData.vital_signs.respiration;
    }
  }

  // Handle past medical history with explicit mapping
  if (rawData.past_medical_history) {
    patientData.past_medical_history = {
      cardiovascular: {
        hypertension: rawData.past_medical_history.hypertension || false,
        coronary_artery_disease: rawData.past_medical_history.coronary_artery_disease || false,
        atrial_fibrillation: rawData.past_medical_history.atrial_fibrillation || false,
        heart_failure: rawData.past_medical_history.heart_failure || false,
        cerebral_infarction: rawData.past_medical_history.cerebral_infarction || false,
        others: []
      },
      endocrine: {
        diabetes_type1: rawData.past_medical_history.diabetes_type1 || false,
        diabetes_type2: rawData.past_medical_history.diabetes_type2 || false,
        hyperthyroidism: rawData.past_medical_history.hyperthyroidism || false,
        hypothyroidism: rawData.past_medical_history.hypothyroidism || false,
        others: []
      },
      respiratory: {
        asthma: rawData.past_medical_history.asthma || false,
        copd: rawData.past_medical_history.copd || false,
        others: []
      },
      kidney: {
        acute_kidney_injury: rawData.past_medical_history.acute_kidney_injury || false,
        chronic_kidney_disease: rawData.past_medical_history.chronic_kidney_disease || false,
        others: []
      },
      liver: {
        fatty_liver: rawData.past_medical_history.fatty_liver || false,
        cirrhosis: rawData.past_medical_history.cirrhosis || false,
        others: []
      },
      infectious_disease: {
        hepatitis: rawData.past_medical_history.hepatitis || false,
        tuberculosis: rawData.past_medical_history.tuberculosis || false,
        others: []
      },
      vaccination_history: rawData.past_medical_history.vaccination_history?.map(vaccine => ({
        vaccine_name: vaccine.vaccine_name || '',
        date: vaccine.date || '',
        notes: vaccine.notes || ''
      })) || []
    };
  }

  // Handle allergies
  if (rawData.allergies && Array.isArray(rawData.allergies)) {
    patientData.allergies = rawData.allergies.map(allergy => ({
      name: allergy.name || '',
      reaction: allergy.reaction || ''
    }));
  }

  // Handle surgical history
  if (rawData.surgical_history && Array.isArray(rawData.surgical_history)) {
    patientData.surgical_history = rawData.surgical_history.map(surgery => ({
      name: surgery.procedure || '',
      date: surgery.date || '',
      notes: surgery.notes || ''
    }));
  }

  // Handle drug use history
  if (rawData.drug_use_history && Array.isArray(rawData.drug_use_history)) {
    patientData.drug_use_history = rawData.drug_use_history.map(drug => ({
      name: drug.drug_name || '',
      duration: drug.duration || '',
      notes: drug.notes || ''
    }));
  }

  // Handle family history
  if (rawData.family_status) {
    patientData.family_history = {
      father: {
        status: rawData.family_status.father?.status || 'alive',
        cause: rawData.family_status.father?.death_reason || ''
      },
      mother: {
        status: rawData.family_status.mother?.status || 'alive',
        cause: rawData.family_status.mother?.death_reason || ''
      },
      hereditary_diseases: (rawData.family_status.hereditary_diseases?.length ?? 0) > 0,
      hereditary_details: rawData.family_status.hereditary_diseases?.map(disease => ({
        name: disease,
        notes: ''
      })) || [],
      infectious_diseases_in_family: (rawData.family_status.infectious_diseases?.length ?? 0) > 0,
      infectious_details: rawData.family_status.infectious_diseases?.map(disease => ({
        name: disease,
        notes: ''
      })) || [],
      cancer_history: (rawData.family_status.cancer_history?.length ?? 0) > 0,
      cancer_details: rawData.family_status.cancer_history?.map(cancer => ({
        name: cancer,
        notes: ''
      })) || []
    };
  }

  // Handle habits
  if (rawData.habits) {
    patientData.habits = {
      smoking: rawData.habits.smoking || false,
      smoking_details: {
        duration: rawData.habits.smoking_duration || '',
        cigarettes_per_day: rawData.habits.cigarettes_per_day || 0
      },
      alcohol: rawData.habits.alcohol || false,
      alcohol_details: {
        duration: rawData.habits.alcohol_duration || '',
        quantity_per_day: rawData.habits.alcohol_quantity || ''
      },
      toxic_exposure: rawData.habits.toxic_exposure || false,
      toxic_exposure_details: {
        type: rawData.habits.toxic_type || '',
        duration: rawData.habits.toxic_duration || ''
      },
      residence_in_epidemic_region: rawData.habits.residence_in_epidemic_region || false,
      epidemic_region_details: rawData.habits.epidemic_region_details || '',
      exposure_to_infected_water: rawData.habits.exposure_to_infected_water || false,
      infected_water_details: rawData.habits.infected_water_details || ''
    };
  }

  // Handle neurological examination
  if (rawData.neurological_exam) {
    const neuroExam = rawData.neurological_exam;
    
    patientData.neurological_examination = {
      meningeal_signs: {
        neck_stiffness: 'negative',
        kernig_sign: 'negative',
        brudzinski_sign: 'negative'
      },
      cranial_nerves: {
        pupil_size: {
          left: 0,
          right: 0
        },
        light_reflex: {
          direct: '',
          indirect: ''
        },
        cn_i: { 
          status: 'normal', 
          right_status: 'normal',
          notes: '' 
        },
        cn_ii: { 
          visual_acuity_left: 'normal',
          visual_acuity_right: 'normal',
          visual_fields_left: 'normal',
          visual_fields_right: 'normal',
          fundus_left: 'normal',
          fundus_right: 'normal',
          notes: '' 
        },
        cn_iii_iv_vi: { 
          eye_movement: 'normal',
          ptosis: false,
          nystagmus: false,
          diplopia: false,
          status: 'normal', 
          notes: '' 
        },
        cn_v: { 
          sensation_v1: 'normal',
          sensation_v2: 'normal',
          sensation_v3: 'normal',
          corneal_left: 'normal',
          corneal_right: 'normal',
          jaw_strength: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_vii: { 
          eye_fissure_left: 0,
          eye_fissure_right: 0,
          nasolabial_left: 'normal',
          nasolabial_right: 'normal',
          mouth_deviation: 'none',
          facial_movement: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_viii: { 
          hearing_left: 'normal',
          hearing_right: 'normal',
          rinne_test: 'normal',
          weber_test: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_ix_x: { 
          palate_elevation: 'normal',
          gag_reflex: 'normal',
          speech: 'normal',
          swallowing: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xi: { 
          scm_strength_left: 'normal',
          scm_strength_right: 'normal',
          trapezius_strength_left: 'normal',
          trapezius_strength_right: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xii: { 
          tongue_position: 'midline',
          tongue_strength: 'normal',
          tongue_atrophy: false,
          tongue_fasciculations: false,
          status: 'normal', 
          notes: '' 
        }
      },
      motor: {
        tone: '',
        strength: {
          upper_limbs: {
            left: 0,
            right: 0,
          },
          lower_limbs: {
            left: 0,
            right: 0,
          },
        },
        babinski_sign: {
          left: 'negative',
          right: 'negative'
        }
      },
      reflexes: '',
      coordination: '',
      sensory: '',
      autonomic_signs: '',
    };
    
    // Pupil size - left
    if (neuroExam.pupil_size_left) {
      if (typeof neuroExam.pupil_size_left === 'number') {
        patientData.neurological_examination.cranial_nerves.pupil_size.left = neuroExam.pupil_size_left;
      } else if (typeof neuroExam.pupil_size_left === 'string') {
        const leftMatch = neuroExam.pupil_size_left.match(/([0-9.]+)/);
        if (leftMatch && leftMatch[1]) {
          patientData.neurological_examination.cranial_nerves.pupil_size.left = parseFloat(leftMatch[1]);
        }
      }
    }
    
    // Pupil size - right
    if (neuroExam.pupil_size_right) {
      if (typeof neuroExam.pupil_size_right === 'number') {
        patientData.neurological_examination.cranial_nerves.pupil_size.right = neuroExam.pupil_size_right;
      } else if (typeof neuroExam.pupil_size_right === 'string') {
        const rightMatch = neuroExam.pupil_size_right.match(/([0-9.]+)/);
        if (rightMatch && rightMatch[1]) {
          patientData.neurological_examination.cranial_nerves.pupil_size.right = parseFloat(rightMatch[1]);
        }
      }
    }
    
    // Light reflex
    if (neuroExam.light_reflex) {
      patientData.neurological_examination.cranial_nerves.light_reflex.direct = neuroExam.light_reflex;
      patientData.neurological_examination.cranial_nerves.light_reflex.indirect = neuroExam.light_reflex;
    }
    
    // Muscle strength
    if (neuroExam.muscle_strength_left_upper !== null && neuroExam.muscle_strength_left_upper !== undefined) {
      patientData.neurological_examination.motor.strength.upper_limbs.left = 
        typeof neuroExam.muscle_strength_left_upper === 'number' ? 
        neuroExam.muscle_strength_left_upper : 0;
    }
    
    if (neuroExam.muscle_strength_left_lower !== null && neuroExam.muscle_strength_left_lower !== undefined) {
      patientData.neurological_examination.motor.strength.lower_limbs.left = 
        typeof neuroExam.muscle_strength_left_lower === 'number' ? 
        neuroExam.muscle_strength_left_lower : 0;
    }
    
    if (neuroExam.muscle_strength_right_upper !== null && neuroExam.muscle_strength_right_upper !== undefined) {
      patientData.neurological_examination.motor.strength.upper_limbs.right = 
        typeof neuroExam.muscle_strength_right_upper === 'number' ? 
        neuroExam.muscle_strength_right_upper : 0;
    }
    
    if (neuroExam.muscle_strength_right_lower !== null && neuroExam.muscle_strength_right_lower !== undefined) {
      patientData.neurological_examination.motor.strength.lower_limbs.right = 
        typeof neuroExam.muscle_strength_right_lower === 'number' ? 
        neuroExam.muscle_strength_right_lower : 0;
    }
    
    // Babinski sign
    if (neuroExam.babinski_sign) {
      const babinskiValue = neuroExam.babinski_sign === 'positive' ? 'positive' : 'negative';
      patientData.neurological_examination.motor.babinski_sign.left = babinskiValue;
      patientData.neurological_examination.motor.babinski_sign.right = babinskiValue;
    }
  }

  return patientData;
}

/**
 * Direct pattern matching extraction for patient data
 * This is more precise than the previous local extraction function
 */
function extractPatientDataDirectly(textContent: string): Partial<Patient> {
  const extractedData: Partial<Patient> = {
    past_medical_history: {
      cardiovascular: {
        hypertension: false,
        coronary_artery_disease: false,
        atrial_fibrillation: false,
        heart_failure: false,
        cerebral_infarction: false,
        others: []
      },
      endocrine: {
        diabetes_type1: false,
        diabetes_type2: false,
        hyperthyroidism: false,
        hypothyroidism: false,
        others: []
      },
      respiratory: {
        asthma: false,
        copd: false,
        others: []
      },
      kidney: {
        acute_kidney_injury: false,
        chronic_kidney_disease: false,
        others: []
      },
      liver: {
        fatty_liver: false,
        cirrhosis: false,
        others: []
      },
      infectious_disease: {
        hepatitis: false,
        tuberculosis: false,
        others: []
      },
      vaccination_history: []
    },
    vital_signs: {
      pulse: 0,
      respiration: 0,
      blood_pressure: "",
      temperature: 0,
      weight: null,
      height: null
    },
    family_history: {
      father: {
        status: 'alive',
        cause: ''
      },
      mother: {
        status: 'alive',
        cause: ''
      },
      hereditary_diseases: false,
      hereditary_details: [],
      infectious_diseases_in_family: false,
      infectious_details: [],
      cancer_history: false,
      cancer_details: []
    },
    neurological_examination: {
      meningeal_signs: {
        neck_stiffness: 'negative',
        kernig_sign: 'negative',
        brudzinski_sign: 'negative'
      },
      cranial_nerves: {
        pupil_size: {
          left: 0,
          right: 0
        },
        light_reflex: {
          direct: '',
          indirect: ''
        },
        cn_i: { 
          status: 'normal', 
          right_status: 'normal',
          notes: '' 
        },
        cn_ii: { 
          visual_acuity_left: 'normal',
          visual_acuity_right: 'normal',
          visual_fields_left: 'normal',
          visual_fields_right: 'normal',
          fundus_left: 'normal',
          fundus_right: 'normal',
          notes: '' 
        },
        cn_iii_iv_vi: { 
          eye_movement: 'normal',
          ptosis: false,
          nystagmus: false,
          diplopia: false,
          status: 'normal', 
          notes: '' 
        },
        cn_v: { 
          sensation_v1: 'normal',
          sensation_v2: 'normal',
          sensation_v3: 'normal',
          corneal_left: 'normal',
          corneal_right: 'normal',
          jaw_strength: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_vii: { 
          eye_fissure_left: 0,
          eye_fissure_right: 0,
          nasolabial_left: 'normal',
          nasolabial_right: 'normal',
          mouth_deviation: 'none',
          facial_movement: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_viii: { 
          hearing_left: 'normal',
          hearing_right: 'normal',
          rinne_test: 'normal',
          weber_test: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_ix_x: { 
          palate_elevation: 'normal',
          gag_reflex: 'normal',
          speech: 'normal',
          swallowing: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xi: { 
          scm_strength_left: 'normal',
          scm_strength_right: 'normal',
          trapezius_strength_left: 'normal',
          trapezius_strength_right: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xii: { 
          tongue_position: 'midline',
          tongue_strength: 'normal',
          tongue_atrophy: false,
          tongue_fasciculations: false,
          status: 'normal', 
          notes: '' 
        }
      },
      motor: {
        tone: '',
        strength: {
          upper_limbs: {
            left: 0,
            right: 0,
          },
          lower_limbs: {
            left: 0,
            right: 0,
          },
        },
        babinski_sign: {
          left: 'negative',
          right: 'negative'
        }
      },
      reflexes: '',
      coordination: '',
      sensory: '',
      autonomic_signs: '',
    },
    surgical_history: [],
    allergies: [],
    drug_use_history: [],
    habits: {
      smoking: false,
      smoking_details: {
        duration: '',
        cigarettes_per_day: 0
      },
      alcohol: false,
      alcohol_details: {
        duration: '',
        quantity_per_day: ''
      },
      toxic_exposure: false,
      toxic_exposure_details: {
        type: '',
        duration: ''
      },
      residence_in_epidemic_region: false,
      epidemic_region_details: '',
      exposure_to_infected_water: false,
      infected_water_details: ''
    }
  };
  
  // Extract name with more precise pattern matching
  const nameMatch = textContent.match(/Name:\s*([^\n]+)/i);
  if (nameMatch && nameMatch[1]) {
    extractedData.full_name = nameMatch[1].trim();
  }
  
  // Extract gender
  const genderMatch = textContent.match(/Gender:\s*([^\n]+)/i);
  if (genderMatch && genderMatch[1]) {
    extractedData.gender = genderMatch[1].trim();
  } else if (/\bmale\b/i.test(textContent)) {
    extractedData.gender = 'Male';
  } else if (/\bfemale\b/i.test(textContent)) {
    extractedData.gender = 'Female';
  }
  
  // Extract date of birth
  const dobMatch = textContent.match(/(?:Date of Birth|DOB|Birth Date):\s*([^\n]+)/i);
  if (dobMatch && dobMatch[1]) {
    try {
      // Try to parse and standardize the date format
      const dobText = dobMatch[1].trim();
      const date = new Date(dobText);
      if (!isNaN(date.getTime())) {
        extractedData.birth_date = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else {
        extractedData.birth_date = dobText; // Keep original if parsing fails
      }
    } catch {
      extractedData.birth_date = dobMatch[1].trim(); // Just use the raw match if parsing fails
    }
  }
  
  // Extract chief complaint with more precise pattern matching
  const chiefComplaintMatch = textContent.match(/Chief\s+Complaint:\s*([^\n]+)/i);
  if (chiefComplaintMatch && chiefComplaintMatch[1]) {
    extractedData.chief_complaint = chiefComplaintMatch[1].trim();
  }
  
  // Extract present illness with more precise pattern matching
  const illnessMatch = textContent.match(/Present\s+Illness\s+History:[\s\n]+([^#]+?)(?=\n\n|\n[A-Z]|$)/i);
  if (illnessMatch && illnessMatch[1]) {
    extractedData.present_illness = illnessMatch[1].trim();
  }
  
  // Extract vital signs
  const tempMatch = textContent.match(/Temperature:\s*([0-9.]+)\s*[°℃℉CF]+/i);
  if (tempMatch && tempMatch[1]) {
    extractedData.vital_signs!.temperature = parseFloat(tempMatch[1].trim());
  }
  
  const pulseMatch = textContent.match(/(?:Pulse|Heart Rate):\s*([0-9]+)/i);
  if (pulseMatch && pulseMatch[1]) {
    extractedData.vital_signs!.pulse = parseInt(pulseMatch[1].trim(), 10);
  }
  
  const respMatch = textContent.match(/Respiration:\s*([0-9]+)/i);
  if (respMatch && respMatch[1]) {
    extractedData.vital_signs!.respiration = parseInt(respMatch[1].trim(), 10);
  }
  
  const bpMatch = textContent.match(/Blood Pressure:\s*([0-9]+\/[0-9]+)/i);
  if (bpMatch && bpMatch[1]) {
    extractedData.vital_signs!.blood_pressure = bpMatch[1].trim();
  }
  
  // Extract past medical history - cardiovascular
  extractedData.past_medical_history!.cardiovascular.hypertension = /history of hypertension/i.test(textContent);
  extractedData.past_medical_history!.cardiovascular.coronary_artery_disease = /(?:history of|has) (?:heart disease|coronary disease)/i.test(textContent);
  extractedData.past_medical_history!.cardiovascular.heart_failure = /(?:history of|has) heart failure/i.test(textContent);
  extractedData.past_medical_history!.cardiovascular.atrial_fibrillation = /(?:history of|has) (?:atrial fibrillation|afib)/i.test(textContent);
  
  // Extract past medical history - endocrine
  extractedData.past_medical_history!.endocrine.diabetes_type1 = /(?:history of|has) (?:diabetes type 1|type 1 diabetes)/i.test(textContent);
  extractedData.past_medical_history!.endocrine.diabetes_type2 = /(?:history of|has) (?:diabetes type 2|type 2 diabetes)/i.test(textContent);
  if (!extractedData.past_medical_history!.endocrine.diabetes_type1 && !extractedData.past_medical_history!.endocrine.diabetes_type2) {
    // If diabetes type is not specified, mark type 2 as default
    extractedData.past_medical_history!.endocrine.diabetes_type2 = /history of diabetes/i.test(textContent);
  }
  extractedData.past_medical_history!.endocrine.hyperthyroidism = /(?:history of|has) hyperthyroidism/i.test(textContent);
  extractedData.past_medical_history!.endocrine.hypothyroidism = /(?:history of|has) hypothyroidism/i.test(textContent);
  
  // Extract past medical history - respiratory
  extractedData.past_medical_history!.respiratory.asthma = /(?:history of|has) asthma/i.test(textContent);
  extractedData.past_medical_history!.respiratory.copd = /(?:history of|has) (?:COPD|chronic obstructive)/i.test(textContent);
  
  // Extract past medical history - liver
  extractedData.past_medical_history!.liver.fatty_liver = /(?:history of|has) fatty liver/i.test(textContent);
  extractedData.past_medical_history!.liver.cirrhosis = /(?:history of|has) cirrhosis/i.test(textContent);
  
  // Extract past medical history - kidney
  extractedData.past_medical_history!.kidney.acute_kidney_injury = /(?:history of|has) acute kidney/i.test(textContent);
  extractedData.past_medical_history!.kidney.chronic_kidney_disease = /(?:history of|has) chronic kidney/i.test(textContent);
  
  // Extract past medical history - infectious diseases
  extractedData.past_medical_history!.infectious_disease.hepatitis = /history of hepatitis/i.test(textContent);
  extractedData.past_medical_history!.infectious_disease.tuberculosis = /history of tuberculosis/i.test(textContent);
  
  // Extract family status
  if (/Father:\s*(?:Alive|Living)/i.test(textContent)) {
    extractedData.family_history!.father.status = "alive";
  } else if (/Father:\s*(?:Deceased|Dead)/i.test(textContent)) {
    extractedData.family_history!.father.status = "deceased";
    
    // Try to extract cause of death
    const fatherCauseMatch = textContent.match(/Father:.*deceased.*due to\s*([^,.]+)/i);
    if (fatherCauseMatch && fatherCauseMatch[1]) {
      extractedData.family_history!.father.cause = fatherCauseMatch[1].trim();
    }
  }
  
  if (/Mother:\s*(?:Alive|Living)/i.test(textContent)) {
    extractedData.family_history!.mother.status = "alive";
  } else if (/Mother:\s*(?:Deceased|Dead)/i.test(textContent)) {
    extractedData.family_history!.mother.status = "deceased";
    
    // Try to extract cause of death
    const motherCauseMatch = textContent.match(/Mother:.*deceased.*due to\s*([^,.]+)/i);
    if (motherCauseMatch && motherCauseMatch[1]) {
      extractedData.family_history!.mother.cause = motherCauseMatch[1].trim();
    }
  }
  
  // Extract smoking habits
  if (/smok(?:es|ing)/i.test(textContent)) {
    extractedData.habits!.smoking = true;
    
    // Try to extract cigarettes per day
    const cigarettesMatch = textContent.match(/smok(?:es|ing)\s*([0-9]+)\s*(?:cigarettes|packs)/i);
    if (cigarettesMatch && cigarettesMatch[1]) {
      const amount = parseInt(cigarettesMatch[1], 10);
      extractedData.habits!.smoking_details!.cigarettes_per_day = amount;
    }
    
    // Try to extract duration
    const smokeDurationMatch = textContent.match(/smok(?:es|ing)\s*(?:for|since)\s*([0-9]+\s*(?:years|months|year|month))/i);
    if (smokeDurationMatch && smokeDurationMatch[1]) {
      extractedData.habits!.smoking_details!.duration = smokeDurationMatch[1].trim();
    }
  }
  
  // Extract alcohol habits
  if (/(?:alcohol|drink)/i.test(textContent)) {
    extractedData.habits!.alcohol = true;
    
    // Try to extract quantity
    const alcoholQuantityMatch = textContent.match(/(?:drinks|consumes)\s*([^,.]+?)(?:per|a|each)\s*day/i);
    if (alcoholQuantityMatch && alcoholQuantityMatch[1]) {
      extractedData.habits!.alcohol_details!.quantity_per_day = alcoholQuantityMatch[1].trim();
    }
    
    // Try to extract duration
    const alcoholDurationMatch = textContent.match(/(?:alcohol|drinking)\s*(?:for|since)\s*([0-9]+\s*(?:years|months|year|month))/i);
    if (alcoholDurationMatch && alcoholDurationMatch[1]) {
      extractedData.habits!.alcohol_details!.duration = alcoholDurationMatch[1].trim();
    }
  }
  
  // Extract neurological examination
  const pupilSizeMatch = textContent.match(/Pupils?\s*(?:size)?:\s*([0-9.]+)\s*mm/i);
  if (pupilSizeMatch && pupilSizeMatch[1]) {
    const pupilSize = parseFloat(pupilSizeMatch[1]);
    extractedData.neurological_examination!.cranial_nerves.pupil_size.left = pupilSize;
    extractedData.neurological_examination!.cranial_nerves.pupil_size.right = pupilSize;
  }
  
  // Try to extract individual pupil sizes
  const leftPupilMatch = textContent.match(/(?:Left|L)\s*[Pp]upil\s*(?:size)?:\s*([0-9.]+)\s*mm/i);
  if (leftPupilMatch && leftPupilMatch[1]) {
    extractedData.neurological_examination!.cranial_nerves.pupil_size.left = parseFloat(leftPupilMatch[1]);
  }
  
  const rightPupilMatch = textContent.match(/(?:Right|R)\s*[Pp]upil\s*(?:size)?:\s*([0-9.]+)\s*mm/i);
  if (rightPupilMatch && rightPupilMatch[1]) {
    extractedData.neurological_examination!.cranial_nerves.pupil_size.right = parseFloat(rightPupilMatch[1]);
  }
  
  if (/normal light reflex/i.test(textContent)) {
    extractedData.neurological_examination!.cranial_nerves.light_reflex.direct = "normal";
    extractedData.neurological_examination!.cranial_nerves.light_reflex.indirect = "normal";
  } else if (/abnormal light reflex/i.test(textContent)) {
    extractedData.neurological_examination!.cranial_nerves.light_reflex.direct = "abnormal";
    extractedData.neurological_examination!.cranial_nerves.light_reflex.indirect = "abnormal";
  }
  
  // Extract muscle strength - left side
  const leftUpperStrengthMatch = textContent.match(/Left:\s*Upper(?:\s*limb)?:\s*([0-9])\/[0-9]/i);
  if (leftUpperStrengthMatch && leftUpperStrengthMatch[1]) {
    const strengthValue = parseInt(leftUpperStrengthMatch[1], 10);
    if (!isNaN(strengthValue)) {
      extractedData.neurological_examination!.motor.strength.upper_limbs.left = strengthValue;
    }
  }
  
  const leftLowerStrengthMatch = textContent.match(/Left:\s*Lower(?:\s*limb)?:\s*([0-9])\/[0-9]/i);
  if (leftLowerStrengthMatch && leftLowerStrengthMatch[1]) {
    const strengthValue = parseInt(leftLowerStrengthMatch[1], 10);
    if (!isNaN(strengthValue)) {
      extractedData.neurological_examination!.motor.strength.lower_limbs.left = strengthValue;
    }
  }
  
  // Extract muscle strength - right side
  const rightUpperStrengthMatch = textContent.match(/Right:\s*Upper(?:\s*limb)?:\s*([0-9])\/[0-9]/i);
  if (rightUpperStrengthMatch && rightUpperStrengthMatch[1]) {
    const strengthValue = parseInt(rightUpperStrengthMatch[1], 10);
    if (!isNaN(strengthValue)) {
      extractedData.neurological_examination!.motor.strength.upper_limbs.right = strengthValue;
    }
  }
  
  const rightLowerStrengthMatch = textContent.match(/Right:\s*Lower(?:\s*limb)?:\s*([0-9])\/[0-9]/i);
  if (rightLowerStrengthMatch && rightLowerStrengthMatch[1]) {
    const strengthValue = parseInt(rightLowerStrengthMatch[1], 10);
    if (!isNaN(strengthValue)) {
      extractedData.neurological_examination!.motor.strength.lower_limbs.right = strengthValue;
    }
  }
  
  // Extract Babinski sign
  if (/Babinski(?:'s)?\s*sign:\s*Positive/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.left = "positive";
    extractedData.neurological_examination!.motor.babinski_sign.right = "positive";
  } else if (/Babinski(?:'s)?\s*sign:\s*Negative/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.left = "negative";
    extractedData.neurological_examination!.motor.babinski_sign.right = "negative";
  }
  
  // Check for individual Babinski signs
  if (/(?:Left|L)\s*Babinski(?:'s)?\s*sign:\s*Positive/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.left = "positive";
  } else if (/(?:Left|L)\s*Babinski(?:'s)?\s*sign:\s*Negative/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.left = "negative";
  }
  
  if (/(?:Right|R)\s*Babinski(?:'s)?\s*sign:\s*Positive/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.right = "positive";
  } else if (/(?:Right|R)\s*Babinski(?:'s)?\s*sign:\s*Negative/i.test(textContent)) {
    extractedData.neurological_examination!.motor.babinski_sign.right = "negative";
  }
  
  // Extract allergies
  const allergiesMatch = textContent.match(/Allergies:\s*([^\n]+)/i);
  if (allergiesMatch && allergiesMatch[1]) {
    const allergiesText = allergiesMatch[1].trim();
    if (!/none|no known|nka/i.test(allergiesText)) {
      const allergyItems = allergiesText.split(/,\s*/);
      for (const item of allergyItems) {
        // Try to separate allergen and reaction
        const allergyParts = item.split(/\s*-\s*|\s*:\s*/);
        if (allergyParts.length > 1) {
          extractedData.allergies!.push({
            name: allergyParts[0].trim(),
            reaction: allergyParts.slice(1).join(' ').trim()
          });
        } else {
          extractedData.allergies!.push({
            name: item.trim(),
            reaction: ''
          });
        }
      }
    }
  }
  
  return extractedData;
}

/**
 * Process a Word document and extract patient data in one step
 */
export async function processPatientWordDocument(
  file: File
): Promise<Partial<Patient>> {
  try {
    // First extract text from the Word document
    const textContent = await extractTextFromWordFile(file);
    console.log("Extracted text content length:", textContent.length);
    
    // Then use AI to extract structured patient data
    const patientData = await extractPatientDataWithAI(textContent);
    
    return patientData;
  } catch (error) {
    console.error('Error processing patient document:', error);
    throw error;
  }
} 