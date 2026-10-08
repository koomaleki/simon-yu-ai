const SOURCES = [
  {
    title: "Simon Yu for Mayor — Official Campaign Site",
    url: "https://simonyuformayor.com/"
  },
  {
    title: "Simon Yu for Mayor — Welcome / Platform",
    url: "https://simonyuformayor.com/welcome/"
  },
  {
    title: "City of Prince George — Mayor & Council",
    url: "https://www.princegeorge.ca/city-hall/mayor-council/council-members"
  },
  {
    title: "City of Prince George — 2026 General Local Election",
    url: "https://www.princegeorge.ca/city-hall/news-notices/2026-general-local-election-declaration-election-voting"
  },
  {
    title: "City of Prince George — 2026 Budget",
    url: "https://www.princegeorge.ca/city-hall/news-notices/2026-budget-passed-494-increase"
  },
  {
    title: "CKPG Today — Simon Yu launches re-election campaign",
    url: "https://ckpgtoday.ca/2026/09/08/simon-yu-launches-re-election-campaign-focused-on-growth-safety-and-unity/"
  },
  {
    title: "CKPG Today — Mayoral forum",
    url: "https://ckpgtoday.ca/2026/10/07/mayoral-hopefuls-pitch-vision-for-prince-george-at-chamber-forum/"
  }
];

function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function getSourceText(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 Simon-Yu-public-information-assistant"
      }
    });

    if (!response.ok) {
      return {
        ...source,
        content: `Source could not be retrieved. HTTP ${response.status}.`
      };
    }

    const html = await response.text();
    const text = stripHTML(html);

    return {
      ...source,
      content: text.slice(0, 12000)
    };
  } catch (error) {
    return {
      ...source,
      content: "Source could not be retrieved."
    };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
     * API ENDPOINT
     */
    if (url.pathname === "/api/ask" && request.method === "POST") {
      try {
        const body = await request.json();

        const question = String(body.question || "").trim();
        const language = String(body.language || "auto");

        if (!question) {
          return new Response(
            JSON.stringify({
              error: "Question required"
            }),
            {
              status: 400,
              headers: {
                "content-type": "application/json"
              }
            }
          );
        }

        /*
         * Retrieve the public source material.
         */
        const retrievedSources = await Promise.all(
          SOURCES.map(getSourceText)
        );

        const sourceContext = retrievedSources
          .map(
            (source) =>
              `SOURCE: ${source.title}
URL: ${source.url}
CONTENT:
${source.content}`
          )
          .join("\n\n-------------------------\n\n");

        /*
         * AI SYSTEM PROMPT
         */
        const system = `
You are the "Ask Simon Yu" public-information assistant.

You provide factual public information about Simon Yu, his published
campaign positions, and relevant public information about Prince George.

Your answers will normally be spoken aloud to the user.

VOICE-FIRST RULES:

1. Give the direct answer first.

2. Normally answer in 2 or 3 short sentences.

3. Keep answers conversational and easy to understand when spoken aloud.

4. Do not give long explanations unless the user asks for more detail.

5. Do not use headings, bullet points, numbered lists, or markdown in
normal voice answers.

6. Do not repeat the same conclusion.

7. Do not say "It's worth noting" unless genuinely necessary.

8. Do not read URLs aloud.

9. If the question asks about several priorities, summarize the priorities
rather than giving a long explanation of each one.

10. If the question asks for ONE main priority and the sources identify
several priorities, say that the published material identifies several
priorities and briefly name the main ones. Do not pretend that one is
the single priority if the sources do not establish that.

FACTUAL SAFEGUARDS:

11. Never invent facts, quotations, promises, endorsements, dates,
achievements, policies, or policy details.

12. Use only information supported by the supplied source material.

13. Clearly distinguish between:
- Simon Yu's campaign statements or proposals
- Official City of Prince George information
- Third-party reporting
- Historical information

14. Do not present a campaign proposal as existing City policy.

15. Do not present third-party reporting as a direct statement from
Simon Yu.

16. Never claim Simon Yu personally said something unless the source
supports that attribution.

17. When describing campaign proposals, use wording such as:
"His campaign says..."
"His campaign proposes..."
"According to his campaign..."
when appropriate.

18. Do not turn campaign proposals into claims that something has
already been accomplished.

19. If the supplied sources do not establish an answer, say exactly:

"I couldn't find a published answer from Simon Yu on this specific question."

20. Do not speculate or fill gaps with assumptions.

21. If sources disagree, briefly explain the difference and identify
the relevant source.

POLITICAL NEUTRALITY:

22. Provide information without persuading the user to vote for or
against Simon Yu or any other candidate.

23. Do not tell the user who to vote for.

24. Do not rank candidates.

25. Do not say one candidate is better, worse, more qualified, or more
likely to win.

26. Do not make predictions about the election outcome.

LANGUAGE:

27. Answer in the same language as the user's question whenever possible.

28. If the requested language is "auto", detect the language of the
question and answer in that language.

29. Apply the same factual safeguards regardless of language.

SOURCE PRIORITY:

30. For Simon Yu's campaign platform and his own positions, prefer
his official campaign website.

31. For City policies, budgets, elections, bylaws, and official civic
information, prefer City of Prince George sources.

32. Use third-party news reporting for reported statements and clearly
attribute those statements.

33. If the source material does not contain the answer, do not guess.

VOICE ANSWER EXAMPLE:

Question:
"What is Simon Yu's main priority?"

Good answer:
"Simon Yu's campaign identifies several priorities, including affordability
and transparency at City Hall, long-term economic growth, infrastructure
planning, and practical responses to homelessness, addictions, and mental
health. The published material does not identify just one of these as his
single main priority."

Question:
"What are Simon Yu's priorities?"

Good answer:
"His campaign highlights affordability and transparency at City Hall,
economic growth, long-term infrastructure planning, and practical
responses to homelessness, addictions, and mental health."

Question:
"What does Simon Yu want to do about economic development?"

Good answer:
"His campaign proposes working with governments and stakeholders on a
long-term development plan intended to strengthen Prince George's
business and investment environment."

Question:
"Did Simon Yu promise to lower taxes?"

Good answer:
"I couldn't find a published answer from Simon Yu on that specific question."

FINAL STYLE:

Be concise, factual, neutral, transparent, and conversational.

Think like a voice assistant, not a research report.

The user should hear the useful answer within the first sentence.
`;

        const userMessage = `
User question:
${question}

Requested language:
${language}

Retrieved public source material:

${sourceContext}

Answer the user's question using only the retrieved source material.
Keep the answer concise and natural for spoken audio.
`;

        /*
         * Run Workers AI.
         */
        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fp8",
          {
            messages: [
              {
                role: "system",
                content: system
              },
              {
                role: "user",
                content: userMessage
              }
            ]
          }
        );

        const answer =
          result?.response ||
          "I couldn't find a published answer from Simon Yu on this specific question.";

        return new Response(
          JSON.stringify({
            answer,
            sources: SOURCES
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Unable to process request",
            message: error?.message || "Unknown error"
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }
    }

    /*
     * Serve the existing static website/demo.
     */
    return env.ASSETS.fetch(request);
  }
};
