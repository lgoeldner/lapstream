export const ok = <T>(data: T) => ({
    status: 'ok' as const,
    data,
});

export const err = (error: unknown) => ({
    status: 'err' as const,
    err: error,
});

export type ApiOk<T> = ReturnType<typeof ok<T>>;
export type ApiErr = ReturnType<typeof err>;
export type ApiResponse<T> = ApiOk<T> | ApiErr;
