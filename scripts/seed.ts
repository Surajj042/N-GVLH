import mongoose, { Types } from "mongoose";
import type { Document, FilterQuery, Model, UpdateQuery } from "mongoose";
import Answer from "../database/answer.modal";
import Category from "../database/category.modal";
import Chapter from "../database/chapter.modal";
import Course from "../database/course.modal";
import Interaction from "../database/interaction.modal";
import Purchase from "../database/purchase.modal";
import Question from "../database/question.modal";
import Tag from "../database/tag.modal";
import User from "../database/user.modal";
import UserProgress from "../database/userprogress.modal";

const SEED_PREFIX = "seed-demo";
const RANDOM_SEED = 20260925;
const DAY_IN_MS = 86_400_000;
const SEED_EPOCH = new Date("2025-01-15T09:00:00.000Z");

const YOUTUBE_URLS = [
  "https://www.youtube.com/watch?v=hdI2bqOjy3c",
  "https://www.youtube.com/watch?v=rfscVS0vtVW",
  "https://www.youtube.com/watch?v=qz0aGYrrlhU",
  "https://www.youtube.com/watch?v=OXGznpKZ_sA",
  "https://www.youtube.com/watch?v=32M1al-Y6Ag",
  "https://www.youtube.com/watch?v=LDB4uaJ87e0",
  "https://www.youtube.com/watch?v=JJmcL1N2KQs",
  "https://www.youtube.com/watch?v=RGOj5yH7evk",
  "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
  "https://www.youtube.com/watch?v=UB1O30fR-EE",
  "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
  "https://www.youtube.com/watch?v=nu_pCVPKzTk",
  "https://www.youtube.com/watch?v=NTgejLheGeU",
  "https://www.youtube.com/watch?v=61R5kn_kYwY",
] as const;

const USER_PICTURES = [
  "/qna/avatar.svg",
  "/illustrations/teacher.svg",
  "/meeting/person.svg",
  "/qna/user.svg",
] as const;

const COURSE_IMAGES = [
  "/landing/l1.png",
  "/landing/l2.png",
  "/landing/l3.png",
  "/landing/l4.png",
  "/landing/landing1.jpg",
] as const;

const CATEGORY_SEEDS = [
  {
    slug: "web-development",
    label: "Web Development",
    description:
      "Build accessible, responsive web experiences from the ground up.",
  },
  {
    slug: "javascript-typescript",
    label: "JavaScript and TypeScript",
    description: "Strengthen browser and server-side programming fundamentals.",
  },
  {
    slug: "data-science-python",
    label: "Data Science and Python",
    description:
      "Explore data with Python, notebooks, and practical analysis workflows.",
  },
  {
    slug: "backend-apis",
    label: "Backend and APIs",
    description:
      "Design reliable services, APIs, and application architecture.",
  },
  {
    slug: "databases-sql",
    label: "Databases and SQL",
    description: "Model, query, and maintain dependable data stores.",
  },
  {
    slug: "devops-cloud",
    label: "DevOps and Cloud",
    description:
      "Ship software with automation, containers, and useful observability.",
  },
  {
    slug: "frontend-design",
    label: "Frontend Design",
    description:
      "Create thoughtful interfaces with modern layout and styling tools.",
  },
  {
    slug: "career-productivity",
    label: "Career and Productivity",
    description:
      "Develop durable habits for learning, collaboration, and growth.",
  },
] as const;

const TAG_SEEDS = [
  {
    slug: "javascript",
    label: "JavaScript",
    description:
      "Questions about modern JavaScript language features and runtime behavior.",
  },
  {
    slug: "typescript",
    label: "TypeScript",
    description:
      "Typed JavaScript, tooling, generics, and compiler configuration.",
  },
  {
    slug: "react",
    label: "React",
    description: "Components, hooks, rendering, and state management in React.",
  },
  {
    slug: "nextjs",
    label: "Next.js",
    description:
      "Routing, server rendering, data fetching, and Next.js applications.",
  },
  {
    slug: "html",
    label: "HTML",
    description:
      "Semantic HTML, document structure, forms, and browser standards.",
  },
  {
    slug: "css",
    label: "CSS",
    description: "Layout, responsive design, styling, and browser rendering.",
  },
  {
    slug: "nodejs",
    label: "Node.js",
    description: "Server-side JavaScript, modules, streams, and runtime APIs.",
  },
  {
    slug: "express",
    label: "Express",
    description:
      "Express routing, middleware, validation, and API development.",
  },
  {
    slug: "rest-api",
    label: "REST APIs",
    description:
      "API contracts, authentication, errors, and integration patterns.",
  },
  {
    slug: "mongodb",
    label: "MongoDB",
    description: "Document databases, queries, indexes, and aggregation.",
  },
  {
    slug: "sql",
    label: "SQL",
    description:
      "Relational queries, joins, transactions, and database design.",
  },
  {
    slug: "python",
    label: "Python",
    description: "Python syntax, language features, testing, and automation.",
  },
  {
    slug: "pandas",
    label: "Pandas",
    description:
      "DataFrames, cleaning, transformation, and exploratory analysis.",
  },
  {
    slug: "git",
    label: "Git",
    description:
      "Version control workflows, branches, history, and conflict resolution.",
  },
  {
    slug: "github",
    label: "GitHub",
    description:
      "Repositories, pull requests, reviews, and collaborative workflows.",
  },
  {
    slug: "testing",
    label: "Testing",
    description:
      "Unit, integration, end-to-end, and regression testing practices.",
  },
  {
    slug: "tailwind-css",
    label: "Tailwind CSS",
    description:
      "Utility-first styling, responsive design, and design systems.",
  },
  {
    slug: "accessibility",
    label: "Accessibility",
    description:
      "Inclusive, keyboard-friendly, and assistive-technology-aware UI.",
  },
  {
    slug: "devops",
    label: "DevOps",
    description:
      "Automation, deployment pipelines, containers, and operations.",
  },
  {
    slug: "performance",
    label: "Performance",
    description:
      "Profiling and improving the speed and responsiveness of applications.",
  },
] as const;

