import Image from "next/image";

type HeroProps = {
  name: string;
  photoUrl: string | null;
};

export default function Hero({ name, photoUrl }: HeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-rose-100 to-rose-200 dark:from-zinc-900 dark:to-zinc-950">
      {photoUrl && (
        <Image
          src={photoUrl}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center text-white">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {name}
        </h1>
        <a
          href="#gallery"
          className="rounded-full border border-white/70 px-8 py-3 text-sm font-medium tracking-widest uppercase transition-colors hover:bg-white hover:text-black"
        >
          Переглянути
        </a>
      </div>
    </section>
  );
}
