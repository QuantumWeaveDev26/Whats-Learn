import {messageCopy} from '@/lib/question-translations';
import {appInterfaceCopy} from './app-interface-copy';
import {findAppCopy} from './app-copy';

const kannada: Record<string, string> = {
 'Mentor':'ಮಾರ್ಗದರ್ಶಕ', 'Me':'ನನ್ನ ಖಾತೆ', 'Sign in':'ಲಾಗಿನ್ ಮಾಡಿ', 'Saved':'ಉಳಿಸಲಾಗಿದೆ',
 'Settings':'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'Badges':'ಬ್ಯಾಡ್ಜ್‌ಗಳು', 'My Creations':'ನನ್ನ ಕೃತಿಗಳು',
 'App sections':'ಆ್ಯಪ್ ವಿಭಾಗಗಳು', 'App update available':'ಆ್ಯಪ್ ನವೀಕರಣ ಲಭ್ಯವಿದೆ', 'Update now':'ಈಗ ನವೀಕರಿಸಿ',
 'You’re offline.':'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ.', 'Play offline':'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಆಡಿ', 'Loading…':'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', 'Try again':'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
 'All tasks':'ಎಲ್ಲಾ ಚಟುವಟಿಕೆಗಳು', 'Learn':'ಕಲಿಯಿರಿ', 'Check':'ಪರಿಶೀಲಿಸಿ', 'Make':'ರಚಿಸಿ', 'Self-check':'ಸ್ವಯಂ ಪರಿಶೀಲನೆ', 'Review':'ಪ್ರತಿಕ್ರಿಯೆ',
 'Task':'ಚಟುವಟಿಕೆ', 'About':'ಸುಮಾರು', 'min':'ನಿಮಿಷ', 'What to do':'ಏನು ಮಾಡಬೇಕು?', 'The idea behind it':'ಇದರ ಹಿಂದಿನ ಕಲ್ಪನೆ',
 'Check my understanding':'ನನ್ನ ತಿಳುವಳಿಕೆ ಪರಿಶೀಲಿಸಿ', 'Return to my work':'ನನ್ನ ಕೆಲಸಕ್ಕೆ ಮರಳಿ', 'Back to lesson':'ಪಾಠಕ್ಕೆ ಮರಳಿ',
 'Back to check':'ಪರಿಶೀಲನೆಗೆ ಮರಳಿ', 'Task instructions':'ಚಟುವಟಿಕೆಯ ಸೂಚನೆಗಳು', 'Your work':'ನಿಮ್ಮ ಕೆಲಸ', 'Test evidence':'ಪರೀಕ್ಷೆಯ ಸಾಕ್ಷ್ಯ', 'Your choices':'ನಿಮ್ಮ ಆಯ್ಕೆಗಳು',
 'Draft saved on this phone':'ಕರಡು ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ', 'Draft saved on this phone. Reconnect to submit.':'ಕರಡು ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಸಲ್ಲಿಸಲು ಮತ್ತೆ ಸಂಪರ್ಕಿಸಿ.',
 'Couldn’t save this draft. Copy your work before leaving.':'ಕರಡು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಹೊರಡುವ ಮೊದಲು ನಿಮ್ಮ ಕೆಲಸವನ್ನು ನಕಲಿಸಿ.',
 'Leave this task?':'ಈ ಚಟುವಟಿಕೆಯಿಂದ ಹೊರಡಬೇಕೆ?', 'Your draft and current step are saved on this device.':'ನಿಮ್ಮ ಕರಡು ಮತ್ತು ಪ್ರಸ್ತುತ ಹಂತ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
 'This device could not save your draft. Copy your work before leaving.':'ಈ ಸಾಧನದಲ್ಲಿ ಕರಡು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಹೊರಡುವ ಮೊದಲು ನಿಮ್ಮ ಕೆಲಸವನ್ನು ನಕಲಿಸಿ.',
 'Stay':'ಇಲ್ಲೇ ಇರಿ', 'Leave':'ಹೊರಡಿ', 'Worked example':'ಮಾದರಿ ಉದಾಹರಣೆ', 'Choose one…':'ಒಂದನ್ನು ಆರಿಸಿ…',
 'Next: add test evidence':'ಮುಂದೆ: ಪರೀಕ್ಷೆಯ ಸಾಕ್ಷ್ಯ ಸೇರಿಸಿ', 'Show what you tried':'ನೀವು ಪ್ರಯತ್ನಿಸಿದ್ದನ್ನು ತೋರಿಸಿ',
 'Share your actual results. Leave out passwords and personal details.':'ನಿಜವಾದ ಫಲಿತಾಂಶಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ. ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಸೇರಿಸಬೇಡಿ.',
 'Your artifact or relevant code':'ನಿಮ್ಮ ರಚನೆ ಅಥವಾ ಸಂಬಂಧಿತ ಕೋಡ್', 'Paste a short relevant extract, or refer to the code field in Your work.':'ಸಂಬಂಧಿತ ಚಿಕ್ಕ ಭಾಗವನ್ನು ಅಂಟಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಕೆಲಸದಲ್ಲಿರುವ ಕೋಡ್ ಕ್ಷೇತ್ರವನ್ನು ಉಲ್ಲೇಖಿಸಿ.',
 'The test you actually ran':'ನೀವು ಮಾಡಿದ ಪರೀಕ್ಷೆ', 'What did you try, using which input or viewing conditions?':'ಯಾವ ಇನ್‌ಪುಟ್ ಅಥವಾ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಏನು ಪ್ರಯತ್ನಿಸಿದಿರಿ?',
 'What actually happened':'ನಿಜವಾಗಿ ಏನಾಯಿತು?', 'Give the output or observation. Label an expected result separately.':'ಫಲಿತಾಂಶ ಅಥವಾ ಗಮನಿಸಿದುದನ್ನು ಬರೆಯಿರಿ. ನಿರೀಕ್ಷಿತ ಫಲಿತಾಂಶವನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಗುರುತಿಸಿ.',
 'The improvement you made':'ನೀವು ಮಾಡಿದ ಸುಧಾರಣೆ', 'What did you change after the test, and what happened next?':'ಪರೀಕ್ಷೆಯ ಬಳಿಕ ಏನು ಬದಲಿಸಿದಿರಿ? ನಂತರ ಏನಾಯಿತು?',
 'Next: explain your choices':'ಮುಂದೆ: ನಿಮ್ಮ ಆಯ್ಕೆಗಳನ್ನು ವಿವರಿಸಿ', 'Why did you make these choices?':'ಈ ಆಯ್ಕೆಗಳನ್ನು ಏಕೆ ಮಾಡಿದಿರಿ?',
 'Free learning help':'ಉಚಿತ ಕಲಿಕಾ ಸಹಾಯ', 'Explain simply':'ಸರಳವಾಗಿ ವಿವರಿಸಿ', 'Worked example · free':'ಉಚಿತ ಮಾದರಿ ಉದಾಹರಣೆ',
 'Next: check your work':'ಮುಂದೆ: ನಿಮ್ಮ ಕೆಲಸ ಪರಿಶೀಲಿಸಿ', 'Check your work honestly. The AI will review it too.':'ನಿಮ್ಮ ಕೆಲಸವನ್ನು ಪರಿಶೀಲಿಸಿ. AI ಕೂಡ ಅದನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.',
 'Reading your work…':'ನಿಮ್ಮ ಕೆಲಸವನ್ನು ಓದಲಾಗುತ್ತಿದೆ…', 'Get AI review':'AI ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಿರಿ', 'Edit my work':'ನನ್ನ ಕೆಲಸ ತಿದ್ದಿ', 'Save my task':'ನನ್ನ ಚಟುವಟಿಕೆ ಉಳಿಸಿ',
 'Checking and saving…':'ಪರಿಶೀಲಿಸಿ ಉಳಿಸಲಾಗುತ್ತಿದೆ…', 'Improve it first':'ಮೊದಲು ಸುಧಾರಿಸಿ', 'AI feedback':'AI ಪ್ರತಿಕ್ರಿಯೆ', 'What worked':'ಯಾವುದು ಚೆನ್ನಾಗಿ ಕೆಲಸ ಮಾಡಿತು?', 'Next step:':'ಮುಂದಿನ ಹಂತ:',
 'Continue learning':'ಕಲಿಕೆಯನ್ನು ಮುಂದುವರಿಸಿ', 'Continue task':'ಚಟುವಟಿಕೆ ಮುಂದುವರಿಸಿ', 'Nice work today':'ಇಂದಿನ ಕೆಲಸ ಚೆನ್ನಾಗಿದೆ',
 'Good morning':'ಶುಭೋದಯ', 'Good afternoon':'ಶುಭ ಮಧ್ಯಾಹ್ನ', 'Good evening':'ಶುಭ ಸಂಜೆ',
 'Your own pace':'ನಿಮ್ಮದೇ ವೇಗದಲ್ಲಿ', 'See all':'ಎಲ್ಲವನ್ನೂ ನೋಡಿ', 'View tasks':'ಚಟುವಟಿಕೆಗಳನ್ನು ನೋಡಿ', 'Continue':'ಮುಂದುವರಿಸಿ',
 'Try the first three tasks of any course free.':'ಯಾವುದೇ ಕೋರ್ಸ್‌ನ ಮೊದಲ ಮೂರು ಚಟುವಟಿಕೆಗಳನ್ನು ಉಚಿತವಾಗಿ ಪ್ರಯತ್ನಿಸಿ.',
 'Back to courses':'ಕೋರ್ಸ್‌ಗಳಿಗೆ ಮರಳಿ', 'You’ll make':'ನೀವು ರಚಿಸುವುದು', 'You’ll make:':'ನೀವು ರಚಿಸುವುದು:', 'Free to start':'ಉಚಿತವಾಗಿ ಪ್ರಾರಂಭಿಸಿ', 'Completed':'ಪೂರ್ಣಗೊಂಡಿದೆ', 'Locked':'ಲಾಕ್ ಆಗಿದೆ', 'Open':'ಲಭ್ಯವಿದೆ', 'Free':'ಉಚಿತ',
 'Stuck? Ask your mentor':'ಸಹಾಯ ಬೇಕೇ? ಮಾರ್ಗದರ್ಶಕರನ್ನು ಕೇಳಿ', 'Get help with your current task':'ಈ ಚಟುವಟಿಕೆಗೆ ಸಹಾಯ ಪಡೆಯಿರಿ',
 'Need a hand? Ask for an explanation, an example, or a next step.':'ಸಹಾಯ ಬೇಕೇ? ವಿವರಣೆ, ಉದಾಹರಣೆ ಅಥವಾ ಮುಂದಿನ ಹಂತವನ್ನು ಕೇಳಿ.',
 'Explain this task simply':'ಈ ಚಟುವಟಿಕೆಯನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ', 'Show me an example':'ಒಂದು ಉದಾಹರಣೆ ತೋರಿಸಿ', 'What should I do first?':'ನಾನು ಮೊದಲು ಏನು ಮಾಡಬೇಕು?',
 'Help with this task':'ಈ ಚಟುವಟಿಕೆಗೆ ಸಹಾಯ', 'Retry question':'ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೆ ಕಳುಹಿಸಿ', 'Ask the mentor':'ಮಾರ್ಗದರ್ಶಕರನ್ನು ಕೇಳಿ',
 'Ask about your task…':'ನಿಮ್ಮ ಚಟುವಟಿಕೆಯ ಬಗ್ಗೆ ಕೇಳಿ…', 'Send':'ಕಳುಹಿಸಿ', 'Dictate a question':'ಪ್ರಶ್ನೆಯನ್ನು ಧ್ವನಿಯಲ್ಲಿ ಹೇಳಿ', 'Stop dictation':'ಧ್ವನಿ ದಾಖಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
 'Voice uses your browser’s speech service. Review the text before sending.':'ಧ್ವನಿಗಾಗಿ ಬ್ರೌಸರ್‌ನ ಸೇವೆಯನ್ನು ಬಳಸಲಾಗುತ್ತದೆ. ಕಳುಹಿಸುವ ಮೊದಲು ಪಠ್ಯ ಪರಿಶೀಲಿಸಿ.',
 'Continue on WhatsApp':'WhatsApp ನಲ್ಲಿ ಮುಂದುವರಿಸಿ', 'Sign in or create an account':'ಲಾಗಿನ್ ಮಾಡಿ ಅಥವಾ ಖಾತೆ ತೆರೆಯಿರಿ',
 'All games':'ಎಲ್ಲಾ ಆಟಗಳು', 'Play again':'ಮತ್ತೆ ಆಡಿ', 'Back to all games':'ಎಲ್ಲಾ ಆಟಗಳಿಗೆ ಮರಳಿ',
 'All courses':'ಎಲ್ಲಾ ಕೋರ್ಸ್‌ಗಳು', 'Marketing':'ಮಾರ್ಕೆಟಿಂಗ್', 'Development':'ಅಭಿವೃದ್ಧಿ', 'Filmmaking':'ಚಲನಚಿತ್ರ ನಿರ್ಮಾಣ', 'Storytelling':'ಕಥೆ ಹೇಳುವಿಕೆ',
 'TODAY’S GAME':'ಇಂದಿನ ಆಟ', 'Weekly tournament':'ವಾರದ ಪಂದ್ಯಾವಳಿ', 'Squad challenge':'ತಂಡದ ಸವಾಲು', 'Challenge a friend':'ಸ್ನೇಹಿತರಿಗೆ ಸವಾಲು ಹಾಕಿ',
 'See my score':'ನನ್ನ ಅಂಕ ನೋಡಿ', 'Next':'ಮುಂದೆ', 'Back':'ಹಿಂದೆ', 'Correct':'ಸರಿ', 'Not this time':'ಈ ಬಾರಿ ಸರಿಯಾಗಿಲ್ಲ',
 'Check my order':'ನನ್ನ ಕ್ರಮ ಪರಿಶೀಲಿಸಿ', 'Reference order':'ಮಾದರಿ ಕ್ರಮ', 'Why this order?':'ಈ ಕ್ರಮ ಏಕೆ?', 'Retry round':'ಸುತ್ತನ್ನು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
 'Keep':'ಉಳಿಸಿ', 'Skip':'ಬಿಟ್ಟುಬಿಡಿ', 'Lock in my budget':'ಬಜೆಟ್ ಖಚಿತಪಡಿಸಿ', 'Next goal':'ಮುಂದಿನ ಗುರಿ',
 'Finish my story':'ನನ್ನ ಕಥೆ ಮುಗಿಸಿ', 'Challenge a friend on WhatsApp':'WhatsApp ನಲ್ಲಿ ಸ್ನೇಹಿತರಿಗೆ ಸವಾಲು ಹಾಕಿ',
 'Language':'ಭಾಷೆ', 'Learning preferences':'ಕಲಿಕಾ ಆದ್ಯತೆಗಳು', 'Help & support':'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
 'Check your connection and try again.':'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
 'The mentor couldn’t answer right now.':'ಮಾರ್ಗದರ್ಶಕರಿಂದ ಈಗ ಉತ್ತರ ಸಿಗಲಿಲ್ಲ.',
 'Hook Hunter':'ಗಮನ ಸೆಳೆಯುವ ಬರಹ ಹುಡುಕಿ','Budget Boss':'ಬಜೆಟ್ ಹಂಚಿಕೆ','Bug Hunt':'ಕೋಡ್ ದೋಷ ಹುಡುಕಿ','Build the Flow':'ಪರದೆಗಳ ಕ್ರಮ ಜೋಡಿಸಿ',
 'Shot Order':'ದೃಶ್ಯಗಳ ಕ್ರಮ','Guess the Shot':'ಕ್ಯಾಮೆರಾ ಶಾಟ್ ಗುರುತಿಸಿ','Story Dice':'ಕಥೆಯ ದಾಳಗಳು','Caption It':'ಚಿತ್ರಕ್ಕೆ ಶೀರ್ಷಿಕೆ ಕೊಡಿ',
 'Spot the posts that stop the scroll.':'ಗಮನ ಸೆಳೆಯುವ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಗುರುತಿಸಿ.','Spend ₹5,000 where it works.':'₹5,000 ಅನ್ನು ಸೂಕ್ತ ಮಾಧ್ಯಮಗಳಿಗೆ ಹಂಚಿ.',
 'Find the broken line before time runs out.':'ಸಮಯ ಮುಗಿಯುವ ಮೊದಲು ದೋಷವಿರುವ ಸಾಲನ್ನು ಗುರುತಿಸಿ.',
 'Put app screens in the right order.':'ಆ್ಯಪ್ ಪರದೆಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ.','Arrange frames into a clear story.':'ಸ್ಪಷ್ಟ ಕಥೆಗಾಗಿ ದೃಶ್ಯಗಳನ್ನು ಕ್ರಮವಾಗಿ ಜೋಡಿಸಿ.',
 'Name the camera shot from the frame.':'ಚಿತ್ರದ ಚೌಕಟ್ಟಿನಿಂದ ಕ್ಯಾಮೆರಾ ಶಾಟ್ ಗುರುತಿಸಿ.','Roll three things. Tell a story in 3 frames.':'ಮೂರು ವಸ್ತುಗಳನ್ನು ಪಡೆದು ಮೂರು ದೃಶ್ಯಗಳಲ್ಲಿ ಕಥೆ ಹೇಳಿ.',
 'Pick the caption that makes the picture land.':'ಚಿತ್ರಕ್ಕೆ ಸೂಕ್ತವಾದ ಶೀರ್ಷಿಕೆ ಆರಿಸಿ.',
 'Swipe through a feed. Keep posts with a strong hook, skip the weak ones.':'ಪೋಸ್ಟ್‌ಗಳನ್ನು ಸ್ವೈಪ್ ಮಾಡಿ. ಗಮನ ಸೆಳೆಯುವ ಪೋಸ್ಟ್‌ಗಳನ್ನು ಉಳಿಸಿ, ಉಳಿದವುಗಳನ್ನು ಬಿಡಿ.',
 'Split the budget across channels to fit each business goal.':'ವ್ಯಾಪಾರದ ಗುರಿಗೆ ತಕ್ಕಂತೆ ಮಾಧ್ಯಮಗಳ ನಡುವೆ ಬಜೆಟ್ ಹಂಚಿ.',
 'Tap the line that causes the bug. 25 seconds per round.':'ದೋಷಕ್ಕೆ ಕಾರಣವಾದ ಸಾಲನ್ನು ಒತ್ತಿ. ಪ್ರತಿ ಸುತ್ತಿಗೆ 25 ಸೆಕೆಂಡ್.',
 'Tap the screens in the order a user would see them.':'ಬಳಕೆದಾರರು ನೋಡುವ ಕ್ರಮದಲ್ಲಿ ಪರದೆಗಳನ್ನು ಒತ್ತಿ.',
 'Tap the frames in the order that tells the story.':'ಕಥೆ ಹೇಳುವ ಕ್ರಮದಲ್ಲಿ ದೃಶ್ಯಗಳನ್ನು ಒತ್ತಿ.',
 'Look at the framing and pick the shot type.':'ಚಿತ್ರದ ಚೌಕಟ್ಟನ್ನು ನೋಡಿ ಶಾಟ್‌ನ ಪ್ರಕಾರ ಆರಿಸಿ.',
 'Use all three rolled items across a beginning, a change and an ending.':'ಆರಂಭ, ಬದಲಾವಣೆ ಮತ್ತು ಅಂತ್ಯದಲ್ಲಿ ನಿಮಗೆ ಸಿಕ್ಕ ಮೂರು ವಸ್ತುಗಳನ್ನೂ ಬಳಸಿ.',
 'Choose the caption that is clear, specific and fits the image.':'ಸ್ಪಷ್ಟವಾದ, ನಿರ್ದಿಷ್ಟವಾದ ಮತ್ತು ಚಿತ್ರಕ್ಕೆ ಹೊಂದುವ ಶೀರ್ಷಿಕೆಯನ್ನು ಆರಿಸಿ.',
 'Play a little.':'ಸ್ವಲ್ಪ ಆಡಿ.', 'Learn a lot.':'ಹೆಚ್ಚು ಕಲಿಯಿರಿ.', 'Round':'ಸುತ್ತು', 'of':'ರಲ್ಲಿ',
 'Mini challenge':'ಚಿಕ್ಕ ಸವಾಲು', 'Start mini challenge':'ಚಿಕ್ಕ ಸವಾಲು ಪ್ರಾರಂಭಿಸಿ', 'Play today’s game':'ಇಂದಿನ ಆಟ ಆಡಿ',
 'Choose another course':'ಬೇರೆ ಕೋರ್ಸ್ ಆರಿಸಿ', 'Course complete. All 10 tasks saved.':'ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ಎಲ್ಲಾ 10 ಚಟುವಟಿಕೆಗಳು ಉಳಿಸಲಾಗಿದೆ.',
 'Review details':'ಪ್ರತಿಕ್ರಿಯೆಯ ವಿವರಗಳು', 'Your saved work':'ನೀವು ಉಳಿಸಿದ ಕೆಲಸ', 'Improve this work':'ಈ ಕೆಲಸ ಸುಧಾರಿಸಿ',
 'Saved feedback':'ಉಳಿಸಿದ ಪ್ರತಿಕ್ರಿಯೆ', 'Practical work sections':'ಪ್ರಾಯೋಗಿಕ ಕೆಲಸದ ವಿಭಾಗಗಳು', 'optional':'ಐಚ್ಛಿಕ',
 'Sign in to chat with your mentor':'ಮಾರ್ಗದರ್ಶಕರೊಂದಿಗೆ ಮಾತನಾಡಲು ಲಾಗಿನ್ ಮಾಡಿ', 'Mentor is typing':'ಮಾರ್ಗದರ್ಶಕರು ಬರೆಯುತ್ತಿದ್ದಾರೆ',
 'A complete campaign for a local business':'ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಕ್ಕಾಗಿ ಸಂಪೂರ್ಣ ಪ್ರಚಾರ ಯೋಜನೆ',
 'A tested booking app you can run':'ನೀವು ಚಲಾಯಿಸಬಹುದಾದ, ಪರೀಕ್ಷಿಸಿದ ಬುಕಿಂಗ್ ಆ್ಯಪ್',
 'A short film you have shot and edited':'ನೀವು ಚಿತ್ರೀಕರಿಸಿ ಸಂಕಲಿಸಿದ ಕಿರುಚಿತ್ರ',
 'A visual story for a real audience':'ನಿಜವಾದ ಪ್ರೇಕ್ಷಕರಿಗಾಗಿ ಒಂದು ದೃಶ್ಯ ಕಥೆ',
 'Make the right people care.':'ಸೂಕ್ತ ಗ್ರಾಹಕರ ಗಮನ ಸೆಳೆಯಿರಿ.',
 'Turn “what if” into “it works”.':'ಕಲ್ಪನೆಯನ್ನು ಕೆಲಸ ಮಾಡುವ ಆ್ಯಪ್ ಆಗಿಸಿ.',
 'Real performances. New possibilities.':'ನೈಜ ಅಭಿನಯ. ಹೊಸ ಸಾಧ್ಯತೆಗಳು.',
 'Make a message impossible to miss.':'ಸಂದೇಶ ಎಲ್ಲರ ಗಮನಕ್ಕೂ ಬರುವಂತೆ ಮಾಡಿ.',
 'Choose your language':'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
 'Choose the language for learning and using the app.':'ಕಲಿಕೆ ಮತ್ತು ಆ್ಯಪ್ ಬಳಕೆಗೆ ಭಾಷೆಯನ್ನು ಆರಿಸಿ.',
 'Skip · keep English':'ಬಿಟ್ಟುಬಿಡಿ · ಇಂಗ್ಲಿಷ್ ಇರಲಿ',
 'Sign in to WhatsLearn':'WhatsLearn ಗೆ ಲಾಗಿನ್ ಮಾಡಿ','Create your account':'ನಿಮ್ಮ ಖಾತೆ ತೆರೆಯಿರಿ','Join the challenge':'ಸವಾಲಿಗೆ ಸೇರಿ',
 'Continue learning with your saved progress.':'ಉಳಿಸಿದ ಪ್ರಗತಿಯಿಂದ ಕಲಿಕೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
 'Free to start. No phone number needed.':'ಉಚಿತವಾಗಿ ಆರಂಭಿಸಿ. ಫೋನ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿಲ್ಲ.',
 'Continue with Google':'Google ಮೂಲಕ ಮುಂದುವರಿಸಿ','or use email':'ಅಥವಾ ಇಮೇಲ್ ಬಳಸಿ','Your name':'ನಿಮ್ಮ ಹೆಸರು','Email':'ಇಮೇಲ್','Password':'ಪಾಸ್‌ವರ್ಡ್',
 'Hide password':'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ','Show password':'ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ','Please wait…':'ದಯವಿಟ್ಟು ಕಾಯಿರಿ…','Create account':'ಖಾತೆ ತೆರೆಯಿರಿ',
 'Forgot your password?':'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?','New to WhatsLearn?':'WhatsLearn ಗೆ ಹೊಸಬರೇ?','Already learning with us?':'ಈಗಾಗಲೇ ನಮ್ಮೊಂದಿಗೆ ಕಲಿಯುತ್ತಿದ್ದೀರಾ?',
 'Create an account':'ಖಾತೆ ತೆರೆಯಿರಿ','I already have an account':'ನನಗೆ ಈಗಾಗಲೇ ಖಾತೆ ಇದೆ','Try as guest first':'ಅತಿಥಿಯಾಗಿ ಮೊದಲು ಪ್ರಯತ್ನಿಸಿ',
 'Resend the email':'ಇಮೇಲ್ ಮತ್ತೆ ಕಳುಹಿಸಿ','I’ve confirmed. Sign in':'ದೃಢೀಕರಿಸಿದ್ದೇನೆ. ಲಾಗಿನ್ ಮಾಡಿ','Use a different email':'ಬೇರೆ ಇಮೇಲ್ ಬಳಸಿ','Sending…':'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…',
};

