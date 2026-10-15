import {whatsappChatUrl,whatsappLinkProps} from '@/lib/contact';
import type {Metadata} from 'next';
import LegalPage from '@/components/whatslearn/legal-page';
export const metadata:Metadata={title:'Terms of use · WhatsLearn',description:'The terms for learning with WhatsLearn.'};
export default function Terms(){return <LegalPage kicker="THE GROUND RULES." title={<>Terms of <em>use.</em></>} updated="10 October 2026">
<p>These terms apply when you use whatslearn.in and the WhatsLearn ChatGPT companion, provided by BrandMint AI Pvt. Ltd. (“we”, “us”). By using WhatsLearn you agree to them.</p>
<h2>1. What WhatsLearn is</h2>
<p>WhatsLearn offers short practice missions in AI digital marketing, AI full-stack development, AI filmmaking and AI-powered visual storytelling. Missions include prepared guidance, knowledge checks and self-review. Some features, including WhatsApp lessons and reminders, paid plans and live AI review of your writing, work only when we have switched them on; until then they are labelled on the site.</p>
<h2>2. Who can use it</h2>
<p>You should be 16 or older. If you are under 18, a parent or guardian should agree to these terms with you.</p>
<h2>3. Your work</h2>
<p>You own the creations you make. You give us permission to store and show them back to you so the service can work. Only submit content you have the right to use. Do not submit anything unlawful, hateful, misleading or that shares someone else’s personal information without permission.</p>
<h2>4. Using AI responsibly</h2>
<p>Missions may ask you to use third-party AI tools. Follow those tools’ terms, check facts and claims yourself, get consent from anyone you film or depict, respect copyright, and disclose AI-generated content where it matters.</p>
<h2>5. Practice feedback, not certification</h2>
<p>XP, coins, badges, stars and self-reviews are motivation and practice feedback. They are not a certified assessment, qualification or promise of a job, income or placement.</p>
<h2>6. Plans and prices</h2>
<p>Prices on the Membership page are launch prices in Indian rupees, including applicable taxes. Until checkout opens, choosing a plan only records a preference and nothing is charged. When checkout is open, payments are processed by Razorpay. A Skill Sprint is a one-time payment that gives seven days of sprint access. Monthly and annual memberships renew automatically at the end of each period until you cancel. Teams is billed monthly per learner, with a minimum of five learners. Paid access starts only after Razorpay confirms the payment.</p>
<h2>7. Cancellations and refunds</h2>
<p>You can cancel future renewals at any time; you keep access until the end of the period you have paid for. Refunds follow our <a href="/refunds">Refund and cancellation policy</a>, which forms part of these terms.</p>
<h2>8. AI feedback and WhatsApp messages</h2>
<p>AI feedback is generated automatically and can be incomplete or wrong. Use it as a suggestion, not as professional, legal or financial advice. Daily allowances apply and may change. WhatsApp lessons and reminders are sent only after you opt in, and you can stop them by replying STOP. Standard data charges from your mobile provider may apply.</p>
<h2>9. Other websites</h2>
<p>We link to partner and tool websites. Their own terms and policies apply, and we are not responsible for their content.</p>
<h2>10. Availability and liability</h2>
<p>We work to keep WhatsLearn available and accurate, but it is provided “as is”. To the extent the law allows, we are not liable for indirect losses, and our total liability is limited to the amount you paid us in the three months before a claim.</p>
<h2>11. Law</h2>
<p>These terms are governed by the laws of India, and the courts of Bengaluru, Karnataka have jurisdiction.</p>
<h2>12. Contact and grievances</h2>
<p>For complaints about content or these terms, contact our Grievance Officer as set out in the <a href="/privacy">Privacy policy</a>, in line with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. For anything else, email <a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a> or <a href={whatsappChatUrl()} {...whatsappLinkProps}>message us on WhatsApp</a>.</p>
</LegalPage>}
