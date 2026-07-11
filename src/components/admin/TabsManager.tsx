"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type FormEvent } from "react";

type Category = { id: string; name: string };

type TabsManagerProps = {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
};

export default function TabsManager({
  categories,
  onCategoriesChange,
}: TabsManagerProps) {
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) {
      setError("Не вдалося створити таб");
      setIsSubmitting(false);
      return;
    }

    const category = await response.json();
    onCategoriesChange([
      ...categories,
      { id: category.id, name: category.name },
    ]);
    setNewName("");
    setIsSubmitting(false);
  }

  function handleRename(id: string, name: string) {
    onCategoriesChange(
      categories.map((category) =>
        category.id === id ? { ...category, name } : category,
      ),
    );

    fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    }).catch(() => {
      // Best-effort persistence, same tradeoff as photo reorder.
    });
  }

  function handleDelete(id: string) {
    const category = categories.find((item) => item.id === id);
    if (!category) return;
    if (
      !window.confirm(
        `Видалити таб "${category.name}"? Фото залишаться, лише втратять зв'язок з цим табом.`,
      )
    ) {
      return;
    }

    onCategoriesChange(categories.filter((item) => item.id !== id));

    fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {
      // Best-effort persistence, same tradeoff as photo reorder.
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((item) => item.id === active.id);
    const newIndex = categories.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    onCategoriesChange(reordered);

    fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((item) => item.id) }),
    }).catch(() => {
      // Best-effort persistence, same tradeoff as photo reorder.
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Назва нового таба"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newName.trim()}
          className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Додати
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((category) => category.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <SortableCategoryItem
                // Remounts if the name changes from outside this component
                // (e.g. after a save), so the local edit buffer below stays
                // in sync without a setState-in-effect.
                key={`${category.id}:${category.name}`}
                category={category}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategoryItem({
  category,
  onRename,
  onDelete,
}: {
  category: Category;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  const [name, setName] = useState(category.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleBlur() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== category.name) {
      onRename(category.id, trimmed);
    } else {
      setName(category.name);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab px-2 text-zinc-400"
        aria-label="Перетягнути для зміни порядку"
      >
        ⠿
      </span>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={handleBlur}
        className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 focus:border-zinc-300 focus:outline-none dark:focus:border-zinc-700"
      />
      <button
        type="button"
        onClick={() => onDelete(category.id)}
        className="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        Видалити
      </button>
    </li>
  );
}
