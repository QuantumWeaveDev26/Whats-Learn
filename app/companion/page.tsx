import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import AccountShell from '@/components/whatslearn/account-shell';
import {getContact,whatsappLinkReady} from '@/lib/whatsapp';
import {whatsappLearningUrl,whatsappLinkProps} from '@/lib/contact';
import {companionInstallUrl} from '@/lib/companion';
export const dynamic='force-dynamic';
export default async function Companion(){
 const user=await getChatGPTUser();let linked=false,unavailable=false;
 if(user&&whatsappLinkReady()){try{const contact=await getContact(user.userId);linked=!!contact?.verified_at&&contact.state==='opted_in'}catch{unavailable=true}}
 const chatSteps=linked?['Open the WhatsLearn Mentor chat.','Send TODAY to resume your current task.','Ask questions or submit your work in chat.']:unavailable?['Open Settings and retry the connection check.','Keep learning on the website while it reconnects.','Return here when your connection is ready.']:['Open WhatsApp settings below.','Send the link code from your number.','Send TODAY to continue your task.'];
 return <AccountShell>
  <div className="account-heading"><p className="kicker">LEARNING OPTIONS</p><h1>Your course.<br/><em>Your way.</em></h1><p>Start on the website. Add WhatsApp if you prefer learning in chat.</p></div>
  <div className="settings-fields learning-options-grid">
   <section className="account-card learning-option-card">
    <h2>Learn on the website</h2>
    <div className="learning-option-content"><p>Learn, practise and get feedback in your browser.</p><ol><li>Choose your skill and open a mission.</li><li>Make something useful and test it.</li><li>Submit for feedback, then take your next step.</li></ol></div>
    <a className="primary" href="/learn">{user?'Open my journey':'Try a mission'}</a>
    <div className="learning-option-note"><p>{user?'Drafts and accepted missions save to your account. Check the save status before leaving.':'Guest drafts stay on this device. Sign in for AI evaluation and synced progress.'}</p><a href="/learn?view=portfolio">See My Creations →</a></div>
   </section>
   <section className="account-card learning-option-card">
    <h2>Continue on WhatsApp</h2>
    <div className="learning-option-content"><p role={unavailable?'status':undefined}>{linked?<><strong>WhatsApp linked</strong> · Continue your current course in chat.</>:unavailable?'Your connection status could not load. Check Settings to retry.':'Link your number to continue the same course in chat.'}</p><ol>{chatSteps.map(step=><li key={step}>{step}</li>)}</ol></div>
    {linked?<a className="primary" href={whatsappLearningUrl('TODAY')} {...whatsappLinkProps}>Continue my mission on WhatsApp</a>:<a className="primary" href={user?'/settings?connect=whatsapp#whatsapp':chatGPTSignInPath('/settings?connect=whatsapp#whatsapp')}>{unavailable?'Check WhatsApp connection':user?'Connect WhatsApp':'Sign in to connect WhatsApp'}</a>}
    <div className="learning-option-note"><p>Optional. Your linked course, drafts and accepted missions sync. Get feedback where you submit your work. Check the save status before switching.</p><a href="/learn">Return to My Journey →</a>{linked&&<details><summary>Connection details</summary><p>The prefilled TODAY message opens the conversation; the link sends nothing automatically.</p><a href="/settings?connect=whatsapp#whatsapp">Connection and reminder status</a></details>}</div>
   </section>
  </div>
  {companionInstallUrl&&<details className="account-card" data-tour="chatgpt" style={{marginTop:24}}><summary>Optional: WhatsLearn in ChatGPT</summary><p>Use this separate chat for learning guidance. It does not share your website login or save mission progress.</p><a className="outline" href={companionInstallUrl} target="_blank" rel="noopener noreferrer">Open WhatsLearn in ChatGPT</a></details>}
 </AccountShell>;
}
