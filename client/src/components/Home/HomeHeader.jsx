import React from "react";

const HomeHeader = () => {
  return (
    <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full bg-blue-600 flex items-center px-4 sm:px-6 md:px-8">
      <div className="flex justify-center w-full">
        <h1 className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl mr-4 sm:mr-6 md:mr-8 text-center">
          QuizMaster-2K25
        </h1>
      </div>
    </div>
  );
};

export default HomeHeader;