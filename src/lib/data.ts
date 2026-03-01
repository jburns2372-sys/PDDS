
import { Landmark, Scale, Building2, Shield, HeartHandshake, BookOpen } from "lucide-react";

/**
 * PDDS Party Configuration & Official References
 */

// Official PDDS leadership roles - Synchronized with Command Manual 2025
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
  "VP legal affairs"
];

// Jurisdictional hierarchy levels
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

/**
 * Intelligent helper to categorize provinces into island groups.
 */
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
  return "Luzon"; // Fallback for NCR and Northern regions
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
    details: [
      "Shift to Federalism",
      "Parliamentary form of government",
      "Strengthen local autonomy",
    ],
  },
  {
    title: "Politics",
    icon: "Gavel",
    details: [
      "Electoral reforms",
      "Anti-dynasty provisions",
      "Campaign finance regulation",
    ],
  },
  {
    title: "Economics",
    icon: "Landmark",
    details: [
      "10% Flat Tax with TABOR",
      "Free Market principles",
      "No Deficit Spending policy",
    ],
  },
  {
    title: "Civil Government & Security",
    icon: "Shield",
    details: [
      "Modernize armed forces",
      "Enhance national police capabilities",
      "Cybersecurity infrastructure development",
    ],
  },
  {
    title: "Criminal Justice",
    icon: "Scale",
    details: [
      "Judicial reform",
      "Focus on rehabilitation",
      "Decongest prison systems",
    ],
  },
  {
    title: "Social Benefits & Welfare",
    icon: "HeartHandshake",
    details: [
      "Universal healthcare access",
      "Affordable housing programs",
      "Quality public education for all",
    ],
  },
];

export const pddsInfo = {
  preamble: [
    "Kami, mga Kristyanong Makabayan, ay nanampalataya na ang Panginoong Hesus ang Hari at may-ari ng langit at lupa, na siya ring namumuno sa lahat ng bansa. Na ako bilang tao na Kanyang nilikha ay may tungkulin na pangalagaan ang mundo na bigay niya sa atin. Bilang Pilipino mamahalin at poprotektahan ko ang bayan kong Pilipinas.",
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
    {
      title: "Constitutional Reform",
      points: ["Federal Form of Government"],
    },
    {
      title: "Reform Agenda for Politics",
      points: [
        "Public Service: Public Trust",
        "Rule of Law not Mob Rule",
        "An Equitable Electoral System and Suffrage Parliamentary (Multi-Party System)",
        "Criteria for Elective Civil servants - Elected after Qualified",
      ],
    },
    {
      title: "Reform Agenda for Economics",
      points: [
        "Simplified (Flat) Tax with TABOR (Tax Payers Bill of Rights)",
        "Land, water, and all natural resources must be managed by people, families, and communities and NOT by civil government",
        "Limited Government Interference in Business",
        "No Government Borrowings/Guarantees",
        "No Deficit Spending",
        "Sound Money - A Return to Basics: Currency versus Fiat Money",
        "Honest not Fractional Reserve Banking Policies",
      ],
    },
    {
      title: "Reform Agenda for Civil Government",
      points: [
        "Parliament of Inter-Faith / Inter-denominational, Multi-Tribal, and Multi-Racial States in a Democratic yet Republican (Representative) Setting",
        "Civilian Authority NOT Militarized",
        "Defense of National Government Citizen's Militia for National Defense",
      ],
    },
    {
      title: "Reform Agenda for Criminal Justice",
      points: [
        "The right to bear arms, for protection and preservation, shall be inviolable",
        "Capital Punishment: Death for Murderers, Corrupt Officials, and Heinous Crimes",
        "Jury System",
        "Rationalized Campaign Against Deliquency and Illegal Drugs",
      ],
    },
    {
      title: "Reform Agenda for Social Benefits, Security, Investment, and Welfare",
      points: [
        "Money should be in the hands of people not civil government",
        "Community-based Educational System: People vis-à-vis State Control",
      ],
    },
  ],
};
