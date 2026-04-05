// components/ui/Input.tsx
// Reusable input component matching the RespiCore design system.

import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-white
          placeholder:text-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
          transition-all
          ${error ? "border-red-500" : "border-slate-600"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
