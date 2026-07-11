type PhotoCardProps = {
  url: string;
  alt?: string;
  onClick?: () => void;
};

export default function PhotoCard({ url, alt = "", onClick }: PhotoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl bg-zinc-100 text-left dark:bg-zinc-900"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- masonry needs each photo's natural aspect ratio; we don't store width/height, so next/image (which requires them) can't be used here */}
      <img src={url} alt={alt} loading="lazy" decoding="async" className="block w-full" />
    </button>
  );
}
