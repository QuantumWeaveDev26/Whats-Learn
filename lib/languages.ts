/** English plus the 22 Eighth Schedule languages. Names shown in native script. */
export const languages:Record<string,string>={
 en:'English',as:'অসমীয়া · Assamese',bn:'বাংলা · Bengali',brx:'बड़ो · Bodo',doi:'डोगरी · Dogri',gu:'ગુજરાતી · Gujarati',hi:'हिन्दी · Hindi',kn:'ಕನ್ನಡ · Kannada',ks:'کٲشُر · Kashmiri',kok:'कोंकणी · Konkani',mai:'मैथिली · Maithili',ml:'മലയാളം · Malayalam',mni:'ꯃꯤꯇꯩꯂꯣꯟ · Manipuri',mr:'मराठी · Marathi',ne:'नेपाली · Nepali',or:'ଓଡ଼ିଆ · Odia',pa:'ਪੰਜਾਬੀ · Punjabi',sa:'संस्कृतम् · Sanskrit',sat:'ᱥᱟᱱᱛᱟᱲᱤ · Santali',sd:'سنڌي · Sindhi',ta:'தமிழ் · Tamil',te:'తెలుగు · Telugu',ur:'اردو · Urdu'
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
