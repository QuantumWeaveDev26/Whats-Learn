/** Authored practice scenarios. Keep additions append-only so saved deck positions remain useful. */
export const extraHooks=[
 {post:'Your laptop goes flat before lunch? Bring it in for a battery check this Saturday.',strong:true,why:'Names a familiar problem and a specific next step.'},
 {post:'We provide innovative solutions for all your needs.',strong:false,why:'There is no identifiable customer, offer or action.'},
 {post:'First 5 km run? Join our beginner group at Cubbon Park, Sunday at 7 am.',strong:true,why:'A specific audience, meeting place and time make this actionable.'},
 {post:'Great news from our team today!',strong:false,why:'The reader cannot tell what the news is or why it matters.'},
 {post:'Parents near HSR: try one Saturday robotics class before choosing a monthly plan.',strong:true,why:'Names the audience and lowers the commitment of the first step.'},
 {post:'Robotics robotics robotics. Register now.',strong:false,why:'Repetition does not explain the value of the class.'},
 {post:'Need a quiet desk for two hours? Book a study seat near the metro for ₹80.',strong:true,why:'Connects a concrete need to a clear, local offer.'},
 {post:'Our workspace is the ultimate game changer.',strong:false,why:'An unsupported superlative gives the reader no practical detail.'},
 {post:'Your balcony gets only morning sun? See three plants that suit that light.',strong:true,why:'A specific situation gives the reader a reason to keep reading.'},
 {post:'Plants available. Please support us.',strong:false,why:'It asks for support without offering a relevant benefit.'},
 {post:'Moving this weekend? Compare our van sizes and choose one that fits your boxes.',strong:true,why:'Addresses an immediate task and offers useful decision help.'},
 {post:'We are delighted to announce our continued commitment.',strong:false,why:'The sentence focuses on the company without saying what changes for the customer.'},
 {post:'Only have a phone? Make your first 30-second product video in Saturday’s workshop.',strong:true,why:'Names a constraint and a concrete thing the learner can make.'},
 {post:'Become successful instantly. Guaranteed.',strong:false,why:'An unsupported guarantee replaces a credible, specific offer.'},
 {post:'Office lunch for six? Pick one delivery slot and label every meal by name.',strong:true,why:'It describes a real coordination problem and a practical benefit.'},
 {post:'Click this mysterious link for something amazing.',strong:false,why:'It hides the destination and benefit, weakening trust.'},
 {post:'Cyclists: learn to fix a puncture at our free 20-minute repair demo on Sunday.',strong:true,why:'The audience, skill, duration and next occasion are all clear.'},
 {post:'Premium quality. Best service. Excellent value.',strong:false,why:'Generic claims do not distinguish the offer.'},
 {post:'Before you print 100 invitations, check these three details on a sample copy.',strong:true,why:'Offers a useful check before a potentially wasteful decision.'},
 {post:'We have many exciting things happening soon.',strong:false,why:'Nothing is specific enough for the reader to act on.'},
 {post:'New to cooking? Start with a five-ingredient dinner and a step-by-step shopping list.',strong:true,why:'Matches a beginner’s need with a manageable outcome.'},
 {post:'Everyone everywhere needs this product.',strong:false,why:'An audience that broad does not explain whose problem is solved.'},
 {post:'Your interview is tomorrow? Practise three answers in a 15-minute guided session.',strong:true,why:'Connects a timely problem to a bounded, relevant activity.'},
 {post:'Limited offer! Limited offer! Limited offer!',strong:false,why:'Urgency without the actual offer provides no decision-making information.'}
];

export const extraBudgets=[
 {goal:'A bicycle repair shop wants to reach people searching for a puncture repair nearby.',ideal:[10,65,10,15],why:'Give search the largest share to meet immediate repair intent. Nearby flyers support local discovery.'},
 {goal:'A bakery has a list of 300 opted-in customers and wants repeat birthday-cake orders.',ideal:[15,10,65,10],why:'The existing opted-in list is the most direct audience. Reserve a smaller share for discovery.'},
 {goal:'A beginner pottery workshop wants new students who enjoy watching the making process.',ideal:[55,15,10,20],why:'Visual demonstrations suit Instagram discovery. Local flyers reach people who can attend.'},
 {goal:'An emergency electrician needs calls from people actively seeking help in the neighbourhood.',ideal:[5,75,5,15],why:'Search meets an urgent, already expressed need. Broad visual discovery is a weaker fit.'},
 {goal:'A campus book exchange has no customer list and needs students to visit a stall tomorrow.',ideal:[30,10,5,55],why:'The stall has a short window and a very local audience. Campus flyers and local social discovery suit that constraint.'},
 {goal:'A dance school wants people to discover a new class through short performance clips.',ideal:[60,15,10,15],why:'The creative is visual, so social discovery gets the largest share. Search can catch people already looking for classes.'},
 {goal:'A laundry service wants its 150 opted-in regular customers to book next week’s pickup.',ideal:[10,10,70,10],why:'Repeat bookings from a known, opted-in audience favour direct messages over broad acquisition.'},
 {goal:'A local maths tutor wants enquiries from parents searching for tuition near their school.',ideal:[15,55,10,20],why:'Search matches parents already looking for a tutor. Nearby distribution can support school-area awareness.'},
 {goal:'A new weekend craft market wants nearby visitors to discover stalls through product photos.',ideal:[45,15,5,35],why:'Product images support discovery while local flyers reach people close enough to visit.'}
];

