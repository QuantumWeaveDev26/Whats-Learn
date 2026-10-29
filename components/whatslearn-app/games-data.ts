/** Practice content for the app's mini-games. Two short games per course; each round teaches one idea from that course. */
export type GameId='hook-hunter'|'budget-boss'|'bug-hunt'|'build-the-flow'|'shot-order'|'guess-the-shot'|'story-dice'|'caption-it';
export type GameMeta={id:GameId;track:'marketing'|'development'|'filmmaking'|'storytelling';name:string;tagline:string;how:string;minutes:number};
export const games:GameMeta[]=[
 {id:'hook-hunter',track:'marketing',name:'Hook Hunter',tagline:'Spot the posts that stop the scroll.',how:'Swipe through a feed. Keep posts with a strong hook, skip the weak ones.',minutes:1},
 {id:'budget-boss',track:'marketing',name:'Budget Boss',tagline:'Spend ₹5,000 where it works.',how:'Split the budget across channels to fit each business goal.',minutes:2},
 {id:'bug-hunt',track:'development',name:'Bug Hunt',tagline:'Find the broken line before time runs out.',how:'Tap the line that causes the bug. 25 seconds per round.',minutes:2},
 {id:'build-the-flow',track:'development',name:'Build the Flow',tagline:'Put app screens in the right order.',how:'Tap the screens in the order a user would see them.',minutes:1},
 {id:'shot-order',track:'filmmaking',name:'Shot Order',tagline:'Arrange frames into a clear story.',how:'Tap the frames in the order that tells the story.',minutes:1},
 {id:'guess-the-shot',track:'filmmaking',name:'Guess the Shot',tagline:'Name the camera shot from the frame.',how:'Look at the framing and pick the shot type.',minutes:1},
 {id:'story-dice',track:'storytelling',name:'Story Dice',tagline:'Roll three things. Tell a story in 3 frames.',how:'Use all three rolled items across a beginning, a change and an ending.',minutes:2},
 {id:'caption-it',track:'storytelling',name:'Caption It',tagline:'Pick the caption that makes the picture land.',how:'Choose the caption that is clear, specific and fits the image.',minutes:1}
];

export const hookFeed=[
 {post:'Lunch at your desk by 12:45. Skip the queue. Reply LUNCH on WhatsApp.',strong:true,why:'A clear benefit, a time and one action.'},
 {post:'We are a company that makes food.',strong:false,why:'No customer, no benefit, no reason to stop.'},
 {post:'Only 20 seats left for Saturday’s pottery class in Jayanagar. Book on WhatsApp.',strong:true,why:'Specific, a little urgent, one next step.'},
 {post:'New post! Check it out.',strong:false,why:'Says nothing about why it matters to the reader.'},
 {post:'Tired of cold chai by 11 am? This flask keeps it hot for 6 hours.',strong:true,why:'Starts with a problem the reader feels.'},
 {post:'Our brand believes in quality and excellence.',strong:false,why:'Vague claims every brand makes.'},
 {post:'Students: print 50 pages for ₹99 today, 2 minutes from campus.',strong:true,why:'Names the audience, the offer and the place.'},
 {post:'Follow us for more updates.',strong:false,why:'Asks for something without giving a reason.'}
];

export const channels=['Instagram','Google Search','WhatsApp','Local flyers'] as const;
export const budgetRounds=[
 {goal:'A new café near a college wants walk-ins this week.',ideal:[40,15,10,35],why:'Students discover places on Instagram; flyers on campus reach people walking past.'},
 {goal:'A plumber wants calls from people searching for “leak repair near me”.',ideal:[10,70,10,10],why:'People with a leak search right now. Search ads meet that intent.'},
 {goal:'A tiffin service wants repeat orders from its 200 current customers.',ideal:[10,5,75,10],why:'You already have these customers’ attention. A direct WhatsApp message is cheapest and most personal.'}
];

