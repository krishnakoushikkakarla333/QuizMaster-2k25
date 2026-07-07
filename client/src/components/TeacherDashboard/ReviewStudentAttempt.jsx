import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";

import TeacherHeader from "./TeacherHeader";
import TeacherFooter from "./TeacherFooter";

const ReviewStudentAttempt = () => {
  const printableRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz_id, student_id } = location.state;

  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectiveUpdates, setSubjectiveUpdates] = useState({});

  const fetchData = async () => {
    const { data: qns } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quiz_id);
    const { data: res } = await supabase
      .from("student_response")
      .select("*")
      .eq("quiz_id", quiz_id)
      .eq("student_id", student_id);
    const { data: opts } = await supabase.from("options").select("*");

    setQuestions(qns || []);
    setResponses(res || []);
    setOptions(opts || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubjectiveChange = (question_id, isCorrect) => {
    setSubjectiveUpdates((prev) => ({
      ...prev,
      [question_id]: isCorrect === "yes" ? "yes" : "no",
    }));
  };

  const handleSubmitEvaluation = async () => {
    const updates = responses
      .filter((resp) =>
        questions.find(
          (q) =>
            q.question_id === resp.question_id &&
            q.question_type === "subjective"
        )
      )
      .map((resp) => {
        const isCorrect = subjectiveUpdates[resp.question_id];
        const marks =
          isCorrect === "yes"
            ? questions.find((q) => q.question_id === resp.question_id)
                ?.marks || 0
            : 0;
        return {
          ...resp,
          mark_obtained: marks,
        };
      });

    for (let update of updates) {
      await supabase
        .from("student_response")
        .update({ mark_obtained: update.mark_obtained })
        .eq("student_id", update.student_id)
        .eq("question_id", update.question_id);
    }

    alert("Evaluation submitted successfully!");
    navigate("/teacher");
  };

  const getOptionText = (option_id) =>
    options.find((opt) => opt.option_id === option_id)?.option_text || "N/A";

  const calculateTotal = () => questions.reduce((acc, q) => acc + q.marks, 0);

  const calculateObtained = () => {
    return responses.reduce((acc, r) => {
      const question = questions.find((q) => q.question_id === r.question_id);
      if (!question) return acc;

      if (question.question_type === "objective") {
        return acc + (r.mark_obtained || 0);
      }

      const teacherChoice = subjectiveUpdates[r.question_id];
      if (teacherChoice === "yes") {
        return acc + question.marks;
      } else if (teacherChoice === "no") {
        return acc;
      }

      return acc + (r.mark_obtained || 0);
    }, 0);
  };

  if (loading)
    return (
      <div className="p-4 text-center text-lg sm:p-6 md:p-10">Loading...</div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <TeacherHeader />
      <main
        ref={printableRef}
        className="flex-grow py-4 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-4 sm:mb-6">
          Review Student Submission
        </h2>
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          {questions.map((q, idx) => {
            const response = responses.find(
              (r) => r.question_id === q.question_id
            );
            const isObjective = q.question_type === "objective";

            return (
              <div
                key={q.question_id}
                className="border p-3 sm:p-4 rounded bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Q{idx + 1}. {q.question_text}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">
                    Marks: {q.marks}
                  </span>
                </div>

                {isObjective ? (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p>
                      <strong>Student Answer:</strong>{" "}
                      {getOptionText(response?.selected_option_id)}
                    </p>
                    <p>
                      <strong>Correct:</strong>{" "}
                      {options.find(
                        (opt) =>
                          opt.question_id === q.question_id && opt.is_correct
                      )?.option_text || "Not Found"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {response?.mark_obtained > 0 ? (
                        <span className="text-green-600">✅ Correct</span>
                      ) : (
                        <span className="text-red-600">❌ Incorrect</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p>
                      <strong>Student Answer:</strong> {response?.answer_text}
                    </p>
                    <p>
                      <strong>Evaluate:</strong>
                    </p>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name={`evaluate-${q.question_id}`}
                          value="yes"
                          onChange={() =>
                            handleSubjectiveChange(q.question_id, "yes")
                          }
                          className="h-4 w-4"
                        />
                        <span>✅ Correct</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name={`evaluate-${q.question_id}`}
                          value="no"
                          onChange={() =>
                            handleSubjectiveChange(q.question_id, "no")
                          }
                          className="h-4 w-4"
                        />
                        <span>❌ Incorrect</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-around sm:items-center space-y-4 sm:space-y-0 text-base sm:text-lg font-semibold">
          <p>
            Total Score:{" "}
            <span className="text-blue-700">
              {calculateObtained()} / {calculateTotal()}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-xl w-full sm:w-auto text-sm sm:text-base"
              onClick={handleSubmitEvaluation}
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      </main>
      <TeacherFooter />
    </div>
  );
};

export default ReviewStudentAttempt;