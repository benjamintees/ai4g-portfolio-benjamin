import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DimensionStatus = "Clear" | "Needs work" | "Missing";

export type Dimension = {
  name: "Goal" | "Context" | "Constraints" | "Output";
  status: DimensionStatus;
  explanation: string;
};

export type Analysis = {
  dimensions: Dimension[];
  works: string[];
  improve: string[];
  example: string;
};

export type Comparison = {
  improved: string[];
  remainingGap: string;
  nextTip: string;
};

const AnalyzeInput = z.object({
  goal: z.string().min(1).max(300),
  draft: z.string().min(1).max(1200),
});

const CompareInput = z.object({
  goal: z.string().min(1).max(300),
  draft: z.string().min(1).max(1200),
  revision: z.string().min(1).max(1200),
});

const TUTOR_RULES = `You are Prompt Coach, a patient writing coach for beginner higher-education students learning to write better prompts for generative AI tools (UN SDG 4: Quality Education).
Rules you must never break:
- Coach the prompt, never do the student's academic work. Never answer, solve, or complete the task described in their prompt.
- Your "coach's example" must be a model prompt about their topic, not an answer to it.
- Use plain, encouraging language; short sentences; no jargon.
- Be specific about what is present or missing in their wording.`;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    dimensions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: ["Goal", "Context", "Constraints", "Output"] },
          status: { type: "string", enum: ["Clear", "Needs work", "Missing"] },
          explanation: { type: "string" },
        },
        required: ["name", "status", "explanation"],
      },
    },
    works: { type: "array", items: { type: "string" } },
    improve: { type: "array", items: { type: "string" } },
    example: { type: "string" },
  },
  required: ["dimensions", "works", "improve", "example"],
};

const comparisonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    improved: { type: "array", items: { type: "string" } },
    remainingGap: { type: "string" },
    nextTip: { type: "string" },
  },
  required: ["improved", "remainingGap", "nextTip"],
};

export const analyzePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<Analysis> => {
    const { callCoach, CoachError } = await import("./ai-coach.server");
    try {
      const result = await callCoach<Analysis>({
        instructions: `${TUTOR_RULES}
Evaluate the draft prompt on exactly four dimensions in this order: Goal, Context, Constraints, Output.
- Goal: is the learning aim explicit?
- Context: does the prompt say who the learner is, their level, course, or situation?
- Constraints: limits such as length, tone, difficulty, language, "explain don't solve".
- Output: the requested shape, e.g. steps, analogy, checklist, example.
Give each a status and one or two sentences of explanation.
"works": 1-3 short bullets naming what already works. "improve": 2-3 short bullets on what to improve next.
"example": one improved model prompt (3-6 lines) the student can learn from, phrased so it asks for explanation and practice, never for the finished assignment.`,
        input: `Learning goal: ${data.goal}\n\nDraft prompt:\n${data.draft}`,
        schemaName: "prompt_analysis",
        schema: analysisSchema,
      });
      return result;
    } catch (error) {
      if (error instanceof CoachError) throw new Error(error.message);
      throw error;
    }
  });

export const comparePrompts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CompareInput.parse(input))
  .handler(async ({ data }): Promise<Comparison> => {
    const { callCoach, CoachError } = await import("./ai-coach.server");
    try {
      return await callCoach<Comparison>({
        instructions: `${TUTOR_RULES}
Compare the student's original prompt with their revision.
"improved": 1-4 short bullets naming which dimensions (Goal, Context, Constraints, Output) got better and how.
"remainingGap": exactly one remaining weakness, stated kindly and concretely.
"nextTip": exactly one specific next step they can apply to their next prompt.`,
        input: `Learning goal: ${data.goal}\n\nOriginal prompt:\n${data.draft}\n\nRevised prompt:\n${data.revision}`,
        schemaName: "prompt_comparison",
        schema: comparisonSchema,
      });
    } catch (error) {
      if (error instanceof CoachError) throw new Error(error.message);
      throw error;
    }
  });
