import {env} from 'cloudflare:workers';
type Template={name:string;language:string;kind:'progress'|'performance'};
export function performanceTemplate(language:string):Template|null{
 const e=env as unknown as Record<string,string|undefined>;let map:Record<string,Template>={};try{map=JSON.parse(e.WHATSAPP_PERFORMANCE_TEMPLATES||'{}')}catch{}
 const mapped=map?.[language];if(mapped&&/^[a-z0-9_]{1,512}$/.test(mapped.name||'')&&String(mapped.language||'').split(/[_-]/)[0]===language&&['progress','performance'].includes(mapped.kind))return mapped;
 const metaLanguage=e.WHATSAPP_TEMPLATE_LANGUAGE||'en';if(metaLanguage.split(/[_-]/)[0]!==language)return null;
 if(e.WHATSAPP_PROGRESS_TEMPLATE)return {name:e.WHATSAPP_PROGRESS_TEMPLATE,language:metaLanguage,kind:'progress'};
 return e.WHATSAPP_PERFORMANCE_TEMPLATE?{name:e.WHATSAPP_PERFORMANCE_TEMPLATE,language:metaLanguage,kind:'performance'}:null;
}
const copy={
 en:{paused:'Reminders paused. Your draft is kept; lessons still work. Send REMIND ON to resume reminders.',stopped:'You will not get more WhatsLearn messages or reminders. Your draft is kept. Send START to turn lessons back on.',resumed:'Reminders on at your saved schedule.',progress:'Your progress',saved:'creations saved',next:'Next',today:'points today',streak:'day streak',week:'missions this week',pause:'REMIND OFF → pause',fallback:''},
 kn:{paused:'ನೆನಪಿನ ಸಂದೇಶಗಳನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಕರಡು ಉಳಿದಿದೆ; ಕಲಿಕೆ ಮುಂದುವರಿಸಬಹುದು. ಮತ್ತೆ ಆರಂಭಿಸಲು REMIND ON ಕಳುಹಿಸಿ.',stopped:'WhatsLearn ಸಂದೇಶಗಳು ಮತ್ತು ನೆನಪಿನ ಸಂದೇಶಗಳನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಕರಡು ಉಳಿದಿದೆ. ಮತ್ತೆ ಕಲಿಯಲು START ಕಳುಹಿಸಿ.',resumed:'ನಿಮ್ಮ ಆಯ್ಕೆಯ ಸಮಯದಲ್ಲಿ ನೆನಪಿನ ಸಂದೇಶಗಳು ಆರಂಭವಾಗಿವೆ.',progress:'ನಿಮ್ಮ ಪ್ರಗತಿ',saved:'ಸೃಷ್ಟಿಗಳು ಉಳಿದಿವೆ',next:'ಮುಂದೆ',today:'ಇಂದಿನ ಅಂಕಗಳು',streak:'ದಿನಗಳ ಸರಣಿ',week:'ಈ ವಾರದ ಮಿಷನ್‌ಗಳು',pause:'REMIND OFF → ನಿಲ್ಲಿಸಿ',fallback:''},
 hi:{paused:'रिमाइंडर रोक दिए हैं। आपका ड्राफ़्ट सुरक्षित है; सीखना जारी रख सकते हैं। फिर शुरू करने के लिए REMIND ON भेजें।',stopped:'WhatsLearn के संदेश और रिमाइंडर बंद हैं। आपका ड्राफ़्ट सुरक्षित है। फिर सीखने के लिए START भेजें।',resumed:'आपके चुने हुए समय पर रिमाइंडर चालू हैं।',progress:'आपकी प्रगति',saved:'रचनाएँ सहेजी गईं',next:'अगला',today:'आज के अंक',streak:'दिन की स्ट्रीक',week:'इस हफ़्ते के मिशन',pause:'REMIND OFF → रोकें',fallback:''}
} as const;
export function reminderCopy(language:string){return Object.hasOwn(copy,language)?copy[language as keyof typeof copy]:{...copy.en,fallback:'English reminder copy — selected-language translation unavailable.'}}
