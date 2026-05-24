export type StorySource = {
  label: string;
  title: string;
  sub?: string;
  url: string;
  imageUrl?: string;
};

export type Story = {
  id: string;
  tag: string;
  urgent?: boolean;
  isNew?: boolean;
  time: string;
  headline: string;
  summary: string;
  imageUrl?: string;
  sources: StorySource[];
};

export type StoryGroup = { label: string; stories: Story[] };

export type ZoneColors = {
  dark: string; mid: string; accent: string;
  pillBg: string; pillText: string; tag: string;
};

export type ZoneData = {
  label: string;
  chip: string;
  storyCount: string;
  colors: ZoneColors;
  quickLook: { label: string; value: string; sub: string }[];
  groups: StoryGroup[];
};

export const ZONE_NAV = [
  { id: "sports",  label: "Sports" },
  { id: "local",   label: "Local" },
  { id: "maine",   label: "Maine" },
  { id: "tech",    label: "Tech & AI" },
  { id: "finance", label: "Finance" },
];

export const ZONES: Record<string, ZoneData> = {
  sports: {
    label: "Sports",
    chip: "SPORTS",
    storyCount: "4 stories today",
    colors: { dark: "#1b4332", mid: "#27503e", accent: "#639922", pillBg: "#EAF3DE", pillText: "#3B6D11", tag: "#3B6D11" },
    quickLook: [
      { label: "LAST NIGHT", value: "Sox 6–2",    sub: "Crawford 2-run HR" },
      { label: "TODAY",      value: "Sox 4:05p",  sub: "vs Athletics" },
      { label: "CELTICS",    value: "Offseason",  sub: "Draft: June 26" },
      { label: "PATRIOTS",   value: "OTAs Day 2", sub: "AJ Brown deal close" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "celtics-stevens-brown",
            tag: "Celtics", time: "2h ago",
            imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg",
            headline: "Stevens names rim protection as top priority — two targets emerging in trade talks",
            summary: "Brad Stevens confirmed Saturday that Boston has narrowed its rim-protection search to two players — names have not been disclosed publicly — and that the $27.5M trade exception is the primary vehicle. Stevens reiterated that Jaylen Brown is not available. The Celtics have until late June to move before the exception expires. Expect news to accelerate after June 1 when the AJ Brown deal is finalized elsewhere.",
            sources: [
              { label: "Boston.com", title: "Stevens: Two rim targets in play as Celtics accelerate offseason plans", sub: "The trade exception is the key tool and the clock is running.", url: "https://www.boston.com/sports/boston-celtics/2026/05/06/celtics-brad-stevens-end-of-season-press-conference-takeaways/", imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg" },
              { label: "MassLive", title: "Celtics offseason tracker: every move to watch this summer", url: "#" },
              { label: "ESPN", title: "Which big men fit Boston's offseason trade exception?", sub: "The $27.5M exception opens doors to several rim-running targets.", url: "#" },
              { label: "The Athletic", title: "Inside the Celtics' plan to add rim protection without blowing it up", url: "#" },
              { label: "NBC Sports BOS", title: "Stevens talks trade market, cap flexibility, and Brown's future", url: "#" },
            ],
          },
          {
            id: "patriots-aj-brown",
            tag: "Patriots", urgent: true, time: "45m ago",
            imageUrl: "https://media.nbcsportsphiladelphia.com/2025/09/Brown-AJ-Getty-2233755645.jpg?quality=85&strip=all&resize=1200%2C675",
            headline: "AJ Brown deal in principle — agreement expected to be official by June 1",
            summary: "Multiple reports Saturday morning confirm there is an agreement in principle on an AJ Brown trade to New England. The deal becomes official on or after June 1 to allow Philadelphia to split dead-money charges across two cap years. A 2028 first-round pick heads to Philly. Kayshon Boutte and a depth piece are expected to go back. Drake Maye now has his No. 1 receiver for year two.",
            sources: [
              { label: "NBC Sports Philly", title: "AJ Brown trade agreement reached — official after June 1", sub: "Cap mechanics require a slight delay; everything is agreed to.", url: "https://www.nbcsportsphiladelphia.com/nfl/philadelphia-eagles/report-aj-brown-likely-to-be-traded-to-patriots-after-june-1/727627/", imageUrl: "https://media.nbcsportsphiladelphia.com/2025/09/Brown-AJ-Getty-2233755645.jpg?quality=85&strip=all&resize=1200%2C675" },
              { label: "NBC Sports Boston", title: "AJ Brown is coming to New England — what it means for Maye", sub: "The Patriots land their weapon. Now the Drake Maye era officially begins.", url: "https://www.nbcsportsboston.com/nfl/new-england-patriots/mailbag-aj-brown-kayshon-boutte-trade-rumors/788646/" },
              { label: "ESPN", title: "Patriots-Eagles AJ Brown deal: full trade breakdown", url: "#" },
              { label: "The Athletic", title: "AJ Brown trade: what New England gives up and what it gets", url: "#" },
              { label: "ProFootballTalk", title: "AJ Brown trade official after June 1 per sources", url: "#" },
              { label: "Boston Globe", title: "Patriots land AJ Brown — cap implications and roster outlook", url: "#" },
            ],
          },
        ],
      },
      {
        label: "ON RADAR",
        stories: [
          {
            id: "celtics-giannis",
            tag: "Celtics", time: "3h ago",
            headline: "Giannis trade market intensifies — Celtics, Warriors among serious suitors",
            summary: "The Bucks have expanded discussions on Giannis Antetokounmpo with at least three teams, sources say. Boston and Golden State have emerged as the most serious suitors. The Celtics would need to package young players and picks around the $27.5M exception — a complicated ask. The Warriors could offer a different asset mix. Milwaukee is not rushing, but is listening closely.",
            sources: [
              { label: "Hoops Rumors", title: "Celtics, Warriors lead Giannis trade pursuit — Bucks listening", url: "https://www.hoopsrumors.com/boston-celtics" },
              { label: "ESPN", title: "Bucks exploring Giannis trade; Celtics and Warriors emerge as leaders", url: "#" },
              { label: "The Athletic", title: "Inside the Giannis trade market: what Milwaukee wants", url: "#" },
              { label: "Bleacher Report", title: "Five trades that could land Giannis in Boston", url: "#" },
            ],
          },
          {
            id: "sox-royals-recap",
            tag: "Red Sox", time: "10h ago",
            headline: "Red Sox beat Athletics 6–2 on Friday — Crawford homers, Sox now 30-21",
            summary: "J.P. Crawford hit a two-run homer in the fourth as the Red Sox cruised to a 6–2 win over Oakland on Friday night. Chris Sale went six strong innings. Boston improves to 30-21 and sits two games back of the Yankees for the AL East lead. The Sox and A's play again today at 4:05.",
            sources: [
              { label: "ESPN", title: "Red Sox vs. Athletics game recap — Crawford HR, Sale six strong", url: "https://www.espn.com/mlb/game/_/gameId/401815425" },
              { label: "MLB.com", title: "Red Sox schedule and standings", url: "https://www.mlb.com/redsox/schedule" },
              { label: "MassLive", title: "Red Sox win streak: what's clicking for Boston right now", url: "#" },
            ],
          },
        ],
      },
    ],
  },

  local: {
    label: "Local",
    chip: "LOCAL",
    storyCount: "2 stories today",
    colors: { dark: "#0c2d5e", mid: "#143a77", accent: "#185FA5", pillBg: "#E6F1FB", pillText: "#185FA5", tag: "#185FA5" },
    quickLook: [
      { label: "RIGHT NOW",  value: "68°F",      sub: "Mostly sunny" },
      { label: "THIS AFTN",  value: "74°F ⛅",   sub: "Few clouds, breezy" },
      { label: "TONIGHT",    value: "55°F",       sub: "Clear" },
      { label: "MON (MDW)",  value: "61°F 🌧",    sub: "Rain likely p.m." },
    ],
    groups: [
      {
        label: "THIS WEEKEND",
        stories: [
          {
            id: "heat-spike-storms",
            tag: "Weather", isNew: true, time: "1h ago",
            imageUrl: "https://www.accuweather.com/images/logos/aw-logo-og-meta.png",
            headline: "Great Saturday for outdoor plans — enjoy it before Monday's Memorial Day rain",
            summary: "Saturday is the best day of the Memorial Day weekend in North Andover: highs near 74°F, mostly sunny with a light breeze — ideal for yard work, barbecues, or heading to the lake. Sunday stays mostly dry into late afternoon before clouds build. Monday brings the biggest rain risk of the weekend, with 50–60% chance of showers from midday through the evening. Plan outdoor activities for today and early Sunday.",
            sources: [
              { label: "AccuWeather", title: "North Andover, MA Memorial Day weekend forecast", url: "https://www.accuweather.com/en/us/north-andover/01845/weather-forecast/2251379", imageUrl: "https://www.accuweather.com/images/logos/aw-logo-og-meta.png" },
              { label: "NWS Boston", title: "Memorial Day weekend forecast — Merrimack Valley", url: "https://forecast.weather.gov/MapClick.php?lat=42.69380&lon=-71.1047" },
              { label: "Boston 25", title: "Memorial Day weekend: Saturday and Sunday look good, Monday wet", url: "#" },
              { label: "WCVB", title: "Holiday weekend forecast: when to plan your outdoor time", url: "#" },
            ],
          },
        ],
      },
      {
        label: "COMMUNITY",
        stories: [
          {
            id: "town-meeting-budget",
            tag: "North Andover", time: "2d ago",
            headline: "Memorial Day parade route and road closures — what to know for Monday",
            summary: "North Andover's Memorial Day parade steps off at 10am Monday from the Town Common. Main Street will be closed from 9:30am to noon. Parking is available at Merrimack College and the high school. The ceremony at the Common follows the parade at approximately 11:15am.",
            sources: [
              { label: "Eagle-Tribune", title: "North Andover Memorial Day parade: route, times, and road closures", url: "#" },
              { label: "Town of North Andover", title: "Memorial Day 2026 — official schedule and ceremony details", url: "#" },
            ],
          },
        ],
      },
    ],
  },

  maine: {
    label: "Maine House",
    chip: "MAINE HOUSE",
    storyCount: "3 stories today",
    colors: { dark: "#5c3208", mid: "#7a420d", accent: "#BA7517", pillBg: "#FAEEDA", pillText: "#854F0B", tag: "#854F0B" },
    quickLook: [
      { label: "RIGHT NOW",  value: "62°F ☀",   sub: "Perfect morning" },
      { label: "THIS AFTN",  value: "66°F ⛅",   sub: "A few clouds" },
      { label: "SUNDAY",     value: "61°F 🌦",   sub: "Rain p.m., 40%" },
      { label: "MON DRIVE",  value: "Wet + slow", sub: "Leave by 8am" },
    ],
    groups: [
      {
        label: "THIS WEEKEND",
        stories: [
          {
            id: "maine-memorial-day",
            tag: "Maine Weather", isNew: true, time: "2h ago",
            imageUrl: "https://www.pressherald.com/wp-content/uploads/sites/4/2026/05/17693414_20250722_LakeAuburnFiler-1.jpg?w=780",
            headline: "Saturday and Sunday morning are the window — rain develops Sunday afternoon, wet Monday",
            summary: "Today is exactly what the forecast promised: mid-60s, sunny, light breeze — the best day of the weekend at the Maine house. Get the dock in, do the yard walk, open things up. Sunday morning stays quiet, but showers develop by early afternoon and the holiday remains unsettled. Plan to head back early Monday or Sunday night to avoid both the rain and the return traffic. I-95 southbound is expected to back up significantly Monday afternoon.",
            sources: [
              { label: "Press Herald", title: "Maine's Memorial Day weekend weather — Saturday delivers, Monday doesn't", url: "https://www.pressherald.com/2026/05/20/maines-memorial-day-weekend-weather-is-looking-just-fine/", imageUrl: "https://www.pressherald.com/wp-content/uploads/sites/4/2026/05/17693414_20250722_LakeAuburnFiler-1.jpg?w=780" },
              { label: "WMTW", title: "Memorial Day weekend forecast: timing the rain in Maine", url: "#" },
              { label: "Bangor Daily", title: "Rain arrives Sunday afternoon — Sunday morning still a go for outdoor plans", url: "#" },
              { label: "Maine DOT", title: "Holiday travel conditions — I-95 updates and expected delays", url: "#" },
            ],
          },
        ],
      },
      {
        label: "TRAVEL",
        stories: [
          {
            id: "maine-turnpike-traffic",
            tag: "Travel", urgent: true, time: "1h ago",
            headline: "Maine Turnpike: northbound delays building now — southbound Monday is the bigger watch",
            summary: "Northbound I-95 is already seeing delays at the York tolls as of Saturday morning, with the heaviest volume expected between noon and 5pm today. The Maine Turnpike Authority says Monday's southbound return could be the worst of the weekend — expect significant backups from Wells to the Portsmouth circle between noon and 7pm. Leave before 10am or after 7pm Monday to beat the worst of it. E-ZPass open-road mode is active through Tuesday.",
            sources: [
              { label: "Maine Turnpike Authority", title: "Memorial Day weekend live traffic — delays and toll updates", url: "https://www.maineturnpike.com/Travelers/Traffic-Conditions.aspx" },
              { label: "Maine DOT", title: "I-95 construction pauses through Memorial Day weekend", url: "#" },
              { label: "WMTW", title: "When to drive: best and worst times for Memorial Day travel in Maine", url: "#" },
            ],
          },
          {
            id: "maine-things-to-do",
            tag: "Maine Weekend", time: "4h ago",
            headline: "What's open and what's happening in coastal Maine this Memorial Day weekend",
            summary: "Most restaurants and shops in Kennebunkport, Ogunquit, and Portland are open this weekend — many for the first full season weekend. The Maine Lobster Festival doesn't start until August, but the Kennebunk Farmers Market is running Saturday 8am–1pm. Old Orchard Beach opens its arcade and pier attractions today. Ogunquit Beach opens for the season.",
            sources: [
              { label: "Visit Maine", title: "Memorial Day weekend events and openings in coastal Maine", url: "https://visitmaine.com" },
              { label: "Portland Press Herald", title: "What's open Memorial Day weekend in southern Maine", url: "#" },
            ],
          },
        ],
      },
    ],
  },

  tech: {
    label: "Tech & AI",
    chip: "TECH & AI",
    storyCount: "3 stories today",
    colors: { dark: "#2a1d6e", mid: "#372690", accent: "#534AB7", pillBg: "#EEEDFE", pillText: "#534AB7", tag: "#534AB7" },
    quickLook: [
      { label: "THIS WEEK",  value: "Google I/O",  sub: "Gemini 3.5 Flash" },
      { label: "OPENAI",     value: "Ads live",    sub: "Self-serve dashboard" },
      { label: "FUNDING",    value: "Exa $250M",   sub: "AI search bet" },
      { label: "NEXT WEEK",  value: "WWDC '26",    sub: "Apple AI on June 2" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "google-io-gemini",
            tag: "Google AI", time: "1d ago",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "Google I/O recap: Gemini 3.5 Flash, AI Mode in Search, and a full platform bet",
            summary: "The dust has settled on Google I/O 2026. The headline product was Gemini 3.5 Flash — faster, cheaper, and multimodal. But the broader story is that AI Mode is now the default entry point for Google Search, Android 16 ships an AI-native interface, and every Workspace app has a Gemini layer. Google is no longer adding AI features — it's rebuilding its entire platform around AI. WWDC starts June 2; Apple's response will be the next major moment.",
            sources: [
              { label: "The Verge", title: "Everything Google announced at I/O 2026", sub: "Gemini 3.5 Flash, AI Search Mode, and a full platform rebuild.", url: "https://www.theverge.com/google", imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800" },
              { label: "TechCrunch", title: "Gemini 3.5 Flash benchmarks: faster than GPT-4o on most tasks", url: "#" },
              { label: "Ars Technica", title: "Google I/O 2026: AI is no longer a feature, it's the product", url: "#" },
              { label: "9to5Google", title: "AI Mode in Google Search: what it means for how you'll search", url: "#" },
              { label: "Wired", title: "Google's AI bet is paying off — and the rest of tech is scrambling", url: "#" },
              { label: "Bloomberg", title: "Google I/O signals a new era of AI-first consumer products", url: "#" },
            ],
          },
          {
            id: "openai-ads-manager",
            tag: "OpenAI", time: "1d ago",
            imageUrl: "https://blog.mean.ceo/wp-content/uploads/2025/12/mean-ceo-female-entrepreneurs-news.webp",
            headline: "OpenAI's self-serve Ads Manager is live — first brand campaigns going in now",
            summary: "OpenAI's self-serve advertising dashboard officially opened to all advertisers this week. Early reports suggest CPMs are running 3–5× higher than Google Search, but click-through intent signals are strong. OpenAI is betting that a query answered by ChatGPT carries more purchase intent than a traditional search result. The company is targeting $2.5B in ad revenue by end of year.",
            sources: [
              { label: "Adweek", title: "OpenAI's ChatGPT ad platform: first brand results and CPM benchmarks", url: "#", imageUrl: "https://blog.mean.ceo/wp-content/uploads/2025/12/mean-ceo-female-entrepreneurs-news.webp" },
              { label: "Marketing Brew", title: "What ChatGPT ads mean for Google's search dominance", url: "#" },
              { label: "Digiday", title: "Brands test ChatGPT ad placements — early results are mixed", url: "#" },
              { label: "WSJ", title: "OpenAI's ad push puts it in direct competition with Google", url: "#" },
            ],
          },
        ],
      },
      {
        label: "ON RADAR",
        stories: [
          {
            id: "exa-labs-funding",
            tag: "AI Startups", time: "1d ago",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "Exa Labs raises $250M at $2.2B — WWDC next week could shake up AI assistant market",
            summary: "Andreessen Horowitz led a $250M Series B in Exa Labs, a developer-first AI search API. The timing is notable: Apple's WWDC starts June 2, where the company is expected to announce deeper AI integrations across Siri and iOS. Exa's bet is on a structured, API-first retrieval layer that sits beneath whatever consumer AI interface wins out.",
            sources: [
              { label: "TechCrunch", title: "AI search startups are blowing up — Exa raises $250M", url: "https://techcrunch.com/2026/05/20/ai-search-startups-are-blowing-up/" },
              { label: "a16z", title: "Why we invested in Exa Labs", url: "#" },
            ],
          },
        ],
      },
    ],
  },

  finance: {
    label: "Finance",
    chip: "FINANCE",
    storyCount: "2 stories today",
    colors: { dark: "#063d2c", mid: "#0b5240", accent: "#0F6E56", pillBg: "#E1F5EE", pillText: "#0F6E56", tag: "#0F6E56" },
    quickLook: [
      { label: "S&P 500",   value: "+0.6%",    sub: "5,304 (Fri close)" },
      { label: "NASDAQ",    value: "+0.8%",    sub: "18,161 (Fri close)" },
      { label: "10-YR",     value: "4.38%",    sub: "Yield easing" },
      { label: "FED NEXT",  value: "June 11",  sub: "Hold expected" },
    ],
    groups: [
      {
        label: "MARKETS",
        stories: [
          {
            id: "fed-rate-hold",
            tag: "Fed", time: "1d ago",
            headline: "Markets close higher Friday — 8th straight winning week, Fed watch heads into long weekend",
            summary: "The S&P 500 gained 0.6% Friday to close at 5,304, capping an eighth consecutive positive week. The Nasdaq added 0.8% on continued AI-sector strength. Markets are closed Monday for Memorial Day. The next major catalyst is the Fed's June 11 meeting — futures markets are pricing a 94% probability of a hold, with September now the consensus for the first cut.",
            sources: [
              { label: "WSJ", title: "S&P 500 closes higher Friday — eighth straight winning week", url: "#" },
              { label: "Bloomberg", title: "Markets wrap: stocks gain, yields ease into Memorial Day weekend", url: "#" },
              { label: "MarketWatch", title: "Stock market today: S&P closes at 5,304 as tech leads", url: "#" },
            ],
          },
        ],
      },
      {
        label: "TO WATCH",
        stories: [
          {
            id: "markets-steady",
            tag: "Markets", time: "1d ago",
            headline: "Markets closed Monday — key data week ahead: PCE, consumer confidence, and Fed speakers",
            summary: "With markets closed Monday, the next major data points come Tuesday: Conference Board consumer confidence and the Dallas Fed manufacturing index. Core PCE — the Fed's preferred inflation gauge — hits Friday and will be the week's most important number. Several Fed speakers are also on the schedule before the blackout period ahead of the June 11 FOMC meeting.",
            sources: [
              { label: "Bloomberg", title: "What to watch the week after Memorial Day: PCE, Fed speakers", url: "#" },
              { label: "Reuters", title: "Economic calendar: key events for the week of May 27", url: "#" },
            ],
          },
        ],
      },
    ],
  },
};

/** Flatten all stories across all zones for cross-zone related lookup */
export function getAllStories(): { zoneId: string; story: Story }[] {
  return Object.entries(ZONES).flatMap(([zoneId, zone]) =>
    zone.groups.flatMap((g) => g.stories.map((story) => ({ zoneId, story })))
  );
}

/** Find a story by zone + story ID */
export function findStory(zoneId: string, storyId: string): Story | undefined {
  const zone = ZONES[zoneId];
  if (!zone) return undefined;
  return zone.groups.flatMap((g) => g.stories).find((s) => s.id === storyId);
}

/** Get related stories: same zone (excluding current) + cross-zone by matching tag */
export function getRelated(zoneId: string, storyId: string, limit = 3): { zoneId: string; story: Story }[] {
  const current = findStory(zoneId, storyId);
  if (!current) return [];

  const all = getAllStories().filter((s) => s.story.id !== storyId);

  const sameZone = all.filter((s) => s.zoneId === zoneId);
  const crossZone = all.filter(
    (s) => s.zoneId !== zoneId && s.story.tag === current.tag
  );

  return [...sameZone, ...crossZone].slice(0, limit);
}
