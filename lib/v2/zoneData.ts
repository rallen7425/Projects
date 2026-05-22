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
      { label: "LAST NIGHT", value: "Sox 4–3",    sub: "Duran go-ahead HR" },
      { label: "NEXT GAME",  value: "Sat 7:10p",  sub: "vs Athletics" },
      { label: "CELTICS",    value: "Offseason",   sub: "Draft: June 26" },
      { label: "PATRIOTS",   value: "OTAs May 27", sub: "AJ Brown soon" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "celtics-stevens-brown",
            tag: "Celtics", time: "1h ago",
            imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg",
            headline: "Stevens confirms Brown not being traded — rim presence is the offseason priority",
            summary: "At his end-of-season press conference, Brad Stevens was unusually direct: Jaylen Brown is not being traded. The priority is adding rim pressure — Boston attempted fewer shots within five feet than any team in the NBA this season, and Joel Embiid exposed it in the series. After blowing a 3-1 lead and losing Game 7 at home, Stevens said the fix is adding to the roster through the trade market, not dismantling it. The $27.5M trade exception and midlevel exception are the primary tools going forward.",
            sources: [
              { label: "Boston.com", title: "Celtics Brad Stevens end-of-season press conference takeaways", sub: "Stevens addressed the loss, Jaylen Brown's future, and the plan to add size this summer.", url: "https://www.boston.com/sports/boston-celtics/2026/05/06/celtics-brad-stevens-end-of-season-press-conference-takeaways/", imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg" },
              { label: "Heavy", title: "Celtics Brad Stevens reveals offseason priority after Philly loss", sub: "Rim presence tops the list as Boston enters its most pivotal offseason in years.", url: "https://heavy.com/sports/nba/boston-celtics/celtics-brad-stevens-reveals-offseason-priority/" },
              { label: "MassLive", title: "Celtics offseason: every move they need to make this summer", url: "#" },
              { label: "ESPN", title: "Which big men fit Boston's offseason trade exception?", sub: "The $27.5M exception opens doors to several rim-running targets around the league.", url: "#" },
              { label: "The Athletic", title: "Inside the Celtics' plan to add rim protection without blowing it up", url: "#" },
              { label: "NBC Sports BOS", title: "Stevens talks trade market, cap flexibility, and Brown's future", url: "#" },
            ],
          },
          {
            id: "patriots-aj-brown",
            tag: "Patriots", urgent: true, time: "2h ago",
            imageUrl: "https://media.nbcsportsphiladelphia.com/2025/09/Brown-AJ-Getty-2233755645.jpg?quality=85&strip=all&resize=1200%2C675",
            headline: "AJ Brown trade expected to close June 1 — OTAs begin next Wednesday",
            summary: "Voluntary OTAs kick off May 27. The AJ Brown trade is expected on or just after June 1 — that's when the cap math works for Philadelphia, letting them split the dead money across two years. Everything still points to New England as the destination. Kayshon Boutte is the most likely roster casualty when Brown arrives. Drake Maye's weapons situation for year two is close to being answered.",
            sources: [
              { label: "NBC Sports Philly", title: "Report: AJ Brown likely to be traded to Patriots after June 1", sub: "The cap math works for Philly after June 1, splitting dead money across two years.", url: "https://www.nbcsportsphiladelphia.com/nfl/philadelphia-eagles/report-aj-brown-likely-to-be-traded-to-patriots-after-june-1/727627/", imageUrl: "https://media.nbcsportsphiladelphia.com/2025/09/Brown-AJ-Getty-2233755645.jpg?quality=85&strip=all&resize=1200%2C675" },
              { label: "NBC Sports Boston", title: "Mailbag: AJ Brown, Kayshon Boutte trade timeline and OTA outlook", sub: "Everything still points to New England as the destination for Brown this offseason.", url: "https://www.nbcsportsboston.com/nfl/new-england-patriots/mailbag-aj-brown-kayshon-boutte-trade-rumors/788646/" },
              { label: "ESPN", title: "Patriots OTA preview: Drake Maye's receiver corps taking shape", url: "#" },
              { label: "The Athletic", title: "AJ Brown trade: what New England gives up and what it gets", sub: "A detailed breakdown of the assets and salary implications for both teams.", url: "#" },
              { label: "ProFootballTalk", title: "Eagles confirm AJ Brown trade talks with multiple teams", url: "#" },
              { label: "PatsPulpit", title: "Cap implications of the Brown deal for New England's 2026 roster", url: "#" },
              { label: "Boston Globe", title: "Patriots wide receiver depth chart after potential Brown arrival", url: "#" },
            ],
          },
        ],
      },
      {
        label: "ON RADAR",
        stories: [
          {
            id: "celtics-giannis",
            tag: "Celtics", time: "4h ago",
            headline: "Giannis trade market opening — are the Celtics a realistic fit?",
            summary: "The Bucks are telling teams they'll listen on Giannis Antetokounmpo this offseason, though Milwaukee isn't in a rush. With Stevens targeting rim presence, Giannis is the most obvious NBA answer — whether Boston has the assets to compete in that market is the real question. Expect a slow burn through June.",
            sources: [
              { label: "Hoops Rumors", title: "Celtics 2026 offseason trade targets and rumors roundup", url: "https://www.hoopsrumors.com/boston-celtics" },
              { label: "Yahoo Sports", title: "Projecting Boston Celtics offseason moves for 2026", url: "https://sports.yahoo.com/articles/projecting-boston-celtics-moves-2026-020102540.html" },
              { label: "The Athletic", title: "Is Giannis a realistic Celtics target? Breaking down the assets", url: "#" },
              { label: "ESPN", title: "Bucks exploring Giannis trade; what teams are in the mix", url: "#" },
              { label: "Bleacher Report", title: "Five trades that could land Giannis in Boston", url: "#" },
              { label: "MassLive", title: "Celtics front office confident in roster flexibility this summer", url: "#" },
            ],
          },
          {
            id: "sox-royals-recap",
            tag: "Red Sox", time: "6h ago",
            headline: "Red Sox beat Royals 4–3 — Duran with the go-ahead homer in the seventh",
            summary: "Jarren Duran hit an opposite-field two-run homer in the seventh to erase a one-run deficit and give Boston a 4–3 win in Kansas City. Patient at-bats and a big swing at the right moment. The Sox move to 28-21 on the season.",
            sources: [
              { label: "ESPN", title: "Red Sox vs. Royals game recap — Duran go-ahead HR", url: "https://www.espn.com/mlb/game/_/gameId/401815425" },
              { label: "MLB.com", title: "Red Sox schedule and standings", url: "https://www.mlb.com/redsox/schedule" },
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
      { label: "RIGHT NOW", value: "72°F",      sub: "Partly cloudy" },
      { label: "THIS AFTN", value: "92°F + 🌩", sub: "Storms by 2pm" },
      { label: "TONIGHT",   value: "68°F",       sub: "Clearing" },
      { label: "TOMORROW",  value: "74°F",       sub: "Mostly sunny" },
    ],
    groups: [
      {
        label: "BREAKING",
        stories: [
          {
            id: "heat-spike-storms",
            tag: "Weather", isNew: true, time: "8m ago",
            imageUrl: "https://www.accuweather.com/images/logos/aw-logo-og-meta.png",
            headline: "Heat risk today — 92°F this afternoon, severe thunderstorms expected by 2pm",
            summary: "North Andover hits 92°F this afternoon — the hottest day of the year so far in the Merrimack Valley. NWS is flagging real risk of dehydration and heat illness for strenuous outdoor activity. T-storms are expected by mid-afternoon with gusty winds and frequent lightning. Move yard work or a run to the morning window and watch radar from 2pm on.",
            sources: [
              { label: "AccuWeather", title: "North Andover, MA hourly forecast — heat spike and severe storms", url: "https://www.accuweather.com/en/us/north-andover/01845/weather-forecast/2251379", imageUrl: "https://www.accuweather.com/images/logos/aw-logo-og-meta.png" },
              { label: "NWS Hourly", title: "National Weather Service hourly forecast — Merrimack Valley", url: "https://forecast.weather.gov/MapClick.php?lat=42.69380&lon=-71.1047" },
              { label: "Boston 25", title: "Severe thunderstorm watch issued for Essex County this afternoon", url: "#" },
              { label: "WCVB", title: "Heat advisory in effect through 7pm — how to stay safe", url: "#" },
              { label: "Eagle-Tribune", title: "North Andover schools moving afternoon recess indoors due to heat", url: "#" },
            ],
          },
        ],
      },
      {
        label: "THIS WEEK",
        stories: [
          {
            id: "town-meeting-budget",
            tag: "North Andover", time: "3h ago",
            headline: "Town meeting recap: school budget and downtown zoning approved",
            summary: "North Andover's annual town meeting approved a $48M school budget and new zoning provisions for mixed-use development on Main Street. Both measures passed with broad support after brief debate. Full meeting minutes will be posted on the town website this week.",
            sources: [
              { label: "Eagle-Tribune", title: "North Andover town meeting approves school budget, zoning changes", url: "#" },
            ],
          },
        ],
      },
    ],
  },

  maine: {
    label: "Maine House",
    chip: "MAINE HOUSE",
    storyCount: "2 stories today",
    colors: { dark: "#5c3208", mid: "#7a420d", accent: "#BA7517", pillBg: "#FAEEDA", pillText: "#854F0B", tag: "#854F0B" },
    quickLook: [
      { label: "FRIDAY",    value: "64°F ☀",   sub: "Great opening day" },
      { label: "SATURDAY",  value: "61°F ⛅",   sub: "Solid, mostly dry" },
      { label: "SUNDAY",    value: "59°F 🌧",   sub: "60% rain chance" },
      { label: "MON DRIVE", value: "Wet + slow", sub: "Leave by 8am" },
    ],
    groups: [
      {
        label: "WEEKEND OUTLOOK",
        stories: [
          {
            id: "maine-memorial-day",
            tag: "Maine Weather", urgent: true, time: "1h ago",
            imageUrl: "https://www.pressherald.com/wp-content/uploads/sites/4/2026/05/17693414_20250722_LakeAuburnFiler-1.jpg?w=780",
            headline: "Memorial Day weekend Maine: solid Friday and Saturday, rain creeps in Sunday",
            summary: "The forecast is firming up — and it's a split weekend. Friday and Saturday in southern Maine look genuinely good: 60s, dry, solid opening-weekend conditions. But Sunday afternoon brings increasing shower chances, and Memorial Day itself is looking wet: 60% chance of rain, mostly cloudy, high around 59°F. If you're heading up to open the house or get outdoor work done, Friday and Saturday are your window.",
            sources: [
              { label: "Press Herald", title: "Maine's Memorial Day weekend weather is looking just fine — for now", url: "https://www.pressherald.com/2026/05/20/maines-memorial-day-weekend-weather-is-looking-just-fine/", imageUrl: "https://www.pressherald.com/wp-content/uploads/sites/4/2026/05/17693414_20250722_LakeAuburnFiler-1.jpg?w=780" },
              { label: "Maine Turnpike", title: "Memorial Day weekend travel advisory — peak times and E-ZPass info", url: "https://www.maineturnpike.com/Travelers/Traffic-Conditions.aspx" },
              { label: "WMTW", title: "Memorial Day weekend forecast: best days to be outdoors in Maine", url: "#" },
              { label: "Bangor Daily", title: "Rain arrives Sunday — southern Maine cottage owners brace for wet holiday", url: "#" },
              { label: "Maine DOT", title: "Road conditions and construction alerts for I-95 this weekend", url: "#" },
            ],
          },
        ],
      },
      {
        label: "GOOD TO KNOW",
        stories: [
          {
            id: "maine-turnpike-traffic",
            tag: "Travel", time: "5h ago",
            headline: "Maine Turnpike expects heavy northbound traffic Friday afternoon — plan accordingly",
            summary: "The Maine Turnpike Authority is forecasting peak northbound traffic between 2pm and 7pm on Friday ahead of Memorial Day weekend. If you can leave before noon or after 7pm, you'll avoid the worst of it. E-ZPass toll plazas will be in open-road mode through the holiday.",
            sources: [
              { label: "Maine Turnpike Authority", title: "Memorial Day weekend travel advisory — peak times and E-ZPass info", url: "https://www.maineturnpike.com/Travelers/Traffic-Conditions.aspx" },
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
      { label: "THIS WEEK", value: "Google I/O",  sub: "Major AI launch" },
      { label: "GEMINI",    value: "3.5 Flash",   sub: "Just announced" },
      { label: "MARKET",    value: "AI ↑ strong", sub: "Exa raises $250M" },
      { label: "OPENAI",    value: "Ads in GPT",  sub: "New product" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "google-io-gemini",
            tag: "Google AI", isNew: true, time: "3h ago",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "Google I/O 2026: Gemini 3.5 Flash, Gemini Omni, and AI across every product",
            summary: "Google unveiled Gemini 3.5 Flash and Gemini Omni at I/O alongside AI-native Android interfaces, Workspace integrations, YouTube AI features, and an updated AI coding platform. The breadth is the story: AI is now the primary lens through which every Google product is being shipped. Relevant context for any AI strategy conversations coming up.",
            sources: [
              { label: "The Verge", title: "Everything Google announced at I/O 2026", sub: "Gemini 3.5 Flash, Omni, AI Android interfaces, and a revamped coding platform.", url: "https://www.theverge.com/google", imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800" },
              { label: "TechCrunch", title: "Gemini 3.5 Flash is Google's fastest model yet — what it means for developers", sub: "Speed improvements and expanded multimodal capabilities make it a strong GPT-4o rival.", url: "#" },
              { label: "Tech Startups", title: "Top tech news today, May 20 2026 — Google I/O roundup", url: "https://techstartups.com/2026/05/20/top-tech-news-today-may-20-2026/" },
              { label: "Ars Technica", title: "Google I/O 2026: AI is no longer a feature, it's the product", sub: "Every Google announcement this year had an AI lens on it — intentionally.", url: "#" },
              { label: "9to5Google", title: "Gemini Omni hands-on: multimodal AI that actually works", url: "#" },
              { label: "Wired", title: "Google's AI bet is paying off — and the rest of tech is scrambling", url: "#" },
              { label: "Bloomberg", title: "Google I/O signals a new era of AI-first consumer products", url: "#" },
            ],
          },
          {
            id: "openai-ads-manager",
            tag: "OpenAI", time: "5h ago",
            imageUrl: "https://blog.mean.ceo/wp-content/uploads/2025/12/mean-ceo-female-entrepreneurs-news.webp",
            headline: "OpenAI launches self-serve Ads Manager inside ChatGPT",
            summary: "OpenAI is now letting advertisers buy placements inside ChatGPT through a self-serve dashboard. It's an early-stage rollout but marks a significant shift in OpenAI's business model — moving from pure subscription revenue toward a mixed model that includes advertising. The company is targeting $2.5B in ad revenue this year.",
            sources: [
              { label: "Adweek", title: "OpenAI launches self-serve advertising platform inside ChatGPT", url: "#", imageUrl: "https://blog.mean.ceo/wp-content/uploads/2025/12/mean-ceo-female-entrepreneurs-news.webp" },
              { label: "Mean CEO", title: "AI news May 2026 — OpenAI ads, Gemini, and more", url: "https://blog.mean.ceo/ai-news-may-2026/" },
              { label: "The Information", title: "OpenAI targeting $2.5B in ad revenue by end of 2026", url: "#" },
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
            tag: "AI Startups", time: "6h ago",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "Exa Labs raises $250M at $2.2B valuation for AI-native search",
            summary: "Andreessen Horowitz led a $250M round in Exa Labs, betting on a developer-first, structured-retrieval approach to AI search. The argument: Google and Perplexity are leaving room for a more precise, API-first alternative. One of the largest early-stage AI search bets to date.",
            sources: [
              { label: "TechCrunch", title: "AI search startups are blowing up — Exa raises $250M", url: "https://techcrunch.com/2026/05/20/ai-search-startups-are-blowing-up/" },
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
      { label: "S&P 500",  value: "+0.4%",    sub: "5,342 pts" },
      { label: "10-YR",    value: "4.41%",     sub: "Yield steady" },
      { label: "FED NEXT", value: "June 11",   sub: "Hold expected" },
      { label: "DOLLAR",   value: "DXY 104.2", sub: "Slight dip" },
    ],
    groups: [
      {
        label: "MARKETS",
        stories: [
          {
            id: "fed-rate-hold",
            tag: "Fed", time: "4h ago",
            headline: "Fed rate outlook shifts toward extended hold — June cut now off the table",
            summary: "Sticky services inflation and a resilient labor market have pushed Fed officials to signal no cuts before September at the earliest. Markets have fully priced out a June move. The two-cut scenario for 2026 is now a one-cut consensus, with October the modal expectation.",
            sources: [
              { label: "WSJ", title: "Fed officials signal extended pause as inflation stays sticky", url: "#" },
              { label: "Bloomberg", title: "Fed rate-cut bets pushed to September after strong jobs data", url: "#" },
            ],
          },
        ],
      },
      {
        label: "TO WATCH",
        stories: [
          {
            id: "markets-steady",
            tag: "Markets", time: "6h ago",
            headline: "Equity markets steady ahead of Fed minutes — tech leads small gains",
            summary: "Major indices ended slightly higher Thursday, with the S&P 500 up 0.4% and the Nasdaq gaining 0.6% on AI-related strength. Fed minutes from the May meeting are due Wednesday and will be the next key catalyst. Bond yields were little changed.",
            sources: [
              { label: "MarketWatch", title: "Stock market today: S&P 500 edges higher, tech leads gains", url: "#" },
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

  // Same zone first
  const sameZone = all.filter((s) => s.zoneId === zoneId);
  // Cross-zone with matching tag
  const crossZone = all.filter(
    (s) => s.zoneId !== zoneId && s.story.tag === current.tag
  );

  return [...sameZone, ...crossZone].slice(0, limit);
}
