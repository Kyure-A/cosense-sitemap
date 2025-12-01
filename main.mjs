import fs from "node:fs/promises";

const PROJECT = "kyre";
const BASE_URL = "https://cosense.kyre.moe";
const OUTPUT = "sitemap.xml";
const LIMIT = 1000;

async function fetchAllPages(project) {
    const pages = [];
    let skip = 0;

    for (;;) {
        const url =
            `https://scrapbox.io/api/pages/${encodeURIComponent(project)}` +
            `?limit=${LIMIT}&skip=${skip}`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Scrapbox API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        pages.push(...data.pages);

        skip += data.limit;
        if (pages.length >= data.count) break;
    }

    return pages;
}

function buildSitemapXml(pages) {
    const urls = pages
        .map((p) => {
            const slug = encodeURIComponent(p.title);
            const lastmod = new Date(p.updated * 1000).toISOString().slice(0, 10);

            return [
                "  <url>",
                `    <loc>${BASE_URL}/${slug}</loc>`,
                `    <lastmod>${lastmod}</lastmod>`,
                "  </url>",
            ].join("\n");
        })
        .join("\n");

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        "</urlset>",
        "",
    ].join("\n");
}

async function main() {
    const pages = await fetchAllPages(PROJECT);
    const xml = buildSitemapXml(pages);

    await fs.writeFile(OUTPUT, xml, "utf8");
    console.log(`Generated ${OUTPUT} for ${pages.length} pages`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
