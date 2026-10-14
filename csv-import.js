// Parse a CSV of coordinates into [[lat, lon], ...].
// - Header row is optional. With a header, columns are found by name
//   (lat/latitude/y/ละติจูด and lon/lng/long/longitude/x/ลองจิจูด); without one,
//   column 1 = lat and column 2 = lon.
// - Delimiter is auto-detected (comma, semicolon or tab).
// - If every row has |lat| > 90, the columns are assumed swapped (lon,lat) and flipped.
const LAT_NAMES = /^(lat|latitude|y|ละติจูด)$/i;
const LON_NAMES = /^(lon|lng|long|longitude|x|ลองจิจูด)$/i;

function parseLatLonCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) throw new Error('ไฟล์ว่าง');

  const first = lines[0];
  const delim = [',', ';', '\t'].reduce((a, b) => first.split(b).length > first.split(a).length ? b : a);
  const cells = line => line.split(delim).map(c => c.trim().replace(/^"(.*)"$/, '$1').trim());

  let latIdx = 0, lonIdx = 1, start = 0;
  const head = cells(first);
  if (head.some(c => c !== '' && isNaN(Number(c)))) {
    latIdx = head.findIndex(c => LAT_NAMES.test(c));
    lonIdx = head.findIndex(c => LON_NAMES.test(c));
    if (latIdx < 0 || lonIdx < 0) {
      throw new Error(`หาคอลัมน์ lat/lon ไม่เจอ (คอลัมน์ที่มี: ${head.join(', ')})`);
    }
    start = 1;
  }

  let points = [];
  let skipped = 0;
  for (const line of lines.slice(start)) {
    const row = cells(line);
    const lat = Number(row[latIdx]), lon = Number(row[lonIdx]);
    if (row[latIdx] === '' || row[lonIdx] === '' || !isFinite(lat) || !isFinite(lon)) { skipped++; continue; }
    points.push([lat, lon]);
  }

  let swapped = false;
  if (points.length && points.every(([lat, lon]) => Math.abs(lat) > 90 && Math.abs(lon) <= 90)) {
    points = points.map(([lat, lon]) => [lon, lat]);
    swapped = true;
  }
  const valid = points.filter(([lat, lon]) => Math.abs(lat) <= 90 && Math.abs(lon) <= 180);
  skipped += points.length - valid.length;
  if (!valid.length) throw new Error('ไม่พบพิกัดที่ถูกต้องในไฟล์');

  return { points: valid, skipped, swapped, hasHeader: start === 1 };
}

// Read a File object and parse it.
function readLatLonCsvFile(file) {
  return file.text().then(parseLatLonCsv);
}
