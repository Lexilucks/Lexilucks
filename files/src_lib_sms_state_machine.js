// src/lib/sms-state-machine.js
// Purpose: Manage request state transitions: new → consented → package_selected → checkout_sent → paid → scheduling_sent → completed
// CRITICAL: 18+ age gate, STOP handling, audit trail

/**
 * State transitions and validation rules
 */
const STATE_MACHINE = {
  new: {
    nextStates: ['consented'],
    action: 'age_gate_presented',
  },
  consented: {
    nextStates: ['package_selected'],
    action: 'age_confirmed_18_plus',
  },
  package_selected: {
    nextStates: ['checkout_sent'],
    action: 'package_chosen',
  },
  checkout_sent: {
    nextStates: ['paid', 'new'],
    action: 'stripe_link_sent',
  },
  paid: {
    nextStates: ['scheduling_sent', 'completed'],
    action: 'payment_succeeded',
  },
  scheduling_sent: {
    nextStates: ['completed'],
    action: 'calendly_link_sent',
  },
  completed: {
    nextStates: [],
    action: 'request_fulfilled',
  },
};

/**
 * Validate state transition
 * @param {string} currentState
 * @param {string} nextState
 * @returns {boolean}
 */
export function isValidTransition(currentState, nextState) {
  if (!STATE_MACHINE[currentState]) {
    throw new Error(`Invalid current state: ${currentState}`);
  }
  if (!STATE_MACHINE[nextState]) {
    throw new Error(`Invalid next state: ${nextState}`);
  }
  return STATE_MACHINE[currentState].nextStates.includes(nextState);
}

/**
 * Transition with audit logging
 * @param {object} db - Supabase client
 * @param {string} requestId - fan_requests.id
 * @param {string} nextState - target state
 * @param {object} metadata - optional data to log
 * @returns {Promise}
 */
export async function transitionState(db, requestId, nextState, metadata = {}) {
  // Fetch current state
  const { data: request, error: fetchError } = await db
    .from('fan_requests')
    .select('status')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch request: ${fetchError.message}`);
  }

  const currentState = request.status;

  // Validate transition
  if (!isValidTransition(currentState, nextState)) {
    throw new Error(
      `Invalid transition: ${currentState} → ${nextState}`
    );
  }

  // Update to new state
  const { error: updateError } = await db
    .from('fan_requests')
    .update({
      status: nextState,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    throw new Error(`Failed to update state: ${updateError.message}`);
  }

  // Audit log (optional: log state transitions separately)
  console.log(
    `State transition: ${currentState} → ${nextState} for request ${requestId}`,
    metadata
  );
}

/**
 * Check if user is opted out
 */
export async function isOptedOut(db, phoneNumber) {
  const { data: contact, error } = await db
    .from('fan_contacts')
    .select('opted_out_at, sms_opted_in')
    .eq('phone_number', phoneNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found
    throw error;
  }

  return contact?.opted_out_at !== null || contact?.sms_opted_in === false;
}

/**
 * Log consent event (18+, opt-in, opt-out)
 */
export async function logConsentEvent(
  db,
  phoneNumber,
  eventType,
  metadata = {}
) {
  const validTypes = [
    '18+_confirmed',
    'sms_opted_in',
    'opted_out',
    'terms_agreed',
  ];
  if (!validTypes.includes(eventType)) {
    throw new Error(`Invalid consent event type: ${eventType}`);
  }

  const { error } = await db.from('consent_events').insert({
    phone_number: phoneNumber,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to log consent event: ${error.message}`);
  }
}

/**
 * Handle STOP keyword: opt out user immediately
 */
export async function handleSTOP(db, phoneNumber) {
  // Update fan_contacts
  const { error: contactError } = await db
    .from('fan_contacts')
    .update({
      sms_opted_in: false,
      opted_out_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);

  if (contactError) {
    throw new Error(`Failed to opt out contact: ${contactError.message}`);
  }

  // Log consent event
  await logConsentEvent(db, phoneNumber, 'opted_out', {
    reason: 'user_sent_stop',
  });

  console.log(`User ${phoneNumber} opted out via STOP`);
}

/**
 * Handle UNSTOP keyword: re-opt-in user
 */
export async function handleUNSTOP(db, phoneNumber) {
  // Check if user exists
  const { data: contact, error: fetchError } = await db
    .from('fan_contacts')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (fetchError && fetchError.code === 'PGRST116') {
    // User doesn't exist, create them
    const { error: createError } = await db.from('fan_contacts').insert({
      phone_number: phoneNumber,
      sms_opted_in: true,
      sms_opted_in_at: new Date().toISOString(),
    });
    if (createError) throw createError;
  } else {
    // User exists, re-opt them in
    const { error: updateError } = await db
      .from('fan_contacts')
      .update({
        sms_opted_in: true,
        opted_out_at: null,
      })
      .eq('phone_number', phoneNumber);

    if (updateError) {
      throw new Error(`Failed to re-opt in contact: ${updateError.message}`);
    }
  }

  // Log consent event
  await logConsentEvent(db, phoneNumber, 'sms_opted_in', {
    reason: 'user_sent_unstop',
  });

  console.log(`User ${phoneNumber} re-opted in via UNSTOP`);
}

/**
 * Enforce 18+ gate: check if user has confirmed age
 */
export async function has18PlusConsent(db, phoneNumber) {
  const { data: events, error } = await db
    .from('consent_events')
    .select('event_type')
    .eq('phone_number', phoneNumber)
    .eq('event_type', '18+_confirmed');

  if (error) {
    throw error;
  }

  return events && events.length > 0;
}

export default {
  isValidTransition,
  transitionState,
  isOptedOut,
  logConsentEvent,
  handleSTOP,
  handleUNSTOP,
  has18PlusConsent,
  STATE_MACHINE,
};
