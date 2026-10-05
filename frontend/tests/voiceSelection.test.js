import test from 'node:test';
import assert from 'node:assert';
import { scoreVoice, isModernVoice, getVoiceBadge } from '../src/services/useSpeechSynthesis.js';

test('scoreVoice rates Edge Online Natural voices highest', () => {
  const jenny = {
    name: 'Microsoft Jenny Online (Natural) - English (United States)',
    lang: 'en-US',
    voiceURI: 'Microsoft Jenny Online (Natural) - English (United States)',
    localService: false,
  };
  const aria = {
    name: 'Microsoft Aria Online (Natural) - English (United States)',
    lang: 'en-US',
    voiceURI: 'Microsoft Aria Online (Natural) - English (United States)',
    localService: false,
  };

  const jennyScore = scoreVoice(jenny);
  const ariaScore = scoreVoice(aria);

  assert.ok(jennyScore > 120, `Expected Jenny score > 120, got ${jennyScore}`);
  assert.ok(ariaScore > 120, `Expected Aria score > 120, got ${ariaScore}`);
  assert.strictEqual(isModernVoice(jenny), true);
  assert.strictEqual(isModernVoice(aria), true);
  assert.strictEqual(getVoiceBadge(jenny), '✨ Neural Natural');
});

test('scoreVoice rates Chrome Google Cloud / Natural voices very high', () => {
  const googleUS = {
    name: 'Google US English',
    lang: 'en-US',
    voiceURI: 'Google US English',
    localService: false,
  };
  const googleIN = {
    name: 'Google English (India)',
    lang: 'en-IN',
    voiceURI: 'Google English (India)',
    localService: false,
  };

  const usScore = scoreVoice(googleUS);
  const inScore = scoreVoice(googleIN);

  assert.ok(usScore >= 100, `Expected Google US score >= 100, got ${usScore}`);
  assert.ok(inScore >= 90, `Expected Google IN score >= 90, got ${inScore}`);
  assert.strictEqual(isModernVoice(googleUS), true);
  assert.strictEqual(isModernVoice(googleIN), true);
  assert.strictEqual(getVoiceBadge(googleUS), '✨ Google Natural');
});

test('scoreVoice rates Apple Enhanced and Siri voices high and ahead of legacy Alex', () => {
  const samanthaEnhanced = {
    name: 'Samantha (Enhanced)',
    lang: 'en-US',
    voiceURI: 'com.apple.speech.synthesis.voice.samantha.premium',
    localService: true,
  };
  const siriVoice = {
    name: 'Siri Voice 1',
    lang: 'en-US',
    voiceURI: 'com.apple.speech.synthesis.voice.siri',
    localService: true,
  };
  const legacyAlex = {
    name: 'Alex',
    lang: 'en-US',
    voiceURI: 'com.apple.speech.synthesis.voice.Alex',
    localService: true,
  };

  const enhancedScore = scoreVoice(samanthaEnhanced);
  const siriScore = scoreVoice(siriVoice);
  const alexScore = scoreVoice(legacyAlex);

  assert.ok(enhancedScore > 100, `Expected Samantha Enhanced score > 100, got ${enhancedScore}`);
  assert.ok(siriScore >= 80, `Expected Siri score >= 80, got ${siriScore}`);
  assert.ok(alexScore <= 10, `Expected Alex score <= 10, got ${alexScore}`);
  assert.strictEqual(isModernVoice(samanthaEnhanced), true);
  assert.strictEqual(isModernVoice(legacyAlex), false);
  assert.strictEqual(getVoiceBadge(samanthaEnhanced), '✨ Enhanced');
});

test('scoreVoice penalizes joke / novelty voices and robotic legacy synthesizers', () => {
  const cellos = {
    name: 'Cellos',
    lang: 'en-US',
    voiceURI: 'com.apple.speech.synthesis.voice.Cellos',
  };
  const zarvox = {
    name: 'Zarvox',
    lang: 'en-US',
    voiceURI: 'com.apple.speech.synthesis.voice.Zarvox',
  };
  const espeak = {
    name: 'eSpeak English',
    lang: 'en',
    voiceURI: 'espeak-en',
  };
  const davidDesktop = {
    name: 'Microsoft David Desktop - English (United States)',
    lang: 'en-US',
    voiceURI: 'Microsoft David Desktop - English (United States)',
  };

  assert.strictEqual(scoreVoice(cellos), -100);
  assert.strictEqual(scoreVoice(zarvox), -100);
  assert.strictEqual(scoreVoice(espeak), -100);
  assert.ok(scoreVoice(davidDesktop) < 30);
  assert.strictEqual(isModernVoice(cellos), false);
  assert.strictEqual(isModernVoice(espeak), false);
});

test('sorting voice list prioritizes modern voices over robotic ones', () => {
  const voiceList = [
    { name: 'Alex', lang: 'en-US', voiceURI: 'alex' },
    { name: 'Microsoft David Desktop', lang: 'en-US', voiceURI: 'david' },
    { name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US', voiceURI: 'jenny', localService: false },
    { name: 'Google US English', lang: 'en-US', voiceURI: 'google_us', localService: false },
    { name: 'Samantha (Enhanced)', lang: 'en-US', voiceURI: 'samantha_enhanced' },
    { name: 'Zarvox', lang: 'en-US', voiceURI: 'zarvox' },
  ];

  const sorted = [...voiceList].sort((a, b) => scoreVoice(b) - scoreVoice(a));

  // Top 3 should all be modern voices
  assert.strictEqual(isModernVoice(sorted[0]), true);
  assert.strictEqual(isModernVoice(sorted[1]), true);
  assert.strictEqual(isModernVoice(sorted[2]), true);

  // Zarvox and Alex should be at the bottom
  assert.strictEqual(sorted[sorted.length - 1].name, 'Zarvox');
});
