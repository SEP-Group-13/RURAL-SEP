import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/dashboard-layout.tsx", [
    index("routes/home.tsx"), // /
    route("visualization", "routes/visualization.tsx"),
    route("comparison", "routes/comparison.tsx"),
    route("upload", "routes/dataupload.tsx"),
  ]),
] satisfies RouteConfig;