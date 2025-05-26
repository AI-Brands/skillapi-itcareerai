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

// Add a simple in-memory memory store for each session
const sessionMemory: Record<string, string[]> = {};

/**
 * Conversation handler
 *
 * This is the main handler for processing user messages. It receives
 * the user's message and should return a response.
 */
export async function conversationHandler(
  connection: ConnectionWithContext,
  msg: UserConversationMessage
) {
  console.log('=== Conversation Event ===');
  console.log('Raw user message:', msg.text);
  console.log('Message:', msg);
  console.log('Connection context:', JSON.stringify(connection.context, null, 2));
  console.log('Interview stage:', connection.interviewStage);

  // Use regex for more robust trigger detection
  const userMessage = msg.text.trim();
  const isStartInterview = /\b(start|begin) interview\b/i.test(userMessage);

  // --- MEMORY: Store message in session memory ---
  const sessionId = connection.sessionId || msg.sessionId || 'default';
  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = [];
  sessionMemory[sessionId].push(`User: ${userMessage}`);

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

    // Store in memory
    sessionMemory[sessionId].push(`Avatar: ${fullGreeting}`);

    console.log('Sending greeting:', fullGreeting);
    // Send greeting first
    await connection.send('conversation', { text: fullGreeting, meta: { endConversation: false }, memory: sessionMemory[sessionId] });

    // Then send initial question if available
    if (connection.context.initialQuestion) {
      console.log('Sending initial question:', connection.context.initialQuestion);
      // Add a small delay to ensure the greeting is processed first
      await new Promise(resolve => setTimeout(resolve, 1000));
      sessionMemory[sessionId].push(`Avatar: ${connection.context.initialQuestion}`);
      await connection.send('conversation', { text: connection.context.initialQuestion, meta: { endConversation: false }, memory: sessionMemory[sessionId] });
    } else {
      console.error('No initial question found in context');
      sessionMemory[sessionId].push("Avatar: Let's begin! Please introduce yourself.");
      await connection.send('conversation', { text: "Let's begin! Please introduce yourself.", meta: { endConversation: false }, memory: sessionMemory[sessionId] });
    }
  } else if (isStartInterview && !connection.context) {
    // If start interview triggered but no context
    console.log('Start interview triggered but no context found');
    sessionMemory[sessionId].push("Avatar: I don't have your interview context yet. Please make sure the context was properly sent before starting the session.");
    await connection.send('conversation', {
      text: "I don't have your interview context yet. Please make sure the context was properly sent before starting the session.",
      meta: { endConversation: false },
      memory: sessionMemory[sessionId]
    });
  } else if (connection.interviewStage === 'interview') {
    // Handle interview questions
    console.log('Processing interview response');
    // Use memory to provide context-aware response
    const lastUser = sessionMemory[sessionId].filter(m => m.startsWith('User:')).slice(-1)[0] || '';
    const response = `Thank you for your answer. (${lastUser.replace('User: ', '')}) I'll ask the next question soon.`;
    sessionMemory[sessionId].push(`Avatar: ${response}`);
    await connection.send('conversation', {
      text: response,
      meta: { endConversation: false },
      memory: sessionMemory[sessionId]
    });
  } else {
    // Default response for other messages
    console.log('Sending default response');
    sessionMemory[sessionId].push("Avatar: Please say 'start interview' to begin your mock interview session.");
    await connection.send('conversation', {
      text: "Please say 'start interview' to begin your mock interview session.",
      meta: { endConversation: false },
      memory: sessionMemory[sessionId]
    });
  }
}
