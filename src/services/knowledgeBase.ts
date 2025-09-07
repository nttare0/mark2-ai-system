// services/knowledge-base.ts
import { ratio } from 'fuzzball';

export interface KnowledgePair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  addedAt: Date;
  lastUsed?: Date;
  useCount: number;
  confidence?: number;
}

export interface KnowledgeMatch {
  pair: KnowledgePair;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'keyword' | 'partial';
}

export interface KnowledgeBaseStats {
  totalPairs: number;
  categories: Record<string, number>;
  mostUsed: KnowledgePair[];
  averageScore: number;
  lastUpdate: Date;
}

export interface LearningData {
  question: string;
  selectedAnswer: string;
  rejectedAnswers: string[];
  feedback: 'positive' | 'negative' | 'neutral';
}

export class KnowledgeBaseService {
  private knowledgeBase: Map<string, KnowledgePair> = new Map();
  private confidenceThreshold = 0.6;
  private fuzzyThreshold = 70;
  private learningData: LearningData[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): void {
    const predefinedPairs: Array<Omit<KnowledgePair, 'id' | 'addedAt' | 'useCount' | 'lastUsed'>> = [
      // Greetings & Social
      {
        question: "Hello!",
        answer: "Hi there!",
        keywords: ["hello", "hi", "hey", "greetings"],
        category: "greetings"
      },
      {
        question: "How are you?",
        answer: "I'm just a program, but I'm here and ready to help!",
        keywords: ["how are you", "how do you do", "feeling", "doing"],
        category: "conversation"
      },
      {
        question: "Good morning.",
        answer: "Good morning to you too!",
        keywords: ["morning", "good morning", "am"],
        category: "greetings"
      },
      {
        question: "Good evening.",
        answer: "Good evening!",
        keywords: ["evening", "good evening", "night"],
        category: "greetings"
      },
      {
        question: "Hey there!",
        answer: "Hey!",
        keywords: ["hey", "there", "hi"],
        category: "greetings"
      },
      {
        question: "Nice to meet you.",
        answer: "Nice to meet you too!",
        keywords: ["nice", "meet", "meeting", "pleasure"],
        category: "social"
      },
      {
        question: "Long time no see!",
        answer: "Great to reconnect!",
        keywords: ["long time", "reconnect", "while"],
        category: "social"
      },
      {
        question: "I'm new here.",
        answer: "Welcome aboard!",
        keywords: ["new", "welcome", "first time"],
        category: "social"
      },
      {
        question: "Happy to be here.",
        answer: "Glad to have you!",
        keywords: ["happy", "glad", "pleased"],
        category: "social"
      },
      {
        question: "It's nice chatting with you.",
        answer: "Same here!",
        keywords: ["nice", "chatting", "talking", "conversation"],
        category: "social"
      },
      {
        question: "Just checking in.",
        answer: "Great to hear from you.",
        keywords: ["checking", "touching base", "hello"],
        category: "social"
      },
      {
        question: "It's been a while.",
        answer: "Yes, it has!",
        keywords: ["while", "time", "long"],
        category: "social"
      },

      // Gratitude & Courtesy
      {
        question: "Thanks in advance.",
        answer: "You're welcome!",
        keywords: ["thanks", "advance", "beforehand"],
        category: "courtesy"
      },
      {
        question: "I appreciate your support.",
        answer: "Anytime!",
        keywords: ["appreciate", "support", "help"],
        category: "courtesy"
      },
      {
        question: "Thank you for being here.",
        answer: "Happy to help.",
        keywords: ["thank", "being here", "presence"],
        category: "courtesy"
      },
      {
        question: "Much appreciated.",
        answer: "You got it.",
        keywords: ["appreciated", "thanks", "grateful"],
        category: "courtesy"
      },
      {
        question: "I hope you're doing well.",
        answer: "Thank you — same to you.",
        keywords: ["hope", "doing well", "wellness"],
        category: "courtesy"
      },
      {
        question: "Hope you had a nice weekend.",
        answer: "Thank you — hope yours was nice too.",
        keywords: ["weekend", "nice", "hope"],
        category: "courtesy"
      },
      {
        question: "I hope this helps.",
        answer: "It did, thank you.",
        keywords: ["hope", "helps", "useful"],
        category: "courtesy"
      },
      {
        question: "Sending good vibes.",
        answer: "Thanks! Right back at you.",
        keywords: ["good vibes", "positive", "energy"],
        category: "courtesy"
      },
      {
        question: "Thank you kindly.",
        answer: "My pleasure.",
        keywords: ["thank", "kindly", "grateful"],
        category: "courtesy"
      },
      {
        question: "Appreciate the effort.",
        answer: "Appreciate that.",
        keywords: ["appreciate", "effort", "work"],
        category: "courtesy"
      },
      {
        question: "Wishing you a great day.",
        answer: "Thanks — same to you!",
        keywords: ["wishing", "great day", "good day"],
        category: "courtesy"
      },
      {
        question: "Thanks again.",
        answer: "You're welcome again.",
        keywords: ["thanks", "again", "once more"],
        category: "courtesy"
      },
      {
        question: "Much respect.",
        answer: "Thank you.",
        keywords: ["respect", "honor", "admiration"],
        category: "courtesy"
      },
      {
        question: "Peace and love.",
        answer: "Right back at you.",
        keywords: ["peace", "love", "good wishes"],
        category: "courtesy"
      },

      // Weather & Time
      {
        question: "What's the weather like today?",
        answer: "That depends on your location — would you like a weather update?",
        keywords: ["weather", "today", "temperature", "forecast"],
        category: "weather"
      },
      {
        question: "What time is it in Tokyo?",
        answer: "It depends on the current time — want a live check?",
        keywords: ["time", "tokyo", "japan", "clock"],
        category: "time"
      },
      {
        question: "What day is it today?",
        answer: "That depends on the current date — it's [insert today's day].",
        keywords: ["day", "today", "date", "calendar"],
        category: "time"
      },

      // Help & Support
      {
        question: "Can you help me with my homework?",
        answer: "Sure, what subject are you working on?",
        keywords: ["homework", "help", "study", "school"],
        category: "education"
      },
      {
        question: "Please explain this concept to me.",
        answer: "Absolutely — which concept?",
        keywords: ["explain", "concept", "clarify", "understand"],
        category: "education"
      },
      {
        question: "May I ask a question?",
        answer: "Of course — go ahead.",
        keywords: ["ask", "question", "inquire"],
        category: "support"
      },
      {
        question: "Could you find this file for me?",
        answer: "What's the file name or topic?",
        keywords: ["find", "file", "search", "locate"],
        category: "support"
      },
      {
        question: "I need some advice.",
        answer: "I'll do my best. What's the situation?",
        keywords: ["advice", "guidance", "help", "counsel"],
        category: "support"
      },
      {
        question: "Can you translate this for me?",
        answer: "Sure, what language is it in?",
        keywords: ["translate", "language", "convert"],
        category: "support"
      },
      {
        question: "Can you summarize this article?",
        answer: "Certainly — please share the article.",
        keywords: ["summarize", "article", "summary", "overview"],
        category: "support"
      },
      {
        question: "I have a suggestion.",
        answer: "I'm listening.",
        keywords: ["suggestion", "idea", "proposal"],
        category: "support"
      },
      {
        question: "Can you check my grammar?",
        answer: "Sure — paste the text here.",
        keywords: ["grammar", "check", "proofread", "correct"],
        category: "education"
      },
      {
        question: "Can you solve this riddle?",
        answer: "Go ahead — I love riddles.",
        keywords: ["riddle", "puzzle", "brain teaser"],
        category: "entertainment"
      },
      {
        question: "Can you give an example?",
        answer: "Of course — what concept?",
        keywords: ["example", "sample", "illustration", "instance"],
        category: "education"
      },

      // Mathematics
      {
        question: "What is 5 multiplied by 7?",
        answer: "35",
        keywords: ["5", "multiplied", "7", "times", "multiply", "math"],
        category: "mathematics"
      },
      {
        question: "What's the square root of 144?",
        answer: "12",
        keywords: ["square root", "144", "sqrt", "math"],
        category: "mathematics"
      },
      {
        question: "What's 12 divided by 3?",
        answer: "4",
        keywords: ["12", "divided", "3", "division", "math"],
        category: "mathematics"
      },
      {
        question: "What is 2 to the power of 5?",
        answer: "32",
        keywords: ["2", "power", "5", "exponent", "math"],
        category: "mathematics"
      },

      // General Knowledge
      {
        question: "What's the capital of France?",
        answer: "Paris",
        keywords: ["capital", "france", "paris", "geography"],
        category: "geography"
      },
      {
        question: "What is the meaning of life?",
        answer: "A philosophical question — often answered as 42 (thanks, Douglas Adams).",
        keywords: ["meaning", "life", "philosophy", "42"],
        category: "philosophy"
      },
      {
        question: "What's the longest river in the world?",
        answer: "The Nile River (though some consider the Amazon).",
        keywords: ["longest", "river", "nile", "amazon"],
        category: "geography"
      },
      {
        question: "Where is Mount Everest located?",
        answer: "In the Himalayas, on the border of Nepal and China (Tibet).",
        keywords: ["mount everest", "himalayas", "nepal", "china", "tibet"],
        category: "geography"
      },
      {
        question: "What year did WW2 end?",
        answer: "1945",
        keywords: ["ww2", "world war", "end", "1945", "history"],
        category: "history"
      },
      {
        question: "Who wrote \"1984\"?",
        answer: "George Orwell",
        keywords: ["1984", "book", "author", "george orwell"],
        category: "literature"
      },
      {
        question: "What's the boiling point of water?",
        answer: "100°C or 212°F at sea level",
        keywords: ["boiling point", "water", "temperature", "celsius", "fahrenheit"],
        category: "science"
      },
      {
        question: "What is the currency of Japan?",
        answer: "Japanese yen (¥)",
        keywords: ["currency", "japan", "yen", "money"],
        category: "geography"
      },
      {
        question: "What is an atom made of?",
        answer: "Protons, neutrons, and electrons",
        keywords: ["atom", "protons", "neutrons", "electrons", "chemistry"],
        category: "science"
      },
      {
        question: "Who painted the Mona Lisa?",
        answer: "Leonardo da Vinci",
        keywords: ["mona lisa", "painted", "leonardo", "da vinci", "art"],
        category: "art"
      },
      {
        question: "What's the population of India?",
        answer: "Over 1.4 billion (as of 2024)",
        keywords: ["population", "india", "billion", "demographics"],
        category: "geography"
      },
      {
        question: "What are the symptoms of flu?",
        answer: "Fever, chills, cough, sore throat, body aches",
        keywords: ["flu", "symptoms", "fever", "cough", "illness"],
        category: "health"
      },
      {
        question: "What is gravity?",
        answer: "A fundamental force pulling objects toward each other",
        keywords: ["gravity", "force", "physics", "attraction"],
        category: "science"
      },
      {
        question: "How tall is the Eiffel Tower?",
        answer: "About 330 meters (1,083 feet)",
        keywords: ["eiffel tower", "height", "meters", "feet", "paris"],
        category: "geography"
      },
      {
        question: "Can you list the planets?",
        answer: "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune",
        keywords: ["planets", "solar system", "mercury", "venus", "earth"],
        category: "science"
      },
      {
        question: "Who was the first president of the US?",
        answer: "George Washington",
        keywords: ["first president", "us", "george washington", "america"],
        category: "history"
      },
      {
        question: "What does HTML stand for?",
        answer: "HyperText Markup Language",
        keywords: ["html", "hypertext", "markup", "language", "web"],
        category: "technology"
      },
      {
        question: "Can you name a few animals?",
        answer: "Dog, cat, elephant, tiger, penguin",
        keywords: ["animals", "dog", "cat", "elephant", "tiger", "penguin"],
        category: "nature"
      },
      {
        question: "What is the speed of light?",
        answer: "About 299,792,458 meters per second",
        keywords: ["speed", "light", "physics", "meters", "second"],
        category: "science"
      },
      {
        question: "What's the tallest building in the world?",
        answer: "Burj Khalifa in Dubai",
        keywords: ["tallest", "building", "burj khalifa", "dubai"],
        category: "geography"
      },
      {
        question: "Who invented the telephone?",
        answer: "Alexander Graham Bell",
        keywords: ["telephone", "invented", "alexander graham bell"],
        category: "history"
      },
      {
        question: "What is a black hole?",
        answer: "A region in space with gravity so strong that not even light can escape",
        keywords: ["black hole", "space", "gravity", "light", "astronomy"],
        category: "science"
      },
      {
        question: "What is 100 in Roman numerals?",
        answer: "C",
        keywords: ["100", "roman numerals", "c", "math"],
        category: "mathematics"
      },
      {
        question: "How does a rainbow form?",
        answer: "It forms when sunlight is refracted, reflected, and dispersed in water droplets",
        keywords: ["rainbow", "sunlight", "refracted", "water", "droplets"],
        category: "science"
      },
      {
        question: "Where do penguins live?",
        answer: "Mostly in the Southern Hemisphere — Antarctica, South America, Africa",
        keywords: ["penguins", "antarctica", "southern hemisphere", "live"],
        category: "nature"
      },
      {
        question: "What is AI?",
        answer: "Artificial Intelligence — the simulation of human intelligence in machines",
        keywords: ["ai", "artificial intelligence", "machines", "simulation"],
        category: "technology"
      },

      // Personal Preferences & Opinions
      {
        question: "What's your favorite movie?",
        answer: "I don't have personal preferences, but many enjoy The Shawshank Redemption.",
        keywords: ["favorite", "movie", "film", "preferences"],
        category: "entertainment"
      },
      {
        question: "What's your favorite book?",
        answer: "I like 1984 and To Kill a Mockingbird.",
        keywords: ["favorite", "book", "literature", "reading"],
        category: "literature"
      },
      {
        question: "Can you recommend a movie?",
        answer: "Inception, The Matrix, or The Grand Budapest Hotel",
        keywords: ["recommend", "movie", "suggestion", "film"],
        category: "entertainment"
      },

      // Creative & Interactive
      {
        question: "What does this word mean?",
        answer: "Please share the word.",
        keywords: ["word", "meaning", "definition", "explain"],
        category: "education"
      },
      {
        question: "Can you write a poem?",
        answer: "Sure, what should it be about?",
        keywords: ["poem", "poetry", "write", "creative"],
        category: "creative"
      },
      {
        question: "How do I bake a cake?",
        answer: "Sure — want a simple or advanced recipe?",
        keywords: ["bake", "cake", "cooking", "recipe"],
        category: "cooking"
      },
      {
        question: "Can you draw a cat?",
        answer: "I can generate a drawing — would you like one?",
        keywords: ["draw", "cat", "art", "creative"],
        category: "creative"
      },

      // Conversation Flow
      {
        question: "Good job!",
        answer: "Thanks!",
        keywords: ["good job", "well done", "excellent"],
        category: "encouragement"
      },
      {
        question: "That makes sense.",
        answer: "Glad it makes sense.",
        keywords: ["makes sense", "understand", "clear"],
        category: "confirmation"
      },
      {
        question: "I see what you mean.",
        answer: "Great — just let me know if you want to dive deeper.",
        keywords: ["see", "what you mean", "understand"],
        category: "confirmation"
      },
      {
        question: "Could you explain it differently?",
        answer: "Sure, let me explain it another way.",
        keywords: ["explain", "differently", "another way", "clarify"],
        category: "clarification"
      },
      {
        question: "That's helpful.",
        answer: "Happy to help.",
        keywords: ["helpful", "useful", "good"],
        category: "feedback"
      },
      {
        question: "Please summarize that.",
        answer: "Here's a summary.",
        keywords: ["summarize", "summary", "brief"],
        category: "formatting"
      },
      {
        question: "I didn't understand.",
        answer: "No problem — let's go over it again.",
        keywords: ["didn't understand", "confused", "unclear"],
        category: "clarification"
      },
      {
        question: "Say that again.",
        answer: "Repeating it now.",
        keywords: ["say again", "repeat", "once more"],
        category: "clarification"
      },
      {
        question: "Make it shorter.",
        answer: "Here's a shorter version.",
        keywords: ["shorter", "brief", "concise"],
        category: "formatting"
      },
      {
        question: "Expand on that.",
        answer: "Let me expand on that.",
        keywords: ["expand", "elaborate", "more detail"],
        category: "formatting"
      },
      {
        question: "Give more detail.",
        answer: "Adding more detail now.",
        keywords: ["more detail", "elaborate", "specific"],
        category: "formatting"
      },
      {
        question: "That's interesting.",
        answer: "I thought so too.",
        keywords: ["interesting", "fascinating", "cool"],
        category: "reaction"
      },
      {
        question: "Try again.",
        answer: "Alright, trying again.",
        keywords: ["try again", "retry", "once more"],
        category: "instruction"
      },
      {
        question: "Sounds good.",
        answer: "Awesome.",
        keywords: ["sounds good", "agreement", "okay"],
        category: "confirmation"
      },
      {
        question: "Keep going.",
        answer: "Continuing.",
        keywords: ["keep going", "continue", "more"],
        category: "instruction"
      },
      {
        question: "Stop there.",
        answer: "Stopping here.",
        keywords: ["stop", "enough", "halt"],
        category: "instruction"
      },
      {
        question: "Show me an example.",
        answer: "Here's an example.",
        keywords: ["example", "sample", "demonstrate"],
        category: "clarification"
      },
      {
        question: "Try a different approach.",
        answer: "Okay — different approach coming up.",
        keywords: ["different approach", "another way", "alternative"],
        category: "instruction"
      },
      {
        question: "I'm not sure about that.",
        answer: "That's okay — let's clarify it.",
        keywords: ["not sure", "uncertain", "doubt"],
        category: "clarification"
      },
      {
        question: "That's not what I meant.",
        answer: "Got it — let me adjust.",
        keywords: ["not what I meant", "misunderstood", "different"],
        category: "clarification"
      },
      {
        question: "Let's move on.",
        answer: "Moving on.",
        keywords: ["move on", "next", "continue"],
        category: "conversation"
      },
      {
        question: "Can you reword that?",
        answer: "Sure — here's a reworded version.",
        keywords: ["reword", "rephrase", "different words"],
        category: "clarification"
      },
      {
        question: "I like that.",
        answer: "I'm glad you liked it.",
        keywords: ["like", "good", "appreciate"],
        category: "feedback"
      },
      {
        question: "I don't like that.",
        answer: "Got it — let's try another version.",
        keywords: ["don't like", "dislike", "not good"],
        category: "feedback"
      },
      {
        question: "That's too complex.",
        answer: "Let me simplify it.",
        keywords: ["too complex", "complicated", "difficult"],
        category: "feedback"
      },
      {
        question: "Make it simpler.",
        answer: "Making it simpler now.",
        keywords: ["simpler", "easier", "basic"],
        category: "formatting"
      },
      {
        question: "Use plain language.",
        answer: "Switching to plain language.",
        keywords: ["plain language", "simple", "easy"],
        category: "formatting"
      },
      {
        question: "Try using a metaphor.",
        answer: "Here's a metaphor to explain it.",
        keywords: ["metaphor", "analogy", "comparison"],
        category: "formatting"
      },
      {
        question: "Make it funny.",
        answer: "I'll try to add some humor.",
        keywords: ["funny", "humor", "joke"],
        category: "style"
      },
      {
        question: "Make it formal.",
        answer: "Making it more formal.",
        keywords: ["formal", "professional", "official"],
        category: "style"
      },
      {
        question: "Make it casual.",
        answer: "Making it more casual.",
        keywords: ["casual", "informal", "relaxed"],
        category: "style"
      },
      {
        question: "Use bullet points.",
        answer: "Here's a bullet point list.",
        keywords: ["bullet points", "list", "points"],
        category: "formatting"
      },
      {
        question: "Write it as a paragraph.",
        answer: "Rewriting it as a paragraph.",
        keywords: ["paragraph", "prose", "continuous"],
        category: "formatting"
      },
      {
        question: "Can you break it down?",
        answer: "Breaking it down now.",
        keywords: ["break down", "analyze", "steps"],
        category: "formatting"
      },
      {
        question: "That's a bit vague.",
        answer: "Let me clarify.",
        keywords: ["vague", "unclear", "specific"],
        category: "clarification"
      },
      {
        question: "Can you be more specific?",
        answer: "Here's a more specific explanation.",
        keywords: ["more specific", "detailed", "precise"],
        category: "clarification"
      },
      {
        question: "That's exactly what I needed.",
        answer: "Happy to hear that!",
        keywords: ["exactly", "needed", "perfect"],
        category: "feedback"
      },
      {
        question: "That's not quite right.",
        answer: "Let's fix it.",
        keywords: ["not right", "incorrect", "wrong"],
        category: "feedback"
      },
      {
        question: "I'll need a source for that.",
        answer: "I'll double-check for sources.",
        keywords: ["source", "reference", "citation"],
        category: "verification"
      },
      {
        question: "Cite your source.",
        answer: "Here's a citation.",
        keywords: ["cite", "source", "reference"],
        category: "verification"
      },
      {
        question: "Provide a reference.",
        answer: "Adding a reference.",
        keywords: ["reference", "citation", "source"],
        category: "verification"
      },
      {
        question: "Can you double-check that?",
        answer: "Rechecking that for accuracy.",
        keywords: ["double-check", "verify", "confirm"],
        category: "verification"
      },
      {
        question: "That sounds off.",
        answer: "Let me rephrase it.",
        keywords: ["sounds off", "wrong", "incorrect"],
        category: "feedback"
      },
      {
        question: "That's better.",
        answer: "Glad that's working better.",
        keywords: ["better", "improved", "good"],
        category: "feedback"
      },
      {
        question: "Nice job.",
        answer: "Thanks!",
        keywords: ["nice job", "good work", "well done"],
        category: "encouragement"
      },
      {
        question: "You're getting closer.",
        answer: "I'll refine it more.",
        keywords: ["getting closer", "almost", "better"],
        category: "encouragement"
      },
      {
        question: "Start over.",
        answer: "Starting over.",
        keywords: ["start over", "begin again", "restart"],
        category: "instruction"
      },
      {
        question: "Let's try a different topic.",
        answer: "Okay — new topic coming up.",
        keywords: ["different topic", "change subject", "new"],
        category: "conversation"
      },
      {
        question: "Save this.",
        answer: "Saved.",
        keywords: ["save", "store", "remember"],
        category: "action"
      },
      {
        question: "Bookmark this.",
        answer: "Bookmarked.",
        keywords: ["bookmark", "mark", "save"],
        category: "action"
      },
      {
        question: "Make a list.",
        answer: "Here's a list.",
        keywords: ["list", "items", "points"],
        category: "formatting"
      },
      {
        question: "Turn it into a table.",
        answer: "Turning it into a table.",
        keywords: ["table", "rows", "columns"],
        category: "formatting"
      },
      {
        question: "Put it in a timeline.",
        answer: "Here's a timeline.",
        keywords: ["timeline", "chronological", "sequence"],
        category: "formatting"
      },
      {
        question: "Organize that by category.",
        answer: "Organizing by category now.",
        keywords: ["organize", "category", "group"],
        category: "formatting"
      },
      {
        question: "Sort alphabetically.",
        answer: "Sorted alphabetically.",
        keywords: ["sort", "alphabetical", "order"],
        category: "formatting"
      },
      {
        question: "Highlight the key points.",
        answer: "Key points highlighted.",
        keywords: ["highlight", "key points", "important"],
        category: "formatting"
      },
      {
        question: "Emphasize the benefits.",
        answer: "Benefits emphasized.",
        keywords: ["emphasize", "benefits", "advantages"],
        category: "formatting"
      },
      {
        question: "Show pros and cons.",
        answer: "Here are the pros and cons.",
        keywords: ["pros", "cons", "advantages", "disadvantages"],
        category: "formatting"
      },
      {
        question: "Add context.",
        answer: "Adding more context.",
        keywords: ["context", "background", "setting"],
        category: "formatting"
      },
      {
        question: "Compare options.",
        answer: "Comparing options now.",
        keywords: ["compare", "options", "alternatives"],
        category: "formatting"
      },
      {
        question: "Give a summary.",
        answer: "Here's the summary.",
        keywords: ["summary", "overview", "brief"],
        category: "formatting"
      },
      {
        question: "Keep it brief.",
        answer: "Keeping it brief.",
        keywords: ["brief", "short", "concise"],
        category: "formatting"
      },
      {
        question: "Make it longer.",
        answer: "Making it longer.",
        keywords: ["longer", "expand", "detailed"],
        category: "formatting"
      },
      {
        question: "Remove the fluff.",
        answer: "Removing unnecessary parts.",
        keywords: ["remove fluff", "concise", "essential"],
        category: "formatting"
      },
      {
        question: "Clarify that part.",
        answer: "Clarifying that section.",
        keywords: ["clarify", "explain", "clear"],
        category: "clarification"
      },
      {
        question: "Focus on the main idea.",
        answer: "Focusing on the main idea.",
        keywords: ["main idea", "focus", "core"],
        category: "formatting"
      },
      {
        question: "Start with a hook.",
        answer: "Starting with a strong opening.",
        keywords: ["hook", "opening", "attention"],
        category: "formatting"
      },
      {
        question: "Add a conclusion.",
        answer: "Adding a conclusion.",
        keywords: ["conclusion", "ending", "summary"],
        category: "formatting"
      },
      {
        question: "Add a call to action.",
        answer: "Including a call to action.",
        keywords: ["call to action", "action", "next steps"],
        category: "formatting"
      },
      {
        question: "Make it persuasive.",
        answer: "Making it more persuasive.",
        keywords: ["persuasive", "convincing", "compelling"],
        category: "style"
      },
      {
        question: "Make it informative.",
        answer: "Making it more informative.",
        keywords: ["informative", "educational", "factual"],
        category: "style"
      },
      {
        question: "Make it sound professional.",
        answer: "Professional tone applied.",
        keywords: ["professional", "formal", "business"],
        category: "style"
      },
      {
        question: "Tone it down.",
        answer: "Toning it down.",
        keywords: ["tone down", "softer", "less intense"],
        category: "style"
      },
      {
        question: "Spice it up.",
        answer: "Adding more energy.",
        keywords: ["spice up", "energetic", "exciting"],
        category: "style"
      },
      {
        question: "Translate this.",
        answer: "Here's the translation.",
        keywords: ["translate", "language", "convert"],
        category: "action"
      },
      {
        question: "Turn this into a joke.",
        answer: "Turning it into a joke.",
        keywords: ["joke", "funny", "humor"],
        category: "style"
      },
      {
        question: "Make it sound like a poem.",
        answer: "Here's the poetic version.",
        keywords: ["poem", "poetry", "verse"],
        category: "style"
      },
      {
        question: "Rewrite this as a story.",
        answer: "Rewriting it as a story.",
        keywords: ["story", "narrative", "tale"],
        category: "style"
      },
      {
        question: "Add examples from real life.",
        answer: "Adding real-life examples.",
        keywords: ["real life", "examples", "practical"],
        category: "formatting"
      },
      {
        question: "Create a script.",
        answer: "Here's a script version.",
        keywords: ["script", "dialogue", "screenplay"],
        category: "formatting"
      },
      {
        question: "Turn this into bullet points.",
        answer: "Converting to bullet points.",
        keywords: ["bullet points", "list", "points"],
        category: "formatting"
      },
      {
        question: "Make a quiz out of it.",
        answer: "Here's a quick quiz.",
        keywords: ["quiz", "questions", "test"],
        category: "formatting"
      },
      {
        question: "Turn it into a conversation.",
        answer: "Rewriting as a conversation.",
        keywords: ["conversation", "dialogue", "chat"],
        category: "formatting"
      },
      {
        question: "Add humor.",
        answer: "Humor added.",
        keywords: ["humor", "funny", "jokes"],
        category: "style"
      },
      {
        question: "Remove technical terms.",
        answer: "Technical terms removed.",
        keywords: ["technical terms", "jargon", "simple"],
        category: "style"
      },
      {
        question: "Explain it like I'm five.",
        answer: "Here's the simple version.",
        keywords: ["explain like five", "simple", "basic"],
        category: "style"
      },
      {
        question: "Use analogies.",
        answer: "Using analogies now.",
        keywords: ["analogies", "comparisons", "metaphors"],
        category: "style"
      },
      {
        question: "Give a visual description.",
        answer: "Here's a visual-style description.",
        keywords: ["visual", "description", "imagery"],
        category: "formatting"
      },
      {
        question: "Reformat for email.",
        answer: "Reformatted for email.",
        keywords: ["email", "format", "message"],
        category: "formatting"
      },
      {
        question: "Make it a social media post.",
        answer: "Here's a social post version.",
        keywords: ["social media", "post", "social"],
        category: "formatting"
      },
      {
        question: "Turn it into a headline.",
        answer: "Here's a headline.",
        keywords: ["headline", "title", "header"],
        category: "formatting"
      },
      {
        question: "Draft a reply.",
        answer: "Drafting a reply now.",
        keywords: ["reply", "response", "answer"],
        category: "action"
      },
      {
        question: "Write it like a tweet.",
        answer: "Here's a tweet-style version.",
        keywords: ["tweet", "twitter", "short"],
        category: "formatting"
      },
      {
        question: "Make it SEO-friendly.",
        answer: "Optimized for search engines.",
        keywords: ["seo", "search", "optimize"],
        category: "formatting"
      },
      {
        question: "Create a checklist.",
        answer: "Checklist created.",
        keywords: ["checklist", "list", "tasks"],
        category: "formatting"
      },
      {
        question: "Turn this into a presentation outline.",
        answer: "Here's a presentation outline.",
        keywords: ["presentation", "outline", "slides"],
        category: "formatting"
      },
      {
        question: "Turn this into flashcards.",
        answer: "Turning it into flashcards.",
        keywords: ["flashcards", "study", "cards"],
        category: "formatting"
      },
      {
        question: "Convert to Markdown.",
        answer: "Converted to Markdown.",
        keywords: ["markdown", "format", "convert"],
        category: "formatting"
      },
      {
        question: "Keep the tone neutral.",
        answer: "Neutral tone applied.",
        keywords: ["neutral", "tone", "balanced"],
        category: "style"
      },
      {
        question: "Remove repetition.",
        answer: "Repetition removed.",
        keywords: ["repetition", "duplicate", "redundant"],
        category: "formatting"
      },
      {
        question: "Add transitions.",
        answer: "Added smoother transitions.",
        keywords: ["transitions", "flow", "connections"],
        category: "formatting"
      },

      // News & Current Events
      {
        question: "What's going on in the news?",
        answer: "I can fetch current headlines — want a news update?",
        keywords: ["news", "current events", "headlines", "update"],
        category: "news"
      },

      // Conversational Flow & Understanding
      {
        question: "That makes sense.",
        answer: "Glad it makes sense.",
        keywords: ["makes sense", "understand", "clear"],
        category: "confirmation"
      },
      {
        question: "I see what you mean.",
        answer: "Great — just let me know if you want to dive deeper.",
        keywords: ["see", "what you mean", "understand"],
        category: "confirmation"
      },
      {
        question: "Could you explain it differently?",
        answer: "Sure, let me explain it another way.",
        keywords: ["explain", "differently", "another way", "clarify"],
        category: "clarification"
      },
      {
        question: "That's helpful.",
        answer: "Happy to help.",
        keywords: ["helpful", "useful", "good"],
        category: "feedback"
      },
      {
        question: "Please summarize that.",
        answer: "Here's a summary.",
        keywords: ["summarize", "summary", "brief"],
        category: "formatting"
      },
      {
        question: "I didn't understand.",
        answer: "No problem — let's go over it again.",
        keywords: ["didn't understand", "confused", "unclear"],
        category: "clarification"
      },
      {
        question: "Say that again.",
        answer: "Repeating it now.",
        keywords: ["say again", "repeat", "once more"],
        category: "clarification"
      },
      {
        question: "Make it shorter.",
        answer: "Here's a shorter version.",
        keywords: ["shorter", "brief", "concise"],
        category: "formatting"
      },
      {
        question: "Expand on that.",
        answer: "Let me expand on that.",
        keywords: ["expand", "elaborate", "more detail"],
        category: "formatting"
      },
      {
        question: "Give more detail.",
        answer: "Adding more detail now.",
        keywords: ["more detail", "elaborate", "specific"],
        category: "formatting"
      },
      {
        question: "That's interesting.",
        answer: "I thought so too.",
        keywords: ["interesting", "fascinating", "cool"],
        category: "reaction"
      },
      {
        question: "Try again.",
        answer: "Alright, trying again.",
        keywords: ["try again", "retry", "once more"],
        category: "instruction"
      },
      {
        question: "Sounds good.",
        answer: "Awesome.",
        keywords: ["sounds good", "agreement", "okay"],
        category: "confirmation"
      },
      {
        question: "Keep going.",
        answer: "Continuing.",
        keywords: ["keep going", "continue", "more"],
        category: "instruction"
      },
      {
        question: "Stop there.",
        answer: "Stopping here.",
        keywords: ["stop", "enough", "halt"],
        category: "instruction"
      },
      {
        question: "Show me an example.",
        answer: "Here's an example.",
        keywords: ["example", "sample", "demonstrate"],
        category: "clarification"
      },
      {
        question: "Try a different approach.",
        answer: "Okay — different approach coming up.",
        keywords: ["different approach", "another way", "alternative"],
        category: "instruction"
      },
      {
        question: "I'm not sure about that.",
        answer: "That's okay — let's clarify it.",
        keywords: ["not sure", "uncertain", "doubt"],
        category: "clarification"
      },
      {
        question: "That's not what I meant.",
        answer: "Got it — let me adjust.",
        keywords: ["not what I meant", "misunderstood", "different"],
        category: "clarification"
      },
      {
        question: "Let's move on.",
        answer: "Moving on.",
        keywords: ["move on", "next", "continue"],
        category: "conversation"
      },
      {
        question: "Can you reword that?",
        answer: "Sure — here's a reworded version.",
        keywords: ["reword", "rephrase", "different words"],
        category: "clarification"
      },
      {
        question: "I like that.",
        answer: "I'm glad you liked it.",
        keywords: ["like", "good", "appreciate"],
        category: "feedback"
      },
      {
        question: "I don't like that.",
        answer: "Got it — let's try another version.",
        keywords: ["don't like", "dislike", "not good"],
        category: "feedback"
      },
      {
        question: "That's too complex.",
        answer: "Let me simplify it.",
        keywords: ["too complex", "complicated", "difficult"],
        category: "feedback"
      },
      {
        question: "Make it simpler.",
        answer: "Making it simpler now.",
        keywords: ["simpler", "easier", "basic"],
        category: "formatting"
      },
      {
        question: "Use plain language.",
        answer: "Switching to plain language.",
        keywords: ["plain language", "simple", "easy"],
        category: "formatting"
      },
      {
        question: "Try using a metaphor.",
        answer: "Here's a metaphor to explain it.",
        keywords: ["metaphor", "analogy", "comparison"],
        category: "formatting"
      },
      {
        question: "Make it funny.",
        answer: "I'll try to add some humor.",
        keywords: ["funny", "humor", "joke"],
        category: "style"
      },
      {
        question: "Make it formal.",
        answer: "Making it more formal.",
        keywords: ["formal", "professional", "official"],
        category: "style"
      },
      {
        question: "Make it casual.",
        answer: "Making it more casual.",
        keywords: ["casual", "informal", "relaxed"],
        category: "style"
      },
      {
        question: "Use bullet points.",
        answer: "Here's a bullet point list.",
        keywords: ["bullet points", "list", "points"],
        category: "formatting"
      },
      {
        question: "Write it as a paragraph.",
        answer: "Rewriting it as a paragraph.",
        keywords: ["paragraph", "prose", "continuous"],
        category: "formatting"
      },
      {
        question: "Can you break it down?",
        answer: "Breaking it down now.",
        keywords: ["break down", "analyze", "steps"],
        category: "formatting"
      },
      {
        question: "That's a bit vague.",
        answer: "Let me clarify.",
        keywords: ["vague", "unclear", "specific"],
        category: "clarification"
      },
      {
        question: "Can you be more specific?",
        answer: "Here's a more specific explanation.",
        keywords: ["more specific", "detailed", "precise"],
        category: "clarification"
      },
      {
        question: "That's exactly what I needed.",
        answer: "Happy to hear that!",
        keywords: ["exactly", "needed", "perfect"],
        category: "feedback"
      },
      {
        question: "That's not quite right.",
        answer: "Let's fix it.",
        keywords: ["not right", "incorrect", "wrong"],
        category: "feedback"
      },
      {
        question: "I'll need a source for that.",
        answer: "I'll double-check for sources.",
        keywords: ["source", "reference", "citation"],
        category: "verification"
      },
      {
        question: "Cite your source.",
        answer: "Here's a citation.",
        keywords: ["cite", "source", "reference"],
        category: "verification"
      },
      {
        question: "Provide a reference.",
        answer: "Adding a reference.",
        keywords: ["reference", "citation", "source"],
        category: "verification"
      },
      {
        question: "Can you double-check that?",
        answer: "Rechecking that for accuracy.",
        keywords: ["double-check", "verify", "confirm"],
        category: "verification"
      },
      {
        question: "That sounds off.",
        answer: "Let me rephrase it.",
        keywords: ["sounds off", "wrong", "incorrect"],
        category: "feedback"
      },
      {
        question: "That's better.",
        answer: "Glad that's working better.",
        keywords: ["better", "improved", "good"],
        category: "feedback"
      },
      {
        question: "Nice job.",
        answer: "Thanks!",
        keywords: ["nice job", "good work", "well done"],
        category: "encouragement"
      },
      {
        question: "You're getting closer.",
        answer: "I'll refine it more.",
        keywords: ["getting closer", "almost", "better"],
        category: "encouragement"
      },
      {
        question: "Start over.",
        answer: "Starting over.",
        keywords: ["start over", "begin again", "restart"],
        category: "instruction"
      },
      {
        question: "Let's try a different topic.",
        answer: "Okay — new topic coming up.",
        keywords: ["different topic", "change subject", "new"],
        category: "conversation"
      },
      {
        question: "Save this.",
        answer: "Saved.",
        keywords: ["save", "store", "remember"],
        category: "action"
      },
      {
        question: "Bookmark this.",
        answer: "Bookmarked.",
        keywords: ["bookmark", "mark", "save"],
        category: "action"
      },
      {
        question: "Make a list.",
        answer: "Here's a list.",
        keywords: ["list", "items", "points"],
        category: "formatting"
      },
      {
        question: "Turn it into a table.",
        answer: "Turning it into a table.",
        keywords: ["table", "rows", "columns"],
        category: "formatting"
      },
      {
        question: "Put it in a timeline.",
        answer: "Here's a timeline.",
        keywords: ["timeline", "chronological", "sequence"],
        category: "formatting"
      },
      {
        question: "Organize that by category.",
        answer: "Organizing by category now.",
        keywords: ["organize", "category", "group"],
        category: "formatting"
      },
      {
        question: "Sort alphabetically.",
        answer: "Sorted alphabetically.",
        keywords: ["sort", "alphabetical", "order"],
        category: "formatting"
      },
      {
        question: "Highlight the key points.",
        answer: "Key points highlighted.",
        keywords: ["highlight", "key points", "important"],
        category: "formatting"
      },
      {
        question: "Emphasize the benefits.",
        answer: "Benefits emphasized.",
        keywords: ["emphasize", "benefits", "advantages"],
        category: "formatting"
      },
      {
        question: "Show pros and cons.",
        answer: "Here are the pros and cons.",
        keywords: ["pros", "cons", "advantages", "disadvantages"],
        category: "formatting"
      },
      {
        question: "Add context.",
        answer: "Adding more context.",
        keywords: ["context", "background", "setting"],
        category: "formatting"
      },
      {
        question: "Compare options.",
        answer: "Comparing options now.",
        keywords: ["compare", "options", "alternatives"],
        category: "formatting"
      },
      {
        question: "Give a summary.",
        answer: "Here's the summary.",
        keywords: ["summary", "overview", "brief"],
        category: "formatting"
      },
      {
        question: "Keep it brief.",
        answer: "Keeping it brief.",
        keywords: ["brief", "short", "concise"],
        category: "formatting"
      },
      {
        question: "Make it longer.",
        answer: "Making it longer.",
        keywords: ["longer", "expand", "detailed"],
        category: "formatting"
      },
      {
        question: "Remove the fluff.",
        answer: "Removing unnecessary parts.",
        keywords: ["remove fluff", "concise", "essential"],
        category: "formatting"
      },
      {
        question: "Clarify that part.",
        answer: "Clarifying that section.",
        keywords: ["clarify", "explain", "clear"],
        category: "clarification"
      },
      {
        question: "Focus on the main idea.",
        answer: "Focusing on the main idea.",
        keywords: ["main idea", "focus", "core"],
        category: "formatting"
      },
      {
        question: "Start with a hook.",
        answer: "Starting with a strong opening.",
        keywords: ["hook", "opening", "attention"],
        category: "formatting"
      },
      {
        question: "Add a conclusion.",
        answer: "Adding a conclusion.",
        keywords: ["conclusion", "ending", "summary"],
        category: "formatting"
      },
      {
        question: "Add a call to action.",
        answer: "Including a call to action.",
        keywords: ["call to action", "action", "next steps"],
        category: "formatting"
      },
      {
        question: "Make it persuasive.",
        answer: "Making it more persuasive.",
        keywords: ["persuasive", "convincing", "compelling"],
        category: "style"
      },
      {
        question: "Make it informative.",
        answer: "Making it more informative.",
        keywords: ["informative", "educational", "factual"],
        category: "style"
      },
      {
        question: "Make it sound professional.",
        answer: "Professional tone applied.",
        keywords: ["professional", "formal", "business"],
        category: "style"
      },
      {
        question: "Tone it down.",
        answer: "Toning it down.",
        keywords: ["tone down", "softer", "less intense"],
        category: "style"
      },
      {
        question: "Spice it up.",
        answer: "Adding more energy.",
        keywords: ["spice up", "energetic", "exciting"],
        category: "style"
      },
      {
        question: "Translate this.",
        answer: "Here's the translation.",
        keywords: ["translate", "language", "convert"],
        category: "action"
      },
      {
        question: "Turn this into a joke.",
        answer: "Turning it into a joke.",
        keywords: ["joke", "funny", "humor"],
        category: "style"
      },
      {
        question: "Make it sound like a poem.",
        answer: "Here's the poetic version.",
        keywords: ["poem", "poetry", "verse"],
        category: "style"
      },
      {
        question: "Rewrite this as a story.",
        answer: "Rewriting it as a story.",
        keywords: ["story", "narrative", "tale"],
        category: "style"
      },
      {
        question: "Add examples from real life.",
        answer: "Adding real-life examples.",
        keywords: ["real life", "examples", "practical"],
        category: "formatting"
      },
      {
        question: "Create a script.",
        answer: "Here's a script version.",
        keywords: ["script", "dialogue", "screenplay"],
        category: "formatting"
      },
      {
        question: "Turn this into bullet points.",
        answer: "Converting to bullet points.",
        keywords: ["bullet points", "list", "points"],
        category: "formatting"
      },
      {
        question: "Make a quiz out of it.",
        answer: "Here's a quick quiz.",
        keywords: ["quiz", "questions", "test"],
        category: "formatting"
      },
      {
        question: "Turn it into a conversation.",
        answer: "Rewriting as a conversation.",
        keywords: ["conversation", "dialogue", "chat"],
        category: "formatting"
      },
      {
        question: "Add humor.",
        answer: "Humor added.",
        keywords: ["humor", "funny", "jokes"],
        category: "style"
      },
      {
        question: "Remove technical terms.",
        answer: "Technical terms removed.",
        keywords: ["technical terms", "jargon", "simple"],
        category: "style"
      },
      {
        question: "Explain it like I'm five.",
        answer: "Here's the simple version.",
        keywords: ["explain like five", "simple", "basic"],
        category: "style"
      },
      {
        question: "Use analogies.",
        answer: "Using analogies now.",
        keywords: ["analogies", "comparisons", "metaphors"],
        category: "style"
      },
      {
        question: "Give a visual description.",
        answer: "Here's a visual-style description.",
        keywords: ["visual", "description", "imagery"],
        category: "formatting"
      },
      {
        question: "Reformat for email.",
        answer: "Reformatted for email.",
        keywords: ["email", "format", "message"],
        category: "formatting"
      },
      {
        question: "Make it a social media post.",
        answer: "Here's a social post version.",
        keywords: ["social media", "post", "social"],
        category: "formatting"
      },
      {
        question: "Turn it into a headline.",
        answer: "Here's a headline.",
        keywords: ["headline", "title", "header"],
        category: "formatting"
      },
      {
        question: "Draft a reply.",
        answer: "Drafting a reply now.",
        keywords: ["reply", "response", "answer"],
        category: "action"
      },
      {
        question: "Write it like a tweet.",
        answer: "Here's a tweet-style version.",
        keywords: ["tweet", "twitter", "short"],
        category: "formatting"
      },
      {
        question: "Make it SEO-friendly.",
        answer: "Optimized for search engines.",
        keywords: ["seo", "search", "optimize"],
        category: "formatting"
      },
      {
        question: "Create a checklist.",
        answer: "Checklist created.",
        keywords: ["checklist", "list", "tasks"],
        category: "formatting"
      },
      {
        question: "Turn this into a presentation outline.",
        answer: "Here's a presentation outline.",
        keywords: ["presentation", "outline", "slides"],
        category: "formatting"
      },
      {
        question: "Turn this into flashcards.",
        answer: "Turning it into flashcards.",
        keywords: ["flashcards", "study", "cards"],
        category: "formatting"
      },
      {
        question: "Convert to Markdown.",
        answer: "Converted to Markdown.",
        keywords: ["markdown", "format", "convert"],
        category: "formatting"
      },
      {
        question: "Keep the tone neutral.",
        answer: "Neutral tone applied.",
        keywords: ["neutral", "tone", "balanced"],
        category: "style"
      },
      {
        question: "Remove repetition.",
        answer: "Repetition removed.",
        keywords: ["repetition", "duplicate", "redundant"],
        category: "formatting"
      },
      {
        question: "Add transitions.",
        answer: "Added smoother transitions.",
        keywords: ["transitions", "flow", "connections"],
        category: "formatting"
      }
    ];

    predefinedPairs.forEach((pair, index) => {
      this.addKnowledgePair(
        pair.question,
        pair.answer,
        pair.keywords,
        pair.category
      );
    });
  }

