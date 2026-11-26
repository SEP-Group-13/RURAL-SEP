import type { ReactNode } from "react";
import ViewTabs from "./ViewTabs";

export default function ViewWrapper({children}: {children: ReactNode}) {
    return (
        <div className="p-3">
            <ViewTabs />
            <div className="border-2 border-sidebar-surface">{children}</div>
        </div>
    )
}