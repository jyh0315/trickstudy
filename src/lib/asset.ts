// GitHub Pages 하위 경로(/저장소이름)에서도 public 파일을 찾을 수 있게 경로 앞에 basePath를 붙인다.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const asset = (path: string) => `${BASE_PATH}${path}`;
