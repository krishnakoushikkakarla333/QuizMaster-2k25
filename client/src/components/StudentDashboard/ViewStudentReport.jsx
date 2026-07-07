import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import supabase from "../../../utils/supabase";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import StudentHeader from "./StudentHeader";
import StudentFooter from "./StudentFooter";
Chart.register(...registerables);

const ViewStudentReport = () => {
  const printableRef = useRef();
  const location = useLocation();
  const { student_id, quiz_id } = location.state || {};

  const [quiz, setQuiz] = useState({});
  const [teacherName, setTeacherName] = useState("Unknown Teacher");
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [studentName, setStudentName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    if (!student_id || !quiz_id) {
      // setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch student name
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("name")
          .eq("student_id", student_id)
          .single();
        if (studentError) throw studentError;
        setStudentName(studentData?.name || "Student");

        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("title, description, time_limit, teacher_id")
          .eq("quiz_id", quiz_id)
          .single();
        if (quizError) throw quizError;
        setQuiz(quizData || {});

        // Fetch teacher name
        if (quizData?.teacher_id) {
          const { data: teacherData, error: teacherError } = await supabase
            .from("teachers")
            .select("name")
            .eq("teacher_id", quizData.teacher_id)
            .single();
          if (teacherError) throw teacherError;
          setTeacherName(teacherData?.name || "Unknown Teacher");
        }

        // Fetch quiz questions
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("question_id, question_text, question_type, marks")
          .eq("quiz_id", quiz_id);
        if (questionError) throw questionError;
        setQuestions(questionData || []);

        // Fetch related options by question_ids
        const questionIds = (questionData || []).map((q) => q.question_id);
        if (questionIds.length > 0) {
          const { data: optionsData, error: optionsError } = await supabase
            .from("options")
            .select("option_id, question_id, option_text, is_correct")
            .in("question_id", questionIds);
          if (optionsError) throw optionsError;
          setOptions(optionsData || []);
        }

        // Fetch student responses
        const { data: responseData, error: responseError } = await supabase
          .from("student_response")
          .select("*")
          .eq("student_id", student_id)
          .eq("quiz_id", quiz_id);
        if (responseError) throw responseError;
        setResponses(responseData || []);
      } catch (error) {
        console.error("Error fetching data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student_id, quiz_id]);

  const getOptionText = (option_id) => {
    const option = options.find((opt) => opt.option_id === option_id);
    return option?.option_text || "N/A";
  };

  const getCorrectOptionText = (question_id) => {
    const correctOption = options.find(
      (opt) => opt.question_id === question_id && opt.is_correct
    );
    return correctOption?.option_text || "N/A";
  };

  const getScoreAndStats = () => {
    let correct = 0,
      incorrect = 0,
      obtained = 0,
      total = 0;

    total = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

    responses.forEach((res) => {
      const question = questions.find((q) => q.question_id === res.question_id);
      if (!question) return;

      obtained += res.mark_obtained || 0;

      if (question.question_type === "objective") {
        const selectedOption = options.find(
          (opt) => opt.option_id === res.selected_option_id
        );
        selectedOption?.is_correct ? correct++ : incorrect++;
      } else {
        res.mark_obtained === question.marks ? correct++ : incorrect++;
      }
    });

    return { correct, incorrect, obtained, total };
  };

  const { correct, incorrect, obtained, total } = getScoreAndStats();
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        window.location.reload();
      }, 1000); // 4 seconds
  
      return () => clearTimeout(timeout); // cleanup on unmount
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="p-4 text-center text-lg sm:p-6 md:p-10">Loading...</div>
    );
  }

  if (!student_id || !quiz_id) {
    return (
      <div className="p-4 text-center text-lg sm:p-6 md:p-10 text-red-600">
        Error: Missing student or quiz information
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <StudentHeader />
      <main className="flex-grow p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
        <div ref={printableRef} className="w-full mx-auto">
          {/* Quiz Details Card */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 grid grid-cols-[7fr_3fr]">
            <div className="">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center mb-2 sm:mb-4">
                <span className="text-purple-600">
                  {String(quiz.title || "Quiz Report")}
                </span>{" "}
                - <span className="text-gray-800">{String(studentName)}</span>
              </h1>
              <div className="text-sm sm:text-base text-gray-600 space-y-2">
                <p>
                  <span className="font-semibold">Description:</span>{" "}
                  {String(quiz.description || "No description available")}
                </p>
                <p>
                  <span className="font-semibold">Time Limit:</span>{" "}
                  {quiz.time_limit
                    ? `${String(quiz.time_limit)} minutes`
                    : "No time limit"}
                </p>
                <p>
                  <span className="font-semibold">Teacher:</span>{" "}
                  {String(teacherName)}
                </p>
              </div>
            
            </div>
            <div>
                {/* Score Card */}
                <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-purple-600 text-white rounded-full flex flex-col items-center justify-center text-center shadow-lg">
                    <p className="text-sm sm:text-base md:text-lg font-bold">
                      Score
                    </p>
                    <p className="text-base sm:text-lg md:text-xl font-semibold">
                      {obtained} / {total}
                    </p>
                  </div>
                </div>
              </div>
          </div>


          {/* Questions and Answers */}
          {questions.length === 0 ? (
            <p className="text-center text-sm sm:text-base md:text-lg text-gray-600">
              No questions found for this quiz.
            </p>
          ) : (
            questions.map((q, idx) => {
              const response = responses.find(
                (r) => r.question_id === q.question_id
              );
              const isObjective = q.question_type === "objective";
              const studentAns = isObjective
                ? getOptionText(response?.selected_option_id)
                : String(response?.answer_text || "Not Answered");
              const selectedOption = options.find(
                (opt) => opt.option_id === response?.selected_option_id
              );
              const isCorrect = isObjective
                ? selectedOption?.is_correct === true
                : response?.mark_obtained === q.marks;

              return (
                <div
                  key={q.question_id}
                  className="bg-white rounded-lg p-3 sm:p-4 md:p-5 my-3 sm:my-4 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <p className="font-semibold text-sm sm:text-base md:text-lg">
                      Q{idx + 1}. {String(q.question_text)}
                    </p>
                    <span className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">
                      Marks: {q.marks}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base">
                    <span className="font-semibold">Student Answer: </span>
                    <span
                      className={isCorrect ? "text-green-600" : "text-red-600"}
                    >
                      {studentAns}
                    </span>
                  </p>
                  {!isCorrect && isObjective && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Correct Answer: </span>
                      {getCorrectOptionText(q.question_id)}
                    </p>
                  )}
                  {!isCorrect && !isObjective && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 italic">
                      Marked as Incorrect
                    </p>
                  )}
                </div>
              );
            })
          )}

        </div>
        {/* Download PDF Button */}
          <div className="text-center my-4 sm:my-6 md:my-8">
            <button
              className="bg-purple-600  text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-colors w-full sm:w-full"
              onClick={() => {
                const element = printableRef.current;
                const opt = {
                  margin: 0.3,
                  filename: `quiz-report-${String(student_id)}.pdf`,
                  image: { type: "jpeg", quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait",
                  },
                };
                html2pdf().from(element).set(opt).save();
              }}
            >
              Download Quiz Report
            </button>
          </div>

        {/* Chart Toggle */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8 max-w-4xl mx-auto">
          <button
            className={`px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base ${
              chartType === "bar"
                ? "bg-purple-600 text-white"
                : "bg-white border border-purple-600 text-purple-600 hover:bg-blue-50"
            }`}
            onClick={() => setChartType("bar")}
          >
            Bar Chart
          </button>
          <button
            className={`px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base ${
              chartType === "pie"
                ? "bg-purple-600 text-white"
                : "bg-white border border-purple-600 text-purple-600 hover:bg-blue-50"
            }`}
            onClick={() => setChartType("pie")}
          >
            Pie Chart
          </button>
        </div>

        {/* Chart Display */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h2 className="font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl mb-3 sm:mb-4 md:mb-6 text-center">
            Performance Analysis
          </h2>
          {correct + incorrect === 0 ? (
            <p className="text-center text-sm sm:text-base md:text-lg text-gray-600">
              No data available for performance analysis.
            </p>
          ) : (
            <>
              {chartType === "bar" ? (
                <Bar
                  data={{
                    labels: ["Correct", "Incorrect"],
                    datasets: [
                      {
                        label: "Answers",
                        data: [correct, incorrect],
                        backgroundColor: ["#4ade80", "#f87171"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    },
                  }}
                />
              ) : (
                <Pie
                  data={{
                    labels: ["Correct", "Incorrect"],
                    datasets: [
                      {
                        data: [correct, incorrect],
                        backgroundColor: ["#4ade80", "#f87171"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
      <StudentFooter />
    </div>
  );
};

export default ViewStudentReport;
