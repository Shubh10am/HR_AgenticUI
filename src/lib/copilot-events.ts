/** Lets any page open the Copilot panel with a question already asked. */
export const COPILOT_ASK_EVENT = 'copilot:ask';

export const COPILOT_STARTERS = ['What needs my attention today?', 'How much leave do I have left?', 'Which courses are due soon?', 'When is my next 1:1?'];

export function askCopilot(question: string) {
  window.dispatchEvent(new CustomEvent<string>(COPILOT_ASK_EVENT, { detail: question }));
}
