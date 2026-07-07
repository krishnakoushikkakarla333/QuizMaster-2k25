import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";
import StudentHeader from "./StudentHeader";
import StudentFooter from "./StudentFooter";
import { LoginContext } from "../../context/LoginContext";

const AttemptQuiz = () => {
  const { userData } = useContext(LoginContext);
  const navigate = useNavigate();
  const location = useLocation();
  const quizData = location.state?.quizData;

  const [timeLeft, setTimeLeft] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (quizData) {
      setTimeLeft(quizData.duration * 60);
    }
    console.log(quizData);
  }, [quizData]);

  useEffect(() => {
    if (!quizData) return;
    if (timeLeft != null && timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizData, isSubmitted]);

  const handleAnswerChange = (question_id, value) => {
    setAnswers((prev) => ({
      ...prev,
      [question_id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);

    const student_id = userData.id;
    const quiz_id = quizData.quiz_id;
    const date_of_submission = new Date().toISOString();
    const responseEntries = [];

    quizData.questions.forEach((q) => {
      const selected = answers[q.id];
      const isObjective = q.type === "objective";

      let mark_obtained = 0;
      let answer_text = null;
      let selected_option_id = null;

      if (isObjective) {
        selected_option_id = parseInt(selected);
        const correctOptionId = q.options[q.correctOption]?.option_id;
        const isCorrect = selected_option_id === correctOptionId;
        mark_obtained = isCorrect ? q.marks : 0;
      } else {
        answer_text = selected || "";
        mark_obtained = null;
      }

      responseEntries.push({
        student_id,
        quiz_id,
        question_id: q.id,
        selected_option_id: isObjective ? selected_option_id : null,
        answer_text,
        date_of_submission,
        mark_obtained,
      });
    });

    const { data, error } = await supabase
      .from("student_response")
      .insert(responseEntries);

    if (error) {
      console.error("Error submitting:", error.message);
      alert("Submission failed.");
    } else {
      alert("Quiz submitted successfully!");
      navigate("/student");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <StudentHeader />
      <main className="flex-grow mt-2 sm:mt-4 md:mt-6">
        <div className="w-[90%] md:w-[80%] lg:w-[75%] xl:w-[80%] mx-auto bg-white shadow-xl rounded-lg p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-purple-600 mb-2 sm:mb-0">
              {quizData.title}
            </h2>
            <div className="text-sm sm:text-base md:text-lg font-medium text-red-600">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>

          <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base font-semibold">
            {quizData.description}
          </p>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base font-semibold">
            Date: {quizData.date}
          </p>

          {!isSubmitted && (
            <form onSubmit={handleSubmit}>
              <div className="mt-4 sm:mt-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  Questions
                </h3>
                {quizData.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-gray-50 p-3 sm:p-4 rounded mb-2 sm:mb-3 border"
                  >
                    <div className="flex flex-col sm:flex-row justify-between">
                      <label className="block font-medium text-sm sm:text-base">
                        Question {idx + 1}: {q.text}
                      </label>
                      <span className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">
                        Marks: {q.marks}
                      </span>
                    </div>

                    {q.type === "objective" ? (
                      <div className="mt-2 sm:mt-3">
                        {q.options.map((option) => (
                          <div
                            key={option.option_id}
                            className="flex items-center gap-2 mb-2"
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={option.option_id}
                              checked={
                                answers[q.id] === String(option.option_id)
                              }
                              onChange={(e) =>
                                handleAnswerChange(q.id, e.target.value)
                              }
                              required
                              disabled={isSubmitted}
                            />
                            <span>{option.option_text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="w-full p-2 mt-2 sm:mt-3 border rounded text-sm sm:text-base"
                        placeholder="Enter your answer..."
                        rows="3"
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        required
                        disabled={isSubmitted}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl w-full bg-purple-600 font-semibold text-white py-2 sm:py-3 rounded-xl disabled:bg-gray-400"
                disabled={isSubmitted}
              >
                Submit Quiz
              </button>
            </form>
          )}
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default AttemptQuiz;
