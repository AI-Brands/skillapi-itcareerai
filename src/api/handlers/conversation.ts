import {
  UserConversationMessage,
  SkillConversationMessage,
} from '@soulmachines/smskillsdk';
import { Connection } from 'utils/ws_connection';
import { InterviewContext } from '../../app/session_store';
import { activeWsConnections } from './session';

type InterviewStage = 'greeting' | 'interview' | 'closing';

interface ConnectionWithContext extends Connection {
  context?: any;
  interviewStage?: string;
  sessionId?: string;
}

interface MessageVariables {
  kind?: string;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Conversation handler
 *
 * This is the main handler for processing user messages. It receives
 * the user's message and should return a response.
 */
export async function conversationHandler(
  connection: ConnectionWithContext,
  msg: UserConversationMessage
): Promise<string | null> {
  console.log('=== Conversation Event ===');
  console.log('Raw user message:', msg.text);
  console.log('Message:', msg);
  console.log('Connection context:', JSON.stringify(connection.context, null, 2));
  console.log('Interview stage:', connection.interviewStage);

  // Use regex for more robust trigger detection
  const userMessage = msg.text.trim();
  const isStartInterview = /\b(start|begin) interview\b/i.test(userMessage);

  // If this is a start interview trigger and we have context
  if (isStartInterview && connection.context) {
    console.log('Start interview triggered with context');
    connection.interviewStage = 'interview';
    
    // Construct greeting message
    const greeting = `Hello ${connection.context.name}! I'll be conducting your ${connection.context.stage} interview for the ${connection.context.jobTitle} position at ${connection.context.company}. `;
    const stageMessage = connection.context.stage === 'intro' ? 
      "This is an initial screening call to get to know you better." :
      connection.context.stage === 'behavioral' ?
      "I'll be asking you about your past experiences and how you've handled different situations." :
      connection.context.stage === 'technical' ?
      "I'll be asking you technical questions to assess your knowledge and problem-solving abilities." :
      connection.context.stage === 'situational' ?
      "I'll be presenting you with hypothetical scenarios to understand how you would handle them." :
      "I'll be asking questions to understand how well you align with our company culture.";

    const difficultyMessage = connection.context.difficulty === 'beginner' ?
      "I'll keep the questions at a beginner level to help you get comfortable with the interview process." :
      connection.context.difficulty === 'intermediate' ?
      "I'll ask questions at an intermediate level to challenge you appropriately." :
      "I'll ask advanced questions to thoroughly assess your expertise.";

    const locationMessage = connection.context.location ? 
      ` I see you're interested in the ${connection.context.location} location.` : '';

    const fullGreeting = greeting + stageMessage + difficultyMessage + locationMessage;

    console.log('Sending greeting:', fullGreeting);
    return fullGreeting;
  } else if (isStartInterview && !connection.context) {
    // If start interview triggered but no context
    console.log('Start interview triggered but no context found');
    return "I don't have your interview context yet. Please make sure the context was properly sent before starting the session.";
  } else if (connection.interviewStage === 'interview') {
    // Handle interview questions
    console.log('Processing interview response');
    if (connection.context?.initialQuestion) {
      return connection.context.initialQuestion;
    }
    return "I understand your response. Let me think about that...";
  } else {
    // Default response for other messages
    console.log('Sending default response');
    return "Please say 'start interview' to begin your mock interview session.";
  }
}