const COURSE_SEEDS = [
  {
    slug: "javascript-foundations",
    title: "JavaScript Foundations",
    description:
      "Build a strong mental model for functions, objects, asynchronous work, and the browser.",
    categorySlug: "javascript-typescript",
    price: 0,
    teacherIndex: 0,
  },
  {
    slug: "typescript-for-teams",
    title: "TypeScript for Product Teams",
    description:
      "Use TypeScript to make changing codebases safer, clearer, and easier to review.",
    categorySlug: "javascript-typescript",
    price: 29,
    teacherIndex: 1,
  },
  {
    slug: "react-interface-design",
    title: "React Interface Design",
    description:
      "Create composable React interfaces with predictable state and accessible interaction patterns.",
    categorySlug: "frontend-design",
    price: 49,
    teacherIndex: 2,
  },
  {
    slug: "nextjs-production-patterns",
    title: "Next.js Production Patterns",
    description:
      "Organize a Next.js application around reliable data flow, rendering, and deployment boundaries.",
    categorySlug: "web-development",
    price: 59,
    teacherIndex: 3,
  },
  {
    slug: "python-data-wrangling",
    title: "Python Data Wrangling",
    description:
      "Turn messy datasets into clear, reproducible analysis with Python and Pandas.",
    categorySlug: "data-science-python",
    price: 39,
    teacherIndex: 0,
  },
  {
    slug: "nodejs-api-design",
    title: "Node.js API Design",
    description:
      "Design small, observable services with Node.js, Express, validation, and practical tests.",
    categorySlug: "backend-apis",
    price: 79,
    teacherIndex: 1,
  },
  {
    slug: "mongodb-schema-design",
    title: "MongoDB Schema Design",
    description:
      "Model document data for fast reads, maintainable queries, and confident schema evolution.",
    categorySlug: "databases-sql",
    price: 24,
    teacherIndex: 2,
  },
  {
    slug: "sql-for-application-developers",
    title: "SQL for Application Developers",
    description:
      "Learn the relational concepts that make application queries and data models easier to reason about.",
    categorySlug: "databases-sql",
    price: 35,
    teacherIndex: 3,
  },
  {
    slug: "docker-ci-cd-essentials",
    title: "Docker and CI/CD Essentials",
    description:
      "Package applications and automate a dependable path from commit to deployment.",
    categorySlug: "devops-cloud",
    price: 45,
    teacherIndex: 0,
  },
  {
    slug: "accessible-interface-audit",
    title: "Accessible Interface Audits",
    description:
      "Find and fix common accessibility barriers while improving the overall interface quality.",
    categorySlug: "frontend-design",
    price: 0,
    teacherIndex: 1,
  },
  {
    slug: "git-collaboration-workflow",
    title: "Git Collaboration Workflow",
    description:
      "Use branches, reviews, and pull requests to keep team changes understandable and reversible.",
    categorySlug: "career-productivity",
    price: 19,
    teacherIndex: 2,
  },
  {
    slug: "web-performance-lab",
    title: "Web Performance Lab",
    description:
      "Measure real user experience and make focused improvements to loading and interaction speed.",
    categorySlug: "web-development",
    price: 89,
    teacherIndex: 3,
  },
] as const;

const CHAPTER_TOPICS = [
  {
    title: "Foundations and mental models",
    description:
      "Establish the core ideas, vocabulary, and a repeatable way to practice this topic.",
  },
  {
    title: "Building a practical workflow",
    description:
      "Turn the fundamentals into a small, complete workflow you can repeat on a real project.",
  },
  {
    title: "Patterns and tradeoffs",
    description:
      "Compare common approaches and practice choosing the right one for a given constraint.",
  },
  {
    title: "Shipping and review",
    description:
      "Polish the work, check edge cases, and prepare a maintainable result for review.",
  },
] as const;