export const bugRounds=[
 {title:'Count the free seats',lines:['function freeSeats(total, booked) {','  const free = total - booked;','  if (free > 0) return "Full";','  return free;','}'],bug:2,why:'The check is reversed. It says “Full” when seats are free.'},
 {title:'Add up a cart',lines:['let sum = 0;','for (let i = 0; i <= items.length; i++) {','  sum += items[i].price;','}','return sum;'],bug:1,why:'<= runs one step too far and reads an item that does not exist.'},
 {title:'Block past bookings',lines:['function isPast(slot) {','  const now = Date.now();','  return slot.time > now;','}'],bug:2,why:'A past slot is earlier than now, so it should be slot.time < now.'},
 {title:'Check an admin',lines:['function canEdit(user) {','  if (user.role = "admin") {','    return true;','  }','  return false;','}'],bug:1,why:'A single = assigns a value instead of comparing. Use ===.'},
 {title:'Apply a 10% discount',lines:['function finalPrice(price) {','  const discount = price * 10 / 100;','  return price + discount;','}'],bug:2,why:'A discount should be taken off: price - discount.'}
];

export const flowRounds=[
 {title:'Book a haircut',steps:['Choose a service','Pick a date and time','Enter your name and phone','Pay or confirm','See the confirmation'],why:'Choose what and when before collecting contact details. Confirm after those choices, then show a receipt so the customer knows the booking succeeded.'},
 {title:'Sign up for a course',steps:['Open the course page','Tap “Start free”','Create an account','Answer setup questions','Start task 1'],why:'Explain the course before asking for an account. Setup then adapts the first task to the learner; it should not interrupt a task already in progress.'},
 {title:'Ask for a refund',steps:['Open my orders','Choose the order','Tap “Request refund”','Pick a reason','See the refund status'],why:'Identify the correct order before requesting a refund. Collect the reason, then show a status so the customer can distinguish a request from a completed refund.'}
];

export const shotRounds=[
 {title:'The first cake',frames:['A nervous baker holds her first cake','A customer walks into the café','The customer takes a bite and smiles','The baker finally relaxes and smiles back'],why:'Establish the baker’s worry, introduce the customer, show the response, then resolve the worry. The reaction earns the ending.'},
 {title:'The lost umbrella',frames:['A girl leaves her umbrella on the bus seat','Rain starts as the bus drives away','A stranger runs after her with the umbrella','She laughs, soaked but grateful'],why:'Show the forgotten object before the rain makes it a problem. The stranger’s action changes the situation, so the grateful reaction follows it.'},
 {title:'Morning delivery',frames:['An alarm rings at 5 am','A delivery rider loads hot tiffins','He races through traffic','An office worker opens a warm lunch box'],why:'Start with preparation, then the journey, then its payoff. Showing the warm lunch last connects the rider’s effort to the customer’s benefit.'}
];

/** Framing data for drawn frames: how big the figure is and where it sits. */
export const shotTypes=[
 {name:'Wide shot',scale:.35,ty:128,ots:false},
 {name:'Medium shot',scale:1.15,ty:150,ots:false},
 {name:'Close-up',scale:2.4,ty:230,ots:false},
 {name:'Extreme close-up',scale:5,ty:385,ots:false},
 {name:'Over-the-shoulder',scale:1.2,ty:150,ots:true}
];
export const shotQuiz=[0,2,1,4,3,2];

export const diceItems=['coffee','bike','umbrella','phone','key','dog','rocket','book','music','camera','tree','cake'] as const;
export const captionRounds=[
 {scene:'A rain-soaked street at night. One bright yellow umbrella in the crowd.',options:['Nice picture','In a grey city, be the yellow umbrella.','Rain rain rain rain','This is a street'],best:1,why:'It names the visual detail and turns it into a feeling.'},
 {scene:'A tiffin box opened on an office desk, steam rising.',options:['Food','Lunch that still feels like home, even at 1 pm.','Buy now buy now','A box on a desk'],best:1,why:'It speaks to the viewer’s feeling, not just what is in the frame.'},
 {scene:'A small potter’s hands shaping clay on a wheel.',options:['Hands','Slow hands. Real things. Book a Saturday class.','Clay is made of earth','Wow amazing'],best:1,why:'It matches the mood and ends with one clear action.'},
 {scene:'An empty classroom with one student still writing.',options:['Classroom photo','The last one to leave is the first to finish.','Students sit here','Study study'],best:1,why:'It adds a twist that makes people look again.'}
];
