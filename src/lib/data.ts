import { Landmark, Scale, Building2, Shield, HeartHandshake, BookOpen } from "lucide-react";

/**
 * PDDS Party Configuration & Official References
 */

// Official Logo Source of Truth
export const PDDS_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/PDDS_1024x1024.png?alt=media";

export const pddsLeadershipRoles = [
  "President",
  "Chairman",
  "Vice Chairman",
  "VP",
  "Secretary General",
  "Treasurer",
  "Public Relations Officer",
  "Auditor",
  "VP Ways & Means Chair",
  "VP Media Comms",
  "VP Soc Med Comms",
  "VP Events and Programs",
  "VP Membership",
  "VP legal affairs",
  "Coordinator"
];

export const jurisdictionLevels = [
  "National",
  "Regional",
  "Provincial",
  "City/Municipal",
  "Barangay",
];

export const policyCategories = [
  { name: "Economy", icon: Landmark },
  { name: "Justice", icon: Scale },
  { name: "Local Governance", icon: Building2 },
  { name: "Security", icon: Shield },
  { name: "Social Welfare", icon: HeartHandshake },
  { name: "Education", icon: BookOpen }
];

export const cityCoords: Record<string, [number, number]> = {
  "QUEZON CITY": [14.6760, 121.0437],
  "CITY OF MANILA": [14.5995, 120.9842],
  "METRO MANILA (NCR)": [14.5995, 120.9842],
  "CEBU CITY": [10.3157, 123.8854],
  "DAVAO CITY": [7.1907, 125.4553],
  "ILOILO CITY": [10.7202, 122.5621],
  "BACOLOD CITY": [10.6765, 122.9509],
  "CAGAYAN DE ORO": [8.4542, 124.6319],
  "ZAMBOANGA CITY": [6.9214, 122.0790],
  "BAGUIO": [16.4023, 120.5960],
  "TAGUIG CITY": [14.5176, 121.0509],
  "PASIG CITY": [14.5764, 121.0851],
  "MAKATI CITY": [14.5547, 121.0244],
  "ANTIPOLO CITY": [14.5845, 121.1754],
  "CALOOCAN CITY": [14.6416, 120.9762],
  "MANILA": [14.5995, 120.9842],
};

/**
 * PDDS Regional Zip Code Directory
 * Primary source for City/Municipality Zip Codes.
 */
export const cityZipCodes: Record<string, string> = {
  "QUEZON CITY": "1100",
  "CITY OF MANILA": "1000",
  "METRO MANILA (NCR)": "1000",
  "CEBU CITY": "6000",
  "DAVAO CITY": "8000",
  "ILOILO CITY": "5000",
  "BACOLOD CITY": "6100",
  "CAGAYAN DE ORO": "9000",
  "ZAMBOANGA CITY": "7000",
  "BAGUIO": "2600",
  "TAGUIG CITY": "1630",
  "PASIG CITY": "1600",
  "MAKATI CITY": "1200",
  "ANTIPOLO CITY": "1870",
  "CALOOCAN CITY": "1400",
  "MANILA": "1000",
};

/**
 * Granular Zip Code Lookup Utility
 * Returns barangay-specific zip code if available, otherwise falls back to city code.
 */
export const getZipCode = (city: string, barangay?: string): string => {
  const cityKey = (city || "").toUpperCase().trim();
  const brgyKey = (barangay || "").toUpperCase().trim();

  // Granular mapping for complex cities (e.g., Quezon City, Manila)
  const barangayZipCodes: Record<string, Record<string, string>> = {
    "QUEZON CITY": {
      "COMMONWEALTH": "1121",
      "BATASAN HILLS": "1126",
      "HOLY SPIRIT": "1127",
      "BAGONG SILANGAN": "1119",
      "PAYATAS": "1118",
      "DILIMAN": "1101",
      "UP CAMPUS": "1101",
      "SAN BARTOLOME": "1116"
    },
    "CITY OF MANILA": {
      "INTRAMUROS": "1002",
      "ERMITA": "1000",
      "MALATE": "1004",
      "PACO": "1007",
      "PANDACAN": "1011",
      "QUIAPO": "1001",
      "SAMPALOC": "1008",
      "SAN MIGUEL": "1005"
    }
  };

  if (brgyKey && barangayZipCodes[cityKey] && barangayZipCodes[cityKey][brgyKey]) {
    return barangayZipCodes[cityKey][brgyKey];
  }

  return cityZipCodes[cityKey] || "";
};

export const getIslandGroup = (province: string) => {
  const upProv = province.toUpperCase();
  const mindanaoProvinces = [
    "DAVAO DEL SUR", "DAVAO DEL NORTE", "DAVAO ORIENTAL", "DAVAO DE ORO", "DAVAO OCCIDENTAL",
    "ZAMBOANGA DEL SUR", "ZAMBOANGA DEL NORTE", "ZAMBOANGA SIBUGAY",
    "BUKIDNON", "CAMIGUIN", "LANAO DEL NORTE", "MISAMIS OCCIDENTAL", "MISAMIS ORIENTAL",
    "COTABATO", "SOUTH COTABATO", "SARANGANI", "SULTAN KUDARAT",
    "AGUSAN DEL NORTE", "AGUSAN DEL SUR", "SURIGAO DEL NORTE", "SURIGAO DEL SUR", "DINAGAT ISLANDS",
    "BASILAN", "SULU", "TAWI-TAWI", "LANAO DEL SUR", "MAGUINDANAO DEL NORTE", "MAGUINDANAO DEL SUR"
  ];
  const visayasProvinces = [
    "CEBU", "BOHOL", "SIQUIJOR",
    "ILOILO", "ANTIQUE", "CAPIZ", "GUIMARAS", "NEGROS OCCIDENTAL",
    "NEGROS ORIENTAL", "LEYTE", "SOUTHERN LEYTE", "NORTHERN SAMAR", "EASTERN SAMAR", "WESTERN SAMAR", "BILIRAN"
  ];
  if (mindanaoProvinces.includes(upProv) || upProv.includes("DAVAO")) return "Mindanao";
  if (visayasProvinces.includes(upProv)) return "Visayas";
  return "Luzon";
};

