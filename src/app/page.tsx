import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/public-header';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  Menu,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr';

export const metadata: Metadata = {
  title: 'Logiciel de collecte et pre-saisie comptable IA pour cabinets',
  description:
    'CCS Compta aide les cabinets comptables a collecter les pieces clients, extraire les donnees par IA, valider les documents et reduire la saisie manuelle.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CCS Compta - Collecte client et pre-saisie comptable par IA',
    description:
      'Un portail client mobile et une console cabinet pour automatiser la collecte, l OCR, la validation et le suivi des pieces comptables.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCS Compta - Portail IA pour cabinets comptables',
    description:
      'Collecte client, OCR facture, pre-saisie comptable et validation cabinet dans une seule plateforme.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const proofPoints = [
  { value: '-50%', label: 'temps de saisie vise sur les pieces courantes' },
  { value: '24/7', label: 'depot client depuis ordinateur ou smartphone' },
  { value: 'RGPD', label: 'approche securite et separation par cabinet' },
];

const coreFeatures = [
  {
    icon: UploadCloud,
    title: 'Collecte client simplifiee',
    description:
      'Vos clients deposent factures, tickets et releves depuis un portail clair, pense pour le mobile.',
  },
  {
    icon: ScanLine,
    title: 'Extraction IA structuree',
    description:
      'Les montants, dates, fournisseurs, TVA et pistes d imputation sont prepares avant controle humain.',
  },
  {
    icon: FileCheck2,
    title: 'Validation cabinet maitrisee',
    description:
      'Vos collaborateurs gardent la main sur la verification, les commentaires et le statut de chaque piece.',
  },
];

const workflow = [
  'Le client depose sa piece en quelques secondes.',
  'CCS Compta extrait les donnees utiles et signale les anomalies.',
  'Le cabinet valide, corrige si besoin et prepare la production.',
  'Le client suit l avancement sans relances inutiles.',
];

const roles = [
  {
    icon: Smartphone,
    title: 'Client',
    description: 'Une experience simple : photographier, envoyer, suivre. Moins d e-mails, moins de friction.',
  },
  {
    icon: Users2,
    title: 'Collaborateur',
    description: 'Une file de traitement claire pour prioriser, controler, commenter et valider rapidement.',
  },
  {
    icon: Building2,
    title: 'Cabinet',
    description: 'Une supervision multi-dossiers pour piloter la collecte, la production et la relation client.',
  },
];

