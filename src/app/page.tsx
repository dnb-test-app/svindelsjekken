"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Textarea,
  Logo,
  Dropdown,
  Badge,
  P,
  ProgressIndicator,
  Input,
} from "@dnb/eufemia";
import ContextRefinement from "@/components/ContextRefinement";
import Stepper, { useStepperState } from "@/components/Stepper";
import AnalysisStep from "@/components/AnalysisStep";
import ResultsStep from "@/components/ResultsStep";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorDialog from "@/components/ErrorDialog";
import AdminModeSelector from "@/components/AdminModeSelector";
import { isMinimalContextURL } from "@/lib/urlAnalyzer";
import {
  needsWebSearchVerification,
  getWebSearchReasons,
} from "@/lib/fraudDetection";
import { fileToBase64 } from "@/lib/utils/fileHelpers";
import { getModelName } from "@/lib/utils/modelHelpers";
import {
  prepareImageData,
  checkWebVerificationNeeds,
  buildAnalysisContext,
  createErrorResult,
  createInsufficientTextResult,
  transformAIResult,
  requiresContextRefinement,
  hasSufficientInput,
} from "@/lib/utils/analysisHelpers";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import {
  FILE_UPLOAD,
  ANALYSIS,
  STORAGE_KEYS,
  UI,
  APP,
} from "@/lib/constants/appConstants";