export const extraBugs=[
 {title:'Read a fetched profile',lines:['async function loadProfile() {','  const response = fetch("/profile");','  return response.json();','}'],bug:1,why:'fetch returns a promise. Await it before calling json on the response.'},
 {title:'Average all the values',lines:['function average(values) {','  if (!values.length) return 0;','  const sum = values.reduce((a, b) => a + b, 0);','  return sum / (values.length - 1);','}'],bug:3,why:'An average divides by the number of values, not one fewer.'},
 {title:'Start a numeric total',lines:['let total = "";','for (const item of items) {','  total += item.price;','}','return total;'],bug:0,why:'Start at numeric 0. An empty string makes + concatenate values instead of adding them.'},
 {title:'Allow ages 18 through 65',lines:['function allowed(age) {','  if (age >= 18 || age <= 65) return true;','  return false;','}'],bug:1,why:'Both bounds must hold, so use &&. With ||, even an age outside the interval can pass.'},
 {title:'Sort numeric prices in place',lines:['function sortPrices(prices) {','  return prices.sort();','}'],bug:1,why:'The default sort compares strings. Use sort((a, b) => a - b) for numeric order.'},
 {title:'Return doubled numbers',lines:['function double(values) {','  return values.map(n => { n * 2; });','}'],bug:1,why:'A braced arrow body needs return. Use n => n * 2, or explicitly return n * 2.'},
 {title:'Compare emails without case differences',lines:['function emailKey(email) {','  const key = email.trim();','  return key;','}'],bug:1,why:'This key is intended to ignore case. Normalise the trimmed value with toLowerCase before comparing it.'},
 {title:'Deny access when nobody is signed in',lines:['function canRead(user) {','  if (!user) return true;','  return user.active === true;','}'],bug:1,why:'A missing user must return false for this protected action.'},
 {title:'Count every available product',lines:['let count = 0;','for (const product of products) {','  if (product.available) count = 1;','}','return count;'],bug:2,why:'Assigning 1 resets the count. Increment it for each available product.'},
 {title:'Convert minutes to milliseconds',lines:['function toMilliseconds(minutes) {','  return minutes * 1000;','}'],bug:1,why:'A minute has 60 seconds. Multiply minutes by 60 * 1000.'},
 {title:'Keep zero as a valid quantity',lines:['function quantityOrDefault(quantity) {','  return quantity || 1;','}'],bug:1,why:'|| replaces valid zero because it is falsy. Use quantity ?? 1 to default only missing values.'},
 {title:'Remove an item even at index zero',lines:['const index = items.indexOf(target);','if (index) {','  items.splice(index, 1);','}'],bug:1,why:'Index 0 is valid and -1 means not found. Test index >= 0.'},
 {title:'Calculate the price of several tickets',lines:['function ticketTotal(price, quantity) {','  return price + quantity;','}'],bug:1,why:'Multiply unit price by quantity. Addition does not calculate the total ticket cost.'},
 {title:'Count only unread messages',lines:['function unreadCount(messages) {','  return messages.filter(m => m.read === true).length;','}'],bug:1,why:'The function asks for unread messages. Filter for read === false.'},
 {title:'Wait for all image downloads',lines:['async function downloadAll(urls) {','  const jobs = urls.map(url => download(url));','  await jobs;','  return "Ready";','}'],bug:2,why:'Awaiting the array does not await its promises. Use await Promise.all(jobs).'}
];

