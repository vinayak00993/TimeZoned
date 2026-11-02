const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico", GT: "Guatemala", CR: "Costa Rica", PA: "Panama", CU: "Cuba", PR: "Puerto Rico",
  BR: "Brazil", AR: "Argentina", PE: "Peru", CO: "Colombia", CL: "Chile", VE: "Venezuela", EC: "Ecuador", UY: "Uruguay", PY: "Paraguay",
  GB: "United Kingdom", IE: "Ireland", FR: "France", DE: "Germany", NL: "Netherlands", BE: "Belgium", ES: "Spain", PT: "Portugal",
  IT: "Italy", AT: "Austria", CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", PL: "Poland", CZ: "Czechia",
  HU: "Hungary", RO: "Romania", GR: "Greece", BG: "Bulgaria", HR: "Croatia", RS: "Serbia", UA: "Ukraine", BY: "Belarus", IS: "Iceland",
  RU: "Russia", KZ: "Kazakhstan", UZ: "Uzbekistan", GE: "Georgia", AZ: "Azerbaijan", AM: "Armenia", TR: "Türkiye", AE: "United Arab Emirates",
  SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", OM: "Oman", BH: "Bahrain", LB: "Lebanon", JO: "Jordan", IQ: "Iraq", IR: "Iran", IL: "Israel",
  IN: "India", PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka", NP: "Nepal", AF: "Afghanistan", SG: "Singapore", MY: "Malaysia",
  ID: "Indonesia", TH: "Thailand", VN: "Vietnam", PH: "Philippines", MM: "Myanmar", KH: "Cambodia", LA: "Laos", JP: "Japan", KR: "South Korea",
  CN: "China", HK: "Hong Kong", TW: "Taiwan", MN: "Mongolia", AU: "Australia", NZ: "New Zealand", FJ: "Fiji", EG: "Egypt", NG: "Nigeria",
  KE: "Kenya", ZA: "South Africa", MA: "Morocco", GH: "Ghana", ET: "Ethiopia", TZ: "Tanzania", UG: "Uganda", SN: "Senegal", TN: "Tunisia",
  DZ: "Algeria", CD: "DR Congo", SD: "Sudan",
};

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

