// script.js
// Wedding site client: dietary toggle + RSVP submit (always shows success if sent OK)

document.addEventListener("DOMContentLoaded", () => {
  // ------ Dietary toggle ------
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

  // ------ Form submit ------
  const form = document.getElementById("rsvp-form");
  const statusEl = document.getElementById("form-status");

  // TODO: paste your deployed Web App URL (ends with /exec)
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbykyIiLMDmdW7lzqbMWZFdx0tVj4ZQIrbpQVnJIwlPHVKBtg_7O_vCT7XHRcVIzEz3SfA/exec";

  if (!form) return;

  form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Submitting…";

  const hp = form.querySelector('input[name="website"]');
  if (hp && hp.value.trim() !== "") {
    statusEl.textContent = "Submission blocked.";
    return;
  }

  const fd = new FormData(form);
  fd.append("submitted_at", new Date().toISOString());


  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: fd,
      mode: "no-cors",  // ignore CORS, we can’t read response
    });

    // Brief status then redirect
    statusEl.textContent = "Thanks! Redirecting…";
    setTimeout(() => {
      window.location.href = "thankyou.html";   // <- redirect target
    }, 800); // delay so message shows briefly
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Network error. Please try again later.";
  }
});

});
