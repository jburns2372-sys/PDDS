export const mockUser = {
  name: "Juan Dela Cruz",
  role: "Secretary General",
  jurisdiction: "National",
};

export const mockStats = [
  { title: "Total Verified Members", value: "1,250,321", change: "+12.5%" },
  { title: "Pending Approvals", value: "47", change: "+2" },
  { title: "Upcoming Events", value: "3", change: "This week" },
];

export const officerRoles = [
  { id: 1, role: "Chairman", name: "Gen. Hermogenes Esperon", avatarId: "avatar-chairman" },
  { id: 2, role: "Vice Chairman", name: "Atty. Ruphil Bañoc", avatarId: "avatar-vice-chairman" },
  { id: 3, role: "President", name: "Greco Belgica", avatarId: "avatar-president" },
  { id: 4, role: "Vice President", name: "Gen. Rey Leonardo Guerrero", avatarId: "avatar-vice-president" },
  { id: 5, role: "Secretary General", name: "Atty. Joy B. Puno", avatarId: "avatar-secretary-general" },
  { id: 6, role: "Treasurer", name: "Margarita “Tingting” Cojuangco", avatarId: "avatar-treasurer" },
  { id: 7, role: "Auditor", name: "Peter “Kuya” L. Tiu", avatarId: "avatar-auditor" },
  { id: 8, role: "VP Ways & Means", name: "Ma. “Marichu” C. Mauro", avatarId: "avatar-vp-ways-means" },
  { id: 9, role: "VP Media Comms", name: "Gen. Abraham “Abe” F. Bagasin", avatarId: "avatar-vp-media-comms" },
  { id: 10, role: "VP Soc Med Comms", name: "Jamal Ashley Yahya", avatarId: "avatar-vp-soc-med-comms" },
  { id: 11, role: "VP Events", name: "Gen. Thompson C. Lantion", avatarId: "avatar-vp-events" },
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
