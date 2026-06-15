import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  HelpCircle,
  LockKeyhole,
  Menu,
  Sparkles,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr/tarifs';

export const metadata: Metadata = {
  title: 'Tarifs CCS Compta | Plans SaaS pour cabinets comptables',
  description:
    'Consultez les offres CCS Compta pour cabinets comptables : portail client, collecte securisee, OCR IA, pre-saisie, validation et pilotage multi-dossiers.',
  alternates: {
    canonical: '/tarifs',
  },
  openGraph: {
    title: 'Tarifs CCS Compta - SaaS de collecte et pre-saisie comptable',
    description:
      'Des offres adaptees au volume de clients, de pieces et de collaborateurs de votre cabinet comptable.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs CCS Compta',
    description:
      'Choisissez une offre adaptee a votre cabinet pour digitaliser la collecte, reduire la saisie et garder le controle.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const plans = [
  {
    icon: FileText,
    name: 'Lancement',
    eyebrow: 'Pour cadrer le demarrage',
    price: 'Sur devis',
    description: 'Ideal pour valider le parcours client, structurer la collecte et mesurer les premiers gains.',
    features: [
      'Portail client securise',
      'Depot de pieces mobile et ordinateur',
      'OCR et pre-saisie sur les pieces courantes',
      'Validation humaine par le cabinet',
      'Accompagnement au parametrage initial',
    ],
    cta: 'Demander une estimation',
    href: '/connexion',
  },
  {
    icon: Building2,
    name: 'Cabinet',
    eyebrow: 'Pour industrialiser la production',
    price: 'Sur mesure',
    description: 'Le socle recommande pour deployer CCS Compta sur plusieurs dossiers et collaborateurs.',
    features: [
      'Gestion multi-clients',
      'Roles collaborateur, manager et client',
      'Suivi des statuts et pieces manquantes',
      'Upload par le cabinet pour un client',
      'Support prioritaire de mise en production',
    ],
    highlighted: true,
    cta: 'Planifier une demo',
    href: '/connexion',
  },
  {
    icon: Users2,
    name: 'Reseau',
    eyebrow: 'Pour cabinets multi-sites',
    price: 'Personnalise',
    description: 'Pour les organisations qui ont besoin de gouvernance, volumes eleves et accompagnement avance.',
    features: [
      'Volumes documents adaptes',
      'Pilotage multi-cabinets ou multi-sites',
      'Regles de securite et roles avances',
      'Priorisation des integrations metier',
      'Suivi projet et support dedie',
    ],
    cta: 'Contacter CCS Compta',
    href: '/assistance',
  },
];

const included = [
  'Hebergement applicatif et mises a jour produit',
  'Portail client responsive pense smartphone',
  'Extraction IA et controle humain conserve',
  'Separation des donnees par cabinet',
  'Assistance au parametrage et a la prise en main',
  'Ameliorations continues du SaaS',
];

const pricingFactors = [
  {
    icon: FileText,
    title: 'Volume documentaire',
    description: 'Nombre de pieces traitees chaque mois, typologie des documents et niveau d automatisation attendu.',
  },
  {
    icon: Users2,
    title: 'Organisation cabinet',
    description: 'Nombre de collaborateurs, managers, clients actifs et dossiers a suivre dans la plateforme.',
  },
  {
    icon: LockKeyhole,
    title: 'Niveau de gouvernance',
    description: 'Roles, separation des acces, accompagnement au deploiement et besoins d integration.',
  },
];

const faqs = [
  {
    question: 'Pourquoi les tarifs sont-ils sur devis ?',
    answer:
      'Le cout depend fortement du volume de pieces, du nombre de clients, de l organisation du cabinet et du niveau d accompagnement necessaire au lancement.',
  },
  {
    question: 'Peut-on commencer progressivement ?',
    answer:
      'Oui. La meilleure approche consiste a demarrer avec un perimetre pilote, puis a etendre aux dossiers et collaborateurs une fois le flux valide.',
  },
  {
    question: 'Le client final paie-t-il un acces ?',
    answer:
      'Le modele cible privilegie une facturation cabinet. Les acces clients servent a faciliter la collecte et la relation, pas a complexifier votre gestion.',
  },
  {
    question: 'Que comprend l accompagnement ?',
    answer:
      'Il peut couvrir le parametrage initial, les premiers tests, la formation courte des utilisateurs et le cadrage des bonnes pratiques de collecte.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Tarifs CCS Compta',
  url: siteUrl,
  description:
    'Offres CCS Compta pour cabinets comptables : portail client, collecte, OCR IA, pre-saisie, validation et pilotage.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'CCS Compta',
    url: 'https://ccscompta.fr',
  },
};

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Logo className="h-5 w-5" />
          </span>
          <span className="text-base font-black">CCS Compta</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.href === '/tarifs' ? 'text-blue-700' : 'transition hover:text-blue-700'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/connexion" className="text-sm font-semibold text-slate-700 transition hover:text-blue-700">
            Se connecter
          </Link>
          <Link
            href="/connexion"
            className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Demander une demo
          </Link>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </summary>
          <div className="absolute right-0 mt-3 hidden w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl group-open:block">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
              <Link href="/connexion" className="mt-2 rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-bold text-white">
                Demander une demo
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3 font-black text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Logo className="h-5 w-5" />
            </span>
            CCS Compta
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Plateforme SaaS pour cabinets comptables : collecte client, OCR, validation et suivi des pieces.
          </p>
        </div>
        <div>
          <p className="font-bold text-slate-950">Produit</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-500">
            <Link href="/fonctionnalites" className="hover:text-blue-700">Fonctionnalites</Link>
            <Link href="/tarifs" className="hover:text-blue-700">Tarifs</Link>
            <Link href="/securite" className="hover:text-blue-700">Securite</Link>
          </div>
        </div>
        <div>
          <p className="font-bold text-slate-950">Ressources</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-500">
            <Link href="/blog" className="hover:text-blue-700">Blog</Link>
            <Link href="/assistance" className="hover:text-blue-700">Assistance</Link>
            <Link href="/a-propos" className="hover:text-blue-700">A propos</Link>
          </div>
        </div>
        <div>
          <p className="font-bold text-slate-950">Legal</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-500">
            <Link href="/mentions-legales" className="hover:text-blue-700">Mentions legales</Link>
            <Link href="/politique-de-confidentialite" className="hover:text-blue-700">Confidentialite</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main>
        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-bold text-blue-700 shadow-sm">
                <BadgeCheck className="h-4 w-4" />
                Tarification adaptee aux cabinets
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Un tarif juste, construit sur vos volumes reels.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta n est pas une boite a outils generique. Le prix depend de votre organisation, du nombre de dossiers, du volume de pieces et de l accompagnement necessaire pour deployer proprement.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/connexion"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  Demander une estimation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/fonctionnalites"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Voir les fonctionnalites
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
                  <Calculator className="h-4 w-4" />
                  Estimation structuree
                </div>
                <p className="mt-4 text-3xl font-black leading-tight">
                  Nous dimensionnons l offre avant de la facturer.
                </p>
                <p className="mt-4 leading-7 text-slate-300">
                  Un deploiement reussi commence par une vraie analyse : volumes, roles, clients pilotes, niveau de support et priorites metier.
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['1', 'cadrage du besoin'],
                  ['2', 'perimetre pilote'],
                  ['3', 'offre ajustee'],
                ].map(([step, label]) => (
                  <div key={step} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-2xl font-black text-blue-700">{step}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Offres</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Trois niveaux pour avancer sans surdimensionner.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Les plans servent de cadre de discussion. L objectif est de choisir une trajectoire saine : demarrer vite, mesurer, puis etendre.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon;

                return (
                  <article
                    key={plan.name}
                    className={
                      plan.highlighted
                        ? 'relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-xl shadow-blue-900/10'
                        : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
                    }
                  >
                    {plan.highlighted ? (
                      <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                        Recommande
                      </div>
                    ) : null}
                    <span className={plan.highlighted ? 'flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white' : 'flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700'}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="mt-6 text-xs font-black uppercase text-blue-700">{plan.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{plan.name}</h3>
                    <p className="mt-4 text-4xl font-black text-slate-950">{plan.price}</p>
                    <p className="mt-4 min-h-20 leading-7 text-slate-600">{plan.description}</p>
                    <div className="mt-6 grid gap-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Link
                      href={plan.href}
                      className={
                        plan.highlighted
                          ? 'mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-950'
                          : 'mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700'
                      }
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">Ce qui influence le prix</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Une tarification lisible, fondee sur les vrais leviers de cout.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Nous evitons les forfaits trompeurs. Le bon prix doit correspondre a l usage attendu et au niveau de robustesse necessaire.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {pricingFactors.map((factor) => {
                const Icon = factor.icon;

                return (
                  <article key={factor.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="h-7 w-7 text-blue-700" />
                    <h3 className="mt-5 text-lg font-black text-slate-950">{factor.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{factor.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="rounded-3xl bg-slate-950 p-8 text-white lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-blue-200">
                <Sparkles className="h-4 w-4" />
                Inclus dans l approche
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Le tarif doit financer un produit fiable, pas seulement un acces logiciel.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                CCS Compta vise une production plus fluide, une collecte plus propre et une adoption client plus simple. Cela demande du produit, du support et de la rigueur.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-black uppercase text-blue-700">Questions frequentes</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Les points a clarifier avant de choisir.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                    <div>
                      <h3 className="font-black text-slate-950">{faq.question}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm md:w-3/4 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-blue-700">Prochaine etape</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Obtenir une estimation adaptee a votre cabinet.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Nous cadrons les volumes, les roles, les priorites et le perimetre pilote pour proposer une offre vraiment exploitable.
                </p>
              </div>
              <Link
                href="/connexion"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                Demander une estimation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
