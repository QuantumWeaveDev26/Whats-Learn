import {whatsappChatUrl,whatsappLinkProps} from '@/lib/contact';
import type {Metadata} from 'next';
import LegalPage from '@/components/whatslearn/legal-page';
export const metadata:Metadata={title:'Refund and cancellation policy · WhatsLearn',description:'How cancellations, renewals and refunds work for WhatsLearn sprints and memberships.'};
export default function Refunds(){return <LegalPage kicker="CLEAR MONEY. NO SURPRISES." title={<>Refunds and <em>cancellation.</em></>} updated="10 October 2026">
<p>This policy applies to payments made to BrandMint AI Pvt. Ltd. for WhatsLearn through Razorpay. It forms part of our <a href="/terms">Terms of use</a>. Nothing here limits your rights under the Consumer Protection Act, 2019.</p>
<p className="small muted">Points marked “Proposed” are suggested starting values. The owner must confirm them before paid plans open.</p>
<h2>1. Free plan</h2>
<p>Explore is free. Nothing is charged and nothing needs cancelling.</p>
<h2>2. Skill Sprint (₹149, one-time)</h2>
<ul>
<li>Your seven days of sprint access start when Razorpay confirms the payment.</li>
<li><strong>Proposed:</strong> if you have not opened any sprint challenge, you can ask for a full refund within 48 hours of paying.</li>
<li>Once you have started the sprint, it is not refundable, but you keep access for the full seven days.</li>
<li>First-sprint credit: if you buy your first monthly Plus or Pro membership within seven days of a sprint, the ₹149 counts towards that first month, as stated on the Membership page. The credit is not paid out as cash.</li>
</ul>
<h2>3. Monthly and annual memberships (Plus, Pro, Teams)</h2>
<ul>
<li>Memberships renew automatically: monthly plans every month, annual plans every year, Teams every month.</li>
<li>You can cancel future renewals at any time from the Membership page, or by writing to us. Cancelling stops the next charge; you keep access until the end of the period you have already paid for.</li>
<li><strong>Proposed:</strong> for your first payment on a membership, you can ask for a full refund within 7 days if you have used no more than two AI feedback rounds in that period.</li>
<li>We do not give partial refunds for unused days, sprints or AI feedback rounds after that, and unused monthly allowances do not carry over.</li>
<li><strong>Proposed:</strong> annual plans cancelled within 14 days of the first annual payment can be refunded in full, less any monthly allowance already used at the monthly price.</li>
</ul>
<h2>4. Charges we always refund</h2>
<ul>
<li>A duplicate charge for the same purchase.</li>
<li>A charge where Razorpay confirms the payment but paid access was not activated and we cannot fix it within 3 working days.</li>
<li>A renewal charged after you cancelled in time.</li>
</ul>
<h2>5. How to ask for a refund</h2>
<p>Email <a href="mailto:connect@brandmintai.io?subject=Refund%20request">connect@brandmintai.io</a> with the subject “Refund request”, or <a href={whatsappChatUrl('Hi, I’d like help with a WhatsLearn refund.')} {...whatsappLinkProps}>message us on WhatsApp</a>, from the email linked to your account. Include the date, amount and the Razorpay payment ID from your receipt. We reply within 2 working days.</p>
<h2>6. When the money reaches you</h2>
<p>Approved refunds go back to the original payment method through Razorpay. Banks and card issuers usually take 5–7 working days to show the refund; UPI refunds are often faster. When a sprint is refunded in full, its access ends.</p>
<h2>7. Failed payments</h2>
<p>If money leaves your account but the payment fails, Razorpay or your bank returns it automatically, usually within 5–7 working days. Contact us if it has not arrived after that and we will follow up with Razorpay.</p>
<h2>8. Changes to prices or this policy</h2>
<p>We will show any price change on the Membership page and tell existing members before their next renewal. Changes to this policy do not affect payments made before the change.</p>
<h2>9. Grievances</h2>
<p>If you are unhappy with how we handled a refund, contact our Grievance Officer as set out in the <a href="/privacy">Privacy policy</a>.</p>
</LegalPage>}
