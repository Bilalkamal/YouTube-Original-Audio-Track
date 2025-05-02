let hasProcessedAudio = false;

const originalTranslations = {
  en: "original",
  es: "original",
  fr: "originale",
  de: "original",
  it: "originale",
  pt: "original",
  ru: "оригинал",
  ja: "オリジナル",
  ko: "원본",
  zh: "原始",
  ar: {
    audioTrack: "المقطع الصوتي",
    original: "أصلي",
  },
  hi: "मूल",
  bn: "মূল",
  id: "asli",
  tr: "orijinal",
  vi: "nguyên bản",
  th: "ต้นฉบับ",
  nl: "origineel",
  pl: "oryginalny",
  sv: "original",
  fi: "alkuperäinen",
  no: "original",
  da: "original",
  cs: "originál",
  el: "πρωτότυπο",
  he: "מקורי",
  ro: "original",
  hu: "eredeti",
  uk: "оригінал",
  fa: "اصلی",
  ms: "asal",
  tl: "orihinal",
  ta: "அசல்",
  ur: "اصل",
  hr: "izvorni",
  bg: "оригинален",
  sk: "originál",
  sl: "izvirnik",
  sr: "оригинал",
  lt: "originalus",
  lv: "oriģināls",
  et: "originaal",
  ka: "ორიგინალი",
  az: "orijinal",
  uz: "asl",
  kk: "түпнұсқа",
  hy: "բնօրինակ",
  km: "ដើម",
  my: "မူရ်း",
  si: "මුල්",
  am: "የመጀመሪያው",
  ne: "मौलिक",
  lo: "ຕົ້ນສະບັບ",
  mn: "эх",
  bo: "དངོས་གཞི།",
  cy: "gwreiddiol",
  eo: "originala",
  eu: "jatorrizko",
  gl: "orixinal",
  gu: "મૂળ",
  ha: "asali",
  ig: "izugbe",
  is: "upprunalegt",
  jv: "asli",
  kn: "ಮೂಲ",
  ku: "orîjînal",
  ky: "түп нуска",
  lb: "original",
  mi: "taketake",
  ml: "യഥാർത്ഥ",
  mr: "मूळ",
  mt: "oriġinali",
  or: "ମୌଳିକ",
  pa: "ਅਸਲ",
  ps: "اصلي",
  sd: "اصل",
  sm: "muamua",
  sn: "chaicho",
  so: "asalka ah",
  sq: "origjinal",
  su: "asli",
  sw: "asili",
  te: "అసలు",
  tk: "asyl",
  tt: "оригиналь",
  ug: "ئەسلى",
  yi: "אריגינעל",
  yo: "atilẹba",
  zu: "okwangempela",
  af: "oorspronklik",
  bs: "originalni",
  ca: "original",
  ceb: "orihinal",
  co: "uriginale",
  fy: "oarspronklik",
  ga: "bunaidh",
  gd: "tùsail",
  haw: "kumu",
  hmn: "thawj",
  ht: "orijinal",
  ia: "original",
  ie: "original",
  io: "originala",
  kw: "gwredhek",
  la: "originalis",
  ln: "ya liboso",
  mg: "tany am-boalohany",
  mk: "оригинален",
  ny: "yoyamba",
  oc: "original",
  qu: "qallariy",
  rm: "original",
  rw: "cy'umwimerere",
  sa: "मूल",
  sc: "originale",
  st: "ea pele",
  tg: "аслӣ",
  to: "ʻuluaki",
  wo: "njëkk",
  xh: "yokuqala",
  "zh-tw": "原始",
};

let isExtensionEnabled = true;

// Function to check if the extension is enabled
function checkExtensionStatus(callback) {
  chrome.storage.sync.get("enabled", function (data) {
    isExtensionEnabled = data.enabled !== false;
    if (callback) callback(isExtensionEnabled);
  });
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleExtension") {
    isExtensionEnabled = request.enabled;
    if (!isExtensionEnabled) {
      // If disabled, remove any existing observers
      if (window.youtubeOriginalAudioObserver) {
        window.youtubeOriginalAudioObserver.disconnect();
      }
    } else {
      // If enabled, start observing again
      startObserving();
    }
  }
  if (request.action === "debugAudioTracks") {
    const settingsButton = document.querySelector(".ytp-settings-button");
    if (settingsButton) {
      settingsButton.click();
      setTimeout(() => {
        const menuItems = document.querySelectorAll(
          ".ytp-panel-menu .ytp-menuitem"
        );
        const audioTrackItem = findAudioTrackMenuItem(menuItems);
        if (audioTrackItem) {
          audioTrackItem.click();
          setTimeout(() => {
            const audioOptions = document.querySelectorAll(
              '.ytp-menuitem, .ytp-panel-menu .ytp-menuitem, [role="menuitem"]'
            );
            const options = Array.from(audioOptions).map((o) => o.textContent);
            sendResponse({ options });
            closeMenu();
          }, 50);
        }
      }, 50);
    }
    return true; // Keep the message channel open for the async response
  }
});

