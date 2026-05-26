import type { NextConfig } from "next";

// ============================================================
// Next.js config
//
// output: "standalone" — บังคับ next build copy เฉพาะ deps ที่ใช้จริง
//   ไปไว้ที่ .next/standalone/ พร้อม server.js
//   ผลคือ runner image เล็กลง ~5-6 เท่า (จาก ~1GB เหลือ ~150MB)
//
// ⚠️ server.js standalone ไม่ copy .next/static หรือ public/ ให้
//    ต้องสั่ง COPY แยกใน Dockerfile (ทำใน [3] runner stage)
// ============================================================
const nextConfig: NextConfig = {
    output: "standalone",
};

export default nextConfig;
