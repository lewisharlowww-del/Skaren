// lib/enumbers.ts
// Complete E-number additives database for Skaren
// Safety ratings: "safe" | "moderate" | "avoid"
// Categories: colours, preservatives, antioxidants, emulsifiers, stabilisers,
//             thickeners, acids, sweeteners, flavour-enhancers, misc

export type SafetyRating = 'safe' | 'moderate' | 'avoid'

export interface ENumber {
  code: string
  name: string
  category: string
  safety: SafetyRating
  description: string
  vegan?: boolean
  notes?: string
}

export const ENUMBERS: Record<string, ENumber> = {

  // ─── COLOURS E100–E199 ────────────────────────────────────────────────────

  E100: { code: 'E100', name: 'Curcumin', category: 'Colour', safety: 'safe', description: 'Natural yellow pigment from turmeric', vegan: true },
  E101: { code: 'E101', name: 'Riboflavin (Vitamin B2)', category: 'Colour', safety: 'safe', description: 'Natural yellow colour, also a nutrient', vegan: true },
  E102: { code: 'E102', name: 'Tartrazine', category: 'Colour', safety: 'moderate', description: 'Synthetic yellow dye, may cause hyperactivity in children', vegan: true, notes: 'Banned in some countries' },
  E104: { code: 'E104', name: 'Quinoline Yellow', category: 'Colour', safety: 'moderate', description: 'Synthetic yellow-green dye', vegan: true },
  E110: { code: 'E110', name: 'Sunset Yellow FCF', category: 'Colour', safety: 'moderate', description: 'Synthetic orange dye, linked to hyperactivity', vegan: true, notes: 'Requires warning label in EU' },
  E120: { code: 'E120', name: 'Cochineal / Carmine', category: 'Colour', safety: 'moderate', description: 'Red dye derived from insects, not vegan', vegan: false },
  E122: { code: 'E122', name: 'Carmoisine', category: 'Colour', safety: 'moderate', description: 'Synthetic red dye', vegan: true },
  E123: { code: 'E123', name: 'Amaranth', category: 'Colour', safety: 'avoid', description: 'Synthetic red dye, banned in the USA', vegan: true },
  E124: { code: 'E124', name: 'Ponceau 4R', category: 'Colour', safety: 'moderate', description: 'Synthetic red dye, requires warning label in EU', vegan: true },
  E127: { code: 'E127', name: 'Erythrosine', category: 'Colour', safety: 'moderate', description: 'Synthetic pink/red dye containing iodine', vegan: true },
  E129: { code: 'E129', name: 'Allura Red AC', category: 'Colour', safety: 'moderate', description: 'Synthetic red dye, linked to hyperactivity in children', vegan: true },
  E131: { code: 'E131', name: 'Patent Blue V', category: 'Colour', safety: 'moderate', description: 'Synthetic blue dye', vegan: true },
  E132: { code: 'E132', name: 'Indigotine', category: 'Colour', safety: 'safe', description: 'Synthetic blue dye, derived from indigo plant', vegan: true },
  E133: { code: 'E133', name: 'Brilliant Blue FCF', category: 'Colour', safety: 'safe', description: 'Synthetic blue dye', vegan: true },
  E140: { code: 'E140', name: 'Chlorophylls', category: 'Colour', safety: 'safe', description: 'Natural green pigment from plants', vegan: true },
  E141: { code: 'E141', name: 'Copper complexes of chlorophylls', category: 'Colour', safety: 'safe', description: 'Natural green colourant derived from chlorophyll', vegan: true },
  E142: { code: 'E142', name: 'Green S', category: 'Colour', safety: 'moderate', description: 'Synthetic green dye', vegan: true },
  E150a: { code: 'E150a', name: 'Plain caramel', category: 'Colour', safety: 'safe', description: 'Natural brown colourant from heated sugar', vegan: true },
  E150b: { code: 'E150b', name: 'Caustic sulphite caramel', category: 'Colour', safety: 'safe', description: 'Caramel colour made with sulphites', vegan: true },
  E150c: { code: 'E150c', name: 'Ammonia caramel', category: 'Colour', safety: 'moderate', description: 'Caramel colour made with ammonia', vegan: true },
  E150d: { code: 'E150d', name: 'Sulphite ammonia caramel', category: 'Colour', safety: 'moderate', description: 'Most common caramel colour, used in cola drinks', vegan: true },
  E151: { code: 'E151', name: 'Brilliant Black BN', category: 'Colour', safety: 'moderate', description: 'Synthetic black dye', vegan: true },
  E153: { code: 'E153', name: 'Vegetable carbon', category: 'Colour', safety: 'safe', description: 'Natural black colourant from charred plant material', vegan: true },
  E155: { code: 'E155', name: 'Brown HT', category: 'Colour', safety: 'moderate', description: 'Synthetic brown dye', vegan: true },
  E160: { code: 'E160', name: 'Carotenoids', category: 'Colour', safety: 'safe', description: 'Natural orange-yellow pigments from plants', vegan: true },
  E160a: { code: 'E160a', name: 'Alpha-carotene / Beta-carotene', category: 'Colour', safety: 'safe', description: 'Natural orange pigment, precursor to Vitamin A', vegan: true },
  E160b: { code: 'E160b', name: 'Annatto / Bixin / Norbixin', category: 'Colour', safety: 'safe', description: 'Natural orange-red dye from annatto seeds', vegan: true },
  E160c: { code: 'E160c', name: 'Paprika extract / Capsanthin', category: 'Colour', safety: 'safe', description: 'Natural red-orange colour from paprika peppers', vegan: true },
  E160d: { code: 'E160d', name: 'Lycopene', category: 'Colour', safety: 'safe', description: 'Natural red pigment found in tomatoes', vegan: true },
  E160e: { code: 'E160e', name: 'Beta-apo-8-carotenal', category: 'Colour', safety: 'safe', description: 'Natural orange carotenoid pigment', vegan: true },
  E160f: { code: 'E160f', name: 'Ethyl ester of beta-apo-8-carotenic acid', category: 'Colour', safety: 'safe', description: 'Synthetic carotenoid colour', vegan: true },
  E161b: { code: 'E161b', name: 'Lutein', category: 'Colour', safety: 'safe', description: 'Natural yellow pigment from marigold flowers', vegan: true },
  E161g: { code: 'E161g', name: 'Canthaxanthin', category: 'Colour', safety: 'moderate', description: 'Orange carotenoid pigment', vegan: true },
  E162: { code: 'E162', name: 'Beetroot Red / Betanin', category: 'Colour', safety: 'safe', description: 'Natural red-purple colour from beetroot', vegan: true },
  E163: { code: 'E163', name: 'Anthocyanins', category: 'Colour', safety: 'safe', description: 'Natural purple-red pigments from berries and grapes', vegan: true },
  E170: { code: 'E170', name: 'Calcium carbonate', category: 'Colour', safety: 'safe', description: 'White mineral, also used as a calcium supplement', vegan: true },
  E171: { code: 'E171', name: 'Titanium dioxide', category: 'Colour', safety: 'avoid', description: 'White pigment, banned in food in EU since 2022 due to safety concerns', vegan: true, notes: 'Banned in EU food products' },
  E172: { code: 'E172', name: 'Iron oxides and hydroxides', category: 'Colour', safety: 'safe', description: 'Natural mineral pigments, yellow/red/black colours', vegan: true },
  E174: { code: 'E174', name: 'Silver', category: 'Colour', safety: 'safe', description: 'Metallic silver colourant for decoration', vegan: true },
  E175: { code: 'E175', name: 'Gold', category: 'Colour', safety: 'safe', description: 'Metallic gold colourant for decoration', vegan: true },
  E180: { code: 'E180', name: 'Litholrubine BK', category: 'Colour', safety: 'moderate', description: 'Synthetic red pigment for cheese rind colouring', vegan: true },

  // ─── PRESERVATIVES E200–E299 ──────────────────────────────────────────────

  E200: { code: 'E200', name: 'Sorbic acid', category: 'Preservative', safety: 'safe', description: 'Natural preservative, inhibits mould and yeast', vegan: true },
  E202: { code: 'E202', name: 'Potassium sorbate', category: 'Preservative', safety: 'safe', description: 'Common preservative in cheese, wine, and baked goods', vegan: true },
  E203: { code: 'E203', name: 'Calcium sorbate', category: 'Preservative', safety: 'safe', description: 'Preservative derived from sorbic acid', vegan: true },
  E210: { code: 'E210', name: 'Benzoic acid', category: 'Preservative', safety: 'moderate', description: 'Preservative, can form benzene with Vitamin C', vegan: true },
  E211: { code: 'E211', name: 'Sodium benzoate', category: 'Preservative', safety: 'avoid', description: 'Common preservative, linked to hyperactivity in children, can form carcinogenic benzene with Vitamin C', vegan: true, notes: 'Avoid combining with Vitamin C (E300)' },
  E212: { code: 'E212', name: 'Potassium benzoate', category: 'Preservative', safety: 'moderate', description: 'Preservative similar to sodium benzoate', vegan: true },
  E213: { code: 'E213', name: 'Calcium benzoate', category: 'Preservative', safety: 'moderate', description: 'Preservative similar to sodium benzoate', vegan: true },
  E214: { code: 'E214', name: 'Ethyl para-hydroxybenzoate', category: 'Preservative', safety: 'moderate', description: 'Paraben preservative', vegan: true },
  E216: { code: 'E216', name: 'Propyl para-hydroxybenzoate', category: 'Preservative', safety: 'avoid', description: 'Paraben preservative, banned in EU food', vegan: true, notes: 'Banned in EU food products' },
  E218: { code: 'E218', name: 'Methyl para-hydroxybenzoate', category: 'Preservative', safety: 'moderate', description: 'Paraben preservative', vegan: true },
  E220: { code: 'E220', name: 'Sulphur dioxide', category: 'Preservative', safety: 'moderate', description: 'Preservative in wine and dried fruit, may trigger asthma', vegan: true },
  E221: { code: 'E221', name: 'Sodium sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative, allergen for asthmatics', vegan: true },
  E222: { code: 'E222', name: 'Sodium hydrogen sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative', vegan: true },
  E223: { code: 'E223', name: 'Sodium metabisulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative commonly used in wine', vegan: true },
  E224: { code: 'E224', name: 'Potassium metabisulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative used in wine and beer', vegan: true },
  E225: { code: 'E225', name: 'Potassium sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative', vegan: true },
  E226: { code: 'E226', name: 'Calcium sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative', vegan: true },
  E227: { code: 'E227', name: 'Calcium hydrogen sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative', vegan: true },
  E228: { code: 'E228', name: 'Potassium hydrogen sulphite', category: 'Preservative', safety: 'moderate', description: 'Sulphite preservative used in wine', vegan: true },
  E230: { code: 'E230', name: 'Biphenyl', category: 'Preservative', safety: 'avoid', description: 'Fungicide used on citrus fruit skin, not for consumption', vegan: true },
  E231: { code: 'E231', name: 'Orthophenyl phenol', category: 'Preservative', safety: 'avoid', description: 'Fungicide for citrus fruit surface', vegan: true },
  E232: { code: 'E232', name: 'Sodium orthophenyl phenol', category: 'Preservative', safety: 'avoid', description: 'Fungicide for citrus fruit surface', vegan: true },
  E234: { code: 'E234', name: 'Nisin', category: 'Preservative', safety: 'safe', description: 'Natural antibiotic preservative from bacteria', vegan: true },
  E235: { code: 'E235', name: 'Natamycin', category: 'Preservative', safety: 'safe', description: 'Natural antifungal for cheese and sausage surfaces', vegan: true },
  E239: { code: 'E239', name: 'Hexamethylene tetramine', category: 'Preservative', safety: 'avoid', description: 'Preservative that releases formaldehyde', vegan: true, notes: 'Releases formaldehyde' },
  E242: { code: 'E242', name: 'Dimethyl dicarbonate', category: 'Preservative', safety: 'safe', description: 'Preservative used in beverages', vegan: true },
  E249: { code: 'E249', name: 'Potassium nitrite', category: 'Preservative', safety: 'avoid', description: 'Preservative in cured meats, can form carcinogenic nitrosamines', vegan: true },
  E250: { code: 'E250', name: 'Sodium nitrite', category: 'Preservative', safety: 'avoid', description: 'Preservative in processed meats, linked to cancer risk', vegan: true, notes: 'Linked to colorectal cancer risk' },
  E251: { code: 'E251', name: 'Sodium nitrate', category: 'Preservative', safety: 'moderate', description: 'Preservative in cured meats', vegan: true },
  E252: { code: 'E252', name: 'Potassium nitrate', category: 'Preservative', safety: 'moderate', description: 'Preservative in cured meats', vegan: true },
  E260: { code: 'E260', name: 'Acetic acid', category: 'Preservative', safety: 'safe', description: 'Natural preservative, the main component of vinegar', vegan: true },
  E261: { code: 'E261', name: 'Potassium acetate', category: 'Preservative', safety: 'safe', description: 'Preservative and acidity regulator', vegan: true },
  E262: { code: 'E262', name: 'Sodium acetate', category: 'Preservative', safety: 'safe', description: 'Preservative with a salt-and-vinegar flavour', vegan: true },
  E263: { code: 'E263', name: 'Calcium acetate', category: 'Preservative', safety: 'safe', description: 'Preservative and firming agent', vegan: true },
  E270: { code: 'E270', name: 'Lactic acid', category: 'Preservative', safety: 'safe', description: 'Natural preservative produced by fermentation, found in yoghurt', vegan: true },
  E280: { code: 'E280', name: 'Propionic acid', category: 'Preservative', safety: 'safe', description: 'Natural preservative found in Swiss cheese', vegan: true },
  E281: { code: 'E281', name: 'Sodium propionate', category: 'Preservative', safety: 'safe', description: 'Preservative in bread and baked goods', vegan: true },
  E282: { code: 'E282', name: 'Calcium propionate', category: 'Preservative', safety: 'safe', description: 'Common preservative in bread', vegan: true },
  E283: { code: 'E283', name: 'Potassium propionate', category: 'Preservative', safety: 'safe', description: 'Preservative in baked goods', vegan: true },
  E284: { code: 'E284', name: 'Boric acid', category: 'Preservative', safety: 'avoid', description: 'Preservative only permitted in caviar, toxic in large amounts', vegan: true },
  E285: { code: 'E285', name: 'Sodium tetraborate (Borax)', category: 'Preservative', safety: 'avoid', description: 'Preservative only permitted in caviar, harmful compound', vegan: true },
  E290: { code: 'E290', name: 'Carbon dioxide', category: 'Preservative', safety: 'safe', description: 'Natural gas used for carbonation and preservation', vegan: true },
  E296: { code: 'E296', name: 'Malic acid', category: 'Preservative', safety: 'safe', description: 'Natural acid found in apples, used as flavouring', vegan: true },
  E297: { code: 'E297', name: 'Fumaric acid', category: 'Preservative', safety: 'safe', description: 'Natural acid used as acidity regulator', vegan: true },

  // ─── ANTIOXIDANTS E300–E399 ───────────────────────────────────────────────

  E300: { code: 'E300', name: 'Ascorbic acid (Vitamin C)', category: 'Antioxidant', safety: 'safe', description: 'Natural antioxidant vitamin, preserves colour and freshness', vegan: true },
  E301: { code: 'E301', name: 'Sodium ascorbate', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of Vitamin C, antioxidant', vegan: true },
  E302: { code: 'E302', name: 'Calcium ascorbate', category: 'Antioxidant', safety: 'safe', description: 'Calcium salt of Vitamin C, antioxidant', vegan: true },
  E304: { code: 'E304', name: 'Fatty acid esters of ascorbic acid', category: 'Antioxidant', safety: 'safe', description: 'Fat-soluble antioxidant derived from Vitamin C', vegan: true },
  E306: { code: 'E306', name: 'Tocopherol-rich extract (Vitamin E)', category: 'Antioxidant', safety: 'safe', description: 'Natural antioxidant from vegetable oils', vegan: true },
  E307: { code: 'E307', name: 'Alpha-tocopherol', category: 'Antioxidant', safety: 'safe', description: 'Synthetic Vitamin E antioxidant', vegan: true },
  E308: { code: 'E308', name: 'Gamma-tocopherol', category: 'Antioxidant', safety: 'safe', description: 'Synthetic Vitamin E antioxidant', vegan: true },
  E309: { code: 'E309', name: 'Delta-tocopherol', category: 'Antioxidant', safety: 'safe', description: 'Synthetic Vitamin E antioxidant', vegan: true },
  E310: { code: 'E310', name: 'Propyl gallate', category: 'Antioxidant', safety: 'moderate', description: 'Antioxidant in fats and oils, may cause allergic reactions', vegan: true },
  E311: { code: 'E311', name: 'Octyl gallate', category: 'Antioxidant', safety: 'moderate', description: 'Antioxidant in fats and oils', vegan: true },
  E312: { code: 'E312', name: 'Dodecyl gallate', category: 'Antioxidant', safety: 'moderate', description: 'Antioxidant in fats and oils', vegan: true },
  E315: { code: 'E315', name: 'Erythorbic acid', category: 'Antioxidant', safety: 'safe', description: 'Antioxidant, isomer of Vitamin C', vegan: true },
  E316: { code: 'E316', name: 'Sodium erythorbate', category: 'Antioxidant', safety: 'safe', description: 'Antioxidant used in cured meats', vegan: true },
  E319: { code: 'E319', name: 'TBHQ (Tertiary butylhydroquinone)', category: 'Antioxidant', safety: 'avoid', description: 'Synthetic antioxidant in fast food and packaged snacks, concerns over DNA damage at high doses', vegan: true },
  E320: { code: 'E320', name: 'BHA (Butylated hydroxyanisole)', category: 'Antioxidant', safety: 'avoid', description: 'Synthetic antioxidant, possible carcinogen, listed as reasonably anticipated carcinogen', vegan: true, notes: 'Possible carcinogen' },
  E321: { code: 'E321', name: 'BHT (Butylated hydroxytoluene)', category: 'Antioxidant', safety: 'moderate', description: 'Synthetic antioxidant, some concerns over long-term safety', vegan: true },
  E322: { code: 'E322', name: 'Lecithins', category: 'Antioxidant', safety: 'safe', description: 'Natural emulsifier from soy or eggs, common in chocolate', vegan: true },
  E325: { code: 'E325', name: 'Sodium lactate', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of lactic acid, antioxidant and humectant', vegan: true },
  E326: { code: 'E326', name: 'Potassium lactate', category: 'Antioxidant', safety: 'safe', description: 'Potassium salt of lactic acid', vegan: true },
  E327: { code: 'E327', name: 'Calcium lactate', category: 'Antioxidant', safety: 'safe', description: 'Calcium salt of lactic acid, also a calcium supplement', vegan: true },
  E330: { code: 'E330', name: 'Citric acid', category: 'Antioxidant', safety: 'safe', description: 'Natural acid found in citrus fruits, very common preservative', vegan: true },
  E331: { code: 'E331', name: 'Sodium citrates', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of citric acid, acidity regulator', vegan: true },
  E332: { code: 'E332', name: 'Potassium citrates', category: 'Antioxidant', safety: 'safe', description: 'Potassium salt of citric acid', vegan: true },
  E333: { code: 'E333', name: 'Calcium citrates', category: 'Antioxidant', safety: 'safe', description: 'Calcium salt of citric acid', vegan: true },
  E334: { code: 'E334', name: 'Tartaric acid', category: 'Antioxidant', safety: 'safe', description: 'Natural acid from grapes, used in wine and baking powder', vegan: true },
  E335: { code: 'E335', name: 'Sodium tartrates', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of tartaric acid', vegan: true },
  E336: { code: 'E336', name: 'Potassium tartrates', category: 'Antioxidant', safety: 'safe', description: 'Cream of tartar, used in baking', vegan: true },
  E337: { code: 'E337', name: 'Sodium potassium tartrate', category: 'Antioxidant', safety: 'safe', description: 'Rochelle salt, acidity regulator', vegan: true },
  E338: { code: 'E338', name: 'Phosphoric acid', category: 'Antioxidant', safety: 'moderate', description: 'Acid in cola drinks, may affect bone density with excess consumption', vegan: true },
  E339: { code: 'E339', name: 'Sodium phosphates', category: 'Antioxidant', safety: 'moderate', description: 'Acidity regulator and emulsifier', vegan: true },
  E340: { code: 'E340', name: 'Potassium phosphates', category: 'Antioxidant', safety: 'moderate', description: 'Acidity regulator', vegan: true },
  E341: { code: 'E341', name: 'Calcium phosphates', category: 'Antioxidant', safety: 'safe', description: 'Calcium supplement and raising agent in baking', vegan: true },
  E343: { code: 'E343', name: 'Magnesium phosphates', category: 'Antioxidant', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E350: { code: 'E350', name: 'Sodium malates', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of malic acid, acidity regulator', vegan: true },
  E351: { code: 'E351', name: 'Potassium malate', category: 'Antioxidant', safety: 'safe', description: 'Potassium salt of malic acid', vegan: true },
  E352: { code: 'E352', name: 'Calcium malates', category: 'Antioxidant', safety: 'safe', description: 'Calcium salt of malic acid', vegan: true },
  E353: { code: 'E353', name: 'Metatartaric acid', category: 'Antioxidant', safety: 'safe', description: 'Stabiliser in wine', vegan: true },
  E354: { code: 'E354', name: 'Calcium tartrate', category: 'Antioxidant', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E355: { code: 'E355', name: 'Adipic acid', category: 'Antioxidant', safety: 'safe', description: 'Acidity regulator in baking powder and gelatine', vegan: true },
  E356: { code: 'E356', name: 'Sodium adipate', category: 'Antioxidant', safety: 'safe', description: 'Sodium salt of adipic acid', vegan: true },
  E357: { code: 'E357', name: 'Potassium adipate', category: 'Antioxidant', safety: 'safe', description: 'Potassium salt of adipic acid', vegan: true },
  E363: { code: 'E363', name: 'Succinic acid', category: 'Antioxidant', safety: 'safe', description: 'Natural acid found in meat and vegetables', vegan: true },
  E380: { code: 'E380', name: 'Triammonium citrate', category: 'Antioxidant', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E385: { code: 'E385', name: 'Calcium disodium EDTA', category: 'Antioxidant', safety: 'moderate', description: 'Antioxidant in canned foods and mayonnaise', vegan: true },
  E392: { code: 'E392', name: 'Extracts of rosemary', category: 'Antioxidant', safety: 'safe', description: 'Natural antioxidant from rosemary plant', vegan: true },

  // ─── EMULSIFIERS & STABILISERS E400–E499 ─────────────────────────────────

  E400: { code: 'E400', name: 'Alginic acid', category: 'Thickener', safety: 'safe', description: 'Natural thickener from brown seaweed', vegan: true },
  E401: { code: 'E401', name: 'Sodium alginate', category: 'Thickener', safety: 'safe', description: 'Thickener and gelling agent from seaweed', vegan: true },
  E402: { code: 'E402', name: 'Potassium alginate', category: 'Thickener', safety: 'safe', description: 'Thickener from seaweed', vegan: true },
  E403: { code: 'E403', name: 'Ammonium alginate', category: 'Thickener', safety: 'safe', description: 'Thickener from seaweed', vegan: true },
  E404: { code: 'E404', name: 'Calcium alginate', category: 'Thickener', safety: 'safe', description: 'Thickener and gelling agent from seaweed', vegan: true },
  E405: { code: 'E405', name: 'Propylene glycol alginate', category: 'Emulsifier', safety: 'moderate', description: 'Emulsifier from seaweed, contains propylene glycol', vegan: true },
  E406: { code: 'E406', name: 'Agar', category: 'Thickener', safety: 'safe', description: 'Natural gelling agent from red algae, vegan gelatine alternative', vegan: true },
  E407: { code: 'E407', name: 'Carrageenan', category: 'Thickener', safety: 'moderate', description: 'Thickener from red seaweed, some concerns over gut inflammation', vegan: true },
  E407a: { code: 'E407a', name: 'Processed Eucheuma seaweed', category: 'Thickener', safety: 'moderate', description: 'Similar to carrageenan, from seaweed', vegan: true },
  E410: { code: 'E410', name: 'Locust bean gum', category: 'Thickener', safety: 'safe', description: 'Natural thickener from carob seeds', vegan: true },
  E412: { code: 'E412', name: 'Guar gum', category: 'Thickener', safety: 'safe', description: 'Natural thickener from guar beans', vegan: true },
  E413: { code: 'E413', name: 'Tragacanth', category: 'Thickener', safety: 'safe', description: 'Natural gum from a plant, used as thickener', vegan: true },
  E414: { code: 'E414', name: 'Acacia gum (Gum arabic)', category: 'Thickener', safety: 'safe', description: 'Natural gum from acacia trees', vegan: true },
  E415: { code: 'E415', name: 'Xanthan gum', category: 'Thickener', safety: 'safe', description: 'Natural thickener produced by fermentation, common in gluten-free foods', vegan: true },
  E416: { code: 'E416', name: 'Karaya gum', category: 'Thickener', safety: 'safe', description: 'Natural gum from a tree', vegan: true },
  E417: { code: 'E417', name: 'Tara gum', category: 'Thickener', safety: 'safe', description: 'Natural thickener from tara seeds', vegan: true },
  E418: { code: 'E418', name: 'Gellan gum', category: 'Thickener', safety: 'safe', description: 'Natural gelling agent from bacterial fermentation', vegan: true },
  E420: { code: 'E420', name: 'Sorbitol', category: 'Sweetener', safety: 'safe', description: 'Natural sugar alcohol, lower calorie sweetener, laxative effect in large amounts', vegan: true },
  E421: { code: 'E421', name: 'Mannitol', category: 'Sweetener', safety: 'safe', description: 'Natural sugar alcohol from seaweed and mushrooms', vegan: true },
  E422: { code: 'E422', name: 'Glycerol', category: 'Humectant', safety: 'safe', description: 'Natural humectant that keeps food moist', vegan: true },
  E425: { code: 'E425', name: 'Konjac', category: 'Thickener', safety: 'safe', description: 'Natural gelling agent from konjac plant', vegan: true },
  E430: { code: 'E430', name: 'Polyoxyethylene stearate', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E431: { code: 'E431', name: 'Polyoxyethylene (40) stearate', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E432: { code: 'E432', name: 'Polyoxyethylene sorbitan monolaurate (Polysorbate 20)', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier, some concerns over gut microbiome effects', vegan: true },
  E433: { code: 'E433', name: 'Polysorbate 80', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier, some concerns over gut health', vegan: true },
  E434: { code: 'E434', name: 'Polysorbate 40', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E435: { code: 'E435', name: 'Polysorbate 60', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E436: { code: 'E436', name: 'Polysorbate 65', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E440: { code: 'E440', name: 'Pectins', category: 'Thickener', safety: 'safe', description: 'Natural gelling agent from fruit, used in jams', vegan: true },
  E442: { code: 'E442', name: 'Ammonium phosphatides', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in chocolate', vegan: true },
  E444: { code: 'E444', name: 'Sucrose acetate isobutyrate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in beverages', vegan: true },
  E445: { code: 'E445', name: 'Glycerol esters of wood rosins', category: 'Emulsifier', safety: 'safe', description: 'Stabiliser in beverages', vegan: true },
  E450: { code: 'E450', name: 'Diphosphates', category: 'Emulsifier', safety: 'moderate', description: 'Raising agent and emulsifier, high phosphate intake may affect kidneys', vegan: true },
  E451: { code: 'E451', name: 'Triphosphates', category: 'Emulsifier', safety: 'moderate', description: 'Emulsifier and water-binding agent in processed meats', vegan: true },
  E452: { code: 'E452', name: 'Polyphosphates', category: 'Emulsifier', safety: 'moderate', description: 'Emulsifier in processed cheese and meats', vegan: true },
  E459: { code: 'E459', name: 'Beta-cyclodextrin', category: 'Emulsifier', safety: 'safe', description: 'Encapsulation agent for flavours', vegan: true },
  E460: { code: 'E460', name: 'Cellulose', category: 'Thickener', safety: 'safe', description: 'Natural plant fibre, used as thickener and anti-caking agent', vegan: true },
  E461: { code: 'E461', name: 'Methyl cellulose', category: 'Thickener', safety: 'safe', description: 'Modified plant cellulose, thickener', vegan: true },
  E462: { code: 'E462', name: 'Ethyl cellulose', category: 'Thickener', safety: 'safe', description: 'Modified plant cellulose', vegan: true },
  E463: { code: 'E463', name: 'Hydroxypropyl cellulose', category: 'Thickener', safety: 'safe', description: 'Modified plant cellulose, thickener', vegan: true },
  E464: { code: 'E464', name: 'Hydroxypropyl methyl cellulose', category: 'Thickener', safety: 'safe', description: 'Modified plant cellulose, used in gluten-free foods', vegan: true },
  E465: { code: 'E465', name: 'Methyl ethyl cellulose', category: 'Thickener', safety: 'safe', description: 'Modified plant cellulose', vegan: true },
  E466: { code: 'E466', name: 'Carboxy methyl cellulose', category: 'Thickener', safety: 'moderate', description: 'Synthetic cellulose thickener, some concerns over gut microbiome', vegan: true },
  E470a: { code: 'E470a', name: 'Sodium, potassium and calcium salts of fatty acids', category: 'Emulsifier', safety: 'safe', description: 'Emulsifiers derived from fatty acids', vegan: true },
  E471: { code: 'E471', name: 'Mono- and diglycerides of fatty acids', category: 'Emulsifier', safety: 'safe', description: 'Common emulsifier in baked goods and margarine', vegan: true },
  E472a: { code: 'E472a', name: 'Acetic acid esters of mono- and diglycerides', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in bread and baked goods', vegan: true },
  E472b: { code: 'E472b', name: 'Lactic acid esters of mono- and diglycerides', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in baked goods', vegan: true },
  E472c: { code: 'E472c', name: 'Citric acid esters of mono- and diglycerides', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in margarine', vegan: true },
  E472e: { code: 'E472e', name: 'Mono- and diacetyl tartaric acid esters of mono- and diglycerides', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in bread dough', vegan: true },
  E473: { code: 'E473', name: 'Sucrose esters of fatty acids', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier from sugar and fatty acids', vegan: true },
  E474: { code: 'E474', name: 'Sucroglycerids', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier from sugar and fats', vegan: true },
  E475: { code: 'E475', name: 'Polyglycerol esters of fatty acids', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in baked goods', vegan: true },
  E476: { code: 'E476', name: 'Polyglycerol polyricinoleate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in chocolate to reduce viscosity', vegan: true },
  E477: { code: 'E477', name: 'Propylene glycol esters of fatty acids', category: 'Emulsifier', safety: 'moderate', description: 'Synthetic emulsifier', vegan: true },
  E481: { code: 'E481', name: 'Sodium stearoyl-2-lactylate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in bread and baked goods', vegan: true },
  E482: { code: 'E482', name: 'Calcium stearoyl-2-lactylate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in baked goods', vegan: true },
  E483: { code: 'E483', name: 'Stearyl tartrate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in bread', vegan: true },
  E491: { code: 'E491', name: 'Sorbitan monostearate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in yeast products', vegan: true },
  E492: { code: 'E492', name: 'Sorbitan tristearate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in chocolate', vegan: true },
  E493: { code: 'E493', name: 'Sorbitan monolaurate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier in yeast products', vegan: true },
  E494: { code: 'E494', name: 'Sorbitan monooleate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier', vegan: true },
  E495: { code: 'E495', name: 'Sorbitan monopalmitate', category: 'Emulsifier', safety: 'safe', description: 'Emulsifier', vegan: true },

  // ─── SALTS, ACIDS & ANTI-CAKING E500–E599 ────────────────────────────────

  E500: { code: 'E500', name: 'Sodium carbonates', category: 'Raising Agent', safety: 'safe', description: 'Baking soda family, raising agent in baked goods', vegan: true },
  E501: { code: 'E501', name: 'Potassium carbonates', category: 'Raising Agent', safety: 'safe', description: 'Raising agent and acidity regulator', vegan: true },
  E503: { code: 'E503', name: 'Ammonium carbonates', category: 'Raising Agent', safety: 'safe', description: 'Raising agent in biscuits and cookies, releases ammonia when heated', vegan: true },
  E504: { code: 'E504', name: 'Magnesium carbonates', category: 'Raising Agent', safety: 'safe', description: 'Anti-caking agent and raising agent', vegan: true },
  E505: { code: 'E505', name: 'Ferrous carbonate', category: 'Raising Agent', safety: 'safe', description: 'Iron supplement and acidity regulator', vegan: true },
  E507: { code: 'E507', name: 'Hydrochloric acid', category: 'Acid', safety: 'safe', description: 'Acidity regulator used in food processing', vegan: true },
  E508: { code: 'E508', name: 'Potassium chloride', category: 'Stabiliser', safety: 'safe', description: 'Salt substitute and gelling agent', vegan: true },
  E509: { code: 'E509', name: 'Calcium chloride', category: 'Firming Agent', safety: 'safe', description: 'Firming agent in canned vegetables and tofu', vegan: true },
  E511: { code: 'E511', name: 'Magnesium chloride', category: 'Firming Agent', safety: 'safe', description: 'Firming agent used in tofu production', vegan: true },
  E512: { code: 'E512', name: 'Stannous chloride', category: 'Antioxidant', safety: 'moderate', description: 'Antioxidant in canned asparagus', vegan: true },
  E513: { code: 'E513', name: 'Sulphuric acid', category: 'Acid', safety: 'safe', description: 'Acidity regulator in food processing', vegan: true },
  E514: { code: 'E514', name: 'Sodium sulphates', category: 'Stabiliser', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E515: { code: 'E515', name: 'Potassium sulphates', category: 'Stabiliser', safety: 'safe', description: 'Acidity regulator and salt substitute', vegan: true },
  E516: { code: 'E516', name: 'Calcium sulphate', category: 'Firming Agent', safety: 'safe', description: 'Firming agent and calcium supplement, used in tofu', vegan: true },
  E517: { code: 'E517', name: 'Ammonium sulphate', category: 'Stabiliser', safety: 'safe', description: 'Dough conditioner in bread', vegan: true },
  E520: { code: 'E520', name: 'Aluminium sulphate', category: 'Firming Agent', safety: 'moderate', description: 'Firming agent, high aluminium intake linked to health concerns', vegan: true },
  E524: { code: 'E524', name: 'Sodium hydroxide', category: 'Acid', safety: 'safe', description: 'Acidity regulator used in olives and cocoa processing', vegan: true },
  E525: { code: 'E525', name: 'Potassium hydroxide', category: 'Acid', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E526: { code: 'E526', name: 'Calcium hydroxide', category: 'Firming Agent', safety: 'safe', description: 'Firming agent and acidity regulator', vegan: true },
  E527: { code: 'E527', name: 'Ammonium hydroxide', category: 'Acid', safety: 'safe', description: 'Acidity regulator used in cocoa processing', vegan: true },
  E528: { code: 'E528', name: 'Magnesium hydroxide', category: 'Acid', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E529: { code: 'E529', name: 'Calcium oxide', category: 'Acid', safety: 'safe', description: 'Acidity regulator', vegan: true },
  E530: { code: 'E530', name: 'Magnesium oxide', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent and acidity regulator', vegan: true },
  E535: { code: 'E535', name: 'Sodium ferrocyanide', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent in table salt', vegan: true },
  E536: { code: 'E536', name: 'Potassium ferrocyanide', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent in salt', vegan: true },
  E538: { code: 'E538', name: 'Calcium ferrocyanide', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent', vegan: true },
  E541: { code: 'E541', name: 'Sodium aluminium phosphate', category: 'Raising Agent', safety: 'moderate', description: 'Raising agent in baking powder, contains aluminium', vegan: true },
  E551: { code: 'E551', name: 'Silicon dioxide', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent in powdered foods', vegan: true },
  E552: { code: 'E552', name: 'Calcium silicate', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent in table salt and icing sugar', vegan: true },
  E553a: { code: 'E553a', name: 'Magnesium silicate', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent', vegan: true },
  E553b: { code: 'E553b', name: 'Talc', category: 'Anti-caking Agent', safety: 'moderate', description: 'Anti-caking agent on rice and chewing gum', vegan: true },
  E554: { code: 'E554', name: 'Sodium aluminium silicate', category: 'Anti-caking Agent', safety: 'moderate', description: 'Anti-caking agent, contains aluminium', vegan: true },
  E555: { code: 'E555', name: 'Potassium aluminium silicate', category: 'Anti-caking Agent', safety: 'moderate', description: 'Anti-caking agent, contains aluminium', vegan: true },
  E556: { code: 'E556', name: 'Calcium aluminium silicate', category: 'Anti-caking Agent', safety: 'moderate', description: 'Anti-caking agent, contains aluminium', vegan: true },
  E558: { code: 'E558', name: 'Bentonite', category: 'Anti-caking Agent', safety: 'safe', description: 'Natural clay used as anti-caking agent', vegan: true },
  E559: { code: 'E559', name: 'Aluminium silicate (Kaolin)', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent', vegan: true },
  E570: { code: 'E570', name: 'Fatty acids', category: 'Anti-caking Agent', safety: 'safe', description: 'Anti-caking agent and glazing agent', vegan: true },
  E574: { code: 'E574', name: 'Gluconic acid', category: 'Acid', safety: 'safe', description: 'Natural acid found in fruit and honey', vegan: true },
  E575: { code: 'E575', name: 'Glucono delta-lactone', category: 'Acid', safety: 'safe', description: 'Acidifier used in tofu and baked goods', vegan: true },
  E576: { code: 'E576', name: 'Sodium gluconate', category: 'Stabiliser', safety: 'safe', description: 'Sequestrant and stabiliser', vegan: true },
  E577: { code: 'E577', name: 'Potassium gluconate', category: 'Stabiliser', safety: 'safe', description: 'Sequestrant', vegan: true },
  E578: { code: 'E578', name: 'Calcium gluconate', category: 'Firming Agent', safety: 'safe', description: 'Firming agent and calcium supplement', vegan: true },
  E579: { code: 'E579', name: 'Ferrous gluconate', category: 'Stabiliser', safety: 'safe', description: 'Iron supplement and colour stabiliser in olives', vegan: true },
  E585: { code: 'E585', name: 'Ferrous lactate', category: 'Stabiliser', safety: 'safe', description: 'Colour stabiliser in olives', vegan: true },

  // ─── FLAVOUR ENHANCERS E600–E699 ──────────────────────────────────────────

  E620: { code: 'E620', name: 'Glutamic acid', category: 'Flavour Enhancer', safety: 'moderate', description: 'Natural amino acid, base form of MSG', vegan: true },
  E621: { code: 'E621', name: 'Monosodium glutamate (MSG)', category: 'Flavour Enhancer', safety: 'moderate', description: 'Common umami flavour enhancer, some people report sensitivity', vegan: true },
  E622: { code: 'E622', name: 'Monopotassium glutamate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer similar to MSG', vegan: true },
  E623: { code: 'E623', name: 'Calcium diglutamate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: true },
  E624: { code: 'E624', name: 'Monoammonium glutamate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: true },
  E625: { code: 'E625', name: 'Magnesium diglutamate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: true },
  E626: { code: 'E626', name: 'Guanylic acid', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer, often derived from fish or meat', vegan: false },
  E627: { code: 'E627', name: 'Disodium guanylate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer often used with MSG, often derived from fish', vegan: false },
  E628: { code: 'E628', name: 'Dipotassium guanylate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: false },
  E629: { code: 'E629', name: 'Calcium guanylate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: false },
  E630: { code: 'E630', name: 'Inosinic acid', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer, usually from meat or fish', vegan: false },
  E631: { code: 'E631', name: 'Disodium inosinate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer often paired with MSG, often from fish or meat', vegan: false },
  E632: { code: 'E632', name: 'Dipotassium inosinate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: false },
  E633: { code: 'E633', name: 'Calcium inosinate', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer', vegan: false },
  E634: { code: 'E634', name: 'Calcium 5-ribonucleotides', category: 'Flavour Enhancer', safety: 'moderate', description: 'Flavour enhancer blend', vegan: false },
  E635: { code: 'E635', name: 'Disodium 5-ribonucleotides', category: 'Flavour Enhancer', safety: 'moderate', description: 'Powerful flavour enhancer, combination of E627 and E631', vegan: false },
  E640: { code: 'E640', name: 'Glycine and its sodium salt', category: 'Flavour Enhancer', safety: 'safe', description: 'Natural amino acid used as flavour modifier', vegan: true },
  E650: { code: 'E650', name: 'Zinc acetate', category: 'Flavour Enhancer', safety: 'safe', description: 'Used in chewing gum', vegan: true },

  // ─── GLAZING AGENTS, GASES & MISC E586–E949 ──────────────────────────────

  E586: { code: 'E586', name: '4-Hexylresorcinol', category: 'Preservative', safety: 'safe', description: 'Antioxidant used to prevent browning in crustaceans', vegan: true },
  E900: { code: 'E900', name: 'Dimethyl polysiloxane', category: 'Anti-foaming Agent', safety: 'safe', description: 'Anti-foaming agent in cooking oils and beverages', vegan: true },
  E901: { code: 'E901', name: 'Beeswax', category: 'Glazing Agent', safety: 'safe', description: 'Natural wax from bees used to glaze fruit and sweets', vegan: false },
  E902: { code: 'E902', name: 'Candelilla wax', category: 'Glazing Agent', safety: 'safe', description: 'Natural plant wax, vegan alternative to beeswax', vegan: true },
  E903: { code: 'E903', name: 'Carnauba wax', category: 'Glazing Agent', safety: 'safe', description: 'Natural wax from Brazilian palm leaves, used on sweets and fruit', vegan: true },
  E904: { code: 'E904', name: 'Shellac', category: 'Glazing Agent', safety: 'safe', description: 'Natural resin secreted by lac bugs, not vegan', vegan: false },
  E905: { code: 'E905', name: 'Microcrystalline wax', category: 'Glazing Agent', safety: 'safe', description: 'Petroleum-derived wax for glazing', vegan: true },
  E907: { code: 'E907', name: 'Hydrogenated poly-1-decene', category: 'Glazing Agent', safety: 'safe', description: 'Synthetic glazing agent', vegan: true },
  E908: { code: 'E908', name: 'Rice bran wax', category: 'Glazing Agent', safety: 'safe', description: 'Natural wax from rice bran', vegan: true },
  E909: { code: 'E909', name: 'Spermaceti wax', category: 'Glazing Agent', safety: 'safe', description: 'Wax from sperm whales, rarely used today', vegan: false },
  E910: { code: 'E910', name: 'L-cysteine', category: 'Improving Agent', safety: 'moderate', description: 'Dough conditioner, often derived from human hair or duck feathers', vegan: false },
  E912: { code: 'E912', name: 'Montanic acid esters', category: 'Glazing Agent', safety: 'safe', description: 'Glazing agent from montan wax', vegan: true },
  E914: { code: 'E914', name: 'Oxidised polyethylene wax', category: 'Glazing Agent', safety: 'safe', description: 'Synthetic glazing agent for fresh fruit', vegan: true },
  E915: { code: 'E915', name: 'Colophonium esters', category: 'Glazing Agent', safety: 'safe', description: 'Glazing agent from tree resin', vegan: true },
  E920: { code: 'E920', name: 'L-cysteine hydrochloride', category: 'Improving Agent', safety: 'moderate', description: 'Dough conditioner, often from animal sources', vegan: false },
  E927b: { code: 'E927b', name: 'Carbamide (Urea)', category: 'Improving Agent', safety: 'safe', description: 'Dough conditioner and chewing gum component', vegan: true },
  E938: { code: 'E938', name: 'Argon', category: 'Packaging Gas', safety: 'safe', description: 'Inert gas used in modified atmosphere packaging', vegan: true },
  E939: { code: 'E939', name: 'Helium', category: 'Packaging Gas', safety: 'safe', description: 'Inert gas used in food packaging', vegan: true },
  E940: { code: 'E940', name: 'Dichlorodifluoromethane', category: 'Packaging Gas', safety: 'safe', description: 'Refrigerant gas used for quick-freezing food', vegan: true },
  E941: { code: 'E941', name: 'Nitrogen', category: 'Packaging Gas', safety: 'safe', description: 'Inert gas used in food packaging to prevent oxidation', vegan: true },
  E942: { code: 'E942', name: 'Nitrous oxide', category: 'Packaging Gas', safety: 'safe', description: 'Propellant in whipped cream canisters', vegan: true },
  E943a: { code: 'E943a', name: 'Butane', category: 'Packaging Gas', safety: 'safe', description: 'Propellant gas in food packaging', vegan: true },
  E943b: { code: 'E943b', name: 'Iso-butane', category: 'Packaging Gas', safety: 'safe', description: 'Propellant gas', vegan: true },
  E944: { code: 'E944', name: 'Propane', category: 'Packaging Gas', safety: 'safe', description: 'Propellant gas in food packaging', vegan: true },
  E945: { code: 'E945', name: 'Chloropentafluoroethane', category: 'Packaging Gas', safety: 'safe', description: 'Propellant gas', vegan: true },
  E946: { code: 'E946', name: 'Octafluorocyclobutane', category: 'Packaging Gas', safety: 'safe', description: 'Propellant gas', vegan: true },
  E948: { code: 'E948', name: 'Oxygen', category: 'Packaging Gas', safety: 'safe', description: 'Used in modified atmosphere packaging for fresh meat', vegan: true },
  E949: { code: 'E949', name: 'Hydrogen', category: 'Packaging Gas', safety: 'safe', description: 'Packaging gas', vegan: true },

  // ─── SWEETENERS E900–E999 ─────────────────────────────────────────────────

  E950: { code: 'E950', name: 'Acesulfame K', category: 'Sweetener', safety: 'moderate', description: 'Artificial sweetener, 200x sweeter than sugar, some concerns over long-term use', vegan: true },
  E951: { code: 'E951', name: 'Aspartame', category: 'Sweetener', safety: 'moderate', description: 'Artificial sweetener, controversial, avoid if you have PKU', vegan: true, notes: 'Not suitable for people with phenylketonuria (PKU)' },
  E952: { code: 'E952', name: 'Cyclamates', category: 'Sweetener', safety: 'avoid', description: 'Artificial sweetener banned in USA, permitted in EU', vegan: true },
  E953: { code: 'E953', name: 'Isomalt', category: 'Sweetener', safety: 'safe', description: 'Sugar alcohol from beet sugar, used in sugar-free sweets', vegan: true },
  E954: { code: 'E954', name: 'Saccharin', category: 'Sweetener', safety: 'moderate', description: 'Oldest artificial sweetener, bitter aftertaste, some controversy', vegan: true },
  E955: { code: 'E955', name: 'Sucralose', category: 'Sweetener', safety: 'moderate', description: 'Artificial sweetener derived from sugar, 600x sweeter than sugar', vegan: true },
  E957: { code: 'E957', name: 'Thaumatin', category: 'Sweetener', safety: 'safe', description: 'Natural protein sweetener from katemfe fruit, 2000x sweeter than sugar', vegan: true },
  E958: { code: 'E958', name: 'Glycyrrhizin', category: 'Sweetener', safety: 'moderate', description: 'Natural sweetener from liquorice root', vegan: true },
  E959: { code: 'E959', name: 'Neohesperidine DC', category: 'Sweetener', safety: 'safe', description: 'Semi-synthetic sweetener from citrus', vegan: true },
  E960: { code: 'E960', name: 'Steviol glycosides (Stevia)', category: 'Sweetener', safety: 'safe', description: 'Natural sweetener from the stevia plant, no calories', vegan: true },
  E961: { code: 'E961', name: 'Neotame', category: 'Sweetener', safety: 'safe', description: 'Artificial sweetener, very high sweetness intensity', vegan: true },
  E962: { code: 'E962', name: 'Salt of aspartame-acesulfame', category: 'Sweetener', safety: 'moderate', description: 'Combination artificial sweetener', vegan: true },
  E965: { code: 'E965', name: 'Maltitol', category: 'Sweetener', safety: 'safe', description: 'Sugar alcohol, laxative effect in large amounts', vegan: true },
  E966: { code: 'E966', name: 'Lactitol', category: 'Sweetener', safety: 'safe', description: 'Sugar alcohol from lactose', vegan: true },
  E967: { code: 'E967', name: 'Xylitol', category: 'Sweetener', safety: 'safe', description: 'Natural sugar alcohol from birch, good for teeth, toxic to dogs', vegan: true },
  E968: { code: 'E968', name: 'Erythritol', category: 'Sweetener', safety: 'safe', description: 'Natural sugar alcohol, zero calories, good digestive tolerance', vegan: true },
  E969: { code: 'E969', name: 'Advantame', category: 'Sweetener', safety: 'safe', description: 'Artificial sweetener, extremely high sweetness', vegan: true },

  // ─── MISC E1000+ ──────────────────────────────────────────────────────────

  E1100: { code: 'E1100', name: 'Amylases', category: 'Enzyme', safety: 'safe', description: 'Natural enzymes used in bread making and brewing', vegan: true },
  E1101: { code: 'E1101', name: 'Proteases', category: 'Enzyme', safety: 'safe', description: 'Natural enzymes used in meat tenderising and cheese making', vegan: true },
  E1102: { code: 'E1102', name: 'Glucose oxidase', category: 'Enzyme', safety: 'safe', description: 'Enzyme used in bread baking', vegan: true },
  E1103: { code: 'E1103', name: 'Invertases', category: 'Enzyme', safety: 'safe', description: 'Enzyme used in confectionery', vegan: true },
  E1200: { code: 'E1200', name: 'Polydextrose', category: 'Thickener', safety: 'safe', description: 'Synthetic dietary fibre used as bulking agent', vegan: true },
  E1201: { code: 'E1201', name: 'Polyvinylpyrrolidone', category: 'Stabiliser', safety: 'safe', description: 'Stabiliser in tablets and beverages', vegan: true },
  E1202: { code: 'E1202', name: 'Polyvinyl polypyrrolidone', category: 'Stabiliser', safety: 'safe', description: 'Clarifying agent in beverages', vegan: true },
  E1204: { code: 'E1204', name: 'Pullulan', category: 'Thickener', safety: 'safe', description: 'Natural polysaccharide from fermentation', vegan: true },
  E1400: { code: 'E1400', name: 'Dextrin', category: 'Thickener', safety: 'safe', description: 'Modified starch used as thickener', vegan: true },
  E1401: { code: 'E1401', name: 'Acid-treated starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1402: { code: 'E1402', name: 'Alkaline-treated starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1403: { code: 'E1403', name: 'Bleached starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1404: { code: 'E1404', name: 'Oxidised starch', category: 'Thickener', safety: 'safe', description: 'Modified starch used as thickener', vegan: true },
  E1410: { code: 'E1410', name: 'Monostarch phosphate', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1412: { code: 'E1412', name: 'Distarch phosphate', category: 'Thickener', safety: 'safe', description: 'Modified starch used in sauces', vegan: true },
  E1413: { code: 'E1413', name: 'Phosphated distarch phosphate', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1414: { code: 'E1414', name: 'Acetylated distarch phosphate', category: 'Thickener', safety: 'safe', description: 'Modified starch used in frozen foods', vegan: true },
  E1420: { code: 'E1420', name: 'Acetylated starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1422: { code: 'E1422', name: 'Acetylated distarch adipate', category: 'Thickener', safety: 'safe', description: 'Modified starch used in sauces and dressings', vegan: true },
  E1440: { code: 'E1440', name: 'Hydroxy propyl starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1442: { code: 'E1442', name: 'Hydroxy propyl distarch phosphate', category: 'Thickener', safety: 'safe', description: 'Modified starch commonly used in sauces', vegan: true },
  E1450: { code: 'E1450', name: 'Starch sodium octenyl succinate', category: 'Emulsifier', safety: 'safe', description: 'Modified starch used as emulsifier in beverages', vegan: true },
  E1451: { code: 'E1451', name: 'Acetylated oxidised starch', category: 'Thickener', safety: 'safe', description: 'Modified starch', vegan: true },
  E1452: { code: 'E1452', name: 'Starch aluminium octenyl succinate', category: 'Emulsifier', safety: 'safe', description: 'Modified starch emulsifier', vegan: true },
  E1505: { code: 'E1505', name: 'Triethyl citrate', category: 'Stabiliser', safety: 'safe', description: 'Stabiliser in dried egg products', vegan: true },
  E1518: { code: 'E1518', name: 'Glyceryl triacetate (Triacetin)', category: 'Humectant', safety: 'safe', description: 'Humectant and solvent in food flavourings', vegan: true },
  E1520: { code: 'E1520', name: 'Propylene glycol', category: 'Humectant', safety: 'moderate', description: 'Humectant and solvent, GRAS in USA but some concerns', vegan: true },
}

// ─── Lookup helper ────────────────────────────────────────────────────────────

/**
 * Look up an E-number, trying variations like "E211", "211", "e211"
 */
export function lookupENumber(code: string): ENumber | null {
  if (!code) return null
  // Normalise: uppercase, ensure starts with E
  const clean = code.trim().toUpperCase()
  const withE = clean.startsWith('E') ? clean : `E${clean}`
  return ENUMBERS[withE] ?? null
}

/**
 * Get a display-friendly safety label
 */
export function getSafetyLabel(safety: SafetyRating): string {
  switch (safety) {
    case 'safe': return 'Safe'
    case 'moderate': return 'Use in moderation'
    case 'avoid': return 'Best avoided'
  }
}

/**
 * Get Tailwind colour classes for safety rating
 */
export function getSafetyColours(safety: SafetyRating): { bg: string; text: string; border: string } {
  switch (safety) {
    case 'safe':
      return { bg: 'bg-[#eaf3de]', text: 'text-[#2d4a26]', border: 'border-[#c8e6b0]' }
    case 'moderate':
      return { bg: 'bg-[#faeeda]', text: 'text-[#8c6200]', border: 'border-[#f0d090]' }
    case 'avoid':
      return { bg: 'bg-[#fde8e8]', text: 'text-[#aa1818]', border: 'border-[#f0b0b0]' }
  }
}
