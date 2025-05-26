import {
  SessionStartMessage,
  SessionEndMessage,
} from '@soulmachines/smskillsdk';
import { Connection } from 'utils/ws_connection';
import { sessionContexts, InterviewContext, getContext, storeContext, clearContext } from '../../app/session_store';

// Store active session contexts and connections
const activeSessionContexts = new Map<string, InterviewContext>();
const activeWsConnections = new Map<string, ConnectionWithContext>();

interface ConnectionWithContext extends Connection {
  context?: InterviewContext;
  interviewStage?: string;
  sessionId?: string;
}

/**
 * Session start handler
 *
 * Message sent to the skill at the start of the session, can be useful
 * to do processing or caching on a per-session basis.
 */
export async function sessionStartHandler(
  connection: ConnectionWithContext,
  msg: SessionStartMessage
) {
  console.log('=== Session Start Event ===');
  console.log('Session ID:', msg.sessionId);
  console.log('Available contexts:', Array.from(sessionContexts.keys()));
  
  if (!msg.sessionId) {
    console.error('No session ID provided');
    return;
  }

  // Store the connection
  activeWsConnections.set(msg.sessionId, connection);
  console.log('Stored WebSocket connection for session:', msg.sessionId);
  console.log('Current active connections:', Array.from(activeWsConnections.keys()));

  // Get context from session store
  const context = getContext(msg.sessionId);
  console.log('Retrieved context:', JSON.stringify(context, null, 2));
  console.log('Initial question in context:', context?.initialQuestion);

  if (context) {
    // Store in active sessions
    activeSessionContexts.set(msg.sessionId, context);
    
    // Attach context to connection
    connection.context = context;
    connection.interviewStage = 'greeting';
    connection.sessionId = msg.sessionId;
    
    console.log('Context attached to connection:', JSON.stringify(connection.context, null, 2));
    
    // Send welcome message
    const welcomeResponse = {
      text: "Welcome to your mock interview session! When you're ready, please say 'start interview' to begin.",
    };
    console.log('Sending welcome message:', welcomeResponse);
    await connection.send('skillConversation', welcomeResponse);
  } else {
    console.error('No context found for session:', msg.sessionId);
    // Send error message
    const response = {
      text: "I don't have your interview context yet. Please make sure the context was properly sent before starting the session.",
    };
    console.log('Sending error message:', response);
    await connection.send('skillConversation', response);
  }
}

/**
 * Session end handler
 *
 * Message sent to the skill at the end of the session, can be useful
 * to clean up session resources or do end-of-session processing
 */
export async function sessionEndHandler(
  connection: ConnectionWithContext,
  msg: SessionEndMessage
) {
  console.log('=== Session End Event ===');
  console.log('Session ID:', msg.sessionId);
  
  if (msg.sessionId) {
    // Clean up both stores
    clearContext(msg.sessionId);
    activeSessionContexts.delete(msg.sessionId);
    activeWsConnections.delete(msg.sessionId);
    console.log('Context and connection cleaned up for session:', msg.sessionId);
  }
}

// Export the activeWsConnections map for use in other handlers
export { activeWsConnections };
