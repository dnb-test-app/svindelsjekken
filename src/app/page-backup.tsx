"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Textarea, Logo, Dropdown, Badge, P, ProgressIndicator } from "@dnb/eufemia";
import ContextRefinement from "@/components/ContextRefinement";
import Stepper, { useStepperState } from "@/components/Stepper";
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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL detection states
  const [urlDetected, setUrlDetected] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  // Web verification states
  const [isWebVerifying, setIsWebVerifying] = useState(false);

  // Stepper states
  const stepperState = useStepperState();
  const [preliminaryAnalysis, setPreliminaryAnalysis] = useState<any>(null);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [requiresRefinement, setRequiresRefinement] = useState(false);

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
            // Don't put extracted text in the text field - keep image analysis separate
            // setText(result.extractedText); // REMOVED - prevents confusion

            // If API already provided analysis, use it
            if (result.fraudProbability !== undefined) {
              setResult({
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
              });
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
    [selectedModel, compressImage],
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
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
      processFile(file);
    }
  };

  // Handle paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processFile]);

  const handleCheck = async () => {
    if (text.trim().length < 5 && !imagePreview) return;

    setIsAnalyzing(true);
    setAiAnalysis(null);
    setResult(null); // Clear previous results

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
            setShowFinalResults(false);
            stepperState.markStepCompleted(1);
            stepperState.goToStep(2);
          } else {
            // No follow-up questions needed, go directly to Step 3
            setResult(analysisResult);
            setShowFinalResults(true);
            setRequiresRefinement(false);
            stepperState.markStepCompleted(1);
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
    setShowFinalResults(false);
    setRequiresRefinement(false);
    stepperState.setCurrentStep(1);
    stepperState.markStepIncomplete(1);
    stepperState.markStepIncomplete(2);
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
        setShowFinalResults(true);
        setRequiresRefinement(false);
        stepperState.markStepCompleted(2);
        stepperState.goToStep(3);
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

  const getRiskMessage = () => {
    if (!result) return "";

    // Category-based messages
    if (result.category === "fraud") {
      return "🚨 Svindelforsøk oppdaget";
    } else if (result.category === "marketing") {
      return "📢 Kommersiell melding";
    } else if (result.category === "suspicious") {
      return "⚠️ Mistenkelig innhold";
    } else if (result.category === "context-required") {
      return "🔍 Verifiser kontekst";
    } else if (result.category === "safe") {
      return "🔒 Trygt innhold";
    } else if (result.category === "error") {
      return "⚠️ Analyse utilgjengelig";
    }

    // Fallback to risk-based messages
    if (result.risk === "high") {
      return "⚠️ Høy risiko";
    } else if (result.risk === "medium") {
      return "⚡ Vær forsiktig";
    } else {
      return "✅ Ser trygt ut";
    }
  };

  const getRiskClass = () => {
    if (!result) return "";

    // Use category for styling if available
    if (result.category) {
      const categoryMap: Record<string, string> = {
        fraud: "high-risk",
        marketing: "marketing",
        suspicious: "medium-risk",
        "context-required": "context-required",
        safe: "low-risk",
        error: "error",
      };
      return `result ${categoryMap[result.category] || result.risk}-risk`;
    }

    return `result ${result.risk}-risk`;
  };

  // Get appropriate badge type based on result category
  const getBadgeType = () => {
    if (!result || !aiAnalysis) return "information";

    if (aiAnalysis.error) return "error";

    // Base badge type on the actual risk level, not just "information"
    switch (result.category) {
      case "fraud":
        return "error"; // Red for fraud
      case "suspicious":
        return "warning"; // Orange for suspicious
      case "context-required":
        return "information"; // Blue for context required
      case "safe":
        return "success"; // Green for safe
      case "marketing":
        return "information"; // Blue for marketing
      case "error":
        return "warning"; // Orange for errors
      default:
        // For backward compatibility, use risk level
        if (result.score >= 60) return "error";
        if (result.score >= 30) return "warning";
        return "success";
    }
  };

  // Get background color for AI analysis section based on risk
  const getAiAnalysisBackground = () => {
    if (!result || !aiAnalysis) return "rgba(0, 114, 114, 0.05)";

    if (aiAnalysis.error) return "rgba(194, 30, 37, 0.05)";

    switch (result.category) {
      case "fraud":
        return "rgba(194, 30, 37, 0.05)"; // Red tint for fraud
      case "suspicious":
        return "rgba(255, 145, 0, 0.05)"; // Orange tint for suspicious
      case "context-required":
        return "rgba(0, 100, 255, 0.05)"; // Blue tint for context required
      case "safe":
        return "rgba(40, 167, 69, 0.05)"; // Green tint for safe
      case "marketing":
        return "rgba(0, 100, 255, 0.05)"; // Blue tint for marketing
      case "error":
        return "rgba(102, 102, 102, 0.05)"; // Gray tint for errors
      default:
        return "rgba(0, 114, 114, 0.05)"; // Default DNB green
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Stepper
          steps={[
            stepperState.createStep(1, "Analyser tekst", true),
            stepperState.createStep(2, "Tilpass analyse", true, !requiresRefinement),
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
      </div>

      {/* Main Input Section */}
      <main className="main">
        {/* Step 1: Initial Analysis */}
        {stepperState.currentStep === 1 && (
          <div className="input-card">
            <label className="input-label">
              Er du usikker på om noe er svindel? Sjekk her:
            </label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {/* Textarea with drag and drop */}
                <div
                  className={`input-wrapper ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <textarea
                    className="input-field"
                    placeholder="Lim inn mistenkelig tekst, link eller slipp bilde her"
                    value={text}
                    onChange={(e) => {
                      console.log("Textarea onChange:", e.target.value);
                      setText(e.target.value);
                    }}
                    rows={4}
                  />

                  {/* Upload hint overlay */}
                  {!text && !imagePreview && (
                    <div className="upload-hint">
                      💡 Tips: Du kan lime inn skjermbilde direkte med Ctrl+V /
                      Cmd+V
                    </div>
                  )}

                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="drag-overlay">
                      <div className="drag-message">📷 Slipp bilde her</div>
                    </div>
                  )}
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Opplastet bilde" />
                    <button
                      className="remove-image"
                      onClick={() => {
                        setImagePreview(null);
                        setText("");
                      }}
                    >
                      ✕ Fjern bilde
                    </button>
                  </div>
                )}

                {/* OCR Progress */}
                {isProcessingImage && (
                  <div className="ocr-progress">
                    <div className="progress-label">
                      {ocrProgress < 30
                        ? "Laster opp bilde..."
                        : ocrProgress < 70
                          ? "Analyserer med AI..."
                          : "Ferdigstiller analyse..."}{" "}
                      {ocrProgress}%
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${ocrProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Hidden Model Selector - Easter Egg */}
                {showModelSelector && (
                  <div
                    style={{
                      marginTop: "var(--spacing-small)",
                      marginBottom: "var(--spacing-small)",
                    }}
                  >
                    {/* Admin Mode Indicator */}
                    <div
                      style={{
                        backgroundColor: "var(--color-signal-orange)",
                        color: "white",
                        padding: "var(--spacing-x-small) var(--spacing-small)",
                        borderRadius: "4px",
                        marginBottom: "var(--spacing-small)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                      }}
                    >
                      <span>
                        🔧 Admin Mode Active - Model:{" "}
                        {selectedModel.split("/")[1] || selectedModel}
                      </span>
                      <Button
                        size="small"
                        variant="tertiary"
                        style={{ color: "white", border: "1px solid white" }}
                        on_click={() => {
                          setShowModelSelector(false);
                          setSelectedModel(defaultModel);
                          setHasUserSelectedModel(false);
                          localStorage.removeItem("selectedAIModel");
                          setPendingModel("");
                          setText(""); // Clear the rairai text
                        }}
                      >
                        Exit Admin Mode
                      </Button>
                    </div>

                    {isLoadingModels ? (
                      <div
                        style={{
                          padding: "var(--spacing-medium)",
                          textAlign: "center",
                        }}
                      >
                        <P>Laster tilgjengelige modeller...</P>
                      </div>
                    ) : (
                      <div>
                        {/* Admin Controls Header */}
                        <div
                          style={{
                            marginBottom: "var(--spacing-medium)",
                            padding: "var(--spacing-medium)",
                            background: "var(--color-mint-green-12)",
                            borderRadius: "8px",
                            border: "2px solid var(--color-sea-green)",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              marginBottom: "var(--spacing-small)",
                            }}
                          >
                            🔧 Admin Model Management
                          </h3>

                          {/* Statistics */}
                          <div
                            style={{ marginBottom: "var(--spacing-medium)" }}
                          >
                            <P size="small">
                              {availableModels.length > 0 ? (
                                <>
                                  📊 <strong>{availableModels.length}</strong>{" "}
                                  total models | ✅{" "}
                                  <strong>
                                    {
                                      availableModels.filter(
                                        (m) =>
                                          m.status === "verified" ||
                                          modelTestResults[m.id]?.working,
                                      ).length
                                    }
                                  </strong>{" "}
                                  verified | ⚠️{" "}
                                  <strong>
                                    {
                                      availableModels.filter(
                                        (m) =>
                                          m.status === "untested" &&
                                          !modelTestResults[m.id],
                                      ).length
                                    }
                                  </strong>{" "}
                                  untested | ❌{" "}
                                  <strong>
                                    {
                                      availableModels.filter(
                                        (m) =>
                                          m.status === "failed" ||
                                          modelTestResults[m.id]?.working ===
                                            false,
                                      ).length
                                    }
                                  </strong>{" "}
                                  failed
                                </>
                              ) : (
                                "Loading models..."
                              )}
                            </P>
                          </div>

                          {/* Action Buttons */}
                          <div
                            style={{
                              display: "flex",
                              gap: "var(--spacing-small)",
                              flexWrap: "wrap",
                              marginBottom: "var(--spacing-small)",
                            }}
                          >
                            <Button
                              size="small"
                              variant="primary"
                              disabled={isLoadingModels}
                              on_click={() => fetchAvailableModels(true)}
                            >
                              {isLoadingModels
                                ? "Fetching..."
                                : "🔄 Fetch All Models"}
                            </Button>

                            <Button
                              size="small"
                              variant="secondary"
                              disabled={
                                batchTesting || availableModels.length === 0
                              }
                              on_click={testTopModels}
                            >
                              {batchTesting
                                ? "Testing..."
                                : "🧪 Test Top 50 Models"}
                            </Button>

                            <Button
                              size="small"
                              variant="tertiary"
                              on_click={() => {
                                // Clear test results cache
                                localStorage.removeItem("modelTestResults");
                                setModelTestResults({});

                                // Clear selected model and reset to default
                                localStorage.removeItem("selectedAIModel");
                                setSelectedModel(defaultModel);
                                setHasUserSelectedModel(false);
                                setPendingModel("");

                                // Reset all models to their original status
                                setAvailableModels((prev) =>
                                  prev.map((model) => ({
                                    ...model,
                                    status: model.working
                                      ? "verified"
                                      : "untested",
                                  })),
                                );
                              }}
                            >
                              🗑️ Clear Cache & Reset
                            </Button>
                          </div>

                          {/* Filter Input */}
                          <div style={{ marginBottom: "var(--spacing-small)" }}>
                            <input
                              type="text"
                              placeholder="🔍 Filter models (e.g., 'gpt', 'claude', 'free', 'fast')..."
                              value={modelFilter}
                              onChange={(e) => setModelFilter(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "var(--spacing-small)",
                                border: "2px solid var(--color-sea-green-30)",
                                borderRadius: "4px",
                                fontSize: "var(--font-size-basis)",
                              }}
                            />
                          </div>
                        </div>
                        <Dropdown
                          label="AI Model (Admin Mode)"
                          value={pendingModel || selectedModel}
                          on_change={handleModelChange}
                          size="small"
                          data={
                            availableModels.length > 0
                              ? availableModels
                                  .filter((model: any) => {
                                    if (!modelFilter) return true;
                                    const search = modelFilter.toLowerCase();
                                    return (
                                      model.id.toLowerCase().includes(search) ||
                                      model.name
                                        .toLowerCase()
                                        .includes(search) ||
                                      (model.provider &&
                                        model.provider
                                          .toLowerCase()
                                          .includes(search)) ||
                                      (model.cost &&
                                        model.cost
                                          .toLowerCase()
                                          .includes(search)) ||
                                      (model.speed &&
                                        model.speed
                                          .toLowerCase()
                                          .includes(search)) ||
                                      (search === "json" &&
                                        model.supportsJson) ||
                                      (search === "verified" &&
                                        model.status === "verified") ||
                                      (search === "untested" &&
                                        model.status === "untested") ||
                                      (search === "failed" &&
                                        model.status === "failed")
                                    );
                                  })
                                  .map((model: any) => {
                                    // Merge with local test results
                                    const testResult =
                                      modelTestResults[model.id];
                                    const status = testResult
                                      ? testResult.working
                                        ? "verified"
                                        : "failed"
                                      : model.status;

                                    let statusIcon = "";
                                    if (status === "verified")
                                      statusIcon = "✅";
                                    else if (status === "failed")
                                      statusIcon = "❌";
                                    else if (status === "untested")
                                      statusIcon = "⚠️";

                                    let content = `${statusIcon} ${model.name}`;

                                    // Add badges
                                    if (
                                      model.supportsJson ||
                                      testResult?.supportsJson
                                    )
                                      content += " [JSON]";
                                    if (model.cost === "free") content += " 🆓";
                                    if (model.speed === "fast")
                                      content += " ⚡";
                                    else if (model.speed === "slow")
                                      content += " 🐢";

                                    // Show provider
                                    const provider =
                                      model.provider || model.id.split("/")[0];
                                    content = `[${provider}] ${content}`;

                                    return {
                                      value: model.id,
                                      content,
                                    };
                                  })
                              : [
                                  // Fallback to static list if dynamic fetching fails
                                  {
                                    value: "openai/gpt-4o-mini",
                                    content: "✅ [OpenAI] GPT-4o Mini ⚡",
                                  },
                                  {
                                    value: "openai/gpt-5-mini",
                                    content: "✅ [OpenAI] GPT-5 Mini ⚡",
                                  },
                                  {
                                    value: "openai/gpt-4o",
                                    content: "✅ [OpenAI] GPT-4o",
                                  },
                                  {
                                    value: "anthropic/claude-3.5-sonnet",
                                    content: "✅ [Anthropic] Claude 3.5 Sonnet",
                                  },
                                  {
                                    value: "google/gemini-1.5-flash",
                                    content: "✅ [Google] Gemini 1.5 Flash ⚡",
                                  },
                                  {
                                    value: "meta-llama/llama-3.3-70b-instruct",
                                    content: "✅ [Meta] Llama 3.3 🆓",
                                  },
                                ]
                          }
                        />

                        {/* Show test button for selected untested model */}
                        {availableModels.length > 0 &&
                          (() => {
                            const currentModel = availableModels.find(
                              (m) => m.id === (pendingModel || selectedModel),
                            );
                            const testResult =
                              modelTestResults[pendingModel || selectedModel];
                            const needsTest =
                              currentModel &&
                              currentModel.status === "untested" &&
                              !testResult;

                            if (needsTest) {
                              return (
                                <div
                                  style={{ marginTop: "var(--spacing-small)" }}
                                >
                                  <Button
                                    size="small"
                                    variant="secondary"
                                    disabled={testingModel !== null}
                                    on_click={() =>
                                      testModel(pendingModel || selectedModel)
                                    }
                                  >
                                    {testingModel ===
                                    (pendingModel || selectedModel)
                                      ? "Testing..."
                                      : "Test This Model"}
                                  </Button>
                                  {currentModel.status === "untested" && (
                                    <P
                                      size="small"
                                      style={{
                                        marginTop: "var(--spacing-x-small)",
                                        color: "var(--color-signal-orange)",
                                      }}
                                    >
                                      ⚠️ This model has not been verified. Test
                                      it first to ensure it works.
                                    </P>
                                  )}
                                </div>
                              );
                            }

                            if (testResult && !testResult.working) {
                              let errorMessage = "";
                              let errorIcon = "❌";

                              switch (testResult.errorType) {
                                case "json_format":
                                  errorIcon = "⚠️";
                                  errorMessage =
                                    "Model doesn't follow JSON format instructions";
                                  break;
                                case "timeout":
                                  errorIcon = "⏱️";
                                  errorMessage =
                                    "Model response too slow (>15s)";
                                  break;
                                case "rate_limit":
                                  errorIcon = "🚫";
                                  errorMessage =
                                    "API rate limit reached - try again later";
                                  break;
                                case "auth":
                                  errorIcon = "🔑";
                                  errorMessage =
                                    "API key issue - check configuration";
                                  break;
                                case "not_found":
                                  errorIcon = "❓";
                                  errorMessage =
                                    "Model unavailable or deprecated";
                                  break;
                                case "network":
                                  errorIcon = "🌐";
                                  errorMessage = "Network connection issue";
                                  break;
                                default:
                                  errorMessage =
                                    testResult.error ||
                                    "Test failed - unknown error";
                              }

                              return (
                                <P
                                  size="small"
                                  style={{
                                    marginTop: "var(--spacing-x-small)",
                                    color: "var(--color-cherry-red)",
                                  }}
                                >
                                  {errorIcon} {errorMessage}
                                  {testResult.error &&
                                    testResult.errorType !== "other" && (
                                      <span
                                        style={{
                                          fontSize: "0.8em",
                                          opacity: 0.7,
                                          display: "block",
                                        }}
                                      >
                                        Details: {testResult.error}
                                      </span>
                                    )}
                                </P>
                              );
                            }

                            return null;
                          })()}
                      </div>
                    )}
                    {pendingModel && pendingModel !== selectedModel && (
                      <div
                        style={{
                          marginTop: "var(--spacing-small)",
                          display: "flex",
                          gap: "var(--spacing-small)",
                        }}
                      >
                        <Button size="small" on_click={handleSaveModel}>
                          Lagre modell
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          on_click={handleCancelModel}
                        >
                          Avbryt
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Context Helper */}
                {urlDetected && !imagePreview && (
                  <div
                    style={{
                      backgroundColor: "var(--color-mint-green-12)",
                      border: "2px solid var(--color-sea-green)",
                      borderRadius: "8px",
                      padding: "var(--spacing-medium)",
                      marginTop: "var(--spacing-small)",
                      marginBottom: "var(--spacing-small)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-small)",
                        marginBottom: "var(--spacing-small)",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🔗</span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "var(--color-sea-green)",
                        }}
                      >
                        Vi ser du har limt inn en lenke
                      </h3>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        marginBottom: "var(--spacing-small)",
                        fontSize: "0.9rem",
                        color: "var(--dnb-text)",
                      }}
                    >
                      For en mer nøyaktig analyse, kan du fortelle oss hvor du
                      fikk denne lenken fra?
                    </p>
                    <textarea
                      placeholder="F.eks: 'Fikk denne på SMS fra ukjent nummer' eller 'E-post fra min bank'"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "var(--spacing-small)",
                        border: "2px solid var(--color-sea-green-30)",
                        borderRadius: "4px",
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                        minHeight: "80px",
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        marginTop: "var(--spacing-x-small)",
                        fontSize: "0.8rem",
                        color: "var(--dnb-text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      Dette er valgfritt, men hjelper oss å gi deg bedre
                      veiledning
                    </p>
                  </div>
                )}

                {/* Model Indicator Badge */}
                {hasUserSelectedModel && (
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: "var(--spacing-x-small)",
                    }}
                  >
                    <Badge
                      style={{
                        backgroundColor: "var(--color-ocean-blue)",
                        color: "white",
                        fontSize: "0.75rem",
                      }}
                    >
                      Using: {selectedModel.split("/")[1] || selectedModel}
                    </Badge>
                  </div>
                )}

                <div className="button-container">
                  {result && !isAnalyzing ? (
                    <button
                      className="check-button"
                      onClick={handleNewAnalysis}
                    >
                      🔄 Ny analyse
                    </button>
                  ) : (
                    <button
                      className="check-button"
                      onClick={handleCheck}
                      disabled={(() => {
                        const isDisabled =
                          (text.trim().length < 5 && !imagePreview) ||
                          isAnalyzing ||
                          isProcessingImage;
                        console.log(
                          "Button disabled?",
                          isDisabled,
                          "text length:",
                          text.trim().length,
                          "isAnalyzing:",
                          isAnalyzing,
                          "imagePreview:",
                          !!imagePreview,
                        );
                        return isDisabled;
                      })()}
                    >
                      {isAnalyzing ? "Sjekker..." : "Sjekk"}
                    </button>
                  )}
                  <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    📷 Last opp bilde
                  </button>
                </div>

                {/* Dynamic message based on analysis */}
                {result && result.summary && (
                  <div className="text-prompt">
                    <p>{result.summary}</p>
                  </div>
                )}

                {/* Loading state */}
                {isAnalyzing && (
                  <div className="analyzing-state">
                    <div className="analyzing-spinner"></div>
                    {isWebVerifying ? (
                      <div>
                        <p>Analyserer med AI...</p>
                        <div
                          style={{
                            marginTop: "var(--spacing-small)",
                            padding: "var(--spacing-small)",
                            backgroundColor: "var(--color-mint-green-12)",
                            border: "1px solid var(--color-sea-green-30)",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--spacing-x-small)",
                              marginBottom: "var(--spacing-x-small)",
                            }}
                          >
                            <span>🔍</span>
                            <strong>
                              Verifiserer mot norske svindeldatabaser...
                            </strong>
                          </div>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "var(--spacing-medium)",
                              fontSize: "0.8rem",
                              color: "var(--dnb-text-muted)",
                            }}
                          >
                            <li>Sjekker Forbrukertilsynet og Forbrukerrådet</li>
                            <li>Søker i politiets advarsler</li>
                            <li>Verifiserer telefonnummer og domener</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p>Analyserer med AI...</p>
                    )}
                  </div>
                )}
          </div>
        )}

        {/* Step 3: Results Display */}
        {stepperState.currentStep === 3 && (
          <div className="input-card">
            {/* Loading State */}
            {isAnalyzing && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-xx-large) var(--spacing-large)',
                textAlign: 'center'
              }}>
                <ProgressIndicator
                  size="large"
                  style={{ marginBottom: 'var(--spacing-large)' }}
                />
                <h3 style={{
                  margin: '0 0 var(--spacing-small) 0',
                  fontSize: 'var(--font-size-large)',
                  fontWeight: 600,
                  color: 'var(--color-sea-green)'
                }}>
                  Analyserer med AI...
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 'var(--font-size-basis)',
                  color: 'var(--color-black-60)',
                  maxWidth: '400px',
                  lineHeight: 1.5
                }}>
                  Vi bruker avansert AI for å gi deg den mest nøyaktige analysen basert på konteksten du oppga.
                </p>
              </div>
            )}

            {/* Result */}
            {result && !isAnalyzing && (
              <div className={getRiskClass()}>
                {/* Show when this is from an image analysis */}
                {result.isImageAnalysis && (
                  <div style={{ marginBottom: "12px" }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--dnb-text)",
                      }}
                    >
                      📸 Bildeanalyse fullført
                    </p>
                  </div>
                )}
                <div className="result-header">
                      <div style={{ width: "100%" }}>
                        {result.category === "fraud" ? (
                          <>
                            <div className="result-score">{result.score}%</div>
                            <div className="result-label">
                              sannsynlighet for svindel
                            </div>
                          </>
                        ) : result.category === "marketing" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                color: "var(--dnb-text)",
                              }}
                            >
                              <span>📢</span>
                              <span>Markedsføring</span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--dnb-text-muted)",
                                marginLeft: "36px",
                              }}
                            >
                              Kommersiell melding fra kjent avsender
                            </div>
                          </div>
                        ) : result.category === "suspicious" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                color: "var(--dnb-text)",
                              }}
                            >
                              <span>⚠️</span>
                              <span>Mistenkelig</span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--dnb-text-muted)",
                                marginLeft: "36px",
                              }}
                            >
                              Verifiser avsender før du handler
                            </div>
                          </div>
                        ) : result.category === "safe" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                color: "var(--dnb-text)",
                              }}
                            >
                              <span>🔒</span>
                              <span>Trygt</span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--dnb-text-muted)",
                                marginLeft: "36px",
                              }}
                            >
                              Ingen tegn på svindel funnet
                            </div>
                          </div>
                        ) : result.category === "error" ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                color: "var(--color-signal-orange)",
                              }}
                            >
                              <span>⚠️</span>
                              <span>Analyse utilgjengelig</span>
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--dnb-text-muted)",
                                marginLeft: "36px",
                              }}
                            >
                              {(result as any).retryable
                                ? "For mange forespørsler akkurat nå. Vær ekstra forsiktig."
                                : "Kunne ikke analysere innholdet. Vær ekstra forsiktig."}
                            </div>
                            {(result as any).retryable && (
                              <div
                                style={{ marginLeft: "36px", marginTop: "8px" }}
                              >
                                <Button
                                  size="small"
                                  variant="secondary"
                                  on_click={() => {
                                    // Retry the analysis
                                    handleCheck();
                                  }}
                                >
                                  Prøv igjen
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback to old display for backward compatibility
                          <>
                            <div className="result-score">{result.score}%</div>
                            <div className="result-label">
                              sannsynlighet for svindel
                              {(result as any).fallbackMode && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.75rem",
                                    marginTop: "4px",
                                    color: "var(--dnb-text-muted)",
                                  }}
                                >
                                  (AI utilgjengelig)
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Web Search Details Section */}
                    {result.urlsFound && result.urlsFound.length > 0 && (
                      <div
                        style={{
                          marginTop: "var(--spacing-medium)",
                          padding: "var(--spacing-medium)",
                          backgroundColor: "var(--color-sand-yellow-2)",
                          borderRadius: "8px",
                          border: "1px solid var(--color-sand-yellow-30)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-x-small)",
                            marginBottom: "var(--spacing-small)",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "var(--dnb-text)",
                          }}
                        >
                          <span>🔍</span>
                          <span>URLs funnet og sjekket:</span>
                        </div>

                        {result.urlsFound.map((url: string, index: number) => (
                          <div
                            key={index}
                            style={{ marginBottom: "var(--spacing-small)" }}
                          >
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "var(--dnb-text)",
                                marginBottom: "4px",
                              }}
                            >
                              📍 {url}
                            </div>

                            {result.webSearchResults &&
                              result.webSearchResults[url] && (
                                <div
                                  style={{
                                    marginLeft: "var(--spacing-medium)",
                                    fontSize: "0.8rem",
                                    color: "var(--dnb-text-muted)",
                                  }}
                                >
                                  <div style={{ marginBottom: "4px" }}>
                                    <strong>Status:</strong>{" "}
                                    {result.webSearchResults[url].status ===
                                    "known_scam"
                                      ? "❌ Kjent svindel"
                                      : result.webSearchResults[url].status ===
                                          "legitimate"
                                        ? "✅ Legitim"
                                        : result.webSearchResults[url]
                                              .status === "suspicious"
                                          ? "⚠️ Mistenkelig"
                                          : "❓ Ukjent"}
                                  </div>
                                  {result.webSearchResults[url].findings &&
                                    result.webSearchResults[url].findings
                                      .length > 0 && (
                                      <div>
                                        <strong>Funn:</strong>
                                        <ul
                                          style={{
                                            margin: "4px 0",
                                            paddingLeft:
                                              "var(--spacing-medium)",
                                          }}
                                        >
                                          {result.webSearchResults[
                                            url
                                          ].findings.map(
                                            (
                                              finding: string,
                                              findingIndex: number,
                                            ) => (
                                              <li
                                                key={findingIndex}
                                                style={{
                                                  fontSize: "0.75rem",
                                                  margin: "2px 0",
                                                }}
                                              >
                                                {finding}
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                </div>
                              )}
                          </div>
                        ))}

                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--dnb-text-muted)",
                            marginTop: "var(--spacing-small)",
                            fontStyle: "italic",
                          }}
                        >
                          💡 Kategoriseringen er basert på nettsøkeresultater,
                          ikke bare innholdstype
                        </div>
                      </div>
                    )}

                    {result.category !== "fraud" &&
                      result.category !== "marketing" &&
                      result.category !== "suspicious" &&
                      result.category !== "safe" &&
                      result.category !== "error" && (
                        <div className="result-message">{getRiskMessage()}</div>
                      )}

                    {/* AI Analysis Section */}
                    {aiAnalysis && (
                      <div
                        style={{
                          marginTop: "var(--spacing-medium)",
                          padding: "var(--spacing-small)",
                          background: getAiAnalysisBackground(),
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-small)",
                            marginBottom: "var(--spacing-small)",
                            flexWrap: "wrap",
                          }}
                        >
                          <Badge
                            style={{
                              backgroundColor: (() => {
                                if (aiAnalysis.error)
                                  return "var(--color-cherry-red)";
                                if (!result) return "var(--color-ocean-blue)";

                                switch (result.category) {
                                  case "fraud":
                                    return "var(--color-cherry-red)";
                                  case "suspicious":
                                    return "var(--color-signal-orange)";
                                  case "safe":
                                    return "var(--color-summer-green)";
                                  case "marketing":
                                    return "var(--color-ocean-blue)";
                                  case "error":
                                    return "var(--color-cherry-red)";
                                  default:
                                    if (result.score >= 60)
                                      return "var(--color-cherry-red)";
                                    if (result.score >= 30)
                                      return "var(--color-signal-orange)";
                                    return "var(--color-summer-green)";
                                }
                              })(),
                              color: "white",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "none",
                            }}
                          >
                            {aiAnalysis.error
                              ? "AI-feil"
                              : aiAnalysis.webSearchUsed
                                ? "AI + Web-verifisert"
                                : "AI-analysert"}
                          </Badge>
                          {!aiAnalysis.error && hasUserSelectedModel && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--dnb-text-muted)",
                                whiteSpace: "nowrap",
                                minWidth: "0", // Allow shrinking if needed
                              }}
                            >
                              {selectedModel &&
                              typeof selectedModel === "string"
                                ? selectedModel.split("/")[1]
                                : "AI"}
                            </span>
                          )}
                        </div>
                        {aiAnalysis.error ? (
                          <P
                            size="small"
                            style={{ color: "var(--color-cherry-red)" }}
                          >
                            {aiAnalysis.error}
                          </P>
                        ) : (
                          <>
                            <P
                              size="small"
                              style={{ marginBottom: "var(--spacing-small)" }}
                            >
                              {aiAnalysis.summary}
                            </P>
                            {aiAnalysis.recommendation && (
                              <P size="small" style={{ fontWeight: 500 }}>
                                <strong>Anbefaling:</strong>{" "}
                                {aiAnalysis.recommendation}
                              </P>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Educational Content */}
                    {result.educationalContext && (
                      <div className="educational-content">
                        <div className="educational-header">
                          <P size="medium" className="educational-title">
                            📚 Viktig å vite
                          </P>
                        </div>

                        <div className="educational-section">
                          <P className="educational-text">
                            <strong>Hvorfor denne vurderingen:</strong>
                            <br />
                            {result.educationalContext.whyThisAssessment}
                          </P>
                        </div>

                        <div className="educational-section">
                          <P className="educational-text">
                            <strong>Legitim bruk:</strong>
                            <br />
                            {result.educationalContext.commonLegitimateUse}
                          </P>
                        </div>

                        <div className="educational-section">
                          <P className="educational-text">
                            <strong>Viktig forskjell:</strong>
                            <br />
                            {result.educationalContext.keyDifference}
                          </P>
                        </div>
                      </div>
                    )}

                    {/* Verification Guide */}
                    {result.verificationGuide && (
                      <div className="verification-guide">
                        <P size="medium" className="verification-title">
                          ✅ Slik sjekker du dette
                        </P>

                        <div className="verification-steps">
                          <div className="verification-step">
                            <span className="step-number">1</span>
                            <P className="step-text">
                              {result.verificationGuide.primaryCheck}
                            </P>
                          </div>

                          <div className="verification-step">
                            <span className="step-number">2</span>
                            <P className="step-text">
                              {result.verificationGuide.independentVerification}
                            </P>
                          </div>

                          <div className="verification-step">
                            <span className="step-number">3</span>
                            <P className="step-text">
                              {result.verificationGuide.alternativeChannel}
                            </P>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actionable Steps */}
                    {result.actionableSteps &&
                      result.actionableSteps.length > 0 && (
                        <div className="smart-questions">
                          <P size="medium" className="questions-title">
                            ✅ Konkrete steg du kan ta
                          </P>
                          {result.actionableSteps.map(
                            (step: string, idx: number) => (
                              <div key={idx} className="smart-question">
                                <P className="question-text">
                                  <span
                                    style={{
                                      marginRight: "8px",
                                      fontWeight: "bold",
                                      color: "#28a745",
                                    }}
                                  >
                                    {idx + 1}.
                                  </span>
                                  {step}
                                </P>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                    {result.risk === "high" && (
                      <div className="result-recommendations">
                        <div className="recommendation">
                          <span>🗑️</span>
                          <span>Slett meldingen umiddelbart</span>
                        </div>
                        <div className="recommendation">
                          <span>🚫</span>
                          <span>
                            Ikke klikk på lenker eller oppgi informasjon
                          </span>
                        </div>
                        <div className="recommendation">
                          <span>⚠️</span>
                          <span>
                            Hvis du har oppgitt info: Ring DNB på 915 04800
                          </span>
                        </div>
                      </div>
                    )}

                    {result.risk === "medium" && (
                      <div className="result-recommendations">
                        <div className="recommendation">
                          <span>⚠️</span>
                          <span>Vær ekstra forsiktig</span>
                        </div>
                        <div className="recommendation">
                          <span>✔️</span>
                          <span>Sjekk avsender nøye</span>
                        </div>
                        <div className="recommendation">
                          <span>📞</span>
                          <span>Kontakt DNB direkte hvis du er usikker</span>
                        </div>
                      </div>
                    )}

                    {result.risk === "low" && (
                      <div className="result-recommendations">
                        <div className="recommendation">
                          <span>✅</span>
                          <span>Dette ser legitimt ut</span>
                        </div>
                        <div className="recommendation">
                          <span>👀</span>
                          <span>Vær alltid oppmerksom på tegn til svindel</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ny analyse button in results mode */}
                <div
                  style={{
                    marginTop: "var(--spacing-large)",
                    textAlign: "center",
                  }}
                >
                  <button className="check-button" onClick={handleNewAnalysis}>
                    🔄 Ny analyse
                  </button>
                </div>
          </div>
        )}

        {/* Step 2: Refine Analysis */}
        {stepperState.currentStep === 2 && requiresRefinement && (
          <div className="input-card">
            <div
              style={{
                marginBottom: "var(--spacing-large)",
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  color: "var(--color-sea-green)",
                  fontSize: "var(--font-size-x-large)",
                  fontWeight: 600,
                  margin: "0 0 var(--spacing-small) 0",
                }}
              >
                Vi trenger mer informasjon
              </h2>
              <p
                style={{
                  fontSize: "var(--font-size-medium)",
                  color: "var(--color-black-80)",
                  margin: 0,
                }}
              >
                For å gi deg best mulig analyse, trenger vi litt mer kontekst
              </p>
            </div>

            {/* Show preliminary analysis summary */}
            {preliminaryAnalysis && (
              <div
                style={{
                  background: "var(--color-mint-green-12)",
                  border: "1px solid var(--color-sea-green-30)",
                  borderRadius: "8px",
                  padding: "var(--spacing-medium)",
                  marginBottom: "var(--spacing-large)",
                }}
              >
                <h3
                  style={{
                    color: "var(--color-sea-green)",
                    fontSize: "var(--font-size-large)",
                    margin: "0 0 var(--spacing-small) 0",
                  }}
                >
                  Foreløpig analyse
                </h3>
                <p style={{ margin: 0, fontSize: "var(--font-size-basis)" }}>
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
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "var(--spacing-medium)",
              }}
            >
              <Button
                variant="tertiary"
                onClick={() => stepperState.goToStep(1)}
              >
                ← Tilbake til tekstinput
              </Button>
            </div>

            {/* Show final results after refinement */}
            {showFinalResults && result && (
              <div style={{ marginTop: "var(--spacing-large)" }}>
                <div>Final results go here</div>
              </div>
            )}
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