const QUESTION_SEEDS = [
  {
    title: "When should I choose async/await over promise chaining?",
    content:
      "I understand the basic syntax, but I am unsure how to decide between async/await and explicit promise chains in a larger service.",
    tagSlugs: ["javascript", "nodejs"],
  },
  {
    title: "Why do React keys need to be stable?",
    content:
      "My list renders correctly until I reorder items. I would like an explanation of how reconciliation uses keys and what changes when indexes are used.",
    tagSlugs: ["react", "performance"],
  },
  {
    title: "How do I center a responsive grid without fixed widths?",
    content:
      "I am building a card layout that needs to work from a narrow phone to a wide desktop. Which Grid and Flexbox patterns are most maintainable?",
    tagSlugs: ["css", "tailwind-css"],
  },
  {
    title: "What is the difference between unknown and any in TypeScript?",
    content:
      "I want type-safe handling of values from an API without forcing unsafe assumptions. When should a value be typed as unknown?",
    tagSlugs: ["typescript", "javascript"],
  },
  {
    title: "How does the Node.js event loop handle promise callbacks?",
    content:
      "I can see that promises run after synchronous code, but I am confused about microtasks, timers, and I/O callbacks in a real example.",
    tagSlugs: ["nodejs", "javascript"],
  },
  {
    title: "When is a MongoDB compound index worth the write cost?",
    content:
      "I have a collection with frequent filters and sorts. How should I evaluate a compound index using real query patterns instead of guessing?",
    tagSlugs: ["mongodb", "performance"],
  },
  {
    title: "How do I choose between an inner join and a left join?",
    content:
      "I am building a reporting query and need to preserve rows with missing related records. What should I consider before choosing a join type?",
    tagSlugs: ["sql", "databases"],
  },
  {
    title: "What is a useful mental model for Python list comprehensions?",
    content:
      "I can read simple comprehensions, but nested conditions and generator expressions make them harder to review. How can I make them clearer?",
    tagSlugs: ["python"],
  },
  {
    title: "When is rebasing safer than merging in a shared branch?",
    content:
      "Our team uses both approaches. What signals tell us that a rebase is appropriate, and how do we communicate it without disrupting reviewers?",
    tagSlugs: ["git", "github"],
  },
  {
    title:
      "Which HTTP status code should an API return for a validation failure?",
    content:
      "I am designing a small REST endpoint and want errors that are consistent for both people and client applications. What conventions are widely used?",
    tagSlugs: ["rest-api", "nodejs"],
  },
  {
    title: "How should server components and client components share data?",
    content:
      "I am moving an application to a server-first rendering model. Where should loading and mutation code live, and what belongs in the browser?",
    tagSlugs: ["nextjs", "react"],
  },
  {
    title: "How do I avoid stale data when a React effect refetches?",
    content:
      "A request can finish after a newer request and overwrite the screen. What pattern keeps the latest result while still handling loading and errors?",
    tagSlugs: ["react", "nextjs"],
  },
  {
    title: "Where should Vite environment variables be read in a React app?",
    content:
      "I want to keep secrets out of the browser while still configuring different public API URLs. What is the safe boundary?",
    tagSlugs: ["react", "devops"],
  },
  {
    title: "What is the safest way to store a short-lived session token?",
    content:
      "I am comparing cookies with browser storage and need to account for XSS, expiry, and same-site behavior. What tradeoffs should a small web app make?",
    tagSlugs: ["rest-api", "accessibility"],
  },
  {
    title: "How do I keep a database transaction short?",
    content:
      "A transaction currently includes an HTTP call and takes much longer than expected. How can I identify work that belongs outside the transaction?",
    tagSlugs: ["sql", "backend"],
  },
  {
    title: "What should a small Docker image optimize for?",
    content:
      "I am building a container for a Node.js service and want a readable image without unnecessary layers. Which practices give the best balance?",
    tagSlugs: ["devops", "nodejs"],
  },
  {
    title: "How can I make a form usable with a keyboard and a screen reader?",
    content:
      "The form works with a mouse, but focus order and announcements are confusing. Which native elements and labels should I reach for first?",
    tagSlugs: ["accessibility", "html"],
  },
  {
    title: "When should a layout use CSS Grid instead of Flexbox?",
    content:
      "I am refactoring a dashboard with several breakpoints. How do I choose between one-dimensional and two-dimensional layout tools?",
    tagSlugs: ["css", "tailwind-css"],
  },
  {
    title: "How do Python decorators preserve useful type information?",
    content:
      "I have a decorator that wraps a handler and the IDE loses parameter types. Which typing patterns keep the wrapper maintainable?",
    tagSlugs: ["python", "typescript"],
  },
  {
    title: "What should I test when an asynchronous function has a timeout?",
    content:
      "I want tests that fail quickly without hiding real race conditions. How should I control time and assert the final state?",
    tagSlugs: ["testing", "javascript"],
  },
  {
    title: "When is Mongoose populate the wrong tool?",
    content:
      "A dashboard query is becoming harder to understand as more relations are populated. How can I decide whether to aggregate, join, or shape data explicitly?",
    tagSlugs: ["mongodb", "nodejs"],
  },
  {
    title: "How do I choose between REST and GraphQL for a new service?",
    content:
      "The team has a React client and several clients with different data needs. Which operational and API design tradeoffs matter most?",
    tagSlugs: ["rest-api", "react"],
  },
  {
    title: "What belongs in a Docker Compose file for local development?",
    content:
      "I want a local setup that mirrors production without copying secrets or making onboarding difficult. Which services and settings are essential?",
    tagSlugs: ["devops", "nodejs"],
  },
  {
    title: "How should an OAuth callback validate its state?",
    content:
      "I am adding a sign-in flow and want to prevent login CSRF while keeping the callback simple. What belongs in the state and session checks?",
    tagSlugs: ["rest-api", "accessibility"],
  },
  {
    title: "What is a practical way to prevent SQL injection?",
    content:
      "I understand parameterized queries, but some reporting code still builds strings dynamically. How can I apply the safe pattern consistently?",
    tagSlugs: ["sql", "testing"],
  },
  {
    title: "How should a client cache query results?",
    content:
      "A list refreshes too often and sometimes shows an old response. What invalidation and freshness rules are reasonable for a small application?",
    tagSlugs: ["react", "nextjs"],
  },
  {
    title: "What problem do CSS custom properties solve well?",
    content:
      "I am moving a theme into CSS variables and want to avoid duplicating values. Which values should be variables, and which should remain component-specific?",
    tagSlugs: ["css", "frontend-design"],
  },
  {
    title: "How should a paginated API return its next-page information?",
    content:
      "I am adding pagination to a list endpoint and want clients to handle the end of the collection without making extra assumptions.",
    tagSlugs: ["rest-api", "nodejs"],
  },
  {
    title: "What belongs in a useful GitHub Actions workflow?",
    content:
      "Our CI job is slow and difficult to diagnose. Which checks, caching, and permission defaults should a small repository start with?",
    tagSlugs: ["github", "devops"],
  },
  {
    title: "What should I check in a quick accessibility review?",
    content:
      "I need a repeatable first pass before involving a specialist. Which keyboard, semantics, contrast, and focus checks catch the most issues?",
    tagSlugs: ["accessibility", "html"],
  },
  {
    title:
      "How do I explore a new dataset without loading everything into memory?",
    content:
      "The file is much larger than the sample I need. How can I inspect its shape and answer a few questions with a repeatable workflow?",
    tagSlugs: ["pandas", "python"],
  },
  {
    title: "When are Node.js streams preferable to buffering a file?",
    content:
      "I am processing uploads and memory usage grows with the file size. How do backpressure and piping affect the design?",
    tagSlugs: ["nodejs", "performance"],
  },
  {
    title: "How can I use TypeScript generics without making an API cryptic?",
    content:
      "I want reusable helpers with useful inference, but my first version has too many type parameters. How do I simplify the public surface?",
    tagSlugs: ["typescript", "testing"],
  },
  {
    title: "When should I use a MongoDB aggregation pipeline?",
    content:
      "I can build a result with several application-side passes. When does expressing the transformation in the database make it clearer and faster?",
    tagSlugs: ["mongodb", "sql"],
  },
  {
    title: "What should I include in a code review for a risky change?",
    content:
      "I want reviews to improve shared understanding rather than just request formatting changes. What context and evidence are most helpful?",
    tagSlugs: ["github", "testing"],
  },
  {
    title: "How do I measure a perceived performance problem?",
    content:
      "A page feels slow even though the server response is quick. How can I separate rendering, loading, and interaction problems before optimizing?",
    tagSlugs: ["performance", "nextjs"],
  },
  {
    title: "How do I turn a learning goal into a sustainable weekly plan?",
    content:
      "I have a long list of topics and no consistent progress. How can I choose a small outcome and leave enough room for review?",
    tagSlugs: ["career", "python"],
  },
] as const;