export function appTranslator(language = 'en') {
 const interfaceCopy=appInterfaceCopy[language];
 const learning=messageCopy(language);
 const shared:Record<string,string>={
  'Choose one…':learning.choose,
  'Show what you tried':learning.try,
  'Next step:':learning.next+':',
 };
 return (text:string,values:readonly unknown[]=[])=>{
  let translated=text;
  if(language!=='en'){
   translated=language==='kn'&&Object.hasOwn(kannada,text)?kannada[text]:
    interfaceCopy&&Object.hasOwn(interfaceCopy,text)?interfaceCopy[text]:
    Object.hasOwn(shared,text)?shared[text]:findAppCopy(language,text)??text;
  }
  return values.length?translated.replace(/\{(\d+)\}/g,(token,index)=>Number(index)<values.length?String(values[Number(index)]):token):translated;
 };
}

const courseNames: Record<string,string> = {
 marketing:'AI ಡಿಜಿಟಲ್ ಮಾರ್ಕೆಟಿಂಗ್', development:'AI ಫುಲ್‌ಸ್ಟ್ಯಾಕ್ ಅಭಿವೃದ್ಧಿ',
 filmmaking:'AI ಚಲನಚಿತ್ರ ನಿರ್ಮಾಣ', storytelling:'AI ದೃಶ್ಯ ಕಥೆ ಹೇಳುವಿಕೆ',
};

