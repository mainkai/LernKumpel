// Configuration for the Mal-Atelier model benchmark (see bench.mjs).
// Paths are relative to this file. Comment models in/out to choose what gets compared.

export default {
  concurrency: 4,
  timeoutMs: 240000,
  retries: 1,

  eval: {
    // How often each drawing is sent to each model (to measure score stability).
    runs: 2,

    // Drawings to rate. `quality` is your own expected ranking (higher = better drawing,
    // use 0 for "does not match the task"). It is only used to check whether a model
    // orders the drawings the same way you would.
    drawings: [
      { file: 'drawings/vogel.png', task: 'einen Vogel', quality: 3 },
      { file: 'drawings/2026-10-06T07-28-37-malatelier-kai-einen-weltraumbahnhof-auf-dem-mond-zeichnung.png', task: 'einen Weltraumbahnhof auf dem Mond', quality: 7 },
      // { file: 'drawings/vogel-gut.png', task: 'einen Vogel', quality: 5 },
      // { file: 'drawings/vogel-gekritzel.png', task: 'einen Vogel', quality: 1 },
      // { file: 'drawings/haus-statt-vogel.png', task: 'einen Vogel', quality: 0 }
    ],

    models: [
      // current default / baseline
      'google/gemini-3-flash-preview',
      'bytedance-seed/seed-2.0-mini',
      'openrouter/free',
      // new
      'google/gemini-3.8-flash',
      'google/gemini-3.5-flash-lite',
      'openai/gpt-6-luna',
      'qwen/qwen3.8-flash',
      'qwen/qwen3.7-flash',
      'bytedance-seed/seed-2-1-turbo',
      'xiaomi/mimo-v2.6-flash',
      'deepseek/deepseek-v4.1-flash',
      'z-ai/glm-5.3-flash',
      'x-ai/grok-4.7'
      // 'google/gemma-4-26b-a4b-it:free' // rate-limited upstream in every test run
      // superseded:
      // 'qwen/qwen3.5-flash-02-23',
      // 'bytedance-seed/seed-1.6-flash',
      // 'openai/gpt-4o-mini',
      // 'openai/gpt-5-nano',
      // 'moonshotai/kimi-k2.5'
    ]
  },

  image: {
    //drawing: { file: 'drawings/vogel.png', task: 'einen Vogel' },
    drawing: { file: 'drawings/2026-10-06T07-28-37-malatelier-kai-einen-weltraumbahnhof-auf-dem-mond-zeichnung.png', task: 'einen Weltraumbahnhof auf dem Mond' },
    // Leave empty to use the app's default prompt.
    prompt: '',
    runs: 1,

    // Optional: a vision model rates each result (keeps idea of the drawing, style, child-friendliness).
    judge: { enabled: true, model: 'google/gemini-3.8-flash' },

    models: [
      // current default / baseline
      'black-forest-labs/flux.2-klein-4b',
      'google/gemini-3.1-flash-image',
      'google/gemini-3-pro-image',
      // new
      'bytedance-seed/seedream-5-0-flash',
      'sourceful/riverflow-v2.5-fast',
      'google/gemini-3.1-flash-lite-image',
      'bytedance-seed/seedream-5-0-lite',
      'bytedance-seed/seedream-5-0-pro',
      'x-ai/grok-imagine-image-2.0',
      'microsoft/mai-image-2.6-flash',
      'sourceful/riverflow-v2.5-pro',
      // only available via OpenRouter's /images endpoint, which the app does not use (yet):
      // 'tencent/hy-image-v3.5-preview',
      // 'meta/muse-image',
      // 'krea/krea-2-medium-turbo',
      // 'black-forest-labs/flux-3-image',
      // 'qwen/qwen-image-3',
      // 'openai/gpt-image-2',
      // superseded:
      // 'google/gemini-2.5-flash-image',
      // 'bytedance-seed/seedream-4.5',
      // 'openai/gpt-5-image-mini',
      // 'black-forest-labs/flux.2-flex',
      // 'black-forest-labs/flux.2-max'
    ]
  }
};
