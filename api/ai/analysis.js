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

