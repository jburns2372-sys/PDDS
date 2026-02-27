export const mockStats = [
  { title: "Total Verified Members", value: "1,250,321", change: "+12.5%" },
  { title: "Pending Approvals", value: "47", change: "+2" },
  { title: "Upcoming Events", value: "3", change: "This week" },
];

export const officerRoles = [
  { id: 3, role: "President", name: "Greco Belgica", avatarId: "avatar-president" },
  { id: 4, role: "Vice President", name: "Gen. Rey Leonardo Guerrero", avatarId: "avatar-vice-president" },
  { id: 1, role: "Chairman", name: "Gen. Hermogenes Esperon", avatarId: "avatar-chairman" },
  { id: 2, role: "Vice Chairman", name: "Atty. Ruphil Bañoc", avatarId: "avatar-vice-chairman" },
  { id: 5, role: "Secretary General", name: "Atty. Joy B. Puno", avatarId: "avatar-secretary-general" },
  { id: 6, role: "Treasurer", name: "Margarita “Tingting” Cojuangco", avatarId: "avatar-treasurer" },
  { id: 7, role: "Auditor", name: "Peter “Kuya” L. Tiu", avatarId: "avatar-auditor" },
  { id: 8, role: "VP Ways & Means", name: "Ma. “Marichu” C. Mauro", avatarId: "avatar-vp-ways-means" },
  { id: 9, role: "VP Media Comms", name: "Gen. Abraham “Abe” F. Bagasin", avatarId: "avatar-vp-media-comms" },
  { id: 10, role: "VP Soc Med Comms", name: "Jamal Ashley Yahya", avatarId: "avatar-vp-soc-med-comms" },
  { id: 11, role: "VP Events and Programs", name: "Gen. Thompson C. Lantion", avatarId: "avatar-vp-events" },
  { id: 12, role: "VP Membership", name: "Audie “APT” A. Pacia", avatarId: "avatar-vp-membership" },
  { id: 13, role: "VP Legal Affairs", name: "Atty. Jose “Joe” C. Malvar", avatarId: "avatar-vp-legal-affairs" },
];

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

export const mockAnnouncement = `
PDDS LEADCON 2024: A resounding success in shaping the future of Filipino leadership

MANILA, PHILIPPINES – The Federalismo ng Dugong Dakilang Samahan (PDDS) successfully concluded its annual Leadership Conference (LEADCON 2024) this past weekend, drawing over 500 party leaders and members from across the nation. The two-day event, held at the Philippine International Convention Center (PICC), was a landmark occasion focused on strategizing for the upcoming elections, reinforcing party ideology, and introducing key policy reforms aimed at national progress.

The conference was opened by Party President Greco Belgica, who delivered a powerful keynote address emphasizing the party's unwavering commitment to its core principles, or "Kartilya." He stated, "Our path is clear: a nation built on the foundations of Kristyanong makabayan, justice, and selfless service. We are here not for ourselves, but for the Filipino people. It is our solemn duty to fight corruption, eradicate crime, and build a truly free and prosperous society."

A major highlight of LEADCON 2024 was the formal presentation of the party's comprehensive "Program of Government." This six-pillar platform outlines the party's vision for transformative change in the Philippines. The pillars—Constitutional Reform, Politics, Economics, Civil Government & Security, Criminal Justice, and Social Benefits & Welfare—were discussed in detail during breakout sessions led by key officers. The proposed 10% flat tax system under the Economics pillar garnered significant attention, with proponents arguing it would simplify the tax code, spur economic growth, and reduce opportunities for corruption.

Party Chairman Gen. Hermogenes Esperon led a crucial session on national security and federalism, outlining the strategic benefits of shifting to a federal-parliamentary system. "Federalism is not about dividing the nation; it is about empowering our regions to achieve their full potential," Gen. Esperon explained. "It will bring government closer to the people, ensuring that services are delivered efficiently and that local leaders are truly accountable to their constituents."

The conference also served as a platform for recognizing the tireless efforts of its members. The new "Dugong Dakila" award was introduced to honor grassroots leaders who have shown exemplary dedication to community service and party-building. The event concluded with a renewed sense of unity and purpose, as members pledged their full support for the party's candidates and its mission to build a better Philippines. As the party moves forward, the resolutions and strategies adopted at LEADCON 2024 are expected to be the driving force behind its political and social initiatives in the years to come.
`;

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
        "Criteria for Elective Civil Servants - Elected after Qualified",
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
