import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";

const PerformanceReportComp = ({ quizId, studentId, quizTitle }) => {
  const navigate = useNavigate();
  const [score, setScore] = useState("Calculating...");
  const [status, setStatus] = useState("-");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        // Fetch questions for the quiz
        const { data: questions } = await supabase
          .from("questions")
          .select("question_id, marks")
          .eq("quiz_id", quizId);

        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

        // Fetch student responses
        const { data: responses } = await supabase
          .from("student_response")
          .select("question_id, mark_obtained")
          .eq("student_id", studentId)
          .eq("quiz_id", quizId);

        const obtained = responses.reduce(
          (sum, r) => sum + (r.mark_obtained || 0),
          0
        );

        setScore(`${obtained} / ${totalMarks}`);
        const percent = (obtained / totalMarks) * 100;
        setStatus(percent >= 40 ? "Passed" : "Failed");
      } catch (error) {
        console.error("Error calculating score:", error.message);
        setScore("Error");
        setStatus("Error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, [quizId, studentId]);

  const handleViewReport = () => {
    navigate("/student/report", {
      state: {
        student_id: studentId,
        quiz_id: quizId,
      },
    });
  };

  return (
    <div className="text-md grid grid-cols-[5fr_3fr_3fr] bg-white items-center">
      <h1 className="p-4">{quizTitle}</h1>
      <p className="p-4 text-sm">{isLoading ? "Loading..." : score}</p>
      <button
        onClick={handleViewReport}
        className="text-green-600 font-semibold flex"
      >
        View Report
      </button>
    </div>
  );
};

export default PerformanceReportComp;
