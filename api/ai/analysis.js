import { pipeline } from '@xenova/transformers';

/**
 * --- AI MODEL 1: SENTIMENT ANALYSIS ---
 *
 * We use a "Singleton" pattern here. The first time `analyzeSentiment`
 * is called, it will create the `pipelineInstance`. Every subsequent
 * call will re-use the already-loaded model. This is crucial for performance.
 */
class SentimentPipeline {
  static task = 'sentiment-analysis';
  static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log("[AI Module] Loading Sentiment model (distilbert-base-uncased)...");
      this.instance = await pipeline(this.task, this.model, { progress_callback });
      console.log("[AI Module] Sentiment model loaded successfully.");
    }
    return this.instance;
  }
}

// The public function our server will call
export const analyzeSentiment = async (text) => {
  if (!text) return { error: "No text provided." };
  console.log(text);

  try {
    const sentimentAnalyzer = await SentimentPipeline.getInstance();
    const result = await sentimentAnalyzer(text);
    console.log(result);
    // The result from transformers.js is an array, we take the first item
    return result[0];
  } catch (e) {
    console.error(`[AI Module] ERROR during sentiment analysis: ${e}`);
    return { error: "An error occurred during analysis." };
  }
};


/**
 * --- AI MODEL 2: TRANSCRIPT ANALYSIS ---
 *
 * This is a direct Node.js port of our spaCy Matcher logic.
 * We use case-insensitive Regular Expressions to find key phrases.
 * This is extremely fast and has zero dependencies.
 */

// Define our keyword patterns as Regex
const deescalationPatterns = [
  /i understand/i,
  /are you okay/i,
  /i'm here to help/i,
  /what can i do/i,
  /let's talk/i,
  /calm down/i,
  /i'm listening/i
];

const gratitudePatterns = [
  /thank you/i,
  /thanks officer/i,
  /you've been helpful/i,
  /i appreciate it/i
];

// The public function our server will call
export const analyzeTranscript = (text) => {
  if (!text) return { error: "No text provided." };

  try {
    const foundTags = new Set();

    // Check for de-escalation
    for (const pattern of deescalationPatterns) {
      if (pattern.test(text)) {
        foundTags.add("De-escalation");
      }
    }

    // Check for gratitude
    for (const pattern of gratitudePatterns) {
      if (pattern.test(text)) {
        foundTags.add("Citizen Gratitude");
      }
    }

    let tagsList = Array.from(foundTags);
    if (tagsList.length === 0) {
      tagsList = ["Standard Procedure"];
    }

    return { tags: tagsList };

  } catch (e) {
    console.error(`[AI Module] ERROR during transcript analysis: ${e}`);
    return { error: "An error occurred during analysis." };
  }
};