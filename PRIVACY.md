# Privacy

Effective: July 28, 2026. Updated: November 15, 2026.

YouTube Digest is a GitHub-only, bring-your-own-key Chrome extension. It has no YouTube Digest account, developer-operated backend, analytics, advertising, or telemetry.

## Data the extension handles

Depending on the feature you use, YouTube Digest handles:

- the canonical URL and video ID of the active YouTube video;
- the video's own caption track, read inside the YouTube page;
- transcript text and timestamps;
- video metadata such as title, channel, description, and duration;
- text you select in the transcript and nearby transcript context;
- transcript context around a timestamped note;
- content you ask to translate;
- notes you save;
- chat questions, answers, and the conversation history you create; and
- subtitle source, AI endpoint, model, and API key settings, plus cached transcript, digest, and translation results.

## Where data goes

### YouTube captions (default, local)

By default YouTube Digest reads the caption track that the YouTube page already loads. Parsing happens in your browser on the YouTube page. That caption data is not sent to the developer or to any transcript service.

### Supadata (optional fallback)

When free captions cannot be read and you have enabled the fallback, YouTube Digest sends the canonical YouTube video URL to `https://api.supadata.ai` with your Supadata API key. Supadata returns the transcript and timestamps. A Supadata key is optional and is only used by this fallback path.

### AI endpoint you configure (DeepSeek by default)

When you use an AI feature, YouTube Digest sends content to the AI endpoint configured in Settings. The default is DeepSeek V4 Flash at `https://api.deepseek.com`:

- transcript plus relevant title, channel, description, or duration for an overview;
- selected text plus nearby transcript context for an explanation;
- small semantic transcript batches currently needed for progressive Chinese translation, or requested overview or explanation content;
- nearby transcript context and video metadata when polishing a saved note; and
- the transcript context, recent chat messages, and your question when you ask in the chat tab.

You can edit the endpoint and model in Settings. If you enter an endpoint on another domain, Chrome asks for permission to access that domain once, and the extension keeps using that endpoint until you change it. Requests go directly from the extension to the endpoint you configured with the key you supply. YouTube Digest's developer does not proxy or receive these requests, and the extension does not choose or share additional providers on its own.

Those services process data under their own terms, privacy policies, retention practices, and account settings. Do not send confidential, personal, or regulated content unless their terms and your obligations permit it.

## Local storage and retention

YouTube Digest uses Chrome's extension storage and the open side panel, not a YouTube Digest cloud service.

- Subtitle source, AI endpoint, model, and API keys remain on the device in Chrome's extension storage.
- Saved notes remain until you delete them or remove or clear the extension's data. The extension keeps up to 100 notes.
- Chat conversations stay in the open side panel for the current video and are cleared when you switch videos. They are not saved to Chrome storage.
- Recent transcript, digest, and per-segment translation cache entries are stored locally. The cache is limited to 20 videos, and entries older than 30 days are removed when the side panel opens.

Chrome extension storage is not a password vault. Anyone with sufficient access to your browser profile or device may be able to recover locally stored keys or content. Use scoped keys where providers support them, set spending limits, and rotate or revoke a key if the device or browser profile is compromised.

To remove data:

- delete individual saved notes in YouTube Digest;
- use the Options page to clear cached digests, delete all notes, or reset all extension data;
- remove the extension or clear its stored data from Chrome to delete all local settings, keys, notes, and cache entries; and
- revoke keys at your AI provider or at Supadata to stop their future use.

Clearing local data does not delete information already processed or retained by Supadata or by the AI provider you configured. Use each service's controls for service-side requests.

## Permissions

YouTube Digest uses Chrome permissions for these purposes:

- `sidePanel`: display the YouTube Digest interface beside YouTube.
- `storage`: store settings, keys, notes, and cached results locally.
- `tabs`: identify and interact with the active YouTube tab.
- `scripting`: coordinate the extension's YouTube page controls.
- YouTube host access: read the active video's URL and metadata, read its caption track inside the page, and provide timestamp controls.
- Supadata host access: retrieve transcripts as the optional fallback.
- DeepSeek host access: provide AI overviews, explanations, translation, note polishing, and chat through DeepSeek.
- Optional host permissions for other AI endpoints: requested only when you save a custom endpoint in Settings.

YouTube Digest does not use these permissions to monitor general browsing activity, and it does not request host access for domains you have not configured.

## No sale or advertising use

YouTube Digest does not sell personal information, build advertising profiles, or share data with data brokers. It does not include analytics SDKs.

## Changes

Privacy-relevant changes will be documented in this file and in the repository history. Review updates before installing a new version.

## Questions

This repository does not provide a public support or issue channel. Review this policy, the source code, and each provider's documentation before using the extension. For a vulnerability or accidental secret exposure, follow the private process in [SECURITY.md](SECURITY.md).
