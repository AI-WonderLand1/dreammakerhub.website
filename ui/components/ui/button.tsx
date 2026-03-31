import React, { MouseEvent } from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ElementType;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
  icon: Icon,
  variant = "primary",
}) => {
  const baseStyle =
    "px-4 py-2 font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-2 text-sm";
  let variantStyle = "";

  switch (variant) {
    case "primary":
      variantStyle =
        "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50";
      break;
    case "secondary":
      variantStyle =
        "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 shadow-sm";
      break;
    case "danger":
      variantStyle =
        "bg-pink-700 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/50";
      break;
    case "ghost":
      variantStyle =
        "bg-transparent hover:bg-white/10 text-gray-300 shadow-none";
      break;
  }

  const disabledStyle = disabled ? "opacity-40 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
};
