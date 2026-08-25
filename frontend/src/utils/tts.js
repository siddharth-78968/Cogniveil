/**
 * CogniVeil Multilingual Text-to-Speech (TTS) Voice Guidance Engine
 * Provides calm, paced voice instructions in 7 vernacular languages
 * for elderly patient accessibility.
 */

export const SUPPORTED_TTS_LANGUAGES = [
  { code: 'en', name: 'English', locale: 'en-US' },
  { code: 'hi', name: 'हिंदी (Hindi)', locale: 'hi-IN' },
  { code: 'ta', name: 'தமிழ் (Tamil)', locale: 'ta-IN' },
  { code: 'te', name: 'తెలుగు (Telugu)', locale: 'te-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', locale: 'mr-IN' },
  { code: 'bn', name: 'বাংলা (Bengali)', locale: 'bn-IN' },
  { code: 'es', name: 'Español (Spanish)', locale: 'es-ES' },
];

export const TTS_INSTRUCTION_SCRIPTS = {
  active_tests_intro: {
    en: 'Welcome to today’s daily cognitive screening. Please find a quiet place. We will complete 5 short exercises.',
    hi: 'आज के दैनिक संज्ञानात्मक परीक्षण में आपका स्वागत है। कृपया शांत स्थान पर बैठें। हम पाँच छोटे अभ्यास करेंगे।',
    ta: 'இன்றைய தினசரி அறிவாற்றல் பரிசோதனைக்கு வரவேற்கிறோம். அமைதியான இடத்தில் அமரவும். நாம் ஐந்து குறுகிய பயிற்சிகளை செய்வோம்.',
    te: 'నేటి రోజువారీ జ్ఞాన పరీక్షకు స్వాగతం. దయచేసి ప్రశాంతమైన ప్రదేశంలో కూర్చోండి. మనం 5 చిన్న పరీక్షలు చేస్తాము.',
    mr: 'आजच्या दैनंदिन चाचणीत आपले स्वागत आहे. कृपया शांत ठिकाणी बसा. आपण ५ छोटे सराव करणार आहोत.',
    bn: 'আজকের দৈনিক জ্ঞানমূলক পরীক্ষায় স্বাগতম। অনুগ্রহ করে একটি শান্ত স্থানে বসুন। আমরা ৫টি ছোট পরীক্ষা করব।',
    es: 'Bienvenido a su evaluación cognitiva diaria. Por favor busque un lugar tranquilo. Realizaremos 5 ejercicios breves.',
  },
  voice_journal_intro: {
    en: 'Please speak naturally about your day for 30 to 60 seconds. Our AI will analyze voice clarity, rhythm, and pauses.',
    hi: 'कृपया अपने दिन के बारे में 30 से 60 सेकंड तक स्वाभाविक रूप से बात करें। हमारा एआई आपकी आवाज की गति और ठहराव का विश्लेषण करेगा।',
    ta: 'தயவுசெய்து உங்கள் நாளைப் பற்றி 30 முதல் 60 வினாடிகள் இயல்பாகப் பேசுங்கள். எங்கள் AI உங்கள் பேச்சின் இடைவெளிகளை பகுப்பாய்வு செய்யும்.',
    te: 'దయచేసి మీ రోజు గురించి 30 నుండి 60 సెకన్ల పాటు సహజంగా మాట్లాడండి. మా AI మీ వాయిస్ రిథమ్ మరియు విరామాలను విశ్లేషిస్తుంది.',
    mr: 'कृपया आपल्या दिवसाबद्दल ३० ते ६० सेकंद नैसर्गिकपणे बोला. आमचे एआय आपल्या आवाजातील लय आणि विरामांचे विश्लेषण करेल.',
    bn: 'অনুগ্রহ করে আপনার দিন সম্পর্কে ৩০ থেকে ৬০ সেকেন্ড স্বাভাবিকভাবে কথা বলুন। আমাদের এআই কণ্ঠের ছন্দ বিশ্লেষণ করবে।',
    es: 'Por favor hable con naturalidad sobre su día durante 30 a 60 segundos. Nuestra IA analizará el ritmo de su voz.',
  },
  level2_intro: {
    en: 'This is the Level 2 Deep Clinical Assessment. Please answer questions about your health, lifestyle, and medical history.',
    hi: 'यह स्तर 2 गहन नैदानिक मूल्यांकन है। कृपया अपने स्वास्थ्य, जीवनशैली और चिकित्सा इतिहास के प्रश्नों का उत्तर दें।',
    ta: 'இது நிலை 2 ஆழமான மருத்துவ மதிப்பீடு. உங்கள் உடல்நலம் மற்றும் மருத்துவ வரலாறு பற்றிய கேள்விகளுக்கு பதிலளிக்கவும்.',
    te: 'ఇది లెవల్ 2 డీప్ క్లినికల్ అసెస్‌మెంట్. దయచేసి మీ ఆరోగ్యం మరియు జీవనశైలి గురించిన ప్రశ్నలకు సమాధానం ఇవ్వండి.',
    mr: 'हे लेव्हल २ सखोल मूल्यांकन आहे. कृपया आपले आरोग्य आणि जीवनशैलीबद्दलच्या प्रश्नांची उत्तरे द्या.',
    bn: 'এটি লেভেল ২ গভীর ক্লিনিকাল মূল্যায়ন। অনুগ্রহ করে আপনার স্বাস্থ্য ও জীবনধারা সম্পর্কিত প্রশ্নের উত্তর দিন।',
    es: 'Esta es la evaluación clínica profunda de Nivel 2. Por favor responda sobre su salud y estilo de vida.',
  }
};

let currentUtterance = null;

export const speakInstruction = (textOrKey, langCode = 'en', onStart = null, onEnd = null) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported in this browser.');
    return;
  }

  // Stop any ongoing speech
  stopInstruction();

  let textToSpeak = textOrKey;
  if (TTS_INSTRUCTION_SCRIPTS[textOrKey]) {
    textToSpeak = TTS_INSTRUCTION_SCRIPTS[textOrKey][langCode] || TTS_INSTRUCTION_SCRIPTS[textOrKey]['en'];
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  currentUtterance = utterance;

  // Locate best matching voice for the target language
  const voices = window.speechSynthesis.getVoices();
  const langConfig = SUPPORTED_TTS_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_TTS_LANGUAGES[0];

  const matchedVoice = voices.find((v) => v.lang === langConfig.locale || v.lang.startsWith(langConfig.code));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  utterance.lang = langConfig.locale;
  utterance.rate = 0.88; // Calm, paced rate for elderly accessibility
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopInstruction = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const isSpeaking = () => {
  return 'speechSynthesis' in window && (window.speechSynthesis.speaking || Boolean(currentUtterance));
};
