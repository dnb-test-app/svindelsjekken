// Quick test script to debug URL detection issue

const text1 = "Check out this amazing deal at modehusoslo.com";
const text2 = "Visit power.no for great electronics";
const text3 = "https://suspicious-site.com/offer";

console.log("Testing URL detection functionality:");
console.log("=====================================");

// Try to simulate the hasMinimalContext function
function testMinimalContext(text) {
  // Simple URL detection regex
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
  const urls = text.match(urlRegex) || [];

  if (urls.length === 0) {
    console.log(`"${text}" - No URLs detected`);
    return false;
  }

  // Remove URLs to count remaining context
  let contextText = text;
  urls.forEach(url => {
    contextText = contextText.replace(url, ' ').replace(/\s+/g, ' ');
  });

  // Count actual words in remaining context
  const contextWords = contextText.trim().split(/\s+/).filter(w => w.length > 1);

  // Calculate ratio of URL content vs context
  const urlLength = urls.join('').length;
  const totalLength = text.length;
  const urlRatio = urlLength / totalLength;

  const hasMinimal = contextWords.length < 10 || urlRatio > 0.7;

  console.log(`"${text}"`);
  console.log(`  URLs found: ${JSON.stringify(urls)}`);
  console.log(`  Context words: ${contextWords.length} (${JSON.stringify(contextWords)})`);
  console.log(`  URL ratio: ${(urlRatio * 100).toFixed(1)}%`);
  console.log(`  Has minimal context: ${hasMinimal}`);
  console.log('');

  return hasMinimal;
}

testMinimalContext(text1);
testMinimalContext(text2);
testMinimalContext(text3);