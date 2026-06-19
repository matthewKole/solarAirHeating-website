/**
 * reports.js
 * ------------------------------------------------------------------
 * Pulls report/study links from a published Google Sheet (as CSV)
 * and renders them into the Reports page, grouped by organization.
 *
 * Expected sheet columns:
 *   Published   - "Yes" to show the row, anything else to hide it
 *   GroupOrder  - number controlling the order organizations appear in
 *   Group       - organization name, e.g. "U.S. Department of Energy"
 *   GroupURL    - (optional) link to the organization's own site
 *   ItemOrder   - number controlling order of links within a group
 *   Title       - link text for the report
 *   URL         - the report/article/PDF link
 *   FileType    - "PDF", "website", "article", "Flash Presentation", etc.
 *   Note        - (optional) one-line description shown after a dash
 *
 * Google's published CSV updates within a few minutes of edits.
 * ------------------------------------------------------------------
 */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdNr_ipjv66tGvmghTHWy5kY3MxZf2_vn_Y7oy9r0EfZXiLe8TomWLD4axFxbzo-F7kuWsWCYTNbzB/pub?gid=302542331&single=true&output=csv";

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "group"
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function toNumber(val, fallback) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

async function loadReports() {
  const sectionsContainer = document.getElementById("news-sections");
  const tocList = document.getElementById("toc-list");
  const lastUpdated = document.getElementById("last-updated");

  if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("PASTE_YOUR")) {
    sectionsContainer.innerHTML =
      "<p>Reports feed isn't configured yet — add the published Google Sheet CSV URL in reports.js.</p>";
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

    if (rows.length === 0) {
      sectionsContainer.innerHTML = "<p>No reports listed yet. Check back soon.</p>";
      tocList.innerHTML = "";
      return;
    }

    // Group rows by the "Group" column, preserving the lowest GroupOrder seen
    const groupsMap = new Map();

    rows.forEach((row, idx) => {
      const groupName = (row.Group || "Other Reports").trim();
      const groupOrder = toNumber(row.GroupOrder, idx);
      const groupUrl = (row.GroupURL || "").trim();

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, {
          name: groupName,
          url: groupUrl,
          order: groupOrder,
          items: [],
        });
      }

      const group = groupsMap.get(groupName);
      // keep the lowest order value / first non-empty URL encountered
      group.order = Math.min(group.order, groupOrder);
      if (!group.url && groupUrl) group.url = groupUrl;

      group.items.push({
        order: toNumber(row.ItemOrder, idx),
        title: (row.Title || "Untitled").trim(),
        url: (row.URL || "").trim(),
        fileType: (row.FileType || "").trim(),
        note: (row.Note || "").trim(),
      });
    });

    const groups = Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
    groups.forEach((g) => g.items.sort((a, b) => a.order - b.order));

    let tocHtml = "";
    let sectionsHtml = "";

    groups.forEach((group, gi) => {
      const id = slugify(group.name);

      tocHtml += `<li><a href="#${id}">${escapeHtml(group.name)}</a></li>`;

      const heading = group.url
        ? `${escapeHtml(group.name)} (<a href="${escapeHtml(
            group.url
          )}" target="_blank" rel="noopener">website</a>)`
        : escapeHtml(group.name);

      const itemsHtml = group.items
        .map((item) => {
          const linkPart = item.url
            ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(
                item.title
              )}</a>`
            : escapeHtml(item.title);
          const typePart = item.fileType ? ` [${escapeHtml(item.fileType)}]` : "";
          const notePart = item.note ? ` &ndash; ${escapeHtml(item.note)}` : "";
          return `<li>${linkPart}${typePart}${notePart}</li>`;
        })
        .join("");

      sectionsHtml += `
        <section class="cp-section" id="${id}">
          <h2>${heading}</h2>
          <ul class="reports-list">${itemsHtml}</ul>
        </section>
        ${gi < groups.length - 1 ? '<hr class="cp-divider" />' : ""}
      `;
    });

    tocList.innerHTML = tocHtml;
    sectionsContainer.innerHTML = sectionsHtml;
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  } catch (err) {
    console.error("Failed to load reports from Google Sheet:", err);
    sectionsContainer.innerHTML =
      "<p>Unable to load reports right now. Please try again later.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadReports);