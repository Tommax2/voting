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

// MCB DEPARTMENT ACCESS CONTROL
function generateAuthorizedMatricNumbers() {
  const authorized = [];
  const SPECIAL_MATRIC_NUMBERS = [
    'SCI21MCB170', // Additional 2021 student
    'SCI21MCB801'  // Special case - possibly transfer/late admission
  ];

  // SCI20MCB001 to SCI20MCB150 (2020 batch: 150 students)
  for (let i = 1; i <= 150; i++) {
    const number = i.toString().padStart(3, '0');
    authorized.push(`SCI20MCB${number}`);
  }
  
  // SCI21MCB001 to SCI21MCB165 (2021 batch: 165 students)
  for (let i = 1; i <= 165; i++) {
    const number = i.toString().padStart(3, '0');
    authorized.push(`SCI21MCB${number}`);
  }
  
  // ADD THE SPECIAL STUDENTS
  SPECIAL_MATRIC_NUMBERS.forEach(matricNumber => {
    authorized.push(matricNumber);
  });
  
  return authorized;
}

const AUTHORIZED_MATRIC_NUMBERS = generateAuthorizedMatricNumbers();

// Function to extract and format matric number from user input
function getMatricFromUser(user) {
  // Check user name field first
  if (user.name) {
    return formatMatricNumber(user.name.trim());
  }
  
  // Check email prefix as fallback
  const emailPrefix = user.email.split('@')[0];
  return formatMatricNumber(emailPrefix);
}