const ANSWER_TEXTS = [
  "Start with a small reproduction, write down the inputs and expected output, and change one part at a time. That usually makes the surprising behavior much easier to explain.",
  "The cleanest approach is to keep the boundary explicit: validate the input, perform the focused operation, and return a result that the caller can inspect without hidden state.",
  "I would first check the assumptions at the boundary, then add a test for the edge case that motivated the question. The test will keep the fix honest as the surrounding code changes.",
  "There are several valid choices here. Compare the tradeoffs in terms of readability, failure recovery, and the amount of work required by the next likely change rather than by personal preference.",
  "A useful pattern is to make the operation observable. Log the important inputs and decisions, keep secrets out of logs, and use the smallest possible reproduction when investigating a failure.",
  "It helps to separate the pure transformation from the framework or database call. Pure code is easier to test, while the adapter can handle validation, persistence, and transport concerns.",
  "For this situation, I prefer a small solution that is easy to reverse. Add an abstraction only after the repeated shape is clear and the interface has a stable vocabulary.",
  "The key is to define the contract before optimizing the implementation. Clarify what is required, what is optional, and how a caller should recover when an operation fails.",
  "You can make this more reliable by keeping state transitions explicit and using a stable identifier for the operation. That prevents duplicate work when a request is retried.",
  "A good middle ground is to implement the simplest complete version, measure the important behavior, and leave a clear extension point for the next requirement instead of guessing at it.",
  "The important distinction is between a symptom and the underlying constraint. Once the constraint is named, the solution usually becomes much easier to evaluate and explain to another developer.",
  "I would keep the happy path short and make the error path specific. Include enough context to diagnose the problem, but avoid exposing implementation details to end users.",
  "In a production codebase, review the lifecycle of the resource: creation, use, cleanup, and retries. Most surprising bugs appear when one of those stages is not accounted for.",
  "This is a good candidate for a focused integration test. It verifies the contract between the pieces and catches the kind of wiring problem that a unit test cannot see.",
  "You can experiment with two approaches and compare their observable results. Keep the experiment time-boxed, then write down the decision so the next person does not have to rediscover it.",
] as const;

const SYNTHETIC_USER_SEEDS = [
  {
    name: "Maya Chen",
    username: "maya-chen",
    role: "TEACHER",
    bio: "Frontend educator focused on clear interfaces and durable JavaScript habits.",
    location: "Vancouver, Canada",
  },
  {
    name: "Jordan Alvarez",
    username: "jordan-alvarez",
    role: "TEACHER",
    bio: "Backend engineer who enjoys teaching APIs, databases, and observable systems.",
    location: "Austin, United States",
  },
  {
    name: "Priya Nair",
    username: "priya-nair",
    role: "TEACHER",
    bio: "Data practitioner helping learners build a practical Python and SQL toolkit.",
    location: "Bengaluru, India",
  },
  {
    name: "Elias Romero",
    username: "elias-romero",
    role: "TEACHER",
    bio: "Developer educator working across frontend architecture, testing, and delivery.",
    location: "Medellín, Colombia",
  },
  {
    name: "Amina Yusuf",
    username: "amina-yusuf",
    role: "STUDENT",
    bio: "Building a thoughtful frontend portfolio one small project at a time.",
    location: "London, United Kingdom",
  },
  {
    name: "Noah Bennett",
    username: "noah-bennett",
    role: "STUDENT",
    bio: "Curious about databases, backend services, and reliable deployment practices.",
    location: "Portland, United States",
  },
  {
    name: "Sofia Rossi",
    username: "sofia-rossi",
    role: "STUDENT",
    bio: "Learning to turn data questions into clear, reproducible analyses.",
    location: "Milan, Italy",
  },
  {
    name: "Liam Okafor",
    username: "liam-okafor",
    role: "STUDENT",
    bio: "Frontend developer practicing accessible component design and testing.",
    location: "Lagos, Nigeria",
  },
  {
    name: "Hana Suzuki",
    username: "hana-suzuki",
    role: "STUDENT",
    bio: "Exploring TypeScript, React, and the craft of maintaining small applications.",
    location: "Osaka, Japan",
  },
  {
    name: "Mateo Silva",
    username: "mateo-silva",
    role: "STUDENT",
    bio: "Enjoys turning requirements into small, testable software changes.",
    location: "Lisbon, Portugal",
  },
  {
    name: "Zara Khan",
    username: "zara-khan",
    role: "STUDENT",
    bio: "Building confidence with web fundamentals and data visualization.",
    location: "Manchester, United Kingdom",
  },
  {
    name: "Oliver Smith",
    username: "oliver-smith",
    role: "STUDENT",
    bio: "Learning how teams ship, review, and improve software together.",
    location: "Melbourne, Australia",
  },
  {
    name: "Layla Haddad",
    username: "layla-haddad",
    role: "STUDENT",
    bio: "Interested in inclusive interfaces and practical frontend performance.",
    location: "Amman, Jordan",
  },
  {
    name: "Ethan Brooks",
    username: "ethan-brooks",
    role: "STUDENT",
    bio: "Working through modern JavaScript and the fundamentals of good APIs.",
    location: "Chicago, United States",
  },
  {
    name: "Nia Williams",
    username: "nia-williams",
    role: "STUDENT",
    bio: "Data-curious developer using Python and SQL to make better product decisions.",
    location: "Atlanta, United States",
  },
  {
    name: "Lucas Martin",
    username: "lucas-martin",
    role: "STUDENT",
    bio: "Learning container workflows and dependable software delivery.",
    location: "Lyon, France",
  },
  {
    name: "Aisha Rahman",
    username: "aisha-rahman",
    role: "STUDENT",
    bio: "Frontend learner passionate about accessible, resilient interfaces.",
    location: "Dhaka, Bangladesh",
  },
  {
    name: "Henry Park",
    username: "henry-park",
    role: "STUDENT",
    bio: "Exploring documentation, testing, and the habits behind steady progress.",
    location: "Seoul, South Korea",
  },
  {
    name: "Grace Mensah",
    username: "grace-mensah",
    role: "STUDENT",
    bio: "Building a broad engineering foundation through small, useful projects.",
    location: "Accra, Ghana",
  },
] as const;

