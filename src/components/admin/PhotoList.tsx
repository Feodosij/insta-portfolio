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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PhotoCategoryPicker from "./PhotoCategoryPicker";

type Category = { id: string; name: string };
type AdminPhoto = {
  id: string;
  cloudinary_url: string;
  categoryIds: string[];
};

type PhotoListProps = {
  photos: AdminPhoto[];
  categories: Category[];
  onDeleted: (id: string) => void;
  onReordered: (photoIds: string[]) => void;
  onCategoriesChanged: (photoId: string, categoryIds: string[]) => void;
};

export default function PhotoList({
  photos,
  categories,
  onDeleted,
  onReordered,
  onCategoriesChanged,
}: PhotoListProps) {
  const [pendingDelete, setPendingDelete] = useState<AdminPhoto | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((photo) => photo.id === active.id);
    const newIndex = photos.findIndex((photo) => photo.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(photos, oldIndex, newIndex);
    onReordered(reordered.map((photo) => photo.id));
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map((photo) => photo.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <SortablePhotoItem
                key={photo.id}
                photo={photo}
                categories={categories}
                onDeleteRequest={setPendingDelete}
                onCategoriesChange={onCategoriesChanged}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {pendingDelete && (
        <ConfirmDeleteModal
          photo={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirmed={() => {
            onDeleted(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}

function SortablePhotoItem({
  photo,
  categories,
  onDeleteRequest,
  onCategoriesChange,
}: {
  photo: AdminPhoto;
  categories: Category[];
  onDeleteRequest: (photo: AdminPhoto) => void;
  onCategoriesChange: (photoId: string, categoryIds: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative aspect-square touch-none overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin grid, same reasoning as PhotoCard: no stored width/height for next/image */}
        <img
          src={photo.cloudinary_url}
          alt=""
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteRequest(photo);
          }}
          className="absolute top-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
        >
          Видалити
        </button>
      </div>
      <PhotoCategoryPicker
        categories={categories}
        selectedIds={photo.categoryIds}
        onChange={(categoryIds) => onCategoriesChange(photo.id, categoryIds)}
      />
    </div>
  );
}
