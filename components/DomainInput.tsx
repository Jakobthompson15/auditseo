"use client";

interface DomainInputProps {
  value: string;
  onChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function DomainInput({
  value,
  onChange,
  city,
  onCityChange,
  onSubmit,
  disabled,
}: DomainInputProps) {
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !disabled && value.trim()) onSubmit();
  }

  const inputBase: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "var(--font-mono)",
    color: "var(--text)",
    caretColor: "var(--purple)",
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <p
        className="label text-center mb-6"
        style={{ color: "var(--text-dim)", letterSpacing: "0.16em" }}
      >
        Marketing Visibility Audit
      </p>

      {/* Domain row */}
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
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
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
          style={{ ...inputBase, fontSize: "0.9rem" }}
        />

        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Run audit"
          style={{
            background: disabled ? "rgba(31,120,255,0.3)" : "var(--purple)",
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

      {/* City row */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "0.5rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "5px 5px 5px 0.875rem",
          alignItems: "center",
        }}
      >
        {/* Pin icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        >
          <path
            d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5Z"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.25" />
        </svg>

        <input
          type="text"
          aria-label="City (optional)"
          placeholder="City (optional) — e.g. Chicago, IL"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          spellCheck={false}
          style={{ ...inputBase, fontSize: "0.8rem", color: "var(--text-dim)" }}
        />
      </div>

      <p
        className="label text-center mt-3"
        style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
      >
        City improves local competitor + keyword results
      </p>
    </div>
  );
}
