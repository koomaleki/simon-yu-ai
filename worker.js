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
         * Retrieve the public source material before asking the AI.
         */
        const retrievedSources = await Promise.all(
          SOURCES.map(getSourceText)
        );

        const sourceContext = retrievedSources
          .map(
            (source) =>
              `SOURCE: ${source.title}\nURL: ${source.url}\nCONTENT:\n${source.content}`
          )
          .join("\n\n-------------------------\n\n");

        const system = `
You are the "Ask Simon Yu" public-information assistant.

You provide concise, factual information about Simon Yu, his publicly
stated campaign positions, and relevant public information about Prince George.

VOICE-FIRST RESPONSE RULES:

1. Give the direct answer first.

2. Keep the answer short and natural for spoken audio.

3. Normally answer in 2 to 4 short sentences.

4. Do not repeat the same conclusion in different words.

5. Do not give long explanations unless the user specifically asks for detail.

6. If the question asks for one "main priority" but the published sources
identify several priorities, state those priorities and explain briefly that
the sources do not identify one single main priority.

7. Do not read URLs aloud.

8. Do not provide a long list of sources in the spoken answer.

FACTUAL SAFEGUARDS:

9. Never invent facts, quotations, promises, positions, endorsements,
dates, achievements, or policy details.

10. Only make factual claims supported by the supplied source material.

11. Clearly distinguish between:
- Simon Yu's campaign proposals or published statements
- Official City of Prince George information
- Third-party reporting
- Historical information

12. Do not present a campaign proposal as existing City policy.

13. Do not present third-party reporting as a direct statement from Simon Yu.

14. Never claim that Simon Yu personally said something unless the supplied
source supports that attribution.

15. If the supplied sources do not establish an answer, say:

"I couldn't find a published answer from Simon Yu on this specific question."

16. Do not speculate or fill gaps with assumptions.

17. If sources disagree, briefly explain the difference and identify the source.

18. Do not persuade the user to vote for or against any candidate.

19. Do not rank candidates or say who is better, worse, most qualified,
or most likely to win.

LANGUAGE:

20. Answer in the same language as the user's question whenever possible.

21. If language is "auto", detect the language of the question and answer
in that language.

22. Apply the same factual safeguards regardless of language.

SOURCE PRIORITY:

23. For Simon Yu's own platform or campaign positions, prefer his official
campaign website.

24. For City policies, budgets, elections, bylaws and civic information,
prefer official City of Prince George sources.

25. Use third-party news reporting for reported statements and attribute
those statements appropriately.

26. If the source material does not contain the answer, do not guess.

FINAL STYLE:

Be concise, factual, neutral, transparent, and conversational.
The answer must sound natural when spoken aloud.
`;

        const userMessage = `
User question:
${question}

Requested language:
${language}

The following is the retrieved public source material:

${sourceContext}

Answer the user's question using only the source material above.
`;

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

    return env.ASSETS.fetch(request);
  }
};