function findAudioTrackMenuItem(menuItems) {
  if (!menuItems?.length) return null;

  // Common audio track related terms in different languages
  const audioTrackTexts = {
    // Existing Languages
    ar: "المقطع الصوتي",
    ar1: "المقطع",
    ar2: "صوتي",
    en: "Audio track",
    es: "Pista de audio",
    es1: "pista",
    es2: "audio",
    fr: "Piste audio",
    fr1: "piste",
    fr2: "audio",
    de: "Tonspur",
    it: "Traccia audio",
    it1: "traccia",
    it2: "audio",
    pt: "Faixa de áudio",
    pt1: "faixa",
    pt2: "áudio",
    ru: "Аудиодорожка",
    ru1: "дорожка",
    ja: "音声トラック",
    ja1: "音声",
    ja2: "トラック",
    ko: "오디오 트랙",
    ko1: "오디오",
    ko2: "트랙",
    zh: "音轨",
    hi: "ऑडियो ट्रैक",
    hi1: "ऑडियो",
    hi2: "ट्रैक",
    tr: "Ses izi",
    vi: "Âm thanh",
    vi1: "âm",
    vi2: "thanh",
    th: "แทร็กเสียง",
    th1: "แทร็ก",
    th2: "เสียง",
    nl: "Audiospoor",
    nl1: "audio",
    nl2: "spoor",
    pl: "Ścieżka audio",
    pl1: "ścieżka",
    pl2: "audio",
    general: "audio",
    sound: "sound",
    track: "track",
    langue: "langue",
    sprache: "sprache",
    idioma: "idioma",

    // Previously Added Languages

    // Bengali
    bn: "অডিও ট্র্যাক",
    bn1: "অডিও",
    bn2: "ট্র্যাক",

    // Urdu
    ur: "آڈیو ٹریک",
    ur1: "آڈیو",
    ur2: "ٹریک",

    // Indonesian
    id: "Track audio",
    id1: "Track",
    id2: "audio",

    // Punjabi
    pa: "ਆਡੀਓ ਟ੍ਰੈਕ",
    pa1: "ਆਡੀਓ",
    pa2: "ਟ੍ਰੈਕ",

    // Tamil
    ta: "ஆடியோ டிரா��்",
    ta1: "ஆடியோ",
    ta2: "டிராக்",

    // Telugu
    te: "ఆడియో ట్రాక్",
    te1: "ఆడియో",
    te2: "ట్రాక్",

    // Gujarati
    gu: "ઓડિયો ટ્રેક",
    gu1: "ઓડિયો",
    gu2: "ટ્રેક",

    // Persian
    fa: "ردیاب صوتی",
    fa1: "ردیاب",
    fa2: "صوتی",

    // Swahili
    sw: "Njia ya sauti",
    sw1: "njia",
    sw2: "sauti",

    // Greek
    el: "Ηχητικό κομμάτι",
    el1: "Ηχητικό",
    el2: "κομμάτι",

    // Czech
    cs: "Zvuková stopa",
    cs1: "Zvuková",
    cs2: "stopa",

    // Romanian
    ro: "Pistă audio",
    ro1: "pistă",
    ro2: "audio",

    // Hungarian
    hu: "Audió sáv",
    hu1: "Audió",
    hu2: "sáv",

    // Malay
    ms: "Landasan audio",
    ms1: "Landasan",
    ms2: "audio",

    // Added Languages

    // Ukrainian
    uk: "Аудіодоріжка",
    uk1: "аудіо",
    uk2: "доріжка",

    // Kannada
    kn: "ಆಡಿಯೋ ಟ್ರ್ಯಾಕ್",
    kn1: "ಆಡಿಯೋ",
    kn2: "ಟ್ರ್ಯಾಕ್",

    // Malayalam
    ml: "ഓഡിയോ ട്രാക്ക്",
    ml1: "ഓഡിയോ",
    ml2: "ട്രാക്ക്",

    // Marathi
    mr: "ऑडिओ ट्रॅक",
    mr1: "ऑडिओ",
    mr2: "ट्रॅक",

    // Sindhi
    sd: "آڊيو ٽريڪ",
    sd1: "آڊيو",
    sd2: "ٽريڪ",

    // Nepali
    ne: "अडियो ट्र्याक",
    ne1: "अडियो",
    ne2: "ट्र्याक",

    // Sinhala
    si: "ශ්‍රව්‍ය මාර්ගය",
    si1: "ශ්‍රව්‍ය",
    si2: "මාර්ගය",

    // Afrikaans
    af: "Audio spoor",
    af1: "audio",
    af2: "spoor",

    // Basque
    eu: "Audio bidea",
    eu1: "audio",
    eu2: "bidea",

    // Catalan
    ca: "Pista d'àudio",
    ca1: "pista",
    ca2: "àudio",

    // Slovak
    sk: "Zvuková stopa",
    sk1: "Zvuková",
    sk2: "stopa",

    // Bulgarian
    bg: "Аудио писта",
    bg1: "аудио",
    bg2: "писта",

    // Serbian
    sr: "Аудио трака",
    sr1: "аудио",
    sr2: "трака",

    // Croatian
    hr: "Audio traka",
    hr1: "audio",
    hr2: "traka",

    // Bosnian
    bs: "Audio traka",
    bs1: "audio",
    bs2: "traka",

    // Slovenian
    sl: "Avdio skladba",
    sl1: "avdio",
    sl2: "skladba",

    // Latvian
    lv: "Audio ceļš",
    lv1: "audio",
    lv2: "ceļš",

    // Lithuanian
    lt: "Garso takelis",
    lt1: "garso",
    lt2: "takelis",

    // Estonian
    et: "Heliraja",
    et1: "heli",
    et2: "rida",

    // Finnish
    fi: "Ääniraita",
    fi1: "ääni",
    fi2: "raita",

    // Swedish
    sv: "Ljudspår",
    sv1: "ljud",
    sv2: "spår",

    // Norwegian
    no: "Lydspor",
    no1: "lyd",
    no2: "spor",

    // Danish
    da: "Lydspor",
    da1: "lyd",
    da2: "spor",

    // Icelandic
    is: "Hljóðrás",
    is1: "hljóð",
    is2: "rás",

    // Filipino
    tl: "Audio track",
    tl1: "audio",
    tl2: "track",

    // Uzbek
    uz: "Audio trek",
    uz1: "audio",
    uz2: "trek",

    // Kazakh
    kk: "Дыбыс жолы",
    kk1: "дыбыс",
    kk2: "жолы",

    // Azerbaijani
    az: "Audio izi",
    az1: "audio",
    az2: "izi",

    // Georgian
    ka: "აუდიო ტრექი",
    ka1: "აუდიო",
    ka2: "ტრექი",
  };

  for (const item of menuItems) {
    const text = item?.textContent?.trim();
    console.log("Checking menu item:", text);

    // Check if the text contains any of our target phrases
    const found = Object.values(audioTrackTexts).some(
      (audioText) =>
        text && text.toLowerCase().indexOf(audioText.toLowerCase()) !== -1
    );

    if (found) {
      console.log("Found audio track menu item:", text);
      return item;
    }
  }

  // Fallback: look for common patterns
  const commonPatterns = [
    /audio/i,
    /sound/i,
    /track/i,
    /langue/i, // French
    /sprache/i, // German
    /idioma/i, // Spanish/Portuguese
    /语言/, // Chinese
    /言語/, // Japanese
    /음성/, // Korean
    /صوت/, // Arabic
    /звук/i, // Russian
  ];

  for (const item of menuItems) {
    const text = item?.textContent?.trim();
    if (commonPatterns.some((pattern) => pattern.test(text))) {
      console.log("Found audio track menu item (pattern match):", text);
      return item;
    }
  }

  return null;
}

