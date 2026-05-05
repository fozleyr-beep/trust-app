import type { MatchSuggestionView } from "@/lib/service/operations";

export function explainMatchSuggestion(match: MatchSuggestionView): string[] {
  const chips = new Set<string>();
  if (match.candidateUserId) chips.add("verified candidate");
  if (match.context) {
    for (const part of match.context.split("·")) {
      const value = part.trim();
      if (value) chips.add(value);
    }
  }
  if (/consented intake/i.test(match.reason)) chips.add("consented intake");
  if (/small|capped|shortlist/i.test(match.reason)) chips.add("bounded shortlist");
  if (chips.size === 0) chips.add("reason visible");
  return [...chips].slice(0, 5);
}
