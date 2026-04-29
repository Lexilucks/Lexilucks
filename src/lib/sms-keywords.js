/**
 * Lexi Concierge SMS Keyword Routing
 * Defines keywords and their corresponding actions.
 */

export const KEYWORDS = {
  MENU: ['ACCESS', 'MENU', 'OPTIONS'],
  PACKAGE_SELECT: ['1', '2', '3', '4', '5', '6', '7', '8'],
  STOP: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
  HELP: ['HELP', 'INFO', 'SUPPORT'],
  STATUS: ['STATUS', 'CHECK'],
  RESCHEDULE: ['RESCHEDULE', 'CHANGE']
};

export function matchKeyword(body) {
  const text = (body || '').trim().toUpperCase();
  
  for (const [intent, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.includes(text)) {
      return { intent, value: text };
    }
  }
  
  return { intent: 'UNKNOWN', value: text };
}
