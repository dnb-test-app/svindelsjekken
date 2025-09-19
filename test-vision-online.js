require('dotenv').config({ path: '.env.local' });

async function testVisionWithOnline() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Test with a simple text prompt asking about fjellsport.no
  const testCases = [
    {
      model: 'openai/gpt-4o-mini:online',
      type: 'vision',
      prompt: 'What is fjellsport.no? Search for it online and tell me about their Trustpilot rating.'
    },
    {
      model: 'openai/gpt-5-mini:online', 
      type: 'text',
      prompt: 'What is fjellsport.no? Search for it online and tell me about their Trustpilot rating.'
    }
  ];

  for (const test of testCases) {
    console.log(`\nTesting ${test.model} (${test.type}):`);
    
    const messages = test.type === 'vision' 
      ? [{
          role: "user",
          content: [
            { type: "text", text: test.prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" 
              }
            }
          ]
        }]
      : [{
          role: "user",
          content: test.prompt
        }];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: test.model,
          messages: messages,
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.log('❌ Error:', data.error.message || data.error);
      } else if (data.choices && data.choices[0]) {
        const content = data.choices[0].message.content;
        console.log('✅ Success! Response includes:');
        if (content.includes('Trustpilot') || content.includes('3.8') || content.includes('255')) {
          console.log('   Found real web search data about fjellsport.no!');
        } else {
          console.log('   No specific web search data found');
        }
        console.log('   Sample:', content.substring(0, 200) + '...');
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
}

testVisionWithOnline();
