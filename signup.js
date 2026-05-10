// Beta-access signup form — POSTs directly to Supabase REST.
//
// The Supabase URL + publishable anon key are safe to embed in the
// website (that's how every Supabase JS client works). The
// `beta_requests` table has RLS that lets the anon role INSERT but
// not SELECT, so submissions land in the table without exposing the
// list to anyone but admins.

const SUPABASE_URL      = "https://gdnzkwfoyzqmliijtyos.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MxDpZh0X5ERw6V7RFQxo9Q_tKsj67HL";

(function () {
    const form     = document.getElementById("signup-form");
    const emailEl  = document.getElementById("signup-email");
    const locEl    = document.getElementById("signup-location");
    const submitEl = document.getElementById("signup-submit");
    const statusEl = document.getElementById("signup-status");
    if (!form) return;

    const setStatus = (msg, kind) => {
        statusEl.textContent = msg;
        statusEl.className = "signup-status" + (kind ? " is-" + kind : "");
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email    = (emailEl.value    || "").trim();
        const location = (locEl.value      || "").trim();

        if (!email || !email.includes("@")) {
            setStatus("Please enter a valid email.", "error");
            emailEl.focus();
            return;
        }
        if (!location) {
            setStatus("Tell us your city so we know when your area opens.", "error");
            locEl.focus();
            return;
        }

        submitEl.disabled = true;
        submitEl.textContent = "Sending…";
        setStatus("");

        try {
            const res = await fetch(SUPABASE_URL + "/rest/v1/beta_requests", {
                method: "POST",
                headers: {
                    "apikey":        SUPABASE_ANON_KEY,
                    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                    "Content-Type":  "application/json",
                    "Prefer":        "return=minimal",
                },
                body: JSON.stringify({
                    email,
                    location,
                    user_agent: navigator.userAgent,
                    referrer:   document.referrer || "",
                }),
            });
            if (!res.ok) {
                throw new Error("Server returned " + res.status);
            }
            // Success state — replace the form with a thank-you so users
            // don't double-submit.
            form.innerHTML =
                "<div class=\"signup-success\">" +
                  "<p style=\"font-size:18px;font-weight:600;color:var(--ink);margin-bottom:8px;\">You're on the list.</p>" +
                  "<p style=\"color:var(--ink-mute);font-size:14px;\">We'll email <strong>" + escapeHtml(email) + "</strong> as soon as your area opens up. Talk soon.</p>" +
                "</div>";
        } catch (err) {
            console.error("Beta signup failed:", err);
            submitEl.disabled = false;
            submitEl.textContent = "Request Invite";
            setStatus("Something went wrong on our end. Please email austin@carlinkhq.com directly and we'll add you manually.", "error");
        }
    });

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
})();
