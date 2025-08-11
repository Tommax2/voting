import React from "react";

export default function Vote({ name, text, percentage, checked, onChange }) {
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
      
    </div>
  );
}
