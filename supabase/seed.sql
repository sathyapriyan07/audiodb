-- Optional seed data

insert into public.platforms (name, logo)
values
  ('Spotify', 'https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png'),
  ('Apple Music', 'https://music.apple.com/favicon.ico'),
  ('YouTube', 'https://www.youtube.com/s/desktop/6e32f3ad/img/favicon_32x32.png'),
  ('Deezer', 'https://e-cdns-files.dzcdn.net/cache/images/common/favicon/favicon-32x32.7a4809321bdc3f2dbd4f31f4c8c9ea33.png')
on conflict (name) do nothing;
