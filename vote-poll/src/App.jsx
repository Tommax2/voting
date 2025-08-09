import { useEffect, useState } from "react";
import "./App.css";
import {
  COLLECTION_ID,
  DB_ID,
  databases,
  account,
  Query,
  USER_VOTES_COLLECTION_ID,
} from "./server/appwrite";
import Question from "./Components/Question";
import Login from "./Components/Login";
import SignUp from "./Components/Signup";

function App() {
  const [questions, setQuestions] = useState([]);
  const [votes, setVotes] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    setLoading(true);
    setError("");

    try {
      const currentUser = await account.get();
      console.log("User authenticated:", currentUser);
      setUser(currentUser);

      // Load questions and check if user has voted
      await Promise.all([
        getQuestionsFromDB(),
        checkIfUserVoted(currentUser.email),
      ]);
    } catch (error) {
      console.log("No authenticated user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function getQuestionsFromDB() {
    try {
      console.log("Fetching questions from database...");
      
      let allQuestions = [];
      let offset = 0;
      const limit = 100; // Fetch in batches of 100
      let hasMore = true;

      while (hasMore) {
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID, [
          Query.limit(limit),
          Query.offset(offset)
        ]);

        allQuestions = [...allQuestions, ...response.documents];
        
        // Check if there are more documents
        hasMore = response.documents.length === limit;
        offset += limit;
      }
      
      console.log(`Total questions loaded: ${allQuestions.length}`);
      setQuestions(allQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions. Please refresh the page.");
    }
  }

  async function checkIfUserVoted(userEmail) {
    try {
      const userVotes = await databases.listDocuments(
        DB_ID,
        USER_VOTES_COLLECTION_ID,
        [Query.equal("email", userEmail)]
      );

      const voted = userVotes.documents.length > 0;
      setHasVoted(voted);

      if (voted) {
        setSubmitted(true);
        console.log("User has already voted with this email");
      } else {
        console.log("User has not voted yet with this email");
      }
    } catch (error) {
      console.log("Error checking user votes:", error);
      
      // Handle permission errors (401) - assume user hasn't voted
      if (error.code === 401) {
        console.log("Permission denied checking votes - assuming user hasn't voted yet");
        setHasVoted(false);
        setSubmitted(false);
      } else {
        // For other errors, also assume not voted to allow attempt
        setHasVoted(false);
        setSubmitted(false);
      }
    }
  }

  // Helper function to double-check voting status before submission
  async function checkIfUserVotedBeforeSubmit(userEmail) {
    try {
      const userVotes = await databases.listDocuments(
        DB_ID,
        USER_VOTES_COLLECTION_ID,
        [Query.equal("email", userEmail)]
      );
      return userVotes.documents.length > 0;
    } catch (error) {
      console.log("Error checking user votes before submit:", error);
      
      // If permission error, we can't check, so allow the attempt
      // The create operation will fail if duplicate exists
      if (error.code === 401) {
        console.log("Cannot verify voting status due to permissions");
        return false;
      }
      return false; // If we can't check, allow the attempt
    }
  }

  function handleVoteSelect(questionId, answer) {
    if (hasVoted) {
      setError("This email address has already been used to vote!");
      return;
    }

    setVotes((prev) => ({ ...prev, [questionId]: answer }));
    setError(""); // Clear any previous errors
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Only check if we have permission to do so
    try {
      const hasAlreadyVoted = await checkIfUserVotedBeforeSubmit(user.email);
      if (hasAlreadyVoted) {
        setError("This email address has already been used to vote!");
        setHasVoted(true);
        setSubmitted(true);
        return;
      }
    } catch (error) {
      // If we can't check due to permissions, continue with submission
      console.log("Skipping pre-submit vote check due to permissions");
    }

    // Check if user has selected at least one vote
    const selectedVotes = Object.keys(votes);
    if (selectedVotes.length === 0) {
      setError("Please select at least one option before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      console.log("Submitting votes:", votes);

      // FIRST: Record that this email has voted (to prevent race conditions)
      try {
        await databases.createDocument(
          DB_ID,
          USER_VOTES_COLLECTION_ID,
          "unique()",
          {
            email: user.email,
            userId: user.$id,
            timestamp: new Date().toISOString(),
            votedQuestions: selectedVotes,
            userName: user.name || user.email,
          }
        );
        console.log("User vote recorded successfully for email:", user.email);
      } catch (voteRecordError) {
        console.error("Error recording vote:", voteRecordError);
        // If this fails, it might be because the email already exists
        if (
          voteRecordError.code === 409 ||
          voteRecordError.message?.includes("unique") ||
          voteRecordError.message?.includes("duplicate") ||
          voteRecordError.message?.includes("Document with the requested ID already exists")
        ) {
          setError("This email address has already been used to vote!");
          setHasVoted(true);
          setSubmitted(true);
          return;
        }
        throw voteRecordError; // Re-throw if it's a different error
      }

      // THEN: Update vote counts for each question
      const updatePromises = questions.map(async (question) => {
        const selectedVote = votes[question.$id];
        if (!selectedVote) return;

        let update = {};
        if (selectedVote === question.answer_1) {
          update = { votes_1: question.votes_1 + 1 };
        } else if (selectedVote === question.answer_2) {
          update = { votes_2: question.votes_2 + 1 };
        } else if (selectedVote === question.answer_3) {
          update = { votes_3: question.votes_3 + 1 };
        }else if (selectedVote === question.answer_4) {
          update = { votes_4: question.votes_4 + 1 };
        } else if (selectedVote === question.answer_5) {
          update = { votes_5: question.votes_5 + 1 };
        } else if (selectedVote === question.answer_6) {
          update = { votes_6: question.votes_6 + 1 };
        } else if (selectedVote === question.answer_7) {
          update = { votes_7: question.votes_7 + 1 };
        } else if (selectedVote === question.answer_8) {
          update = { votes_8: question.votes_8 + 1 };
        } else if (selectedVote === question.answer_9) {
          update = { votes_9: question.votes_9 + 1 };
        } else if (selectedVote === question.answer_10) {
          update = { votes_10: question.votes_10 + 1 };
        } else if (selectedVote === question.answer_11) {
          update = { votes_11: question.votes_11 + 1 };
        } else if (selectedVote === question.answer_12) {
          update = { votes_12: question.votes_12 + 1 };
        } else if (selectedVote === question.answer_13) {
          update = { votes_13: question.votes_13 + 1 };
        } else if (selectedVote === question.answer_14) {
          update = { votes_14: question.votes_14 + 1 };
        } else if (selectedVote === question.answer_15) {
          update = { votes_15: question.votes_15 + 1 };
        }
         else {
          return;
        }

        return databases.updateDocument(
          DB_ID,
          COLLECTION_ID,
          question.$id,
          update
        );
      });

      // Wait for all vote updates to complete
      await Promise.all(updatePromises.filter(Boolean));

      // Refresh questions to show updated results
      await getQuestionsFromDB();

      setVotes({});
      setSubmitted(true);
      setHasVoted(true);

      console.log("Votes submitted successfully for email:", user.email);
    } catch (error) {
      console.error("Error submitting votes:", error);
      setError("Failed to submit votes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await account.deleteSession("current");
      setUser(null);
      setShowLogin(true);
      setQuestions([]);
      setVotes({});
      setSubmitted(false);
      setHasVoted(false);
      setError("");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      // Force logout even if there's an error
      setUser(null);
      setShowLogin(true);
      setQuestions([]);
      setVotes({});
      setSubmitted(false);
      setHasVoted(false);
      setError("");
    }
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show authentication forms if user is not logged in
  if (!user) {
    return showLogin ? (
      <Login
        onSignupClick={() => {
          setShowLogin(false);
          setError("");
        }}
        onLogin={checkUser}
      />
    ) : (
      <SignUp
        onLoginClick={() => {
          setShowLogin(true);
          setError("");
        }}
        onSignup={checkUser}
      />
    );
  }

  // Main voting interface for authenticated users
  return (
    <main className="app-main">
      <header className="app-header">
        <h1>SUGFUL AWARD CATEGORY</h1>
        <div className="user-info">
          <span>Welcome, {user.name || user.email}</span>
          {hasVoted && <span className="voted-badge">✅ Already Voted</span>}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {hasVoted && submitted ? (
        <div className="success-container">
          <h2>✅ Thank you for voting!</h2>
          <p>Your votes have been recorded successfully.</p>
          <p className="vote-restriction-notice">
            <strong>Note:</strong> Each email address can only vote once.
          </p>

          <div className="results-section">
            <h3>Current Results:</h3>
            {questions.map((question) => (
              <div key={question.$id} className="result-item">
                <h4>{question.text}</h4>
                <div className="result-stats">
                  <div className="vote-option">
                    <span className="option-name">{question.answer_1}:</span>
                    <span className="vote-count">{question.votes_1} votes</span>
                  </div>
                  <div className="vote-option">
                    <span className="option-name">{question.answer_2}:</span>
                    <span className="vote-count">{question.votes_2} votes</span>
                  </div>
                  <div className="vote-option">
                    <span className="option-name">{question.answer_3}:</span>
                    <span className="vote-count">{question.votes_3} votes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          
        </div>
      ) : (
        <div className="voting-container">
          <p className="voting-instructions">
            Select <strong>one</strong> option for each category, then submit your votes.
          </p>
          <p className="vote-restriction-notice">
            <strong>Important:</strong> You can only vote once. 
          </p>

          {questions.length === 0 ? (
            <p>No questions available at the moment.</p>
          ) : (
            <form onSubmit={handleSubmit} className="voting-form">
              {questions.map((question) => (
                <Question
                  key={question.$id}
                  data={question}
                  selectedVote={votes[question.$id] || ""}
                  onVoteSelect={(answer) =>
                    handleVoteSelect(question.$id, answer)
                  }
                  disabled={submitting || hasVoted}
                />
              ))}

              <button
                type="submit"
                className={`submit-btn ${submitting ? "submitting" : ""}`}
                disabled={
                  submitting || hasVoted || Object.keys(votes).length === 0
                }
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting Votes...
                  </>
                ) : (
                  "Submit Your Votes"
                )}
              </button>

              {Object.keys(votes).length > 0 && (
                <p className="vote-summary">
                  You have selected {Object.keys(votes).length} out of{" "}
                  {questions.length} categories.
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </main>
  );
}

export default App;