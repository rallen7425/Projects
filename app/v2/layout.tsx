import ZoneSubNav from "@/components/v2/ZoneSubNav";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ZoneSubNav />
      {children}
    </div>
  );
}
