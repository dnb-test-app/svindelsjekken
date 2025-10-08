/**
 * Prompt Builder
 * Assembles modular prompt sections into system and user messages
 *
 * SECURITY: User input NEVER goes in system message to prevent prompt injection
 * - System message: Fraud detection rules + initial analysis metadata (app-generated)
 * - User message: XML-structured with ESCAPED user content
 *
 * XML escaping prevents users from breaking structure with tags like </text_to_analyze>
 * Role separation prevents users from injecting instructions into system prompt
 *
 * RULE HIERARCHY (highest to lowest priority):
 * 1. Critical Fraud Rules (BankID/Vipps phishing, urgent threats) - ALWAYS fraud
 * 2. Authentication Service Protection (BankID, Vipps context-aware detection)
 * 3. Behavioral Patterns (phishing tactics, social engineering)
 * 4. URL Verification (domain legitimacy checks with dynamic verification)
 * 5. Context Analysis (sender, relationship, expectations)
 */

import { escapeXml } from "@/lib/security/promptSanitizer";
import { getSystemContext } from "./sections/systemContext";
import { getSecurityBoundaries } from "./sections/securityBoundaries";
import { getCriticalFraudRules, getCriticalRulesSummary } from "./sections/criticalFraudRules";
import { getBankIdRules, getFundamentalPrinciple } from "./sections/bankIdRules";
import { getVippsRules } from "./sections/vippsRules";
import {
  getUrlExtractionRules,
  getMinimalContextUrlRules,
  getUrlProcessingInstructions,
} from "./sections/urlVerificationRules";
import {
  getBehavioralPatterns,
  getDetectionRules,
  getCategorizationOverride,
} from "./sections/behavioralPatterns";
import { getWebSearchInstructions } from "./sections/webSearchInstructions";
import {
  getOutputFormat,
  getPreResponseValidation,
  getConstraints,
  getRefinementRules,
} from "./sections/outputFormat";
import { getFollowUpQuestionsGuide } from "./sections/followUpQuestions";

interface PromptContext {
  questionAnswers?: Record<string, string>;
  additionalContext?: string;
  imageData?: { base64: string; mimeType: string };
  additionalText?: string;
  initialAnalysis?: {
    category: string;
    score: number;
    risk: string;
    triggers: any[];
    recommendation: string;
    summary: string;
    mainIndicators?: string[];
    positiveIndicators?: string[];
    negativeIndicators?: string[];
    urlVerifications?: any[];
  };
}

/**
 * Creates system message with fraud detection rules (NO user input)
 *
 * @param context - Optional context (refinement metadata from our initial analysis)
 * @param hasMinimalContext - Whether user input has minimal context (bare URLs, etc.)
 * @param enableWebSearch - Whether web search is enabled for verification
 * @returns System message content (pure instructions, no user data)
 */
export function createSystemPrompt(
  context?: PromptContext,
  hasMinimalContext: boolean = false,
  enableWebSearch: boolean = false,
): string {
  const isRefinement = !!(context?.questionAnswers || context?.additionalContext);

  // Build metadata section (only includes our initial analysis, NOT user answers)
  let metadataSection = "";
  if (context?.initialAnalysis) {
    metadataSection = buildInitialAnalysisMetadata(context.initialAnalysis);
  }

  // Assemble system prompt with strict rule hierarchy
  const systemPrompt = `${getSystemContext()}

${getInputFormatInstructions()}

${getFundamentalPrinciple()}

${getSecurityBoundaries()}

${getCriticalFraudRules()}

${getCriticalRulesSummary()}

${getBankIdRules()}

${getVippsRules()}

${getUrlExtractionRules()}

${getMinimalContextUrlRules()}

${getUrlProcessingInstructions()}

${getBehavioralPatterns()}

${getDetectionRules()}

${getCategorizationOverride()}

${enableWebSearch ? getWebSearchInstructions() : ""}

${getFollowUpQuestionsGuide()}

${hasMinimalContext ? getMinimalContextWarning() : ""}

${metadataSection}

${isRefinement ? getRefinementRules() : ""}

${getOutputFormat(isRefinement)}

${getPreResponseValidation()}

${getConstraints()}`;

  return systemPrompt;
}

