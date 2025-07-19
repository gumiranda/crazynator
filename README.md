# Crazy Code - AI-Powered No-Code Platform

Create apps and websites by chatting with AI. Crazy Code is a revolutionary no-code platform that transforms your ideas into functional applications through natural language conversation.

## 🚀 Features

- **AI-Powered Development**: Build applications using natural language
- **No-Code Interface**: Create complex apps without writing code
- **Real-time Collaboration**: Work with AI in real-time
- **Multiple Deployment Options**: Deploy to various platforms
- **Responsive Design**: Mobile-first approach with modern UI

## 🔧 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma
- **Authentication**: Clerk
- **AI Integration**: Multiple AI providers
- **Deployment**: Vercel

## 📈 SEO Optimizations

This project includes comprehensive SEO optimizations:

- ✅ **Meta Tags**: Optimized titles, descriptions, and keywords
- ✅ **Open Graph**: Social media sharing optimization
- ✅ **Twitter Cards**: Enhanced Twitter sharing
- ✅ **Structured Data**: JSON-LD schema markup
- ✅ **Sitemap**: Dynamic XML sitemap generation
- ✅ **robots.txt**: Search engine crawler guidelines
- ✅ **Performance**: Core Web Vitals optimization
- ✅ **Analytics**: Google Analytics integration
- ✅ **PWA**: Progressive Web App capabilities

For detailed SEO documentation, see [docs/SEO_OPTIMIZATION.md](docs/SEO_OPTIMIZATION.md).

## 🛠 Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Set up environment variables by copying the example:

```bash
cp env-example.txt .env.local
```

Configure your environment variables:

```env
# Essential for SEO
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Database
DATABASE_URL="your-database-url"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"

# Optional: Analytics & SEO
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GOOGLE_VERIFICATION_ID="your-verification-id"
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
crazy-code/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with SEO
│   │   ├── robots.txt         # SEO crawler guidelines
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   └── (home)/           # Home page group
│   ├── components/           # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── seo/             # SEO components
│   │   └── analytics/       # Analytics components
│   ├── lib/                 # Utility libraries
│   │   └── seo-utils.ts     # SEO helper functions
│   └── modules/             # Feature modules
├── public/                  # Static assets
│   ├── manifest.json        # PWA manifest
│   ├── browserconfig.xml    # Windows tiles
│   └── [various icons]      # SEO-optimized icons
└── docs/                    # Documentation
    └── SEO_OPTIMIZATION.md  # SEO guide
```

## 🎯 Key Pages

- **Homepage** (`/`): Main landing page with optimized metadata
- **Pricing** (`/pricing`): Plans and pricing with structured data
- **Authentication** (`/sign-in`, `/sign-up`): User authentication flows

## 🔍 SEO Features

### Metadata Optimization
Each page has custom metadata including:
- Unique titles and descriptions
- Relevant keywords
- Open Graph tags
- Twitter Cards
- Canonical URLs

### Structured Data
Implemented Schema.org markup for:
- SoftwareApplication
- Organization
- Website with SearchAction
- Product (pricing page)

### Technical SEO
- Dynamic sitemap generation
- Optimized robots.txt
- Web App Manifest (PWA)
- Performance optimizations
- Mobile-first design

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Before Deployment
1. Set up production environment variables
2. Create SEO images (og-image.jpg, etc.)
3. Configure Google Analytics
4. Set up Google Search Console

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📊 Analytics & Monitoring

- **Google Analytics**: User behavior tracking
- **Search Console**: SEO performance monitoring
- **Core Web Vitals**: Performance metrics
- **Lighthouse**: Regular performance audits

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and make sure to follow our code of conduct.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Documentation](docs/SEO_OPTIMIZATION.md)
- [Live Demo](https://crazycode.com)
- [Issues](https://github.com/your-org/crazy-code/issues)
- [Discussions](https://github.com/your-org/crazy-code/discussions)
