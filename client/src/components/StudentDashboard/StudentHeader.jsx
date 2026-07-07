import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../utils/supabase";

import { LoginContext } from "../../context/LoginContext";

import { FaUserCircle } from "react-icons/fa";

const StudentHeader = () => {
  const navigate = useNavigate();
  const { loggedIn, setLoggedIn, userData, setUserData } =
    useContext(LoginContext);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    userData && (
      <div className="h-16 sm:h-20 md:h-24 w-full bg-purple-600 flex items-center px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-white font-bold text-xl sm:text-2xl md:text-3xl">
            QuizMaster-2K25 |{" "}
            <span className="text-sm sm:text-lg md:text-xl">Student Panel</span>
          </h1>
          <div className="relative">
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-2 text-white hover:text-gray-200 focus:outline-none"
            >
              <FaUserCircle className="text-5xl md:text-4xl" />
              <span className="hidden md:inline text-sm md:text-base font-medium">
                {userData.name}
              </span>
            </button>
            <div
              className={`${
                isProfileOpen ? "block" : "hidden"
              } absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg py-2 z-10 md:static md:flex md:items-center md:bg-transparent md:shadow-none md:py-0 md:w-auto md:space-x-4`}
            >
              <div className="px-4 py-2 md:p-0">
                <p className="text-md md:hidden sm:text-base text-gray-800 font-medium">
                  {userData.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 md:text-gray-200 font-semibold">
                  <span>BEC</span>: {userData.bec_no}
                </p>
              </div>
              <button
                className="md:hidden mx-4 h-9 rounded-lg w-[8em] bg-red-600 text-white font-semibold "
                onClick={async () => {
                  await supabase.auth.signOut();
                  setLoggedIn(false);
                  setUserData(null);
                  navigate("/");
                }}
              >
                Log out
              </button>
              <button
                className="hidden md:flex w-full md:w-24 h-8 md:h-8 text-purple-600 md:bg-white md:hover:bg-red-600 md:hover:text-white  items-center justify-center font-bold rounded-lg text-sm sm:text-base md:rounded-lg bg-red-600 mx-2 md:mx-0"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setLoggedIn(false);
                  setUserData(null);
                  navigate("/");
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default StudentHeader;
