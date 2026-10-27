
import RouteSelect from "./RouteSelect";

export default function SideBar(){
    return <div className="bg-sidebar-surface flex flex-col items-start gap-5 h-screen sticky top-0 px-3 pt-4 rounded-l-md">
        <div className="flex flex-col font-semibold justify-start mb-2 mt-2">
            <span className="text-3xl">RURAL</span>
            <span className="text-xl">Burden Dashboard</span>
        </div>
        <RouteSelect />
    </div>;
}

