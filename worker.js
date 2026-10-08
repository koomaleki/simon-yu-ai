const DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111827">
<title>Ask Simon Yu</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#f4f6f8;
  color:#17202a;
}
.card{
  max-width:680px;
  margin:0 auto;
  min-height:100vh;
  padding:28px 20px;
  background:white;
}
h1{margin:0 0 4px;font-size:30px}
.role{color:#667085;margin-bottom:22px}
.intro{line-height:1.5;color:#475467}
#mic{
  width:100%;
  border:0;
  border-radius:18px;
  padding:20px;
  margin:18px 0 8px;
  background:#111827;
  color:white;
  font-size:21px;
  font-weight:700;
  cursor:pointer;
}
#mic.listening{
  background:#b42318;
}
#stop{
  width:100%;
  border:1px solid #d0d5dd;
  border-radius:14px;
  padding:13px;
  background:white;
  font-size:16px;
}
#status{
  text-align:center;
  margin:18px 0;
  color:#667085;
}
.box{
  margin-top:16px;
  padding:17px;
  border-radius:14px;
  background:#f7f8fa;
  line-height:1.55;
}
.label{
  font-size:12px;
  font-weight:700;
  color:#667085;
  text-transform:uppercase;
  margin-bottom:7px;
}
#answer{
  min-height:80px;
}
.source{
  display:block;
  margin-top:12px;
  font-size:13px;
  color:#475467;
  text-decoration:none;
}
.disclaimer{
  margin-top:24px;
  padding-top:18px;
  border-top:1px solid #eaecf0;
  font-size:12px;
  line-height:1.5;
  color:#667085;
}
</style>
</head>

<body>
<div class="card">

<h1>Ask Simon Yu</h1>
<div class="role">Candidate for Mayor of Prince George</div>

<p class="intro">
Ask a question about Simon Yu, his campaign, or relevant public information.
You can speak naturally. The assistant will answer from published public sources.
</p>

<button id="mic">🎙️ SCAN &amp; ASK QUESTIONS</button>
<button id="stop">Stop listening</button>

<div id="status">Tap the microphone and speak.</div>

<div class="box">
  <div class="label">Your question</div>
  <div id="heard">—</div>
</div>

<div class="box">
  <div class="label">Answer</div>
  <div id="answer">—</div>
  <div id="sources"></div>
</div>

<div class="disclaimer">
This is an AI public-information assistant. It is not Simon Yu
and does not provide voting recommendations. Campaign positions
are identified as campaign positions and should not be confused
with City policy.
</div>

</div>

<script>
const mic = document.getElementById("mic");
const stop = document.getElementById("stop");
const status = document.getElementById("status");
const heard = document.getElementById("heard");
const answer = document.getElementById("answer");
const sources = document.getElementById("sources");

let recognition = null;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

function speak(text, language) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  if (language && language !== "auto") {
    utterance.lang = language;
  } else {
    utterance.lang = "en-CA";
  }

  speechSynthesis.speak(utterance);
}

async function askAI(question) {
  status.textContent = "Preparing answer...";
  answer.textContent = "Thinking...";
  sources.innerHTML = "";

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        question: question,
        language: "auto"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    answer.textContent =
      data.answer ||
      "I couldn't find a published answer from Simon Yu on this specific question.";

    if (Array.isArray(data.sources)) {
      data.sources.forEach(source => {
        const a = document.createElement("a");
        a.className = "source";
        a.href = source.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Source: " + source.title;
        sources.appendChild(a);
      });
    }

    status.textContent = "Answer ready.";

    speak(data.answer, data.language || "auto");

  } catch (error) {
    answer.textContent =
      "Sorry, I couldn't process that question right now.";
    status.textContent = "Connection error.";
  }
}

