
<h2 align="center">N-GVLH</h2>

<p align="center">
  Empowering learning through interactive video courses and a vibrant community.
</p>

<br>

**🚀  What is N-GVLH?**

N-GVLH is an innovative educational platform designed to connect students and teachers in a dynamic and engaging learning environment.

* **Interactive Video Courses:** Explore a wide range of courses taught by experienced educators, featuring interactive video lessons that bring learning to life.

* **Live Video Calling:** Connect directly with your teachers through interactive video calls for personalized support and real-time Q&A sessions.

* **Teacher Announcements:** Stay informed about important updates, course news, and upcoming events through dedicated teacher announcement pages.

* **Personalized Learning:** Follow your favorite teachers to receive tailored announcements and stay up-to-date on their latest offerings.

* **Course Management:** Teachers can easily create and manage courses, adding attachments, videos (from YouTube or our secure platform using Mux), and engaging learning materials.

* **Secure Payments:** Enroll in courses seamlessly and securely using Stripe's trusted payment processing system.

* **Community Q&A:** Ask questions, get answers from teachers and peers, and leverage the power of AI-generated responses through Google Gemini integration.

* **Search & Discovery:** Easily find the courses and teachers you're looking for using our powerful search functionality.

* **Dark & Light Modes:** Customize your learning experience with our intuitive dark and light mode options.

* **Notifications & Reminders:** Never miss an important meeting with our timely notification system.

<br>

**✨ Tech Stack**

