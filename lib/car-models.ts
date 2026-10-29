/**
 * Sellers type the model freely, so the field often holds a year ("2013"), a typo
 * ("Land Curiser") or the brand again ("Toyota Noah"). This catalog recognises the
 * real model from the model and title fields, so cars get proper names and model
 * pages such as /cars/toyota/land-cruiser-prado.
 */

export type CarModel = {
  name: string
  slug: string
  pattern: RegExp
  /** A sentence or two about the model for its page, when there is something worth saying. */
  about?: string
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function model(name: string, ...aliases: string[]): CarModel {
  return { name, slug: slugify(name), pattern: new RegExp(`(?:^|[^a-z0-9])(?:${aliases.join('|')})(?![a-z0-9])`, 'i') }
}

// Within a brand, more specific models come first (Prado before Land Cruiser, Fielder before Corolla).
const CATALOG: Record<string, CarModel[]> = {
  toyota: [
    model('Land Cruiser Prado', 'e?prado', 'tzg', 'gdj'),
    model('Land Cruiser', 'land\\s*c[a-z]{4,7}r', 'v8', 'lc\\s?(?:70|76|79|200|300)'),
    model('Harrier', 'harrier'),
    model('Noah', 'noah', 'noha', 'naoh'),
    model('Voxy', 'voxy'),
    model('RAV4', 'rav\\s*-?\\s*4'),
    model('Hilux Surf', 'hilux\\s*surf', 'surf'),
    {
      // "Double cabin", "D/Cab", "D-cab" and typos such as "Dobul cabin"; in Uganda this means the Hilux.
      ...model('Hilux Double Cabin', '(?:double|dobu?le?|dbl)\\s*[-/]?\\s*cab(?:in)?', 'd\\s*[-/\\s]\\s*cab'),
      about: 'The Toyota Hilux Double Cabin is a four-door, five-seat pickup. Most sold in Uganda have the 2.4 litre diesel engine with 4x4 drive, built for town and upcountry roads alike.',
    },
    model('Hilux', 'hilux', 'hi-lux'),
    model('Hiace', 'hiace', 'hi-ace', 'drone'),
    model('Alphard', 'alphard'),
    model('Vellfire', 'vell?fire'),
    model('Premio', 'premio'),
    model('Allion', 'allion'),
    model('Fielder', 'fielder'),
    model('Axio', 'axio'),
    model('Corolla', 'corolla'),
    model('Wish', 'wish'),
    model('Isis', 'isis'),
    model('Aqua', 'aqua'),
    model('Vitz', 'vitz'),
    model('Passo', 'passo'),
    model('Auris', 'auris'),
    model('Probox', 'probox'),
    model('Succeed', 'succeed'),
    model('Vanguard', 'vanguard'),
    model('Rumion', 'rumion'),
    model('Mark X', 'mark\\s*-?x'),
    model('Fortuner', 'fortuner'),
    model('Camry', 'camry'),
    model('Prius', 'prius'),
    model('Ipsum', 'ipsum'),
    model('Crown', 'crown'),
    model('Sienta', 'sienta'),
    model('Spacio', 'spacio'),
    model('Belta', 'belta'),
    model('Kluger', 'kluger'),
    model('Rush', 'rush'),
    model('Raum', 'raum'),
    model('Runx', 'runx'),
    model('Ractis', 'ractis'),
    model('Estima', 'estima'),
    model('Coaster', 'coaster'),
  ],
  subaru: [
    model('Forester', 'f[o]r+e?st[e]?r', 'x[\\s-]*br[ae]a?[ck]k?'),
    model('XV', 'xv'),
    model('Impreza', 'impreza'),
    model('Outback', 'outback'),
    model('Legacy', 'legacy'),
    model('Levorg', 'levorg'),
    model('WRX', 'wrx'),
    model('Exiga', 'exiga'),
  ],
  mazda: [
    model('CX-5', 'cx\\s*-?\\s*5'),
    model('CX-8', 'cx\\s*-?\\s*8'),
    model('CX-3', 'cx\\s*-?\\s*3'),
    model('CX-7', 'cx\\s*-?\\s*7'),
    model('CX-9', 'cx\\s*-?\\s*9'),
    model('Axela', 'axela'),
    model('Demio', 'demio'),
    model('Atenza', 'atenza'),
    model('Premacy', 'premacy'),
    model('Verisa', 'verisa'),
    model('BT-50', 'bt\\s*-?\\s*50'),
  ],
  'mercedes-benz': [
    model('GLE', 'gle'),
    model('GLS', 'gls'),
    model('GLC', 'glc'),
    model('GLA', 'gla'),
    model('ML', 'ml\\s*-?\\d{3}', 'ml', 'm-class'),
    model('G-Class', 'g\\s*-?class', 'g\\s*-?wagon', 'g\\s?63'),
    model('S-Class', 's\\s*-?(?:class|\\d{3})'),
    model('E-Class', 'e\\s*-?(?:class|\\d{3})'),
    model('C-Class', 'c\\s*-?(?:class|\\d{3})'),
  ],
  volkswagen: [
    model('Golf', 'golf'),
    model('Touareg', 'tou?areg'),
    model('Tiguan', 'tiguan'),
    model('Polo', 'polo'),
    model('Passat', 'passat'),
    model('Amarok', 'amarok'),
    model('Jetta', 'jetta'),
  ],
  ford: [
    model('Ranger', 'ranger', 'wild\\s*tra?c?k'),
    model('Everest', 'everest'),
    model('Escape', 'escape'),
    model('Explorer', 'explorer'),
    model('Kuga', 'kuga'),
    model('Focus', 'focus'),
    model('Fiesta', 'fiesta'),
    model('Transit', 'transit'),
  ],
  nissan: [
    model('X-Trail', 'x\\s*-?\\s*trail'),
    model('Patrol', 'patrol'),
    model('Navara', 'navara'),
    model('Hardbody', 'hard\\s*body'),
    model('Note', 'note'),
    model('March', 'march'),
    model('Dualis', 'dualis'),
    model('Juke', 'juke'),
    model('Tiida', 'tiida'),
    model('Teana', 'teana'),
    model('Serena', 'serena'),
    model('Caravan', 'caravan'),
    model('Murano', 'murano'),
    model('Wingroad', 'wing\\s*road'),
  ],
  honda: [
    model('CR-V', 'cr\\s*-?\\s*v'),
    model('HR-V', 'hr\\s*-?\\s*v'),
    model('Fit', 'fit'),
    model('Vezel', 'vezel'),
    model('Civic', 'civic'),
    model('Accord', 'accord'),
    model('Stream', 'stream'),
    model('Odyssey', 'odyssey'),
    model('Insight', 'insight'),
    model('Freed', 'freed'),
    model('Airwave', 'airwave'),
  ],
  bmw: [
    model('X1', 'x1'), model('X3', 'x3'), model('X5', 'x5'), model('X6', 'x6'), model('X7', 'x7'),
    model('3 Series', '3\\s*-?series', '3[1-4]\\di'),
    model('5 Series', '5\\s*-?series', '5[2-5]\\di'),
    model('7 Series', '7\\s*-?series', '7[3-5]\\di'),
  ],
  lexus: [
    model('LX', 'lx\\s*-?\\d{0,3}'),
    model('GX', 'gx\\s*-?\\d{0,3}'),
    model('RX', 'rx\\s*-?\\d{0,3}'),
    model('NX', 'nx\\s*-?\\d{0,3}'),
    model('ES', 'es\\s*-?\\d{3}'),
    model('IS', 'is\\s*-?\\d{3}'),
  ],
  hyundai: [
    model('Tucson', 'tucson'),
    model('Santa Fe', 'santa\\s*-?fe'),
    model('Creta', 'creta'),
    model('Elantra', 'elantra'),
    model('Sonata', 'sonata'),
    model('Starex', 'starex', 'h\\s*-?1'),
  ],
  kia: [
    model('Sportage', 'sportage'),
    model('Sorento', 'sorento'),
    model('Seltos', 'seltos'),
    model('Carnival', 'carnival'),
    model('Rio', 'rio'),
    model('Picanto', 'picanto'),
  ],
  infiniti: [
    model('QX80', 'qx\\s*-?80'),
    model('QX60', 'qx\\s*-?60'),
    model('QX56', 'qx\\s*-?56'),
    model('QX50', 'qx\\s*-?50'),
    model('FX', 'fx\\s*-?\\d{0,2}'),
  ],
  chevrolet: [
    model('Cruze', 'cruze'),
    model('Captiva', 'captiva'),
    model('Trailblazer', 'trail\\s*blazer'),
    model('Tahoe', 'tahoe'),
    model('Silverado', 'silverado'),
  ],
  audi: [
    model('Q3', 'q3'), model('Q5', 'q5'), model('Q7', 'q7'), model('Q8', 'q8'),
    model('A3', 'a3'), model('A4', 'a4'), model('A6', 'a6'), model('A8', 'a8'),
  ],
}

export function brandModels(brandName: string): CarModel[] {
  return CATALOG[slugify(brandName)] ?? []
}

export function findModelBySlug(brandName: string, modelSlug: string) {
  return brandModels(brandName).find((item) => item.slug === modelSlug) ?? null
}

type ModelSource = { model?: string | null; title?: string | null }

/** The catalog model of a listing, read from its model field first and then its title. */
export function matchModel(brandName: string, car: ModelSource): CarModel | null {
  const models = brandModels(brandName)
  for (const text of [car.model, car.title]) {
    const found = text && models.find((item) => item.pattern.test(text))
    if (found) return found
  }
  return null
}

/** What the seller typed, without the brand, years, "model" or engine sizes; empty if nothing is left. */
function cleanModel(brandName: string, raw: string) {
  const brandWords = brandName.split(/[\s-]+/).map((word) => word.replace(/[^a-z0-9]/gi, '')).filter(Boolean)
  const cleaned = raw
    .replace(new RegExp(`\\b(?:${[...brandWords, 'benz', 'mercedes'].join('|')})\\b`, 'gi'), ' ')
    .replace(/\b(?:19|20)\d{2}\b|\bmod[ae]l\b|\b\d(?:\.\d)?\s*cc\b|\b\d\.\d\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /[a-z]/i.test(cleaned) ? cleaned : ''
}

/** The model name to show for a listing, e.g. "Land Cruiser Prado"; empty when it is unknown. */
export function modelName(brandName: string, car: ModelSource) {
  return matchModel(brandName, car)?.name ?? cleanModel(brandName, car.model ?? '')
}
