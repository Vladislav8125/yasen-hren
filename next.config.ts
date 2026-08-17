import type { NextConfig } from "next";
import path from "path";

// Репозиторий лежит внутри рабочей папки с другим Next-проектом. Явно
// ограничиваем корень, чтобы Turbopack не подхватывал файлы соседнего сайта.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
