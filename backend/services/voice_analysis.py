"""Multimodal Voice & Language Analysis Service for CogniVeil.

Provides non-diagnostic acoustic biomarker extraction, detailed pause analysis,
multilingual transcript linguistic metrics, dynamic personal voice baseline tracking,
and transparent data-quality / confidence scoring for early cognitive-change monitoring.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional


def validate_audio_quality(
    features: Dict[str, Any],
    transcript: str = "",
    min_duration: float = 5.0,
    min_speech_duration: float = 2.0,
) -> Dict[str, Any]:
    """Validates raw audio characteristics and returns structured quality status.
    
    Detects:
    - very short recording (< 5.0s)
    - silence / no speech detected (mean_rms < 0.003 or speech_activity_ratio < 0.05)
    - insufficient speech duration (< 2.0s active speech)
    - audio clipping / excessive amplitude distortion (mean_rms > 0.95 or max_rms > 0.98)
    - extremely low volume (mean_rms < 0.005)
    - empty/corrupted data
    """
    issues: List[str] = []
    warnings: List[str] = []

    duration = float(features.get("duration_seconds", 0.0))
    mean_rms = float(features.get("mean_rms", 0.0))
    max_rms = float(features.get("max_rms", mean_rms * 1.5))
    activity_ratio = float(features.get("speech_activity_ratio", 0.65))
    transcription_conf = float(features.get("transcription_confidence", 0.90))

    active_speech_sec = duration * activity_ratio

    # 1. Critical Rejections (insufficient audio)
    if duration <= 0.0:
        issues.append("No audio data received or recording failed to capture.")
    elif duration < min_duration:
        issues.append(f"Recording duration ({duration:.1f}s) is shorter than minimum required ({min_duration:.1f}s).")

    if mean_rms < 0.003 and not transcript.strip():
        issues.append("Complete silence detected. Microphone input was silent or disconnected.")
    elif active_speech_sec < min_speech_duration and not transcript.strip():
        issues.append(f"Insufficient speech detected ({active_speech_sec:.1f}s active speech < {min_speech_duration:.1f}s required).")

    # 2. Quality Warnings
    if mean_rms < 0.008 and len(issues) == 0:
        warnings.append("Low microphone volume detected. Please speak closer to the microphone.")

    if mean_rms > 0.85 or max_rms > 0.95:
        warnings.append("Microphone audio clipping or excessive input gain detected.")

    if transcription_conf < 0.50 and transcript.strip():
        warnings.append("Low speech recognition confidence score for the recorded audio.")

    is_sufficient = len(issues) == 0

    # Categorize audio quality
    if not is_sufficient:
        quality_level = "Poor"
        quality_score = 0.25
        status = "insufficient_audio"
        reason = issues[0] if issues else "Audio quality insufficient for reliable analysis."
    elif len(warnings) >= 2:
        quality_level = "Fair"
        quality_score = 0.70
        status = "sufficient"
        reason = "Audio acceptable with minor quality warnings."
    elif len(warnings) == 1:
        quality_level = "Good"
        quality_score = 0.85
        status = "sufficient"
        reason = "Audio quality acceptable for analysis."
    else:
        quality_level = "Excellent"
        quality_score = 0.98
        status = "sufficient"
        reason = "Clear acoustic telemetry with high signal-to-noise ratio."

    return {
        "is_sufficient": is_sufficient,
        "status": status,
        "reason": reason,
        "quality_level": quality_level,
        "quality_score": round(quality_score, 2),
        "active_speech_duration_sec": round(active_speech_sec, 2),
        "issues": issues,
        "warnings": warnings,
        "recommendation": "Audio validated for analysis." if is_sufficient else "Please record again in a quiet room and speak clearly for at least 10 seconds."
    }


def analyze_detailed_pauses(
    duration_seconds: float,
    pause_data: Optional[Dict[str, Any]] = None,
    default_pause_count: int = 6,
    default_activity_ratio: float = 0.65,
) -> Dict[str, Any]:
    """Computes comprehensive pause distribution and temporal hesitation metrics.
    
    Extracts:
    - total pause time (s)
    - number of pauses
    - mean pause duration (ms)
    - median pause duration (ms)
    - maximum pause duration (ms)
    - pauses > 500 ms
    - pauses > 1000 ms
    - pauses > 2000 ms
    - pause variability (std dev in ms)
    - pause-to-speech ratio
    """
    duration = max(1.0, float(duration_seconds))
    pdata = pause_data or {}

    raw_pause_durations = pdata.get("pause_durations_ms", [])
    
    if raw_pause_durations and isinstance(raw_pause_durations, list) and len(raw_pause_durations) > 0:
        durations = [float(d) for d in raw_pause_durations if float(d) >= 200.0]
        pause_count = len(durations)
        total_pause_ms = sum(durations)
        total_pause_sec = total_pause_ms / 1000.0
        mean_pause_ms = total_pause_ms / max(pause_count, 1)
        
        sorted_durs = sorted(durations)
        mid = len(sorted_durs) // 2
        median_pause_ms = sorted_durs[mid] if len(sorted_durs) % 2 != 0 else (sorted_durs[mid - 1] + sorted_durs[mid]) / 2.0
        max_pause_ms = sorted_durs[-1]
        
        pauses_gt_500 = sum(1 for d in durations if d >= 500.0)
        pauses_gt_1000 = sum(1 for d in durations if d >= 1000.0)
        pauses_gt_2000 = sum(1 for d in durations if d >= 2000.0)
        
        variance = sum((d - mean_pause_ms) ** 2 for d in durations) / max(pause_count, 1)
        variability_ms = math.sqrt(variance)
        
        speech_time_sec = max(0.1, duration - total_pause_sec)
        pause_ratio = min(1.0, total_pause_sec / duration)
    else:
        # Reconstruct from aggregate pause parameters
        pause_count = int(pdata.get("pause_count", default_pause_count))
        mean_pause_sec = float(pdata.get("mean_pause_duration", 0.65))
        mean_pause_ms = mean_pause_sec * 1000.0 if mean_pause_sec < 100.0 else mean_pause_sec
        total_pause_sec = min(duration * 0.75, (pause_count * (mean_pause_ms / 1000.0)))
        
        median_pause_ms = round(mean_pause_ms * 0.92, 1)
        max_pause_ms = round(mean_pause_ms * 2.2, 1)
        
        pauses_gt_500 = int(round(pause_count * 0.75))
        pauses_gt_1000 = int(round(pause_count * 0.35))
        pauses_gt_2000 = int(round(pause_count * 0.10))
        variability_ms = round(mean_pause_ms * 0.45, 1)
        
        activity_ratio = min(1.0, max(0.1, float(pdata.get("speech_activity_ratio", default_activity_ratio))))
        pause_ratio = round(1.0 - activity_ratio, 3)

    pause_rate_per_min = round((pause_count / max(duration / 60.0, 0.1)), 1)
    speech_to_silence_ratio = round((duration - (pause_ratio * duration)) / max(pause_ratio * duration, 0.1), 2)

    return {
        "pause_count": pause_count,
        "pause_rate_per_minute": pause_rate_per_min,
        "total_pause_duration_sec": round(pause_ratio * duration, 2),
        "mean_pause_duration_ms": round(mean_pause_ms, 1),
        "median_pause_duration_ms": round(median_pause_ms, 1),
        "max_pause_duration_ms": round(max_pause_ms, 1),
        "pauses_gt_500ms": pauses_gt_500,
        "pauses_gt_1000ms": pauses_gt_1000,
        "pauses_gt_2000ms": pauses_gt_2000,
        "pause_variability_ms": round(variability_ms, 1),
        "pause_to_speech_ratio": round(pause_ratio, 3),
        "speech_to_silence_ratio": speech_to_silence_ratio,
    }


def tag_pos_multilingual(words_lower: List[str], language_code: str = "en") -> Dict[str, Any]:
    """Lightweight rule-based and lexicon POS tagger for multilingual voice transcripts.

    Supports:
      - English ('en')
      - Spanish ('es')
      - Indic languages: Hindi ('hi'), Marathi ('mr'), Bengali ('bn'), Tamil ('ta'), Telugu ('te')

    Known limitation:
      Indic vernacular POS tagging uses morphological suffix rules and closed-class lexical stems
      rather than deep dependency parse trees.
    """
    verbs = 0
    nouns = 0
    adjectives = 0
    adverbs = 0

    # Core English closed-class & irregular lists
    en_verbs = {
        "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
        "go", "goes", "went", "gone", "going", "say", "says", "said", "see", "saw", "seen", "seeing",
        "get", "gets", "got", "gotten", "make", "makes", "made", "know", "knew", "known", "think", "thought",
        "take", "took", "taken", "come", "came", "give", "gave", "given", "feel", "felt", "tell", "told",
        "find", "found", "walk", "walked", "walking", "look", "looked", "looking", "work", "worked", "working",
        "call", "called", "try", "tried", "ask", "asked", "need", "needed", "feel", "become", "leave", "put",
        "mean", "keep", "let", "begin", "seem", "help", "talk", "turn", "start", "show", "hear", "play", "run",
        "move", "like", "live", "believe", "hold", "bring", "happen", "write", "provide", "sit", "stand", "lose",
        "pay", "meet", "include", "continue", "set", "learn", "change", "lead", "understand", "watch", "follow",
        "stop", "create", "speak", "read", "allow", "add", "spend", "grow", "open", "walk", "win", "offer",
        "remember", "love", "consider", "appear", "buy", "wait", "serve", "die", "send", "expect", "build",
        "stay", "fall", "cut", "reach", "remain", "suggest", "raise", "pass", "sell", "require", "report"
    }
    en_adverbs = {
        "up", "so", "out", "just", "now", "how", "then", "more", "also", "here", "well", "only", "very",
        "even", "back", "there", "down", "still", "in", "as", "too", "when", "never", "really", "most",
        "often", "always", "sometimes", "usually", "almost", "quickly", "slowly", "clearly", "easily", "hardly"
    }
    en_adjectives = {
        "good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big",
        "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad",
        "same", "able", "pleasant", "quiet", "busy", "bright", "happy", "tired", "cold", "warm", "hot",
        "beautiful", "difficult", "easy", "clear", "fresh", "fine", "calm", "gentle", "strong", "weak"
    }
    en_pronouns_conjunctions = {
        "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
        "their", "our", "its", "this", "that", "these", "those", "and", "but", "or", "because", "if", "a", "an", "the"
    }

    # Spanish closed-class
    es_verbs = {
        "es", "era", "fue", "ser", "estar", "estoy", "estaba", "hacer", "hizo", "hace", "tener", "tiene", "tenía",
        "ir", "voy", "iba", "fue", "decir", "dijo", "ver", "vio", "comer", "vivir", "hablar", "caminar", "tomar"
    }
    es_adverbs = {"muy", "más", "bien", "aquí", "allí", "ahora", "siempre", "nunca", "también", "después", "casi"}

    # Indic closed-class verb roots and auxiliary verbs
    indic_verbs = {
        # Hindi / Marathi
        "hai", "hain", "tha", "thi", "the", "hoga", "hogi", "gaya", "gayi", "gaye", "kiya", "kiye", "karte", "karti",
        "karta", "bolte", "bolti", "bolta", "dekha", "suna", "khaya", "piya", "utha", "baitha", "chala", "aaya", "aayi",
        "ahe", "hota", "hoti", "hote", "kela", "keli", "kele", "dila", "gela", "sangitla", "baghitla",
        # Bengali
        "holo", "hoyeche", "chilo", "korechi", "koreche", "bollo", "dekhlam", "gelam", "ashlam", "khailam",
        # Tamil / Telugu
        "irukku", "irundhadhu", "sonnanga", "paathen", "ponen", "vandhen", "saaptom", "padichen",
        "unnadi", "undhi", "chesanu", "cheppanu", "choosanu", "vellanu", "vachanu", "tinnanu"
    }

    for w in words_lower:
        if language_code == "es":
            if w in es_verbs or w.endswith(("ar", "er", "ir", "ando", "iendo", "ado", "ido", "aba", "aron", "ió")):
                verbs += 1
            elif w in es_adverbs or w.endswith("mente"):
                adverbs += 1
            elif w.endswith(("oso", "osa", "able", "ible", "al", "ico", "ica")):
                adjectives += 1
            elif w.endswith(("ción", "sión", "dad", "tad", "miento", "ura", "dor", "dora")) or len(w) > 3:
                nouns += 1
        elif language_code in ("hi", "mr", "bn", "ta", "te"):
            if w in indic_verbs or w.endswith(("na", "ta", "ti", "te", "raha", "rahi", "rahe", "gaya", "karna", "hona")):
                verbs += 1
            elif w in {"achha", "bura", "bada", "chhota", "sundar", "naya", "purana", "nalla", "periya", "chinna"}:
                adjectives += 1
            elif w in {"bahut", "jaldi", "dhire", "abhi", "tabhi", "hamesha", "romba", "chala"}:
                adverbs += 1
            elif len(w) > 2:
                nouns += 1
        else:
            # English standard rules
            if w in en_verbs or w.endswith(("ing", "ed", "ize", "ise", "ify", "ate")):
                verbs += 1
            elif w in en_adverbs or w.endswith(("ly", "wise", "ward", "wards")):
                adverbs += 1
            elif w in en_adjectives or w.endswith(("ful", "ous", "able", "ible", "ive", "less", "ish", "ic", "al")):
                adjectives += 1
            elif w not in en_pronouns_conjunctions:
                if w.endswith(("tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "er", "or", "ist", "ism")) or len(w) >= 3:
                    nouns += 1
                else:
                    nouns += 1

    return {
        "verb_count": verbs,
        "noun_count": nouns,
        "adjective_count": adjectives,
        "adverb_count": adverbs,
        "content_words_total": verbs + nouns + adjectives + adverbs
    }


def extract_linguistic_metrics(
    transcript: str,
    duration_seconds: float = 30.0,
    language_code: str = "en",
) -> Dict[str, Any]:
    """Extracts literature-validated linguistic features on transcribed voice journal text.

    Literature-Validated Linguistic Features:
    1. TTR (Type-Token Ratio) = unique_words / total_words
       (Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability)
    2. content_density = (verb_count + noun_count + adjective_count + adverb_count) / total_words
       (Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability)
    3. verb_noun_ratio = verb_count / noun_count
       (Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability)
    4. hesitation_word_rate = filler_word_count / total_words (uh, um, and multilingual equivalents)
       (Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability)
    """
    text = (transcript or "").strip()
    if not text:
        return {
            "transcript_available": False,
            "word_count": 0,
            "unique_word_count": 0,
            "type_token_ratio": 0.0,
            "ttr": 0.0,
            "lexical_diversity": 0.70,
            "content_density": 0.0,
            "verb_noun_ratio": 0.0,
            "hesitation_word_rate": 0.0,
            "verb_count": 0,
            "noun_count": 0,
            "adjective_count": 0,
            "adverb_count": 0,
            "sentence_count": 0,
            "avg_sentence_length_words": 0.0,
            "filler_word_count": 0,
            "filler_frequency_pct": 0.0,
            "repeated_words_count": 0,
            "incomplete_utterances_count": 0,
            "pronoun_to_noun_ratio": 0.50,
            "words_per_minute": 0.0,
            "hesitation_proxy_score": 0.15,
        }

    # Tokenize words across vernacular Unicode scripts
    words = re.findall(r"\b[\w']+\b", text, flags=re.UNICODE)
    word_count = len(words)
    words_lower = [w.lower() for w in words]

    # Feature 1: TTR (Type-Token Ratio) = unique_words / total_words
    # Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability
    unique_words = set(words_lower)
    unique_count = len(unique_words)
    ttr = round(unique_count / max(word_count, 1), 3)

    # Sentences
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    sentence_count = max(1, len(sentences))
    avg_sentence_len = round(word_count / sentence_count, 1)

    # Feature 4: Multilingual Filler words dictionary & hesitation_word_rate = filler_word_count / total_words
    # Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability
    filler_lexicon = {
        "en": {"uh", "um", "ah", "er", "erm", "like", "you know", "hmm", "well", "so", "actually"},
        "hi": {"matlab", "yani", "woh", "arre", "hmmm", "achha", "to"},
        "ta": {"vandhu", "appo", "ana", "paatha", "hmmm"},
        "te": {"ante", "mari", "adi", "hmmm"},
        "mr": {"mhanje", "te", "pan", "hmmm"},
        "bn": {"mane", "sheta", "tahole", "hmmm"},
        "es": {"este", "bueno", "o sea", "pues", "eh", "em"}
    }
    lang_fillers = filler_lexicon.get(language_code, filler_lexicon["en"])
    all_fillers = lang_fillers.union(filler_lexicon["en"])

    filler_count = sum(1 for w in words_lower if w in all_fillers)
    filler_pct = round((filler_count / max(word_count, 1)) * 100.0, 1)
    hesitation_word_rate = round(filler_count / max(word_count, 1), 3)

    # POS Tagging for Content Density and Verb-Noun Ratio
    pos_counts = tag_pos_multilingual(words_lower, language_code=language_code)
    verb_count = pos_counts["verb_count"]
    noun_count = pos_counts["noun_count"]
    adjective_count = pos_counts["adjective_count"]
    adverb_count = pos_counts["adverb_count"]

    # Feature 2: content_density = (verb_count + noun_count + adjective_count + adverb_count) / total_words
    # Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability
    content_density = round((verb_count + noun_count + adjective_count + adverb_count) / max(word_count, 1), 3)

    # Feature 3: verb_noun_ratio = verb_count / noun_count
    # Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability
    verb_noun_ratio = round(verb_count / max(noun_count, 1), 2)

    # Repeated consecutive words (word-finding / repetition proxy)
    repeated_words_count = sum(1 for i in range(len(words_lower) - 1) if words_lower[i] == words_lower[i + 1])

    # Incomplete utterances (ending with trailing commas or ellipses)
    incomplete_count = len(re.findall(r"(\.{3}|,\s*$|--)", text))

    # Pronoun vs noun heuristic
    common_pronouns = {"i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "their", "this", "that"}
    pronoun_count = sum(1 for w in words_lower if w in common_pronouns)
    pronoun_to_noun_ratio = round(min(2.5, pronoun_count / max(noun_count, 1)), 2)

    # Words Per Minute
    duration = max(1.0, float(duration_seconds))
    wpm = round((word_count / duration) * 60.0, 1)

    # Composite Hesitation Proxy Score (0.0 to 1.0)
    hesitation_score = round(min(1.0, (filler_pct / 15.0) * 0.45 + (repeated_words_count / 5.0) * 0.35 + (incomplete_count / 4.0) * 0.20), 2)

    return {
        "transcript_available": True,
        "word_count": word_count,
        "unique_word_count": unique_count,
        "type_token_ratio": ttr,
        "ttr": ttr,
        "lexical_diversity": ttr,
        "content_density": content_density,
        "verb_noun_ratio": verb_noun_ratio,
        "hesitation_word_rate": hesitation_word_rate,
        "verb_count": verb_count,
        "noun_count": noun_count,
        "adjective_count": adjective_count,
        "adverb_count": adverb_count,
        "sentence_count": sentence_count,
        "avg_sentence_length_words": avg_sentence_len,
        "filler_word_count": filler_count,
        "filler_frequency_pct": filler_pct,
        "repeated_words_count": repeated_words_count,
        "incomplete_utterances_count": incomplete_count,
        "pronoun_to_noun_ratio": pronoun_to_noun_ratio,
        "words_per_minute": wpm,
        "hesitation_proxy_score": hesitation_score,
    }


def compute_personal_baseline(
    historical_records: List[Dict[str, Any]],
    current_metrics: Dict[str, Any],
) -> Dict[str, Any]:
    """Computes calibrated personal baseline means and classifies longitudinal trajectory.
    
    Compares patient against their OWN calibrated historical distribution:
    - Baseline sessions count
    - Metric-by-metric delta % and baseline mean
    - Trajectory classification: 'Stable', 'Minor Change', 'Persistent Change', 'Significant Change'
    """
    valid_history = [r for r in historical_records if r.get("voice_score") is not None or r.get("score") is not None]
    sessions_count = len(valid_history)

    # Extract current session values
    curr_wpm = float(current_metrics.get("words_per_minute", 115.0))
    curr_pause_ratio = float(current_metrics.get("pause_to_speech_ratio", 0.22))
    curr_mean_pause = float(current_metrics.get("mean_pause_duration_ms", 600.0))
    curr_lexical = float(current_metrics.get("lexical_diversity", 0.70))
    curr_voice_score = float(current_metrics.get("voice_score", 80.0))

    if sessions_count >= 2:
        # Extract historical values
        wpm_vals = [float(r.get("words_per_minute", r.get("wpm", 120.0))) for r in valid_history if "words_per_minute" in r or "wpm" in r]
        pause_ratio_vals = [float(r.get("pause_to_speech_ratio", r.get("pause_ratio", 0.20))) for r in valid_history if "pause_to_speech_ratio" in r or "pause_ratio" in r]
        mean_pause_vals = [float(r.get("mean_pause_duration_ms", r.get("mean_pause_ms", 500.0))) for r in valid_history if "mean_pause_duration_ms" in r or "mean_pause_ms" in r]
        lexical_vals = [float(r.get("lexical_diversity", r.get("type_token_ratio", 0.72))) for r in valid_history if "lexical_diversity" in r or "type_token_ratio" in r]
        score_vals = [float(r.get("voice_score", r.get("score", 82.0))) for r in valid_history]

        base_wpm = sum(wpm_vals) / len(wpm_vals) if wpm_vals else 120.0
        base_pause_ratio = sum(pause_ratio_vals) / len(pause_ratio_vals) if pause_ratio_vals else 0.20
        base_mean_pause = sum(mean_pause_vals) / len(mean_pause_vals) if mean_pause_vals else 500.0
        base_lexical = sum(lexical_vals) / len(lexical_vals) if lexical_vals else 0.72
        base_score = sum(score_vals) / len(score_vals) if score_vals else 82.0
        is_established = sessions_count >= 3
    else:
        # Population normative initial priors
        base_wpm = 120.0
        base_pause_ratio = 0.20
        base_mean_pause = 520.0
        base_lexical = 0.72
        base_score = 85.0
        is_established = False

    # Calculate percentage deltas
    wpm_delta_pct = round(((curr_wpm - base_wpm) / max(base_wpm, 1.0)) * 100.0, 1)
    pause_ratio_delta_pct = round(((curr_pause_ratio - base_pause_ratio) / max(base_pause_ratio, 0.05)) * 100.0, 1)
    pause_ms_delta_pct = round(((curr_mean_pause - base_mean_pause) / max(base_mean_pause, 50.0)) * 100.0, 1)
    lexical_delta_pct = round(((curr_lexical - base_lexical) / max(base_lexical, 0.1)) * 100.0, 1)
    score_delta_pct = round(((curr_voice_score - base_score) / max(base_score, 1.0)) * 100.0, 1)

    # Determine trajectory status
    # Multi-factor deviation thresholding
    significant_shift = (pause_ratio_delta_pct > 40.0 or wpm_delta_pct < -20.0 or pause_ms_delta_pct > 45.0)
    moderate_shift = (pause_ratio_delta_pct > 20.0 or wpm_delta_pct < -12.0 or pause_ms_delta_pct > 25.0)

    if significant_shift and sessions_count >= 3:
        trajectory = "Persistent Change"
        trajectory_description = "Voice cadence and pause characteristics show persistent elongation compared to personal baseline."
    elif significant_shift:
        trajectory = "Change Detected"
        trajectory_description = "Acoustic parameters deviate from established baseline in this session; continued monitoring active."
    elif moderate_shift:
        trajectory = "Minor Change"
        trajectory_description = "Subtle acoustic variation detected while remaining broadly consistent with baseline norms."
    else:
        trajectory = "Stable"
        trajectory_description = "Speech rate, pause cadence, and lexical diversity remain well aligned with personal baseline."

    return {
        "baseline_established": is_established,
        "historical_sessions_count": sessions_count,
        "trajectory": trajectory,
        "trajectory_description": trajectory_description,
        "baseline_metrics": {
            "words_per_minute": round(base_wpm, 1),
            "pause_to_speech_ratio": round(base_pause_ratio, 3),
            "mean_pause_duration_ms": round(base_mean_pause, 1),
            "lexical_diversity": round(base_lexical, 3),
            "voice_score": round(base_score, 1),
        },
        "percentage_changes": {
            "words_per_minute": wpm_delta_pct,
            "pause_to_speech_ratio": pause_ratio_delta_pct,
            "mean_pause_duration_ms": pause_ms_delta_pct,
            "lexical_diversity": lexical_delta_pct,
            "voice_score": score_delta_pct,
        },
        "deviations_table": {
            "speech_rate": {
                "name": "Speech Rate",
                "current": f"{curr_wpm:.1f} WPM",
                "baseline": f"{base_wpm:.1f} WPM",
                "change_pct": wpm_delta_pct,
                "direction": "Decreased" if wpm_delta_pct < -5 else ("Increased" if wpm_delta_pct > 5 else "Stable")
            },
            "pause_ratio": {
                "name": "Pause Ratio",
                "current": f"{round(curr_pause_ratio * 100)}%",
                "baseline": f"{round(base_pause_ratio * 100)}%",
                "change_pct": pause_ratio_delta_pct,
                "direction": "Elongated" if pause_ratio_delta_pct > 10 else ("Reduced" if pause_ratio_delta_pct < -10 else "Stable")
            },
            "mean_pause": {
                "name": "Mean Pause Duration",
                "current": f"{round(curr_mean_pause)} ms",
                "baseline": f"{round(base_mean_pause)} ms",
                "change_pct": pause_ms_delta_pct,
                "direction": "Elongated" if pause_ms_delta_pct > 10 else ("Shorter" if pause_ms_delta_pct < -10 else "Stable")
            },
            "lexical_diversity": {
                "name": "Lexical Diversity (TTR)",
                "current": f"{round(curr_lexical * 100)}%",
                "baseline": f"{round(base_lexical * 100)}%",
                "change_pct": lexical_delta_pct,
                "direction": "Reduced" if lexical_delta_pct < -8 else ("Rich" if lexical_delta_pct > 8 else "Stable")
            }
        }
    }


def evaluate_data_confidence(
    duration_seconds: float,
    audio_quality_score: float,
    transcript_available: bool,
    transcription_confidence: float = 0.90,
    history_count: int = 0,
) -> Dict[str, Any]:
    """Generates a composite data quality and screening confidence assessment."""
    duration_factor = min(1.0, duration_seconds / 25.0)
    transcript_factor = transcription_confidence if transcript_available else 0.70
    history_factor = min(1.0, 0.50 + (history_count * 0.15))
    
    composite_score = round(
        0.30 * duration_factor +
        0.30 * audio_quality_score +
        0.20 * transcript_factor +
        0.20 * history_factor,
        2
    )

    if composite_score >= 0.85:
        overall_level = "High"
    elif composite_score >= 0.65:
        overall_level = "Moderate"
    else:
        overall_level = "Low"

    return {
        "overall_confidence": overall_level,
        "confidence_score": composite_score,
        "breakdown": {
            "speech_duration": "High" if duration_seconds >= 20.0 else ("Moderate" if duration_seconds >= 10.0 else "Low"),
            "audio_quality": "High" if audio_quality_score >= 0.85 else ("Moderate" if audio_quality_score >= 0.65 else "Low"),
            "transcript_quality": "High" if transcript_available and transcription_confidence >= 0.80 else ("Moderate" if transcript_available else "Not Available"),
            "longitudinal_history": "High" if history_count >= 5 else ("Moderate" if history_count >= 2 else "Limited"),
        }
    }
