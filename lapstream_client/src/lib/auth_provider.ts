import { useState } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [jwt, setJwt] = useState(null);
    const [authState, setAuthState] = useState("noauth"); // "noauth" | "authenticated" | "loading"
}
