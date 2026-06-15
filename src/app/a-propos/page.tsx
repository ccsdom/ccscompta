import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Compass,
  FileCheck2,
  HeartHandshake,
  Lightbulb,
  Menu,
  ShieldCheck,
  Smartphone,
  Target,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr/a-propos';

export const metadata: Metadata = {
  title: 'A propos de CCS Compta | SaaS comptable pour cabinets exigeants',
  description:
    'CCS Compta aide les cabinets comptables a moderniser la collecte client, reduire la saisie manuelle et garder le controle humain sur la production comptable.',
  alternates: {
    canonical: '/a-propos',
  },
  openGraph: {
    title: 'A propos de CCS Compta - Moderniser la collecte comptable',
    description:
      'Une vision produit exigeante pour simplifier la relation client, proteger les pieces comptables et accelerer la production des cabinets.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A propos de CCS Compta',
    description:
      'Un SaaS pense pour les cabinets comptables : collecte client, OCR IA, pre-saisie, validation et securite.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const beliefs = [
  {
    icon: Target,
    title: 'Le cabinet garde le controle',
    description:
      'L automatisation doit supprimer les operations fastidieuses, pas remplacer le jugement professionnel.',
  },
  {
    icon: Smartphone,
    title: 'Le client doit comprendre vite',
    description:
      'Un bon portail client se juge sur smartphone, dans les moments simples : deposer, suivre, completer.',
  },
  {
    icon: ShieldCheck,
    title: 'La confiance se construit dans l architecture',
    description:
      'Roles, separation par cabinet, historique et controle des acces doivent etre au coeur du produit.',
  },
];

const operatingPrinciples = [
  'Partir des irritants reels des cabinets, pas d une demonstration technologique.',
  'Construire des parcours courts pour les clients qui ne veulent pas apprendre un outil de plus.',
  'Rendre les statuts, rejets et demandes de complement lisibles par tous.',
  'Proteger les donnees comptables avec des permissions et une separation claires.',
  'Mesurer la robustesse par les tests, les builds et les parcours utilisateurs connectes.',
  'Avancer vite, mais sans casser les fondations du SaaS.',
];

const roadmapMindset = [
  {
    icon: FileCheck2,
    title: 'Collecte plus propre',
    description:
      'Moins de pieces perdues dans les e-mails, plus de documents rattaches au bon client et au bon statut.',
  },
  {
    icon: Lightbulb,
    title: 'IA utile, pas spectaculaire',
    description:
      'OCR, extraction, detection d anomalies et recherche intelligente au service du controle cabinet.',
  },
  {
    icon: Users2,
    title: 'Organisation cabinet',
    description:
      'Des interfaces pour super admin, managers, collaborateurs, secretaires et clients, avec les bons droits.',
  },
  {
    icon: Compass,
    title: 'Produit durable',
    description:
      'Une architecture qui migre progressivement les traitements critiques cote backend et reduit les risques.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'A propos de CCS Compta',
  url: siteUrl,
  description:
    'Mission et vision de CCS Compta : simplifier la collecte comptable, reduire la saisie et renforcer la relation client des cabinets.',
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
            <Link key={link.href} href={link.href} className="transition hover:text-blue-700">
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

function MissionPanel() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <HeartHandshake className="h-4 w-4" />
          Notre role
        </div>
        <p className="mt-5 text-3xl font-black leading-tight">
          Rendre la collecte comptable assez simple pour le client, assez robuste pour le cabinet.
        </p>
        <p className="mt-4 leading-7 text-slate-300">
          CCS Compta doit devenir le pont fiable entre les pieces du client et la production du cabinet.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Simplifier', 'moins de friction client'],
          ['Controler', 'validation humaine gardee'],
          ['Produire', 'dossiers mieux prepares'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl bg-slate-50 p-4">
            <p className="font-black text-blue-700">{title}</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
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

export default function AboutPage() {
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
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-bold text-blue-700 shadow-sm">
                <BadgeCheck className="h-4 w-4" />
                Mission produit
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Redonner du temps utile aux cabinets comptables.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta existe pour retirer les operations de collecte et de pre-saisie qui ralentissent la production, tout en preservant le controle humain, la securite et la qualite du dossier.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/connexion"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  Demander une demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/fonctionnalites"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Voir le produit
                </Link>
              </div>
            </div>

            <MissionPanel />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Ce que nous croyons</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                La meilleure technologie est celle qui rend le metier plus clair.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Nous construisons CCS Compta avec une conviction simple : l IA et l automatisation doivent augmenter le cabinet, pas le deposseder de son expertise.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {beliefs.map((belief) => {
                const Icon = belief.icon;

                return (
                  <article key={belief.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-xl font-black text-slate-950">{belief.title}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{belief.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-blue-200">
                <Building2 className="h-4 w-4" />
                Exigence cabinet
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Un SaaS comptable doit etre plus qu une belle interface.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Il doit supporter des donnees sensibles, des utilisateurs varies, des habitudes de travail reelles et une exigence de fiabilite quotidienne.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {operatingPrinciples.map((principle) => (
                <div key={principle} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm font-semibold leading-6 text-slate-200">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Trajectoire produit</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Construire progressivement un outil robuste, efficace et simple.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Notre priorite est d avancer par fondations solides : securite, experience mobile, backend fiable, tests connectes et pages publiques professionnelles.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {roadmapMindset.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="h-7 w-7 text-blue-700" />
                    <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">Notre promesse</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Moins de saisie subie, plus de valeur produite.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Le but n est pas de faire croire que tout devient automatique. Le but est de rendre les operations repetitives plus courtes, les dossiers plus propres, et le suivi client plus fluide.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Client', 'depose et suit simplement'],
                  ['CCS Compta', 'prepare et signale'],
                  ['Cabinet', 'controle et produit'],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-lg font-black text-slate-950">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm md:w-3/4 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-blue-700">Prochaine etape</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Decouvrir comment CCS Compta peut s adapter a votre cabinet.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Nous pouvons cadrer vos priorites : collecte client, mobile, securite, pre-saisie, organisation equipe et deploiement progressif.
                </p>
              </div>
              <Link
                href="/connexion"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                Demander une demo
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
