import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RURAL Study Dashboard" },
    { name: "description", content: "Welcome to dashboard!" },
  ];
}

export default function ParticipantsRoute() {
  return (
    <div>
      <h1>Participants</h1>
    </div>
  );
}