export const extraFlows=[
 {title:'Borrow a library book',steps:['Search the catalogue','Choose an available copy','Request the loan','See the due date'],why:'Choose an available copy before creating a loan. Show the due date only after the loan is confirmed.'},
 {title:'Upload a project file',steps:['Choose a file','Check its type and size','Upload the file','Confirm it is saved'],why:'Validate the selected file before uploading, then show success after storage is confirmed.'},
 {title:'Reset a forgotten password',steps:['Enter the account email','Request a reset link','Open the valid reset link','Choose a new password','See the reset confirmation'],why:'The valid link establishes permission to reset. Set the password before confirming completion.'},
 {title:'Reserve a cinema seat',steps:['Choose a film and showtime','Select available seats','Review the booking','Pay for the seats','See the ticket'],why:'Film and showtime determine available seats. Review before paying, then issue the ticket after confirmation.'},
 {title:'Track a food delivery',steps:['Open the order history','Choose the active order','View its delivery status','Open help if it is delayed'],why:'Identify the active order before checking its status. The displayed delay gives context for contacting help.'},
 {title:'Publish a reviewed draft',steps:['Open the draft','Review the content','Preview the final layout','Confirm publication','See the published page'],why:'Content and layout checks precede the deliberate publishing action. Show the published state after confirmation.'},
 {title:'Create a study reminder',steps:['Write the reminder','Choose a future time','Allow reminders if needed','Save the reminder','See the scheduled reminder'],why:'Set content and timing first. Resolve required permission before confirming that scheduling succeeded.'},
 {title:'Join a live workshop',steps:['Open the workshop details','Check the date and requirements','Reserve a place','Receive joining instructions','Join at the scheduled time'],why:'Check suitability before reserving. Joining instructions follow a reservation and are used at the scheduled time.'},
 {title:'Return a borrowed tool',steps:['Open the active loan','Choose the return option','Confirm the return condition','Receive a return receipt'],why:'The active loan identifies the tool. Confirm its return before issuing a receipt.'},
 {title:'Change a delivery address before dispatch',steps:['Open the active order','Check that changes are allowed','Enter the new address','Confirm the updated address'],why:'Check the order can still change before collecting a replacement address. Confirm only after the update succeeds.'},
 {title:'Submit a support report',steps:['Choose the affected feature','Describe the problem','Review the report','Send the report','See the reference number'],why:'Provide the problem details before reviewing and sending. A reference number follows successful submission.'},
 {title:'Export saved learning work',steps:['Open saved creations','Choose the work to export','Choose an export format','Create the export','Save the exported file'],why:'The selection and format determine the export. Generate the file before asking the learner to save it.'}
];

export const extraShots=[
 {title:'The flat bicycle tyre',frames:['A cyclist notices the flat tyre','She finds a repair kit in her bag','She patches and inflates the tyre','She rides away smiling'],why:'Introduce the problem, find the means to solve it, show the repair, then show its result.'},
 {title:'The library note',frames:['A student cannot find the reserved book','The librarian finds a note naming another shelf','They retrieve the book from that shelf','The student settles down to read'],why:'The missing book creates the question. The note leads to the discovery, which enables the final action.'},
 {title:'The last bus',frames:['A worker sees the last bus approaching','He runs towards the bus stop','The driver waits as he reaches the door','He takes a seat and catches his breath'],why:'Establish the approaching deadline, show the effort, then the successful boarding and relief.'},
 {title:'The paper boat',frames:['A child folds a sheet into a boat','She lowers the boat into a puddle','A breeze pushes it across the water','She runs alongside it laughing'],why:'The boat must exist before it can be launched. Its movement gives the child something to follow.'},
 {title:'The first seedling',frames:['A gardener plants a seed in a pot','She waters the pot over several days','A small green shoot appears','She moves the seedling towards the light'],why:'Planting and care establish the cause. The shoot is the change that motivates moving the seedling.'},
 {title:'The dropped birthday cake',frames:['A family carries a birthday cake towards the table','The box slips and the icing is damaged','They cover the damaged patch with fruit','The birthday child blows out the candles'],why:'Show the intended celebration, the accident, the repair and the celebration that the repair allows.'},
 {title:'The missing dog',frames:['A child notices the garden gate is open and the dog is gone','The family follows muddy paw prints','They find the dog beside a neighbour’s water bowl','They return home and close the gate'],why:'The disappearance starts the search. A clue leads to the discovery, then the family resolves the situation.'},
 {title:'The dark rehearsal room',frames:['The lights go out during a rehearsal','The actors stop and look towards the door','A caretaker restores the power','The actors return to their opening positions'],why:'The power failure causes the interruption. Restoring power enables rehearsal to restart.'},
 {title:'The rain-soaked shoes',frames:['A runner steps into a deep puddle','He stops beside a bench with wet shoes','He changes into the dry pair in his bag','He rejoins the running group'],why:'The puddle creates the problem. Stopping enables the change, and the change enables him to continue.'},
 {title:'The torn poster',frames:['A shopkeeper finds the new poster torn','She takes it down and brings out a spare','She fixes the spare neatly to the board','Customers stop to read the new display'],why:'Discover the damaged poster before replacing it. The completed display must exist before it can attract attention.'},
 {title:'The forgotten presentation cable',frames:['A speaker discovers the laptop cannot connect to the projector','She asks the organiser for the missing cable','The organiser brings a compatible cable','The first slide appears on the screen'],why:'Establish the connection problem, request what is missing, supply it, then show the working result.'},
 {title:'The quiet café delivery',frames:['A courier arrives carrying a stack of cups','The café owner clears a space on the counter','The courier sets the cups in that space','The owner begins preparing the next order'],why:'The arrival creates a need for space. Clearing it enables unloading, which enables the café to use the supplies.'}
];

