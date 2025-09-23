import { useState } from "react";
import { account } from "../server/appwrite";


export default function Signup({ onLoginClick = () => console.log('Login clicked'), onSignup = () => console.log('Signup successful') }) {
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function formatMatricNumber(input) {
    if (!input) return null;
    
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Try: 20MCB001 -> SCI20MCB001
    let constructedMatric = cleaned.match(/^(\d{2}MCB\d{3})$/);
    if (constructedMatric) {
      return `SCI${constructedMatric[1]}`;
    }
    
    // Try: MCB001 with default year 2020
    constructedMatric = cleaned.match(/^(MCB\d{3})$/);
    if (constructedMatric) {
      return `SCI20${constructedMatric[1]}`;
    }
    
    // Return as-is if already in correct format
    if (/^SCI(20|21)MCB\d{3}$/.test(cleaned)) {
      return cleaned;
    }
    
    return cleaned;
  }

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
    
    // Check authorized ranges
    const year = matricNumber.substring(3, 5);
    const number = parseInt(matricNumber.substring(8, 11));
    
    if (year === '20' && (number < 1 || number > 150)) {
      return {
        isValid: false,
        message: "SCI20MCB matric numbers must be between 001-150"
      };
    }
    
    if (year === '21' && (number < 1 || number > 200)) {
      return {
        isValid: false,
        message: "SCI21MCB matric numbers must be between 001-200"
      };
    }
    
    return { isValid: true };
  }

  function validateForm() {
    const newErrors = {};

    // Matric number validation
    if (!matricNumber.trim()) {
      newErrors.matricNumber = "Matric number is required";
    } else {
      const formatted = formatMatricNumber(matricNumber);
      const validation = validateMCBMatricNumber(formatted);
      if (!validation.isValid) {
        newErrors.matricNumber = validation.message;
      }
    }

    // Password validation - check Appwrite requirements
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters (Appwrite requirement)";
    } else if (password.length > 265) {
      newErrors.password = "Password must be less than 265 characters";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function formatMatricAsEmail(matric) {
    // Convert matric number to email format for Appwrite authentication
    const formatted = formatMatricNumber(matric);
    return `${formatted}@mcb.student`;
  }

  async function handleSignup(e) {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formattedMatric = formatMatricNumber(matricNumber);
      const email = formatMatricAsEmail(matricNumber);
      
      console.log("Creating account for matric:", formattedMatric);

      const user = await account.create(
        "unique()",
        email,
        password,
        formattedMatric // Use formatted matric as name
      );
      console.log("Account created successfully:", user);

      // Create session after account creation
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (sessionError) {
        try {
          await account.createEmailSession(email, password);
        } catch (legacyError) {
          await account.createSession(email, password);
        }
      }

      console.log("User session created successfully");
      onSignup();
    } catch (err) {
      console.error("Signup error:", err);

      if (err.code === 409) {
        setError(
          "This matric number is already registered. Please try logging in instead."
        );
      } else if (err.code === 400) {
        const errorMessage = err.message?.toLowerCase() || "";
        if (errorMessage.includes("password")) {
          setError(
            "Password must be 8-265 characters and not commonly used (e.g., avoid 'password123')"
          );
        } else if (errorMessage.includes("email") || errorMessage.includes("user")) {
          setError("Invalid matric number format. Please check and try again.");
        } else {
          setError(
            err.message ||
              "Invalid input. Please check your information and try again."
          );
        }
      } else if (err.code === 429) {
        setError(
          "Too many signup attempts. Please wait a moment and try again."
        );
      } else {
        setError(
          err.message ||
            "Signup failed. Please check your information and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleMatricChange(value) {
    setMatricNumber(value);
    if (fieldErrors.matricNumber) {
      setFieldErrors((prev) => ({ ...prev, matricNumber: "" }));
    }
  }

  function handlePasswordChange(value) {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: "" }));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" 
         style={{
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
           minHeight: '100vh'
         }}>
      
      <div className="auth-container">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register with your MCB matric number</p>

        <div onSubmit={handleSignup}>
          <div>
            <label htmlFor="matricNumber" className="input-label">
              Matric Number
            </label>
            <input
              id="matricNumber"
              type="text"
              placeholder="Enter your matric number (e.g., SCI20MCB001)"
              value={matricNumber}
              onChange={(e) => handleMatricChange(e.target.value)}
              className={`input-field ${fieldErrors.matricNumber ? "input-error" : ""}`}
              required
              autoComplete="username"
              disabled={loading}
              aria-describedby={fieldErrors.matricNumber ? "matric-error" : undefined}
            />
            {fieldErrors.matricNumber && (
              <span id="matric-error" className="error-message">
                {fieldErrors.matricNumber}
              </span>
            )}
            <small style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.875rem',
              marginTop: '8px',
              display: 'block',
              lineHeight: '1.4'
            }}>
              Accepted formats: SCI20MCB001, 20MCB001, or MCB001
              <br />
              Valid ranges: SCI20MCB001-150, SCI21MCB001-200
            </small>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`input-field password-input ${
                  fieldErrors.password ? "input-error" : ""
                }`}
                required
                autoComplete="new-password"
                disabled={loading}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" className="error-message">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`submit-button ${loading ? "loading" : ""}`}
            disabled={loading}
            onClick={handleSignup}
            aria-label="Create your account"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            color: '#ffffff',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>Registration Information:</h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            <li>Only MCB department students can register</li>
            <li>Use your official matric number</li>
            <li>Each matric number can only vote once</li>
            <li>Password must be 8-265 characters and not commonly used</li>
          </ul>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0' }}>
            Already have an account?{" "}
            <button
              type="button"
              className="link-button primary"
              onClick={onLoginClick}
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Modern glassmorphism card design with advanced animations */
        .auth-container {
          position: relative;
          max-width: 520px;
          margin: 40px auto;
          padding: 48px 32px;
          border-radius: 24px;
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 8px 32px rgba(138, 43, 226, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          animation: morphIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(138, 43, 226, 0.1) 45deg,
            rgba(75, 0, 130, 0.15) 90deg,
            rgba(255, 20, 147, 0.1) 135deg,
            transparent 180deg,
            rgba(0, 191, 255, 0.1) 225deg,
            rgba(138, 43, 226, 0.15) 270deg,
            transparent 315deg,
            transparent 360deg
          );
          animation: rotate 20s linear infinite;
          z-index: -1;
        }

        .auth-container::after {
          content: '✦ ✧ ✦ ✧ ✦';
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          font-size: 1.2rem;
          color: rgba(102, 126, 234, 0.3);
          text-align: center;
          animation: float 6s ease-in-out infinite;
          letter-spacing: 2rem;
          z-index: 1;
        }

        /* Advanced animations */
        @keyframes morphIn {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.8) rotateX(10deg);
            filter: blur(10px);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-10px) scale(1.02) rotateX(-2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Unique button design with advanced effects */
        .submit-button, .link-button {
          position: relative;
          background: linear-gradient(135deg, 
            #667eea 0%, 
            #764ba2 50%, 
            #f093fb 100%);
          color: #ffffff;
          border: none;
          border-radius: 16px;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 24px;
          outline: none;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 
            0 8px 25px rgba(102, 126, 234, 0.4),
            0 4px 12px rgba(118, 75, 162, 0.3);
          backdrop-filter: blur(10px);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .submit-button::before, .link-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 255, 255, 0.3), 
            transparent);
          transition: left 0.6s;
        }

        .submit-button:hover, .link-button:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 
            0 15px 35px rgba(102, 126, 234, 0.5),
            0 8px 20px rgba(118, 75, 162, 0.4),
            0 0 30px rgba(240, 147, 251, 0.3);
          background: linear-gradient(135deg, 
            #764ba2 0%, 
            #667eea 50%, 
            #f093fb 100%);
        }

        .submit-button:hover::before, .link-button:hover::before {
          left: 100%;
        }

        .submit-button:active, .link-button:active {
          transform: translateY(-2px) scale(0.98);
        }

        .submit-button.loading {
          opacity: 0.7;
          cursor: not-allowed;
          animation: pulse 2s ease-in-out infinite;
        }

        /* Enhanced spinner with gradient */
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid transparent;
          border-top: 3px solid #ffffff;
          border-right: 3px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Modern input fields with floating labels */
        .input-field, .password-input {
          width: 100%;
          padding: 18px 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 1.1rem;
          margin-top: 8px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: #333;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
        }

        .input-field::placeholder, .password-input::placeholder {
          color: rgba(51, 51, 51, 0.6);
          font-weight: 500;
        }

        .input-field:focus, .password-input:focus {
          border-color: rgba(102, 126, 234, 0.8);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 0 20px rgba(102, 126, 234, 0.3),
            inset 0 2px 4px rgba(0, 0, 0, 0.1);
          outline: none;
          transform: translateY(-2px);
        }

        .input-error {
          border-color: rgba(231, 76, 60, 0.8) !important;
          background: rgba(255, 182, 193, 0.2) !important;
          animation: shake 0.5s ease-in-out;
        }

        .input-label {
          font-weight: 600;
          color: #ffffff;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
        }

        /* Enhanced error messages */
        .error-banner, .error-message {
          background: linear-gradient(135deg, 
            rgba(231, 76, 60, 0.15) 0%, 
            rgba(255, 182, 193, 0.1) 100%);
          color: #ffffff;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 16px 0;
          font-size: 1rem;
          font-weight: 500;
          border: 2px solid rgba(231, 76, 60, 0.3);
          backdrop-filter: blur(10px);
          animation: errorSlide 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
        }

        .error-banner::before, .error-message::before {
          content: '⚠';
          position: absolute;
          left: -30px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.5rem;
          animation: slideIn 0.6s 0.3s both;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes errorSlide {
          0% {
            opacity: 0;
            transform: translateX(-100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideIn {
          to { left: 16px; }
        }

        /* Enhanced password toggle */
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.3rem;
          color: rgba(102, 126, 234, 0.8);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          padding: 4px;
          border-radius: 8px;
        }

        .password-toggle:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-50%) scale(1.1);
        }

        .password-input-container {
          position: relative;
        }

        .password-input {
          padding-right: 60px !important;
        }

        /* Link button styling */
        .link-button.primary {
          background: none !important;
          color: rgba(255, 255, 255, 0.9) !important;
          border: none;
          padding: 8px 16px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          border-radius: 8px;
          text-transform: none !important;
          letter-spacing: 0.5px;
          margin-top: 0 !important;
          box-shadow: none !important;
          width: auto !important;
          display: inline !important;
        }

        .link-button.primary:hover {
          color: #ffffff !important;
          background: rgba(102, 126, 234, 0.2) !important;
          transform: translateY(-1px) !important;
          text-decoration: none;
          box-shadow: none !important;
        }

        .link-button.primary::before {
          display: none !important;
        }

        /* Modern typography */
        .auth-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #2c3e50;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          text-align: center;
          background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGlow 3s ease-in-out infinite alternate;
        }

        .auth-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          margin-bottom: 32px;
          font-weight: 400;
          letter-spacing: 0.3px;
          text-align: center;
        }

        @keyframes textGlow {
          0% { filter: brightness(1) saturate(1); }
          100% { filter: brightness(1.2) saturate(1.3); }
        }

        /* Responsive design improvements */
        @media (max-width: 480px) {
          .auth-container {
            padding: 32px 20px;
            margin: 20px auto;
            max-width: 95vw;
            border-radius: 20px;
          }
          
          .auth-title {
            font-size: 1.8rem;
          }
          
          .input-field, .password-input {
            padding: 16px 12px;
            font-size: 1rem;
          }
          
          .submit-button {
            padding: 14px 24px;
            font-size: 1rem;
          }
        }

        @media (max-width: 320px) {
          .auth-container {
            padding: 24px 16px;
            margin: 16px auto;
          }
          
          .auth-title {
            font-size: 1.6rem;
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Focus visible for keyboard navigation */
        .submit-button:focus-visible,
        .input-field:focus-visible,
        .password-input:focus-visible,
        .password-toggle:focus-visible,
        .link-button:focus-visible {
          outline: 2px solid #667eea;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}