import React from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RequireAdmin } from "@/routes/guards";

const HomePage = React.lazy(() => import("@/pages/HomePage"));
const SearchPage = React.lazy(() => import("@/pages/SearchPage"));
const SongPage = React.lazy(() => import("@/pages/SongPage"));
const AlbumPage = React.lazy(() => import("@/pages/AlbumPage"));
const ArtistPage = React.lazy(() => import("@/pages/ArtistPage"));
const PlaylistPage = React.lazy(() => import("@/pages/PlaylistPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));
const ErrorPage = React.lazy(() => import("@/pages/ErrorPage"));

const AdminLoginPage = React.lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminDashboardPage = React.lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminSongsPage = React.lazy(() => import("@/pages/admin/songs/AdminSongsPage"));
const AdminSongEditorPage = React.lazy(() => import("@/pages/admin/songs/AdminSongEditorPage"));
const AdminArtistsPage = React.lazy(() => import("@/pages/admin/artists/AdminArtistsPage"));
const AdminArtistEditorPage = React.lazy(
  () => import("@/pages/admin/artists/AdminArtistEditorPage"),
);
const AdminAlbumsPage = React.lazy(() => import("@/pages/admin/albums/AdminAlbumsPage"));
const AdminAlbumEditorPage = React.lazy(
  () => import("@/pages/admin/albums/AdminAlbumEditorPage"),
);
const AdminPlaylistsPage = React.lazy(() => import("@/pages/admin/playlists/AdminPlaylistsPage"));
const AdminPlaylistEditorPage = React.lazy(
  () => import("@/pages/admin/playlists/AdminPlaylistEditorPage"),
);
const AdminPlatformsPage = React.lazy(() => import("@/pages/admin/platforms/AdminPlatformsPage"));
const AdminPlatformEditorPage = React.lazy(
  () => import("@/pages/admin/platforms/AdminPlatformEditorPage"),
);
const AdminSectionsPage = React.lazy(() => import("@/pages/admin/sections/AdminSectionsPage"));
const AdminSectionEditorPage = React.lazy(
  () => import("@/pages/admin/sections/AdminSectionEditorPage"),
);
const DeezerImportPage = React.lazy(() => import("@/pages/admin/import/DeezerImportPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: (
      <React.Suspense>
        <ErrorPage />
      </React.Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense>
            <HomePage />
          </React.Suspense>
        ),
      },
      {
        path: "search",
        element: (
          <React.Suspense>
            <SearchPage />
          </React.Suspense>
        ),
      },
      {
        path: "songs/:songId",
        element: (
          <React.Suspense>
            <SongPage />
          </React.Suspense>
        ),
      },
      {
        path: "albums/:albumId",
        element: (
          <React.Suspense>
            <AlbumPage />
          </React.Suspense>
        ),
      },
      {
        path: "artists/:artistId",
        element: (
          <React.Suspense>
            <ArtistPage />
          </React.Suspense>
        ),
      },
      {
        path: "playlists/:playlistId",
        element: (
          <React.Suspense>
            <PlaylistPage />
          </React.Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <React.Suspense>
            <NotFoundPage />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: "/admin/login",
    element: (
      <React.Suspense>
        <AdminLoginPage />
      </React.Suspense>
    ),
  },
  {
    path: "/admin",
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: (
              <React.Suspense>
                <AdminDashboardPage />
              </React.Suspense>
            ),
          },
          { path: "songs", element: <React.Suspense><AdminSongsPage /></React.Suspense> },
          { path: "songs/new", element: <React.Suspense><AdminSongEditorPage /></React.Suspense> },
          { path: "songs/:songId", element: <React.Suspense><AdminSongEditorPage /></React.Suspense> },
          { path: "artists", element: <React.Suspense><AdminArtistsPage /></React.Suspense> },
          { path: "artists/new", element: <React.Suspense><AdminArtistEditorPage /></React.Suspense> },
          { path: "artists/:artistId", element: <React.Suspense><AdminArtistEditorPage /></React.Suspense> },
          { path: "albums", element: <React.Suspense><AdminAlbumsPage /></React.Suspense> },
          { path: "albums/new", element: <React.Suspense><AdminAlbumEditorPage /></React.Suspense> },
          { path: "albums/:albumId", element: <React.Suspense><AdminAlbumEditorPage /></React.Suspense> },
          { path: "playlists", element: <React.Suspense><AdminPlaylistsPage /></React.Suspense> },
          { path: "playlists/new", element: <React.Suspense><AdminPlaylistEditorPage /></React.Suspense> },
          { path: "playlists/:playlistId", element: <React.Suspense><AdminPlaylistEditorPage /></React.Suspense> },
          { path: "platforms", element: <React.Suspense><AdminPlatformsPage /></React.Suspense> },
          { path: "platforms/new", element: <React.Suspense><AdminPlatformEditorPage /></React.Suspense> },
          { path: "platforms/:platformId", element: <React.Suspense><AdminPlatformEditorPage /></React.Suspense> },
          { path: "sections", element: <React.Suspense><AdminSectionsPage /></React.Suspense> },
          { path: "sections/new", element: <React.Suspense><AdminSectionEditorPage /></React.Suspense> },
          { path: "sections/:sectionId", element: <React.Suspense><AdminSectionEditorPage /></React.Suspense> },
          { path: "import/deezer", element: <React.Suspense><DeezerImportPage /></React.Suspense> },
          { path: "*", element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
]);
