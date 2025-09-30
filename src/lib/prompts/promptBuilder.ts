/**
 * Prompt Builder
 * Assembles modular prompt sections into complete fraud detection prompt
 *
 * RULE HIERARCHY (highest to lowest priority):
 * 1. Critical Fraud Rules (BankID/Vipps phishing, urgent threats) - ALWAYS fraud
 * 2. Authentication Service Protection (BankID, Vipps context-aware detection)
 * 3. Behavioral Patterns (phishing tactics, social engineering)
 * 4. URL Verification (domain legitimacy checks with dynamic verification)
 * 5. Context Analysis (sender, relationship, expectations)
 */

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
 * Creates enhanced fraud detection prompt with modular sections
 * @param text - Input text to analyze
 * @param context - Optional context (refinement, additional info, image data)
 * @param hasMinimalContext - Whether input has minimal context (bare URLs, etc.)
 * @param enableWebSearch - Whether web search is enabled for verification
 * @returns Complete assembled prompt string
 */
export function createEnhancedFraudPrompt(
  text: string,
  context?: PromptContext,
  hasMinimalContext: boolean = false,
  enableWebSearch: boolean = false,
): string {
  const isRefinement = !!(context?.questionAnswers || context?.additionalContext);

  // Build context section if refinement
  let contextSection = "";
  if (isRefinement) {
    contextSection = buildContextSection(context);
  }

  // Assemble complete prompt with strict rule hierarchy
  const basePrompt = `${getSystemContext()}

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

<input_text>
${text}
</input_text>

${hasMinimalContext ? getMinimalContextWarning() : ""}

${contextSection}

${isRefinement ? getRefinementRules() : ""}

${getOutputFormat(isRefinement)}

${getPreResponseValidation()}

${getConstraints()}`;

  return basePrompt;
}

/**
 * Builds context section for refinement analysis
 */
function buildContextSection(context?: PromptContext): string {
  if (!context) return "";

  let contextSection = "<context_provided>\n";

  if (context.initialAnalysis) {
    contextSection += `<initial_analysis>
Category: ${context.initialAnalysis.category}
Risk: ${context.initialAnalysis.risk}
Score: ${context.initialAnalysis.score}
Recommendation: ${context.initialAnalysis.recommendation}
Summary: ${context.initialAnalysis.summary}
${
  context.initialAnalysis.mainIndicators?.length
    ? `Main Indicators: ${context.initialAnalysis.mainIndicators.join(", ")}`
    : ""
}
${
  context.initialAnalysis.positiveIndicators?.length
    ? `Positive Indicators: ${context.initialAnalysis.positiveIndicators.join(", ")}`
    : ""
}
${
  context.initialAnalysis.negativeIndicators?.length
    ? `Negative Indicators: ${context.initialAnalysis.negativeIndicators.join(", ")}`
    : ""
}
${
  context.initialAnalysis.urlVerifications?.length
    ? `URL Verifications: ${JSON.stringify(context.initialAnalysis.urlVerifications, null, 2)}`
    : ""
}
</initial_analysis>\n`;
  }

  if (context.questionAnswers && Object.keys(context.questionAnswers).length > 0) {
    contextSection += "<user_answers>\n";
    for (const [question, answer] of Object.entries(context.questionAnswers)) {
      contextSection += `Q: ${question}\nA: ${answer}\n\n`;
    }
    contextSection += "</user_answers>\n";
  }

  if (context.additionalContext) {
    contextSection += `<additional_context>\n${context.additionalContext}\n</additional_context>\n`;
  }

  if (context.additionalText) {
    contextSection += `<additional_text>\n${context.additionalText}\n</additional_text>\n`;
  }

  contextSection += "</context_provided>";

  return contextSection;
}

/**
 * Returns minimal context warning section
 */
function getMinimalContextWarning(): string {
  return `
<context_warning>
USER PROVIDED MINIMAL CONTEXT - Apply extra scrutiny
This appears to be a URL or content with little explanation
Default to higher suspicion levels per Minimal_Context_URL_Analysis rule
</context_warning>`;
}