# Ask Simon Yu

Mobile-first multilingual Q&A website prepared for Cloudflare.

## Cloudflare
Connect the GitHub repository to Cloudflare Workers & Pages. Build command can be blank; output directory is `public`.

## AI
Add server-side environment variables/secrets: `AI_API_KEY`, `AI_MODEL`, and optionally `AI_BASE_URL`. Never put the API key in client-side JavaScript.

## Production note
Before public launch, expand retrieval so the model receives current approved source content, not only source URLs. Add source approval, refresh, abuse protection, and final privacy/terms text.
