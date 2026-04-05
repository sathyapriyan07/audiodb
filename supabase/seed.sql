-- Optional seed data

insert into public.platforms (name, logo)
values
  ('Spotify', 'https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png'),
  ('Apple Music', 'https://music.apple.com/favicon.ico'),
  ('YouTube', 'https://www.youtube.com/s/desktop/6e32f3ad/img/favicon_32x32.png')
on conflict (name) do nothing;

