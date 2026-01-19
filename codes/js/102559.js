"use client";
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BsCamera,
  BsArrowLeft,
  BsUpload,
  BsImages,
  BsFilm,
  BsImage,
  BsLightningFill,
  BsLock,
  BsStarFill,
} from "react-icons/bs";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import the unified CSS module
import styles from "../shared/analysisPages.module.css";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { FaCheckCircle, FaPlusCircle } from "react-icons/fa";
import { getUserPets } from "@/lib/supabase/pets";
import { getUserCredits } from "@/lib/supabase/credits";
import { saveAnalysis } from "@/lib/supabase/analysis";
import { toast } from "react-hot-toast";
import CreatePet from "@/app/components/CreatePet/CreatePet";

// Inițializare Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyBQTU1MsgEgE0nzi8KkLz1GhHbSxEkVR14");

// Funcție helper pentru a converti un fișier în format pentru Gemini API
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64data = reader.result.split(",")[1]; // Extrage doar partea de base64
        resolve({
          inlineData: {
            data: base64data,
            mimeType: file.type,
          },
        });
      } catch (error) {
        reject(new Error(`Eroare la procesarea fișierului: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Eroare la citirea fișierului"));
    reader.readAsDataURL(file); // Aceasta generează un string base64
  });
};

// Funcție pentru a determina clasa CSS pentru nivel de încredere
const getConfidenceClass = (confidence) => {
  if (confidence >= 0.7) return styles.highConfidence;
  if (confidence >= 0.4) return styles.mediumConfidence;
  return styles.lowConfidence;
};

// Funcție pentru a afișa procentajul din valoare între 0-1
const formatConfidence = (confidence) => {
  return `${Math.round(confidence * 100)}%`;
};

// Funcție pentru a formata rezultatul din Gemini
const formatVetAnalysisResult = (result) => {
  try {
    // Încearcă să analizeze rezultatul ca JSON
    if (result.includes("{") && result.includes("}")) {
      const jsonStart = result.indexOf("{");
      const jsonEnd = result.lastIndexOf("}") + 1;
      const jsonStr = result.substring(jsonStart, jsonEnd);
      const data = JSON.parse(jsonStr);
      return data;
    }

    // Dacă nu este JSON, presupunem că e text
    return {
      raw: result,
      possibleConditions: [],
      recommendations: [],
      urgencyLevel: "unknown",
      additionalObservations: "",
    };
  } catch (e) {
    console.error("Eroare la parsarea rezultatului:", e);
    return {
      raw: result,
      possibleConditions: [],
      recommendations: [],
      urgencyLevel: "unknown",
      additionalObservations: "",
    };
  }
};

// Funcție pentru formatarea mărimii fișierului
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

// Add retry with backoff function
const retryWithBackoff = async (fn, retries = 3, delay = 1000, backoffFactor = 2) => {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed: ${error.message}`);

      // Check if it's a service overload error - don't retry for other errors
      if (!error.message.includes("overloaded") && !error.message.includes("503")) {
        throw error;
      }

      if (attempt < retries - 1) {
        const backoffDelay = delay * Math.pow(backoffFactor, attempt);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError;
};

export default function VetAnalysisPage() {
  const { t, i18n } = useTranslation(["vet", "common"]);
  const router = useRouter();
  const params = useParams();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' sau 'video'
  const [mediaPreview, setMediaPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [formattedResult, setFormattedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showCreatePetModal, setShowCreatePetModal] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Replace the hardcoded pets array with empty array and fetch from Supabase
  const [pets, setPets] = useState([]);

  // Replace the credits object with null
  const [credits, setCredits] = useState(null);

  // Helper function to create language-prefixed paths
  const langPrefixed = (path) => {
    return `/${i18n.language?.substring(0, 2) || "en"}${path}`;
  };

  // Detectează dacă dispozitivul este mobil
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Actualizează rezultatul formatat când se schimbă rezultatul textual
  useEffect(() => {
    if (result) {
      setFormattedResult(formatVetAnalysisResult(result));
    }
  }, [result]);

  // Check URL parameters for media type selection
  useEffect(() => {
    // Get URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const mediaParam = searchParams.get("media");

    // If media parameter is present, trigger the appropriate action
    if (mediaParam === "photo") {
      // Simulated click on camera or gallery button
      if (isMobile) {
        handleCameraClick();
      } else {
        handleGalleryClick();
      }
    } else if (mediaParam === "video") {
      // Simulated click on video button
      if (isMobile) {
        handleVideoClick();
      } else {
        handleGalleryClick();
      }
    }
  }, [isMobile]);

  // Add useEffect to fetch pets and credits from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pets
        const { data: petsData, error: petsError } = await getUserPets();
        if (!petsError) {
          setPets(petsData || []);
        } else {
          console.error("Error fetching pets:", petsError);
        }

        // Fetch credits
        const { data: creditsData, error: creditsError } = await getUserCredits();
        if (!creditsError) {
          setCredits(creditsData);
        } else {
          console.error("Error fetching credits:", creditsError);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }

    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Fișier selectat:", file.name, file.type, file.size);
      processFile(file);
    }
  };

  const handleBackClick = () => {
    router.push(langPrefixed("/app/analyze"));
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleVideoClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = (file) => {
    if (!file) {
      setError(t("errors.fileType", { ns: "vet" }));
      return;
    }

    const isImage = file.type.includes("image/");
    const isVideo = file.type.includes("video/");

    if (!isImage && !isVideo) {
      setError(t("errors.fileType", { ns: "vet" }));
      return;
    }

    // Check file size
    if (isImage && file.size > 10 * 1024 * 1024) {
      // 10MB for images
      setError(t("errors.imageTooLarge10MB", { ns: "vet" }));
      return;
    }
    if (isVideo && file.size > 25 * 1024 * 1024) {
      // 25MB for videos
      setError(t("errors.videoTooLarge25MB", { ns: "vet" }));
      return;
    }

    console.log(
      "Procesare fișier:",
      file.name,
      "Tip:",
      file.type,
      "Mărime:",
      formatFileSize(file.size)
    );

    if (!isImage && !isVideo) {
      setError(t("vetAnalysis.errors.fileType"));
      return;
    }

    // Curăță URL-ul anterior dacă există
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setError(null);
    setResult(null);
    setFormattedResult(null);
    setMedia(file);
    setMediaType(isImage ? "image" : "video");

    // Creează un URL pentru previzualizare
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Update analyzeMedia function to check credits and save results
  const analyzeMedia = async () => {
    const creditsRequired = mediaType === "video" ? 2 : 1;

    if (!media) {
      setError(t("errors.selectImage", { ns: "vet" }));
      return;
    }

    if (!selectedPet) {
      setError(t("errors.selectPetFirst", { ns: "vet" }));
      return;
    }

    if (!credits || credits.vet_credits < creditsRequired) {
      setError(t("errors.noCredits", { ns: "vet", count: creditsRequired }));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert media for Gemini API
      const mediaPart = await fileToGenerativePart(media);

      // Use Gemini Vision model for analysis
      // Revenim la modelul gemini-1.5-pro-latest pentru o precizie mai bună a analizei
      // Acuratețea este critică pentru evaluările veterinare, astfel că preferăm
      // modelul cu performanță superioară, chiar dacă este mai costisitor
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
      });

      // Get the current language
      const currentLang = i18n.language || params?.lang?.substring(0, 2).toLowerCase() || "en";

      let aiPrompt = `${t("aiPrompt.analyze", { ns: "vet" })}

${t("aiPrompt.format", { ns: "vet" })}

{
  "possibleConditions": ${t("aiPrompt.jsonPossibleConditions", { ns: "vet" })},
  "recommendations": ${t("aiPrompt.jsonRecommendations", { ns: "vet" })},
  "urgencyLevel": ${t("aiPrompt.jsonUrgencyLevel", { ns: "vet" })},
  "additionalObservations": "${t("aiPrompt.jsonAdditionalObservations", { ns: "vet" })}"
}

${t("aiPrompt.criteriaList", { ns: "vet" })
  .map((criteria, index) => `${index + 1}. ${criteria}`)
  .join("\n")}

${t("aiPrompt.instructions", { ns: "vet" })}

${t("aiPrompt.important", { ns: "vet" })}

${t("aiPrompt.language", { ns: "vet" })}`;

      let analysisResult;
      let saveSuccessful = false;

      try {
        // Use the retry function
        const result = await retryWithBackoff(
          async () => {
            const response = await model.generateContent([aiPrompt, mediaPart]);
            return response;
          },
          3,
          1500
        );

        const response = await result.response;
        const text = response.text();
        analysisResult = text;
        setResult(text);

        // Parse the result to get the JSON
        const parsedResult = formatVetAnalysisResult(text);

        // Convert media to base64 for Cloudinary upload
        let base64Media = null;
        try {
          base64Media = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              // Get base64 data including the MIME type prefix that Cloudinary needs
              const base64Data = reader.result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(media);
          });
        } catch (mediaErr) {
          console.warn("Error converting media to base64:", mediaErr);
          // Continue without the media data
        }

        // Save the analysis to Supabase with Cloudinary upload
        try {
          console.log("Saving vet analysis with media to Cloudinary + Supabase...");

          const { data: savedAnalysis, error: saveError } = await saveAnalysis(
            "vet",
            selectedPet.id,
            aiPrompt,
            parsedResult,
            base64Media
          );

          if (saveError) {
            console.error("Failed to save vet analysis:", saveError);
            console.log("Save error details:", JSON.stringify(saveError));

            // Show a toast but keep showing results
            toast.error(t("toast.analysisSaveError", { ns: "vet" }), {
              duration: 4000,
            });
          } else {
            saveSuccessful = true;
            console.log("Vet analysis saved successfully");
          }

          // Update local credits state
          setCredits((prev) => ({
            ...prev,
            vet_credits: prev.vet_credits - creditsRequired,
          }));
        } catch (error) {
          if (error.message?.includes("Failed to save analysis")) {
            // Analysis was successful but saving failed
            toast.error(t("toast.analysisSaveErrorShort", { ns: "vet" }));
          } else {
            // Analysis itself failed - error is already shown in UI
            console.error("Analysis error:", error);
          }
        } finally {
          setLoading(false);
        }

        // If analysis was successful, show a toast
        if (analysisResult && saveSuccessful) {
          toast.success(t("toast.analysisComplete", { ns: "vet" }), {
            icon: "🎉",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("API Error:", error);

        if (error.message?.includes("overloaded") || error.message?.includes("503")) {
          setError(t("analysis.modelOverloaded", { ns: "vet" }));
        } else if (error.message?.includes("quota")) {
          setError(t("analysis.quotaExceeded", { ns: "vet" }));
        } else {
          setError(t("errors.networkError", { ns: "vet" }));
        }

        let errorMessage = t("analysis.error", { ns: "vet" });
        if (error.message?.includes("overloaded") || error.message?.includes("503")) {
          errorMessage = t("analysis.modelOverloaded", { ns: "vet" });
        } else if (error.message?.includes("quota")) {
          errorMessage = t("analysis.quotaExceeded", { ns: "vet" });
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error);

      let errorMessage = t("analysis.error", { ns: "vet" });
      if (error.message?.includes("Too many parts")) {
        errorMessage = t("errors.imageTooLarge", { ns: "vet" });
      } else if (error.message?.includes("Unsupported content type")) {
        errorMessage = t("errors.unsupportedFormat", { ns: "vet" });
      } else if (error.message?.includes("network")) {
        errorMessage = t("errors.networkError", { ns: "vet" });
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Renderizarea rezultatelor în stilul demo-ului
  const renderVetResults = () => {
    if (!formattedResult) {
      return null;
    }

    const { possibleConditions, recommendations, urgencyLevel, additionalObservations } =
      formattedResult;

    // Determinați titlul și stilul pentru header în funcție de nivelul de urgență
    let headerTitle = t("results.title", { ns: "vet" });
    let urgencyTagClass = styles.confidenceTag;
    let urgencyText = t("results.urgencyLevel.low", { ns: "vet" });
    let iconSrc =
      "https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905477/animalspeak/icons/icon19_acavdi.png";
    let urgencyStyle = {};

    if (urgencyLevel === "high") {
      urgencyTagClass = styles.warningTag;
      urgencyText = t("results.urgencyLevel.high", { ns: "vet" });
      iconSrc =
        "https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905474/animalspeak/icons/icon12_c9fpbp.png";
      urgencyStyle = { backgroundColor: "#fff1f0", color: "#cf1322" };
    } else if (urgencyLevel === "medium") {
      urgencyTagClass = styles.mediumUrgencyTag;
      urgencyText = t("results.urgencyLevel.medium", { ns: "vet" });
      iconSrc =
        "https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905478/animalspeak/icons/icon20_cmgvpi.png";
      urgencyStyle = { backgroundColor: "#fff2e8", color: "#d4380d" };
    } else if (urgencyLevel === "low") {
      urgencyStyle = { backgroundColor: "#e6f7ff", color: "#1890ff" };
    }

    // Culoarea de border pentru condiții
    let conditionBorderColor = "#52c41a"; // Default pentru urgență scăzută
    let conditionBgColor = "#f6ffed";

    if (urgencyLevel === "high") {
      conditionBorderColor = "#ff7875";
      conditionBgColor = "#fff1f0";
    } else if (urgencyLevel === "medium") {
      conditionBorderColor = "#ffbb96";
      conditionBgColor = "#fff7e6";
    }

    return (
      <>
        <div className={styles.resultHeader}>
          <h3>{headerTitle}</h3>
          <div className={urgencyTagClass} style={urgencyStyle}>
            <Image
              src={iconSrc}
              alt={t("altText.urgencyIcon", { ns: "vet" })}
              width={24}
              height={24}
              style={{ marginRight: "6px" }}
            />
            <span>
              {t("results.urgencyLevel.title", { ns: "vet" })}: {urgencyText}
            </span>
          </div>
        </div>

        {possibleConditions && possibleConditions.length > 0 && (
          <div className={styles.vetResults}>
            <h4>{t("results.possibleConditions", { ns: "vet" })}</h4>
            {possibleConditions.map((condition, index) => (
              <div
                key={index}
                className={styles.conditionItem}
                style={{ borderColor: conditionBorderColor, backgroundColor: conditionBgColor }}
              >
                <div className={styles.behaviorHeader}>
                  <span
                    className={styles.behaviorName}
                    style={{
                      color:
                        urgencyLevel === "high"
                          ? "#cf1322"
                          : urgencyLevel === "medium"
                            ? "#d4380d"
                            : "#155724",
                    }}
                  >
                    <Image
                      src={`https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905472/animalspeak/icons/icon${(() => {
                        const medicalIcons = [
                          "20_cmgvpi",
                          "21_lxcfyx",
                          "14_e6cqhm",
                          "15_lqogrn",
                          "12_c9fpbp",
                          "13_g42n4n",
                        ];
                        return medicalIcons[index % medicalIcons.length];
                      })()}.png`}
                      alt={t("altText.healthIcon", { ns: "vet" })}
                      width={24}
                      height={24}
                      style={{ marginRight: "6px" }}
                    />
                    {condition.name}
                  </span>
                  <span className={styles.confidence}>
                    {formatConfidence(condition.confidence)}
                  </span>
                </div>
                <p
                  style={{
                    color:
                      urgencyLevel === "high"
                        ? "#cf1322"
                        : urgencyLevel === "medium"
                          ? "#d4380d"
                          : "#155724",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                  }}
                >
                  {condition.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div
            className={styles.recommendationsSection}
            style={{
              borderColor:
                urgencyLevel === "high"
                  ? "#ff7875"
                  : urgencyLevel === "medium"
                    ? "#ffbb96"
                    : "#91caff",
              backgroundColor:
                urgencyLevel === "high"
                  ? "#fff1f0"
                  : urgencyLevel === "medium"
                    ? "#fff7e6"
                    : "#e6f4ff",
            }}
          >
            <h4
              style={{
                color:
                  urgencyLevel === "high"
                    ? "#cf1322"
                    : urgencyLevel === "medium"
                      ? "#d4380d"
                      : "#0958d9",
              }}
            >
              <Image
                src="https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905472/animalspeak/icons/icon4_sfqumr.png"
                alt={t("altText.vetIcon", { ns: "vet" })}
                width={24}
                height={24}
                style={{ marginRight: "6px" }}
              />
              <span>{t("results.recommendations", { ns: "vet" })}</span>
            </h4>
            <ul
              style={{
                color:
                  urgencyLevel === "high"
                    ? "#cf1322"
                    : urgencyLevel === "medium"
                      ? "#d4380d"
                      : "#0958d9",
              }}
            >
              {recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}

        {additionalObservations && (
          <div className={styles.observationsCard}>
            <h4>
              <Image
                src="https://res.cloudinary.com/dsqwnuyiw/image/upload/v1746905472/animalspeak/icons/icon8_qwdvae.png"
                alt={t("altText.vetIcon", { ns: "vet" })}
                width={24}
                height={24}
                style={{ marginRight: "6px" }}
              />
              {t("results.additionalObservations", { ns: "vet" })}
            </h4>
            <p>{additionalObservations}</p>
          </div>
        )}
      </>
    );
  };

  // Resetare media
  const resetMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMedia(null);
    setMediaPreview(null);
    setResult(null);
    setFormattedResult(null);
    setError(null);
  };

  // Add a function to handle the pet creation
  const handleCreatePet = (newPet) => {
    setPets([...pets, newPet]);
    setSelectedPet(newPet);
    setShowCreatePetModal(false);
    toast.success(t("petComponents.createPet.messages.petCreatedSuccess"));
  };

  return (
    <div className={styles.appHomeContainer}>
      <div className={styles.analyzeHeader}>
        <button className={styles.backButton} onClick={handleBackClick}>
          <BsArrowLeft /> {t("header.back", { ns: "vet" })}
        </button>
        <h1>{t("header.title", { ns: "vet" })}</h1>
        <p>{t("header.description", { ns: "vet" })}</p>
      </div>

      {!result && (
        <>
          {/* Pet Selection - Only show when starting a new analysis */}
          <div className={styles.selectPetContainer}>
            <div className={styles.selectPetHeader}>
              <h3>{t("selectPet", { ns: "vet" })}</h3>
              {credits && (
                <div className={styles.creditsContainer}>
                  <div className={styles.creditsInfo}>
                    <BsLightningFill className={styles.creditsIcon} />
                    <span className={styles.creditsText}>
                      {t("creditsRemaining", {
                        ns: "vet",
                        count: credits.vet_credits || 0,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* No pets message and Create Pet button */}
            {pets.length === 0 ? (
              <div className={styles.noPetsMessage}>
                <h3>{t("noPetsYet", { ns: "vet" })}</h3>
                <p>{t("addPetPrompt", { ns: "vet" })}</p>
                <button
                  className={styles.createPetButton}
                  onClick={() => setShowCreatePetModal(true)}
                >
                  <FaPlusCircle /> {t("createPet", { ns: "vet" })}
                </button>
              </div>
            ) : (
              <div className={styles.petSelectionList}>
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className={`${styles.petOption} ${
                      selectedPet?.id === pet.id ? styles.petOptionSelected : ""
                    }`}
                    onClick={() => setSelectedPet(pet)}
                  >
                    <div className={styles.petOptionImage}>
                      {pet.image_url ? (
                        <img src={pet.image_url} alt={pet.name} />
                      ) : (
                        <div className={styles.petPlaceholder}>{pet.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className={styles.petOptionName}>
                      <span>{pet.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credits Display */}
          {/* <div className={styles.creditsContainer}>
            <div className={styles.creditsInfo}>
              <BsStarFill className={styles.creditsIcon} />
              <span className={styles.creditsText}>
                {t("common.availableCredits", { ns: "vet" })}:
                <span className={styles.creditsHighlight}> {credits?.vet_credits || 0}</span>
              </span>
            </div>
            <button
              className={styles.getMoreCredits}
              onClick={() => router.push(`/${i18n.language}/app/profile/buy-more-credits`)}
            >
              {t("common.getMoreCredits", { ns: "vet" })}
            </button>
          </div> */}
        </>
      )}

      {/* Create Pet Modal */}
      {showCreatePetModal && (
        <CreatePet onClose={() => setShowCreatePetModal(false)} onSave={handleCreatePet} />
      )}

      {!selectedPet ? (
        <div className={styles.selectPetPrompt}>
          <p>{t("common.pleaseSelectPet", { ns: "vet" })}</p>
        </div>
      ) : !result && credits && credits.vet_credits <= 0 ? (
        <div className={styles.noCreditsMessage}>
          <div className={styles.noCreditsContent}>
            <BsLightningFill className={styles.noCreditsIcon} />
            <h3>{t("common.noCreditsTitle", { ns: "vet" })}</h3>
            <p>{t("common.noCreditsMessage", { ns: "vet" })}</p>
            <button
              className={styles.buyCreditsButton}
              onClick={() => router.push(`/${i18n.language}/app/profile/buy-more-credits`)}
            >
              {t("common.buyMoreCredits", { ns: "vet" })}
            </button>
          </div>
        </div>
      ) : !mediaPreview ? (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragActive : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragLeave}
        >
          <div className={styles.uploadIconLarge}>
            <BsUpload />
          </div>
          <h3>{t("upload.dragDrop", { ns: "vet" })}</h3>
          <p>{t("upload.or", { ns: "vet" })}</p>

          <div className={styles.uploadButtons}>
            {/* New Buttons */}
            <button
              className={`${styles.uploadButton} ${styles.galleryButton}`}
              onClick={handleGalleryClick}
              type="button"
            >
              <BsImages />
              {t("upload.galleryButton", { ns: "vet" })}
            </button>
            <button
              className={`${styles.uploadButton} ${styles.cameraButton}`}
              onClick={handleCameraClick}
              type="button"
            >
              <BsCamera />
              {t("upload.cameraButton", { ns: "vet" })}
            </button>

            {/* Hidden inputs - ensure they accept both image and video */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className={styles.hiddenInput}
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              capture="environment"
              className={styles.hiddenInput}
            />
            {/* videoInputRef might be redundant if cameraInputRef handles video capture */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className={styles.hiddenInput}
            />
          </div>

          <p className={styles.supportedFormats}>
            {t("upload.supportedFormatsUpdated", { ns: "vet" })}
          </p>
        </div>
      ) : (
        <div className={styles.resultContainer}>
          <div className={styles.mediaPreviewContainer}>
            <div className={styles.fileTypeIndicator}>
              {mediaType === "image" ? (
                <span className={styles.imageType}>
                  <BsImage /> {t("mediaType.image", { ns: "vet" })}
                </span>
              ) : (
                <span className={styles.videoType}>
                  <BsFilm /> {t("mediaType.video", { ns: "vet" })}
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              {mediaType === "image" ? (
                <img src={mediaPreview} alt="Pet" className={styles.imagePreview} />
              ) : (
                <>
                  <video
                    src={mediaPreview}
                    className={styles.videoPreview}
                    controls
                    playsInline
                    autoPlay={false}
                    muted
                    onError={(e) => {
                      console.error("Error loading video:", e);
                      setError(t("hardcoded.videoLoadError", { ns: "vet" }));
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#888",
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {i18n.language.startsWith("ro") ? "1 video = 2 credite" : "1 video = 2 credits"}
                  </div>
                </>
              )}

              {loading && (
                <div className={styles.scanOverlay}>
                  <div className={styles.scanGrid}></div>
                  <div className={styles.scanLine}></div>
                  <div className={styles.scanParticles}>
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={styles.particle}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className={styles.scannerFrame}>
                    <div className={styles.cornerTL}></div>
                    <div className={styles.cornerTR}></div>
                    <div className={styles.cornerBL}></div>
                    <div className={styles.cornerBR}></div>
                  </div>
                  <div className={styles.scanText}>
                    <BsLightningFill className={styles.scanIcon} />
                    <p>{t("analysis.loading", { ns: "vet" })}</p>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className={`${styles.changeMediaButton} ${styles.modernButton}`}
              onClick={resetMedia}
            >
              {t("buttons.changeFile", { ns: "vet" })}
            </button>
          </div>

          {!result && !loading && (
            <>
              <button
                className={`${styles.analyzeButton} ${styles.modernButton}`}
                onClick={analyzeMedia}
                disabled={loading || (mediaType === "video" && credits && credits.vet_credits < 2)}
              >
                {t("buttons.analyzeHealth", { ns: "vet" })}
              </button>
              {mediaType === "video" && credits && credits.vet_credits < 2 && (
                <div
                  style={{
                    color: "#e74c3c",
                    fontSize: "0.95rem",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {i18n.language.startsWith("ro")
                    ? "Ai nevoie de 2 credite pentru a analiza un video."
                    : "You need 2 credits to analyze a video."}
                </div>
              )}
            </>
          )}

          {loading && (
            <div className={styles.loadingContainer} style={{ visibility: "hidden" }}>
              <div className={styles.spinner}></div>
              <p>{t("analysis.loading", { ns: "vet" })}</p>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          {result && <div className={styles.analysisResult}>{renderVetResults()}</div>}
        </div>
      )}

      <section className={styles.analysisTips}>
        <h3>{t("tips.title", { ns: "vet" })}</h3>
        <ul className={styles.tipsList}>
          <li>{t("tips.list.0", { ns: "vet" })}</li>
          <li>{t("tips.list.1", { ns: "vet" })}</li>
          <li>{t("tips.list.2", { ns: "vet" })}</li>
        </ul>
      </section>
    </div>
  );
}
