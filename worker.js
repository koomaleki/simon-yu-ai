export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API endpoint
    if (url.pathname === "/api/ask" && request.method === "POST") {
      try {
        const body = await request.json();
        const question = String(body.question || "").trim();
        const language = String(body.language || "auto");

        if (!question) {
          return new Response(
            JSON.stringify({ error: "Question required" }),
            {
              status: 400,
              headers: { "content-type": "application/json" }
            }
          );
        }

        const sources = [
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

        const key = env.AI_API_KEY;

        if (!key) {
          return new Response(
            JSON.stringify({
              answer:
                "The website is deployed, but its AI service has not been connected yet. An administrator must add the AI API key before live Q&A is enabled.",
              sources
            }),
            {
              headers: { "content-type": "application/json" }
            }
          );
        }

        const base =
          env.AI_BASE_URL || "https://api.openai.com/v1";

        const model =
          env.AI_MODEL || "gpt-4o-mini";

        const system = `
You are the Ask Simon Yu public-information assistant.

Answer only from the supplied published sources.

Never invent quotations, positions, promises, dates, achievements,
endorsements, or policy details.

Clearly distinguish:
1. Simon Yu campaign proposals
2. Official City of Prince George information
3. Third-party reporting
4. Historical information

If the supplied sources do not answer the question, say:

"I couldn't find a published answer from Simon Yu on this specific question."

Answer in the requested language.
If the requested language is "auto", answer in the same language as the question.

Be concise, factual, neutral, and transparent.
`;

        const userMessage = `
Question:
${question}

Requested language:
${language}

Published sources:
${sources
  .map((s) => `${s.title} — ${s.url}`)
  .join("\n")}
`;

        const response = await fetch(
          `${base}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content: system
                },
                {
                  role: "user",
                  content: userMessage
                }
              ],
              temperature: 0.1
            })
          }
        );

        if (!response.ok) {
          throw new Error("AI request failed");
        }

        const result = await response.json();

        const answer =
          result.choices?.[0]?.message?.content ||
          "I couldn't find a published answer from Simon Yu on this specific question.";

        return new Response(
          JSON.stringify({
            answer,
            sources
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
            error: "Unable to process request"
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

    // Serve the website
    return env.ASSETS.fetch(request);
  }
};
