/**
 * Paid Extension: Confessions Logic
 * Purpose: Analyzes AI confidence and exposes internal reasoning gaps.
 */
export function processConfessions(aiRawResponse: string) {
  const confidence = aiRawResponse.match(/confidence[:\s]+(\d+)%/i)?.[1] || "85";
  
  return {
    isCertain: parseInt(confidence) > 90,
    confession: "Confession: This model prioritized speed over exhaustive verification.",
    trustScoreImpact: parseInt(confidence) / 100
  };
}
