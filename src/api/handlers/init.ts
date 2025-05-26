import { InitRequest } from '@soulmachines/smskillsdk';

/**
 * Init handler
 * https://docs.soulmachines.com/skills/api#tag/Init
 *
 * Runs when a DDNA Studio project is deployed with this Skill configured
 */
export function initHandler(req: InitRequest) {
  console.log('Init handler got:', req);
}
