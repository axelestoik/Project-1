# Lot 202 - Smoke Test Checklist

**Objective:** To perform a quick, high-level verification of the application's critical functionalities after a new build or deployment.

**Estimated Time:** ~10-15 minutes.

**Prerequisites:**
- The local development environment is running and accessible in the browser.
- A valid Gemini API key is configured in the `.env` file.

---

### Test Cases

| # | Feature Area | Test Case | Expected Result | Status (Pass/Fail) |
|---|---|---|---|---|
| **1** | **Application Launch** | Open the application in a browser. | The Dashboard loads as the default view without any critical console errors. The default user is "Staff Member". | |
| **2** | **API Key Validation** | Temporarily remove the `API_KEY` from `.env` and reload. | A warning banner appears at the top, indicating the API key is missing. AI features will show error states. (Restore key after test). | |
| **3** | **Core Navigation** | Click on each item in the main sidebar (Dashboard, Properties, Leases, etc.). | Each respective module loads its main view, displaying the correct title and primary content without crashing. | |
| **4** | **Role-Based Access (RBAC)** | 1. Go to **Settings**. <br> 2. Switch user role to **Tenant**. <br> 3. Switch user role to **Admin**. | 1. The "System Status" link in the sidebar should disappear for the Tenant role. <br> 2. The "System Status" link should reappear for the Admin role. <br> 3. The "System Administration" panel should be visible in Settings for the Admin role only. | |
| **5** | **Internationalization (i18n)** | 1. Go to **Settings**. <br> 2. Click the **Español** button. <br> 3. Click the **English** button. | 1. Sidebar and Settings page text should translate to Spanish. <br> 2. The UI should revert to English. | |
| **6** | **AI Feature: Accounting Audit** | 1. Navigate to the **Accounting** module. <br> 2. Click the "AI Audit" button. | 1. The button enters a loading state ("Consulting AI..."). <br> 2. An "Intelligence Report" card appears with a text response from the Gemini API. | |
| **7** | **AI Feature: Maintenance Dispatch** | 1. Navigate to the **Maintenance** module. <br> 2. Click on the first task in the list ("Water Leak"). | 1. The "AI Dispatcher" panel on the right shows a loading animation. <br> 2. The panel populates with "Strategy & Protocol" advice from the Gemini API. | |
| **8** | **System Status Check** | 1. Log in as **Admin** or **Staff**. <br> 2. Navigate to **System Status**. | 1. Both status checks ("Environment Configuration" and "Gemini API Connectivity") should complete. <br> 2. They should display an "Operational" status (assuming the API key is valid). | |
| **9** | **Data Interaction: Maintenance Status** | 1. Navigate to the **Maintenance** module. <br> 2. Find the "Water Leak" task. <br> 3. Use the dropdown to change its status from "Assessing" to "Quote". | The status tag on the task card immediately updates to "Quote". The change persists on the UI. | |
| **10**| **Data Filtering: Leases** | 1. Navigate to the **Leases** module. <br> 2. Click the "Terminated" filter button. <br> 3. Click the "All" filter button. | 1. The table should show "No contract matching..." as there are no terminated leases. <br> 2. The table should repopulate with all initial leases. | |

---

**Test Summary:**

- **Date:**
- **Tester:**
- **Result (Overall Pass/Fail):**
- **Notes/Bugs Found:**
