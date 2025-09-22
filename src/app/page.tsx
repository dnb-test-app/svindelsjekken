"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Textarea, Logo, Dropdown, Badge, P, ProgressIndicator, Input } from "@dnb/eufemia";
import ContextRefinement from "@/components/ContextRefinement";
import Stepper, { useStepperState } from "@/components/Stepper";
import AnalysisStep from "@/components/AnalysisStep";
import ResultsStep from "@/components/ResultsStep";
import { isMinimalContextURL } from "@/lib/urlAnalyzer";
import {
  needsWebSearchVerification,
  getWebSearchReasons,
} from "@/lib/fraudDetection";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [defaultModel, setDefaultModel] = useState("openai/gpt-4o-mini");
  const [hasUserSelectedModel, setHasUserSelectedModel] = useState(false);
  const [pendingModel, setPendingModel] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Stepper states
  const stepperState = useStepperState();
  const [preliminaryAnalysis, setPreliminaryAnalysis] = useState<any>(null);
  const [requiresRefinement, setRequiresRefinement] = useState(false);

  // Dynamic models state
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsFetched, setModelsFetched] = useState(false);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [modelTestResults, setModelTestResults] = useState<Record<string, any>>(
    {},
  );
  const [batchTesting, setBatchTesting] = useState(false);
  const [modelFilter, setModelFilter] = useState("");

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL detection states
  const [urlDetected, setUrlDetected] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  // Web verification states
  const [isWebVerifying, setIsWebVerifying] = useState(false);

  // Load saved model preference and test results
  useEffect(() => {
    // Load test results from localStorage
    const savedTestResults = localStorage.getItem("modelTestResults");
    if (savedTestResults) {
      try {
        setModelTestResults(JSON.parse(savedTestResults));
      } catch (e) {
        console.error("Failed to parse saved test results");
      }
    }

    fetch("/api/analyze-advanced")
      .then((res) => res.json())
      .then((data) => {
        const apiDefaultModel = data.defaultModel || "openai/gpt-4o-mini";
        setDefaultModel(apiDefaultModel);

        const saved = localStorage.getItem("selectedAIModel");
        const selectedModelId = saved || apiDefaultModel;
        setSelectedModel(selectedModelId);
        setHasUserSelectedModel(saved !== null && saved !== apiDefaultModel);
      })
      .catch(() => {
        // Fallback if API fails
        const fallbackDefault = "openai/gpt-4o-mini";
        setDefaultModel(fallbackDefault);

        const saved = localStorage.getItem("selectedAIModel");
        const selectedModelId = saved || fallbackDefault;
        setSelectedModel(selectedModelId);
        setHasUserSelectedModel(saved !== null && saved !== fallbackDefault);
      });
  }, []);

  // Fetch available models from API (with optional fresh fetch)
  const fetchAvailableModels = useCallback(
    async (forceFresh = false) => {
      if (!forceFresh && modelsFetched) return;
      if (isLoadingModels) return;

      setIsLoadingModels(true);
      try {
        const url = forceFresh
          ? "/api/fetch-models?fresh=true"
          : "/api/fetch-models";
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log(
            `Fetched ${data.totalModels} models (${data.verifiedCount} verified)`,
          );

          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
            setModelsFetched(true);

            // Store in localStorage for quick loading
            localStorage.setItem(
              "cachedModels",
              JSON.stringify({
                timestamp: data.timestamp,
                models: data.models,
              }),
            );

            // If current model isn't in the list, switch to recommended
            const currentModelAvailable = data.models.some(
              (m: any) => m.id === selectedModel,
            );
            if (!currentModelAvailable && data.recommended) {
              setSelectedModel(data.recommended.id);
              localStorage.setItem("selectedAIModel", data.recommended.id);
            }
          }
        } else {
          console.error("Failed to fetch models:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    },
    [modelsFetched, isLoadingModels, selectedModel],
  );

  // Easter egg: Check for "RaiRai" in text
  useEffect(() => {
    if (text.toLowerCase().includes("rairai") && !showModelSelector) {
      setShowModelSelector(true);
      fetchAvailableModels(); // Fetch models when admin mode is activated
    }
  }, [text, showModelSelector, fetchAvailableModels]);

  // URL detection: Check if input contains URLs with minimal context
  useEffect(() => {
    const hasMinimalContextURL = isMinimalContextURL(text.trim());
    setUrlDetected(hasMinimalContextURL);
  }, [text]);

  // Compress image for better upload reliability (especially for iPhone)
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Detect HEIC/HEIF format (common in fresh iPhone screenshots)
      const isHEIC =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      // If HEIC or already small enough (under 2MB), don't compress
      if (isHEIC || file.size < 2 * 1024 * 1024) {
        console.log(
          `Skipping compression: ${isHEIC ? "HEIC format" : "File already small"} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
        resolve(file);
        return;
      }

      // Set a timeout to fallback to original if compression takes too long
      const compressionTimeout = setTimeout(() => {
        console.warn("Image compression timeout - using original file");
        resolve(file);
      }, 10000); // 10 second timeout

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // Handle image load errors (common with unsupported formats)
      img.onerror = (error) => {
        clearTimeout(compressionTimeout);
        console.warn("Image load failed, using original file:", error);
        resolve(file); // Return original file on error
      };

      img.onload = () => {
        clearTimeout(compressionTimeout);

        try {
          // Calculate new dimensions (max 1920px width)
          const maxWidth = 1920;
          const maxHeight = 1080;
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          if (!ctx) {
            console.warn("Canvas context not available, using original file");
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.(heic|heif)$/i, ".jpg"),
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  },
                );
                console.log(
                  `Compression successful: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
                );
                resolve(compressedFile);
              } else {
                console.log("Compressed file not smaller, using original");
                resolve(file); // Use original if compression didn't help
              }
            },
            "image/jpeg",
            0.85, // 85% quality for better balance
          );
        } catch (error) {
          console.error("Canvas processing error:", error);
          resolve(file); // Fallback to original on any error
        }
      };

      // Create object URL and clean up after use
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Clean up object URL after image loads or errors
      img.addEventListener("load", () => URL.revokeObjectURL(objectUrl), {
        once: true,
      });
      img.addEventListener("error", () => URL.revokeObjectURL(objectUrl), {
        once: true,
      });
    });
  }, []);

  // Process uploaded file
  const processFile = useCallback(
    async (file: File) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Filen er for stor. Maksimal størrelse er 10MB.");
        return;
      }

      setIsProcessingImage(true);
      setOcrProgress(0);

      // Smooth continuous progress animation (no jumps)
      let progressAnimation: NodeJS.Timeout | null = null;
      let currentProgress = 0;
      let targetProgress = 10; // Start with a low target

      const animateProgress = () => {
        progressAnimation = setInterval(() => {
          if (currentProgress < targetProgress) {
            currentProgress += Math.random() * 1.5 + 0.5; // Smaller, smoother increments
            if (currentProgress > targetProgress)
              currentProgress = targetProgress;
            setOcrProgress(Math.floor(currentProgress));
          }
        }, 150);
      };

      const updateTarget = (newTarget: number) => {
        targetProgress = newTarget;
      };

      const stopProgress = () => {
        if (progressAnimation) {
          clearInterval(progressAnimation);
          progressAnimation = null;
        }
      };

      animateProgress();

      // Show preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      try {
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          // Compress image if it's an image file (helps with iPhone uploads)
          let fileToUpload = file;
          if (
            file.type.startsWith("image/") ||
            file.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|webp)$/)
          ) {
            updateTarget(25); // Compression phase
            console.log(
              `Original file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
            );

            try {
              fileToUpload = await compressImage(file);
              console.log(
                `Final file for upload: ${fileToUpload.name}, type: ${fileToUpload.type}, size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`,
              );
            } catch (error) {
              console.warn(
                "Image compression failed, using original file:",
                error,
              );
              fileToUpload = file; // Use original file if compression fails
            }
          }

          // Prepare form data
          updateTarget(35); // Preparing upload
          const formData = new FormData();
          formData.append("image", fileToUpload);
          formData.append("model", selectedModel);

          updateTarget(50); // About to send request

          // Send to API for OCR and analysis
          updateTarget(70); // Uploading
          const response = await fetch("/api/analyze-image", {
            method: "POST",
            body: formData,
          });

          updateTarget(85); // Processing response

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Upload error:", response.status, errorText);

            if (response.status === 413) {
              throw new Error(
                "Bildet er for stort å laste opp. Prøv et mindre bilde eller ta et nytt bilde med lavere oppløsning.",
              );
            } else if (response.status === 429) {
              throw new Error(
                "For mange forespørsler. Vent et øyeblikk og prøv igjen.",
              );
            } else if (response.status >= 500) {
              throw new Error("Server-feil. Prøv igjen om litt.");
            } else {
              throw new Error(`Upload feilet: ${errorText || "Ukjent feil"}`);
            }
          }

          const result = await response.json();
          updateTarget(95); // Almost done

          // Final completion
          setTimeout(() => {
            updateTarget(100);
            setTimeout(() => {
              currentProgress = 100;
              setOcrProgress(100);
            }, 300);
          }, 200);

          if (result.extractedText) {
            // If API already provided analysis, use it
            if (result.fraudProbability !== undefined) {
              const analysisResult = {
                category: result.category || "safe",
                score: result.fraudProbability,
                risk: result.riskLevel || "low",
                triggers:
                  result.mainIndicators?.map((ind: string) => ({
                    pattern: ind,
                    category: "api_detected",
                    weight: 10,
                  })) || [],
                categories: ["api_analysis"],
                aiEnhanced: true,
                recommendation: result.recommendation,
                summary: result.summary,
                isImageAnalysis: true, // Mark this as image analysis
                extractedText: result.extractedText, // Store but don't show in input
                urlsFound: result.urlsFound || [], // URLs found in the image
                webSearchResults: result.webSearchResults || {}, // Web search findings
                educationalContext: result.educationalContext || null,
                verificationGuide: result.verificationGuide || null,
                actionableSteps: result.actionableSteps || [],
              };

              setResult(analysisResult);
              setRequiresRefinement(false);
              stepperState.markStepCompleted(1);
              stepperState.markStepCompleted(2);
              stepperState.goToStep(3);
            } else {
              // No analysis available - NEVER mark as safe!
              setResult({
                category: "error",
                score: 50,
                risk: "medium",
                triggers: [
                  {
                    pattern: "Analyse ikke tilgjengelig",
                    category: "technical_error",
                    weight: 50,
                  },
                ],
                categories: ["error"],
                recommendation:
                  "Analyse ikke tilgjengelig. Vær forsiktig og kontakt DNB på 915 04800 ved tvil.",
                summary:
                  "Tekst ekstrahert men analyse feilet - vær ekstra forsiktig",
                isImageAnalysis: true,
                extractedText: result.extractedText,
              });
            }
          } else if (result.error) {
            throw new Error(result.error);
          }
        }
      } catch (error: any) {
        // Stop progress animation on error
        stopProgress();
        console.error("Feil ved prosessering av fil:", error);

        let errorMessage = "Kunne ikke prosessere filen";

        if (error.message) {
          errorMessage = error.message;
        } else if (error.name === "NetworkError") {
          errorMessage = "Nettverksfeil. Sjekk internettforbindelsen din.";
        } else if (
          error.name === "TypeError" &&
          error.message.includes("fetch")
        ) {
          errorMessage = "Kan ikke koble til server. Prøv igjen senere.";
        }

        // Show error with helpful guidance
        alert(
          `⚠️ ${errorMessage}\n\n💡 Tips for iPhone-brukere:\n• Ta bilder i normal oppløsning (ikke 4K)\n• Bruk JPEG-format hvis mulig\n• Prøv å ta et nytt, mindre bilde`,
        );
      } finally {
        // Clean up progress animation
        stopProgress();
        setTimeout(() => {
          setIsProcessingImage(false);
          setOcrProgress(0);
        }, 500); // Small delay to show 100% completion
      }
    },
    [selectedModel, compressImage, stepperState],
  );

  // Simplified file processing that just stores the file and preview
  const storeFile = useCallback(async (file: File) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Filen er for stor. Maksimal størrelse er 10MB.");
      return;
    }

    // Store the file for later analysis
    setUploadedFile(file);

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  // Process file with additional text context
  const processFileWithContext = useCallback(async (file: File, additionalText: string) => {
    setIsProcessingImage(true);
    setOcrProgress(0);

    // Smooth continuous progress animation
    let progressAnimation: NodeJS.Timeout | null = null;
    let currentProgress = 0;
    let targetProgress = 10;

    const animateProgress = () => {
      progressAnimation = setInterval(() => {
        if (currentProgress < targetProgress) {
          currentProgress += Math.random() * 1.5 + 0.5;
          if (currentProgress > targetProgress) currentProgress = targetProgress;
          setOcrProgress(Math.floor(currentProgress));
        }
      }, 150);
    };

    const updateTarget = (newTarget: number) => {
      targetProgress = newTarget;
    };

    const stopProgress = () => {
      if (progressAnimation) {
        clearInterval(progressAnimation);
        progressAnimation = null;
      }
    };

    animateProgress();

    try {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        // Compress image if needed
        let fileToUpload = file;
        if (file.type.startsWith("image/") || file.name.toLowerCase().match(/\.(heic|heif|jpg|jpeg|png|webp)$/)) {
          updateTarget(25);
          try {
            fileToUpload = await compressImage(file);
          } catch (error) {
            console.warn("Image compression failed, using original file:", error);
            fileToUpload = file;
          }
        }

        // Prepare form data
        updateTarget(35);
        const formData = new FormData();
        formData.append("image", fileToUpload);
        formData.append("model", selectedModel);

        // Add additional text context if provided
        if (additionalText.trim()) {
          formData.append("additionalContext", additionalText.trim());
        }

        updateTarget(50);

        // Send to API for OCR and analysis
        updateTarget(70);
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          body: formData,
        });

        updateTarget(85);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload error:", response.status, errorText);
          throw new Error(`Upload feilet: ${errorText || "Ukjent feil"}`);
        }

        const result = await response.json();
        updateTarget(95);

        // Final completion
        setTimeout(() => {
          updateTarget(100);
          setTimeout(() => {
            currentProgress = 100;
            setOcrProgress(100);
          }, 300);
        }, 200);

        if (result.extractedText) {
          // If API already provided analysis, use it
          if (result.fraudProbability !== undefined) {
            const analysisResult = {
              category: result.category || "safe",
              score: result.fraudProbability,
              risk: result.riskLevel || "low",
              triggers: result.mainIndicators?.map((ind: string) => ({
                pattern: ind,
                category: "api_detected",
                weight: 10,
              })) || [],
              categories: ["api_analysis"],
              aiEnhanced: true,
              recommendation: result.recommendation,
              summary: result.summary,
              isImageAnalysis: true,
              extractedText: result.extractedText,
              additionalContext: additionalText,
              urlsFound: result.urlsFound || [],
              webSearchResults: result.webSearchResults || {},
            };

            // Check if follow-up questions exist
            if (result.followUpQuestions && result.followUpQuestions.length > 0) {
              setPreliminaryAnalysis(analysisResult);
              setRequiresRefinement(true);
              stepperState.markStepCompleted(1);
              stepperState.goToStep(2);
            } else {
              setResult(analysisResult);
              setRequiresRefinement(false);
              stepperState.markStepCompleted(1);
              stepperState.markStepCompleted(2);
              stepperState.goToStep(3);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Image processing failed:", error);
      alert(`Feil ved bildeprosessering: ${error.message}`);
    } finally {
      stopProgress();
      setTimeout(() => {
        setIsProcessingImage(false);
        setOcrProgress(0);
        setIsAnalyzing(false);
      }, 500);
    }
  }, [selectedModel, compressImage, stepperState]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      storeFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      storeFile(file);
    }
  };

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          storeFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, [storeFile]);

  // Global paste handler for document
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            storeFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [storeFile]);

  // Handle removing uploaded image and file
  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedFile(null);
  };

  const handleCheck = async () => {
    if (text.trim().length < 5 && !imagePreview && !uploadedFile) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);
    setResult(null); // Clear previous results

    // If we have an uploaded file, analyze it with any additional text context
    if (uploadedFile) {
      await processFileWithContext(uploadedFile, text.trim());
      return;
    }

    // Clean text for API
    const cleanedText = text.replace(/rairai/gi, "").trim();

    // Check if we need web verification
    const needsWebVerification = needsWebSearchVerification(cleanedText);
    const webReasons = needsWebVerification
      ? getWebSearchReasons(cleanedText)
      : [];

    if (needsWebVerification) {
      console.log("Web verification needed:", webReasons);
      setIsWebVerifying(true);
    }

    // Try AI analysis first if text is long enough
    if (cleanedText.length >= 5) {
      try {
        const modelToUse =
          typeof selectedModel === "string" ? selectedModel : defaultModel;

        // Prepare context object for URLs with additional context
        const contextData =
          urlDetected && additionalContext.trim()
            ? {
                additionalContext: additionalContext.trim(),
              }
            : undefined;

        const response = await fetch("/api/analyze-advanced", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanedText,
            model: modelToUse,
            context: contextData,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);

          // Check if it's a rate limit error
          let errorMessage = "AI-analyse utilgjengelig.";
          let recommendation = "Analyse utilgjengelig - vær ekstra forsiktig";
          let summary =
            "Kunne ikke analysere innholdet på grunn av tekniske problemer";

          if (response.status === 429) {
            errorMessage =
              "For mange forespørsler. Vennligst vent et øyeblikk og prøv igjen.";
            recommendation =
              "Vent og prøv igjen - vær ekstra forsiktig i mellomtiden";
            summary = "Midlertidig utilgjengelig på grunn av høy trafikk";
          }

          // AI failed, use error category to warn user
          setResult({
            category: "error",
            score: 0,
            risk: "unknown",
            triggers: [],
            categories: [],
            fallbackMode: true,
            recommendation: recommendation,
            summary: summary,
            retryable: response.status === 429,
          });
          setAiAnalysis({
            error: errorMessage,
          });
        } else {
          const aiResult = await response.json();
          setAiAnalysis(aiResult);

          // Use AI-based risk assessment with categories
          const analysisResult = {
            category: aiResult.category || "safe",
            score: aiResult.fraudProbability || 0,
            risk: aiResult.riskLevel || "low",
            triggers:
              aiResult.mainIndicators?.map((ind: string) => ({
                pattern: ind,
                category: "ai_detected",
                weight: 10,
              })) || [],
            categories: ["ai_analysis"],
            aiEnhanced: true,
            recommendation: aiResult.recommendation,
            summary: aiResult.summary,
            educationalContext: aiResult.educationalContext || null,
            verificationGuide: aiResult.verificationGuide || null,
            actionableSteps: aiResult.actionableSteps || [],
          };

          // Check if follow-up questions exist
          if (
            aiResult.followUpQuestions &&
            aiResult.followUpQuestions.length > 0
          ) {
            // Store preliminary analysis and advance to Step 2
            setPreliminaryAnalysis(analysisResult);
            setRequiresRefinement(true);
            stepperState.markStepCompleted(1);
            stepperState.goToStep(2);
          } else {
            // No follow-up questions needed, go directly to Step 3
            setResult(analysisResult);
            setRequiresRefinement(false);
            stepperState.markStepCompleted(1);
            stepperState.markStepCompleted(2);
            stepperState.goToStep(3);
          }
        }
      } catch (error: any) {
        console.error("AI analysis failed:", error);

        // AI failed, use error category to warn user
        setResult({
          category: "error",
          score: 0,
          risk: "unknown",
          triggers: [],
          categories: [],
          fallbackMode: true,
          recommendation: "Analyse feilet - vær ekstra forsiktig",
          summary:
            "Kunne ikke analysere innholdet på grunn av tekniske problemer",
        });
        setAiAnalysis({
          error: "AI-analyse feilet.",
        });
      }
    } else {
      // NEVER fallback to 'safe' - if text is too short, it's an error state
      setResult({
        category: "error",
        score: 50, // Default to medium risk, not safe
        risk: "medium",
        triggers: ["Tekst for kort"],
        categories: ["Utilstrekkelig input"],
        fallbackMode: true,
        recommendation: "Tekst for kort for pålitelig analyse - vær forsiktig",
        summary: "Minimum 5 tegn kreves for sikker analyse",
      });
    }

    setIsAnalyzing(false);
    setIsWebVerifying(false);
  };

  // Reset all states for new analysis
  const handleNewAnalysis = () => {
    setText("");
    setResult(null);
    setAiAnalysis(null);
    setImagePreview(null);
    setOcrProgress(0);
    setUrlDetected(false);
    setAdditionalContext("");
    setIsWebVerifying(false);
    setPreliminaryAnalysis(null);
    setRequiresRefinement(false);
    stepperState.setCurrentStep(1);
    stepperState.markStepIncomplete(1);
    stepperState.markStepIncomplete(2);
    stepperState.markStepIncomplete(3);
  };

  const handleRefineAnalysis = async (
    questionAnswers: Record<string, "yes" | "no">,
    refinementContext: string,
  ) => {
    if (!text || text.trim().length < 5) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Immediately advance to Step 3 to show loading state
    stepperState.markStepCompleted(2);
    stepperState.goToStep(3);

    // Clean text for API
    const cleanedText = text.replace(/rairai/gi, "").trim();

    try {
      const modelToUse =
        typeof selectedModel === "string" ? selectedModel : defaultModel;

      // Combine URL context with refinement context
      let combinedContext = refinementContext;
      if (urlDetected && additionalContext.trim()) {
        combinedContext = `Kontekst for lenke: ${additionalContext.trim()}\n\nYtterligere informasjon: ${refinementContext}`;
      }

      const response = await fetch("/api/analyze-advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedText,
          model: modelToUse,
          context: {
            questionAnswers,
            additionalContext: combinedContext,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Refined analysis API error:", errorText);

        // Handle error similar to original handleCheck
        let errorMessage = "AI-analyse utilgjengelig.";
        let recommendation = "Analyse utilgjengelig - vær ekstra forsiktig";
        let summary =
          "Kunne ikke analysere innholdet på grunn av tekniske problemer";

        if (response.status === 429) {
          errorMessage =
            "For mange forespørsler. Vennligst vent et øyeblikk og prøv igjen.";
          recommendation =
            "Vent og prøv igjen - vær ekstra forsiktig i mellomtiden";
          summary = "Midlertidig utilgjengelig på grunn av høy trafikk";
        }

        setResult({
          category: "error",
          score: 0,
          risk: "unknown",
          triggers: [],
          categories: [],
          fallbackMode: true,
          recommendation: recommendation,
          summary: summary,
          retryable: response.status === 429,
        });
        setAiAnalysis({
          error: errorMessage,
        });
      } else {
        const aiResult = await response.json();
        setAiAnalysis(aiResult);

        // Update result with refined analysis
        const refinedResult = {
          category: aiResult.category || "safe",
          score: aiResult.fraudProbability || 0,
          risk: aiResult.riskLevel || "low",
          triggers:
            aiResult.mainIndicators?.map((ind: string) => ({
              pattern: ind,
              category: "ai_detected",
              weight: 10,
            })) || [],
          categories: ["ai_analysis"],
          aiEnhanced: true,
          recommendation: aiResult.recommendation,
          summary: aiResult.summary,
          refined: true, // Mark as refined analysis
          educationalContext: aiResult.educationalContext || null,
          verificationGuide: aiResult.verificationGuide || null,
          smartQuestions: aiResult.smartQuestions || [],
        };

        setResult(refinedResult);
        setRequiresRefinement(false);
        stepperState.markStepCompleted(3);
      }
    } catch (error: any) {
      console.error("Refined AI analysis failed:", error);

      setResult({
        category: "error",
        score: 0,
        risk: "unknown",
        triggers: [],
        categories: [],
        fallbackMode: true,
        recommendation: "Analyse feilet - vær ekstra forsiktig",
        summary:
          "Kunne ikke analysere innholdet på grunn av tekniske problemer",
      });
      setAiAnalysis({
        error: "AI-analyse feilet.",
      });
    }

    setIsAnalyzing(false);
    setIsWebVerifying(false);
  };

  const handleModelChange = (e: any) => {
    console.log("Dropdown change event:", e); // Debug logging

    // DNB Dropdown passes { data: { value, content, ... } }
    let model = null;

    if (typeof e === "string") {
      model = e;
    } else if (e?.data?.value) {
      model = e.data.value;
    } else if (e?.value) {
      model = e.value;
    }

    console.log("Extracted model:", model); // Debug logging
    console.log("Current selectedModel:", selectedModel); // Debug logging

    if (model && model !== selectedModel) {
      console.log("Setting pendingModel to:", model); // Debug logging
      setPendingModel(model);
    }
  };

  const handleSaveModel = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel);
      setHasUserSelectedModel(pendingModel !== defaultModel);
      localStorage.setItem("selectedAIModel", pendingModel);
      setPendingModel("");
    }
  };

  const handleCancelModel = () => {
    setPendingModel("");
  };

  // Test a specific model
  const testModel = async (modelId: string) => {
    setTestingModel(modelId);

    try {
      const response = await fetch("/api/test-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update test results
        const newResults = {
          ...modelTestResults,
          [modelId]: {
            working: result.working,
            supportsJson: result.supportsJson,
            error: result.error,
            errorType: result.errorType,
            testedAt: new Date().toISOString(),
            responseTime: result.responseTime,
          },
        };

        setModelTestResults(newResults);
        localStorage.setItem("modelTestResults", JSON.stringify(newResults));

        // Update available models with test result
        setAvailableModels((prev) =>
          prev.map((model) =>
            model.id === modelId
              ? {
                  ...model,
                  status: result.working ? "verified" : "failed",
                  working: result.working,
                  supportsJson: result.supportsJson,
                  lastTested: new Date().toISOString(),
                }
              : model,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to test model:", error);
    } finally {
      setTestingModel(null);
    }
  };

  // Test top models in batch
  const testTopModels = async () => {
    setBatchTesting(true);

    try {
      // Get top 50 untested or failed models
      const modelsToTest = availableModels
        .filter((m) => m.status === "untested" || m.status === "failed")
        .slice(0, 50)
        .map((m) => m.id);

      if (modelsToTest.length === 0) {
        alert("No models to test!");
        return;
      }

      const response = await fetch("/api/test-models-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelIds: modelsToTest,
          testDepth: "standard",
          maxConcurrent: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update test results for each model
        const newResults = { ...modelTestResults };
        data.results.forEach((result: any) => {
          newResults[result.modelId] = {
            working: result.working,
            supportsJson: result.supportsJson,
            errors: result.errors,
            accuracy: result.accuracy,
            responseTime: result.responseTime,
            testedAt: new Date().toISOString(),
          };
        });

        setModelTestResults(newResults);
        localStorage.setItem("modelTestResults", JSON.stringify(newResults));

        // Update available models with test results
        setAvailableModels((prev) =>
          prev.map((model) => {
            const testResult = data.results.find(
              (r: any) => r.modelId === model.id,
            );
            if (testResult) {
              return {
                ...model,
                status: testResult.working ? "verified" : "failed",
                working: testResult.working,
                supportsJson: testResult.supportsJson,
                accuracy: testResult.accuracy,
                lastTested: new Date().toISOString(),
              };
            }
            return model;
          }),
        );

        alert(
          `Tested ${data.statistics.totalTested} models:\n${data.statistics.working} working\n${data.statistics.withJsonSupport} with JSON support`,
        );
      }
    } catch (error) {
      console.error("Batch test failed:", error);
      alert("Batch testing failed!");
    } finally {
      setBatchTesting(false);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="tagline">T for Trygghet</span>
          <div>
            <Logo height="28" color="white" brand="ui" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">
          SVINDEL
          <br />
          SJEKKEN
          <span className="checkmark">✓</span>
        </h1>
        <div className="hero-message">
          <p>Vi stopper 9 av 10 svindelforsøk.</p>
          <p className="hero-message-bold">Sammen kan vi stoppe resten.</p>
        </div>
      </section>

      {/* Stepper */}
      <Stepper
        steps={[
          stepperState.createStep(1, "Analyser tekst", true),
          stepperState.createStep(2, "Tilpass analyse", requiresRefinement),
          stepperState.createStep(3, "Se resultat", true),
        ]}
        onStepClick={(stepId) => {
          if (stepId === 1 && stepperState.completedSteps.has(1)) {
            stepperState.goToStep(1);
          } else if (
            stepId === 2 &&
            requiresRefinement &&
            stepperState.completedSteps.has(1)
          ) {
            stepperState.goToStep(2);
          } else if (
            stepId === 3 &&
            stepperState.completedSteps.has(3)
          ) {
            stepperState.goToStep(3);
          }
        }}
      />

      {/* Main Content Section */}
      <main className="main">
        {/* Step 1: Analysis Input */}
        {stepperState.currentStep === 1 && (
          <div className="input-card">
            <AnalysisStep
              text={text}
              setText={setText}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleCheck}
              onImageUpload={handleFileChange}
              handlePaste={handlePaste}
              fileInputRef={fileInputRef}
              onRemoveImage={handleRemoveImage}
            />

            {/* Hidden Model Selector - Easter Egg */}
            {showModelSelector && (
              <div style={{
                marginTop: 'var(--spacing-small)',
                marginBottom: 'var(--spacing-small)'
              }}>
                {/* Admin Mode Indicator */}
                <div style={{
                  backgroundColor: 'var(--color-signal-orange)',
                  color: 'white',
                  padding: 'var(--spacing-x-small) var(--spacing-small)',
                  borderRadius: '4px',
                  marginBottom: 'var(--spacing-small)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  <span>
                    🔧 Admin Mode Active - Model: {selectedModel.split('/')[1] || selectedModel}
                  </span>
                  <Button
                    size="small"
                    variant="tertiary"
                    style={{ color: 'white', border: '1px solid white' }}
                    onClick={() => {
                      setShowModelSelector(false);
                      setSelectedModel(defaultModel);
                      setHasUserSelectedModel(false);
                      localStorage.removeItem('selectedAIModel');
                      setPendingModel('');
                      setText(''); // Clear the rairai text
                    }}
                  >
                    Exit Admin Mode
                  </Button>
                </div>

                {isLoadingModels ? (
                  <div style={{
                    padding: 'var(--spacing-medium)',
                    textAlign: 'center'
                  }}>
                    <P>Laster tilgjengelige modeller...</P>
                  </div>
                ) : availableModels.length > 0 ? (
                  <div style={{
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-black-20)',
                    borderRadius: '8px',
                    padding: 'var(--spacing-medium)',
                    marginBottom: 'var(--spacing-medium)'
                  }}>
                    <P style={{ marginBottom: 'var(--spacing-small)', fontWeight: 'bold' }}>
                      AI Model Selection ({availableModels.length} available):
                    </P>

                    {/* Search input */}
                    <div style={{ marginBottom: 'var(--spacing-small)' }}>
                      <Input
                        placeholder="Search models (e.g., gpt-4, claude, gemini)..."
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        size="medium"
                        icon="search"
                        icon_position="left"
                        style={{
                          width: '100%',
                          '--input-border-color': 'var(--color-sea-green-30)',
                          '--input-border-color-focus': 'var(--color-sea-green)',
                          '--input-border-width': '2px'
                        }}
                      />
                    </div>

                    {/* Current selection */}
                    <div style={{
                      marginBottom: 'var(--spacing-small)',
                      padding: 'var(--spacing-small)',
                      backgroundColor: 'var(--color-mint-green-12)',
                      borderRadius: '4px',
                      border: '1px solid var(--color-sea-green-30)'
                    }}>
                      <P size="small" style={{ margin: 0 }}>
                        <strong>Current:</strong> {(() => {
                          const current = availableModels.find(m => m.id === selectedModel);
                          return current ?
                            `${current.name || current.id.split('/')[1]} (${current.provider}) ${current.supportsJson ? '✅ JSON' : ''}`
                            : selectedModel;
                        })()}
                      </P>
                    </div>

                    {/* Model dropdown */}
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--color-black-20)',
                      borderRadius: '4px'
                    }}>
                      {availableModels
                        .filter(model =>
                          modelFilter === '' ||
                          model.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
                          model.name?.toLowerCase().includes(modelFilter.toLowerCase()) ||
                          model.provider?.toLowerCase().includes(modelFilter.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((model: any) => (
                        <div
                          key={model.id}
                          style={{
                            padding: 'var(--spacing-small)',
                            borderBottom: '1px solid var(--color-black-8)',
                            cursor: 'pointer',
                            backgroundColor: selectedModel === model.id ? 'var(--color-sea-green-8)' : 'transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setHasUserSelectedModel(true);
                            localStorage.setItem('selectedAIModel', model.id);
                          }}
                          onMouseEnter={(e) => {
                            if (selectedModel !== model.id) {
                              e.currentTarget.style.backgroundColor = 'var(--color-black-4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedModel !== model.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: selectedModel === model.id ? 'bold' : 'normal' }}>
                              {model.name || model.id.split('/')[1] || model.id}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-black-60)',
                              marginTop: '2px'
                            }}>
                              {model.provider} • {model.cost || 'unknown'} cost • {model.speed || 'unknown'} speed
                            </div>
                          </div>
                          <div style={{ fontSize: '0.75rem' }}>
                            {model.supportsJson && <span title="Supports JSON">✅</span>}
                            {model.status === 'verified' && <span title="Verified working"> ⚡</span>}
                            {selectedModel === model.id && <span style={{ color: 'var(--color-sea-green)' }}> ●</span>}
                          </div>
                        </div>
                      ))}

                      {availableModels.filter(model =>
                        modelFilter === '' ||
                        model.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
                        model.name?.toLowerCase().includes(modelFilter.toLowerCase()) ||
                        model.provider?.toLowerCase().includes(modelFilter.toLowerCase())
                      ).length > 50 && (
                        <div style={{
                          padding: 'var(--spacing-small)',
                          textAlign: 'center',
                          color: 'var(--color-black-60)',
                          fontSize: '0.875rem'
                        }}>
                          Showing first 50 results. Use search to narrow down.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: 'var(--spacing-medium)',
                    textAlign: 'center',
                    border: '1px solid var(--color-black-20)',
                    borderRadius: '8px'
                  }}>
                    <P>Ingen modeller tilgjengelig</P>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Context Refinement */}
        {stepperState.currentStep === 2 && requiresRefinement && (
          <div className="input-card">
            <div style={{
              marginBottom: 'var(--spacing-large)',
              textAlign: 'center'
            }}>
              <h2 style={{
                color: 'var(--color-sea-green)',
                fontSize: 'var(--font-size-x-large)',
                fontWeight: 600,
                margin: '0 0 var(--spacing-small) 0'
              }}>
                Vi trenger mer informasjon
              </h2>
              <p style={{
                fontSize: 'var(--font-size-medium)',
                color: 'var(--color-black-80)',
                margin: 0
              }}>
                For å gi deg best mulig analyse, trenger vi litt mer kontekst
              </p>
            </div>

            {/* Show preliminary analysis summary */}
            {preliminaryAnalysis && (
              <div style={{
                background: 'var(--color-mint-green-12)',
                border: '1px solid var(--color-sea-green-30)',
                borderRadius: '8px',
                padding: 'var(--spacing-medium)',
                marginBottom: 'var(--spacing-large)'
              }}>
                <h3 style={{
                  color: 'var(--color-sea-green)',
                  fontSize: 'var(--font-size-large)',
                  margin: '0 0 var(--spacing-small) 0'
                }}>
                  Foreløpig analyse
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--font-size-basis)' }}>
                  {preliminaryAnalysis.summary}
                </p>
              </div>
            )}

            {/* Context Refinement */}
            {aiAnalysis && aiAnalysis.followUpQuestions && (
              <ContextRefinement
                followUpQuestions={aiAnalysis.followUpQuestions}
                onRefineAnalysis={handleRefineAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}

            {/* Back to Step 1 button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'var(--spacing-medium)'
            }}>
              <Button
                variant="tertiary"
                onClick={() => stepperState.goToStep(1)}
              >
                ← Tilbake til tekstinput
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {stepperState.currentStep === 3 && (
          <div className="input-card">
            <ResultsStep
              isAnalyzing={isAnalyzing}
              result={result}
              aiAnalysis={aiAnalysis}
              onNewAnalysis={handleNewAnalysis}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          DNB Svindelsjekk • Ring oss på{" "}
          <span className="footer-phone">915 04800</span> hvis du er usikker
        </p>
        <p className="footer-copyright">© {new Date().getFullYear()} DNB</p>
        <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.5rem" }}>
          v2025.09.17.2 • Forbedret deteksjon av sosiale medier-svindel og
          legitime nettsteder
        </p>
      </footer>
    </div>
  );
}