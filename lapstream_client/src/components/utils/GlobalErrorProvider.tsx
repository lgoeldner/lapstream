// GlobalErrorProvider.tsx
import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LucideX } from "lucide-react";
import { Badge } from "../ui/badge";

// --- Types ---

interface ErrorMessage {
    heading: string;
    body: string;
}

interface GlobalErrorContextValue {
    setErrorMessage: (heading: string, body: string) => void;
}

// --- Context ---

const GlobalErrorContext = createContext<GlobalErrorContextValue | null>(null);

// --- Provider ---

export function GlobalErrorProvider({ children }: { children: ReactNode }) {
    const [error, setError] = useState<ErrorMessage | null>(null);

    const setErrorMessage = useCallback((heading: string, body: string) => {
        setError({ heading, body });
    }, []);

    const handleClose = () => setError(null);

    return (
        <GlobalErrorContext.Provider value={{ setErrorMessage }}>
            {children}

            <Dialog
                open={error !== null}
                onOpenChange={(open) => !open && handleClose()}
            >
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle className="flex flex-row items-center gap-2 text-2xl">
                            <Badge variant="destructive">
                                <LucideX /> Error
                            </Badge>
                            {error?.heading}
                        </DialogTitle>
                        <DialogDescription>{error?.body}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleClose}>Dismiss</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </GlobalErrorContext.Provider>
    );
}

// --- Hook ---

export function useGlobalError() {
    const ctx = useContext(GlobalErrorContext);
    if (!ctx) {
        throw new Error(
            "useGlobalError must be used within a GlobalErrorProvider",
        );
    }
    return ctx;
}
