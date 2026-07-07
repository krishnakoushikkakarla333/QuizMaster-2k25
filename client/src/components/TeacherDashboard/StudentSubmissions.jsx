import React from "react";

const StudentSubmissions = ({
  student,
  quizTitle,
  quizScore,
  quizAction,
  onClick,
}) => {
  return (
    <div className="text-xs sm:text-sm md:text-base grid grid-cols-[3fr_3fr_2fr_2fr] sm:grid-cols-[4fr_4fr_3fr_2fr] md:grid-cols-[5fr_5fr_3fr_3fr] bg-white border-b last:border-b-0">
      <h1 className="p-2 sm:p-3 md:p-4 truncate">{student}</h1>
      <h1 className="p-2 sm:p-3 md:p-4 truncate">{quizTitle}</h1>
      <p className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm">{quizScore}</p>
      <div className="p-2 sm:p-3 md:p-4 flex items-center">
        {quizAction === "View Report" ? (
          <span
            onClick={onClick}
            className="text-green-600 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            {quizAction}
          </span>
        ) : (
          <span
            onClick={onClick}
            className="bg-green-600 rounded-lg w-[4.5em] sm:w-[5em] h-[1.75em] sm:h-[2em] flex items-center justify-center text-white font-semibold cursor-pointer text-xs sm:text-sm"
          >
            {quizAction}
          </span>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissions;
