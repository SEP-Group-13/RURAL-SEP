import { Paintbrush } from "lucide-react";

export default function ThemeToggle(){
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute("ui-theme");
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("ui-theme", nextTheme);
    };

    return <button onClick={toggleTheme} className="p-3 text-m cursor-pointer bg-sidebar-surface rounded">
        <Paintbrush className="size-[1em]"/>
    </button>;
}
