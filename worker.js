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

        // Approved/public sources
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

        const system = `
You are the "Ask Simon Yu" public-information assistant.

Your job is to answer questions about Simon Yu, his campaign,
his published platform, and relevant public information about
the City of Prince George.

IMPORTANT RULES:

1. Never invent facts, quotations, promises, positions,
   endorsements, dates, achievements, or policy details.

2. Clearly distinguish between:
   - Simon Yu campaign proposals
   - Official City of Prince George information
   - Third-party reporting
   - Historical information

3. Do not present a campaign proposal as an existing City policy.

4. Do not present third-party reporting as a direct statement
   from Simon Yu.

5. If the available information does not establish an answer,
   say exactly:

   "I couldn't find a published answer from Simon Yu on this specific question."

6. Answer in the requested language.

7. If language is "auto", answer in the same language
   as the user's question.

8. Be concise, factual, neutral and transparent.

9. Never claim that Simon Yu said something unless it is
   supported by the published information provided to you.

The user may ask questions in English, French, Chinese, Persian,
Punjabi, Hindi, Spanish, German, Arabic, or another language.
`;

        const userMessage = `
User question:
${question}

Requested language:
${language}

Approved public sources:

${sources
  .map((source) => `${source.title}\n${source.url}`)
  .join("\n\n")}

Important:
The source list identifies approved public sources.
Do not invent information that is not supported by these sources.
`;

        // Cloudflare Workers AI
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

    // Serve the website
    return env.ASSETS.fetch(request);
  }
};
