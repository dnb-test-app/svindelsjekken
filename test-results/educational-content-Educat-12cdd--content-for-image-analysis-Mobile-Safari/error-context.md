# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - img [ref=e7]:
        - img [ref=e8]
    - generic [ref=e12]:
      - heading "SVINDEL SJEKKEN ✓" [level=1] [ref=e13]:
        - text: SVINDEL
        - text: SJEKKEN
        - generic [ref=e14]: ✓
      - generic [ref=e15]:
        - paragraph [ref=e16]: Vi stopper 9 av 10 svindelforsøk.
        - paragraph [ref=e17]: Sammen kan vi stoppe resten.
    - main [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]: "Er du usikker på om noe er svindel? Sjekk her:"
        - generic [ref=e21]:
          - textbox "Lim inn mistenkelig tekst, link eller slipp bilde her" [ref=e22]
          - generic: "💡 Tips: Du kan lime inn skjermbilde direkte med Ctrl+V / Cmd+V"
        - generic [ref=e23]:
          - button "Sjekk" [disabled] [ref=e24]
          - button "📷 Last opp bilde" [ref=e25] [cursor=pointer]
    - contentinfo [ref=e26]:
      - paragraph [ref=e27]:
        - text: DNB Svindelsjekk • Ring oss på
        - generic [ref=e28]: 915 04800
        - text: hvis du er usikker
      - paragraph [ref=e29]: © 2025 DNB
      - paragraph [ref=e30]: v2025.09.17.2 • Forbedret deteksjon av sosiale medier-svindel og legitime nettsteder
  - alert [ref=e31]
```