| Technology | Description |
|---|---|
| [Next.js](https://nextjs.org/) | A React framework for building fast and SEO-friendly web applications. |
| [Shadcn UI](https://shadcn.com/) | A lightweight and customizable UI library for React. |
| [Framer Motion](https://www.framer.com/motion/) | A powerful animation library for React. |
| [Clerk](https://clerk.dev/) | User authentication and management made easy. |
| [Zod](https://github.com/colinhacks/zod) | A TypeScript-first schema validation library. |
| [MongoDB](https://www.mongodb.com/) | A popular NoSQL database. |
| [Stream](https://getstream.io/) | Real-time messaging and activity feeds. |
| [Mux](https://mux.com/) | Video infrastructure for developers. |
| [UploadThing](https://uploadthing.com/) | File upload and storage service. |
| [Tailwind CSS](https://tailwindcss.com/) | A utility-first CSS framework. |
| [Stripe](https://stripe.com/) | Online payment processing platform. |

<br>

**🚀  Get Started**

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/LowkeyGud/n-gvlh_project-ii.git
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variables:**

   * **Important:** The `.env` file is excluded from version control for security reasons. Copy `.env.example` to `.env.local` and set the necessary environment variables (e.g., MongoDB connection string, Stripe secret key, Clerk keys, Mux keys, UploadThing keys, and Gemini API key). The `app/api` folder is tracked in version control; it contains no secrets.

4. **Local Development:**

   ```bash
   npm run dev
   ```

5. **Deployment (Vercel):**

   * **Note:** This project is intended for educational purposes only and should not be deployed online.



* **`public`:** Static assets (images, fonts, etc.).
* **`app`:** Next.js App Router source code.
    * **`components`:** Reusable UI components.
    * **`api`:** Route handlers (serverless functions) for courses, webhooks, uploads, and AI.
    * **`lib`:** Server actions, authorization helpers, validation, and sanitization utilities.
    * **`database`:** Mongoose models.
<br>


**📸 Screenshots**

<br>


**💡 Contributing**

Contributions are welcome!
<br>

**🌟 About**

This project is developed for my 3rd year project (**Project II**).
<br>

**⚠️ License**

This project is licensed for educational purposes only. It may not be used for commercial purposes or hosted on any online platform. It is intended for learning and experimentation on your own computer.
<br>


**📂 Folder Structure**

```
n-gvlh_project-ii

 ┣ app
 ┃ ┣ (auth)
 ┃ ┃ ┣ (routes)
 ┃ ┃ ┃ ┣ sign-in
 ┃ ┃ ┃ ┃ ┗ [[...sign-in]]
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┗ sign-up
 ┃ ┃ ┃ ┃ ┗ [[...sign-up]]
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┗ layout.tsx
 ┃ ┣ (main)
 ┃ ┃ ┣ (home)
 ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┣ dashboard-section.tsx
 ┃ ┃ ┃ ┃ ┗ empty-dashboard.tsx
 ┃ ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┣ (lms)
 ┃ ┃ ┃ ┣ admin
 ┃ ┃ ┃ ┃ ┣ [id]
 ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ image-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ member-role-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┣ columns.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ data-table.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ courses
 ┃ ┃ ┃ ┃ ┗ [courseId]
 ┃ ┃ ┃ ┃ ┃ ┣ chapters
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ [chapterId]
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ attachment-box.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ course-enroll-button.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ course-progress-button.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ video-player.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ course-mobile-sidebar.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ course-navbar.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ course-sidebar-item.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ course-sidebar.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ my-courses
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ search
 ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┣ categories.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ category-item.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ teacher
 ┃ ┃ ┃ ┃ ┣ analytics
 ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ chart.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ data-card.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ courses
 ┃ ┃ ┃ ┃ ┃ ┣ [courseId]
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapters
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ [chapterId]
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-access-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-actions.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-description-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-title-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-video-choose.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-video-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ chapter-yt-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ actions.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ attachment-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ category-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ chapter-list.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ description-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┣ image-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┃ ┗ price-form.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┣ columns.tsx
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ data-table.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ create
 ┃ ┃ ┃ ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┗ layout.tsx
 ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┣ logo.tsx
 ┃ ┃ ┃ ┃ ┣ sidebar-item.tsx
 ┃ ┃ ┃ ┃ ┣ sidebar-routes.tsx
 ┃ ┃ ┃ ┃ ┗ title-form.tsx
 ┃ ┃ ┃ ┗ layout.tsx
 ┃ ┃ ┣ (meetings)
 ┃ ┃ ┃ ┣ meeting
 ┃ ┃ ┃ ┃ ┗ [id]
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ meetings
 ┃ ┃ ┃ ┃ ┣ dashboard
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ personal-room
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ previous
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ recordings
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ upcoming
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┗ layout.tsx
 ┃ ┃ ┃ ┗ layout.tsx
 ┃ ┃ ┣ (qna)
 ┃ ┃ ┃ ┣ all-questions
 ┃ ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ announcement
 ┃ ┃ ┃ ┃ ┣ new
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┣ AnnouncementForm.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ CustomCard.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ Markdown.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ NewAnnouncement.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ ask-question
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ profile
 ┃ ┃ ┃ ┃ ┣ edit
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┗ [id]
 ┃ ┃ ┃ ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ FollowButton.tsx
 ┃ ┃ ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ question
 ┃ ┃ ┃ ┃ ┣ edit
 ┃ ┃ ┃ ┃ ┃ ┗ [id]
 ┃ ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┗ [id]
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ saved
 ┃ ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ tags
 ┃ ┃ ┃ ┃ ┣ [id]
 ┃ ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ users
 ┃ ┃ ┃ ┃ ┣ loading.tsx
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┃ ┗ not-found.tsx
 ┃ ┃ ┗ layout.tsx
 ┃ ┣ api......
 ┃ ┣ get-started
 ┃ ┃ ┣ _components
 ┃ ┃ ┃ ┗ type-writer.tsx
 ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┗ page.tsx
 ┃ ┣ globals.css
 ┃ ┣ layout.tsx
 ┃ ┗ not-found.tsx
 ┣ components......
 ┣ constants
 ┃ ┣ filters.ts
 ┃ ┗ index.ts
 ┣ context
 ┃ ┗ teacherContext.tsx
 ┣ database
 ┃ ┣ answer.modal.ts
 ┃ ┣ attachment.modal.ts
 ┃ ┣ category.modal.ts
 ┃ ┣ chapter.modal.ts
 ┃ ┣ course.modal.ts
 ┃ ┣ forum.modal.ts
 ┃ ┣ interaction.modal.ts
 ┃ ┣ muxdata.modal.ts
 ┃ ┣ purchase.modal.ts
 ┃ ┣ question.modal.ts
 ┃ ┣ stripecustomer.modal.ts
 ┃ ┣ tag.modal.ts
 ┃ ┣ user.modal.ts
 ┃ ┣ userprogress.modal.ts
 ┃ ┗ warningRemover.ts
 ┣ hooks
 ┃ ┣ use-confetti-store.ts
 ┃ ┣ use-debounce.ts
 ┃ ┣ useGetCallById.ts
 ┃ ┗ useGetCalls.ts
 ┣ lib
 ┃ ┣ actions
 ┃ ┃ ┣ analytics.action.ts
 ┃ ┃ ┣ answer.action.ts
 ┃ ┃ ┣ chapter.action.ts
 ┃ ┃ ┣ course.action.ts
 ┃ ┃ ┣ forum.action.ts
 ┃ ┃ ┣ globalSearch.action.ts
 ┃ ┃ ┣ interaction.action.ts
 ┃ ┃ ┣ progress.action.ts
 ┃ ┃ ┣ question.action.ts
 ┃ ┃ ┣ safe-profile.action.ts
 ┃ ┃ ┣ shared.types.d.ts
 ┃ ┃ ┣ stream.action.ts
 ┃ ┃ ┣ tag.action.ts
 ┃ ┃ ┗ user.action.ts
 ┃ ┣ admin.ts
 ┃ ┣ format.ts
 ┃ ┣ mongoose.ts
 ┃ ┣ stripe.ts
 ┃ ┣ uploadthings.ts
 ┃ ┣ utils.ts
 ┃ ┗ validations.ts
 ┣ providers
 ┃ ┣ confetti-provider.tsx
 ┃ ┣ StreamClientProvider.tsx
 ┃ ┗ taoster-provider.tsx
 ┣ public......
 ┣ styles
 ┃ ┣ fonts.ts
 ┃ ┣ prism.css
 ┃ ┗ theme.css
 ┣ types
 ┃ ┗ index.d.ts
 ┣ .eslintrc.json
 ┣ .gitignore
 ┣ .prettierrc
 ┣ components.json
 ┣ next-env.d.ts
 ┣ next.config.mjs
 ┣ package-lock.json
 ┣ package.json
 ┣ postcss.config.mjs
 ┣ README.md
 ┣ tailwind.config.ts
 ┗ tsconfig.json
```

## Contributors
- - [@Surajj042](https://github.com/Surajj042) (Suraj Gurung)
- - [@LowkeyGud](https://github.com/LowkeyGud) (Chandramani Regmi)

This project was built in collaboration.
