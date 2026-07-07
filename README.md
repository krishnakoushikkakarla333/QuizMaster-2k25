# QuizMaster-2k25

**QuizMaster-2k25** is a full-stack web application designed to streamline quiz management and evaluation in educational institutions. It empowers faculty to create and manage quizzes and offers students a centralized platform to take quizzes, track performance, and get instant feedback.

> Built with React, Supabase, and TailwindCSS

### Live Demo

[https://quiz-2k25.vercel.app](https://quiz-2k25.vercel.app)

## Features

### Faculty Panel

- Secure login with role-based access
- Dashboard for managing student accounts and quizzes
- Create quizzes with metadata (title, description, date, time limit)
- Add both objective and subjective questions
- Real-time access to student submissions
- Manual grading for subjective responses
- Downloadable performance reports

### Student Panel

- Secure login with role-based access
- Dashboard listing all available quizzes
- Attempt quizzes with real-time timer
- Auto-submission on time completion
- View scores and performance reports post submission

### Grading System

- Auto-grading for objective questions
- Manual grading for subjective answers
- 
## Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/quizmaster-2k25.git
   cd quizmaster-2k25
   ```

2. **Navigate to Client**
   ```bash
   cd client
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Create `.env` File**
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_KEY=your-supabase-anon-key
   ```

5. **Start the App**
   ```bash
   npm start
   ```

## Acknowledgements

- [Supabase](https://supabase.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Contact

**Author:** Nikhil R Nambiar
