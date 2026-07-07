import React, { useState, useContext } from "react";
import supabase from "../../../utils/supabase";
import { LoginContext } from "../../context/LoginContext";

const CreateQuizForm = () => {
  const { userData } = useContext(LoginContext);
  const [questions, setQuestions] = useState([]);
  const [questionId, setQuestionId] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questionId,
        question_text: "",
        question_type: "objective",
        marks: "",
        options: ["", "", "", ""],
        correctOption: null,
      },
    ]);
    setQuestionId(questionId + 1);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleChange = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (id, optionIndex, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handleCorrectOptionChange = (id, optionIndex) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, correctOption: optionIndex } : q
      )
    );
  };

  const validateQuestions = () => {
    if (questions.length === 0) {
      return "At least one question is required.";
    }
    for (const q of questions) {
      if (!q.question_text.trim()) {
        return "All questions must have text.";
      }
      if (!q.marks || isNaN(parseInt(q.marks)) || parseInt(q.marks) <= 0) {
        return "All questions must have valid marks (positive number).";
      }
      if (q.question_type === "objective") {
        if (q.options.some((opt) => !opt.trim())) {
          return "All options for objective questions must be filled.";
        }
        if (q.correctOption === null) {
          return "A correct option must be selected for each objective question.";
        }
      }
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");

    // Validate questions
    const validationError = validateQuestions();
    if (validationError) {
      setErrorMessage(validationError);
      setIsSubmitting(false);
      return;
    }

    const form = e.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const date = form.date.value;
    const duration = parseInt(form.duration.value);

    // Validate form fields
    if (!title) {
      setErrorMessage("Quiz title is required.");
      setIsSubmitting(false);
      return;
    }
    if (!date) {
      setErrorMessage("Quiz date is required.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      setErrorMessage("Valid time limit (in minutes) is required.");
      setIsSubmitting(false);
      return;
    }
    if (!userData?.id) {
      setErrorMessage("User is not authenticated.");
      setIsSubmitting(false);
      return;
    }

    try {
      // // Verify authenticated user
      // const { data: { user }, error: authError } = await supabase.auth.getUser();
      // if (authError || !user || user.id !== userData.id) {
      //   console.error("Authentication error:", JSON.stringify(authError || "User ID mismatch", null, 2));
      //   throw new Error("Authentication failed. Please log in again.");
      // }

      // 1. Insert into quizzes
      const { data: quizInsertData, error: quizInsertError } = await supabase
        .from("quizzes")
        .insert([
          {
            title,
            description,
            date,
            time_limit: duration,
            teacher_id: userData.id,
          },
        ])
        .select("quiz_id");

      if (quizInsertError) {
        console.error(
          "Quiz insert error:",
          JSON.stringify(quizInsertError, null, 2)
        );
        throw new Error(`Failed to insert quiz: ${quizInsertError.message}`);
      }

      if (
        !quizInsertData ||
        quizInsertData.length === 0 ||
        !quizInsertData[0].quiz_id
      ) {
        console.error(
          "No quiz data returned:",
          JSON.stringify(quizInsertData, null, 2)
        );
        throw new Error("Failed to retrieve inserted quiz ID.");
      }

      const quizId = quizInsertData && quizInsertData[0].quiz_id;
      console.log("Inserted quiz ID:", quizId);

      // 2. Insert into questions
      const questionsToInsert = questions.map((q) => ({
        quiz_id: quizId,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        marks: parseInt(q.marks),
      }));

      const { data: insertedQuestions, error: questionsInsertError } =
        await supabase
          .from("questions")
          .insert(questionsToInsert)
          .select();

      if (questionsInsertError) {
        console.error(
          "Questions insert error:",
          JSON.stringify(questionsInsertError, null, 2)
        );
        throw new Error(
          `Failed to insert questions: ${questionsInsertError.message}`
        );
      }

      if (!insertedQuestions || insertedQuestions.length === 0) {
        console.error(
          "No questions data returned:",
          JSON.stringify(insertedQuestions, null, 2)
        );
        throw new Error("Failed to retrieve inserted questions.");
      }

      // 3. Insert into options
      const optionsToInsert = [];
      insertedQuestions.forEach((insertedQ, idx) => {
        const originalQ = questions[idx];
        if (originalQ.question_type === "objective") {
          originalQ.options.forEach((optText, optIdx) => {
            optionsToInsert.push({
              question_id: insertedQ.question_id,
              option_text: optText.trim(),
              is_correct: optIdx === originalQ.correctOption,
            });
          });
        }
      });

      if (optionsToInsert.length > 0) {
        const { error: optionsInsertError } = await supabase
          .from("options")
          .insert(optionsToInsert);
        if (optionsInsertError) {
          console.error(
            "Options insert error:",
            JSON.stringify(optionsInsertError, null, 2)
          );
          throw new Error(
            `Failed to insert options: ${optionsInsertError.message}`
          );
        }
      }

      alert("Quiz created successfully!");
      // Reset form after successful submission
      form.reset();
      setQuestions([]);
      setQuestionId(1);
    } catch (error) {
      console.error("Quiz creation error:", JSON.stringify(error, null, 2));
      setErrorMessage(
        error.message ||
          "Failed to create quiz. Please check the console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[90%] md:w-[80%] lg:w-[70%] xl:w-[80%] max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-4 sm:p-6 md:p-8">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 text-blue-600 flex items-center justify-center">
          Create New Quiz
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <label className="block font-medium text-sm sm:text-base mt-4">
          Quiz Title
        </label>
        <input
          type="text"
          name="title"
          className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
          placeholder="e.g. Midterm Quiz"
          required
        />

        <label className="block font-medium text-sm sm:text-base mt-4">
          Description
        </label>
        <textarea
          name="description"
          className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
          placeholder="Brief description..."
          rows="3"
        ></textarea>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="w-full">
            <label className="block font-medium text-sm sm:text-base">
              Date
            </label>
            <input
              type="date"
              name="date"
              className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
              required
            />
          </div>
          <div className="w-full">
            <label className="block font-medium text-sm sm:text-base">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              name="duration"
              className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
              placeholder="e.g. 30"
              min="1"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Questions</h3>
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-gray-50 p-4 rounded mb-3 border">
              <label className="block font-medium text-sm sm:text-base">
                Question {idx + 1}
              </label>
              <input
                type="text"
                className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
                placeholder="Enter the question"
                value={q.question_text}
                onChange={(e) =>
                  handleChange(q.id, "question_text", e.target.value)
                }
                required
              />

              <div className="flex flex-col sm:flex-row gap-4 mt-3">
                <div className="w-full">
                  <label className="block font-medium text-sm sm:text-base">
                    Type
                  </label>
                  <select
                    className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
                    value={q.question_type}
                    onChange={(e) =>
                      handleChange(q.id, "question_type", e.target.value)
                    }
                  >
                    <option value="objective">Objective</option>
                    <option value="subjective">Subjective</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="block font-medium text-sm sm:text-base">
                    Marks
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 sm:p-3 mt-1 border rounded text-sm sm:text-base"
                    placeholder="e.g. 2"
                    value={q.marks}
                    onChange={(e) =>
                      handleChange(q.id, "marks", e.target.value)
                    }
                    min="1"
                    required
                  />
                </div>
              </div>

              {q.question_type === "objective" && (
                <div className="mt-3">
                  <label className="block font-medium text-sm sm:text-base">
                    Options
                  </label>
                  {q.options.map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name={`correct-option-${q.id}`}
                        checked={q.correctOption === optIdx}
                        onChange={() => handleCorrectOptionChange(q.id, optIdx)}
                        className="mr-2"
                        required={q.question_type === "objective"}
                      />
                      <input
                        type="text"
                        className="w-full p-2 sm:p-3 border rounded text-sm sm:text-base"
                        placeholder={`Option ${optIdx + 1}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(q.id, optIdx, e.target.value)
                        }
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="mt-3 bg-red-600 font-semibold text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-sm sm:text-base"
                onClick={() => removeQuestion(q.id)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="mt-2 bg-blue-600 font-semibold text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-sm sm:text-base"
            onClick={addQuestion}
          >
            + Add Question
          </button>
        </div>

        <button
          type="submit"
          className="mt-6 text-base sm:text-xl w-full bg-blue-600 font-semibold text-white py-2 sm:py-3 rounded-xl disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Quiz"}
        </button>
      </form>
    </div>
  );
};

export default CreateQuizForm;
