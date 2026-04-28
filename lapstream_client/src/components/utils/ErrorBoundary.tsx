import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { LucideX } from "lucide-react";

export class ErrorBoundary extends React.Component {
    state = {
        hasErrored: false,
        err: undefined as Error | undefined,
        componentStack: "",
    };

    static getDerivedStateFromError(err: Error) {
        return { hasErrored: true, err };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        this.setState({
            hasErrored: true,
            err: error,
            componentStack: info.componentStack,
        });
    }

    render() {
        if (this.state.hasErrored)
            return (
                <div className="flex items-center justify-center">
                    <Card className="container m-6 ">
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center gap-2 text-2xl">
                                <Badge variant="destructive">
                                    <LucideX /> Error
                                </Badge>
                                Something went wrong!
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <p>{this.state.err?.message}</p>
                            <p className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                                Component Stack: {this.state.componentStack}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        return this.props.children;
    }
}
