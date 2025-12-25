import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  content, 
  position = 'top' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const tooltipHeight = 80; // approximate height
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 8;
          break;
      }
      
      // Keep tooltip within viewport
      const padding = 16;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
      
      setTooltipPosition({ top, left });
    }
  }, [isOpen, position]);

  const tooltipContent = isOpen ? createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={() => setIsOpen(false)}
      />
      <div 
        className="fixed z-[9999] w-64 p-3 bg-white text-slate-800 text-xs rounded-xl shadow-2xl border border-slate-200"
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 leading-relaxed font-medium">{content}</p>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center"
        aria-label="Help"
      >
        <HelpCircle size={12} />
      </button>
      {tooltipContent}
    </>
  );
};