// Function to format matric number to standard format
function formatMatricNumber(input) {
  if (!input) return null;
  
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Pattern matching for MCB department
  const patterns = [
    /^(SCI\d{2}MCB\d{3})$/,
    /^(SCI\d{2}MCB\d{3})$/i
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  // Try: 20MCB001 -> SCI20MCB001
  let constructedMatric = cleaned.match(/^(\d{2}MCB\d{3})$/);
  if (constructedMatric) {
    return `SCI${constructedMatric[1]}`;
  }
  
  // Try: MCB001 with year detection
  constructedMatric = cleaned.match(/^(MCB\d{3})$/);
  if (constructedMatric) {
    return `SCI20${constructedMatric[1]}`;
  }
  
  return cleaned;
}

// Validation function for MCB matric numbers
function validateMCBMatricNumber(matricNumber) {
  if (!matricNumber) {
    return {
      isValid: false,
      message: "Matric number is required"
    };
  }
  
  const pattern = /^SCI(20|21)MCB\d{3}$/;
  
  if (!pattern.test(matricNumber)) {
    return {
      isValid: false,
      message: "Invalid matric number format. Expected format: SCIxxMCBxxx (e.g., SCI20MCB001)"
    };
  }
  
  if (!AUTHORIZED_MATRIC_NUMBERS.includes(matricNumber)) {
    return {
      isValid: false,
      message: "Matric number not in authorized range. Must be SCI20MCB001-150 or SCI21MCB001-200"
    };
  }
  
  return { isValid: true };
}

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
      
      // Extract and format matric number
      const userMatric = getMatricFromUser(currentUser);
      console.log("Extracted matric number:", userMatric);
      
      // Validate matric number
      const validation = validateMCBMatricNumber(userMatric);
      if (!validation.isValid) {
        setError(`Access denied: ${validation.message}`);
        await account.deleteSession("current");
        setUser(null);
        return;
      }
      
      console.log("User authorized with matric number:", userMatric);
      
      // Add matric number to user object for easy access
      currentUser.matricNumber = userMatric;
      setUser(currentUser);

      // Load questions and check if user has voted (using matric number)
      await Promise.all([
        getQuestionsFromDB(),
        checkIfUserVoted(userMatric),
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
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID, [
          Query.limit(limit),
          Query.offset(offset),
        ]);

        allQuestions = [...allQuestions, ...response.documents];
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

  async function checkIfUserVoted(userMatric) {
    try {
      const userVotes = await databases.listDocuments(
        DB_ID,
        USER_VOTES_COLLECTION_ID,
        [Query.equal("matricNumber", userMatric)]
      );

      const voted = userVotes.documents.length > 0;
      setHasVoted(voted);

      if (voted) {
        setSubmitted(true);
        console.log("User has already voted with matric number:", userMatric);
      } else {
        console.log("User has not voted yet with matric number:", userMatric);
      }
    } catch (error) {
      console.log("Error checking user votes:", error);

      if (error.code === 401) {
        console.log("Permission denied checking votes - assuming user hasn't voted yet");
        setHasVoted(false);
        setSubmitted(false);
      } else {
        setHasVoted(false);
        setSubmitted(false);
      }
    }
  }

  async function checkIfUserVotedBeforeSubmit(userMatric) {
    try {
      const userVotes = await databases.listDocuments(
        DB_ID,
        USER_VOTES_COLLECTION_ID,
        [Query.equal("matricNumber", userMatric)]
      );
      return userVotes.documents.length > 0;
    } catch (error) {
      console.log("Error checking user votes before submit:", error);

      if (error.code === 401) {
        console.log("Cannot verify voting status due to permissions");
        return false;
      }
      return false;
    }
  }

  function handleVoteSelect(questionId, answer) {
    if (hasVoted) {
      setError("This matric number has already been used to vote!");
      return;
    }

    setVotes((prev) => ({ ...prev, [questionId]: answer }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const userMatric = user.matricNumber;

    // Double-check voting status
    try {
      const hasAlreadyVoted = await checkIfUserVotedBeforeSubmit(userMatric);
      if (hasAlreadyVoted) {
        setError("This matric number has already been used to vote!");
        setHasVoted(true);
        setSubmitted(true);
        return;
      }
    } catch (error) {
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

      // FIRST: Record that this matric number has voted
      try {
        await databases.createDocument(
          DB_ID,
          USER_VOTES_COLLECTION_ID,
          "unique()",
          {
            matricNumber: userMatric,
            userId: user.$id,
            timestamp: new Date().toISOString(),
            votedQuestions: selectedVotes
          }
        );
        console.log("User vote recorded successfully for matric number:", userMatric);
      } catch (voteRecordError) {
        console.error("Error recording vote:", voteRecordError);
        
        if (
          voteRecordError.code === 409 ||
          voteRecordError.message?.includes("unique") ||
          voteRecordError.message?.includes("duplicate") ||
          voteRecordError.message?.includes("Document with the requested ID already exists")
        ) {
          setError("This matric number has already been used to vote!");
          setHasVoted(true);
          setSubmitted(true);
          return;
        }
        throw voteRecordError;
      }

      // THEN: Update vote counts for each question
      const updatePromises = questions.map(async (question) => {
        const selectedVote = votes[question.$id];
        if (!selectedVote) return;

        let update = {};
        const answerKeys = [
          'answer_1', 'answer_2', 'answer_3', 'answer_4', 'answer_5',
          'answer_6', 'answer_7', 'answer_8', 'answer_9', 'answer_10',
          'answer_11', 'answer_12', 'answer_13', 'answer_14', 'answer_15'
        ];
        
        const voteKeys = [
          'votes_1', 'votes_2', 'votes_3', 'votes_4', 'votes_5',
          'votes_6', 'votes_7', 'votes_8', 'votes_9', 'votes_10',
          'votes_11', 'votes_12', 'votes_13', 'votes_14', 'votes_15'
        ];

        for (let i = 0; i < answerKeys.length; i++) {
          if (selectedVote === question[answerKeys[i]]) {
            update[voteKeys[i]] = (question[voteKeys[i]] || 0) + 1;
            break;
          }
        }

        if (Object.keys(update).length === 0) return;

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

      console.log("Votes submitted successfully for matric number:", userMatric);
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
        <h1>MCB DINNER NIGHT AWARD</h1>
        <div className="user-info">
          <span>Welcome, {user.matricNumber}</span>
          {hasVoted && <span className="voted-badge">Already Voted</span>}
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
          <h2>Thank you for voting!</h2>
          <p>Your votes have been recorded successfully.</p>
          <p className="vote-restriction-notice">
            <strong>Note:</strong> Each matric number can only vote once.
          </p>
          
          <div className="thank-you-message">
            <h3>What happens next?</h3>
            <p>The voting results will be announced during the MCB Dinner Night event.</p>
            <p>Thank you for participating in selecting our award winners!</p>
          </div>
          
          <div className="logout-suggestion">
            <p>You can now safely close this page or log out.</p>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="voting-container">
          <p className="voting-instructions">
            Select <strong>one</strong> option for each category, then submit your votes.
          </p>
          <p className="vote-restriction-notice">
            <strong>Important:</strong> Each matric number can only vote once.
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

// Utility function for testing matric numbers
window.checkMatric = function(matricNumber) {
  const formatted = formatMatricNumber(matricNumber);
  const validation = validateMCBMatricNumber(formatted);
  
  console.log(`Matric: ${matricNumber}`);
  console.log(`Formatted: ${formatted}`);
  console.log(`Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log(`Error: ${validation.message}`);
  }
  
  return validation.isValid;
};

console.log("MCB Department Access Control initialized");
console.log(`Total authorized students: ${AUTHORIZED_MATRIC_NUMBERS.length}`);
console.log("Authorized ranges: SCI20MCB001-150, SCI21MCB001-165, plus special cases");
console.log("Sample authorized matrics:", 
  AUTHORIZED_MATRIC_NUMBERS.slice(0, 3), 
  "...", 
  AUTHORIZED_MATRIC_NUMBERS.slice(147, 153), 
  "...", 
  AUTHORIZED_MATRIC_NUMBERS.slice(-3)
);

export default App;