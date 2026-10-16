/** English plus all 22 Eighth Schedule languages. Shared menu priority: English, Hindi, Kannada, other southern languages, northern languages, then remaining regions. */
export const languages:Record<string,string>={
 en:'English',hi:'हिन्दी · Hindi',kn:'ಕನ್ನಡ · Kannada',ta:'தமிழ் · Tamil',te:'తెలుగు · Telugu',ml:'മലയാളം · Malayalam',pa:'ਪੰਜਾਬੀ · Punjabi',ur:'اردو · Urdu',ks:'کٲشُر · Kashmiri',doi:'डोगरी · Dogri',sd:'سنڌي · Sindhi',sa:'संस्कृतम् · Sanskrit',ne:'नेपाली · Nepali',mai:'मैथिली · Maithili',mr:'मराठी · Marathi',kok:'कोंकणी · Konkani',gu:'ગુજરાતી · Gujarati',bn:'বাংলা · Bengali',or:'ଓଡ଼ିଆ · Odia',as:'অসমীয়া · Assamese',brx:'बड़ो · Bodo',mni:'ꯃꯤꯇꯩꯂꯣꯟ · Manipuri',sat:'ᱥᱟᱱᱛᱟᱲᱤ · Santali'
};
export const languageCodes=Object.keys(languages) as [string,...string[]];
/** Lessons reviewed by people. */
export const reviewedLessonLanguages=['en','kn','hi'];
/** Machine-drafted lesson packs in lib/translations, waiting for native-speaker review. */
export const draftLessonLanguages=['as','bn','brx','doi','gu','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur'];
export const lessonLanguages=[...reviewedLessonLanguages,...draftLessonLanguages];
export function lessonLanguage(language:string){return lessonLanguages.includes(language)?language:'en';}
/** Option label that says plainly when a language falls back to English guidance. */
export function languageOptionLabel(language:string,full:readonly string[]=lessonLanguages,fallback='English guidance for now'){return !full.includes(language)?`${languages[language]} · ${fallback}`:full===lessonLanguages&&draftLessonLanguages.includes(language)?`${languages[language]} · draft translation`:languages[language];}
export function languageOptions(full:readonly string[]=lessonLanguages,fallback?:string):Record<string,string>{return Object.fromEntries(Object.keys(languages).map(code=>[code,languageOptionLabel(code,full,fallback)]));}
export function languageDirection(language:string){return ['ks','sd','ur'].includes(language)?'rtl':'ltr';}
export function readPreferredLanguage(fallback='en'){try{const value=localStorage.getItem('whatslearn-language');return value&&languages[value]?value:languages[fallback]?fallback:'en'}catch{return languages[fallback]?fallback:'en'}}
export function rememberLanguage(language:string){if(!languages[language])throw new Error('Choose a listed language.');localStorage.setItem('whatslearn-language',language);window.dispatchEvent(new CustomEvent('whatslearn-language-change',{detail:language}));}
