# Skaren — Release Notes

## Build 10 (version 1.0.1) — "What's New" for App Store review

### Short version (App Store "What's New" field)

Norsk:
Denne oppdateringen gjør Skaren raskere og enklere å bruke:

• Nytt søk som finner de riktige norske dagligvarene (skriv f.eks. «melk» og få Tine, Q og de vanlige kartongene øverst)
• Appen åpner nå rett på skanneren, uten ekstra ventetid
• Raskere skanning og kjappere oppstart
• Helsekarakter vises kun når vi faktisk har næringsdata, så du slipper misvisende karakterer
• Fullført norsk oversettelse og et nytt, renere oppstartsbilde
• Diverse feilrettinger og stabilitetsforbedringer

English:
This update makes Skaren faster and easier to use:

• New search that surfaces the right Norwegian groceries (type "melk" and get Tine, Q and the common cartons first)
• The app now opens straight to the scanner, with less waiting
• Faster scanning and quicker launch
• Health grade now shows only when real nutrition data exists, so you never see a misleading grade
• Completed Norwegian localization and a cleaner new launch screen
• Various bug fixes and stability improvements

---

### Notes / rationale (internal, not submitted)

Curated from user-facing changes since build 9 (b65481b). Left out pure
refactors, dead-code removal, debug scaffolding, and infra (vercel/tsconfig).

Because the iOS app loads the live site (https://skaren.app), most of these
improvements already reached build-9 users via web deploy. The native binary
change from 9 -> 10 is: launch-screen redesign, splash sizing fix, completed
Norwegian (nb) localization, and Info.plist permission strings.
