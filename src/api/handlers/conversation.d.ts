import { Connection } from '../../utils/ws_connection';
/**
 * Conversation handler
 *
 * This is the main handler for processing user messages. It receives
 * the user's message and should return a response.
 */
export declare const conversationHandler: (connection: Connection, message: any) => Promise<void>;
