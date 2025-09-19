#!/bin/bash

echo "Testing fraud detection categorization system..."
echo "=============================================="

# Test 1: Marketing email (Spotify example)
echo -e "\n1. Testing marketing email (Spotify Premium offer):"
curl -X POST http://localhost:3000/api/analyze-secure \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Er du usikker på om noe er svindel? Sjekk her: tidligere. Tilbudet utløper 22. september 2025. Hvis du klikker på knappen logger du deg på Spotify-kontoen din, ikke send denne e-posten til noen som ikke er autorisert til å tilgå kontoen din. Få Spotify for: iPhone iPad Android Annet"
  }' | jq '.'

# Test 2: Clear fraud attempt
echo -e "\n2. Testing clear fraud attempt:"
curl -X POST http://localhost:3000/api/analyze-secure \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT: Din DNB konto er sperret! Klikk her for å verifisere din identitet med BankID umiddelbart: dnb-no.com/verify. Dette haster og må gjøres innen 24 timer."
  }' | jq '.'

# Test 3: Suspicious content
echo -e "\n3. Testing suspicious content:"
curl -X POST http://localhost:3000/api/analyze-secure \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Gratulerer! Du har vunnet 10000 kr. Send oss ditt telefonnummer for å motta premien."
  }' | jq '.'

# Test 4: Safe content
echo -e "\n4. Testing safe content:"
curl -X POST http://localhost:3000/api/analyze-secure \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hei, møtet i morgen er flyttet til kl 14:00. Vennlig hilsen, Per"
  }' | jq '.'

echo -e "\n=============================================="
echo "Test complete! Check the 'category' field in each response."