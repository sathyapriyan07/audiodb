export type ImageRef = {
  url?: string | null;
  file_path?: string | null;
  source?: "url" | "upload" | null;
};

export type Platform = {
  id: string;
  name: string;
  logo: string | null;
};

export type Artist = {
  id: string;
  name: string;
  bio: string | null;
  profile_image: ImageRef | null;
};

export type Album = {
  id: string;
  title: string;
  artist_id: string;
  artist?: Pick<Artist, "id" | "name" | "profile_image"> | null;
  cover_image: ImageRef | null;
  release_date: string | null;
};

export type Song = {
  id: string;
  title: string;
  duration: number | null;
  release_date: string | null;
  album_id: string | null;
  cover_image: ImageRef | null;
  album?: Pick<Album, "id" | "title" | "cover_image" | "release_date"> | null;
};

export type Playlist = {
  id: string;
  title: string;
  description: string | null;
  cover_image: ImageRef | null;
};

export type EntityType = "songs" | "albums" | "artists" | "playlists";

export type HomeSection = {
  id: string;
  title: string;
  subtitle: string | null;
  entity_type: EntityType;
  sort_order: number;
  is_featured: boolean;
};

export type HomeSectionItem = {
  id: string;
  section_id: string;
  entity_type: EntityType;
  entity_id: string;
  sort_order: number;
};
