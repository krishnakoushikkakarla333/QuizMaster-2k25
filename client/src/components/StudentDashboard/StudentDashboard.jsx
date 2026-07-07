import React, { useState, useEffect, useContext } from "react";
import supabase from "../../../utils/supabase";
import StudentHeader from "./StudentHeader";
import AvailableQuizzes from "./AvailableQuizzes";
import StudentFooter from "./StudentFooter";
import PerformanceReportComp from "./PerformanceReportComp";

import { LoginContext } from "../../context/LoginContext";

const StudentDashboard = () => {
  const { userData, setUserData, setLoggedIn } = useContext(LoginContext);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentResponses, setStudentResponses] = useState([]);

  useEffect(() => {
    const getSessionAndData = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        setLoggedIn(false);
        setUserData(null);
        return;
      }

      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !student) {
        console.error("Student not found", error);
        setLoggedIn(false);
        return;
      }

      setUserData({
        role: "student",
        id: student.student_id,
        name: student.name,
        bec_no: student.bec_no,
      });

      try {
        const [
          { data: quizzes },
          { data: questions },
          { data: options },
          { data: responses },
        ] = await Promise.all([
          supabase.from("quizzes").select("*"),
          supabase.from("questions").select("*"),
          supabase.from("options").select("*"),
          supabase.from("student_response").select("*"),
        ]);

        setQuizzes(quizzes);
        setQuestions(questions);
        setOptions(options);
        setStudentResponses(
          responses.filter((r) => r.student_id === student.student_id)
        );

        const formattedQuizData = quizzes.map((quiz) => {
          const relatedQuestions = questions
            .filter((q) => q.quiz_id === quiz.quiz_id)
            .map((q) => {
              const qOptions = options.filter(
                (opt) => opt.question_id === q.question_id
              );
              return {
                id: q.question_id,
                text: q.question_text,
                type: q.question_type || "objective",
                marks: q.marks || 1,
                options: qOptions.map((opt) => ({
                  option_id: opt.option_id,
                  option_text: opt.option_text,
                })),
                correctOption: qOptions.findIndex(
                  (opt) => opt.is_correct === true
                ),
              };
            });

          return {
            quiz_id: quiz.quiz_id,
            title: quiz.title,
            description: quiz.description,
            date: quiz.date,
            duration: quiz.time_limit,
            teacher_id: quiz.teacher_id,
            questions: relatedQuestions,
          };
        });

        setQuizData(formattedQuizData);
      } catch (err) {
        console.error("Error fetching quiz data", err);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndData();
  }, []);

  const isQuizEvaluated = (quizId) => {
    const studentRes = studentResponses.filter((r) => r.quiz_id === quizId);
    const subjectiveQs = questions.filter(
      (q) => q.quiz_id === quizId && q.question_type === "subjective"
    );
    return subjectiveQs.every((q) => {
      const res = studentRes.find((r) => r.question_id === q.question_id);
      return (
        res && res.mark_obtained !== null && res.mark_obtained !== undefined
      );
    });
  };

  const createQuizzes = (list) => {
    const fullQuizData = quizData.find((q) => q.quiz_id === list.quiz_id);
    const hasAttempted = studentResponses.some(
      (resp) => resp.quiz_id === list.quiz_id
    );

    return (
      <AvailableQuizzes
        key={list.quiz_id}
        quizTitle={list.title}
        quizDuration={list.time_limit}
        quizDate={list.date}
        quizData={fullQuizData}
        hasAttempted={hasAttempted}
      />
    );
  };

  if (loading || !userData) {
    return (
      <div className="p-4 text-center text-lg sm:p-6 md:p-10">Loading...</div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen w-full">
      <StudentHeader />

      <div className="p-4 sm:p-6 md:p-8 lg:p-10 text-black">
        <h1 className="font-semibold text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6">
          Available Quizzes
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {quizzes.map(createQuizzes)}
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 lg:px-10 pb-10 text-black">
        <h1 className="font-semibold text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6">
          Performance Reports
        </h1>

        <div className="overflow-x-auto mb-6">
          <div className="font-semibold text-sm sm:text-base md:text-lg grid grid-cols-[3fr_2fr_2fr] sm:grid-cols-[5fr_3fr_3fr] bg-purple-600 text-white rounded-t-lg">
            <h1 className="p-2 sm:p-3 md:p-4">Quiz</h1>
            <p className="p-2 sm:p-3 md:p-4">Score</p>
            <p className="p-2 sm:p-3 md:p-4">Status</p>
          </div>
          {quizData
            .filter((quiz) =>
              studentResponses.some(
                (resp) =>
                  resp.quiz_id === quiz.quiz_id && isQuizEvaluated(quiz.quiz_id)
              )
            )
            .map((quiz) => (
              <PerformanceReportComp
                key={quiz.quiz_id}
                quizId={quiz.quiz_id}
                quizTitle={quiz.title}
                studentId={userData.id}
              />
            ))}
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6">
            Pending Evaluations
          </h2>
          <div className="space-y-3">
            {quizData &&
            quizData.some((quiz) =>
              studentResponses.some(
                (resp) =>
                  resp.quiz_id === quiz.quiz_id &&
                  !isQuizEvaluated(quiz.quiz_id)
              )
            ) ? (
              quizData
                .filter((quiz) =>
                  studentResponses.some(
                    (resp) =>
                      resp.quiz_id === quiz.quiz_id &&
                      !isQuizEvaluated(quiz.quiz_id)
                  )
                )
                .map((quiz) => (
                  <div
                    key={quiz.quiz_id}
                    className="bg-purple-200 border-l-4 border-purple-600 p-4 rounded shadow"
                  >
                    <h3 className="font-semibold text-md text-purple-700">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-purple-600">
                      Your quiz has been submitted and is pending teacher
                      evaluation.
                    </p>
                  </div>
                ))
            ) : (
              <div className="bg-purple-200 border-l-4 border-purple-600 p-4 rounded shadow">
                <h3 className="font-semibold text-md text-purple-700">
                  No pending Evaluations
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>

      <StudentFooter />
    </div>
  );
};

export default StudentDashboard;
