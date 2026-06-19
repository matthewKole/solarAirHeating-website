/**
 * press-releases.js
 * ------------------------------------------------------------------
 * Pulls press release entries from a published Google Sheet (as CSV)
 * and renders them into the Press Releases page.
 *
 * Expected sheet columns:
 *   Published   - "Yes" to show the row, anything else to hide it
 *   Date        - date of the press release, e.g. "2014-04-18"
 *   Title       - headline for the release
 *   URL         - (optional) link to the full article/source, if one exists
 *   SourceName  - (optional) name shown on the "Read more" link, e.g. "SolarThermalWorld"
 *   Body        - the press release text. Use a line break between paragraphs.
 *
 * Google's published CSV updates within a few minutes of edits.
 * ------------------------------------------------------------------
 */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdNr_ipjv66tGvmghTHWy5kY3MxZf2_vn_Y7oy9r0EfZXiLe8TomWLD4axFxbzo-F7kuWsWCYTNbzB/pub?gid=1165075147&single=true&output=csv";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "release";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function formatBody(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function loadPressReleases() {
  const sectionsContainer = document.getElementById("news-sections");
  const tocList = document.getElementById("toc-list");
  const lastUpdated = document.getElementById("last-updated");

  if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("PASTE_YOUR")) {
    sectionsContainer.innerHTML =
      "<p>Press releases feed isn't configured yet — add the published Google Sheet CSV URL in press-releases.js.</p>";
    return;
  }

  try {
    // cache-bust so visitors don't see a stale browser-cached copy
    const separator = SHEET_CSV_URL.includes("?") ? "&" : "?";
    const res = await fetch(`${SHEET_CSV_URL}${separator}cb=${Date.now()}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = (parsed.data || []).filter(
      (row) => (row.Published || "").trim().toLowerCase() === "yes"
    );

    // newest first
    rows.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    if (rows.length === 0) {
      sectionsContainer.innerHTML = "<p>No press releases yet. Check back soon.</p>";
      tocList.innerHTML = "";
      return;
    }

    let tocHtml = "";
    let sectionsHtml = "";

    rows.forEach((row, i) => {
      const title = (row.Title || "Untitled").trim();
      const id = slugify(title);
      const url = (row.URL || "").trim();
      const sourceName = (row.SourceName || "Read the full article").trim();
      const body = row.Body || "";
      const dateLabel = formatDate(row.Date);

      tocHtml += `<li><a href="#${id}">${escapeHtml(title)}</a></li>`;

      sectionsHtml += `
        <section class="cp-section" id="${id}">
          <h2>${escapeHtml(title)}</h2>
          ${dateLabel ? `<p class="cp-news-date">${escapeHtml(dateLabel)}</p>` : ""}
          ${formatBody(body)}
          ${
            url
              ? `<p class="cp-news-source">
                  <a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(
                    sourceName
                  )} &rarr;</a>
                </p>`
              : ""
          }
        </section>
        ${i < rows.length - 1 ? '<hr class="cp-divider" />' : ""}
      `;
    });

    tocList.innerHTML = tocHtml;
    sectionsContainer.innerHTML = sectionsHtml;

    const newestDate = formatDate(rows[0].Date);
    lastUpdated.textContent = newestDate
      ? `Last updated: ${newestDate}`
      : "Last updated: recently";
  } catch (err) {
    console.error("Failed to load press releases from Google Sheet:", err);
    sectionsContainer.innerHTML =
      "<p>Unable to load press releases right now. Please try again later.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadPressReleases);