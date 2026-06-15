import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BellRing,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FolderCheck,
  LockKeyhole,
  Menu,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr/fonctionnalites';

export const metadata: Metadata = {
  title: 'Fonctionnalites CCS Compta | Collecte, OCR, pre-saisie et validation comptable',
  description:
    'Decouvrez les fonctionnalites CCS Compta pour cabinets comptables : portail client mobile, collecte securisee, OCR IA, pre-saisie, validation, suivi, relances et pilotage multi-dossiers.',
  alternates: {
    canonical: '/fonctionnalites',
  },
  openGraph: {
    title: 'Fonctionnalites CCS Compta - Portail IA pour cabinets comptables',
    description:
      'Une plateforme SaaS pour collecter les pieces clients, extraire les donnees, controler les anomalies et piloter la production comptable.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fonctionnalites CCS Compta',
    description:
      'Portail client mobile, OCR IA, pre-saisie comptable, validation cabinet et suivi des pieces dans une interface simple.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const heroProof = [
  { value: 'Mobile', label: 'depot client rapide depuis smartphone' },
  { value: 'IA', label: 'lecture et pre-saisie des donnees utiles' },
  { value: 'Controle', label: 'validation humaine avant production' },
];

const featurePillars = [
  {
    icon: UploadCloud,
    eyebrow: 'Collecte',
    title: 'Portail client simple et securise',
    description:
      'Un espace clair pour deposer factures, tickets, releves et justificatifs sans multiplier les e-mails ni les relances.',
    points: ['Depot mobile ou ordinateur', 'Statuts visibles par le client', 'Pieces rattachees au bon dossier'],
  },
  {
    icon: ScanLine,
    eyebrow: 'Lecture',
    title: 'OCR et extraction IA',
    description:
      'CCS Compta prepare les champs importants avant intervention cabinet : fournisseur, date, TTC, TVA, categorie et signaux d anomalie.',
    points: ['Analyse des documents courants', 'Score de confiance', 'Anomalies mises en evidence'],
  },
  {
    icon: ClipboardCheck,
    eyebrow: 'Validation',
    title: 'Controle cabinet maitrise',
    description:
      'Le collaborateur garde la main sur chaque piece : correction, commentaire, acceptation, rejet ou demande de complement.',
    points: ['File de traitement priorisee', 'Commentaires centralises', 'Historique des decisions'],
  },
  {
    icon: FolderCheck,
    eyebrow: 'Production',
    title: 'Dossiers mieux prepares',
    description:
      'Les pieces deviennent exploitables plus vite, avec une vision par client, periode, statut et niveau d urgence.',
    points: ['Vue multi-clients', 'Suivi des pieces manquantes', 'Preparation export comptable'],
  },
];

const modules = [
  {
    icon: Smartphone,
    title: 'Experience client',
    items: ['Depot en quelques secondes', 'Historique des documents', 'Demandes de complement lisibles', 'Interface adaptee smartphone'],
  },
  {
    icon: Users2,
    title: 'Travail cabinet',
    items: ['Tri par statut', 'Rejets motives', 'Upload pour le compte du client', 'Coordination collaborateur et manager'],
  },
  {
    icon: Bot,
    title: 'Assistance IA',
    items: ['Extraction structuree', 'Detection des incoherences', 'Recherche intelligente', 'Support integre a l application'],
  },
  {
    icon: ShieldCheck,
    title: 'Securite et gouvernance',
    items: ['Roles separes', 'Isolation par cabinet', 'Acces limites au besoin', 'Journalisation des operations sensibles'],
  },
];

const workflow = [
  {
    title: 'Le client depose',
    description: 'Il photographie ou ajoute sa piece, puis suit son statut sans relancer le cabinet.',
  },
  {
    title: 'CCS Compta prepare',
    description: 'La plateforme lit le document, extrait les donnees et signale ce qui merite attention.',
  },
  {
    title: 'Le cabinet controle',
    description: 'Le collaborateur valide, corrige ou demande un complement avec une trace claire.',
  },
  {
    title: 'La production avance',
    description: 'Les dossiers sont plus propres, les priorites plus visibles et les operations repetitives reduites.',
  },
];

const impactCards = [
  {
    icon: BellRing,
    title: 'Moins de relances inutiles',
    description: 'Les statuts et demandes de pieces rendent la collecte plus lisible pour le client et le cabinet.',
  },
  {
    icon: BarChart3,
    title: 'Pilotage plus net',
    description: 'Les equipes visualisent les volumes, les blocages et les dossiers qui demandent une action.',
  },
  {
    icon: Banknote,
    title: 'Temps mieux investi',
    description: 'La saisie repetitive recule pour laisser plus de place au controle, a la revision et au conseil.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Fonctionnalites CCS Compta',
  url: siteUrl,
  description:
    'Fonctionnalites du SaaS CCS Compta pour cabinets comptables : collecte client, OCR IA, validation, suivi et securite multi-cabinet.',
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
              className={link.href === '/fonctionnalites' ? 'text-blue-700' : 'transition hover:text-blue-700'}
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

function FeatureProductView() {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase text-blue-700">Vue production</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Pieces a traiter aujourd hui</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Flux actif</span>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {[
              ['Facture fournisseur', 'Extraction terminee', 'A valider'],
              ['Ticket carburant', 'TVA detectee', 'Complement'],
              ['Releve bancaire', '18 lignes lues', 'Pret'],
            ].map(([name, detail, status]) => (
              <div key={name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-slate-950">{name}</p>
                      <p className="mt-1 text-sm text-slate-500">{detail}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">{status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
              <Sparkles className="h-4 w-4" />
              Synthese IA
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Champs reconnus</span>
                  <span>92%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[92%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">Point de controle</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">Montant TVA coherent, fournisseur connu, periode a confirmer.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Pret pour validation humaine
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 grid max-w-lg grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
        {['Collecter', 'Analyser', 'Valider'].map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
            {item}
          </span>
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

export default function FeaturesPage() {
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
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-bold text-blue-700 shadow-sm">
                <BadgeCheck className="h-4 w-4" />
                Fonctionnalites pensees cabinet
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Tout le flux comptable, de la piece client au dossier pret a produire.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta rassemble collecte client, OCR IA, pre-saisie, controle humain, suivi des statuts et pilotage cabinet dans une interface claire, rapide et securisee.
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
                  href="/securite"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Voir la securite
                </Link>
              </div>
            </div>

            <FeatureProductView />

            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
              {heroProof.map((item) => (
                <div key={item.value} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-2xl font-black text-slate-950">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Modules essentiels</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Une plateforme complete, sans complexite inutile.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Chaque fonctionnalite doit servir un objectif concret : reduire la friction, securiser les donnees et accelerer le travail du cabinet.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {featurePillars.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase text-blue-700">{feature.eyebrow}</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">{feature.title}</h3>
                        <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-2">
                      {feature.points.map((point) => (
                        <div key={point} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">Parcours operationnel</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Un chemin clair pour chaque piece.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Le produit ne cherche pas a remplacer le jugement comptable. Il retire les taches lentes, repetitives et disperses qui ralentissent la production.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {workflow.map((step, index) => (
                  <div key={step.title} className="rounded-2xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-blue-700">Vision cabinet</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Des outils pour les clients, les collaborateurs et les managers.
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Une bonne solution comptable doit etre simple cote client, puissante cote cabinet, et suffisamment structuree pour accompagner la croissance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((module) => {
                  const Icon = module.icon;

                  return (
                    <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-black text-slate-950">{module.title}</h3>
                      <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
                        {module.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-blue-200">
                <LockKeyhole className="h-4 w-4" />
                Robustesse et confiance
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                La performance produit n a de valeur que si les donnees restent maitrisees.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                CCS Compta est concu autour d une separation stricte par cabinet, d une gestion claire des roles et d une logique de validation avant exploitation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {impactCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article key={card.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <Icon className="h-7 w-7 text-blue-200" />
                    <h3 className="mt-5 text-lg font-black">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto w-full rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm md:w-3/4 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-blue-700">Prochaine etape</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Transformer la collecte comptable en experience simple et professionnelle.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  L objectif est clair : moins d operations manuelles, plus de controle, et une experience client enfin fluide.
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
