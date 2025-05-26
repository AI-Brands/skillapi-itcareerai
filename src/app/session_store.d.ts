export interface InterviewContext {
    name: string;
    jobTitle: string;
    company: string;
    location?: string;
    stage: string;
    difficulty: string;
    notes?: string;
    initialQuestion?: string;
}
export declare const sessionContexts: Map<string, InterviewContext>;
export declare function storeContext(sessionId: string, context: InterviewContext): void;
export declare function getContext(sessionId: string): InterviewContext | undefined;
export declare function clearContext(sessionId: string): void;
