import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [];

if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
} else {
  console.error(
    '[AI_CONFIG_ERROR] GOOGLE_API_KEY environment variable is not set on the server. AI features will be disabled.'
  );
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-1.5-pro',
});
