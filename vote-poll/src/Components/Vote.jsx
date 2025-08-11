import React from "react";

export default function Vote({ name, text, checked, onChange }) {
  const safeText = text ?? ""; // fallback to empty string if null/undefined

  return (
    <div className="Votes">
      <input
        className="appearance-none"
        type="radio"
        name={name}
        value={safeText}
        id={safeText}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={safeText} className="pointer">
        <p>{safeText}</p>
      </label>
    </div>
  );
}
