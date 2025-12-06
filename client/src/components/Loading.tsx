interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading = ({ message = 'Loading...', size = 'md' }: LoadingProps) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  const messageSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className={`${sizeStyles[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
        <span className={`text-gray-500 ${messageSizeStyles[size]}`}>{message}</span>
      </div>
    </div>
  );
};
