import { lookupENumber } from "@/lib/enumbers";

export type AdditiveRisk = "safe" | "moderate" | "avoid";

export type AdditiveAnalysis = {
  code: string;
  name: string;
  risk: AdditiveRisk;
  description: string;
  known: boolean;
};

export const ADDITIVES: Record<string, { name: string; risk: AdditiveRisk; description: string }> = {
  e100: { name: "Curcumin", risk: "safe", description: "Natural yellow colour from turmeric" },
  e102: { name: "Tartrazine", risk: "avoid", description: "Artificial yellow colour, linked to hyperactivity in children" },
  e120: { name: "Cochineal", risk: "moderate", description: "Red colour from insects, may cause allergic reactions" },
  e200: { name: "Sorbic acid", risk: "safe", description: "Natural preservative, generally considered safe" },
  e211: { name: "Sodium benzoate", risk: "avoid", description: "Preservative linked to hyperactivity, avoid with vitamin C" },
  e250: { name: "Sodium nitrite", risk: "avoid", description: "Preservative in processed meat, linked to cancer risk" },
  e261: { name: "Potassium acetate", risk: "safe", description: "Preservative, generally recognised as safe" },
  e270: { name: "Lactic acid", risk: "safe", description: "Natural preservative produced by fermentation" },
  e300: { name: "Vitamin C", risk: "safe", description: "Antioxidant, natural and beneficial" },
  e322: { name: "Lecithin", risk: "safe", description: "Emulsifier from soy or eggs, generally safe" },
  e330: { name: "Citric acid", risk: "safe", description: "Natural preservative found in citrus fruits" },
  e407: { name: "Carrageenan", risk: "moderate", description: "Thickener from seaweed, may cause digestive issues" },
  e420: { name: "Sorbitol", risk: "moderate", description: "Sugar alcohol, may cause digestive issues in large amounts" },
  e450: { name: "Diphosphates", risk: "moderate", description: "Raising agent, high intake may affect calcium absorption" },
  e451: { name: "Triphosphates", risk: "moderate", description: "Raising agent found in processed meats" },
  e471: { name: "Mono- and diglycerides", risk: "moderate", description: "Emulsifier, often derived from animal fat" },
  e476: { name: "Polyglycerol polyricinoleate", risk: "safe", description: "Emulsifier used in chocolate" },
  e500: { name: "Sodium carbonates", risk: "safe", description: "Raising agent, generally considered safe" },
  e621: { name: "MSG", risk: "moderate", description: "Flavour enhancer, some people report sensitivity" },
  e627: { name: "Disodium guanylate", risk: "moderate", description: "Flavour enhancer, avoid if sensitive to MSG" },
  e950: { name: "Acesulfame K", risk: "moderate", description: "Artificial sweetener, safety debated" },
  e951: { name: "Aspartame", risk: "avoid", description: "Artificial sweetener, controversial, avoid if PKU" },
  e955: { name: "Sucralose", risk: "moderate", description: "Artificial sweetener, may affect gut bacteria" },
  e1422: { name: "Acetylated distarch adipate", risk: "safe", description: "Modified starch, generally considered safe" }
};

export function normalizeAdditiveCode(value: string) {
  const match = value.toLowerCase().match(/e[\s-]?(\d{3,4})/);
  return match ? `e${match[1]}` : null;
}

export function analyzeAdditives(tags: string[] = []): AdditiveAnalysis[] {
  const seen = new Set<string>();

  return tags
    .map((tag) => normalizeAdditiveCode(tag))
    .filter((code): code is string => Boolean(code))
    .filter((code) => {
      if (seen.has(code)) return false;
      seen.add(code);
      return true;
    })
    .map((code) => {
      // Primary: look up in the full enumbers database
      const eInfo = lookupENumber(code);
      if (eInfo) {
        return {
          code,
          name: eInfo.name,
          risk: eInfo.safety as AdditiveRisk,
          description: eInfo.description,
          known: true
        };
      }

      // Fallback: use legacy ADDITIVES list
      const additive = ADDITIVES[code];
      if (additive) {
        return {
          code,
          ...additive,
          known: true
        };
      }

      return {
        code,
        name: "Unknown additive",
        risk: "moderate" as AdditiveRisk,
        description: "This additive is not in Skaren's current additive database yet.",
        known: false
      };
    });
}
