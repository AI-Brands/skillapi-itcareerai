// Types for session context
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

// Store for session contexts
export const sessionContexts = new Map<string, InterviewContext>();

// Helper function to store context
export function storeContext(sessionId: string, context: InterviewContext): void {
  console.log('Storing context for session:', sessionId);
  console.log('Context details:', JSON.stringify(context, null, 2));
  console.log('Initial question being stored:', context.initialQuestion);
  sessionContexts.set(sessionId, context);
}

// Helper function to get context
export function getContext(sessionId: string): InterviewContext | undefined {
  const context = sessionContexts.get(sessionId);
  console.log('Retrieved context for session:', sessionId);
  console.log('Context details:', JSON.stringify(context, null, 2));
  console.log('Initial question in retrieved context:', context?.initialQuestion);
  return context;
}

// Helper function to clear context
export function clearContext(sessionId: string): void {
  console.log('Clearing context for session:', sessionId);
  sessionContexts.delete(sessionId);
} 