import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  FileClock,
  FileKey2,
  KeyRound,
  LockKeyhole,
  Menu,
  ShieldCheck,
  UserCheck,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr/securite';

export const metadata: Metadata = {
  title: 'Securite CCS Compta | Donnees cabinets, clients et pieces comptables',
  description:
    'Decouvrez l approche securite de CCS Compta : separation par cabinet, roles utilisateurs, controle des acces, stockage securise, RGPD et bonnes pratiques pour les pieces comptables.',
  alternates: {
    canonical: '/securite',
  },
  openGraph: {
    title: 'Securite CCS Compta - Protection des donnees comptables',
    description:
      'Une architecture pensee pour isoler les cabinets, limiter les acces, proteger les pieces comptables et garder une gouvernance claire.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Securite CCS Compta',
    description:
      'Separation par cabinet, roles, controle des acces et pratiques RGPD pour un SaaS comptable plus robuste.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const securityPrinciples = [
  {
    icon: Building2,
    title: 'Separation par cabinet',
    description:
      'Chaque cabinet, ses collaborateurs, ses clients et ses pieces doivent rester dans un perimetre logique distinct.',
    points: ['Dossiers rattaches au cabinet', 'Acces client limite a son espace', 'Supervision cabinet encadree'],
  },
  {
    icon: Users2,
    title: 'Roles et permissions',
    description:
      'Les droits sont structures autour des usages reels : administrateur, manager, collaborateur, secretaire et client.',
    points: ['Droits differencies par profil', 'Acces selon le besoin', 'Actions sensibles reservees'],
  },
  {
    icon: FileKey2,
    title: 'Pieces comptables protegees',
    description:
      'Les documents comptables sont des donnees sensibles. Leur consultation, depot et traitement doivent etre controles.',
    points: ['Depot securise', 'Liens et fichiers limites aux ayants droit', 'Trajectoire de durcissement continue'],
  },
  {
    icon: ClipboardCheck,
    title: 'Controle humain conserve',
    description:
      'L IA prepare, mais le cabinet valide. Cette gouvernance evite l automatisation aveugle sur des donnees sensibles.',
    points: ['Validation avant production', 'Anomalies visibles', 'Responsabilite metier preservee'],
  },
];

const architectureLayers = [
  {
    icon: KeyRound,
    title: 'Authentification',
    description: 'Acces utilisateur identifie, rattachement au bon role et controle des parcours sensibles.',
  },
  {
    icon: Database,
    title: 'Donnees applicatives',
    description: 'Collections et documents organises pour limiter l exposition entre cabinets, clients et equipes.',
  },
  {
    icon: LockKeyhole,
    title: 'Stockage fichiers',
    description: 'Pieces comptables et justificatifs associes a des droits d acces et a leur contexte cabinet/client.',
  },
  {
    icon: FileClock,
    title: 'Tracabilite',
    description: 'Historique des statuts, validations, rejets et demandes de complement pour clarifier les decisions.',
  },
];

const commitments = [
  'Limiter les donnees visibles au strict perimetre utile',
  'Eviter les partages de fichiers hors contexte cabinet/client',
  'Conserver une logique de validation humaine avant production',
  'Durcir progressivement les regles d acces et les tests de non-regression',
  'Concevoir les parcours client avec simplicite pour reduire les erreurs',
  'Documenter les operations sensibles pour mieux diagnostiquer les incidents',
];

const rgpdItems = [
  {
    title: 'Minimisation',
    description: 'Collecter les informations utiles a la production comptable, sans multiplier les champs inutiles.',
  },
  {
    title: 'Acces encadres',
    description: 'Limiter la consultation aux utilisateurs qui doivent agir sur le dossier ou la piece.',
  },
  {
    title: 'Transparence',
    description: 'Rendre les statuts et demandes de complement comprehensibles pour le client comme pour le cabinet.',
  },
  {
    title: 'Suppression et cycle de vie',
    description: 'Prevoir des procedures de gestion des comptes, documents et donnees selon les obligations applicables.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Securite CCS Compta',
  url: siteUrl,
  description:
    'Approche securite de CCS Compta pour les cabinets comptables : separation des donnees, roles, acces, stockage et RGPD.',
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
              className={link.href === '/securite' ? 'text-blue-700' : 'transition hover:text-blue-700'}
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

function SecurityMap() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <ShieldCheck className="h-4 w-4" />
          Modele de confiance
        </div>
        <div className="mt-6 grid gap-3">
          {[
            ['Cabinet', 'Equipe interne, roles et dossiers'],
            ['Client', 'Depot et suivi de ses propres pieces'],
            ['Document', 'Fichier, statut, historique et validation'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-black">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {['Identifier', 'Limiter', 'Tracer'].map((item) => (
          <div key={item} className="rounded-2xl bg-slate-50 p-4 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-sm font-black text-slate-800">{item}</p>
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

export default function SecurityPage() {
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
                Securite par conception
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Proteger les pieces comptables, les clients et les cabinets.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta est construit pour limiter les acces, separer les espaces cabinet/client, garder le controle humain et accompagner une trajectoire de durcissement continue.
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
                  href="/politique-de-confidentialite"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Confidentialite
                </Link>
              </div>
            </div>

            <SecurityMap />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Principes de securite</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Une protection centree sur les usages comptables reels.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                La securite du produit doit rester lisible : qui accede a quoi, pourquoi, et avec quel niveau de controle.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {securityPrinciples.map((principle) => {
                const Icon = principle.icon;

                return (
                  <article key={principle.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{principle.title}</h3>
                        <p className="mt-3 leading-7 text-slate-600">{principle.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-2">
                      {principle.points.map((point) => (
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

        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-blue-200">
                <Eye className="h-4 w-4" />
                Architecture defensive
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Plusieurs couches de controle plutot qu une promesse vague.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                L objectif est de reduire la surface d erreur : authentifier, rattacher, limiter, valider et tracer les operations sensibles.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {architectureLayers.map((layer) => {
                const Icon = layer.icon;

                return (
                  <article key={layer.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <Icon className="h-7 w-7 text-blue-200" />
                    <h3 className="mt-5 text-lg font-black">{layer.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{layer.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-blue-700">Engagements operationnels</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                La securite se joue aussi dans les parcours quotidiens.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Un bon systeme doit rendre les bonnes pratiques naturelles : deposer au bon endroit, consulter le bon dossier, valider avant production et eviter les partages disperses.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {commitments.map((commitment) => (
                <div key={commitment} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{commitment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">RGPD et confidentialite</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Une approche prudente des donnees personnelles et comptables.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                CCS Compta doit aider le cabinet a travailler plus efficacement tout en conservant des pratiques sobres, lisibles et conformes aux obligations applicables.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {rgpdItems.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <UserCheck className="h-7 w-7 text-blue-700" />
                  <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
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
                  Evaluer la securite du parcours avec votre organisation.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Nous pouvons cadrer les roles, les acces, les clients pilotes et les points de vigilance avant de generaliser l usage.
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
