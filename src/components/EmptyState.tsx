type EmptyStateProps = {
  message: string;
};

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-zinc-500 dark:text-zinc-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
