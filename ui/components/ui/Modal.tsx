import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  className = "",
}) => {
  const colors = {
    BG_PANEL: "#1A0D33",
    NEON_PURPLE: "#a78bfa",
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.BG_PANEL,
          border: `1px solid ${colors.NEON_PURPLE}`,
        }}
        className={`rounded-lg shadow-2xl w-full max-w-sm flex flex-col relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
};
