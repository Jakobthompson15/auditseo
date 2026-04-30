"use client";

interface DomainInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function DomainInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: DomainInputProps) {
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !disabled && value.trim()) onSubmit();
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <p
        className="label text-center mb-6"
        style={{ color: "var(--text-dim)", letterSpacing: "0.16em" }}
      >
        Marketing Visibility Audit
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.625rem",
          background: "var(--card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "10px",
          padding: "6px 6px 6px 1rem",
          alignItems: "center",
        }}
      >
        {/* Globe icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        >
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            d="M8 1.5C8 1.5 5.5 4.5 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4.5 10.5 8S8 14.5 8 14.5M1.5 8h13"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </svg>

        <input
          type="text"
          aria-label="Domain to audit"
          placeholder="example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            color: "var(--text)",
            caretColor: "var(--purple)",
          }}
        />

        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Run audit"
          style={{
            background: disabled ? "rgba(124,106,247,0.3)" : "var(--purple)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1.1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "opacity 0.2s, background 0.2s",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {disabled ? "Running…" : "Run Audit"}
        </button>
      </div>

      <p
        className="label text-center mt-3"
        style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
      >
        https:// and www. are stripped automatically
      </p>
    </div>
  );
}
