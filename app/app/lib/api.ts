// ============================================================
// API client — เรียก 3 endpoints ของ Elysia backend
//
// NEXT_PUBLIC_API_URL ถูก inline ตอน `next build` ไม่ใช่ runtime
//   → เปลี่ยน URL ทีหลังต้อง rebuild image ใหม่
//   → dev:  ใช้ default http://localhost:3000
//   → prod: build ด้วย NEXT_PUBLIC_API_URL=https://api.myohm.dev
//
// fetch รันใน browser → ต้องใช้ public URL เสมอ (เรียก docker DNS ไม่ได้)
// ============================================================

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ---- Types ----
// shape ตรงกับ Prisma User + userResponse ฝั่ง backend
// (createdAt/updatedAt มาเป็น string เพราะ JSON serialize Date → ISO)
export type User = {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateUserBody = {
    email: string;
    name?: string;
};

// ---- helper: throw error ที่อ่านง่ายเมื่อ status ไม่ผ่าน ----
// backend ส่ง plain text สำหรับ 409/404 → เอามาโชว์ตรงๆ ได้เลย
async function ensureOk(res: Response): Promise<Response> {
    if (res.ok) return res;
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
}

// POST /users — สร้าง user ใหม่ (201) | 409 ถ้า email ซ้ำ
export async function createUser(body: CreateUserBody): Promise<User> {
    const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    await ensureOk(res);
    return res.json();
}

// GET /users — ลิสต์ทั้งหมด เรียงใหม่สุดก่อน
// cache: "no-store" → กัน browser cache เพื่อให้ refresh แล้วเห็นของใหม่
export async function listUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, { cache: "no-store" });
    await ensureOk(res);
    return res.json();
}

// GET /users/:id — หา 1 คน | 404 ถ้าไม่เจอ
export async function getUserById(id: string): Promise<User> {
    const res = await fetch(`${API_URL}/users/${id}`, { cache: "no-store" });
    await ensureOk(res);
    return res.json();
}
