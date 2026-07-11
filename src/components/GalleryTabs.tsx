"use client";

type Category = { id: string; name: string };

type GalleryTabsProps = {
  categories: Category[];
  activeId: string | null;
  onChange: (id: string | null) => void;
};

export default function GalleryTabs({
  categories,
  activeId,
  onChange,
}: GalleryTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" onClick={() => onChange(null)} className={tabClass(activeId === null)}>
        Всі
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={tabClass(activeId === category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

function tabClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;
}
