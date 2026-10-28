import type { NextConfig } from "next";

// GitHub Pages(정적 호스팅)용 설정.
// 배포 워크플로가 NEXT_PUBLIC_BASE_PATH=/<저장소이름> 을 넣어준다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
