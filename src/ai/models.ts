// This file is NOT 'use server'

/**
 * The Gemini chat model every AI feature uses, defined once.
 *
 * Google retired gemini-2.0-flash (and stopped serving gemini-2.5-flash to new
 * keys), which broke every AI feature at once. `gemini-flash-latest` is
 * Google's alias for the current Flash model, so a future retirement does not
 * need a code change. Pin a dated model here instead if you need fixed behaviour.
 */
export const CHAT_MODEL = 'googleai/gemini-flash-latest';
