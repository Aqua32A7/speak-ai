import test from 'node:test';
import assert from 'node:assert';
import {
  formatScoreInWords,
  cleanTextForSpeech,
  buildSpokenSummary,
  chunkTextForTTS,
} from '../src/utils/speechSummary.js';

test('formatScoreInWords handles integers and decimals', () => {
  assert.strictEqual(formatScoreInWords(10), 'ten out of ten');
  assert.strictEqual(formatScoreInWords(7), 'seven out of ten');
  assert.strictEqual(formatScoreInWords(8.5), 'eight point five out of ten');
  assert.strictEqual(formatScoreInWords(6.2), 'six point two out of ten');
  assert.strictEqual(formatScoreInWords(0), 'zero out of ten');
  assert.strictEqual(formatScoreInWords(null), 'seven out of ten');
});

test('cleanTextForSpeech translates Big-O notation', () => {
  assert.strictEqual(cleanTextForSpeech('The time complexity is O(1).'), 'The time complexity is O of one.');
  assert.strictEqual(cleanTextForSpeech('We achieve O(n) runtime.'), 'We achieve O of n runtime.');
  assert.strictEqual(cleanTextForSpeech('Merge sort runs in O(n log n).'), 'Merge sort runs in O of n log n.');
  assert.strictEqual(cleanTextForSpeech('Nested loops take O(n^2) time.'), 'Nested loops take O of n squared time.');
  assert.strictEqual(cleanTextForSpeech('BFS traverses in O(V + E).'), 'BFS traverses in O of V plus E.');
});

test('cleanTextForSpeech strips markdown formatting and brackets', () => {
  const input = '**Great points!** Use `HashMap` instead of [raw arrays]. Check #1 item.';
  const cleaned = cleanTextForSpeech(input);
  assert.strictEqual(cleaned, 'Great points! Use HashMap instead of raw arrays. Check 1 item.');
});

test('cleanTextForSpeech handles score fractions', () => {
  assert.strictEqual(cleanTextForSpeech('Score: 8/10 on clarity.'), 'Score: eight out of ten on clarity.');
});

test('buildSpokenSummary prioritizes analysis.spoken_summary if available', () => {
  const analysis = {
    overall_score: 8,
    spoken_summary: 'Outstanding explanation of dynamic programming. You covered memoization clearly. Next, focus on space optimization.',
  };
  const summary = buildSpokenSummary(analysis);
  assert.ok(summary.includes('Outstanding explanation of dynamic programming'));
});

test('buildSpokenSummary builds structured fallback when spoken_summary is missing', () => {
  const analysis = {
    overall_score: 7.5,
    strengths: ['Clear explanation of quicksort partitioning'],
    improvements: ['Avoid repeating conversational fillers', 'State the space complexity upfront'],
    next_focus_area: 'Explaining worst-case pivot selection',
  };
  const summary = buildSpokenSummary(analysis);
  assert.ok(summary.includes('seven point five out of ten'));
  assert.ok(summary.includes('quicksort partitioning'));
  assert.ok(summary.includes('conversational fillers'));
  assert.ok(summary.includes('worst-case pivot selection'));
  assert.ok(summary.length <= 450);
});

test('buildSpokenSummary handles missing fields without crashing', () => {
  const analysis = {
    overall_score: 6,
    strengths: [],
    improvements: [],
    next_focus_area: null,
  };
  const summary = buildSpokenSummary(analysis);
  assert.ok(summary.includes('six out of ten'));
});

test('chunkTextForTTS splits text into chunks under maxLen', () => {
  const longText = 'First sentence explains the architecture. Second sentence dives into the database layer. Third sentence discusses how Redis caching was used to speed up response times. Fourth sentence discusses how failure recovery was implemented.';
  const chunks = chunkTextForTTS(longText, 100);
  assert.ok(chunks.length >= 3);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 100, `Chunk exceeds 100 chars: ${chunk}`);
  }
});