const faqs = [
  {
    question: 'CCS Compta remplace-t-il le collaborateur comptable ?',
    answer:
      'Non. La plateforme automatise la collecte et prepare les donnees, mais le cabinet conserve la validation, le controle et le conseil.',
  },
  {
    question: 'Le portail est-il adapte aux clients peu a l aise avec le numerique ?',
    answer:
      'Oui. Le parcours client est volontairement court : connexion, depot, statut. Le cabinet peut aussi deposer des pieces pour un client.',
  },
  {
    question: 'Quels documents peuvent etre traites ?',
    answer:
      'Factures d achat, tickets, notes de frais, releves bancaires et documents courants de production comptable.',
  },
  {
    question: 'Les donnees sont-elles separees par cabinet ?',
    answer:
      'L architecture cible isole les cabinets, les clients, les roles et les droits afin de limiter strictement les acces.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CCS Compta',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: siteUrl,
  description:
    'Portail SaaS pour cabinets comptables : collecte client, OCR, pre-saisie comptable, validation et suivi des pieces.',
  offers: {
    '@type': 'Offer',
    category: 'SaaS',
    availability: 'https://schema.org/InStock',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Cabinets comptables, experts-comptables, collaborateurs comptables',
  },
};



function ProductMockup() {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -left-8 top-12 hidden h-64 w-36 rotate-[-6deg] rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-2xl sm:block">
        <div className="mb-3 h-1.5 w-12 rounded-full bg-slate-200 mx-auto" />
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-blue-200">
            <span>Depot</span>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="mt-8 flex h-24 items-center justify-center rounded-xl border border-dashed border-blue-300/50 bg-blue-500/10">
            <Smartphone className="h-8 w-8 text-blue-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 rounded-full bg-white/80" />
            <div className="h-2 w-2/3 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Console cabinet</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Pieces a valider</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {[
              ['Facture EDF', 'TVA 20% detectee', '98%'],
              ['Ticket carburant', 'Compte 606100 propose', '92%'],
              ['Releve bancaire', '18 lignes extraites', '89%'],
            ].map(([name, detail, score]) => (
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
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{score}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
              <Sparkles className="h-4 w-4" />
              Analyse IA
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs text-slate-300">
                  <span>Extraction</span>
                  <span>96%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[96%] rounded-full bg-blue-400" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-xs text-slate-300">
                  <span>Controle TVA</span>
                  <span>91%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[91%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Prochaine action</p>
                <p className="mt-2 text-sm font-semibold">Valider 7 pieces avant export</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                <Bot className="h-4 w-4" />
                Portail IA pour cabinets comptables
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Moins de saisie. Moins de relances. Plus de temps pour conseiller.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta centralise la collecte client, extrait les donnees des pieces comptables par IA et donne au cabinet une file de validation claire, fiable et exploitable.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/connexion"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Demander une demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/fonctionnalites"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Voir les fonctionnalites
                </Link>
              </div>
            </div>
            <ProductMockup />
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:col-span-2">
              {proofPoints.map((point) => (
                <div key={point.value} className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm lg:p-6">
                  <p className="text-3xl font-black text-slate-950 lg:text-4xl">{point.value}</p>
                  <p className="mt-2 max-w-sm leading-6">{point.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {coreFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">{feature.title}</h2>
                    <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative flex flex-col justify-between border-b border-slate-200 bg-white p-8 sm:p-10 lg:border-b-0 lg:border-r">
                  <div>
                    <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                      Flux de production
                    </p>
                    <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                      Un parcours simple, du client au cabinet.
                    </h2>
                    <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                      L objectif n est pas de remplacer le controle humain, mais de supprimer les operations fastidieuses qui ralentissent la production.
                    </p>
                  </div>

                  <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-950">Controle conserve</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">L IA prepare, le cabinet arbitre et valide.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-950">Relances reduites</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Le client suit le statut sans multiplier les e-mails.</p>
                    </div>
                  </div>
                </div>

                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="absolute left-10 top-12 hidden h-[calc(100%-6rem)] w-px bg-gradient-to-b from-blue-200 via-slate-200 to-transparent sm:block" />
                  <div className="grid gap-4">
                    {workflow.map((step, index) => (
                      <div key={step} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:ml-10">
                        <span className="absolute -left-16 top-5 hidden h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 sm:flex">
                          {index + 1}
                        </span>
                        <div className="flex gap-4 sm:hidden">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                            {index + 1}
                          </span>
                          <p className="self-center text-base font-bold leading-7 text-slate-900">{step}</p>
                        </div>
                        <p className="hidden text-lg font-bold leading-8 text-slate-900 sm:block">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Pensé pour le terrain</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Chaque acteur voit seulement ce qui lui est utile.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <article key={role.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                    <Icon className="h-8 w-8 text-blue-700" />
                    <h3 className="mt-5 text-2xl font-black text-slate-950">{role.title}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{role.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Securite et confiance</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Une plateforme comptable doit etre sobre, claire et controlable.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                CCS Compta est concu autour des roles, des cabinets, des clients et de la tracabilite des actions. La promesse : automatiser sans perdre le controle.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Roles separes', 'Admin, cabinet, collaborateur, secretaire et client.'],
                ['Traçabilite', 'Historique des depots, traitements, commentaires et validations.'],
                ['Validation humaine', 'L IA prepare, le cabinet decide.'],
                ['Usage mobile', 'Depot client simple depuis smartphone.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-4 font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Questions frequentes</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Les questions que se pose un cabinet avant de changer d outil.</h2>
            </div>
            <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white shadow-sm">
              {faqs.map((faq) => (
                <details key={faq.question} className="group p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-lg font-black text-slate-950">
                    {faq.question}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-blue-700 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 sm:py-20">
          <div className="mx-auto w-full rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 p-8 shadow-sm sm:p-10 md:w-3/4 lg:p-12">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-blue-700 shadow-sm">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Prochaine etape</span>
                </div>
                <h2 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Transformons la collecte comptable en experience simple et professionnelle.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Une demonstration courte suffit pour visualiser le parcours client, la validation cabinet et le gain operationnel.
                </p>
              </div>
              <Link
                href="/connexion"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-700"
              >
                Demander une demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <Link href="/" className="flex items-center gap-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
                <Logo className="h-5 w-5" />
              </span>
              <span className="font-black">CCS Compta</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              SaaS de collecte, analyse et validation des pieces comptables pour cabinets modernes.
            </p>
          </div>
          <div>
            <p className="font-black text-white">Produit</p>
            <nav className="mt-4 grid gap-3 text-sm">
              <Link href="/fonctionnalites" className="hover:text-white">Fonctionnalites</Link>
              <Link href="/tarifs" className="hover:text-white">Tarifs</Link>
              <Link href="/securite" className="hover:text-white">Securite</Link>
            </nav>
          </div>
          <div>
            <p className="font-black text-white">Entreprise</p>
            <nav className="mt-4 grid gap-3 text-sm">
              <Link href="/a-propos" className="hover:text-white">A propos</Link>
              <Link href="/blog" className="hover:text-white">Blog</Link>
              <Link href="/assistance" className="hover:text-white">Contact</Link>
            </nav>
          </div>
          <div>
            <p className="font-black text-white">Legal</p>
            <nav className="mt-4 grid gap-3 text-sm">
              <Link href="/mentions-legales" className="hover:text-white">Mentions legales</Link>
              <Link href="/politique-de-confidentialite" className="hover:text-white">Confidentialite</Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-500">
          © 2026 CCS Compta. Tous droits reserves.
        </div>
      </footer>
    </div>
  );
}
