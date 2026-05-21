export default function ProfilePage() {
  return (
    <div className="pb-8">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-[#dde1e8]">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ background: "#2d59a6" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-[#0f1117]">Your Profile</h1>
        <p className="text-[13px] text-[#7a8499] mt-0.5">Manage your preferences</p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Section: My Briefing */}
        <section>
          <h2 className="text-[11px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">My Briefing</h2>
          <div className="rounded-[12px] border border-[#dde1e8] bg-white divide-y divide-[#dde1e8] overflow-hidden">
            <ProfileRow label="Topics & Interests" icon={topicsIcon} />
            <ProfileRow label="Locations" icon={locationIcon} />
            <ProfileRow label="Briefing Schedule" icon={clockIcon} />
          </div>
        </section>

        {/* Section: Feeds */}
        <section>
          <h2 className="text-[11px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Feeds</h2>
          <div className="rounded-[12px] border border-[#dde1e8] bg-white divide-y divide-[#dde1e8] overflow-hidden">
            <ProfileRow label="Manage Sources" icon={feedsIcon} />
            <ProfileRow label="Saved Stories" icon={savedIcon} />
          </div>
        </section>

        {/* Section: Notifications */}
        <section>
          <h2 className="text-[11px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Notifications</h2>
          <div className="rounded-[12px] border border-[#dde1e8] bg-white divide-y divide-[#dde1e8] overflow-hidden">
            <ProfileRow label="Push Notifications" icon={bellIcon} />
            <ProfileRow label="Briefing Alerts" icon={alertIcon} />
          </div>
        </section>

        {/* Section: Account */}
        <section>
          <h2 className="text-[11px] font-bold text-[#7a8499] uppercase tracking-widest mb-2">Account</h2>
          <div className="rounded-[12px] border border-[#dde1e8] bg-white divide-y divide-[#dde1e8] overflow-hidden">
            <ProfileRow label="Account Settings" icon={settingsIcon} />
            <ProfileRow label="Privacy" icon={privacyIcon} />
            <ProfileRow label="About Distilled" icon={infoIcon} />
          </div>
        </section>

      </div>
    </div>
  );
}

function ProfileRow({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3.5 touch-manipulation active:bg-[#f7f8fa]">
      <div className="flex items-center gap-3">
        <span className="text-[#475066]">{icon}</span>
        <span className="text-[15px] font-medium text-[#0f1117]">{label}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

const topicsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h10"/>
  </svg>
);
const locationIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const clockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const feedsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const savedIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const bellIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const alertIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const settingsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const privacyIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const infoIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);