function findOriginalAudioOption(options) {
  if (!options?.length) return null;

  // First, try to find explicitly marked original tracks
  const originalTexts = Object.values(originalTranslations).map((value) =>
    typeof value === "object" ? value.original : value
  );

  const additionalVariations = [
    "original",
    "original sound",
    "original audio",
    "source",
    "default",
    "(Original)", // Add explicit markers
    "English (Original)", // Common YouTube format
    "English (United States) (Original)",
  ];

  const allTexts = [...new Set([...originalTexts, ...additionalVariations])];

  // First pass: Look for explicit "original" marking
  for (const option of options) {
    const text = option?.textContent
      ?.replace(/\s+/g, " ")
      ?.trim()
      ?.toLowerCase();

    console.log("Checking audio option:", text);

    // Check for explicit original markers
    if (text?.includes("(original)")) {
      console.log("Found explicit original audio option:", text);
      return option;
    }
  }

  // Second pass: Look for matches in our translation list
  for (const option of options) {
    const text = option?.textContent
      ?.replace(/\s+/g, " ")
      ?.trim()
      ?.toLowerCase();

    if (
      allTexts.some(
        (origText) =>
          typeof origText === "string" && text?.includes(origText.toLowerCase())
      )
    ) {
      console.log("Found original audio option from translations:", text);
      return option;
    }
  }

  // Third pass: Look for English tracks if no explicit original found
  for (const option of options) {
    const text = option?.textContent
      ?.replace(/\s+/g, " ")
      ?.trim()
      ?.toLowerCase();

    if (text?.includes("english")) {
      console.log("Found English audio option as fallback:", text);
      return option;
    }
  }

  // Final fallback: First non-translated track
  if (options.length > 0) {
    for (const option of options) {
      const text = option?.textContent?.trim().toLowerCase();
      if (
        !text?.includes("translated") &&
        !text?.includes("auto-generated") &&
        !text?.includes("auto-translate")
      ) {
        console.log("Using first non-translated option as fallback:", text);
        return option;
      }
    }
  }

  return null;
}

