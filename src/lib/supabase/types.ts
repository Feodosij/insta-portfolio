export type Category = {
  id: string;
  name: string;
  order: number;
  created_at: string;
};

export type Photo = {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  order: number;
  created_at: string;
};

export type PhotoCategory = {
  photo_id: string;
  category_id: string;
};

export type SiteContentKey =
  | "hero_name"
  | "hero_photo_url"
  | "services_text"
  | "instagram_url"
  | "telegram_url";

export type SiteContent = {
  key: SiteContentKey;
  value: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "name">;
        Update: Partial<Category>;
        Relationships: [];
      };
      photos: {
        Row: Photo;
        Insert: Partial<Photo> &
          Pick<Photo, "cloudinary_url" | "cloudinary_public_id">;
        Update: Partial<Photo>;
        Relationships: [];
      };
      photo_categories: {
        Row: PhotoCategory;
        Insert: PhotoCategory;
        Update: Partial<PhotoCategory>;
        Relationships: [];
      };
      site_content: {
        Row: SiteContent;
        Insert: SiteContent;
        Update: Partial<SiteContent> & Pick<SiteContent, "key">;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