if (SpeechRecognition) {

  recognition = new SpeechRecognition();

  recognition.lang = "en-CA";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    mic.classList.add("listening");
    mic.textContent = "🎙️ Listening...";
    status.textContent = "Speak your question now.";
  };

  recognition.onresult = event => {

    const question =
      event.results[0][0].transcript.trim();

    heard.textContent = question;

    askAI(question);
  };

  recognition.onerror = event => {
    status.textContent =
      "Microphone error: " + event.error;
    mic.classList.remove("listening");
    mic.textContent = "🎙️ SCAN & ASK QUESTIONS";
  };

  recognition.onend = () => {
    mic.classList.remove("listening");
    mic.textContent = "🎙️ SCAN & ASK QUESTIONS";
  };

  mic.onclick = () => {
    speechSynthesis.cancel();
    recognition.start();
  };

  stop.onclick = () => {
    if (recognition) recognition.stop();
    speechSynthesis.cancel();
    status.textContent = "Stopped.";
    mic.classList.remove("listening");
    mic.textContent = "🎙️ SCAN & ASK QUESTIONS";
  };

} else {

  status.textContent =
    "Voice input is not supported by this browser. Please use Chrome or Safari.";

  mic.disabled = true;
}
</script>

</body>
</html>`;

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*"
    }
  });
}

function stripHTML(html) {
  return html
    .replace(/<script[\\s\\S]*?<\\/script>/gi, " ")
    .replace(/<style[\\s\\S]*?<\\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\\s+/g, " ")
    .trim();
}

async function getSourceText(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "SimonYuAI/1.0"
      }
    });

    if (!response.ok) return "";

    const html = await response.text();

    return stripHTML(html).slice(0, 12000);

  } catch {
    return "";
  }
}

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    /*
     * HOME PAGE
     * The QR code should point here.
     */
    if (
      url.pathname === "/" ||
      url.pathname === "/demo"
    ) {
      return new Response(DEMO_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8"
        }
      });
    }

    /*
     * AI QUESTION API
     */
    if (
      url.pathname === "/api/ask" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const question =
          String(body.question || "").trim();

        const language =
          String(body.language || "auto");

        if (!question) {
          return json(
            { error: "Question required" },
            400
          );
        }

        /*
         * Retrieve public source content.
         */
        const sourceResults = await Promise.all(
          SOURCES.map(async source => ({
            ...source,
            content: await getSourceText(source)
          }))
        );

        const usableSources =
          sourceResults.filter(
            source => source.content
          );

        const context = usableSources
          .map(source =>
            `
SOURCE:
${source.title}
${source.url}

CONTENT:
${source.content}
`
          )
          .join("\\n-------------------\\n");

        const system = `
You are the "Ask Simon Yu" public-information assistant.

You answer questions about Simon Yu, his campaign,
and relevant public information about Prince George.

STRICT RULES:

1. Use ONLY the supplied source content.

2. Never invent facts, quotations, promises,
positions, dates, achievements, endorsements,
or policies.

3. Clearly distinguish:
- Simon Yu campaign proposals
- City of Prince George information
- third-party reporting
- historical information

4. Never describe a campaign proposal as existing
City policy.

5. Never describe third-party reporting as a direct
quote or statement by Simon Yu.

6. If the supplied sources do not establish the answer,
say:

"I couldn't find a published answer from Simon Yu on this specific question."

7. Answer in the same language as the user's question
when language is "auto".

8. Keep answers concise and suitable for spoken audio.

9. Do not recommend how the user should vote.

10. Do not claim to be Simon Yu.

11. When possible, mention which source supports the answer.
`;

        const userMessage = `
USER QUESTION:
${question}

REQUESTED LANGUAGE:
${language}

PUBLIC SOURCE MATERIAL:
${context}
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

        return json({
          answer,
          language,
          sources: usableSources.map(source => ({
            title: source.title,
            url: source.url
          }))
        });

      } catch (error) {

        return json({
          error: "Unable to process request",
          message: error?.message || "Unknown error"
        }, 500);

      }
    }

    return new Response("Not found", {
      status: 404
    });
  }
};