  private generateId(): string {
    return `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
  }

  private calculateFuzzyScore(query: string, target: string): number {
    try {
      return ratio(query.toLowerCase(), target.toLowerCase());
    } catch {
      return this.levenshteinSimilarity(query.toLowerCase(), target.toLowerCase());
    }
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return ((maxLen - matrix[len2][len1]) / maxLen) * 100;
  }

  private calculateKeywordScore(queryKeywords: string[], pairKeywords: string[]): number {
    if (queryKeywords.length === 0 || pairKeywords.length === 0) return 0;

    let matches = 0;
    for (const queryKeyword of queryKeywords) {
      for (const pairKeyword of pairKeywords) {
        if (queryKeyword.includes(pairKeyword) || pairKeyword.includes(queryKeyword)) {
          matches++;
          break;
        }
      }
    }

    return (matches / queryKeywords.length) * 100;
  }

  private calculatePartialScore(query: string, target: string): number {
    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();

    if (targetLower.includes(queryLower) || queryLower.includes(targetLower)) {
      return 85;
    }

    const queryWords = queryLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);
    let matches = 0;

    for (const queryWord of queryWords) {
      for (const targetWord of targetWords) {
        if (queryWord === targetWord || 
            queryWord.includes(targetWord) || 
            targetWord.includes(queryWord)) {
          matches++;
          break;
        }
      }
    }

    return (matches / queryWords.length) * 70;
  }

  private calculateConfidence(score: number, matchType: string): number {
    let confidence = score / 100;

    // Adjust confidence based on match type
    switch (matchType) {
      case 'exact':
        confidence = Math.min(confidence * 1.2, 1.0);
        break;
      case 'fuzzy':
        confidence = confidence * 0.9;
        break;
      case 'keyword':
        confidence = confidence * 0.8;
        break;
      case 'partial':
        confidence = confidence * 0.85;
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  public async findBestMatch(question: string): Promise<KnowledgeMatch | null> {
    if (!question?.trim()) return null;

    const queryKeywords = this.extractKeywords(question);
    const candidates: KnowledgeMatch[] = [];

    for (const pair of this.knowledgeBase.values()) {
      let bestScore = 0;
      let matchType: 'exact' | 'fuzzy' | 'keyword' | 'partial' = 'fuzzy';

      // Exact match check
      if (pair.question.toLowerCase() === question.toLowerCase()) {
        bestScore = 100;
        matchType = 'exact';
      } else {
        // Fuzzy matching
        const fuzzyScore = this.calculateFuzzyScore(question, pair.question);
        if (fuzzyScore > bestScore) {
          bestScore = fuzzyScore;
          matchType = 'fuzzy';
        }

        // Keyword matching
        const keywordScore = this.calculateKeywordScore(queryKeywords, pair.keywords);
        if (keywordScore > bestScore) {
          bestScore = keywordScore;
          matchType = 'keyword';
        }

        // Partial matching
        const partialScore = this.calculatePartialScore(question, pair.question);
        if (partialScore > bestScore) {
          bestScore = partialScore;
          matchType = 'partial';
        }
      }

      if (bestScore >= this.fuzzyThreshold) {
        const confidence = this.calculateConfidence(bestScore, matchType);
        
        if (confidence >= this.confidenceThreshold) {
          candidates.push({
            pair,
            score: bestScore,
            confidence,
            matchType
          });
        }
      }
    }

    if (candidates.length === 0) return null;

    // Sort by score, then by confidence
    candidates.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 5) {
        return b.confidence - a.confidence;
      }
      return b.score - a.score;
    });

    const bestMatch = candidates[0];
    
    // Update usage statistics
    bestMatch.pair.lastUsed = new Date();
    bestMatch.pair.useCount++;

    return bestMatch;
  }

  public addKnowledgePair(
    question: string,
    answer: string,
    keywords?: string[],
    category: string = 'general'
  ): string {
    const id = this.generateId();
    const extractedKeywords = keywords || this.extractKeywords(question);
    
    const pair: KnowledgePair = {
      id,
      question: question.trim(),
      answer: answer.trim(),
      keywords: [...extractedKeywords, ...this.extractKeywords(answer)],
      category,
      addedAt: new Date(),
      useCount: 0
    };

    this.knowledgeBase.set(id, pair);
    return id;
  }

  public updateKnowledgePair(id: string, updates: Partial<KnowledgePair>): boolean {
    const pair = this.knowledgeBase.get(id);
    if (!pair) return false;

    const updatedPair = { ...pair, ...updates };
    
    // Re-extract keywords if question or answer changed
    if (updates.question || updates.answer) {
      updatedPair.keywords = [
        ...this.extractKeywords(updatedPair.question),
        ...this.extractKeywords(updatedPair.answer)
      ];
    }

    this.knowledgeBase.set(id, updatedPair);
    return true;
  }

  public removeKnowledgePair(id: string): boolean {
    return this.knowledgeBase.delete(id);
  }

  public learnFromFeedback(learningData: LearningData): void {
    this.learningData.push(learningData);
    
    // Adjust confidence thresholds based on feedback
    if (learningData.feedback === 'negative') {
      this.confidenceThreshold = Math.min(this.confidenceThreshold + 0.01, 0.9);
    } else if (learningData.feedback === 'positive') {
      this.confidenceThreshold = Math.max(this.confidenceThreshold - 0.005, 0.4);
    }
  }

  public getStats(): KnowledgeBaseStats {
    const pairs = Array.from(this.knowledgeBase.values());
    const categories: Record<string, number> = {};
    let totalScore = 0;

    pairs.forEach(pair => {
      categories[pair.category] = (categories[pair.category] || 0) + 1;
      totalScore += pair.confidence || 0;
    });

    const mostUsed = pairs
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5);

    return {
      totalPairs: pairs.length,
      categories,
      mostUsed,
      averageScore: pairs.length > 0 ? totalScore / pairs.length : 0,
      lastUpdate: new Date()
    };
  }

  public searchKnowledge(query: string): KnowledgePair[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.knowledgeBase.values()).filter(pair => 
      pair.question.toLowerCase().includes(queryLower) ||
      pair.answer.toLowerCase().includes(queryLower) ||
      pair.keywords.some(keyword => keyword.includes(queryLower)) ||
      pair.category.toLowerCase().includes(queryLower)
    );
  }

  public getKnowledgeByCategory(category: string): KnowledgePair[] {
    return Array.from(this.knowledgeBase.values())
      .filter(pair => pair.category.toLowerCase() === category.toLowerCase());
  }

  public getAllCategories(): string[] {
    const categories = new Set<string>();
    this.knowledgeBase.forEach(pair => categories.add(pair.category));
    return Array.from(categories).sort();
  }

  public exportKnowledge(): string {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      knowledgeBase: Array.from(this.knowledgeBase.values()),
      learningData: this.learningData,
      settings: {
        confidenceThreshold: this.confidenceThreshold,
        fuzzyThreshold: this.fuzzyThreshold
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importKnowledge(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.knowledgeBase || !Array.isArray(importData.knowledgeBase)) {
        throw new Error('Invalid knowledge base format');
      }

      // Clear existing knowledge base
      this.knowledgeBase.clear();

      // Import knowledge pairs
      importData.knowledgeBase.forEach((pair: KnowledgePair) => {
        this.knowledgeBase.set(pair.id, {
          ...pair,
          addedAt: new Date(pair.addedAt),
          lastUsed: pair.lastUsed ? new Date(pair.lastUsed) : undefined
        });
      });

      // Import learning data if available
      if (importData.learningData) {
        this.learningData = importData.learningData;
      }

      // Import settings if available
      if (importData.settings) {
        this.confidenceThreshold = importData.settings.confidenceThreshold || this.confidenceThreshold;
        this.fuzzyThreshold = importData.settings.fuzzyThreshold || this.fuzzyThreshold;
      }

      return true;
    } catch (error) {
      console.error('Failed to import knowledge base:', error);
      return false;
    }
  }

  public updateKnowledgeBase(): void {
    // Cleanup unused entries or optimize storage
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months ago

    for (const [id, pair] of this.knowledgeBase.entries()) {
      // Remove pairs that haven't been used in 6 months and have low usage
      if (pair.useCount < 2 && pair.lastUsed && pair.lastUsed < cutoffDate) {
        this.knowledgeBase.delete(id);
      }
    }

    // Analyze learning data to improve matching
    this.optimizeFromLearningData();
  }

  private optimizeFromLearningData(): void {
    const positivePatterns = this.learningData
      .filter(data => data.feedback === 'positive')
      .map(data => data.question);

    const negativePatterns = this.learningData
      .filter(data => data.feedback === 'negative')
      .map(data => data.question);

    // Adjust thresholds based on patterns
    if (positivePatterns.length > negativePatterns.length * 2) {
      this.confidenceThreshold = Math.max(this.confidenceThreshold - 0.05, 0.4);
    } else if (negativePatterns.length > positivePatterns.length) {
      this.confidenceThreshold = Math.min(this.confidenceThreshold + 0.05, 0.9);
    }
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  public setFuzzyThreshold(threshold: number): void {
    this.fuzzyThreshold = Math.max(0, Math.min(100, threshold));
  }

  public getKnowledgePair(id: string): KnowledgePair | null {
    return this.knowledgeBase.get(id) || null;
  }

  public getAllKnowledge(): KnowledgePair[] {
    return Array.from(this.knowledgeBase.values());
  }
}

// Singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();