import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { InstallButton } from "@/components/InstallButton";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">
        <Outlet />
      </main>
      <InstallButton />
      <BottomNav />
    </div>
  );
}