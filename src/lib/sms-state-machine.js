/**
 * Lexi Concierge SMS State Machine
 * Defines valid transitions for a fan request.
 */

export const STATES = {
  NEW: 'new',
  MENU_SENT: 'menu_sent',
  PACKAGE_SELECTED: 'package_selected',
  CHECKOUT_SENT: 'checkout_sent',
  PAID: 'paid',
  SCHEDULING_SENT: 'scheduling_sent',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed'
};

export const TRANSITIONS = {
  [STATES.NEW]: [STATES.MENU_SENT],
  [STATES.MENU_SENT]: [STATES.PACKAGE_SELECTED],
  [STATES.PACKAGE_SELECTED]: [STATES.CHECKOUT_SENT],
  [STATES.CHECKOUT_SENT]: [STATES.PAID],
  [STATES.PAID]: [STATES.SCHEDULING_SENT, STATES.COMPLETED],
  [STATES.SCHEDULING_SENT]: [STATES.SCHEDULED],
  [STATES.SCHEDULED]: [STATES.COMPLETED]
};

export function isValidTransition(currentState, nextState) {
  const allowed = TRANSITIONS[currentState];
  return allowed ? allowed.includes(nextState) : false;
}
