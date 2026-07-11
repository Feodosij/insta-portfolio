"use client";

type Category = { id: string; name: string };

type PhotoCategoryPickerProps = {
  categories: Category[];
  selectedIds: string[];
  onChange: (categoryIds: string[]) => void;
};

export default function PhotoCategoryPicker({
  categories,
  selectedIds,
  onChange,
}: PhotoCategoryPickerProps) {
  function toggle(categoryId: string) {
    const next = selectedIds.includes(categoryId)
      ? selectedIds.filter((id) => id !== categoryId)
      : [...selectedIds, categoryId];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id);
        return (
          <label
            key={category.id}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggle(category.id)}
              className="sr-only"
            />
            {category.name}
          </label>
        );
      })}
    </div>
  );
}