export type Agenda = {
  title: string;
  icon: string;
  details: string[];
};

export const agendas: Agenda[] = [
  {
    title: "Constitutional Reform",
    icon: "Building2",
    details: ["Shift to Federalism", "Parliamentary form of government", "Strengthen local autonomy"],
  },
  {
    title: "Politics",
    icon: "Gavel",
    details: ["Electoral reforms", "Anti-dynasty provisions", "Campaign finance regulation"],
  },
  {
    title: "Economics",
    icon: "Landmark",
    details: ["10% Flat Tax with TABOR", "Free Market principles", "No Deficit Spending policy"],
  },
  {
    title: "Civil Government & Security",
    icon: "Shield",
    details: ["Modernize armed forces", "Enhance national police capabilities", "Cybersecurity infrastructure development"],
  },
  {
    title: "Criminal Justice",
    icon: "Scale",
    details: ["Judicial reform", "Focus on rehabilitation", "Decongest prison systems"],
  },
  {
    title: "Social Benefits & Welfare",
    icon: "HeartHandshake",
    details: ["Universal healthcare access", "Affordable housing programs", "Quality public education for all"],
  },
];

export const pddsInfo = {
  preamble: [
    "Kami, mga Kristyanong Makabayan, ay nanampalataya na ang Panginoong Hesus ang Hari at may-ari ng langit o lupa, na siya ring namumuno sa lahat ng bansa. Na ako bilang tao na Kanyang nilikha ay may tungkulin na pangalagaan ang mundo na bigay niya sa atin. Bilang Pilipino mamahalin at poprotektahan ko ang bayan kong Pilipinas.",
    "Ipaglalaban ko ang aking bayan sa sino mang tao o gobyerno na maghahasik ng karahasan sa aking lipunan at magpapahirap sa aking mga kababayan at lipunan. Itataguyod ko ang batas at katarungan. At naniniwala ako sa parusang kamatayan para sa karumaldumal na krimen, droga, at kasulasulasok na korapsyon na nagpapahirap sa buhay ng bawat Pilipino at nanggagahasa sa inang bayan.",
    "Mamahalin ko ang aking kapwa gaya ng pagmamahal ko sa aking sarili. Handa akong magsakriprisyo para sa kalayaan. Itataguyod ko ang malusog na sambayanan at malinis na kapaligiran.",
    "SA PANGINOONG HESUS AKO AY NANANALIG.",
  ],
  kartilya: [
    "Kristyanong makabayan;",
    "Batas at katarungan;",
    "Kapakanan ng kapwa bago ang sarili;",
    "Malayang Bayan, malusog na sambayanan, malinis na kapaligiran;",
    "Itigil ang korapsyon, droga, at krimen.",
  ],
  vision: "A just, free, and prosperous Filipino people and one nation under God.",
  mission: "Build a Federal system of government that will ensure justice, freedom, and prosperity.",
  program: [
    { title: "Constitutional Reform", points: ["Federal Form of Government"] },
    { title: "Reform Agenda for Politics", points: ["Public Service: Public Trust", "Rule of Law not Mob Rule", "An Equitable Electoral System and Suffrage Parliamentary (Multi-Party System)", "Criteria for Elective Civil servants - Elected after Qualified"] },
    { title: "Reform Agenda for Economics", points: ["Simplified (Flat) Tax with TABOR (Tax Payers Bill of Rights)", "Land, water, and all natural resources must be managed by people, families, and communities and NOT by civil government", "Limited Government Interference in Business", "No Government Borrowings/Guarantees", "No Deficit Spending", "Sound Money - A Return to Basics: Currency versus Fiat Money", "Honest not Fractional Reserve Banking Policies"] },
    { title: "Reform Agenda for Civil Government", points: ["Parliament of Inter-Faith / Inter-denominational, Multi-Tribal, and Multi-Racial States in a Democratic yet Republican (Representative) Setting", "Civilian Authority NOT Militarized", "Defense of National Government Citizen's Militia for National Defense"] },
    { title: "Reform Agenda for Criminal Justice", points: ["The right to bear arms, for protection and preservation, shall be inviolable", "Capital Punishment: Death for Murderers, Corrupt Officials, and Heinous Crimes", "Jury System", "Rationalized Campaign Against Deliquency and Illegal Drugs"] },
    { title: "Reform Agenda for Social Benefits, Security, Investment, and Welfare", points: ["Money should be in the hands of people not civil government", "Community-based Educational System: People vis-à-vis State Control"] },
  ],
};
