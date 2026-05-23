// script.js
// RSVP page: filtered name autocomplete (1+ char), dietary toggle,
// POST submit (no-cors), redirect to thankyou.html

document.addEventListener("DOMContentLoaded", () => {
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbykyIiLMDmdW7lzqbMWZFdx0tVj4ZQIrbpQVnJIwlPHVKBtg_7O_vCT7XHRcVIzEz3SfA/exec";

  // ---------- Elements ----------
  const form = document.getElementById("rsvp-form");
  const statusEl = document.getElementById("form-status");

  // Name autocomplete
  const nameInput = document.getElementById("name-input");
  const guestDatalist = document.getElementById("guest-list");
  let guests = [];                  // full guest list (from sheet)
  const guestSet = new Set();        // lowercase names for validation

  // Dietary
  const dietarySelect = document.getElementById("dietary-select");
  const dietaryDetails = document.getElementById("dietary-details");
  const dietaryTextarea = document.querySelector('textarea[name="dietary_details"]');

  // ---------- Dietary toggle ----------
  function syncDietaryVisibility() {
    const show = dietarySelect && dietarySelect.value === "Yes";
    if (dietaryDetails) dietaryDetails.style.display = show ? "block" : "none";
    if (!show && dietaryTextarea) dietaryTextarea.value = "";
  }
  if (dietarySelect) {
    syncDietaryVisibility();
    dietarySelect.addEventListener("change", syncDietaryVisibility);
  }

  // ---------- Render filtered name matches ----------
  function renderMatches(query) {
    if (!guestDatalist) return;

    const q = query.trim().toLowerCase();

    // Only show suggestions once at least 1 character is typed
    if (q.length < 1) {
      guestDatalist.innerHTML = "";
      return;
    }

    const matches = guests
      .filter(name => name.toLowerCase().includes(q))
      .slice(0, 12); // cap list length

    guestDatalist.innerHTML = "";
    matches.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      guestDatalist.appendChild(opt);
    });
  }

  // ---------- Load guest list (JSONP) ----------
  function loadGuestListJSONP() {
    if (!guestDatalist) return;

    if (statusEl) statusEl.textContent = "Loading guest list…";

    const cbName = "guestListCb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");

    window[cbName] = (data) => {
      try {
        if (!data || data.status !== "success" || !Array.isArray(data.guests)) {
          throw new Error(data?.message || "Could not load guest list");
        }

        guests = data.guests.map(s => String(s).trim()).filter(Boolean);
        guestSet.clear();
        guests.forEach(n => guestSet.add(n.toLowerCase()));

        // Start with empty suggestions
        if (guestDatalist) guestDatalist.innerHTML = "";

        // Attach input handlers
        if (nameInput) {
          nameInput.addEventListener("input", () => renderMatches(nameInput.value));
          nameInput.addEventListener("focus", () => renderMatches(nameInput.value));
          nameInput.addEventListener("blur", () => {
            // Clear suggestions so clicking back in doesn't show full list
            setTimeout(() => { guestDatalist.innerHTML = ""; }, 100);
          });
        }

        if (statusEl) statusEl.textContent = "";

      } catch (err) {
        console.error(err);
        if (statusEl) statusEl.textContent = "Could not load guest list. Please refresh.";
      } finally {
        try { delete window[cbName]; } catch (_) {}
        script.remove();
      }
    };

    script.onerror = () => {
      console.error("JSONP script load failed");
      if (statusEl) statusEl.textContent = "Could not load guest list. Please refresh.";
      try { delete window[cbName]; } catch (_) {}
      script.remove();
    };

    script.src = `${APPS_SCRIPT_URL}?action=guestList&callback=${encodeURIComponent(cbName)}`;
    document.body.appendChild(script);
  }

  loadGuestListJSONP();

  // ---------- Form submit ----------
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (statusEl) statusEl.textContent = "Submitting…";

    // Honeypot
    const hp = form.querySelector('input[name="website"]');
    if (hp && hp.value.trim() !== "") {
      if (statusEl) statusEl.textContent = "Submission blocked.";
      return;
    }

    // Validate name selection
    const chosenName = (nameInput ? nameInput.value : "").trim();
    if (!chosenName) {
      if (statusEl) statusEl.textContent = "Please enter your name.";
      return;
    }
    if (guestSet.size > 0 && !guestSet.has(chosenName.toLowerCase())) {
      if (statusEl) statusEl.textContent = "Please select your name from the suggestions.";
      return;
    }

    const fd = new FormData(form);
    fd.append("submitted_at", new Date().toISOString());

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: fd,
        mode: "no-cors",
      });

      if (statusEl) statusEl.textContent = "Thanks! Redirecting…";
      setTimeout(() => {
        window.location.href = "thankyou.html";
      }, 800);

    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Network error. Please try again later.";
    }
  });
});