/**
 * Creates user message content from user input and refinement data
 *
 * User input is XML-escaped to prevent structure confusion.
 * Even if user types "</text_to_analyze>", it becomes "&lt;/text_to_analyze&gt;"
 *
 * @param text - User's input text
 * @param context - Optional refinement context (user-provided answers and context)
 * @returns XML-structured user message with escaped content
 */
export function createUserMessage(
  text: string,
  context?: PromptContext,
): string {
  // Build XML-structured message with escaped user content
  let userMessage = `<text_to_analyze>\n${escapeXml(text)}\n</text_to_analyze>`;

  // Add OCR text if present (from context.additionalText, typically)
  if (context?.additionalText) {
    userMessage += `\n\n<ocr_text>\n${escapeXml(context.additionalText)}\n</ocr_text>`;
  }

  // Add refinement question answers if present
  if (context?.questionAnswers && Object.keys(context.questionAnswers).length > 0) {
    userMessage += "\n\n<question_answers>";
    for (const [question, answer] of Object.entries(context.questionAnswers)) {
      // Escape both question and answer to prevent XML injection
      userMessage += `\n<qa>\n<question>${escapeXml(question)}</question>\n<answer>${escapeXml(answer)}</answer>\n</qa>`;
    }
    userMessage += "\n</question_answers>";
  }

  // Add additional context if present
  if (context?.additionalContext) {
    userMessage += `\n\n<additional_context>\n${escapeXml(context.additionalContext)}\n</additional_context>`;
  }

  return userMessage;
}

/**
 * Builds metadata section from initial analysis (app-generated, not user input)
 */
function buildInitialAnalysisMetadata(initialAnalysis: {
  category: string;
  score: number;
  risk: string;
  triggers: any[];
  recommendation: string;
  summary: string;
  mainIndicators?: string[];
  positiveIndicators?: string[];
  negativeIndicators?: string[];
  urlVerifications?: any[];
}): string {
  let metadata = "\n=== INITIAL ANALYSIS METADATA ===\n";
  metadata += `(This is from our first-pass analysis for context)\n\n`;
  metadata += `Category: ${initialAnalysis.category}\n`;
  metadata += `Risk: ${initialAnalysis.risk}\n`;
  metadata += `Score: ${initialAnalysis.score}\n`;
  metadata += `Recommendation: ${initialAnalysis.recommendation}\n`;
  metadata += `Summary: ${initialAnalysis.summary}\n`;

  if (initialAnalysis.mainIndicators?.length) {
    metadata += `Main Indicators: ${initialAnalysis.mainIndicators.join(", ")}\n`;
  }
  if (initialAnalysis.positiveIndicators?.length) {
    metadata += `Positive Indicators: ${initialAnalysis.positiveIndicators.join(", ")}\n`;
  }
  if (initialAnalysis.negativeIndicators?.length) {
    metadata += `Negative Indicators: ${initialAnalysis.negativeIndicators.join(", ")}\n`;
  }
  if (initialAnalysis.urlVerifications?.length) {
    metadata += `URL Verifications:\n${JSON.stringify(initialAnalysis.urlVerifications, null, 2)}\n`;
  }

  metadata += "\n=== END METADATA ===\n";

  return metadata;
}

/**
 * Returns minimal context warning section
 */
function getMinimalContextWarning(): string {
  return `\n=== ANALYSIS MODE ===
Minimal context detected: User provided URL or content with little explanation.
Apply extra scrutiny and default to higher suspicion levels per Minimal_Context_URL_Analysis rule.
===\n`;
}

/**
 * Returns instructions for parsing XML-structured user input
 */
function getInputFormatInstructions(): string {
  return `## INPUT FORMAT

The user message will be XML-structured with the following tags:

<text_to_analyze>
Main content to analyze for fraud indicators
</text_to_analyze>

<ocr_text>
Text extracted from uploaded image via OCR (if image was provided)
</ocr_text>

<question_answers>
<qa>
<question>Follow-up question from initial analysis</question>
<answer>User's answer</answer>
</qa>
</question_answers>

<additional_context>
Additional context provided by user during refinement
</additional_context>

All user input within these tags is XML-escaped (< becomes &lt;, etc.) to prevent structure confusion.
Parse the content within tags as the data to analyze.`;
}
