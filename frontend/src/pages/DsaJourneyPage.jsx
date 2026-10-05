import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Shield,
  Code2,
  Terminal,
  Award,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

import {
  fetchDsaProfile,
  calculateDsaJourney,
  analyzeDsaJourney,
} from '../services/api';
import {
  getDsaPlatforms,
  saveDsaPlatform,
  removeDsaPlatform,
  getDsaJourneyData,
  saveDsaJourneyData,
  getDsaSnapshotDiff,
} from '../services/storage';

const STANDARD_14_TOPICS = [
  'Arrays & Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Hashing',
  'Trees & BST',
  'Graphs',
  'Recursion & Backtracking',
  'Dynamic Programming',
  'Sorting & Searching',
  'Heaps',
  'Greedy',
  'Two Pointers / Sliding Window',
  'Bit Manipulation',
  'Complexity Analysis',
];

export default function DsaJourneyPage({ onStartDsaPracticeWithTopic, onStartDsaPracticeWithProblem }) {
  const [platforms, setPlatforms] = useState(getDsaPlatforms);
  const [journeyData, setJourneyData] = useState(getDsaJourneyData);
  const [snapshotDiff, setSnapshotDiff] = useState(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('leetcode');
  const [handleOrUrl, setHandleOrUrl] = useState('');
  const [isFetchingPlatform, setIsFetchingPlatform] = useState(false);
  const [platformError, setPlatformError] = useState(null);

  // Manual self-reported form fields
  const [manualTotal, setManualTotal] = useState(150);
  const [manualEasy, setManualEasy] = useState(50);
  const [manualMed, setManualMed] = useState(85);
  const [manualHard, setManualHard] = useState(15);
  const [manualSelectedTopics, setManualSelectedTopics] = useState(['Arrays & Strings', 'Trees & BST']);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Topic filter
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'strong' | 'moderate' | 'untouched'

  // Load snapshot diff on mount or data update
  useEffect(() => {
    if (journeyData?.calculation?.total_solved) {
      const diff = getDsaSnapshotDiff(journeyData.calculation.total_solved);
      setSnapshotDiff(diff);
    }
  }, [journeyData]);

  // Recalculate deterministic math whenever platforms change
  const runRecalculation = async (updatedPlatforms) => {
    if (!updatedPlatforms || updatedPlatforms.length === 0) {
      setJourneyData(null);
      return;
    }
    try {
      const calculation = await calculateDsaJourney(updatedPlatforms);
      const prevData = getDsaJourneyData();
      const newJourney = {
        calculation,
        analysis: prevData?.analysis || null,
      };
      const saved = saveDsaJourneyData(newJourney);
      setJourneyData(saved);
    } catch (err) {
      console.error('Failed to recalculate journey:', err);
    }
  };

  // Add auto platform (LeetCode or Codeforces)
  const handleFetchAndAddPlatform = async (e) => {
    e.preventDefault();
    if (!handleOrUrl.trim()) return;

    setIsFetchingPlatform(true);
    setPlatformError(null);

    try {
      const fetchedStats = await fetchDsaProfile({
        platform: selectedPlatform,
        handleOrUrl: handleOrUrl.trim(),
        forceRefresh: true,
      });

      const updated = saveDsaPlatform(fetchedStats);
      setPlatforms(updated);
      setHandleOrUrl('');
      setShowAddForm(false);
      await runRecalculation(updated);
    } catch (err) {
      console.error('Fetch error:', err);
      setPlatformError(err.message || `Failed to fetch profile for ${selectedPlatform}.`);
    } finally {
      setIsFetchingPlatform(false);
    }
  };

  // Add manual self-reported platform
  const handleAddManualPlatform = (e) => {
    e.preventDefault();
    const handle = handleOrUrl.trim() || 'My Account';
    const total = Number(manualTotal) || (Number(manualEasy) + Number(manualMed) + Number(manualHard));

    const topicCounts = {};
    STANDARD_14_TOPICS.forEach((t) => {
      topicCounts[t] = manualSelectedTopics.includes(t) ? 22 : 2;
    });

    const manualStats = {
      platform: selectedPlatform,
      handle,
      profile_url: handleOrUrl.startsWith('http') ? handleOrUrl : `https://${selectedPlatform}.com`,
      is_self_reported: true,
      total_solved: total,
      easy_solved: Number(manualEasy) || 0,
      medium_solved: Number(manualMed) || 0,
      hard_solved: Number(manualHard) || 0,
      contest_rating: null,
      global_rank: null,
      topic_counts: topicCounts,
      recent_problems: [],
      fetched_at: new Date().toISOString(),
    };

    const updated = saveDsaPlatform(manualStats);
    setPlatforms(updated);
    setHandleOrUrl('');
    setShowAddForm(false);
    runRecalculation(updated);
  };

  // Remove platform
  const handleRemove = async (platform, handle) => {
    const updated = removeDsaPlatform(platform, handle);
    setPlatforms(updated);
    await runRecalculation(updated);
  };

  // Run full Gemini analysis
  const handleRunAnalysis = async () => {
    if (!journeyData?.calculation) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeDsaJourney(journeyData.calculation);
      const saved = saveDsaJourneyData(result);
      setJourneyData(saved);
    } catch (err) {
      console.error('Error analyzing journey:', err);
      setAnalysisError(err.message || 'Failed to analyze DSA Journey with Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isAutoPlatform = selectedPlatform === 'leetcode' || selectedPlatform === 'codeforces';
  const calculation = journeyData?.calculation;
  const analysis = journeyData?.analysis;

  const filteredTopics = (calculation?.topic_coverage || []).filter((item) => {
    if (topicFilter === 'strong') return item.status === 'Strong';
    if (topicFilter === 'moderate') return item.status === 'Moderate';
    if (topicFilter === 'untouched') return item.status === 'Untouched';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span>DSA Profile & Journey Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Algorithmic Footprint
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Connect your public LeetCode and Codeforces accounts or self-report other platforms. Pre-calculated statistics power personalized oral DSA interview questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {platforms.length > 0 && (
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze with Gemini'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm shadow-sm hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Platform</span>
          </button>
        </div>
      </div>

      {/* Snapshot Diff Notification Banner */}
      {snapshotDiff && snapshotDiff.diff !== 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Since last check ({snapshotDiff.lastCheckDate}):</strong>{' '}
              {snapshotDiff.diff > 0 ? `+${snapshotDiff.diff}` : snapshotDiff.diff} problems solved! Keep the momentum going.
            </span>
          </div>
        </div>
      )}

      {/* Add Platform Form Accordion */}
      {showAddForm && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-sky-300/60 dark:border-sky-800/60 shadow-lg space-y-5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-500" />
              <span>Attach Coding Profile</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          {/* Platform Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Select Coding Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'leetcode', label: 'LeetCode', verified: true },
                { id: 'codeforces', label: 'Codeforces', verified: true },
                { id: 'geeksforgeeks', label: 'GeeksforGeeks', verified: false },
                { id: 'codechef', label: 'CodeChef', verified: false },
                { id: 'hackerrank', label: 'HackerRank', verified: false },
                { id: 'atcoder', label: 'AtCoder', verified: false },
                { id: 'other', label: 'Other', verified: false },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(p.id);
                    setPlatformError(null);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                    selectedPlatform === p.id
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold ring-1 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{p.label}</span>
                    {p.verified ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">API</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">Manual</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              {isAutoPlatform ? (
                <span>
                  <strong>Reliable Auto-Fetch:</strong> We fetch your live stats directly using {selectedPlatform === 'leetcode' ? 'LeetCode GraphQL' : 'Codeforces Official API'}. Strict SSRF protection and in-memory rate limiting applied.
                </span>
              ) : (
                <span>
                  <strong>Self-Reported Entry:</strong> {selectedPlatform.toUpperCase()} does not provide a reliable public API. Enter your approximate stats below; they will be tagged as <em>Self-Reported</em> and included in your journey matrix!
                </span>
              )}
            </div>
          </div>

          {platformError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {platformError}
            </div>
          )}

          {/* Auto Fetch Form */}
          {isAutoPlatform ? (
            <form onSubmit={handleFetchAndAddPlatform} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPlatform === 'leetcode' ? 'LeetCode Username or Profile URL' : 'Codeforces Handle or URL'}
                </label>
                <input
                  type="text"
                  placeholder={selectedPlatform === 'leetcode' ? 'e.g. neal_wu or https://leetcode.com/u/neal_wu/' : 'e.g. tourist or https://codeforces.com/profile/tourist'}
                  value={handleOrUrl}
                  onChange={(e) => setHandleOrUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isFetchingPlatform || !handleOrUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isFetchingPlatform ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying & Fetching...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fetch & Attach Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Manual Form */
            <form onSubmit={handleAddManualPlatform} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Handle or Profile Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. my_username"
                    value={handleOrUrl}
                    onChange={(e) => setHandleOrUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Solved
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Easy Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={manualEasy}
                    onChange={(e) => setManualEasy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Medium Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={manualMed}
                    onChange={(e) => setManualMed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Hard Solved</label>
                  <input
                    type="number"
                    min="0"
                    value={manualHard}
                    onChange={(e) => setManualHard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Strongest Topics (Marked as Strong)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_14_TOPICS.map((t) => {
                    const isSel = manualSelectedTopics.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (isSel) setManualSelectedTopics(manualSelectedTopics.filter((x) => x !== t));
                          else setManualSelectedTopics([...manualSelectedTopics, t]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Self-Reported Profile</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Connected Platforms List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-sky-500" />
          <span>Connected Coding Platforms ({platforms.length})</span>
        </h2>

        {platforms.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-3">
            <p className="text-sm">No coding platforms connected yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
            >
              Connect your LeetCode or Codeforces account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((p) => (
              <div
                key={`${p.platform}_${p.handle}`}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
                      {p.platform}
                    </span>
                    {p.is_self_reported ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                        Self-Reported
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                        Auto-Verified API
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    @{p.handle}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.total_solved} solved
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {p.easy_solved} Easy
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {p.medium_solved} Med
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {p.hard_solved} Hard
                    </span>
                    {p.contest_rating && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">
                          ★ {p.contest_rating}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {p.profile_url && (
                    <a
                      href={p.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleRemove(p.platform, p.handle)}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aggregate Deterministic Stats Cards */}
      {calculation && calculation.total_solved > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-500" />
              <span>Aggregate Solved Metrics</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Solved</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {calculation.total_solved}
              </div>
              <span className="text-[11px] text-slate-400">Across {platforms.length} platforms</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Easy Problems</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {calculation.easy_solved}
              </div>
              <span className="text-[11px] text-slate-400">
                {Math.round((calculation.easy_solved / calculation.total_solved) * 100)}% of total
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Medium Problems</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {calculation.medium_solved}
              </div>
              <span className="text-[11px] text-slate-400">
                {Math.round((calculation.medium_solved / calculation.total_solved) * 100)}% of total
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Hard Problems</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                {calculation.hard_solved}
              </div>
              <span className="text-[11px] text-slate-400">
                {Math.round((calculation.hard_solved / calculation.total_solved) * 100)}% of total
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 14 Standard Topics Coverage Matrix */}
      {calculation && calculation.topic_coverage.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                <span>14 Standard Topics Coverage Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Strong (≥20 solved) • Moderate (5–19 solved) • Untouched (&lt;5 solved)
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setTopicFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  topicFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All (14)
              </button>
              <button
                onClick={() => setTopicFilter('strong')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  topicFilter === 'strong'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Strong ({calculation.strong_topics.length})
              </button>
              <button
                onClick={() => setTopicFilter('moderate')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  topicFilter === 'moderate'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Moderate ({calculation.moderate_topics.length})
              </button>
              <button
                onClick={() => setTopicFilter('untouched')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  topicFilter === 'untouched'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Untouched ({calculation.weak_topics.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTopics.map((item) => {
              const isStrong = item.status === 'Strong';
              const isModerate = item.status === 'Moderate';
              const isUntouched = item.status === 'Untouched';

              return (
                <div
                  key={item.topic}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.topic}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isStrong
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isModerate
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.count} problems solved</span>
                      <span className="font-mono text-[11px]">
                        {isStrong ? '≥20 target met' : isModerate ? `${20 - item.count} to Strong` : 'Needs focus'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isStrong
                            ? 'bg-emerald-500'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.count / 25) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onStartDsaPracticeWithTopic(item.topic)}
                    className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Practice {item.topic}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gemini Mentorship Insights Card */}
      {analysis && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 border border-sky-500/30 shadow-xl space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block">
                Gemini Bar Raiser Mentorship
              </span>
              <h3 className="text-lg font-bold text-white">
                Interview Readiness Assessment
              </h3>
            </div>
          </div>

          {/* Assessment */}
          <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
            {analysis.readiness_assessment}
          </p>

          {/* Strengths & Gaps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <span className="font-bold text-emerald-400 block uppercase tracking-wider text-xs">
                Key Algorithmic Strengths
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
              <span className="font-bold text-amber-400 block uppercase tracking-wider text-xs">
                Blind Spots & Gaps
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {analysis.gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Next 3 Focus Topics */}
          {analysis.recommended_focus_topics && analysis.recommended_focus_topics.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300 block">
                Recommended Next 3 Focus Areas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {analysis.recommended_focus_topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => onStartDsaPracticeWithTopic(topic)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white truncate pr-2">{topic}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interviewer Perspective Quote */}
          {analysis.interviewer_perspective && (
            <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-400/30 text-xs text-sky-200 italic">
              <strong>Interviewer Perspective:</strong> "{analysis.interviewer_perspective}"
            </div>
          )}
        </div>
      )}

      {/* Recent Solved Problems List */}
      {calculation && calculation.recent_solved_problems.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-500" />
                <span>Recently Solved Problems</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Practice explaining your actual solution intuition out loud for an interviewer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {calculation.recent_solved_problems.map((prob) => (
              <div
                key={prob.title}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                      {prob.platform}
                    </span>
                    {prob.difficulty && (
                      <span className="text-[10px] text-slate-400">({prob.difficulty})</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {prob.title}
                  </h4>
                </div>

                <button
                  onClick={() => onStartDsaPracticeWithProblem(prob.title)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Explain</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
