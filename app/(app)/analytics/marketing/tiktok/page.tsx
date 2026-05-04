import { WorkspacePanel } from "@/components/foundation/workspace-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function TiktokPage() {
  return (
    <div className="space-y-5">
      <WorkspacePanel
        title="Data TikTok"
        description="Visualisasi traffic toko, performa livestream, dan efektivitas MP Ads TikTok."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <div className="py-8 text-center text-sm text-slate-400">
          Halaman visualisasi TikTok akan segera tersedia.
        </div>
      </WorkspacePanel>
    </div>
  );
}
