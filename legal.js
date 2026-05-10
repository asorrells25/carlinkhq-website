// Pulls the latest privacy policy / terms of service / community
// guidelines markdown directly from the canonical legal repo on
// GitHub (github.com/asorrells25/legal). The same source the iOS
// app's legal_documents table is mirrored from — so the website,
// the in-app reader, and the repo never drift apart.
//
// Why GitHub raw and not the Supabase legal_documents view: avoids
// embedding a Supabase key in this script, and the legal repo is
// already public-readable. If the repo's branch ever changes from
// `main` to something else, swap LEGAL_BRANCH below.

const LEGAL_REPO   = "asorrells25/legal";
const LEGAL_BRANCH = "main";

const FILES = {
    terms_of_service:     "terms_of_service.md",
    privacy_policy:       "privacy_policy.md",
    community_guidelines: "community_guidelines.md",
};

(function () {
    const script  = document.currentScript;
    const docType = script?.dataset?.docType;
    const bodyEl  = document.getElementById("legal-body");
    const metaEl  = document.getElementById("legal-meta");
    if (!docType || !bodyEl) return;

    const filename = FILES[docType];
    if (!filename) {
        bodyEl.innerHTML =
            "<p style=\"color:#A8A39A;\">Unknown document type. Please email " +
            "<a href=\"mailto:austin@carlinkhq.com\">austin@carlinkhq.com</a> for the latest version.</p>";
        return;
    }

    const url = "https://raw.githubusercontent.com/" + LEGAL_REPO +
                "/" + LEGAL_BRANCH + "/" + filename;

    fetch(url, { cache: "no-store" })
        .then((r) => r.ok ? r.text() : Promise.reject(r.status))
        .then((markdown) => {
            const { metadata, body } = splitFrontmatter(markdown);
            if (metaEl) {
                const versionStr   = metadata.version
                    ? "Version " + metadata.version + " · "
                    : "";
                const effectiveStr = metadata.effective_date
                    ? "Effective " + new Date(metadata.effective_date).toLocaleDateString("en-US",
                        { year: "numeric", month: "long", day: "numeric" })
                    : "Latest published version";
                metaEl.textContent = versionStr + effectiveStr;
            }
            bodyEl.innerHTML = renderMarkdown(body);
        })
        .catch((err) => {
            console.error("Legal doc fetch failed:", err);
            bodyEl.innerHTML =
                "<p style=\"color:#A8A39A;\">Couldn't load the latest version. View it directly on GitHub: " +
                "<a href=\"https://github.com/" + LEGAL_REPO + "/blob/" + LEGAL_BRANCH + "/" + filename + "\" rel=\"noopener\">" +
                filename + "</a> — or email " +
                "<a href=\"mailto:austin@carlinkhq.com\">austin@carlinkhq.com</a> for the current PDF.</p>";
        });

    // ---- Helpers ----

    // Optional YAML-ish frontmatter at the top of a markdown file:
    //   ---
    //   version: 1.2
    //   effective_date: 2026-05-01
    //   ---
    // Returns { metadata: {version, effective_date, ...}, body }.
    function splitFrontmatter(src) {
        const m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        if (!m) return { metadata: {}, body: src };
        const meta = {};
        m[1].split("\n").forEach((line) => {
            const kv = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)\s*$/);
            if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
        });
        return { metadata: meta, body: src.slice(m[0].length) };
    }

    // Minimal Markdown renderer — headings, paragraphs, bullet lists,
    // links, bold, italics, code spans. Same shape as the in-app one.
    function renderMarkdown(src) {
        const lines = src.split(/\r?\n/);
        const out = [];
        let inUL = false;
        let para = [];
        const flushPara = () => {
            if (para.length) {
                out.push("<p>" + inline(para.join(" ")) + "</p>");
                para = [];
            }
        };
        const closeList = () => { if (inUL) { out.push("</ul>"); inUL = false; } };
        for (const raw of lines) {
            const line = raw.trimEnd();
            if (!line.trim()) { flushPara(); closeList(); continue; }
            if (/^#{1,6} /.test(line)) {
                flushPara(); closeList();
                const m = line.match(/^(#{1,6}) (.*)$/);
                const level = Math.min(m[1].length + 1, 6);
                out.push("<h" + level + ">" + inline(m[2]) + "</h" + level + ">");
                continue;
            }
            if (/^\s*[-*] /.test(line)) {
                flushPara();
                if (!inUL) { out.push("<ul>"); inUL = true; }
                out.push("<li>" + inline(line.replace(/^\s*[-*] /, "")) + "</li>");
                continue;
            }
            closeList();
            para.push(line);
        }
        flushPara(); closeList();
        return out.join("\n");
    }
    function inline(s) {
        s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" rel="noopener noreferrer">$1</a>');
        return s;
    }
})();
