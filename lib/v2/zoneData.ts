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
    storyCount: "3 stories today",
    colors: { dark: "#1b4332", mid: "#27503e", accent: "#639922", pillBg: "#EAF3DE", pillText: "#3B6D11", tag: "#3B6D11" },
    quickLook: [
      { label: "LAST SERIES", value: "Sox swept",    sub: "Toronto 3-0 at Fenway" },
      { label: "TONIGHT",     value: "Sox 10:10p",   sub: "at Mariners (SEA)" },
      { label: "CELTICS",     value: "Draft Tue",    sub: "June 23 · Barclays Ctr" },
      { label: "PATRIOTS",    value: "Camp July 24", sub: "First practice July 25" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "celtics-draft",
            tag: "Celtics", urgent: true, isNew: true, time: "Now",
            imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg",
            headline: "Celtics draft is Tuesday — Stevens has four days and one of the biggest decisions of his tenure",
            summary: "The 2026 NBA Draft is June 23–24 at Barclays Center in Brooklyn. Brad Stevens enters it holding picks 27 and 40, a $27M trade exception, and roughly $13M in mid-level spending room. The frontcourt is the clearest need — Vucevic is a free agent and never fit the rotation — and Boston is linked to UNC's Henri Veesaar and Kentucky's Malachi Moreno at 27. But the bigger question isn't the draft picks. The Giannis Antetokounmpo conversation remains live, and the Bucks want a decision before the draft. Stevens can swing big or patch small. The roster shape for next season is decided in the next four days.",
            sources: [
              { label: "Spotrac", title: "Boston Celtics 2026 Offseason Preview", sub: "Picks, exceptions, and what Stevens can actually do.", url: "https://www.spotrac.com/news/_/id/3391/boston-celtics-2026-offseason-preview", imageUrl: "https://bdc2020.o0bc.com/wp-content/uploads/2026/05/Brad-Stevens-Press-Conference-2026-69fb8666caad7-768x432.jpg" },
              { label: "Bleacher Report", title: "Celtics' Biggest Offseason Needs Ahead of 2026 NBA Draft", url: "https://bleacherreport.com/articles/25441381-boston-celtics-biggest-offseason-needs-ahead-2026-nba-draft" },
              { label: "NBC Sports Boston", title: "2026 NBA mock draft roundup: Fresh Celtics predictions", url: "https://www.nbcsportsboston.com/nba/boston-celtics/2026-nba-mock-draft-roundup-spurs-knicks-finals/790267/" },
              { label: "CelticsBlog", title: "What could the 2026 offseason look like for the Celtics", url: "https://www.celticsblog.com/boston-celtics-rumors/135422/2026-offseason-look-like-boston-celtics-brad-stevens-joe-mazzulla-center-ron-harper-jayson-tatum-jaylen-brown" },
            ],
          },
          {
            id: "sox-mariners",
            tag: "Red Sox", time: "1h ago",
            headline: "Sox swept at home by Toronto, fall to 29–43 — at Mariners tonight 10:10 PM",
            summary: "The Blue Jays completed a home sweep at Fenway before the Sox flew west to Seattle. At 29–43, Boston is firmly in last place in the AL East and on pace for one of the worst records in the league. Tonight's opener at T-Mobile Park goes at 10:10 PM. The Mariners sit at 39–37 and are in Wild Card contention — not a soft spot for Boston to find its footing. The trade deadline is six weeks away and the roster questions are mounting.",
            sources: [
              { label: "ESPN", title: "Red Sox vs. Mariners — Live Score June 19", url: "https://www.espn.com/mlb/game/_/gameId/401815837/red-sox-mariners" },
              { label: "ESPN", title: "Boston Red Sox Schedule 2026", url: "https://www.espn.com/mlb/team/schedule/_/name/bos/boston-red-sox" },
              { label: "Baseball Reference", title: "2026 Boston Red Sox Season", url: "https://www.baseball-reference.com/teams/BOS/2026-schedule-scores.shtml" },
            ],
          },
        ],
      },
      {
        label: "ON RADAR",
        stories: [
          {
            id: "gronk-hof",
            tag: "Patriots", time: "2d ago",
            headline: "Gronkowski voted into the Patriots Hall of Fame — 38th inductee",
            summary: "Rob Gronkowski has been voted into the Patriots Hall of Fame as the 38th inductee. Already enshrined in Canton in 2023, this is the local recognition. No ceremony date has been announced yet. Gronkowski is among the most celebrated players in franchise history — four Super Bowl rings and the most dominant tight end of his era.",
            sources: [
              { label: "Patriots.com", title: "Rob Gronkowski — Patriots Hall of Fame", url: "https://www.patriots.com/" },
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
      { label: "RIGHT NOW",  value: "81°F ☀",    sub: "Intervals of clouds" },
      { label: "WINDS",      value: "W 10–20",    sub: "mph" },
      { label: "TONIGHT",    value: "Sox 10:10p", sub: "at Mariners, Seattle" },
      { label: "TOMORROW",   value: "82°F ☀",    sub: "Sunny, low humidity" },
    ],
    groups: [
      {
        label: "TODAY",
        stories: [
          {
            id: "world-cup-gillette",
            tag: "World Cup", isNew: true, urgent: true, time: "Now",
            headline: "World Cup at Gillette today — Scotland vs. Morocco, 6pm kick-off, heavy traffic expected",
            summary: "Gillette Stadium hosts its fifth World Cup group stage match today: Scotland vs. Morocco at 6pm. Authorities are warning of major congestion from up to four hours before kick-off — Route 1 and I-95 south should be avoided between 3–10pm. If you're not going, build extra time into any southbound travel this afternoon. The Boston hosting run continues: England vs. Ghana on June 23, Norway vs. France on June 26, a Round of 32 match June 29, and the quarter-final on July 9.",
            sources: [
              { label: "Gillette Stadium", title: "2026 World Cup at Gillette — Schedule", url: "https://www.gillettestadium.com/events/2026-world-cup-round-of-32/" },
              { label: "Foxborough", title: "FIFA World Cup 2026 — Traffic and Logistics", url: "https://www.foxboroughma.gov/residents/fifa_world_cup_2026" },
              { label: "CBS Boston", title: "Boston hosts seven 2026 World Cup games at Gillette — full schedule", url: "https://www.cbsnews.com/boston/news/world-cup-schedule-2026-boston-gillette-stadium-foxboro/" },
            ],
          },
        ],
      },
      {
        label: "COMMUNITY",
        stories: [
          {
            id: "juneteenth-day",
            tag: "North Andover", time: "Today",
            headline: "Juneteenth — federal holiday, markets and banks closed across the country",
            summary: "June 19 is Juneteenth, a federal holiday. NYSE and Nasdaq are closed for trading, bond markets are paused, and most banks are closed. The next full trading session is Monday, June 22. Thursday was Triple Witching — moved up a day because of today's closure — so some volatility is possible when markets reopen.",
            sources: [
              { label: "Yahoo Finance", title: "Is the Stock Market Open on Juneteenth in 2026?", url: "https://finance.yahoo.com/markets/stocks/articles/stock-market-open-juneteenth-2026-151925494.html" },
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
      { label: "THIS WEEKEND", value: "Mid-70s ☀",  sub: "Low humidity, sunny" },
      { label: "SATURDAY",     value: "76°F ☀",     sub: "Great beach day" },
      { label: "SUNDAY",       value: "74°F ⛅",    sub: "Mostly sunny" },
      { label: "NEXT EVENT",   value: "July 9",      sub: "World Cup QF · Gillette" },
    ],
    groups: [
      {
        label: "THIS WEEKEND",
        stories: [
          {
            id: "maine-summer-weekend",
            tag: "Maine Weather", isNew: true, time: "Today",
            headline: "Great summer weekend ahead in southern Maine — mid-70s, sunny, low humidity",
            summary: "The weekend looks ideal for the summer house. Mid-70s Saturday and Sunday with low humidity and plenty of sunshine — the kind of early-summer weather that makes the Maine coast worth the drive. No significant rain in the forecast through Sunday evening. If you're heading up this weekend, I-95 northbound is the smoothest it'll be until July 4th weekend.",
            sources: [
              { label: "AccuWeather", title: "North Andover, MA Weather Forecast", url: "https://www.accuweather.com/en/us/north-andover/01845/weather-forecast/2251379" },
              { label: "Maine Turnpike", title: "Traffic Conditions", url: "https://www.maineturnpike.com/Travelers/Traffic-Conditions.aspx" },
            ],
          },
        ],
      },
      {
        label: "PLANNING",
        stories: [
          {
            id: "maine-july-plans",
            tag: "Events", time: "This week",
            headline: "World Cup quarter-final at Gillette is July 9 — worth making the trip from Maine",
            summary: "If you're spending time at the Maine house around the Fourth of July, the World Cup quarter-final at Gillette on July 9 is a realistic day trip. The drive from southern Maine to Foxborough is roughly 90 minutes depending on traffic. Tickets are still available. Foxborough has specific parking and access plans for World Cup games that differ significantly from a normal Patriots game day — worth reviewing before you go.",
            sources: [
              { label: "Foxborough", title: "FIFA World Cup 2026 — Town Guide", url: "https://www.foxboroughma.gov/residents/fifa_world_cup_2026" },
              { label: "CBS Boston", title: "Full Boston World Cup schedule — CBS Boston", url: "https://www.cbsnews.com/boston/news/world-cup-schedule-2026-boston-gillette-stadium-foxboro/" },
            ],
          },
          {
            id: "maine-summer-open",
            tag: "Maine Weekend", time: "This week",
            headline: "Southern Maine coastal openings — summer season now in full swing",
            summary: "Most restaurants, shops, and attractions in Kennebunkport, Ogunquit, and Portland are operating on full summer hours as of mid-June. Ogunquit Beach is open. The Kennebunk Farmers Market runs Saturdays 8am–1pm. Old Orchard Beach pier and arcade are open daily. If you haven't been up yet this season, this weekend is a good opener — weather cooperates and the holiday crowds won't arrive until July 4th.",
            sources: [
              { label: "Visit Maine", title: "June events and openings in coastal Maine", url: "https://visitmaine.com" },
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
      { label: "THIS WEEK",   value: "OpenAI+Astral", sub: "uv and ruff acquired" },
      { label: "ANTHROPIC",   value: "Claude Corps",   sub: "National fellowship live" },
      { label: "BIG SHIFT",   value: "Agentic AI",     sub: "Chat → task completion" },
      { label: "NEXT UP",     value: "IPO season",     sub: "OpenAI filing Sept" },
    ],
    groups: [
      {
        label: "LATEST",
        stories: [
          {
            id: "openai-astral",
            tag: "OpenAI", isNew: true, time: "Today",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "OpenAI acquires Astral — the company behind Python tools uv and ruff",
            summary: "OpenAI is acquiring Astral, the company that built uv (Python package manager) and ruff (Python linter/formatter) — two of the most widely adopted open-source developer tools in the Python ecosystem. For anyone on teams that use these tools, the ownership question matters: what happens to the open-source commitments, the roadmap, the governance? No terms have been disclosed. Worth watching how OpenAI handles the stewardship piece as the tools have millions of users who chose them specifically because they were independent.",
            sources: [
              { label: "Build Fast with AI", title: "AI News Today — June 19, 2026: 16 Biggest Stories", url: "https://www.buildfastwithai.com/blogs/ai-news-today-june-19-2026", imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800" },
            ],
          },
          {
            id: "anthropic-claude-corps",
            tag: "Anthropic", time: "Today",
            headline: "Anthropic launches Claude Corps — national fellowship for early-career Americans",
            summary: "Anthropic has launched Claude Corps, a national fellowship program for early-career Americans. The program provides structured access to Claude, mentorship, and community programs designed to help fellows apply AI to social, civic, and community benefit use cases. Claude Code's weekly active users in Korea grew 6x in four months — a signal of what real adoption looks like when a tool genuinely fits how developers work.",
            sources: [
              { label: "Build Fast with AI", title: "AI News Today — June 19, 2026", url: "https://www.buildfastwithai.com/blogs/ai-news-today-june-19-2026" },
            ],
          },
        ],
      },
      {
        label: "ON RADAR",
        stories: [
          {
            id: "agentic-shift",
            tag: "AI Trends", time: "This week",
            imageUrl: "https://techcrunch.com/wp-content/uploads/2026/05/google-ai-sign-Getty.jpg?resize=1200,800",
            headline: "AI is shifting from chat to tasks — what agentic systems actually mean",
            summary: "The real change in AI right now is not better chat — it's AI completing tasks autonomously in research, coding, legal work, support, and commerce. Big tech is pushing AI into infrastructure: Microsoft toward research and quantum-linked use cases, IBM on hardware and compute costs, Google tying AI to commerce, robotics, and edge devices. The companies that figure out reliable task completion will own the next wave — the chat assistants are becoming the entry point, not the product.",
            sources: [
              { label: "Build Fast with AI", title: "AI News Today — June 19, 2026", url: "https://www.buildfastwithai.com/blogs/ai-news-today-june-19-2026" },
              { label: "mean.ceo blog", title: "Latest AI Developments News — June 2026", url: "https://blog.mean.ceo/latest-ai-developments-news-june-2026/" },
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
      { label: "TODAY",      value: "CLOSED",    sub: "Juneteenth holiday" },
      { label: "S&P 500",    value: "7,473",     sub: "+0.37% (Thu close)" },
      { label: "DOW",        value: "50,579",    sub: "Record high (Thu)" },
      { label: "NEXT OPEN",  value: "Mon Jun 22", sub: "Full session resumes" },
    ],
    groups: [
      {
        label: "MARKETS",
        stories: [
          {
            id: "juneteenth-markets",
            tag: "Markets", time: "Today",
            headline: "Markets closed for Juneteenth — NYSE and Nasdaq dark today",
            summary: "NYSE and Nasdaq are closed today for Juneteenth. Bond markets, Fed payment rails, and DTC settlement also pause. The Dow closed at a record 50,579 on Thursday. The S&P 500 closed at 7,473 (+0.37%), completing its eighth consecutive weekly gain — the longest streak since late 2023. The next full trading session is Monday, June 22.",
            sources: [
              { label: "Yahoo Finance", title: "Is the Stock Market Open on Juneteenth in 2026?", url: "https://finance.yahoo.com/markets/stocks/articles/stock-market-open-juneteenth-2026-151925494.html" },
              { label: "EBC Financial", title: "NYSE and Nasdaq shut down June 19 to observe Juneteenth", url: "https://www.ebc.com/forex/is-the-stock-market-open-on-juneteenth" },
            ],
          },
        ],
      },
      {
        label: "TO WATCH",
        stories: [
          {
            id: "markets-monday",
            tag: "Markets", time: "Today",
            headline: "Triple Witching was Thursday — volatility possible when markets reopen Monday",
            summary: "Thursday was Triple Witching day — moved up from Friday because of today's Juneteenth closure. Options, futures, and index contracts all expired simultaneously. This can create unusual price action when markets reopen Monday. The Fed is in its blackout period ahead of the next FOMC meeting. No major economic data drops Friday or over the weekend — Monday morning will be the first read on how the market absorbed Thursday's expiration.",
            sources: [
              { label: "Yahoo Finance", title: "Key closures on Juneteenth — 2026 schedule", url: "https://finance.yahoo.com/markets/stocks/articles/key-closures-juneteenth-markets-2026-182108105.html" },
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
