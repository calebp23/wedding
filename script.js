// script.js
document.addEventListener("DOMContentLoaded", () => {
  // --- Dietary toggle ---
  const dietarySelect = document.getElementById("dietary-select");
  const dietaryDetails = document.getElementById("dietary-details");
  const dietaryTextarea = document.querySelector('textarea[name="dietary_details"]');

  function syncDietaryVisibility() {
    const show = dietarySelect && dietarySelect.value === "Yes";
    if (dietaryDetails) dietaryDetails.style.display = show ? "block" : "none";
    if (!show && dietaryTextarea) dietaryTextarea.value = "";
  }
  if (dietarySelect) {
    syncDietaryVisibility();
    dietarySelect.addEventListener("change", syncDietaryVisibility);
  }

  // --- Submit to Google Apps Script (FormData) ---
  const form = document.getElementById("rsvp-form");
  const statusEl = document.getElementById("form-status");

  // TODO: Replace with your *deployed* Apps Script Web App URL (ends with /exec)
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykyIiLMDmdW7lzqbMWZFdx0tVj4ZQIrbpQVnJIwlPHVKBtg_7O_vCT7XHRcVIzEz3SfA/exec";

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (statusEl) statusEl.textContent = "Submitting…";

    // Honeypot
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim() !== "") {
      if (statusEl) statusEl.textContent = "Submission blocked.";
      return;
    }

    const fd = new FormData(form);
    fd.append("submitted_at", new Date().toISOString());
    fd.append("user_agent", navigator.userAgent);

    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: "POST", body: fd });
      const json = await res.json().catch(() => null);

      if (res.ok && json && json.status === "success") {
        if (statusEl) statusEl.textContent = "Thanks! Your RSVP has been recorded.";
        form.reset();
        const evt = new Event("change");
        if (dietarySelect) dietarySelect.dispatchEvent(evt);
      } else {
        if (statusEl) statusEl.textContent = "Oops! Something went wrong. Please try again.";
      }
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Network error. Please try again.";
    }
  });
});

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}
