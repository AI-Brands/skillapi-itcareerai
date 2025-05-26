import { Connection } from '../../utils/ws_connection';
import { InterviewContext } from '../../app/session_store';
declare const activeWsConnections: Map<string, ConnectionWithContext>;
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
export declare const sessionStartHandler: (connection: Connection, message: any) => Promise<void>;
/**
 * Session end handler
 *
 * Message sent to the skill at the end of the session, can be useful
 * to clean up session resources or do end-of-session processing
 */
export declare const sessionEndHandler: (connection: Connection, message: any) => Promise<void>;
export { activeWsConnections };
