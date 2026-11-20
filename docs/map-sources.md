# Contact Map Sources

The contact panel uses a conventional, north-up **equirectangular world map**.
Its 1200 × 597 coordinate space covers **180°W to 180°E** and **86°N to 90°S**.
Latitude and longitude form straight grid lines. The compact view crops the
same map to North America, the Caribbean, northern South America, and the
western Atlantic, keeping Toronto and its label readable without stretching
the projection.

Toronto is the only location marker. The marker represents the city, not a
home, office, or tracked position.

## Geographic data

Land, named country polygons, international land boundaries, and major lakes are derived from
[Natural Earth](https://www.naturalearthdata.com/) **v5.1.2**, at **1:110 million**
scale. The original files are pinned to the release tag in the project's
maintainer repository:

- [Land polygons](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson)
- [International land boundaries](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_boundary_lines_land.geojson)
- [Major lakes](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_lakes.geojson)
- [Country polygons and English names](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson)

Natural Earth declares its raster and vector data to be **public domain** and
allows modification and electronic redistribution. Its
[terms of use](https://www.naturalearthdata.com/about/terms-of-use/) and
[repository licence](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/LICENSE.md)
document the rights. Made with Natural Earth.

The [City of Toronto's geography overview](https://www.toronto.ca/city-government/data-research-maps/toronto-at-a-glance/)
places Toronto at **43°39′N, 79°23′W**. Those city-level coordinates become
43.65, −79.383333… and project to **(335.389, 121.167)** in this view.
The data and official source pages were checked on November 18, 2026.

## Generation

`src/location-map-data.ts` contains preprojected SVG path strings and named country
features. Each country keeps all of its polygon parts in one path, so highlighting
the United States, for example, also highlights Alaska. Names use Natural Earth's
`NAME_EN` field, with `NAME_LONG` as a fallback; stable IDs use `ADM0_A3`, with
`NE_ID` as a fallback. The generator checks for missing or duplicate identities.
These feature labels follow the source dataset and are not a list or count of
sovereign states.

The `regional` flag measures the polygon's projected area after clipping to the
compact view (`80 0 470 360`). A country is offered in that view only when an
actual part of its polygon is visible; a bounding box spanning the dateline does
not make Russia or Fiji a false match. Lakes remain a separate water layer so
country interaction can exclude their surfaces.

The application
does not request geographic data at runtime and does not import a mapping
library. The optional generator uses **d3-geo 3.1.1** for geographic projection,
adaptive sampling, antimeridian clipping, and the rectangular latitude crop.
Polygons that cross the 180° meridian are split at the left and
right map edges. D3's
[projection documentation](https://d3js.org/d3-geo/projection) and
[spherical winding guidance](https://d3js.org/d3-geo) explain those operations.

To regenerate with Node.js and Python available, install the build-only tool
outside the app and run the generator from the repository root:

```bash
npm install --prefix /tmp/portfolio-map-tools --no-save d3-geo@3.1.1
python scripts/build_location_map.py --d3-module /tmp/portfolio-map-tools/node_modules/d3-geo/src/index.js
```

The generator downloads the four pinned GeoJSON files and checks their SHA-256
hashes before use. For an offline rebuild, supply `--source-dir` pointing to
those exact files. The normal `npm run build` uses the committed output and
does not need these optional tools.

| Source | SHA-256 |
| --- | --- |
| `ne_110m_land.geojson` | `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9` |
| `ne_110m_admin_0_boundary_lines_land.geojson` | `d42479fd79552cca4eec7f85fcdca717a790d29ff06be7676f1af0568c6d3f7c` |
| `ne_110m_lakes.geojson` | `eb02ecc86c82004fccbf979058bfabbbd6c2d07968c7844d38eb1c9152d2ffc9` |
| `ne_110m_admin_0_countries.geojson` | `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f` |

The graticule is generated mathematically at 30° longitude and 15° latitude
intervals. Its meridians extend to the entire visible map height so that neither
polar extension has a disconnected grid. The final paths are rounded to one decimal place in the SVG coordinate
space. This is a stylised, small-scale location illustration; it is not suitable
for navigation or measuring distances. Country interaction covers the visible
polygons supplied at this scale, without artificial targets for missing islands
or microstates. Small islands, boundaries, and shoreline details are generalised
by the source dataset. The world view now includes Antarctica down to the South Pole, while the northern view retains Greenland's complete coastline at this map scale. At the pole, the flat equirectangular projection naturally stretches Antarctica across the map's full width; this is a polar distortion, not a repeated world. Very small shapes may be difficult to point to directly.
