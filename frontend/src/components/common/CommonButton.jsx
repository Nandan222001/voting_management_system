export default function CommonButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-[rgb(16_102_177)] text-white hover:bg-[rgb(16_102_177)] focus:ring-[rgb(16_102_177)]/30',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:border-[rgb(16_102_177)] hover:text-[rgb(16_102_177)] focus:ring-[rgb(16_102_177)]/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30',
    ghost: 'text-gray-700 hover:bg-[#e6edfb] hover:text-[rgb(16_102_177)] focus:ring-[rgb(16_102_177)]/30',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
