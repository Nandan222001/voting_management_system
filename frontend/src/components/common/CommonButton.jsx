export default function CommonButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-[#1a337e] text-white hover:bg-[#1a337e] focus:ring-[#1a337e]/30',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:border-[#1a337e] hover:text-[#1a337e] focus:ring-[#1a337e]/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30',
    ghost: 'text-gray-700 hover:bg-[#e6edfb] hover:text-[#1a337e] focus:ring-[#1a337e]/30',
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
