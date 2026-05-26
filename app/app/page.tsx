"use client";
// ============================================================
// User API Playground — กดปุ่มทดสอบ 3 endpoints ของ backend
//   POST   /users        สร้าง user
//   GET    /users        ลิสต์ทั้งหมด
//   GET    /users/:id    หา 1 คน
//
// เป็น Client Component ทั้งไฟล์เพราะต้องการ event handler + useState
// (Server Component fetch ตอน render ครั้งเดียวพอ — ไม่เข้ากับการกดปุ่มซ้ำ)
//
// แต่ละ section เก็บ state แยกเป็น discriminated union
// (idle | loading | success | error) → render ตาม status ตรงๆ ไม่ต้องเช็ค flag
// ============================================================

import { useState } from "react";
import {
    createUser,
    getUserById,
    listUsers,
    type User,
} from "@/app/lib/api";

// ---- shared types & helpers ----
type RequestState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; error: string };

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Unknown error";
}

// ---- root page ----
export default function Page() {
    return (
        <main className="mx-auto max-w-3xl space-y-6 p-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-bold">User API Playground</h1>
                <p className="text-sm text-gray-500">
                    ทดสอบ 3 endpoints ของ Elysia backend ที่{" "}
                    <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">
                        {process.env.NEXT_PUBLIC_API_URL ??
                            "http://localhost:3000"}
                    </code>
                </p>
            </header>

            <CreateUserSection />
            <ListUsersSection />
            <GetUserByIdSection />
        </main>
    );
}

// ============================================================
// [1] POST /users — create
// ============================================================
function CreateUserSection() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [state, setState] = useState<RequestState<User>>({ status: "idle" });

    async function submit() {
        setState({ status: "loading" });
        try {
            const user = await createUser({
                email,
                // ส่ง name เฉพาะตอนกรอกจริง — backend ระบุ minLength: 1
                name: name.trim() ? name.trim() : undefined,
            });
            setState({ status: "success", data: user });
            setEmail("");
            setName("");
        } catch (err) {
            setState({ status: "error", error: errorMessage(err) });
        }
    }

    return (
        <Section title="POST /users — สร้าง user ใหม่">
            <div className="grid gap-2 sm:grid-cols-2">
                <Input
                    placeholder="email (required)"
                    value={email}
                    onChange={setEmail}
                />
                <Input
                    placeholder="name (optional)"
                    value={name}
                    onChange={setName}
                />
            </div>
            <Button
                onClick={submit}
                disabled={!email || state.status === "loading"}
                label={state.status === "loading" ? "Creating..." : "Create"}
            />
            <StateView
                state={state}
                renderData={(u) => <UserCard user={u} />}
            />
        </Section>
    );
}

// ============================================================
// [2] GET /users — list
// ============================================================
function ListUsersSection() {
    const [state, setState] = useState<RequestState<User[]>>({
        status: "idle",
    });

    async function refresh() {
        setState({ status: "loading" });
        try {
            const users = await listUsers();
            setState({ status: "success", data: users });
        } catch (err) {
            setState({ status: "error", error: errorMessage(err) });
        }
    }

    return (
        <Section title="GET /users — ลิสต์ทั้งหมด">
            <Button
                onClick={refresh}
                disabled={state.status === "loading"}
                label={state.status === "loading" ? "Loading..." : "Refresh"}
            />
            <StateView
                state={state}
                renderData={(users) =>
                    users.length === 0 ? (
                        <p className="text-sm text-gray-500">ยังไม่มี user</p>
                    ) : (
                        <ul className="space-y-2">
                            {users.map((u) => (
                                <li key={u.id}>
                                    <UserCard user={u} />
                                </li>
                            ))}
                        </ul>
                    )
                }
            />
        </Section>
    );
}

// ============================================================
// [3] GET /users/:id — by id
// ============================================================
function GetUserByIdSection() {
    const [id, setId] = useState("");
    const [state, setState] = useState<RequestState<User>>({ status: "idle" });

    async function load() {
        setState({ status: "loading" });
        try {
            const user = await getUserById(id.trim());
            setState({ status: "success", data: user });
        } catch (err) {
            setState({ status: "error", error: errorMessage(err) });
        }
    }

    return (
        <Section title="GET /users/:id — หา 1 คน">
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="user id (cuid)"
                        value={id}
                        onChange={setId}
                    />
                </div>
                <Button
                    onClick={load}
                    disabled={!id || state.status === "loading"}
                    label={state.status === "loading" ? "..." : "Fetch"}
                />
            </div>
            <StateView
                state={state}
                renderData={(u) => <UserCard user={u} />}
            />
        </Section>
    );
}

// ============================================================
// Reusable bits
// ============================================================

// section card — header + slot — ใช้ซ้ำทั้ง 3 ช่อง ลด markup ซ้ำ
function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <h2 className="font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function Input({
    placeholder,
    value,
    onChange,
}: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <input
            className="w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function Button({
    onClick,
    disabled,
    label,
}: {
    onClick: () => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {label}
        </button>
    );
}

// แสดง result ตาม state — error เน้นสีแดง, success render ตาม renderData
// loading ไม่โชว์อะไรเพราะปุ่มเปลี่ยน label เป็น "..." อยู่แล้ว
function StateView<T>({
    state,
    renderData,
}: {
    state: RequestState<T>;
    renderData: (data: T) => React.ReactNode;
}) {
    if (state.status === "idle" || state.status === "loading") return null;
    if (state.status === "error") {
        return (
            <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {state.error}
            </p>
        );
    }
    return <div>{renderData(state.data)}</div>;
}

function UserCard({ user }: { user: User }) {
    return (
        <div className="space-y-1 rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">
            <div className="break-all font-mono text-gray-500">{user.id}</div>
            <div className="text-sm">
                <strong>{user.email}</strong>
                {user.name && (
                    <span className="text-gray-600 dark:text-gray-400">
                        {" · "}
                        {user.name}
                    </span>
                )}
            </div>
            <div className="text-gray-500">
                created {new Date(user.createdAt).toLocaleString()}
            </div>
        </div>
    );
}
