import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import supabase from "../utils/supabase";

import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard/TeacherDashboard";
import NewQuiz from "./components/TeacherDashboard/NewQuiz";
import AttemptQuiz from "./components/StudentDashboard/AttemptQuiz";
import AuthComponent from "./components/Home/AuthComponent";

import { LoginContext } from "./context/LoginContext";
import ReviewStudentAttempt from "./components/TeacherDashboard/ReviewStudentAttempt";
import ViewReport from "./components/TeacherDashboard/ViewReport";
import ViewStudentReport from "./components/StudentDashboard/ViewStudentReport";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        const userId = data.session.user.id;

        const student = await supabase
          .from("students")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (student.data) {
          setLoggedIn(true);
          setUserData({
            role: "student",
            id: student.data.student_id,
            name: student.data.name,
            bec_no: student.data.bec_no,
          });
          return;
        }

        const teacher = await supabase
          .from("teachers")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (teacher.data) {
          setLoggedIn(true);
          setUserData({
            role: "teacher",
            id: teacher.data.teacher_id,
            name: teacher.data.name,
            email: teacher.data.email,
          });
        }
      }
    };

    fetchSession();
  }, []);

  return (
    <div className="font-edu">
      <LoginContext.Provider
        value={{ loggedIn, setLoggedIn, userData, setUserData }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthComponent />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/newQuiz" element={<NewQuiz />} />
            <Route path="/attemptQuiz" element={<AttemptQuiz />} />
            <Route path="/teacher/review" element={<ReviewStudentAttempt />} />
            <Route path="/teacher/report" element={<ViewReport />} />
            <Route path="/student/report" element={<ViewStudentReport />} />
          </Routes>
        </BrowserRouter>
      </LoginContext.Provider>
    </div>
  );
};

export default App;
