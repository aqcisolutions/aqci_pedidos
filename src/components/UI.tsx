import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 text-sm md:text-base';
  
  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-90',
    secondary: 'bg-accent/20 text-primary hover:bg-accent/30',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
    ghost: 'text-gray-500 hover:bg-primary/5',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  isTextArea?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  error, 
  isTextArea = false, 
  className = '', 
  ...props 
}) => {
  const inputStyles = `w-full px-4 py-4 rounded-2xl border ${error ? 'border-red-500' : 'border-black/10'} focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-[#FFF0F5] text-text-main placeholder:text-gray-400`;
  
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-semibold text-text-main ml-1">{label}</label>
      {isTextArea ? (
        <textarea 
          className={`${inputStyles} min-h-[120px] resize-none`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input 
          className={inputStyles}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <span className="text-xs text-red-500 ml-1 font-medium">{error}</span>}
    </div>
  );
};
