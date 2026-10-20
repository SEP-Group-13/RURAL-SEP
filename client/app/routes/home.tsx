import type { Route } from "./+types/home";
import { Home } from "../home/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "RURAL Study Dashboard" },
        { name: "description", content: "Welcome to dashboard!" },
    ];
}

export default function HomeRoute() {
    return <Home />;
}
