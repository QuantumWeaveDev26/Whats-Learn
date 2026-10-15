/**
 * Direct feedback for the understanding question, in the learner's interface language.
 * A wrong answer says plainly that it is not correct, names the concept to reconsider, gives the reason, and says the learner can try again at no cost.
 * A right answer says "Correct" and gives the reason. The reason is the mission's own explanation (already localized where a translation exists).
 * Lines for languages other than English, Hindi and Kannada are machine drafts waiting for native-speaker review (the same status as the draft lesson packs).
 * Bodo, Manipuri, Kashmiri and Santali have no reviewed or drafted line yet, so they show the English line rather than a guess.
 */
export type FeedbackLines={wrong:string;concept:string;right:string;again:string};
const en:FeedbackLines={wrong:'That answer is not correct.',concept:'Concept to reconsider:',right:'Correct.',again:'Choose another answer. A wrong answer costs no points and does not lock anything.'};
const lines:Record<string,FeedbackLines>={
 en,
 hi:{wrong:'यह उत्तर सही नहीं है।',concept:'दोबारा सोचने की अवधारणा:',right:'सही।',again:'दूसरा उत्तर चुनें। गलत उत्तर से अंक नहीं कटते और कुछ भी लॉक नहीं होता।'},
 kn:{wrong:'ಆ ಉತ್ತರ ಸರಿಯಲ್ಲ.',concept:'ಮರುಪರಿಶೀಲಿಸಬೇಕಾದ ಪರಿಕಲ್ಪನೆ:',right:'ಸರಿ.',again:'ಇನ್ನೊಂದು ಉತ್ತರವನ್ನು ಆರಿಸಿ. ತಪ್ಪು ಉತ್ತರಕ್ಕೆ ಅಂಕ ಕಳೆಯುವುದಿಲ್ಲ, ಏನನ್ನೂ ಲಾಕ್ ಮಾಡುವುದಿಲ್ಲ.'},
 ta:{wrong:'அந்த பதில் சரியல்ல.',concept:'மீண்டும் யோசிக்க வேண்டிய கருத்து:',right:'சரி.',again:'வேறு பதிலைத் தேர்ந்தெடுக்கவும். தவறான பதிலுக்குப் புள்ளிகள் குறையாது, எதுவும் பூட்டப்படாது.'},
 te:{wrong:'ఆ సమాధానం సరైనది కాదు.',concept:'మళ్లీ ఆలోచించాల్సిన భావన:',right:'సరైనది.',again:'మరో సమాధానాన్ని ఎంచుకోండి. తప్పు సమాధానానికి పాయింట్లు తగ్గవు, ఏదీ లాక్ కాదు.'},
 ml:{wrong:'ആ ഉത്തരം ശരിയല്ല.',concept:'വീണ്ടും ചിന്തിക്കേണ്ട ആശയം:',right:'ശരി.',again:'മറ്റൊരു ഉത്തരം തിരഞ്ഞെടുക്കുക. തെറ്റായ ഉത്തരത്തിന് പോയിന്റ് കുറയില്ല, ഒന്നും ലോക്ക് ആകില്ല.'},
 mr:{wrong:'ते उत्तर बरोबर नाही.',concept:'पुन्हा विचार करण्याची संकल्पना:',right:'बरोबर.',again:'दुसरे उत्तर निवडा. चुकीच्या उत्तरामुळे गुण कमी होत नाहीत आणि काहीही लॉक होत नाही.'},
 gu:{wrong:'તે જવાબ સાચો નથી.',concept:'ફરી વિચારવાની વિભાવના:',right:'સાચું.',again:'બીજો જવાબ પસંદ કરો. ખોટા જવાબથી પોઈન્ટ ઘટતા નથી અને કશું લૉક થતું નથી.'},
 bn:{wrong:'এই উত্তরটি সঠিক নয়।',concept:'যে ধারণাটি আবার ভাবা দরকার:',right:'সঠিক।',again:'অন্য একটি উত্তর বেছে নিন। ভুল উত্তরে পয়েন্ট কাটা যায় না এবং কিছু লক হয় না।'},
 as:{wrong:'সেই উত্তৰটো শুদ্ধ নহয়।',concept:'পুনৰ বিচাৰ কৰিবলগীয়া ধাৰণা:',right:'শুদ্ধ।',again:'আন এটা উত্তৰ বাছি লওক। ভুল উত্তৰত পইণ্ট কটা নাযায় আৰু একো লক নহয়।'},
 or:{wrong:'ସେହି ଉତ୍ତର ଠିକ୍ ନୁହେଁ।',concept:'ପୁନର୍ବିଚାର କରିବାକୁ ଥିବା ଧାରଣା:',right:'ଠିକ୍।',again:'ଅନ୍ୟ ଏକ ଉତ୍ତର ବାଛନ୍ତୁ। ଭୁଲ ଉତ୍ତରରେ ପଏଣ୍ଟ କଟେ ନାହିଁ ଏବଂ କିଛି ଲକ୍ ହୁଏ ନାହିଁ।'},
 pa:{wrong:'ਇਹ ਜਵਾਬ ਸਹੀ ਨਹੀਂ ਹੈ।',concept:'ਦੁਬਾਰਾ ਸੋਚਣ ਵਾਲੀ ਧਾਰਨਾ:',right:'ਸਹੀ।',again:'ਕੋਈ ਹੋਰ ਜਵਾਬ ਚੁਣੋ। ਗਲਤ ਜਵਾਬ ਨਾਲ ਅੰਕ ਨਹੀਂ ਕੱਟੇ ਜਾਂਦੇ ਅਤੇ ਕੁਝ ਲਾਕ ਨਹੀਂ ਹੁੰਦਾ।'},
 ur:{wrong:'یہ جواب درست نہیں ہے۔',concept:'جس تصور پر دوبارہ غور کرنا ہے:',right:'درست۔',again:'کوئی دوسرا جواب منتخب کریں۔ غلط جواب سے پوائنٹس نہیں کٹتے اور کچھ لاک نہیں ہوتا۔'},
 ne:{wrong:'त्यो उत्तर सही छैन।',concept:'फेरि सोच्नुपर्ने अवधारणा:',right:'सही।',again:'अर्को उत्तर छान्नुहोस्। गलत उत्तरले अङ्क घटाउँदैन र केही लक हुँदैन।'},
 mai:{wrong:'ई उत्तर सही नहि अछि।',concept:'फेरसँ सोचबाक अवधारणा:',right:'सही।',again:'दोसर उत्तर चुनू। गलत उत्तरसँ अंक नहि कटैत अछि आ किछु लॉक नहि होइत अछि।'},
 doi:{wrong:'ए जवाब ठीक नेईं ऐ।',concept:'दुबारा सोचने आली धारणा:',right:'ठीक।',again:'होर जवाब चुनो। गलत जवाब कन्नै अंक नेईं कटदे ते कुसैही चीज़ लॉक नेईं होंदी।'},
 kok:{wrong:'तें उत्तर बरोबर न्हय.',concept:'परतून विचार करपाची संकल्पना:',right:'बरोबर.',again:'दुसरें उत्तर वेंचात. चुकीच्या उत्तरान गुण उणे जायनात आनी कांयच लॉक जायना.'},
 sd:{wrong:'اهو جواب صحيح ناهي.',concept:'جنهن تصور تي ٻيهر سوچڻو آهي:',right:'صحيح.',again:'ٻيو جواب چونڊيو. غلط جواب سان پوائنٽس نه ڪٽبا آهن ۽ ڪجهه به لاڪ نٿو ٿئي.'},
 sa:{wrong:'तत् उत्तरं समीचीनं नास्ति।',concept:'पुनर्विचारणीया संकल्पना:',right:'समीचीनम्।',again:'अन्यद् उत्तरं चिनुत। असम्यक् उत्तरेण अङ्काः न हीयन्ते, किमपि च न पिधीयते।'}};
/** The lines used for a language. Languages without lines fall back to English. */
export const feedbackLines=(language:string):FeedbackLines=>Object.prototype.hasOwnProperty.call(lines,language)?lines[language]:en;
export const feedbackLanguages=Object.keys(lines);
export type QuizFeedback={correct:boolean;title:string;text:string};
/** `skill` names the concept the question tests (leave empty for short starter questions that have no named skill); `reason` is the mission's explanation. */
export function quizFeedback(language:string,correct:boolean,skill:string,reason:string):QuizFeedback{
 const l=feedbackLines(language);
 return correct?{correct,title:l.right,text:`${l.right} ${reason}`}:{correct,title:l.wrong,text:`${l.wrong} ${skill?`${l.concept} ${skill}. `:''}${reason} ${l.again}`};
}
