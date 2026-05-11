// Marketing-site "For Organizers" form handler. POSTs directly to
// Supabase REST into the organizer_inquiries table.
//
// Same security model as signup.js:
//   * The anon publishable key is safe to embed.
//   * RLS on `organizer_inquiries` allows anon INSERT but blocks
//     anon SELECT, so submissions land in the table without
//     exposing the list back to the public.

const SUPABASE_URL      = "https://gdnzkwfoyzqmliijtyos.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MxDpZh0X5ERw6V7RFQxo9Q_tKsj67HL";

(function () {
    const form     = document.getElementById("organizer-form");
    if (!form) return;

    const nameEl    = document.getElementById("org-name");
    const emailEl   = document.getElementById("org-email");
    const igEl      = document.getElementById("org-instagram");
    const phoneEl   = document.getElementById("org-phone");
    const orgEl     = document.getElementById("org-organization");
    const cityEl    = document.getElementById("org-city");
    const messageEl = document.getElementById("org-message");
    const submitEl  = document.getElementById("org-submit");
    const statusEl  = document.getElementById("org-status");

    const setStatus = (msg, kind) => {
        statusEl.textContent = msg;
        statusEl.className = "signup-status" + (kind ? " is-" + kind : "");
    };

    // Strip a leading "@" or full Instagram URL so we save a clean
    // handle the admin can paste straight into instagram.com/<handle>.
    function normalizeInstagram(raw) {
        if (!raw) return "";
        let h = raw.trim()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/^instagram\.com\//, "");
        if (h.endsWith("/")) h = h.slice(0, -1);
        if (h.startsWith("@")) h = h.slice(1);
        return h;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName     = (nameEl.value    || "").trim();
        const email        = (emailEl.value   || "").trim();
        const phone        = (phoneEl.value   || "").trim();
        const instagram    = normalizeInstagram(igEl.value || "");
        const organization = (orgEl.value     || "").trim();
        const city         = (cityEl.value    || "").trim();
        const message      = (messageEl.value || "").trim();

        if (!fullName) {
            setStatus("Please tell us your name.", "error");
            nameEl.focus(); return;
        }
        if (!email || !email.includes("@") || !email.includes(".")) {
            setStatus("Please enter a valid email.", "error");
            emailEl.focus(); return;
        }
        if (!city) {
            setStatus("Tell us your city so we can prioritize your area.", "error");
            cityEl.focus(); return;
        }

        submitEl.disabled = true;
        submitEl.textContent = "Sending…";
        setStatus("");

        try {
            const res = await fetch(SUPABASE_URL + "/rest/v1/organizer_inquiries", {
                method: "POST",
                headers: {
                    "apikey":        SUPABASE_ANON_KEY,
                    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                    "Content-Type":  "application/json",
                    "Prefer":        "return=minimal",
                },
                body: JSON.stringify({
                    full_name:         fullName,
                    email:             email,
                    phone:             phone,
                    instagram_handle:  instagram,
                    organization_name: organization,
                    city_state:        city,
                    message:           message,
                    user_agent:        navigator.userAgent,
                    referrer:          document.referrer || "",
                }),
            });
            if (!res.ok) {
                throw new Error("Server returned " + res.status);
            }
            // Replace the form with a thank-you so users don't double-submit.
            form.innerHTML =
                "<div class=\"signup-success\">" +
                  "<p style=\"font-size:18px;font-weight:600;color:var(--ink);margin-bottom:8px;\">Thanks — we've got it.</p>" +
                  "<p style=\"color:var(--ink-mute);font-size:14px;\">We'll reach out to <strong>" + escapeHtml(email) + "</strong> within a couple of days to walk through next steps for your organizer account.</p>" +
                "</div>";
        } catch (err) {
            console.error("Organizer inquiry failed:", err);
            submitEl.disabled = false;
            submitEl.textContent = "Get on the early access list";
            setStatus("Something went wrong on our end. Please email austin@carlinkhq.com directly and we'll get you sorted.", "error");
        }
    });

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
})();
