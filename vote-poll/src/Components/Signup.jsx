import { useState } from "react";
import { account } from "../server/appwrite";

export default function Signup({ onLoginClick, onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  function validateForm() {
    const newErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!acceptTerms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignup(e) {
    e.preventDefault();

    // Clear previous errors
    setError("");
    setFieldErrors({});

    // Validate form
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("Creating account for:", email);

      // Create the user account with 'unique()' to let Appwrite generate valid ID
      const user = await account.create(
        'unique()',
        email,
        password,
        name.trim()
      );
      console.log("Account created successfully:", user);

      // Create session - try newer method first, then fallback
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (sessionError) {
        console.log("Trying legacy session creation method...");
        try {
          await account.createEmailSession(email, password);
        } catch (legacyError) {
          // Last resort fallback
          await account.createSession(email, password);
        }
      }

      console.log("User session created successfully");
      onSignup();
    } catch (err) {
      console.error("Signup error:", err);

      // Handle specific error types
      if (err.code === 409) {
        setError(
          "This email is already registered. Please use a different email or try logging in."
        );
      } else if (err.code === 400) {
        const errorMessage = err.message?.toLowerCase() || '';
        
        if (errorMessage.includes('password')) {
          setError(
            "Password does not meet requirements. Please ensure it's at least 8 characters with uppercase, lowercase, and numbers."
          );
        } else if (errorMessage.includes('email')) {
          setError("Please enter a valid email address.");
        } else if (errorMessage.includes('userid')) {
          setError("Account creation failed. Please try again.");
        } else {
          setError(
            err.message || "Invalid input. Please check your information and try again."
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

  function handleFieldChange(field, value) {
    // Update the field value
    switch (field) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;

    if (strength < 50) return { level: "weak", color: "#ef4444" };
    if (strength < 75) return { level: "medium", color: "#f59e0b" };
    return { level: "strong", color: "#10b981" };
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us to start voting</p>

        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className={`input-field ${fieldErrors.name ? "input-error" : ""}`}
              required
              autoComplete="name"
              disabled={loading}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <span id="name-error" className="error-message">
                {fieldErrors.name}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className={`input-field ${
                fieldErrors.email ? "input-error" : ""
              }`}
              required
              autoComplete="email"
              disabled={loading}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className="error-message">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
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

            {password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${
                        getPasswordStrength(password).level === "weak"
                          ? 33
                          : getPasswordStrength(password).level === "medium"
                          ? 66
                          : 100
                      }%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <span
                  className="password-strength-text"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.level} password
                </span>
              </div>
            )}

            {fieldErrors.password && (
              <span id="password-error" className="error-message">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) =>
                handleFieldChange("confirmPassword", e.target.value)
              }
              className={`input-field ${
                fieldErrors.confirmPassword ? "input-error" : ""
              }`}
              required
              autoComplete="new-password"
              disabled={loading}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
            />
            {fieldErrors.confirmPassword && (
              <span id="confirm-password-error" className="error-message">
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (fieldErrors.terms) {
                    setFieldErrors((prev) => ({ ...prev, terms: "" }));
                  }
                }}
                disabled={loading}
              />
              <span className="checkbox-text">
                I accept the{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    alert("Terms and conditions would be shown here")
                  }
                >
                  Terms and Conditions
                </button>
              </span>
            </label>
            {fieldErrors.terms && (
              <span className="error-message terms-error">
                {fieldErrors.terms}
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
        </form>

        <div className="auth-switch">
          <p>
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
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 450px;
        }

        .auth-title {
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #333;
        }

        .auth-subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .input-field {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-field:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .input-error {
          border-color: #ef4444 !important;
        }

        .password-input-container {
          position: relative;
        }

        .password-input {
          padding-right: 50px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }

        .password-toggle:hover {
          opacity: 0.7;
        }

        .password-strength {
          margin-top: 8px;
        }

        .password-strength-bar {
          width: 100%;
          height: 4px;
          background-color: #e1e5e9;
          border-radius: 2px;
          overflow: hidden;
        }

        .password-strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .password-strength-text {
          font-size: 12px;
          margin-top: 4px;
          display: block;
          font-weight: 500;
          text-transform: capitalize;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        .checkbox-text {
          user-select: none;
        }

        .terms-error {
          margin-top: 4px;
        }

        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin-top: 4px;
        }

        .error-banner {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .submit-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .auth-switch {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e1e5e9;
        }

        .link-button {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          text-decoration: underline;
          font-size: inherit;
          padding: 0;
        }

        .link-button.primary {
          font-weight: 600;
          text-decoration: none;
        }

        .link-button:hover {
          color: #5a67d8;
        }

        .link-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 30px 20px;
          }

          .auth-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}