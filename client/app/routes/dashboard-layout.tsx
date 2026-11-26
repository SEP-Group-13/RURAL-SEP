import { Outlet } from "react-router";
import SideBar from "~/components/SideBar/SideBar";
import TopBar from "~/components/TopBar/TopBar";

export default function DashboardLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[250px_minmax(0,1fr)]">
      <SideBar />
      <div className="bg-dashboard-surface">
        <TopBar />
        <Outlet />
      </div>
    </div>
  );
}
