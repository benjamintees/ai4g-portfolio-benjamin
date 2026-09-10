# Prompt Coach

Prompt Coach is a one-page learning app for beginner college and university students who are learning how to ask generative AI for useful study support. It addresses a concrete problem: a vague prompt can produce generic help, while beginners may not know what information their request is missing.

## What it does

The learner completes a three-stage practice loop:

1. **Draft** — name a learning goal and write a first prompt.
2. **Refine** — receive AI feedback on Goal, Context, Constraints and Output, then write a revision in their own words.
3. **Reflect** — compare both drafts, see what became clearer and take away one skill for the next prompt.

The AI performs a necessary runtime step: it interprets the learner's actual wording and gives contextual feedback and comparison. A fixed checklist could teach the four ingredients, but it could not explain how a specific sentence is clear or missing context. The app coaches the prompt and is instructed not to complete the student's assignment.

## SDG 4 — Quality Education

The app supports [UN Sustainable Development Goal 4](https://sdgs.un.org/goals/goal4) by giving beginner students guided practice in digital and AI literacy. It does not claim to solve unequal access to education, and its learning effectiveness still needs testing with students.

## How it was built

The original working product and native server-side AI flow were created in Lovable for the Hackathon 1 tool requirement. Its Lovable project history is preserved. Codex was then used for a later source-code refinement of the interface, responsive behavior, motion, accessibility and validation. The final app remains integrated with Lovable and continues to use the original Lovable AI service.

Run locally with `npm install` and `npm run dev`. The main UI is `src/components/prompt-coach.tsx`; the server functions are in `src/lib/coach.functions.ts` and `src/lib/ai-coach.server.ts`.

## Ethics and limitations

- Prompt text is sent to an AI service for analysis. Learners are warned not to enter personal details, student numbers or confidential coursework. No account or in-app history is provided; this does not imply that the AI provider never retains data.
- AI feedback can be mistaken, inconsistent or biased. The interface calls it guidance rather than a grade and tells learners to use their own judgment and follow course rules.
- The app is in English, needs a connected device and internet access, and assumes basic familiarity with AI chat tools. These choices can exclude learners with limited connectivity, assistive technology incompatibilities, lower digital confidence or other language needs.
- The coach's model prompt is optional and hidden until requested so learners attempt their own revision first. It is a model to learn from, not a finished academic answer.
- A learner could still misuse the advice to request prohibited work from another AI tool. The app reduces this risk through examples that ask for explanation and practice, plus reminders to disclose AI help where required.

## Verification

The local refinement has automated coverage for validation, feedback, revision, comparison, error recovery, reset and copying. It also has responsive desktop and 390px mobile checks and respects `prefers-reduced-motion`.
