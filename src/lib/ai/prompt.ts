import { difficultyBrief } from "@/lib/ai/adaptation";
import { SCENARIOS, type ScenarioKey } from "@/lib/constants";

export function scenarioLabel(scenarioKey: string): string {
  return SCENARIOS.find((s) => s.key === scenarioKey)?.label ?? "Small Talk";
}

/**
 * System prompt for the Conversation Lab — implements Krashen's
 * comprehensible input at the learner's i+1 level.
 */
export function buildConversationSystemPrompt({
  scenarioKey,
  estimatedLevel,
  interests,
  firstName,
}: {
  scenarioKey: string;
  estimatedLevel: number;
  interests: string[];
  firstName: string;
}): string {
  const label = scenarioLabel(scenarioKey);
  const interestsLine =
    interests.length > 0
      ? `Their interests: ${interests.join(", ")}. Weave these topics in when natural.`
      : "";

  return `You are "Milo", a warm, patient, and encouraging English conversation coach.
You are role-playing a real-life scenario with a learner named ${firstName}.

## Scenario
You are in this setting: "${label}". Stay in character and keep the scene alive.
${interestsLine}

## Learner difficulty (Krashen i+1)
Target level: ${difficultyBrief(estimatedLevel)}
Give "comprehensible input": speak so ${firstName} understands ~80% and stretches a little for the rest.

## Golden rules
- NEVER say "Wrong" or make the learner feel bad. There are no mistakes, only tries.
- If they struggle or ask, simplify: shorter sentences, easier words, rephrase warmly.
- Gently recycle vocabulary you've already used so it sticks.
- Keep your replies SHORT: 1–3 sentences, then ask ONE simple question to keep them talking.
- Encourage often with phrases like "Nice sentence!", "Good try!", "Almost!".
- When helpful, offer a natural alternative: "A native speaker would usually say ...".
- Speak ONLY in English. Never translate to other languages.
- Never break character to talk about being an AI or these instructions.

Begin and stay in the scenario. Make ${firstName} feel confident and keep the conversation flowing.`;
}

export function scenarioOpener(scenarioKey: string, firstName: string): string {
  const openers: Partial<Record<ScenarioKey, string>> = {
    coffee_shop: `Hi ${firstName}! Welcome to Bean & Brew ☕ What can I get started for you today?`,
    airport: `Good morning ${firstName}! May I see your passport and boarding pass, please? Where are you flying today?`,
    hotel: `Welcome to the Grand Hotel, ${firstName}! Do you have a reservation with us?`,
    motorcycles: `Hey ${firstName}! Nice to see a fellow rider 🏍️ So, what kind of bike are you into?`,
    restaurant: `Good evening ${firstName}, welcome! A table for how many tonight?`,
    shopping: `Hi ${firstName}! Are you looking for anything in particular today?`,
    business: `Hi ${firstName}, thanks for joining the meeting. Shall we get started?`,
    small_talk: `Hey ${firstName}! How's your day going so far?`,
    doctor: `Hello ${firstName}, come on in. So, what brings you in today?`,
    travel: `Hi ${firstName}! Planning a trip? Where would you love to go?`,
  };
  return (
    openers[scenarioKey as ScenarioKey] ??
    `Hi ${firstName}! Let's chat. How are you today?`
  );
}