type SummaryKey =
  | "users"
  | "categories"
  | "courses"
  | "chapters"
  | "tags"
  | "questions"
  | "answers"
  | "interactions"
  | "purchases"
  | "userProgress";

type SummaryEntry = {
  created: number;
  upserted: number;
};

const summary: Record<SummaryKey, SummaryEntry> = {
  users: { created: 0, upserted: 0 },
  categories: { created: 0, upserted: 0 },
  courses: { created: 0, upserted: 0 },
  chapters: { created: 0, upserted: 0 },
  tags: { created: 0, upserted: 0 },
  questions: { created: 0, upserted: 0 },
  answers: { created: 0, upserted: 0 },
  interactions: { created: 0, upserted: 0 },
  purchases: { created: 0, upserted: 0 },
  userProgress: { created: 0, upserted: 0 },
};

const createRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const random = createRandom(RANDOM_SEED);

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];

const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
};

const dateAt = (dayOffset: number, minuteOffset = 0) =>
  new Date(
    SEED_EPOCH.getTime() + dayOffset * DAY_IN_MS + minuteOffset * 60_000,
  );

const naturalKey = (entity: string, value: string) =>
  `${SEED_PREFIX}:${entity}:${value}`;

const categoryName = (seed: (typeof CATEGORY_SEEDS)[number]) =>
  `${naturalKey("category", seed.slug)}: ${seed.label}`;

const courseName = (seed: (typeof COURSE_SEEDS)[number]) =>
  `${naturalKey("course", seed.slug)}: ${seed.title}`;

const tagName = (seed: (typeof TAG_SEEDS)[number]) =>
  `${naturalKey("tag", seed.slug)}: ${seed.label}`;

const pad = (value: number) => String(value).padStart(2, "0");

const asObjectId = (value: unknown): Types.ObjectId => {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  const stringValue = String(value);

  if (Types.ObjectId.isValid(stringValue)) {
    return new Types.ObjectId(stringValue);
  }

  throw new Error(`Expected an ObjectId, received ${stringValue}`);
};

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const upsertRecord = async <T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  kind: SummaryKey,
): Promise<T> => {
  const result = (await model.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true,
    includeResultMetadata: true,
  })) as unknown as {
    value: T | null;
    lastErrorObject?: { updatedExisting?: boolean };
  };

  if (!result.value) {
    throw new Error(`Unable to upsert ${kind} record`);
  }

  if (result.lastErrorObject?.updatedExisting === false) {
    summary[kind].created += 1;
  } else {
    summary[kind].upserted += 1;
  }

  return result.value;
};

const getVoters = (
  users: SeedUser[],
  authorId: Types.ObjectId,
  itemIndex: number,
  salt: number,
) => {
  const eligibleUsers = users.filter((user) => !user._id.equals(authorId));
  const shuffledUsers = shuffle(eligibleUsers);
  const upvoteCount = Math.min(
    eligibleUsers.length,
    3 + ((itemIndex * 5 + salt * 2) % 8),
  );
  const downvoteCount = Math.min(
    eligibleUsers.length - upvoteCount,
    salt % 4 === 0 ? 2 : salt % 3 === 0 ? 1 : 0,
  );

  return {
    upvotes: shuffledUsers.slice(0, upvoteCount).map((user) => user._id),
    downvotes: shuffledUsers
      .slice(upvoteCount, upvoteCount + downvoteCount)
      .map((user) => user._id),
  };
};

const formatSummaryEntry = (entry: SummaryEntry) =>
  `${entry.created} created, ${entry.upserted} upserted`;

type SeedUser = {
  _id: Types.ObjectId;
  clerkId: string;
  role: string;
};

type SeedRecord = {
  _id: Types.ObjectId;
};

