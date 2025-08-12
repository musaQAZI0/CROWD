// Article data
const articlesData = {
  attending: [
    { title: "Find your tickets", icon: "file-text" },
    { title: "Request a refund", icon: "dollar-sign" },
    { title: "Contact the event organizer", icon: "message-circle" },
    { title: "What is this charge from Crowd?", icon: "credit-card" },
    { title: "Transfer tickets to someone else", icon: "send" },
    { title: "Edit your order information", icon: "file-text" },
  ],
  organizing: [
    { title: "Create and edit ticket types", icon: "file-text" },
    { title: "Add images and video to your event", icon: "file-text" },
    { title: "Add and manage your payout methods", icon: "credit-card" },
    { title: "Troubleshoot delayed or missing payouts", icon: "dollar-sign" },
    { title: "Email your registered attendees", icon: "send" },
    { title: "Issue a full or partial refund", icon: "dollar-sign" },
  ],
}

// SVG icons
const icons = {
  "file-text":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
  "dollar-sign":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
  "message-circle":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
  "credit-card":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
  send: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9 22,2"></polygon></svg>',
}

// Current active tab
let currentTab = "attending"

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  renderArticles()
  setupTabListeners()
  setupSearchListener()
  setupButtonListeners()
})

// Render articles based on current tab
function renderArticles() {
  const articlesGrid = document.getElementById("articlesGrid")
  const articles = articlesData[currentTab]

  articlesGrid.innerHTML = articles
    .map(
      (article) => `
        <div class="article-card" onclick="handleArticleClick('${article.title}')">
            <div class="article-icon">
                ${icons[article.icon]}
            </div>
            <div class="article-title">${article.title}</div>
        </div>
    `,
    )
    .join("")
}

// Setup tab button listeners
function setupTabListeners() {
  const tabButtons = document.querySelectorAll(".tab-button")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Update current tab
      currentTab = this.dataset.tab

      // Re-render articles
      renderArticles()
    })
  })
}

// Setup search functionality
function setupSearchListener() {
  const searchInput = document.getElementById("searchInput")

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase()
    console.log("Searching for:", query)
    // Add search functionality here
  })

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault()
      const query = this.value.trim()
      if (query) {
        console.log("Search submitted:", query)
        alert("Search functionality would be implemented here for: " + query)
      }
    }
  })
}

// Setup button listeners
function setupButtonListeners() {
  // Login button
  const loginButton = document.querySelector(".login-button")
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      console.log("Login clicked")
      alert("Login functionality would be implemented here")
    })
  }

  // Contact button
  const contactButton = document.querySelector(".contact-button")
  if (contactButton) {
    contactButton.addEventListener("click", () => {
      console.log("Contact support clicked")
      alert("Contact support functionality would be implemented here")
    })
  }

  // Topic cards
  const topicCards = document.querySelectorAll(".topic-card")
  topicCards.forEach((card) => {
    card.addEventListener("click", function () {
      const topicTitle = this.querySelector("span").textContent
      console.log("Topic clicked:", topicTitle)
      alert("Topic navigation would be implemented here for: " + topicTitle)
    })
  })
}

// Handle article clicks
function handleArticleClick(articleTitle) {
  console.log("Article clicked:", articleTitle)
  alert("Article navigation would be implemented here for: " + articleTitle)
}

// Handle footer link clicks
document.addEventListener("click", (e) => {
  if (e.target.matches(".footer-column a, .footer-links a")) {
    e.preventDefault()
    const linkText = e.target.textContent
    console.log("Footer link clicked:", linkText)
    alert("Navigation would be implemented here for: " + linkText)
  }
})