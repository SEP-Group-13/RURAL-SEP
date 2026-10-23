import { ChartColumn, Layers2, Sheet, Upload, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

export default function RouteSelect() {
    return (
        <div className="space-y-1 w-full">
            <RouteButton icon={Sheet} title="Participants" to="/" end={true}/>
            <RouteButton icon={ChartColumn} title="Visualization" to="/visualization" end={false} />
            <RouteButton icon={Layers2} title="Comparison" to="/comparison" end={false}/>
            <RouteButton icon={Upload} title="Data Upload" to="/upload" end={false}/>
        </div>
    );
}

function RouteButton({ icon: Icon, title, to, end}: {
    icon: LucideIcon;
    title: string;
    to: string;
    end: boolean;
}) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center justify-start gap-2 w-full px-2 py-1 rounded cursor-pointer text-m ${
                    isActive
                        ? "bg-route-button-selected-bg text-route-button-selected-text shadow"
                        : "hover:bg-route-button-hover-bg text-route-button-hover-text"
                }`
            }
        >
            <Icon className="size-[1em]" />
            <span>{title}</span>
        </NavLink>
    );
}