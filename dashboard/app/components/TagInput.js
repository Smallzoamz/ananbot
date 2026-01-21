import React, { useState } from 'react';

export default function TagInput({ tags = [], onChange, placeholder }) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = input.trim();
            if (val && !tags.includes(val)) {
                onChange([...tags, val]);
                setInput("");
            }
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (index) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="glass-input tag-input-container">
            {tags.map((tag, index) => (
                <span key={index} className="tag-visual-chip">
                    {tag}
                    <button onClick={() => removeTag(index)} className="tag-visual-remove">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="tag-visual-input"
            />
        </div>
    );
}
