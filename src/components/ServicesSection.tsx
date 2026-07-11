type ServicesSectionProps = {
  text: string;
  instagramUrl: string | null;
  telegramUrl: string | null;
};

export default function ServicesSection({
  text,
  instagramUrl,
  telegramUrl,
}: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6"
    >
      <p className="whitespace-pre-line text-lg text-zinc-700 dark:text-zinc-300">
        {text}
      </p>
      {(instagramUrl || telegramUrl) && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Instagram
            </a>
          )}
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-300 px-8 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Telegram
            </a>
          )}
        </div>
      )}
    </section>
  );
}
