type PhotoCardProps = {
  url: string;
  alt?: string;
};

export default function PhotoCard({ url, alt = "" }: PhotoCardProps) {
  return (
    <div className="mb-3 break-inside-avoid overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- masonry needs each photo's natural aspect ratio; we don't store width/height, so next/image (which requires them) can't be used here */}
      <img src={url} alt={alt} loading="lazy" decoding="async" className="block w-full" />
    </div>
  );
}
