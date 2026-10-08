# Jerry-site project guidelines

## Homepage and template boundaries

- The homepage is the site shell in `site/index.html`, with shared styles and behavior in `site/assets/index.css` and `site/assets/index-runtime.js`.
- The homepage's persistent, user-controlled music player is a site-wide feature provided by `site/assets/capsule-player.js`. Keep it available on the homepage independently of which template is selected or whether the gallery is open.
- `site/assets/templates/ticketplayer.js` is a standalone music-player demo template in the template gallery. It is not the homepage player and must not replace, remove, or be treated as the implementation of the persistent homepage player.
- Other files in `site/assets/templates/` are individual gallery demos. Scope a change to the relevant template unless the request explicitly targets shared homepage behavior.
- Before changing player or template behavior, identify whether the request concerns the persistent homepage player, a gallery demo, or both. Preserve the distinction and verify each requested surface separately.
- Do not add the persistent homepage player to every template. Do not remove a demo template when changing the homepage player.
