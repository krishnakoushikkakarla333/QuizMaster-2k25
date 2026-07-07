import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";

import TeacherHeader from "./TeacherHeader";
import TeacherFooter from "./TeacherFooter";
import ManageQuizzes from "./ManageQuizzes";
import StudentSubmissions from "./StudentSubmissions";

import { LoginContext } from "../../context/LoginContext";

const TeacherDashboard = () => {
  const { userData, setLoggedIn, setUserData } = useContext(LoginContext);
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const deleteQuiz = async (quizId) => {
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("quiz_id", quizId);
    if (!error)
      setQuizzes((prev) => prev.filter((quiz) => quiz.quiz_id !== quizId));
  };

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoggedIn(false);
        setUserData(null);
        navigate("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !profile) {
        setLoggedIn(false);
        setUserData(null);
        navigate("/");
        return;
      }

      const teacherData = {
        id: profile.teacher_id,
        name: profile.name,
        email: profile.email,
        role: "teacher",
      };

      setLoggedIn(true);
      setUserData(teacherData);

      // Now fetch dashboard data
      const [
        { data: quizzesData },
        { data: responses },
        { data: questionsData },
      ] = await Promise.all([
        supabase
          .from("quizzes")
          .select("*")
          .eq("teacher_id", profile.teacher_id),
        supabase
          .from("student_response")
          .select(
            `*, quizzes:quiz_id (title, teacher_id), profiles:student_id (name), questions:question_id (question_type, marks)`
          ),
        supabase.from("questions").select("*"),
      ]);

      const filtered = responses.filter(
        (r) => r.quizzes?.teacher_id === profile.teacher_id
      );

      const unique = Array.from(
        new Map(
          filtered.map((entry) => [
            `${entry.student_id}-${entry.quiz_id}`,
            entry,
          ])
        ).values()
      );

      setQuizzes(quizzesData);
      setAllResponses(filtered);
      setSubmissions(unique);
      setQuestions(questionsData);
      setLoading(false);
    };

    fetchSessionAndData();
  }, []);

  const checkIfGraded = (student_id, quiz_id) => {
    const studentResponses = allResponses.filter(
      (s) => s.student_id === student_id && s.quiz_id === quiz_id
    );

    const subjectiveQ = questions.filter(
      (q) => q.quiz_id === quiz_id && q.question_type === "subjective"
    );

    for (let sq of subjectiveQ) {
      const match = studentResponses.find(
        (s) => s.question_id === sq.question_id
      );
      if (
        !match ||
        match.mark_obtained === null ||
        match.mark_obtained === undefined
      ) {
        return false;
      }
    }
    return true;
  };

  const calculateScore = (student_id, quiz_id) => {
    const studentResponses = allResponses.filter(
      (s) => s.student_id === student_id && s.quiz_id === quiz_id
    );

    const obtainedMarks = studentResponses
      .map((res) => res.mark_obtained)
      .filter((mark) => mark !== null && mark !== undefined)
      .reduce((sum, mark) => sum + mark, 0);

    const totalMarks = questions
      .filter((q) => q.quiz_id === quiz_id)
      .reduce((sum, q) => sum + q.marks, 0);

    return `${obtainedMarks}/${totalMarks}`;
  };

  const handleActionClick = (student_id, quiz_id) => {
    const isGraded = checkIfGraded(student_id, quiz_id);
    navigate(isGraded ? "/teacher/report" : "/teacher/review", {
      state: { student_id, quiz_id },
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-lg sm:p-6 md:p-10">Loading...</div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen flex flex-col">
      <TeacherHeader />
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 text-black">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6">
          <h1 className="font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 sm:mb-0">
            Manage Quizzes
          </h1>
          <button
            className="text-white font-semibold bg-blue-600 py-2 px-4 sm:px-6 rounded-lg text-sm sm:text-base w-full sm:w-auto"
            onClick={(e) => {
              e.preventDefault();
              navigate("/teacher/newQuiz");
            }}
          >
            + Create New Quiz
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {quizzes &&
            quizzes.map((quiz) => (
              <ManageQuizzes
                key={quiz.quiz_id}
                quizTitle={quiz.title}
                quizDuration={quiz.time_limit}
                quizDate={quiz.date}
                id={quiz.quiz_id}
                onDelete={deleteQuiz}
              />
            ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 lg:px-10 pb-10 text-black">
        <h1 className="font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 sm:mb-6">
          Student Submissions
        </h1>
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <div className="font-semibold text-xs sm:text-sm md:text-base grid grid-cols-[3fr_3fr_2fr_2fr] sm:grid-cols-[4fr_4fr_3fr_2fr] md:grid-cols-[5fr_5fr_3fr_3fr] bg-blue-600 text-white rounded-t-lg">
            <h1 className="p-2 sm:p-3 md:p-4">Student</h1>
            <h1 className="p-2 sm:p-3 md:p-4">Quiz</h1>
            <p className="p-2 sm:p-3 md:p-4">Score</p>
            <p className="p-2 sm:p-3 md:p-4">Action</p>
          </div>
          {submissions.map((s) => (
            <StudentSubmissions
              key={`${s.student_id}-${s.quiz_id}`}
              student={s.profiles?.name || s.student_id}
              quizTitle={s.quizzes?.title || s.quiz_id}
              quizScore={calculateScore(s.student_id, s.quiz_id)}
              quizAction={
                checkIfGraded(s.student_id, s.quiz_id) ? "View Report" : "Grade"
              }
              onClick={() => handleActionClick(s.student_id, s.quiz_id)}
            />
          ))}
        </div>
      </div>
      <TeacherFooter />
    </div>
  );
};

export default TeacherDashboard;
