This is a **Whitelabel AI Code Generator** built with [Next.js](https://nextjs.org), allowing complete brand customization for different clients and use cases.

## 🚀 Quick Start

### 1. Setup Your Brand

Run the interactive whitelabel setup:

```bash
npm run setup-whitelabel
```

This will guide you through configuring your brand name, colors, logo, and other settings.

### 2. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see your branded application.

## 🎨 Whitelabel Features

- **Complete Brand Customization**: Name, tagline, description, colors
- **Logo & Asset Management**: Custom logos, favicons, and images  
- **Feature Toggles**: Enable/disable pricing, signup, signin
- **SEO Configuration**: Custom meta tags, titles, descriptions
- **Multiple Config Methods**: Environment variables, JSON files, or API
- **Responsive Design**: Works on all devices with your branding

## 📖 Documentation

- **[WHITELABEL.md](./WHITELABEL.md)** - Complete whitelabel system documentation
- **[.env.whitelabel.example](./.env.whitelabel.example)** - All available environment variables
- **[whitelabel.config.example.json](./whitelabel.config.example.json)** - JSON configuration format

## 🛠️ Configuration Options

### Environment Variables
```bash
NEXT_PUBLIC_BRAND_NAME="Your Brand"
NEXT_PUBLIC_PRIMARY_COLOR="#your-color"
NEXT_PUBLIC_LOGO_MAIN="/your-logo.svg"
# ... and many more
```

### JSON Configuration
```json
{
  "brand": { "name": "Your Brand" },
  "colors": { "primary": "#your-color" },
  "logos": { "main": "/your-logo.svg" }
}
```

## 🚀 Deployment

The whitelabel system works with all deployment platforms:

- **Vercel**: Set environment variables in the dashboard
- **Docker**: Use .env files or build-time variables  
- **Multiple Brands**: Different configs for different deployments

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Whitelabel Best Practices](./WHITELABEL.md#casos-de-uso) - different implementation strategies

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
