# ============================================================
# Multi-stage Dockerfile สำหรับ Next.js 16 + standalone output
#
# โครงสร้าง 3 stage:
#   [1] deps    → npm ci เฉพาะ deps (cache layer แยก — เปลี่ยน source ไม่ต้อง install ใหม่)
#   [2] builder → copy source + run `next build` (สร้าง .next/standalone/)
#   [3] runner  → image จริงที่ deploy — copy แค่ output + minimal node_modules
#
# Image size: ~150MB (vs ~1GB ถ้าใช้ `next start` ปกติ)
#
# Base image: node:24-alpine — Node current, ตรงกับ engine >= 20.9.0 ของ Next 16
# ============================================================


# ============================================================
# [1] deps — install production-ish dependencies
# ============================================================
FROM node:24-alpine AS deps
WORKDIR /app

# libc6-compat → กัน "module not found" จาก native deps บน Alpine (musl vs glibc)
RUN apk add --no-cache libc6-compat

# copy แค่ manifest ก่อน → layer นี้ cache ตามไฟล์ 2 อันนี้
# package.json/lock ไม่เปลี่ยน → docker reuse layer ไม่ต้อง re-install
COPY package.json package-lock.json* ./
RUN npm ci


# ============================================================
# [2] builder — build แล้วได้ .next/standalone
# ============================================================
FROM node:24-alpine AS builder
WORKDIR /app

# ARG NEXT_PUBLIC_API_URL — รับจาก docker-compose --build-arg
# ⚠️ NEXT_PUBLIC_* ถูก inline ตอน next build (ไม่ใช่ runtime)
# → เปลี่ยน URL ต้อง rebuild image ใหม่ ไม่ใช่แค่ restart
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# ปิด telemetry ของ Next ตอน build (กัน outbound call ขึ้น vercel.com)
ENV NEXT_TELEMETRY_DISABLED=1

# reuse node_modules จาก stage [1] (ไม่ต้อง install ใหม่)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build → output: 'standalone' ใน next.config.ts
# → สร้าง .next/standalone/server.js + minimal node_modules
RUN npm run build


# ============================================================
# [3] runner — production image (เล็กสุด)
# ============================================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# tini → จัดการ SIGTERM ให้ Next.js close graceful (drain pending requests)
# ดู docs/01-app/02-guides/self-hosting.md — Next ใช้ SIGTERM/SIGINT แล้วรอ in-flight
RUN apk add --no-cache tini

# non-root user — กัน container escape ได้ระดับนึง
# uid 1001 ตรงกับ convention ของ Next docker template
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# [3a] static assets ที่ standalone server.js ไม่ copy ให้อัตโนมัติ
#      ต้องใส่เองตามที่ docs ระบุ
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# [3b] standalone bundle — server.js + minimal node_modules
#      ต้อง copy ทับ root /app เพราะ server.js อ้าง path relative
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

# HOSTNAME=0.0.0.0 — บังคับ server listen ทุก interface
# default ของ standalone คือ localhost → จะรับ traffic จาก docker network ไม่ได้
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
