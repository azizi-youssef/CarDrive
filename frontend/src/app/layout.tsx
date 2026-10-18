import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const SITE_URL = 'https://cardrive.ma';
const SITE_NAME = 'CarDrive';
const SITE_TITLE = 'CarDrive — Location de voitures à Nador';
const SITE_DESCRIPTION =
  "Trouvez et comparez des voitures de location à Nador auprès d'agences locales. Recherchez par dates, catégorie et destination : aéroport Nador-Al Aroui, Beni Ansar, Nador et Marchica.";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

/* -------------------------------------------------------------------------- */
/* VIEWPORT                                                                   */
/* -------------------------------------------------------------------------- */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1220',
  colorScheme: 'light',
};

/* -------------------------------------------------------------------------- */
/* METADATA                                                                   */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME} Nador`,
  },

  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'travel',

  alternates: {
    canonical: '/',
    languages: { 'fr-MA': '/' },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: '/icon.png',
    apple: [{ url: '/icon.png', type: 'image/png' }],
  },

  manifest: '/manifest.webmanifest',

  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description:
      "Comparez les voitures disponibles à Nador et réservez auprès d'agences locales.",
    images: [
      {
        // Image dédiée au partage, au format 1200×630
        url: '/og-cardrive.png',
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description:
      "Trouvez et comparez votre voiture de location à Nador auprès d'agences locales.",
    images: ['/og-cardrive.png'],
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

/* -------------------------------------------------------------------------- */
/* DONNÉES STRUCTURÉES (SEO)                                                  */
/* -------------------------------------------------------------------------- */

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon_logo.png`,
      areaServed: {
        '@type': 'City',
        name: 'Nador',
        containedInPlace: { '@type': 'Country', name: 'Maroc' },
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'fr-MA',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* ROOT LAYOUT                                                                */
/* -------------------------------------------------------------------------- */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`h-full scroll-smooth ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Nettoyage des attributs injectés par les extensions navigateur (ex: Bitdefender bis_skin_checked) avant l'hydratation React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var clean = function() {
                    var els = document.querySelectorAll('[bis_skin_checked]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                    }
                  };
                  clean();
                  if (typeof MutationObserver !== 'undefined') {
                    var obs = new MutationObserver(clean);
                    obs.observe(document.documentElement, {
                      attributes: true,
                      subtree: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="flex min-h-full flex-col bg-[#F8FAFC] font-sans text-[#0F172A] antialiased selection:bg-[#E63946] selection:text-white"
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}