export default function Home() {
  // Custom hooks for state management
  const imageUpload = useImageUpload();
  const analysisState = useAnalysisState();

  // Model selection states
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-5-mini");
  const [defaultModel, setDefaultModel] = useState("openai/gpt-5-mini");
  const [hasUserSelectedModel, setHasUserSelectedModel] = useState(false);
  const [pendingModel, setPendingModel] = useState<string>("");

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

  // Load saved model preference and test results
  useEffect(() => {
    // Load test results from localStorage
    const savedTestResults = localStorage.getItem(
      STORAGE_KEYS.MODEL_TEST_RESULTS,
    );
    if (savedTestResults) {
      try {
        setModelTestResults(JSON.parse(savedTestResults));
      } catch (e) {
        console.error("Failed to parse saved test results");
      }
    }

    fetch("/api/analyze")
      .then((res) => res.json())
      .then((data) => {
        const apiDefaultModel = data.defaultModel || "openai/gpt-5-mini";
        setDefaultModel(apiDefaultModel);

        const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
        const selectedModelId = saved || apiDefaultModel;
        setSelectedModel(selectedModelId);
        setHasUserSelectedModel(saved !== null && saved !== apiDefaultModel);
      })
      .catch(() => {
        // Fallback if API fails
        const fallbackDefault = "openai/gpt-5-mini";
        setDefaultModel(fallbackDefault);

        const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
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
          console.info(
            `Fetched ${data.totalModels} models (${data.verifiedCount} verified)`,
          );

          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
            setModelsFetched(true);

            // Store in localStorage for quick loading
            localStorage.setItem(
              STORAGE_KEYS.CACHED_MODELS,
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
              localStorage.setItem(
                STORAGE_KEYS.SELECTED_MODEL,
                data.recommended.id,
              );
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
    if (
      analysisState.text.toLowerCase().includes("rairai") &&
      !showModelSelector
    ) {
      setShowModelSelector(true);
      fetchAvailableModels(); // Fetch models when admin mode is activated
    }
  }, [analysisState.text, showModelSelector, fetchAvailableModels]);

  // URL detection: Check if input contains URLs with minimal context
  useEffect(() => {
    const hasMinimalContextURL = isMinimalContextURL(analysisState.text.trim());
    analysisState.setUrlDetected(hasMinimalContextURL);
  }, [analysisState.text]);

  const handleCheck = async () => {
    // Initialize state
    analysisState.setIsAnalyzing(true);
    analysisState.setAiAnalysis(null);
    analysisState.setResult(null);

    // Clean text for API
    const analysisText = analysisState.text.replace(/rairai/gi, "").trim();

    // Prepare image data if file was uploaded
    const imageData = await prepareImageData(
      imageUpload.uploadedFile,
      imageUpload.setOcrProgress,
    );

    // Check if web verification is needed
    const { needsVerification, reasons } =
      checkWebVerificationNeeds(analysisText);
    if (needsVerification) {
      analysisState.setIsWebVerifying(true);
    }

    // Update progress for images
    if (imageData) {
      imageUpload.setOcrProgress(70);
    }

    // Validate sufficient input
    if (!hasSufficientInput(analysisText, imageData)) {
      analysisState.setResult(createInsufficientTextResult());
      analysisState.setIsAnalyzing(false);
      analysisState.setIsWebVerifying(false);
      imageUpload.setOcrProgress(0);
      return;
    }

    // Prepare analysis request
    try {
      const baseModel =
        typeof selectedModel === "string" ? selectedModel : defaultModel;
      const modelToUse = needsVerification ? `${baseModel}:online` : baseModel;
      const context = buildAnalysisContext(
        imageData,
        imageUpload.ocrText,
        analysisState.additionalContext,
        analysisState.urlDetected,
      );

      // Call analysis API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: analysisText,
          model: modelToUse,
          context,
        }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);

        const { result: errorResult, error: errorMsg } = createErrorResult(
          response.status,
        );
        analysisState.setResult(errorResult);
        analysisState.setAiAnalysis({ error: errorMsg });
      } else {
        // Process successful response
        const aiResult = await response.json();
        analysisState.setAiAnalysis(aiResult);

        if (imageData) {
          imageUpload.setOcrProgress(100);
        }

        // Transform AI result to analysis format
        const analysisResult = transformAIResult(aiResult);

        // Handle context refinement if needed
        if (requiresContextRefinement(aiResult)) {
          setPreliminaryAnalysis(analysisResult);
          setRequiresRefinement(true);
          stepperState.markStepCompleted(1);
          stepperState.goToStep(2);
        } else {
          analysisState.setResult(analysisResult);
          setRequiresRefinement(false);
          stepperState.markStepCompleted(1);
          stepperState.markStepCompleted(2);
          stepperState.goToStep(3);
        }
      }
    } catch (error: any) {
      console.error("AI analysis failed:", error);

      const { result: errorResult, error: errorMsg } = createErrorResult();
      analysisState.setResult(errorResult);
      analysisState.setAiAnalysis({ error: errorMsg });
    }

    // Cleanup
    analysisState.setIsAnalyzing(false);
    analysisState.setIsWebVerifying(false);
    imageUpload.setOcrProgress(0);
  };

  // Reset all states for new analysis
  const handleNewAnalysis = () => {
    analysisState.resetAnalysis();
    imageUpload.handleRemoveImage();
    setPreliminaryAnalysis(null);
    setRequiresRefinement(false);
    stepperState.setCurrentStep(1);
    stepperState.markStepIncomplete(1);
    stepperState.markStepIncomplete(2);
    stepperState.markStepIncomplete(3);
  };

  const handleRefineAnalysis = async (
    questionAnswers: Record<string, string>,
    refinementContext: string,
  ) => {
    // Allow refinement if we have either sufficient text OR an image
    if (
      (!analysisState.text ||
        analysisState.text.trim().length < ANALYSIS.MIN_TEXT_LENGTH) &&
      !imageUpload.imagePreview
    )
      return;

    analysisState.setIsAnalyzing(true);
    analysisState.setAiAnalysis(null);

    // Immediately advance to Step 3 to show loading state
    stepperState.markStepCompleted(2);
    stepperState.goToStep(3);

    // Clean text for API
    const cleanedText = analysisState.text.replace(/rairai/gi, "").trim();
    const refinedText = cleanedText;

    try {
      const modelToUse =
        typeof selectedModel === "string" ? selectedModel : defaultModel;

      // Combine URL context with refinement context
      let combinedContext = refinementContext;
      if (analysisState.urlDetected && analysisState.additionalContext.trim()) {
        combinedContext = `Kontekst for lenke: ${analysisState.additionalContext.trim()}\n\nYtterligere informasjon: ${refinementContext}`;
      }

      // Prepare context with image, OCR, and initial results
      const contextData: any = {
        questionAnswers,
        additionalContext: combinedContext,
        initialAnalysis: preliminaryAnalysis
          ? {
              category: preliminaryAnalysis.category,
              score: preliminaryAnalysis.score,
              risk: preliminaryAnalysis.risk,
              triggers: preliminaryAnalysis.triggers,
              recommendation: preliminaryAnalysis.recommendation,
              summary: preliminaryAnalysis.summary,
              mainIndicators: analysisState.aiAnalysis?.mainIndicators,
              positiveIndicators: analysisState.aiAnalysis?.positiveIndicators,
              negativeIndicators: analysisState.aiAnalysis?.negativeIndicators,
              urlVerifications: analysisState.aiAnalysis?.urlVerifications,
            }
          : undefined,
      };

      // Include image if we have one from step 1
      if (imageUpload.uploadedFile) {
        const base64 = await fileToBase64(imageUpload.uploadedFile);
        contextData.imageData = {
          base64: base64,
          mimeType: imageUpload.uploadedFile.type,
        };
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: refinedText,
          model: modelToUse,
          context: contextData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Refined analysis API error:", errorText);

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

        analysisState.setResult({
          category: "error",
          score: 0,
          risk: "unknown",
          triggers: [],
          categories: [],
          fallbackMode: true,
          recommendation,
          summary,
          retryable: response.status === 429,
        });
        analysisState.setAiAnalysis({ error: errorMessage });
      } else {
        const aiResult = await response.json();
        analysisState.setAiAnalysis(aiResult);

        const refinedResult = {
          category: aiResult.category || "info",
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
          refined: true,
          educationalContext: aiResult.educationalContext || null,
          verificationGuide: aiResult.verificationGuide || null,
          smartQuestions: aiResult.smartQuestions || [],
        };

        analysisState.setResult(refinedResult);
        setRequiresRefinement(false);
        stepperState.markStepCompleted(3);
      }
    } catch (error: any) {
      console.error("Refined AI analysis failed:", error);

      analysisState.setResult({
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
      analysisState.setAiAnalysis({ error: "AI-analyse feilet." });
    }

    analysisState.setIsAnalyzing(false);
    analysisState.setIsWebVerifying(false);
  };

  const handleModelChange = (e: any) => {
    // DNB Dropdown passes { data: { value, content, ... } }
    let model = null;

    if (typeof e === "string") {
      model = e;
    } else if (e?.data?.value) {
      model = e.data.value;
    } else if (e?.value) {
      model = e.value;
    }

    if (model && model !== selectedModel) {
      setPendingModel(model);
    }
  };

  const handleSaveModel = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel);
      setHasUserSelectedModel(pendingModel !== defaultModel);
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, pendingModel);
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
        localStorage.setItem(
          STORAGE_KEYS.MODEL_TEST_RESULTS,
          JSON.stringify(newResults),
        );

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
        console.warn("No models to test!");
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
        localStorage.setItem(
          STORAGE_KEYS.MODEL_TEST_RESULTS,
          JSON.stringify(newResults),
        );

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

        console.info(
          `Tested ${data.statistics.totalTested} models: ${data.statistics.working} working, ${data.statistics.withJsonSupport} with JSON support`,
        );
      }
    } catch (error) {
      console.error("Batch test failed:", error);
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
          } else if (stepId === 3 && stepperState.completedSteps.has(3)) {
            stepperState.goToStep(3);
          }
        }}
      />

      {/* Main Content Section */}
      <main className="main">
        {/* Step 1: Analysis Input */}
        {stepperState.currentStep === 1 && (
          <div className="input-card">
            <ErrorBoundary>
              <AnalysisStep
                text={analysisState.text}
                setText={analysisState.setText}
                imagePreview={imageUpload.imagePreview}
                isAnalyzing={analysisState.isAnalyzing}
                isProcessingImage={imageUpload.isProcessingImage}
                ocrProgress={imageUpload.ocrProgress}
                onAnalyze={handleCheck}
                onImageUpload={imageUpload.handleFileChange}
                handlePaste={imageUpload.handlePaste}
                fileInputRef={imageUpload.fileInputRef}
                onRemoveImage={imageUpload.handleRemoveImage}
              />
            </ErrorBoundary>

            {/* Hidden Model Selector - Easter Egg */}
            {showModelSelector && (
              <AdminModeSelector
                selectedModel={selectedModel}
                defaultModel={defaultModel}
                availableModels={availableModels}
                isLoadingModels={isLoadingModels}
                modelFilter={modelFilter}
                setModelFilter={setModelFilter}
                onModelSelect={(modelId) => {
                  setSelectedModel(modelId);
                  setHasUserSelectedModel(true);
                  localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
                }}
                onExitAdminMode={() => {
                  setShowModelSelector(false);
                  setSelectedModel(defaultModel);
                  setHasUserSelectedModel(false);
                  localStorage.removeItem(STORAGE_KEYS.SELECTED_MODEL);
                  setPendingModel("");
                  analysisState.setText(""); // Clear the rairai text
                }}
              />
            )}
          </div>
        )}

        {/* Step 2: Context Refinement */}
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

            {/* Context Refinement */}
            {analysisState.aiAnalysis &&
              analysisState.aiAnalysis.followUpQuestions && (
                <ErrorBoundary>
                  <ContextRefinement
                    followUpQuestions={
                      analysisState.aiAnalysis.followUpQuestions
                    }
                    onRefineAnalysis={handleRefineAnalysis}
                    isAnalyzing={analysisState.isAnalyzing}
                  />
                </ErrorBoundary>
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
          </div>
        )}

        {/* Step 3: Results */}
        {stepperState.currentStep === 3 && (
          <div className="input-card">
            <ErrorBoundary>
              <ResultsStep
                isAnalyzing={analysisState.isAnalyzing}
                result={analysisState.result}
                aiAnalysis={analysisState.aiAnalysis}
                onNewAnalysis={handleNewAnalysis}
                originalText={analysisState.text}
              />
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          {APP.NAME} • Ring oss på{" "}
          <span className="footer-phone">{APP.SUPPORT_PHONE}</span> hvis du er
          usikker
        </p>
        <p>
          <span className="footer-copyright">
            © {new Date().getFullYear()} DNB
          </span>
          {" - "}
          <span className="footer-version">v{APP.VERSION}</span>
        </p>
      </footer>

      {/* Error Dialog */}
      <ErrorDialog
        title={imageUpload.errorDialogTitle}
        message={imageUpload.errorDialogMessage}
        open={imageUpload.errorDialogOpen}
        onClose={imageUpload.closeErrorDialog}
      />
    </div>
  );
}
