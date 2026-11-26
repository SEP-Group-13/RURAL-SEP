import ThemeToggle from "./ThemeToggle";
import Search from "./Search";
import {Circle} from "lucide-react";
import Manual from "./Manual";

export default function TopBar(){
    return (
        <div className="sticky top-0 z-20 grid h-fit grid-cols-[minmax(100px,1fr)_auto_auto] items-center gap-2 py-4 px-4 bg-dashboard-surface border-b-2 border-sidebar-surface">
            <Search />
            <div className="flex items-center justify-end text-m mx-10"><Circle className="size-[1em] mr-2"/>Last update from database 10/25/2026, 16:24:00</div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Manual />
            </div>
        </div>
    )
}