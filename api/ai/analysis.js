import { pipeline } from '@xenova/transformers';
/**
 * --- AI MODEL 1: SENTIMENT ANALYSIS (for DGP Dashboard) ---
 *
 * Singleton pattern to load the model only once.
 */

class SentimentPipeline {
  static task = 'sentiment-analysis';
  static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      console.log("[AI Module] Loading Sentiment model (distilbert-base-uncased)...");
      this.instance = await pipeline(this.task, this.model);
      console.log("[AI Module] Sentiment model loaded successfully.");
    }
    return this.instance;
  }
}

// Public function for sentiment analysis
export const analyzeSentiment = async (text) => {
  if (!text) return { error: "No text provided." };
  try {
    const sentimentAnalyzer = await SentimentPipeline.getInstance();
    const result = await sentimentAnalyzer(text);
    return result[0];
  } catch (e) {
    console.error(`[AI Module] ERROR during sentiment analysis: ${e}`);
    return { error: "An error occurred during analysis." };
  }
};


/**
 * --- AI MODEL 2: CCTNS CASE BLOCKER (for SP Dashboard) ---
 *
 * Uses regex to scan case diaries for specific "blocker" keywords.
 * This is fast, efficient, and requires no model loading.
 */

// Define the keywords our AI will look for.
const blockerPatterns = {
  forensics: /awaiting forensic report/i,
  witness: /witness unavailable/i,
  isp: /awaiting isp response/i,
  cctv: /cctv footage sent for enhancement/i,
  bank: /awaiting bank compliance report/i
};


// Public function for case diary analysis
export const analyzeCaseDiary = (text) => {
  if (!text) return { tag: "No Summary" };
  
  // Check for each pattern
  if (blockerPatterns.forensics.test(text)) {
    return { tag: "Awaiting Forensics" };
  }
  if (blockerPatterns.witness.test(text)) {
    return { tag: "Witness Unavailable" };
  }
  if (blockerPatterns.isp.test(text)) {
    return { tag: "Awaiting ISP Response" };
  }
  if (blockerPatterns.cctv.test(text)) {
    return { tag: "CCTV Enhancement" };
  }
  if (blockerPatterns.bank.test(text)) {
    return { tag: "Bank Compliance" };
  }

  // If no blockers are found
  return { tag: "Under Active Investigation" };
};
