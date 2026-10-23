/** Authored illustrations, never learner work, reviews, execution evidence or rewards. */
export type PracticeExample={title:string;before:string;after:string;worked:string;improve:string;next:string};
export const starterExamples:Record<string,PracticeExample>={
 marketing:{title:'A campaign hook',before:'Our new lunch service is great. Try it.',after:'Busy office lunch break? Order a weekday meal from the menu before 10 am.',worked:'The example speaks to office workers and gives one clear action.',improve:'Replace a vague promise with the customer’s everyday problem.',next:'Ask one intended reader what they think the offer is.'},
 development:{title:'A simple client-approval app',before:'Send a draft, collect comments, then publish.',after:'Share version 2 → collect comments → revise version 3 → get approval for version 3 → publish that version.',worked:'The steps show which version the client approved.',improve:'Make a new change require a fresh approval.',next:'Try a late comment after approval. Decide what should happen.'},
 filmmaking:{title:'A short film plan',before:'A student wants to help a friend.',after:'A student sees her friend miss the bus. She gives up her own seat and walks home.',worked:'A visible action reveals the choice and its cost.',improve:'Show the decision through action instead of explaining it.',next:'Act out the moment without narration. Is the choice clear?'},
 storytelling:{title:'A three-frame visual story',before:'Show a messy park, then a nice park.',after:'1. Rubbish beside a park bench. 2. Neighbours clean together. 3. A clean bench with a “Join our next clean-up” sign.',worked:'The change connects to a clear invitation.',improve:'Include the action that caused the change.',next:'Sketch the frames and ask someone to describe the story.'}
};
export const courseExamples:Record<string,{title:string;artifact:string}>={
 marketing:{title:'A local lunch campaign',artifact:'Reader: office workers. Hook: “Make your lunch break a real break.” Action: choose a meal from the weekday menu.'},
 development:{title:'A trial-class booking app',artifact:'A parent selects a class and submits a request. Show confirmation after the server saves it; show one clear error if it fails.'},
 filmmaking:{title:'A one-minute film plan',artifact:'A student misses the bus, faces a choice, then helps a stranger. Plan three shots that show the choice without narration.'},
 storytelling:{title:'A neighbourhood clean-up story',artifact:'Frame 1: the problem. Frame 2: neighbours take action. Frame 3: a visible change and an invitation to join.'}
};
