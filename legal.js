// Pulls the current Privacy Policy / Terms of Service text directly from
// the same Supabase legal_documents_current view the iOS app reads, so
// the website never drifts from the canonical legal copy.
//
// The Supabase anon key is publishable — it's designed to be embedded
// in clients (mobile and web). RLS on the table is what enforces
// security; the anon role can SELECT the published documents and
// nothing else.
//
// Setup: paste your project's anon key into SUPABASE_ANON_KEY below.
// You can get it from Supabase Dashboard → Project Settings → API → anon/public.

const SUPABASE_URL      = "https://gdnzkwfoyzqmliijtyos.supabase.co";
const SUPABASE_ANON_KEY = "REPLACE_WITH_PUBLISHABLE_ANON_KEY";

(function () {
    const script   = document.currentScript;
    const docType  = script?.dataset?.docType;
    const bodyEl   = document.getElementById("legal-body");
    const metaEl   = document.getElementById("legal-meta");
    if (!docType || !bodyEl) return;

    if (SUPABASE_ANON_KEY === "REPLACE_WITH_PUBLISHABLE_ANON_KEY") {
        bodyEl.innerHTML =
            "<p style=\"color:#A8A39A;\">Site is awaiting deployment configuration — " +
            "the canonical document will appear once the Supabase anon key is set in <code>legal.js</code>.</p>";
        return;
    }

    const url = SUPABASE_URL +
        "/rest/v1/legal_documents_current?doc_type=eq." +
        encodeURIComponent(docType) +
        "&select=title,version,effective_date,body_md";

    fetch(url, {
        headers: {
            "apikey":        SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY,
            "Accept":        "application/json",
        },
    })
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((rows) => {
            if (!rows || rows.length === 0) throw new Error("not found");
            const doc = rows[0];
            metaEl.textContent =
                "Version " + doc.version +
                " · Effective " + new Date(doc.effective_date).toLocaleDateString("en-US",
                    { year: "numeric", month: "long", day: "numeric" });
            bodyEl.innerHTML = renderMarkdown(doc.body_md);
        })
        .catch((err) => {
            console.error("Legal doc fetch failed:", err);
            bodyEl.innerHTML =
                "<p style=\"color:#A8A39A;\">Couldn't load the latest version. Please email " +
                "<a href=\"mailto:austin@carlinkhq.com\">austin@carlinkhq.com</a> for the current PDF.</p>";
        });

    // Minimal Markdown renderer — handles headings, paragraphs, bullet
    // lists, links, bold, italics, and code spans. The legal docs are
    // hand-written prose, no tables / images / nested lists, so this
    // covers the entire surface area without pulling a 200KB dependency.
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
        // Order matters: code first so its content isn't re-processed.
        s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" rel="noopener noreferrer">$1</a>');
        return s;
    }
})();
