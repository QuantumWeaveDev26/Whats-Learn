/**
 * Direct WhatsApp chat with the WhatsLearn team (click-to-chat, wa.me). Opens WhatsApp with a prefilled message the visitor sends
 * themselves. It needs no Meta Business API tokens and sends nothing automatically. Automated lessons and reminders are separate:
 * they live in lib/whatsapp.ts and need the WHATSAPP_* Meta Business settings.
 */
export const whatsappContactNumber='919972965677';
export const whatsappLearningNumber='919187951536';
export const whatsappDefaultMessage='Hi, I’d like to speak with the WhatsLearn team.';
export function whatsappChatUrl(message:string=whatsappDefaultMessage){return `https://wa.me/${whatsappContactNumber}?text=${encodeURIComponent(message)}`}
export function whatsappLearningUrl(message:string='Hi, I’d like to learn with WhatsLearn.'){return `https://wa.me/${whatsappLearningNumber}?text=${encodeURIComponent(message)}`}
/** Spread onto every WhatsApp contact link so it opens in a new tab safely. */
export const whatsappLinkProps={target:'_blank',rel:'noopener noreferrer'} as const;

