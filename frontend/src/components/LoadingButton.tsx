import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

const LoadingButton: React.FC<Props> = ({ loading, children, className = '', disabled, ...rest }) => {
  const isDisabled = !!loading || !!disabled;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`.trim()}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
