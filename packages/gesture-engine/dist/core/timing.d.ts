export declare const TIMING: {
    targetFrameRate: number;
    minFrameRate: number;
    debounce: number;
    holdThreshold: number;
    intentWindow: number;
    smoothing: number;
};
export declare class AdaptiveFrameRate {
    private frameTimes;
    private currentTarget;
    /** Call once per processed frame with how long it took, in ms */
    recordFrame(durationMs: number): void;
    /** ms to wait between frame captures at the current target rate */
    get targetIntervalMs(): number;
    get fps(): number;
}