export function appCourseName(id:string, name:string, language:string) {
 return language==='kn' ? courseNames[id]??name : appTranslator(language)(name);
}

const missionTitles: Record<string,string> = {
 m4:'ಗ್ರಾಹಕರಿಗೆ ಪಕ್ಷಪಾತವಿಲ್ಲದ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ',m5:'A/B ಪರೀಕ್ಷೆಯಲ್ಲಿ ಒಮ್ಮೆ ಒಂದೇ ಬದಲಾವಣೆ ಮಾಡಿ',m6:'ಒಂದು ಪ್ರಚಾರ ಮಾಧ್ಯಮವನ್ನು ಆರಿಸಿ ಮತ್ತು ಕಾರಣ ತಿಳಿಸಿ',m7:'ಮೊದಲು ಗಮನಿಸಬೇಕಾದ ಅಂಕಿಯನ್ನು ಗುರುತಿಸಿ',m8:'ನಿಭಾಯಿಸಬಹುದಾದ ಎರಡು ವಾರಗಳ ವಿಷಯ ಯೋಜನೆ ರೂಪಿಸಿ',m9:'ಜಾಹೀರಾತಿನ ಅಪಾಯಕಾರಿ ಹೇಳಿಕೆಯನ್ನು ಗುರುತಿಸಿ ಮತ್ತು ತಿದ್ದಿ',m10:'ಒಂದು ಪುಟದ ಪ್ರಚಾರ ಯೋಜನೆ ಸಿದ್ಧಪಡಿಸಿ',
 d3:'ಬುಕಿಂಗ್ ವ್ಯವಸ್ಥೆಯ ದಾಖಲೆಗಳು ಮತ್ತು ಕ್ಷೇತ್ರಗಳನ್ನು ಆರಿಸಿ',d4:'ಕೋಡ್ ಬರೆಯುವ ಮೊದಲು ಒಂದು API ಮಾರ್ಗವನ್ನು ನಿರ್ಧರಿಸಿ',d5:'ಬ್ರೌಸರ್ ಮತ್ತು ಸರ್ವರ್‌ನಲ್ಲಿ ನಡೆಯುವ ಪರಿಶೀಲನೆಗಳನ್ನು ನಿರ್ಧರಿಸಿ',d6:'AI ಸಹಾಯದಿಂದ ದೋಷದ ಮೂಲ ಕಾರಣ ಹುಡುಕಿ',d7:'ಗುರುತು ಮತ್ತು ಅನುಮತಿಯ ವ್ಯತ್ಯಾಸ ತಿಳಿಯಿರಿ',d8:'ಒಂದು ಬುಕಿಂಗ್ ನಿಯಮಕ್ಕೆ ಮೂರು ಪರೀಕ್ಷೆಗಳನ್ನು ಬರೆಯಿರಿ',d9:'ಬ್ರಾಂಚ್ ಮತ್ತು ಹಿಂದಿನ ಆವೃತ್ತಿಗೆ ಮರಳುವ ಯೋಜನೆ ರೂಪಿಸಿ',d10:'ಬುಕಿಂಗ್ ಆ್ಯಪ್ ಬಿಡುಗಡೆಗೆ ಮುನ್ನ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ ಮಾಡಿ',
 f4:'ಭಾವನೆಗಳನ್ನು ನೇರವಾಗಿ ಹೇಳದ ಸಂಭಾಷಣೆ ಬರೆಯಿರಿ',f5:'ಕ್ರಿಯೆಗಳ ಮೂಲಕ ಕಲಾವಿದರಿಗೆ ನಿರ್ದೇಶನ ನೀಡಿ',f6:'ವೆಚ್ಚವಿಲ್ಲದೆ ಸ್ಥಳ ಮತ್ತು ಬೆಳಕನ್ನು ಯೋಜಿಸಿ',f7:'ಒಂದು ದೃಶ್ಯದ ಧ್ವನಿಯನ್ನು ರೂಪಿಸಿ',f8:'ಕುತೂಹಲ ಮೂಡಿಸುವ 30 ಸೆಕೆಂಡಿನ ದೃಶ್ಯವನ್ನು ಸಂಕಲಿಸಿ',f9:'ಒಂದು ದಿನದ ಚಿತ್ರೀಕರಣ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಬಜೆಟ್ ರೂಪಿಸಿ',f10:'ಒಂದು ಪುಟದಲ್ಲಿ ಕಿರುಚಿತ್ರದ ಪ್ರಸ್ತಾವನೆ ಬರೆಯಿರಿ',
 v3:'ಪ್ರೇಕ್ಷಕರು, ಭಾವನೆ ಮತ್ತು ಕ್ರಿಯೆಯನ್ನು ಒಂದೇ ಸಾಲಿನಲ್ಲಿ ಜೋಡಿಸಿ',v4:'ಕೆಲವೇ ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಓದಬಹುದಾದ ಪೋಸ್ಟರ್ ಯೋಜಿಸಿ',v5:'ಓದಲು ಸುಲಭವಾದ ಬಣ್ಣ ಮತ್ತು ಅಕ್ಷರಶೈಲಿ ಆರಿಸಿ',v6:'ಮೂರು ಅಂಕಿಗಳನ್ನು ಪ್ರಾಮಾಣಿಕ ಚಾರ್ಟ್‌ನಲ್ಲಿ ತೋರಿಸಿ',v7:'ಐದು ಸ್ಲೈಡ್‌ಗಳಲ್ಲಿ ಒಂದೊಂದೇ ಕಲ್ಪನೆಯನ್ನು ನೀಡಿ',v8:'AI ಚಿತ್ರವನ್ನು ಬಳಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ',v9:'ಮೂರು ಸ್ಲೈಡ್‌ಗಳಲ್ಲಿ ಒಂದು ಕಲ್ಪನೆಯನ್ನು ಮಂಡಿಸಿ',v10:'ಐದು ಫ್ರೇಮ್‌ಗಳ ಪ್ರಚಾರ ಕಥೆಯನ್ನು ಬರೆಯಿರಿ',
};

export function appMissionTitle(id:string, title:string, language:string) {
 return language==='kn' ? missionTitles[id]??title : appTranslator(language)(title);
}