const seedDatabase = async () => {
  const mongodbUrl = process.env.MONGODB_URL;

  if (!mongodbUrl) {
    throw new Error("Missing MONGODB_URL environment variable");
  }

  await mongoose.connect(mongodbUrl, {
    dbName: "n-gvlh",
    serverSelectionTimeoutMS: 10_000,
  });

  const existingUsers = await User.find({
    clerkId: { $not: /^seed-demo-/ },
  })
    .sort({ joinedAt: 1, _id: 1 })
    .lean()
    .exec();

  assert(existingUsers.length === 1, "Expected exactly one non-seed user");
  assert(
    existingUsers[0].role === "STUDENT",
    "The existing user must have the STUDENT role",
  );

  const existingUser: SeedUser = {
    _id: asObjectId(existingUsers[0]._id),
    clerkId: existingUsers[0].clerkId,
    role: existingUsers[0].role,
  };

  const syntheticUsers: SeedUser[] = [];

  for (const [index, userSeed] of SYNTHETIC_USER_SEEDS.entries()) {
    const clerkId = `${SEED_PREFIX}-user-${pad(index + 1)}`;
    const joinedAt = dateAt(30 + index * 11, (index % 5) * 90);
    const user = await upsertRecord(
      User,
      { clerkId },
      {
        $set: {
          name: userSeed.name,
          username: `${SEED_PREFIX}-${userSeed.username}`,
          email: `${SEED_PREFIX}-${userSeed.username}@users.invalid`,
          picture: USER_PICTURES[index % USER_PICTURES.length],
          bio: userSeed.bio,
          location: userSeed.location,
          reputation: 25 + index * 13,
          role: userSeed.role,
          joinedAt,
        },
        $setOnInsert: {
          createdAt: joinedAt,
          updatedAt: joinedAt,
        },
      },
      "users",
    );

    syntheticUsers.push({
      _id: asObjectId(user._id),
      clerkId: user.clerkId,
      role: user.role,
    });
  }

  const users: SeedUser[] = [existingUser, ...syntheticUsers];
  const students = users.filter((user) => user.role === "STUDENT");
  const categories: SeedRecord[] = [];

  for (const [index, categorySeed] of CATEGORY_SEEDS.entries()) {
    const name = categoryName(categorySeed);
    const createdAt = dateAt(20 + index * 8);
    const category = await upsertRecord(
      Category,
      { name },
      {
        $set: {
          name,
        },
        $setOnInsert: {
          courses: [],
          createdAt,
          updatedAt: createdAt,
        },
      },
      "categories",
    );

    categories.push({ _id: asObjectId(category._id) });
  }

  const categoryBySlug = new Map(
    CATEGORY_SEEDS.map((categorySeed, index) => [
      categorySeed.slug,
      categories[index]._id,
    ]),
  );
  const teachers = users.filter((user) => user.role === "TEACHER");
  const courses: Array<SeedRecord & { price: number }> = [];

  for (const [index, courseSeed] of COURSE_SEEDS.entries()) {
    const title = courseName(courseSeed);
    const categoryId = categoryBySlug.get(courseSeed.categorySlug);

    assert(categoryId, `Missing category ${courseSeed.categorySlug}`);

    const teacher = teachers[courseSeed.teacherIndex % teachers.length];
    assert(teacher, `Missing teacher for ${courseSeed.slug}`);
    const createdAt = dateAt(40 + index * 9);
    const course = await upsertRecord(
      Course,
      { title },
      {
        $set: {
          userId: teacher.clerkId,
          title,
          description: courseSeed.description,
          imageUrl: COURSE_IMAGES[index % COURSE_IMAGES.length],
          price: courseSeed.price,
          isPublished: true,
          categoryId,
          category: categoryId,
        },
        $setOnInsert: {
          attachments: [],
          chapters: [],
          purchases: [],
          createdAt,
          updatedAt: createdAt,
        },
      },
      "courses",
    );

    courses.push({
      _id: asObjectId(course._id),
      price: courseSeed.price,
    });
  }

  const chaptersByCourse = new Map<string, SeedRecord[]>();

  for (const [courseIndex, courseSeed] of COURSE_SEEDS.entries()) {
    const course = courses[courseIndex];
    const courseChapters: SeedRecord[] = [];

    for (const [position, topic] of CHAPTER_TOPICS.entries()) {
      const title = `${naturalKey(
        "chapter",
        `${courseSeed.slug}-${pad(position + 1)}`,
      )}: ${topic.title}`;
      const createdAt = dateAt(45 + courseIndex * 9 + position);
      const chapter = await upsertRecord(
        Chapter,
        { courseId: course._id, title },
        {
          $set: {
            title,
            description: `${courseSeed.title}: ${topic.description}`,
            position: position + 1,
            isPublished: true,
            isFree: position === 0,
            youtubeUrl:
              YOUTUBE_URLS[
                (courseIndex * CHAPTER_TOPICS.length + position) %
                  YOUTUBE_URLS.length
              ],
            courseId: course._id,
          },
          $setOnInsert: {
            userProgress: [],
            createdAt,
            updatedAt: createdAt,
          },
        },
        "chapters",
      );

      courseChapters.push({ _id: asObjectId(chapter._id) });
    }

    chaptersByCourse.set(course._id.toString(), courseChapters);
    await Course.updateOne(
      { _id: course._id },
      {
        $addToSet: {
          chapters: { $each: courseChapters.map((chapter) => chapter._id) },
        },
      },
    );
  }

  for (const [index, course] of courses.entries()) {
    const categoryId = categoryBySlug.get(COURSE_SEEDS[index].categorySlug);
    assert(
      categoryId,
      `Missing category for course ${COURSE_SEEDS[index].slug}`,
    );

    await Category.updateOne(
      { _id: categoryId },
      { $addToSet: { courses: course._id } },
    );
  }

  const tags: SeedRecord[] = [];

  for (const [index, tagSeed] of TAG_SEEDS.entries()) {
    const name = tagName(tagSeed);
    const createdOn = dateAt(15 + index * 5);
    const tag = await upsertRecord(
      Tag,
      { name },
      {
        $set: {
          name,
          description: tagSeed.description,
        },
        $setOnInsert: {
          questions: [],
          followers: [],
          createdOn,
        },
      },
      "tags",
    );

    tags.push({ _id: asObjectId(tag._id) });
  }

  const tagBySlug = new Map(
    TAG_SEEDS.map((tagSeed, index) => [tagSeed.slug, tags[index]._id]),
  );
  const questions: Array<SeedRecord & { tagIds: Types.ObjectId[] }> = [];

  for (const [index, questionSeed] of QUESTION_SEEDS.entries()) {
    const author = users[(index * 7 + 3) % users.length];
    const title = `${naturalKey("question", pad(index + 1))}: ${questionSeed.title}`;
    const content = `${title}: ${questionSeed.content}`;
    const tagIds = questionSeed.tagSlugs.map((tagSlug) => {
      const tagId = tagBySlug.get(tagSlug);
      assert(tagId, `Missing tag ${tagSlug}`);
      return tagId;
    });
    const voters = getVoters(users, author._id, index, 1);
    const question = await upsertRecord(
      Question,
      { title },
      {
        $set: {
          title,
          content,
          author: author._id,
          views: 60 + ((index * 97) % 540) + (index % 7) * 11,
        },
        $addToSet: {
          tags: { $each: tagIds },
          upvotes: { $each: voters.upvotes },
          downvotes: { $each: voters.downvotes },
        },
        $setOnInsert: {
          answers: [],
          createdAt: dateAt(index * 3, (index % 6) * 45),
        },
      },
      "questions",
    );

    for (const tagId of tagIds) {
      await Tag.updateOne(
        { _id: tagId },
        { $addToSet: { questions: question._id } },
      );
    }

    questions.push({
      _id: asObjectId(question._id),
      tagIds,
    });
  }

  const answersByQuestion = new Map<string, Types.ObjectId[]>();

  for (const [questionIndex] of QUESTION_SEEDS.entries()) {
    const question = questions[questionIndex];
    const answerIds: Types.ObjectId[] = [];
    const questionAuthor = users[(questionIndex * 7 + 3) % users.length];

    for (let answerIndex = 0; answerIndex < 2; answerIndex += 1) {
      const answerAuthor =
        users[(questionIndex * 5 + answerIndex * 3 + 1) % users.length];
      const adjustedAuthor = answerAuthor._id.equals(questionAuthor._id)
        ? users[(questionIndex * 5 + answerIndex * 3 + 2) % users.length]
        : answerAuthor;
      assert(
        !adjustedAuthor._id.equals(questionAuthor._id),
        `Answer author must differ from question author for ${questionIndex + 1}`,
      );
      const voters = getVoters(
        users,
        adjustedAuthor._id,
        questionIndex * 2 + answerIndex,
        3,
      );
      const answerKey = naturalKey(
        "answer",
        `${pad(questionIndex + 1)}-${pad(answerIndex + 1)}`,
      );
      const answerContent = `${answerKey}: ${pick(ANSWER_TEXTS)}`;
      const answer = await upsertRecord(
        Answer,
        { question: question._id, content: answerContent },
        {
          $set: {
            author: adjustedAuthor._id,
            question: question._id,
            content: answerContent,
          },
          $addToSet: {
            upvotes: { $each: voters.upvotes },
            downvotes: { $each: voters.downvotes },
          },
          $setOnInsert: {
            createdAt: dateAt(
              questionIndex * 3 + answerIndex + 1,
              30 + answerIndex * 60,
            ),
          },
        },
        "answers",
      );

      answerIds.push(asObjectId(answer._id));
    }

    answersByQuestion.set(question._id.toString(), answerIds);
    await Question.updateOne(
      { _id: question._id },
      { $addToSet: { answers: { $each: answerIds } } },
    );
  }

  for (const [index, question] of questions.entries()) {
    const questionAuthor = users[(index * 7 + 3) % users.length];
    const questionDate = dateAt(index * 3, (index % 6) * 45);
    const askFilter = {
      user: questionAuthor._id,
      action: "ask_question",
      question: question._id,
      answer: null,
    };

    await upsertRecord(
      Interaction,
      askFilter,
      {
        $setOnInsert: {
          user: questionAuthor._id,
          action: "ask_question",
          question: question._id,
          tags: question.tagIds,
          createdAt: questionDate,
        },
      },
      "interactions",
    );

    const viewCount = 3 + (index % 5);
    const viewers = shuffle(
      users.filter((user) => !user._id.equals(questionAuthor._id)),
    ).slice(0, viewCount);

    for (const [viewerIndex, viewer] of viewers.entries()) {
      await upsertRecord(
        Interaction,
        {
          user: viewer._id,
          action: "view",
          question: question._id,
          answer: null,
        },
        {
          $setOnInsert: {
            user: viewer._id,
            action: "view",
            question: question._id,
            tags: question.tagIds,
            createdAt: dateAt(index * 3, viewerIndex + 10),
          },
        },
        "interactions",
      );
    }

    const answerIds = answersByQuestion.get(question._id.toString()) ?? [];

    for (const answerId of answerIds) {
      const answer = await Answer.findById(answerId).lean().exec();
      assert(answer, `Missing answer ${answerId.toString()}`);

      await upsertRecord(
        Interaction,
        {
          user: answer.author,
          action: "answer",
          question: question._id,
          answer: answerId,
        },
        {
          $setOnInsert: {
            user: answer.author,
            action: "answer",
            question: question._id,
            answer: answerId,
            tags: question.tagIds,
            createdAt: answer.createdAt,
          },
        },
        "interactions",
      );
    }
  }

  for (const [index, user] of users.entries()) {
    const savedQuestions = shuffle(questions)
      .slice(0, 2 + (index % 4))
      .map((question) => question._id);

    await User.updateOne(
      { _id: user._id },
      { $addToSet: { saved: { $each: savedQuestions } } },
    );
  }

  for (const [studentIndex, student] of students.entries()) {
    const enrollmentCount = 2 + ((studentIndex * 3) % 4);
    const enrolledCourses = shuffle(courses).slice(0, enrollmentCount);

    for (const [courseIndex, course] of enrolledCourses.entries()) {
      const purchase = await upsertRecord(
        Purchase,
        { userId: student.clerkId, courseId: course._id },
        {
          $set: {
            userId: student.clerkId,
            courseId: course._id,
            price: course.price,
          },
          $setOnInsert: {
            createdAt: dateAt(70 + studentIndex * 5 + courseIndex),
            updatedAt: dateAt(70 + studentIndex * 5 + courseIndex),
          },
        },
        "purchases",
      );
      const purchaseId = asObjectId(purchase._id);
      const courseChapters = chaptersByCourse.get(course._id.toString()) ?? [];

      await Course.updateOne(
        { _id: course._id },
        { $addToSet: { purchases: purchaseId } },
      );

      const completedCount = 1 + ((studentIndex + courseIndex) % 4);
      const progressCount = Math.min(
        courseChapters.length,
        completedCount + (completedCount < courseChapters.length ? 1 : 0),
      );

      for (const [position, chapter] of courseChapters
        .slice(0, progressCount)
        .entries()) {
        const progress = await upsertRecord(
          UserProgress,
          { userId: student.clerkId, chapterId: chapter._id },
          {
            $set: {
              userId: student.clerkId,
              chapterId: chapter._id,
              chapter: chapter._id,
              isCompleted: position < completedCount,
            },
            $setOnInsert: {
              createdAt: dateAt(75 + studentIndex * 5 + courseIndex + position),
              updatedAt: dateAt(75 + studentIndex * 5 + courseIndex + position),
            },
          },
          "userProgress",
        );
        const progressId = asObjectId(progress._id);

        await Chapter.updateOne(
          { _id: chapter._id },
          { $addToSet: { userProgress: progressId } },
        );
      }
    }
  }

  const categoryKeys = CATEGORY_SEEDS.map((seed) => categoryName(seed));
  const courseKeys = COURSE_SEEDS.map((seed) => courseName(seed));
  const tagKeys = TAG_SEEDS.map((seed) => tagName(seed));
  const seededQuestionIds = questions.map((question) => question._id);
  const seededAnswerIds = [...answersByQuestion.values()].flat();
  const seededCourseIds = courses.map((course) => course._id);
  const seededChapterIds = [...chaptersByCourse.values()]
    .flat()
    .map((chapter) => chapter._id);

  const [
    totalUsers,
    teacherCount,
    studentCount,
    seededCategoryCount,
    seededCourseCount,
    seededChapterCount,
    seededTagCount,
    seededQuestionCount,
    seededAnswerCount,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "TEACHER" }),
    User.countDocuments({ role: "STUDENT" }),
    Category.countDocuments({ name: { $in: categoryKeys } }),
    Course.countDocuments({ title: { $in: courseKeys } }),
    Chapter.countDocuments({
      _id: { $in: seededChapterIds },
      title: { $regex: `^${SEED_PREFIX}:chapter:` },
    }),
    Tag.countDocuments({ name: { $in: tagKeys } }),
    Question.countDocuments({ _id: { $in: seededQuestionIds } }),
    Answer.countDocuments({ _id: { $in: seededAnswerIds } }),
  ]);

  assert(totalUsers === 20, `Expected 20 users, found ${totalUsers}`);
  assert(teacherCount === 4, `Expected 4 teachers, found ${teacherCount}`);
  assert(studentCount === 16, `Expected 16 students, found ${studentCount}`);
  assert(
    seededCategoryCount === 8,
    `Expected 8 seeded categories, found ${seededCategoryCount}`,
  );
  assert(
    seededCourseCount === 12,
    `Expected 12 seeded courses, found ${seededCourseCount}`,
  );
  assert(
    seededChapterCount === 48,
    `Expected 48 seeded chapters, found ${seededChapterCount}`,
  );
  assert(
    seededTagCount === 20,
    `Expected 20 seeded tags, found ${seededTagCount}`,
  );
  assert(
    seededQuestionCount === 50,
    `Expected 50 seeded questions, found ${seededQuestionCount}`,
  );
  assert(
    seededAnswerCount === 100,
    `Expected 100 seeded answers, found ${seededAnswerCount}`,
  );

  const [
    seededCategoryDocs,
    seededCourseDocs,
    seededQuestionDocs,
    seededAnswerDocs,
  ] = await Promise.all([
    Category.find({ _id: { $in: categories.map((category) => category._id) } })
      .lean()
      .exec(),
    Course.find({ _id: { $in: seededCourseIds } })
      .lean()
      .exec(),
    Question.find({ _id: { $in: seededQuestionIds } })
      .lean()
      .exec(),
    Answer.find({ _id: { $in: seededAnswerIds } })
      .lean()
      .exec(),
  ]);

  for (const category of seededCategoryDocs) {
    const categoryIndex = categoryKeys.indexOf(String(category.name));
    assert(categoryIndex >= 0, `Unexpected seeded category ${category.name}`);
    const expectedCourseIds = COURSE_SEEDS.flatMap((courseSeed, courseIndex) =>
      courseSeed.categorySlug === CATEGORY_SEEDS[categoryIndex].slug
        ? [seededCourseIds[courseIndex].toString()]
        : [],
    );
    const actualCourseIds = (category.courses ?? []).map((courseId) =>
      courseId.toString(),
    );
    assert(
      expectedCourseIds.every((courseId) => actualCourseIds.includes(courseId)),
      `Category ${category.name} is missing seeded courses`,
    );
  }

  for (const course of seededCourseDocs) {
    const courseIndex = courseKeys.indexOf(String(course.title));
    assert(courseIndex >= 0, `Unexpected seeded course ${course.title}`);
    const courseSeed = COURSE_SEEDS[courseIndex];
    const expectedCategoryId = categoryBySlug.get(courseSeed.categorySlug);
    assert(
      expectedCategoryId,
      `Missing category for course ${courseSeed.slug}`,
    );
    assert(
      String(course.categoryId) === String(expectedCategoryId) &&
        String(course.category) === String(expectedCategoryId),
      `Course ${course.title} has invalid category references`,
    );
    const expectedChapterIds = (
      chaptersByCourse.get(course._id.toString()) ?? []
    ).map((chapter) => chapter._id.toString());
    const actualChapterIds = (course.chapters ?? []).map((chapterId) =>
      chapterId.toString(),
    );
    assert(
      expectedChapterIds.every((chapterId) =>
        actualChapterIds.includes(chapterId),
      ),
      `Course ${course.title} is missing seeded chapters`,
    );
    const expectedTeacher = teachers[courseSeed.teacherIndex % teachers.length];
    assert(
      course.userId === expectedTeacher.clerkId,
      `Course ${course.title} has an unexpected owner`,
    );
    assert(
      course.price === courseSeed.price,
      `Course ${course.title} has an unexpected price`,
    );
    assert(course.isPublished, `Course ${course.title} is not published`);
  }

  for (const question of seededQuestionDocs) {
    const expectedAnswerCount = 2;
    const actualAnswerCount = (question.answers ?? []).filter((answerId) =>
      seededAnswerIds.some((seededAnswerId) => seededAnswerId.equals(answerId)),
    ).length;
    assert(
      actualAnswerCount === expectedAnswerCount,
      `Question ${question.title} is missing seeded answers`,
    );
    assert(
      (question.tags ?? []).length > 0,
      `Question ${question.title} is missing tags`,
    );
  }

  for (const answer of seededAnswerDocs) {
    assert(
      answer.question && answer.author,
      `Answer ${answer._id.toString()} is missing references`,
    );
  }

  console.log("Seed completed successfully");
  console.log(`Reused existing user: ${existingUser.clerkId}`);
  console.log(`Users: ${formatSummaryEntry(summary.users)}`);
  console.log(`Categories: ${formatSummaryEntry(summary.categories)}`);
  console.log(`Courses: ${formatSummaryEntry(summary.courses)}`);
  console.log(`Chapters: ${formatSummaryEntry(summary.chapters)}`);
  console.log(`Tags: ${formatSummaryEntry(summary.tags)}`);
  console.log(`Questions: ${formatSummaryEntry(summary.questions)}`);
  console.log(`Answers: ${formatSummaryEntry(summary.answers)}`);
  console.log(`Interactions: ${formatSummaryEntry(summary.interactions)}`);
  console.log(`Purchases: ${formatSummaryEntry(summary.purchases)}`);
  console.log(`User progress: ${formatSummaryEntry(summary.userProgress)}`);
  console.log(
    "Seeded totals: 20 users, 8 categories, 12 courses, 48 chapters, 20 tags, 50 questions, 100 answers",
  );
};

try {
  await seedDatabase();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
} finally {
  try {
    await mongoose.disconnect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`MongoDB disconnect failed: ${message}`);
    process.exitCode = 1;
  }
}