export const extraCaptions=[
 {scene:'A bicycle mechanic patches a tyre beside a waiting commuter.',options:['Back on the road starts with one small repair.','Amazing awesome wow','A person is here','Buy everything today'],best:0,why:'Connects the visible repair to the commuter’s practical outcome.'},
 {scene:'A child’s paper boat floats across a small puddle.',options:['Paper','It is wet outside','A small boat. A whole afternoon of adventure.','Water is a liquid'],best:2,why:'Uses the specific object to add a feeling that fits the scene.'},
 {scene:'A student studies under a desk lamp while the rest of the room is dark.',options:['Room tour','The desk has four legs','Everyone must study all night','One quiet page at a time.'],best:3,why:'Fits the focused mood without inventing a result or pressuring the viewer.'},
 {scene:'Freshly repaired shoes sit beside a worn pair of laces.',options:['More journeys, same favourite pair.','Shoes shoes','A big discount on unrelated phones','Something happened'],best:0,why:'Links the visible repair to continued use of the same pair.'},
 {scene:'A gardener holds a tiny seedling in a clay pot.',options:['The world’s biggest tree, guaranteed tomorrow','Small roots. A patient beginning.','Object photo','Green green green'],best:1,why:'Matches the small plant and avoids an unsupported growth promise.'},
 {scene:'A baker dusts flour from an apron after placing bread on a cooling rack.',options:['Nice','This is definitely the best bread in the world','The morning’s work, ready to share.','Click a mystery link'],best:2,why:'Connects the visible completed work to a natural next moment.'},
 {scene:'An empty running track glows in the early morning light.',options:['Guaranteed instant fitness','A place','Track track track','Before the noise, one lap for yourself.'],best:3,why:'Uses the quiet setting to suggest a modest, relevant action.'},
 {scene:'A sewing machine stitches a patch onto a favourite jacket.',options:['A little repair. Another season together.','Fashion is everything','Definitely brand new','Amazing item'],best:0,why:'Acknowledges the repair and the jacket’s continued life rather than calling it new.'},
 {scene:'Two friends compare a hand-drawn map beside a walking trail.',options:['The map guarantees a perfect day','Find the route. Make the memories.','There are two people','Walking walking'],best:1,why:'Connects the map to the shared activity shown in the image.'},
 {scene:'A potter opens a kiln to reveal a finished blue bowl.',options:['A machine','Blue is a colour','From a lump of clay to a place at the table.','Nothing to see'],best:2,why:'Adds a concise transformation that matches the finished object.'},
 {scene:'A commuter folds a wet umbrella before stepping into a train.',options:['This train cures all problems','Transport photo','Best company ever','Rain outside. A dry seat ahead.'],best:3,why:'Uses two observable details to create a small sense of relief.'},
 {scene:'A handwritten thank-you note rests beside a repaired laptop.',options:['A working laptop. A small note that means a lot.','Buy buy buy','Screen photo','Guaranteed lifelong performance'],best:0,why:'Names the repair outcome and the visible note without making unsupported promises.'},
 {scene:'A volunteer places labelled meal boxes into a delivery crate.',options:['Boxes','Packed with care, ready for the next doorstep.','This solves hunger forever','Our brand is premium'],best:1,why:'Connects the careful packing to its immediate purpose without an exaggerated claim.'},
 {scene:'A musician replaces a broken guitar string before rehearsal.',options:['Unrelated holiday sale','Music music','One new string. Back to the song.','A person with an object'],best:2,why:'Turns the specific repair into a concise return to the activity.'},
 {scene:'A local bookshop opens its shutters as sunlight reaches the doorway.',options:['World’s largest library','Something is opening','Buy everything now','A new day. Another story waiting inside.'],best:3,why:'Connects the opening shop to what readers can discover there.'},
 {scene:'A student pins a finished prototype beside earlier sketches.',options:['From first sketch to something you can try.','Instant success guaranteed','A board','Very innovative premium solution'],best:0,why:'Explains the visible progression with a concrete outcome rather than a vague claim.'}
];
