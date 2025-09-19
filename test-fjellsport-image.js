// Test fjellsport.no image analysis
const fs = require('fs');
const path = require('path');

// Create a simple test image with fjellsport.no text
const { createCanvas } = require('canvas');

function createTestImage() {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 400);

  // Add border
  ctx.strokeStyle = '#007272';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 780, 380);

  // Add fjellsport.no branding
  ctx.fillStyle = '#2d5a3d'; // Forest green
  ctx.font = 'bold 48px Arial';
  ctx.fillText('FJELLSPORT.NO', 50, 80);

  // Add promotional text
  ctx.fillStyle = 'black';
  ctx.font = '32px Arial';
  ctx.fillText('Stor utesalg!', 50, 140);
  ctx.font = '24px Arial';
  ctx.fillText('✓ Fri frakt over 499,-', 50, 180);
  ctx.fillText('✓ 30 dagers returrett', 50, 210);
  ctx.fillText('✓ Norges største utvalg', 50, 240);

  // Add contact info
  ctx.font = '20px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('Kontakt: kundeservice@fjellsport.no', 50, 300);
  ctx.fillText('Telefon: 22 12 34 56', 50, 330);

  // Add website
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#007272';
  ctx.fillText('www.fjellsport.no', 50, 370);

  return canvas.toBuffer('image/png');
}

async function testImageAnalysis() {
  try {
    console.log('🖼️  Creating test image with fjellsport.no content...');
    const imageBuffer = createTestImage();

    // Save test image for reference
    const imagePath = path.join(__dirname, 'test-fjellsport-image.png');
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`📸 Test image saved to: ${imagePath}`);

    // Convert to base64 for API
    const base64Image = imageBuffer.toString('base64');

    console.log('🔍 Sending image to analyze-image API...');

    const fetch = (await import('node-fetch')).default;

    const response = await fetch('http://localhost:3000/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/png;base64,${base64Image}`,
        enableWebSearch: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('\n📊 IMAGE ANALYSIS RESULTS:');
    console.log('=====================================');
    console.log(`Category: ${result.category}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Fraud Probability: ${result.fraudProbability}%`);
    console.log(`Main Indicators: ${JSON.stringify(result.mainIndicators)}`);
    console.log(`Web Search Used: ${result.webSearchUsed}`);
    console.log('\nSummary:');
    console.log(result.summary);
    console.log('\nRecommendation:');
    console.log(result.recommendation);

    // Check for success indicators
    const isLegitimate = result.category === 'context-required' || result.category === 'marketing';
    const hasLowRisk = result.fraudProbability < 40;
    const mentionsEstablished = result.summary?.toLowerCase().includes('etablert') ||
                               result.summary?.toLowerCase().includes('kjent') ||
                               result.summary?.toLowerCase().includes('legitim');

    console.log('\n🎯 ANALYSIS EVALUATION:');
    console.log('=====================================');
    console.log(`✅ Legitimate category: ${isLegitimate}`);
    console.log(`✅ Low fraud probability: ${hasLowRisk}`);
    console.log(`✅ Mentions established/known: ${mentionsEstablished}`);
    console.log(`✅ Web search used: ${result.webSearchUsed}`);

    if (isLegitimate && hasLowRisk && mentionsEstablished) {
      console.log('\n🎉 SUCCESS: Image analysis correctly identifies fjellsport.no as legitimate!');
    } else {
      console.log('\n⚠️  ISSUE: Image analysis may still have problems with legitimacy detection');
    }

    // Clean up test image
    fs.unlinkSync(imagePath);

  } catch (error) {
    console.error('❌ Error testing image analysis:', error.message);
  }
}

testImageAnalysis();