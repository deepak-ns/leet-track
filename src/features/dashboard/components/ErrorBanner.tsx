export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3.5 dark:border-red-900/50 dark:bg-red-900/40">
      <span className="mt-0.5 text-red-500 dark:text-red-400">!</span>
      <p className="text-sm leading-6 text-red-700 dark:text-red-400">
        {message}
      </p>
    </div>
  );
}

