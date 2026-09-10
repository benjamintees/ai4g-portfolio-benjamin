# Prompt Coach

Prompt Coach is a guided practice tool for first-year college and university students who are beginning to use generative AI for coursework. A draft such as “Help me learn Python” leaves the goal broad and gives no learner context, boundaries or useful output format. For a beginner, generic output can waste time and encourage repeated guessing instead of deliberate prompt practice. In our tested example, the coach identified those gaps and helped the learner write a more precise request about Python while loops.

## What it does

1. The learner enters a learning goal and a first prompt.
2. Lovable AI examines the learner’s wording and gives feedback on Goal, Context, Constraints and Output.
3. The learner writes a revision in their own words.
4. Lovable AI compares both versions and returns the improvements, one remaining gap and one next step.

The output is coaching about the prompt. The app does not answer or complete the learner’s assignment.

Lovable performs a necessary part of the product. The app was created and integrated in Lovable, and its server-side functions call Lovable’s AI gateway. Without this AI step, the app could show a generic checklist but could not respond to the learner’s actual wording or compare two drafts.

## Users and SDG

The intended user is a beginner higher-education student with a connected device, internet access, English reading ability and basic familiarity with an AI chat interface. It is not aimed at advanced prompt writers or students seeking completed assessed work. The current version also does not serve learners who need another language or an offline tool.

Prompt Coach addresses [UN Sustainable Development Goal 4: Quality Education](https://sdgs.un.org/goals/goal4). It gives beginners structured practice in digital and AI literacy by making them revise and reflect instead of outsourcing the learning task.

## Submission files

- [`prompt-coach/`](prompt-coach/) contains the working product and technical documentation.
- [`Prompt-Coach-Hackathon-Deck.pptx`](Prompt-Coach-Hackathon-Deck.pptx) contains the presentation slides.
- [`demo/prompt-coach-screen-demo.webm`](demo/prompt-coach-screen-demo.webm) is a 57-second real browser recording with explanatory labels. It shows the coach’s feedback and example revision, the learner’s own revision, and the final AI comparison.
- [`ETHICAL_REFLECTION.md`](ETHICAL_REFLECTION.md) explains risks, consequences, safeguards and next steps.

## How to run it

From the portfolio repository root:

```bash
cd "Term 1/Week 1/hackathon/prompt-coach"
npm install
npm run dev
```

The AI calls require `LOVABLE_API_KEY` in the connected Lovable runtime. Never commit that secret. The app can still be built locally with `npm run build`. The Lovable-connected source mirror is available at [Maxlopez02/prompt-coach-ai4g](https://github.com/Maxlopez02/prompt-coach-ai4g).

## Team record

Benjamin van Teeseling ([`benjamintees`](https://github.com/benjamintees)) contributed to the idea and concept. Max Lopez built and refined the working prototype.
