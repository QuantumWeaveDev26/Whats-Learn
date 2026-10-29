/** Bright cartoon art for the game cards, drawn as SVG so it is crisp on every phone and costs no download. */
import type {GameId} from './games-data';

const bg:Record<GameId,[string,string]>={
 'hook-hunter':['#FF5F8F','#FF9A3D'],'budget-boss':['#12B76A','#0BA5A4'],'bug-hunt':['#7A5AF8','#4B3FD6'],'build-the-flow':['#2E90FA','#22CCEE'],
 'shot-order':['#FDB022','#F97316'],'guess-the-shot':['#F04438','#EC4899'],'story-dice':['#0BA5A4','#16B364'],'caption-it':['#6172F3','#9E77ED']
};
const W='#FFFFFF',INK='#1D2939',SH='rgba(16,24,40,.18)';

function Sparkles(){return <g fill={W} opacity=".85"><path d="M34 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M262 150l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="270" cy="38" r="4"/><circle cx="40" cy="160" r="3"/></g>}

const art:Record<GameId,React.ReactNode>={
 'hook-hunter':<g>
  <rect x="112" y="38" width="76" height="136" rx="14" fill={INK}/><rect x="118" y="48" width="64" height="116" rx="8" fill={W}/>
  <rect x="124" y="56" width="52" height="38" rx="6" fill="#FFD6E2"/><circle cx="140" cy="70" r="7" fill="#FF9A3D"/><path d="M126 92l16-14 12 10 8-6 14 10z" fill="#FF5F8F"/>
  <rect x="124" y="102" width="40" height="6" rx="3" fill="#D0D5DD"/><rect x="124" y="114" width="30" height="6" rx="3" fill="#D0D5DD"/>
  <path d="M152 140c-4-6-14-4-14 4 0 8 14 14 14 14s14-6 14-14c0-8-10-10-14-4z" fill="#F04438"/>
  <path d="M215 0v70c0 22-30 22-30 0" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round"/><path d="M185 70l-8-10" stroke={INK} strokeWidth="7" strokeLinecap="round"/>
 </g>,
 'budget-boss':<g>
  <rect x="160" y="110" width="22" height="50" rx="5" fill={W} opacity=".9"/><rect x="190" y="86" width="22" height="74" rx="5" fill={W} opacity=".9"/><rect x="220" y="58" width="22" height="102" rx="5" fill={W}/>
  <path d="M150 96l42-28 26 14 34-36" fill="none" stroke="#FDE047" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M240 40h16v16" fill="none" stroke="#FDE047" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
  {[0,1,2,3].map(i=><g key={i}><ellipse cx="90" cy={160-i*16} rx="42" ry="12" fill="#B45309"/><ellipse cx="90" cy={154-i*16} rx="42" ry="12" fill="#FBBF24"/></g>)}
  <circle cx="110" cy="72" r="26" fill="#FBBF24" stroke="#B45309" strokeWidth="5"/><text x="110" y="82" textAnchor="middle" fontSize="28" fontWeight="800" fill="#B45309" fontFamily="system-ui,sans-serif">₹</text>
 </g>,
 'bug-hunt':<g>
  <rect x="56" y="40" width="188" height="124" rx="14" fill={INK}/><rect x="56" y="40" width="188" height="24" rx="12" fill="#344054"/>
  <circle cx="72" cy="52" r="4" fill="#F04438"/><circle cx="86" cy="52" r="4" fill="#FDB022"/><circle cx="100" cy="52" r="4" fill="#12B76A"/>
  <rect x="72" y="78" width="70" height="7" rx="3.5" fill="#7A5AF8"/><rect x="150" y="78" width="40" height="7" rx="3.5" fill="#22CCEE"/>
  <rect x="84" y="96" width="96" height="7" rx="3.5" fill="#12B76A"/><rect x="84" y="114" width="56" height="7" rx="3.5" fill="#FDB022"/><rect x="72" y="132" width="80" height="7" rx="3.5" fill="#22CCEE"/>
  <g transform="translate(196 118)"><path d="M-14-6l-10-6M14-6l10-6M-16 4h-12M16 4h12M-12 14l-9 8M12 14l9 8" stroke={INK} strokeWidth="4" strokeLinecap="round"/>
   <ellipse cx="0" cy="6" rx="16" ry="18" fill="#F04438"/><path d="M0-12v36" stroke={INK} strokeWidth="3"/><circle cx="-7" cy="2" r="4" fill={INK}/><circle cx="8" cy="12" r="4" fill={INK}/>
   <circle cx="0" cy="-14" r="9" fill={INK}/><circle cx="-3" cy="-16" r="2.5" fill={W}/><circle cx="4" cy="-16" r="2.5" fill={W}/></g>
  <circle cx="232" cy="66" r="22" fill="rgba(255,255,255,.25)" stroke={W} strokeWidth="7"/><path d="M248 82l18 18" stroke={W} strokeWidth="9" strokeLinecap="round"/>
 </g>,
 'build-the-flow':<g>
  {[[40,'#FFFFFF'],[118,'#E0F2FE'],[196,'#FFFFFF']].map(([x,f],i)=><g key={i} transform={`translate(${x} ${i===1?40:56})`}>
   <rect width="64" height="112" rx="12" fill={INK}/><rect x="5" y="8" width="54" height="96" rx="7" fill={f as string}/>
   <rect x="11" y="16" width="42" height="26" rx="5" fill={['#2E90FA','#FDB022','#12B76A'][i]}/><rect x="11" y="50" width="34" height="6" rx="3" fill="#D0D5DD"/><rect x="11" y="62" width="26" height="6" rx="3" fill="#D0D5DD"/>
   <rect x="11" y="82" width="42" height="12" rx="6" fill={['#2E90FA','#FDB022','#12B76A'][i]}/></g>)}
  <path d="M108 112h8M186 112h8" stroke={W} strokeWidth="6" strokeLinecap="round"/><path d="M112 104l8 8-8 8M190 104l8 8-8 8" fill="none" stroke={W} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
 </g>,
 'shot-order':<g>
  <g transform="translate(46 58) rotate(-8)"><rect width="110" height="78" rx="8" fill={INK}/><rect x="8" y="30" width="94" height="40" rx="4" fill="#344054"/>
   <path d="M0 0h110v22H0z" fill={W}/><path d="M10 0l14 22M38 0l14 22M66 0l14 22M94 0l14 22" stroke={INK} strokeWidth="10"/>
   <rect x="14" y="40" width="50" height="6" rx="3" fill="#98A2B3"/><rect x="14" y="54" width="34" height="6" rx="3" fill="#98A2B3"/></g>
  {[0,1,2].map(i=><g key={i} transform={`translate(${168+i*0} ${44+i*42})`}><rect width="96" height="36" rx="6" fill={INK}/>
   {[6,22,38,54,70,86].map(x=><rect key={x} x={x} y="3" width="6" height="5" rx="1" fill={W}/>)}{[6,22,38,54,70,86].map(x=><rect key={x} x={x} y="28" width="6" height="5" rx="1" fill={W}/>)}
   <rect x="8" y="10" width="80" height="16" rx="3" fill={['#FDE68A','#FED7AA','#FECACA'][i]}/><text x="48" y="23" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK} fontFamily="system-ui,sans-serif">{i+1}</text></g>)}
 </g>,
 'guess-the-shot':<g>
  <circle cx="104" cy="62" r="26" fill={INK}/><circle cx="104" cy="62" r="10" fill="#475467"/><circle cx="158" cy="62" r="26" fill={INK}/><circle cx="158" cy="62" r="10" fill="#475467"/>
  <rect x="64" y="88" width="132" height="70" rx="14" fill={INK}/><path d="M196 104l40-20v78l-40-20z" fill="#344054"/>
  <circle cx="110" cy="123" r="22" fill="#475467"/><circle cx="110" cy="123" r="13" fill="#22CCEE"/><circle cx="104" cy="117" r="4" fill={W}/>
  <circle cx="176" cy="100" r="5" fill="#F04438"/>
  <g transform="translate(238 46)"><circle r="30" fill={W}/><text y="15" textAnchor="middle" fontSize="44" fontWeight="900" fill="#F04438" fontFamily="system-ui,sans-serif">?</text></g>
 </g>,
 'story-dice':<g>
  <g transform="translate(58 74) rotate(-14)"><rect width="66" height="66" rx="14" fill={W}/><path d="M33 14l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#FDB022"/></g>
  <g transform="translate(118 46) rotate(6)"><rect width="70" height="70" rx="15" fill="#FEF3C7"/><path d="M35 54C18 42 14 34 14 27c0-7 6-12 12-12 4 0 7 2 9 5 2-3 5-5 9-5 6 0 12 5 12 12 0 7-4 15-21 27z" fill="#F04438"/></g>
  <g transform="translate(184 92) rotate(-6)"><rect width="64" height="64" rx="14" fill={W}/><path d="M32 14l20 17v19H12V31z" fill="#2E90FA"/><rect x="27" y="36" width="10" height="14" rx="2" fill={W}/></g>
 </g>,
 'caption-it':<g>
  <g transform="translate(70 26) rotate(-4)"><rect width="150" height="112" rx="10" fill={W}/><rect x="10" y="10" width="130" height="80" rx="6" fill="#BAE6FD"/>
   <circle cx="110" cy="34" r="12" fill="#FDB022"/><path d="M10 90l40-40 28 26 18-14 44 28z" fill="#12B76A"/><path d="M10 90l40-40 20 18-30 22z" fill="#0BA5A4"/></g>
  <g transform="translate(104 136)"><path d="M0 0h140a14 14 0 0 1 14 14v18a14 14 0 0 1-14 14H40l-16 14v-14H14A14 14 0 0 1 0 32V14A14 14 0 0 1 14 0z" fill={INK}/>
   <circle cx="54" cy="23" r="5" fill={W}/><circle cx="76" cy="23" r="5" fill={W}/><circle cx="98" cy="23" r="5" fill={W}/></g>
 </g>
};

export function GameArt({id}:{id:GameId}){
 const [a,b]=bg[id];
 return <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id={`ga-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient></defs>
  <rect width="300" height="200" fill={`url(#ga-${id})`}/>
  <circle cx="250" cy="180" r="70" fill="rgba(255,255,255,.12)"/><circle cx="30" cy="10" r="50" fill="rgba(255,255,255,.10)"/>
  <ellipse cx="150" cy="188" rx="110" ry="10" fill={SH}/>
  <Sparkles/>
  {art[id]}
 </svg>;
}
