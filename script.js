/* ============================================
   ROLE BUTTON TOGGLE: Handles switching between STAFF and SUPPLIER roles
   ============================================ */
const roleButtons = document.querySelectorAll(".role-toggle button");

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all role buttons
    roleButtons.forEach((b) => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
  });
});

/* ============================================
   PASSWORD VISIBILITY TOGGLE: Handles show/hide password functionality
   ============================================ */
const visibilityButtons = document.querySelectorAll(".toggle-visibility");

visibilityButtons.forEach((btn) => {
  const targetId = btn.dataset.target;
  const input = document.getElementById(targetId);
  const iconImg = btn.querySelector("img[aria-hidden='true']");

  if (!input || !iconImg) return;

  btn.addEventListener("click", () => {
    const isCurrentlyVisible = input.type === "text";

    if (isCurrentlyVisible) {
      // Switch to hidden (password dots)
      input.type = "password";
      btn.dataset.state = "hidden";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Show password");
      iconImg.src = "eyes_closed.png"; // Change to closed eye icon
    } else {
      // Switch to visible (plain text)
      input.type = "text";
      btn.dataset.state = "visible";
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Hide password");
      iconImg.src = "eyes_open.png"; // Change to open eye icon
    }
  });
});

