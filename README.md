# Medical Shop CRM (Web Version)

This is the web-based version of the Medical Shop CRM, built with React, Vite, Tailwind CSS, and Supabase.

## Deployment & Service Integration

### Netlify (Continuous Deployment)
This project is configured for automatic deployment via Netlify.
1. Connect your GitHub repository (`medical-shop-crm-web`) to a new or existing Netlify site.
2. The `netlify.toml` file in the root will automatically handle the build settings:
   - **Base directory:** `crm-web`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### Supabase Integration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navitgate to **Project Settings** > **Integrations** to connect this GitHub repository.
3. **Authentication Configuration (Crucial for Magic Links):**
   - Go to **Authentication** > **URL Configuration**.
   - **Site URL:** Set this to your Netlify URL (e.g., `https://medcrm-portal-aijaz-final.netlify.app`).
   - **Redirect URLs:** Add your Netlify URL with a wildcard: `https://medcrm-portal-aijaz-final.netlify.app/**`.
   - Click **Save**.

## Local Development

1. Navigate to the `crm-web` directory:
   ```bash
   cd crm-web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `crm-web/`: The main React application.
- `netlify.toml`: Netlify deployment configuration.
- `.gitignore`: Git exclusion rules.
