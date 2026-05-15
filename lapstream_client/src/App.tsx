import "./App.css";
import { useAuthStore } from "./stores/authStore";
import LoginDialog from "./components/LoginPage";
import { ThemeProvider } from "./components/theme_provider";
import { RolesRouter } from "./components/RolesRouter";
import { ErrorBoundary } from "./components/utils/ErrorBoundary.tsx";
import { GlobalErrorProvider } from "./components/utils/GlobalErrorProvider.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

function App() {
    const { config, login } = useAuthStore();

    return (
        <ThemeProvider>
            <ErrorBoundary>
                <GlobalErrorProvider>
                    <main className="w-full h-full overscroll-none fixed overflow-hidden">
                        {config === null ? (
                            <LoginDialog onLogin={login} />
                        ) : (
                            <RolesRouter />
                        )}
                    </main>
                    <Toaster />
                </GlobalErrorProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
