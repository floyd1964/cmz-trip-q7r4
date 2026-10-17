# Madrid · February 13–20, 2027

A one-page site for the family trip. It is plain HTML, CSS, and a little JavaScript, with no build step. GitHub Pages can serve it from the root of `main`.

Open `index.html` through a local web server (not as a file on disk) so the page can read the trip file.

## Edit the trip

All of the words on the page live in [`data/trip.json`](data/trip.json). Change that file, commit, and push to `main`. Reload the site after Pages finishes deploying. A hard refresh helps if the old version sticks.

Keep the file valid JSON: double quotes, commas between items, and no trailing comma after the last item.

### Add a plan to a day

Each day is an object in `days.items`. `date` is `YYYY-MM-DD`. The page fills in the weekday. `tone` is one of `arrive`, `option`, `quiet`, or `depart`.

```json
{
  "time": "11:00 AM",
  "text": "Walk to the market."
}
```

A badge looks like this:

```json
{
  "kind": "suggestion",
  "badge": "Suggestion",
  "text": "El Rastro, the Sunday flea market."
}
```

`kind` can be `option`, `suggestion`, `baby`, or `visiting`.

### Fill in a placeholder section

Getting around, day trips, dining, experiences, and sports are objects in `guides`. Set `"placeholder": false` when the note is real, and add entries:

```json
"items": [
  { "title": "Sunday lunch", "text": "Neighborhood and what to order." }
],
"links": [
  { "label": "A guide", "href": "https://example.com" }
]
```

Links must start with `https://` (or `tel:` for a phone number).

### The stay card

Update `stay.status`, `stay.area`, `stay.neighborhoods`, and `stay.body`. Set `"placeholder": false` once the rental is chosen.

## Privacy

This repository is public. Do not put any of these in `data/trip.json` or anywhere else in the repo:

- confirmation codes or ticket numbers
- prices
- street addresses
- landlord or host names, phone numbers, or email
- last names

Flight numbers, clock times, and neighborhoods are fine.

The pages send `noindex, nofollow`, and `robots.txt` asks crawlers to skip the site. The repo is still public to anyone with the link.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Branch: **main**. Folder: **/ (root)**.
4. Save.

The site will be at `https://<owner>.github.io/<repo>/`.

`.nojekyll` is included so Pages serves the files as they are.
