#!/usr/bin/env python3
"""Preproject the flat contact map; this is an optional asset-generation tool.

Runtime builds consume src/location-map-data.ts and need neither network access
nor d3-geo. See docs/map-sources.md for sources and a reproducible command.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson"
SOURCES = {
    "land": ("ne_110m_land", "9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9"),
    "borders": ("ne_110m_admin_0_boundary_lines_land", "d42479fd79552cca4eec7f85fcdca717a790d29ff06be7676f1af0568c6d3f7c"),
    "lakes": ("ne_110m_lakes", "eb02ecc86c82004fccbf979058bfabbbd6c2d07968c7844d38eb1c9152d2ffc9"),
    "countries": ("ne_110m_admin_0_countries", "6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f"),
}

PROJECT = r"""
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const d3 = await import(pathToFileURL(process.argv[1]).href);
const input = JSON.parse(readFileSync(0, 'utf8'));
// A conventional north-up world map. At 3 1/3 SVG units per degree the full
// longitude range is 1200 units wide; the crop covers 80°N through 64°S.
const createProjection = (extent) => d3.geoEquirectangular()
  .translate([600, 800 / 3])
  .scale(600 / Math.PI)
  .clipExtent(extent)
  .precision(0.25);
const projection = createProjection([[0, 0], [1200, 480]]);
const path = d3.geoPath(projection).digits(1);
const regionalPath = d3.geoPath(createProjection([[80, 0], [550, 360]]));
// These Natural Earth rings follow D3's spherical winding convention. A flipped
// polygon would otherwise paint the complement instead of its land surface.
for (const key of ['land', 'lakes', 'countries']) {
  for (const feature of input[key].features) {
    if (d3.geoArea(feature) > 2 * Math.PI) {
      throw new Error(`Unexpected winding or oversized ${key} polygon`);
    }
  }
}
const countryIds = new Set();
const countries = [];
for (const feature of input.countries.features) {
  const properties = feature.properties;
  // Natural Earth's administrative codes identify features consistently, unlike
  // ISO_A3, which contains placeholders for some otherwise visible countries.
  const id = /^[A-Z0-9]{3}$/.test(properties.ADM0_A3 ?? '')
    ? properties.ADM0_A3
    : Number.isSafeInteger(properties.NE_ID) ? `ne-${properties.NE_ID}` : null;
  const name = properties.NAME_EN || properties.NAME_LONG;
  if (!id || countryIds.has(id) || typeof name !== 'string' || !name.trim()) {
    throw new Error('Missing or duplicate country identity');
  }
  countryIds.add(id);
  const countryPath = path(feature);
  if (!countryPath || path.area(feature) <= 0) continue;
  if (/NaN|Infinity/.test(countryPath)) throw new Error(`Invalid ${id} path`);
  countries.push({
    id,
    name,
    path: countryPath,
    // Measure the actually clipped polygons, not a whole-feature bounding box:
    // dateline countries such as Russia and Fiji have pieces at both map edges.
    regional: regionalPath.area(feature) > 0,
  });
}
countries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const longitude = -(79 + 23 / 60);
const latitude = 43 + 39 / 60;
const [x, y] = projection([longitude, latitude]);
const result = {
  land: path(input.land),
  borders: path(input.borders),
  lakes: path(input.lakes),
  graticule: path(d3.geoGraticule().step([30, 15]).precision(3)()),
  countries,
  toronto: { x: +x.toFixed(3), y: +y.toFixed(3), longitude, latitude },
};
for (const key of ['land', 'borders', 'lakes', 'graticule']) {
  if (!result[key] || /NaN|Infinity/.test(result[key])) throw new Error(`Invalid ${key} path`);
}
process.stdout.write(JSON.stringify(result));
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--d3-module", required=True, type=Path,
                        help="Path to d3-geo 3.1.1 src/index.js installed outside the app")
    parser.add_argument("--source-dir", type=Path,
                        help="Optional directory of the pinned Natural Earth GeoJSON files")
    args = parser.parse_args()
    datasets = {}
    for key, (name, expected_hash) in SOURCES.items():
        if args.source_dir:
            raw = (args.source_dir / f"{name}.geojson").read_bytes()
        else:
            with urlopen(f"{SOURCE_ROOT}/{name}.geojson", timeout=60) as response:
                raw = response.read()
        if hashlib.sha256(raw).hexdigest() != expected_hash:
            raise ValueError(f"Pinned source checksum mismatch: {name}")
        datasets[key] = json.loads(raw)

    result = subprocess.run(
        ["node", "--input-type=module", "-e", PROJECT, str(args.d3_module.resolve())],
        input=json.dumps(datasets), text=True, capture_output=True, check=True,
    )
    geometry = json.loads(result.stdout)
    output = [
        "// Generated by scripts/build_location_map.py; do not hand-edit the paths.",
        "// Natural Earth v5.1.2, 1:110m, public domain. See docs/map-sources.md.",
        "// Equirectangular world view: 180°W–180°E, 80°N–64°S; city marker is approximate.",
        "export const MAP_VIEWBOX = '0 0 1200 480';",
        "export const MAP_COMPACT_VIEWBOX = '80 0 470 360';",
    ]
    for key in ("land", "borders", "lakes", "graticule"):
        output.append(f"export const {key.upper()}_PATH = {json.dumps(geometry[key])};")
    output.append(f"export const TORONTO_POINT = {json.dumps(geometry['toronto'])} as const;")
    output.extend([
        "",
        "export interface MapCountry {",
        "  readonly id: string;",
        "  readonly name: string;",
        "  readonly path: string;",
        "  readonly regional: boolean;",
        "}",
        "",
        "export const COUNTRIES: readonly MapCountry[] = [",
    ])
    output.extend(f"  {json.dumps(country, ensure_ascii=False)}," for country in geometry["countries"])
    output.append("];")
    target = ROOT / "src/location-map-data.ts"
    target.write_text("\n".join(output) + "\n")
    print(f"Wrote {target.relative_to(ROOT)} ({target.stat().st_size:,} bytes)")
    print(f"Toronto: {geometry['toronto']['x']}, {geometry['toronto']['y']}")
    print(f"Named map features: {len(geometry['countries'])}; "
          f"visible in compact view: {sum(country['regional'] for country in geometry['countries'])}")


if __name__ == "__main__":
    main()
