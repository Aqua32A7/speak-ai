/**
 * Utilities for cleaning text, formatting scores, building spoken summaries,
 * and chunking utterances for browser SpeechSynthesis.
 */

const DIGIT_WORDS = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

/**
 * Format a numerical score (0 to 10) into spoken English words.
 * Examples: 7 -> "seven out of ten", 8.5 -> "eight point five out of ten"
 */
export function formatScoreInWords(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return 'seven out of ten';
  }

  const num = Math.min(Math.max(Number(score), 0), 10);
  const rounded = Math.round(num * 10) / 10;
  const whole = Math.floor(rounded);
  const decimal = Math.round((rounded - whole) * 10);

  const wholeWord = DIGIT_WORDS[whole] || `${whole}`;

  if (decimal > 0 && whole < 10) {
    const decimalWord = DIGIT_WORDS[decimal] || `${decimal}`;
    return `${wholeWord} point ${decimalWord} out of ten`;
  }

  return `${wholeWord} out of ten`;
}

/**
 * Cleans text for natural speech synthesis:
 * - Translates Big-O notation into words (e.g. O(n) -> "O of n")
 * - Converts score fractions (7/10 -> "seven out of ten")
 * - Strips markdown symbols, code backticks, brackets, bullet points, and headers
 */
export function cleanTextForSpeech(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Translate Big-O notation
  cleaned = cleaned.replace(/O\s*\(\s*1\s*\)/gi, 'O of one');
  cleaned = cleaned.replace(/O\s*\(\s*log\s*n\s*\)/gi, 'O of log n');
  cleaned = cleaned.replace(/O\s*\(\s*n\s*(?:\*|\s*)\s*log\s*n\s*\)/gi, 'O of n log n');
  cleaned = cleaned.replace(/O\s*\(\s*n\s*\^\s*2\s*\)/gi, 'O of n squared');
  cleaned = cleaned.replace(/O\s*\(\s*n\s*\^\s*3\s*\)/gi, 'O of n cubed');
  cleaned = cleaned.replace(/O\s*\(\s*2\s*\^\s*n\s*\)/gi, 'O of two to the n');
  cleaned = cleaned.replace(/O\s*\(\s*n\s*!\s*\)/gi, 'O of n factorial');
  cleaned = cleaned.replace(/O\s*\(\s*n\s*\)/gi, 'O of n');
  cleaned = cleaned.replace(/O\s*\(\s*v\s*\+\s*e\s*\)/gi, 'O of V plus E');
  // General fallback for any remaining O(...)
  cleaned = cleaned.replace(/O\s*\(\s*([^)]+)\s*\)/g, 'O of $1');

  // 2. Score fractions like "7/10" or "8.5/10"
  cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*\/\s*10\b/g, (match, p1) => {
    return formatScoreInWords(parseFloat(p1));
  });

  // 3. Mathematical & tech symbols
  cleaned = cleaned.replace(/&/g, ' and ');
  cleaned = cleaned.replace(/%/g, ' percent');
  cleaned = cleaned.replace(/\+/g, ' plus ');
  cleaned = cleaned.replace(/->|➔|→/g, ' then ');
  cleaned = cleaned.replace(/<=/g, ' less than or equal to ');
  cleaned = cleaned.replace(/>=/g, ' greater than or equal to ');
  cleaned = cleaned.replace(/!=/g, ' not equal to ');
  cleaned = cleaned.replace(/==/g, ' equals ');
  cleaned = cleaned.replace(/=/g, ' equals ');

  // 4. Strip markdown formatting
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1'); // Inline backticks
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold **
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1'); // Bold __
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Italics *
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1'); // Italics _
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, '$1'); // Bracketed text (useful phrase highlights)
  cleaned = cleaned.replace(/#/g, ''); // Hashtags & pound symbols
  cleaned = cleaned.replace(/^[•\-\*]\s+/gm, ''); // Bullet points
  cleaned = cleaned.replace(/https?:\/\/\S+/g, ''); // URLs

  // 5. Clean up conversational quotes and excess whitespace
  cleaned = cleaned.replace(/["'“”‘’]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Builds a concise spoken feedback summary (3-5 sentences, under ~40s of speech).
 * Uses Gemini's spoken_summary if available; otherwise builds a clean deterministic fallback.
 */
export function buildSpokenSummary(analysis) {
  if (!analysis) return 'Great effort on this speaking drill. Keep practicing to build confidence.';

  // If Gemini provided a spoken summary, clean and use it directly
  if (analysis.spoken_summary && typeof analysis.spoken_summary === 'string' && analysis.spoken_summary.trim().length > 10) {
    const cleaned = cleanTextForSpeech(analysis.spoken_summary);
    if (cleaned.length > 450) {
      return truncateToSentence(cleaned, 450);
    }
    return cleaned;
  }

  // Fallback deterministic builder
  const score = analysis.overall_score || 0;
  const scoreWords = formatScoreInWords(score);

  let intro = 'Great job!';
  if (score >= 8.5) intro = 'Outstanding work!';
  else if (score >= 7) intro = 'Nice work!';
  else if (score >= 5) intro = 'Good effort!';
  else intro = 'Keep practicing!';

  const sentences = [];
  sentences.push(`${intro} Your overall score is ${scoreWords}.`);

  // 1 strength
  if (Array.isArray(analysis.strengths) && analysis.strengths.length > 0) {
    let strength = cleanTextForSpeech(analysis.strengths[0]);
    // Ensure it ends with punctuation
    if (strength && !/[.!?]$/.test(strength)) strength += '.';
    if (strength) {
      if (/^(you|the candidate|good|clear|strong|great)/i.test(strength)) {
        sentences.push(strength);
      } else {
        sentences.push(`You did well to ${strength.charAt(0).toLowerCase() + strength.slice(1)}`);
      }
    }
  }

  // 1-2 improvements
  if (Array.isArray(analysis.improvements) && analysis.improvements.length > 0) {
    const imp1 = cleanTextForSpeech(analysis.improvements[0]);
    const imp2 = analysis.improvements[1] ? cleanTextForSpeech(analysis.improvements[1]) : null;

    if (imp1) {
      let impText = imp1;
      if (!/[.!?]$/.test(impText)) impText += '.';
      sentences.push(`Next time, try to ${impText.charAt(0).toLowerCase() + impText.slice(1)}`);
    } else if (imp2) {
      let impText = imp2;
      if (!/[.!?]$/.test(impText)) impText += '.';
      sentences.push(`Also, ${impText.charAt(0).toLowerCase() + impText.slice(1)}`);
    }
  }

  // Next focus area
  if (analysis.next_focus_area && typeof analysis.next_focus_area === 'string') {
    let focus = cleanTextForSpeech(analysis.next_focus_area);
    if (!/[.!?]$/.test(focus)) focus += '.';
    sentences.push(`Next, focus on ${focus.charAt(0).toLowerCase() + focus.slice(1)}`);
  }

  const combined = sentences.join(' ');
  return truncateToSentence(combined, 450);
}

/**
 * Truncate text cleanly at a sentence boundary within maxLength.
 */
function truncateToSentence(text, maxLength = 450) {
  if (text.length <= maxLength) return text;

  const sub = text.slice(0, maxLength);
  const lastPeriod = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('!'), sub.lastIndexOf('?'));

  if (lastPeriod > 50) {
    return sub.slice(0, lastPeriod + 1);
  }
  return sub.trim() + '...';
}

/**
 * Splits text into sentence-sized chunks (< 140 chars) to work around
 * the known Chrome SpeechSynthesis 15-second cut-off bug.
 */
export function chunkTextForTTS(text, maxLen = 140) {
  if (!text || typeof text !== 'string') return [];

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return [];

  // Match sentences ending with punctuation
  const sentenceRegex = /[^.!?]+[.!?]+|\S[^.!?]*$/g;
  const rawSentences = cleaned.match(sentenceRegex) || [cleaned];

  const chunks = [];

  for (let sentence of rawSentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    if (sentence.length <= maxLen) {
      chunks.push(sentence);
    } else {
      // Split long sentence by clauses or commas
      const subClauses = sentence.split(/,\s+/);
      let currentChunk = '';

      for (let clause of subClauses) {
        clause = clause.trim();
        if (!clause) continue;

        if ((currentChunk + ', ' + clause).length <= maxLen && currentChunk.length > 0) {
          currentChunk += ', ' + clause;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (clause.length > maxLen) {
            // Words split if clause itself is huge
            const words = clause.split(/\s+/);
            let wordChunk = '';
            for (const word of words) {
              if ((wordChunk + ' ' + word).length <= maxLen) {
                wordChunk = wordChunk ? wordChunk + ' ' + word : word;
              } else {
                if (wordChunk) chunks.push(wordChunk);
                wordChunk = word;
              }
            }
            if (wordChunk) currentChunk = wordChunk;
            else currentChunk = '';
          } else {
            currentChunk = clause;
          }
        }
      }

      if (currentChunk) chunks.push(currentChunk);
    }
  }

  return chunks.filter((c) => c.length > 0);
}
