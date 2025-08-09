import React from "react";

export default function Vote({
  name,
  text,
  percentage,
  checked,
  onChange,
}) {
  return (
    <div className="Votes">
      <input
        className="appearance-none"
        type="radio"
        name={name}
        value={text}
        id={text}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={text} className="pointer">
        <p>
          {text} <span>{percentage || 0}%</span>
        </p>
        <progress value={parseInt(percentage) || 0} max="100">
          {percentage}%
        </progress>
      </label>
    </div>
  );
}
