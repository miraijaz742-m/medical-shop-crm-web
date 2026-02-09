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
2. Navitgate to **Project Settings** > **Integrations**.
3. Connect the **GitHub** integration to this repository.

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
