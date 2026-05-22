export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
      </div>
      {message && (
        <p className="text-sm font-medium text-gray-500">{message}</p>
      )}
    </div>
  );
}