function fixAudioTrack(settingsButton) {
  if (!isExtensionEnabled || hasProcessedAudio) return;
  hasProcessedAudio = true;

  // Create and dispatch click events directly instead of using .click()
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  // Queue all actions in a single animation frame for optimal performance
  requestAnimationFrame(() => {
    // Click settings
    settingsButton.dispatchEvent(clickEvent);

    // Force immediate menu update
    document.body.offsetHeight; // Trigger reflow

    // Find and click audio track menu
    const menuItems = document.querySelectorAll(
      ".ytp-panel-menu .ytp-menuitem"
    );
    const audioTrackItem = findAudioTrackMenuItem(menuItems);

    if (!audioTrackItem) {
      closeMenu();
      return;
    }

    audioTrackItem.dispatchEvent(clickEvent);

    // Force immediate menu update
    document.body.offsetHeight; // Trigger reflow

    // Find and click original option
    const audioOptions = document.querySelectorAll(
      '.ytp-menuitem, .ytp-panel-menu .ytp-menuitem, [role="menuitem"]'
    );

    const originalOption = findOriginalAudioOption(audioOptions);
    if (originalOption) {
      originalOption.dispatchEvent(clickEvent);
    }

    closeMenu();
  });
}

function closeMenu() {
  const miniplayer = document.querySelector(".ytp-miniplayer-ui")
  const isMiniplayer = miniplayer.style['display'] != 'none';

  if(isMiniplayer) {
    miniplayer.click();
    return null
  }

  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
}

function startObserving() {
  if (hasProcessedAudio) return;

  // Try to process immediately if player exists
  const player = document.querySelector(".html5-video-player");
  const settingsButton = document.querySelector(".ytp-settings-button");

  if (player && settingsButton) {
    fixAudioTrack(settingsButton);
    return;
  }

  // Use a more aggressive observer configuration
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const settingsButton = mutation.target.querySelector?.(
        ".ytp-settings-button"
      );
      if (settingsButton) {
        observer.disconnect();
        fixAudioTrack(settingsButton);
        return;
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  window.youtubeOriginalAudioObserver = observer;
}

// Optimize the initialization process
function handlePlayerInit() {
  hasProcessedAudio = false;
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(startObserving);
}

// Add more event listeners to catch the video player as early as possible
window.addEventListener("yt-navigate-start", () => {
  hasProcessedAudio = false;
});

window.addEventListener("yt-navigate-finish", handlePlayerInit);
window.addEventListener("yt-page-data-updated", handlePlayerInit);
window.addEventListener("loadeddata", handlePlayerInit, true);

// Initial check when script loads
handlePlayerInit();
