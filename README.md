# Takealot Workforce Planning Suite v3

A modular, GitHub Pages-ready frontend for the Takealot Workforce Planning Suite. This project extracts the single-page Apps Script application into a clean, maintainable structure.

## Features

- **Dashboard** - KPI overview, executive summary, forecast vs actual charts
- **Forecast & Analytics** - MAPE/accuracy metrics, key drivers analysis
- **Workforce Planning** - FTE calculator, scenario planning, MRD flexi staffing
- **Budget Planner** - Headcount and cost budgeting by period
- **Salary Engine** - Salary table with brand/role filtering
- **Learnership Programme** - Learnership cost tracking with SETA funding
- **CAPEX Planning** - Asset register and depreciation schedules
- **Software & Licences** - Licence cost tracking with renewal calendar
- **Fixed Costs** - Support staff and overhead cost tracking
- **Financial Statement** - P&L schedule with cost distribution charts
- **AI Assistant** - Conversational AI for workforce insights
- **Dark Mode** - Full dark theme support

## Project Structure

```
site/
├── index.html              # Shell/router - loads sidebar, header, page sections
├── pages/                  # (Future) Individual page HTML files
├── js/
│   ├── api.js             # ALL fetch() calls replacing google.script.run
│   ├── router.js          # switchPage(), nav active state, global handlers
│   ├── utils.js           # fmtR, fmtNum, fmtPct, animateNumber, etc.
│   ├── charts.js          # Google Charts wrapper / Plotly shim
│   ├── dashboard.js       # loadDashboard()
│   ├── forecast.js        # loadForecastPage()
│   ├── workforce.js        # loadWorkforcePage()
│   ├── budget.js          # loadBudgetPage()
│   ├── salary.js          # loadSalaryPage()
│   ├── learnership.js     # loadLearnershipPage()
│   ├── capex.js           # loadCapex()
│   ├── software.js        # loadSoftware()
│   ├── fixedcosts.js      # loadFixedCosts()
│   ├── financials.js      # loadFinancials()
│   ├── reports.js         # loadReportsPage()
│   ├── ai.js              # loadAIPage()
│   └── shared.js          # refreshDataStatus(), refreshCache()
├── css/
│   ├── app.css            # All non-Tailwind custom CSS
│   └── theme.css          # Dark mode, brand color variables
├── assets/
│   ├── takealot_logo.svg  # Takealot logo
│   └── favicon.ico        # Placeholder favicon
└── README.md
```

## Setup Instructions

### 1. Clone/Download

```bash
git clone <repository-url>
cd data/wfp-ghpages/site
```

### 2. Configure API URL

Open `js/api.js` and replace the placeholder with your Apps Script Web App URL:

```javascript
const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
// Replace with: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3. Serve Locally

You can serve the files locally using any static server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

### 4. Connect Backend

See "Apps Script Backend Setup" below for connecting your backend.

## Deployment

### GitHub Pages

1. **Create a GitHub repository** and push the `site/` folder contents to the `main` branch.

2. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Under "Source", select **Deploy from a branch**
   - Select **main** branch and **/ (root)** folder
   - Click **Save**

3. **Your site will be available at:**
   ```
   https://<username>.github.io/<repository-name>/
   ```

4. **Update API URL** in `js/api.js` to point to your Apps Script deployment.

### Other Static Hosts

The project works on any static hosting service (Netlify, Vercel, Cloudflare Pages, etc.):
- Upload all files from the `site/` folder
- Configure your custom domain if needed
- Update `js/api.js` with your Apps Script URL

## Apps Script Backend Setup

### 1. Create the Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **+ New project**
3. Name it "WFP Backend"

### 2. Implement doPost

Add this function to handle API requests:

```javascript
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var action = payload.action;
  var params = payload;
  delete params.action;
  
  var result;
  try {
    switch(action) {
      case "getForecastData": result = getForecastData(params); break;
      case "getInsights": result = getInsights(params); break;
      case "getDepartments": result = getDepartments(params); break;
      case "getBudget": result = getBudget(params); break;
      case "getScenarios": result = getScenarios(); break;
      case "getWorkforceSummary": result = getWorkforceSummary(params); break;
      case "getSalaryTableData": result = getSalaryTableData(); break;
      case "getLearnershipCostSummary": result = getLearnershipCostSummary(params); break;
      case "getCapexDepreciationSchedule": result = getCapexDepreciationSchedule(params); break;
      case "getSoftwareCostSummary": result = getSoftwareCostSummary(params); break;
      case "getFixedCostsSummary": result = getFixedCostsSummary(params); break;
      case "getFinancialStatement": result = getFinancialStatement(params); break;
      case "getDataStatus": result = getDataStatus(); break;
      case "refreshBQCache": result = refreshBQCache(); break;
      case "getKeyDrivers": result = getKeyDrivers(params); break;
      case "askAIAssistant": result = askAIAssistant(params.question); break;
      case "getAIInsights": result = getAIInsights(params); break;
      case "getAIRecommendations": result = getAIRecommendations(params); break;
      default: result = { error: "Unknown action: " + action };
    }
  } catch(err) {
    result = { error: err.message || String(err) };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click **Select type** → **Web app**
3. Configure:
   - **Description:** WFP API v1
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. **Copy the Web App URL** (ends in `/exec`)

### 4. Update Frontend

Paste the Web App URL into `js/api.js`:

```javascript
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

## CORS Note

Google Apps Script Web Apps support CORS for GET requests natively. For POST requests from a browser:

- The `doPost` function returns JSON with correct headers
- Modern browsers allow cross-origin POST requests to Web Apps when:
  - The deployment access is set to "Anyone"
  - The response is JSON

If you encounter CORS issues:
1. Verify the Apps Script is deployed as "Anyone" access
2. Check browser console for specific error messages
3. Ensure the Web App URL is correct (not the edit URL)

## API Actions (18 functions)

| Action | Description |
|--------|-------------|
| `getForecastData` | Fetch forecast and actual contact data |
| `getInsights` | Get executive summary insights |
| `getDepartments` | Get list of departments |
| `getBudget` | Get budget data for FY/scenario |
| `getScenarios` | Get planning scenarios |
| `getWorkforceSummary` | Get workforce headcount summary |
| `getSalaryTableData` | Get salary table data |
| `getLearnershipCostSummary` | Get learnership cost data |
| `getCapexDepreciationSchedule` | Get CAPEX depreciation schedule |
| `getSoftwareCostSummary` | Get software licence costs |
| `getFixedCostsSummary` | Get fixed costs summary |
| `getFinancialStatement` | Get P&L financial statement |
| `getDataStatus` | Get data source status |
| `refreshBQCache` | Refresh BigQuery cache |
| `getKeyDrivers` | Get forecast key drivers |
| `askAIAssistant` | Ask AI a question |
| `getAIInsights` | Get AI-generated insights |
| `getAIRecommendations` | Get AI recommendations |

## Troubleshooting

### "google is not defined" error
This is expected - the Apps Script `google.script.run` API is not available in GitHub Pages. All calls use `apiFetch()` instead.

### Charts not loading
Ensure Google Charts loader is loaded before drawing:
```javascript
google.charts.load('current', {packages: ['corechart', 'bar']});
```

### Dark mode colors incorrect
Theme CSS provides dark mode overrides. Ensure `theme.css` is loaded after `app.css`.

### API errors
1. Verify `API_URL` in `js/api.js` is correct
2. Check browser Network tab for response details
3. Verify Apps Script is deployed and URL is correct

## License

Internal use only - Takealot Proprietary
