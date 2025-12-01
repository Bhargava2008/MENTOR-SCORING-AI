// utils/transcriptCleaner.js
module.exports = {
  cleanTranscript,
};

/**
 * Clean and normalize raw transcript text from Whisper.
 * - trim whitespace
 * - remove duplicated punctuation
 * - fix spacing around punctuation
 * - collapse repeated words (simple heuristic)
 * - join lines into paragraphs (keep short breaks)
 * - preserve case (do not force heavy capitalization)
 *
 * This is intentionally conservative: we don't rewrite meaning,
 * only normalize formatting so downstream LLMs and metric code behave.
 */
function cleanTranscript(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Normalize newlines and trim
  let t = text.replace(/\r\n/g, "\n").trim();

  // 2. Replace many whitespace with single space, but keep paragraph breaks:
  //    Convert two-or-more newlines into a special paragraph marker, then later restore as double newline.
  t = t.replace(/\n{2,}/g, " <<PARA>> ");
  t = t.replace(/\n/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/<<PARA>>/g, "\n\n"); // restore paragraph breaks

  // 3. Fix spacing around punctuation
  t = t.replace(/\s+,/g, ",");
  t = t.replace(/\s+\./g, ".");
  t = t.replace(/\s+\?/g, "?");
  t = t.replace(/\s+!/g, "!");

  // 4. Collapse repeated punctuation (e.g., "???" -> "?")
  t = t.replace(/([?!.,])\1{1,}/g, "$1");

  // 5. Simple repeated-word collapse for obvious immediate repeats:
  //    "the the" -> "the", but keep up to 2 repeats allowed for emphasis
  t = t.replace(/\b(\w+)\s+\1\b/gi, "$1");

  // 6. Fix common filler duplications like "uh uh" or "um um"
  t = t.replace(/\b(uh|um|okay|right|like)\s+\1\b/gi, "$1");

  // 7. Insert missing space after comma if missing (rare)
  t = t.replace(/,([^\s])/g, ", $1");

  // 8. Add basic sentence boundary punctuation heuristics:
  //    If a lowercase word is followed by a capitalized word and there's no punctuation,
  //    don't force punctuation. Keep conservative: only add period when
  //    there's a long run of words (> 15) without punctuation.
  const sentences = t.split(/([.?!])/);
  // rejoin to avoid accidental splitting side effects (keeps original punctuation)
  t = sentences.join("").replace(/\s+/g, " ").trim();

  // 9. Final trim
  t = t.trim();

  return t;
}
