import { Loader2 } from 'lucide-react';
export const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }
  return <div className="py-12 flex justify-center">{content}</div>;
};