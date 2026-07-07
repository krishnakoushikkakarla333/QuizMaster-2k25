import React, { useState, useContext } from "react";
import supabase from "../../../utils/supabase";
import { useNavigate } from "react-router-dom";
import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";
import { LoginContext } from "../../context/LoginContext";

const AuthComponent = () => {
  const { setLoggedIn, setUserData } = useContext(LoginContext);

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [becNo, setBecNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const authEmail =
      role === "student" ? `${becNo}@student.quizapp.com` : email;

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }
      if (role === "student" && !becNo.trim()) {
        setError("BEC Number is required.");
        return;
      }
      if (role === "teacher" && !email.trim()) {
        setError("Email is required.");
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const table = role === "student" ? "students" : "teachers";
      const insertData =
        role === "student"
          ? { bec_no: becNo, name, user_id: data.user.id }
          : { email, name, user_id: data.user.id };

      const { error: insertError } = await supabase
        .from(table)
        .insert([insertData]);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      alert(`Signed up successfully as ${role}`);
    }

    // LOGIN
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

    if (loginError || !loginData.session) {
      setError("Invalid credentials.");
      return;
    }

    const token = loginData.session.access_token;
    localStorage.setItem("token", token);

    const userId = loginData.user.id;
    const table = role === "student" ? "students" : "teachers";
    const field = "user_id";

    const { data: profile, error: profileError } = await supabase
      .from(table)
      .select("*")
      .eq(field, userId)
      .single();

    if (profileError || !profile) {
      setError("Profile not found.");
      return;
    }

    const userInfo =
      role === "student"
        ? { id: profile.student_id, name: profile.name, bec_no: profile.bec_no }
        : { id: profile.teacher_id, name: profile.name, email: profile.email };

    setLoggedIn(true);
    setUserData({ role, ...userInfo });

    setLoggedIn(true);
    setUserData({ role, ...userInfo });

    alert(`Logged in successfully as ${role}`);
    navigate(role === "student" ? "/student" : "/teacher");
  };

  return (
    <div className="bg-gray-200 flex flex-col">
      <HomeHeader />
      <div className="grid grid-cols-1 md:grid-cols-[6fr_4fr] md:gap-10 p-2 sm:p-4 lg:p-6 xl:p-8">
        <div
          className={`w-full h-80 md:h-full ${
            mode === "login"
              ? "bg-[url('https://resilienteducator.com/wp-content/uploads/2012/10/GettyImages-170126269.jpg')]"
              : "bg-[url('https://www.prestoninternationalschool.com/_site/data/images/galleries/111/Quiz%20Competition%20Sss1%20vs%20Sss2%20(17).JPG')]"
          } bg-center bg-cover`}
        ></div>
        <div className="w-full flex items-center justify-center py-4 sm:py-6 md:py-8">
          <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setMode("login")}
                className={`px-4 py-2 font-semibold ${
                  mode === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-blue-600"
                } rounded-l-lg`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`px-4 py-2 font-semibold ${
                  mode === "signup"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-blue-600"
                } rounded-r-lg`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-4 text-center">
              <label className="mr-4 font-semibold">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  className="mr-1"
                />
                Student
              </label>
              <label className="font-semibold">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === "teacher"}
                  onChange={() => setRole("teacher")}
                  className="mr-1"
                />
                Teacher
              </label>
            </div>

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              {role === "student" ? (
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">BEC Number</label>
                  <input
                    type="text"
                    value={becNo}
                    onChange={(e) => setBecNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              )}

              <div className="mb-4 relative">
                <label className="block mb-1 font-semibold">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-[70%] right-3 text-sm transform -translate-y-1/2 text-blue-600 font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
};

export default AuthComponent;
