import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  LifeBuoy,
  Mail,
  Menu,
  MessageSquareText,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react';
import { Logo } from '@/components/logo';

const siteUrl = 'https://ccscompta.fr/assistance';

export const metadata: Metadata = {
  title: 'Assistance CCS Compta | Aide, support et accompagnement cabinet',
  description:
    'Contactez CCS Compta et trouvez de l aide pour deployer le portail client, structurer la collecte comptable, inviter les clients et utiliser les workflows IA avec controle humain.',
  alternates: {
    canonical: '/assistance',
  },
  openGraph: {
    title: 'Assistance CCS Compta - Support pour cabinets comptables',
    description:
      'Une assistance orientee adoption : parametrage, comptes clients, depots de pieces, statuts, relances et bonnes pratiques de collecte.',
    url: siteUrl,
    siteName: 'CCS Compta',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assistance CCS Compta',
    description:
      'Aide et support pour deployer CCS Compta dans un cabinet comptable avec rigueur et simplicite.',
  },
};

const navLinks = [
  { href: '/fonctionnalites', label: 'Fonctionnalites' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/securite', label: 'Securite' },
  { href: '/blog', label: 'Ressources' },
];

const supportChannels = [
  {
    icon: Mail,
    title: 'Contact par email',
    description:
      'Pour une question produit, un cadrage cabinet, une demande de demo ou un incident a qualifier avec contexte.',
    action: 'contact@ccscompta.fr',
    href: 'mailto:contact@ccscompta.fr',
  },
  {
    icon: MessageSquareText,
    title: 'Assistance depuis l espace',
    description:
      'Les utilisateurs connectes peuvent contextualiser leurs demandes autour des dossiers, pieces et parcours concernes.',
    action: 'Ouvrir mon espace',
    href: '/connexion',
  },
  {
    icon: Rocket,
    title: 'Accompagnement lancement',
    description:
      'Pour parametrer un cabinet, definir les roles, tester un client pilote et securiser le premier deploiement.',
    action: 'Planifier le cadrage',
    href: '/connexion',
  },
];

const quickHelp = [
  {
    icon: MonitorSmartphone,
    title: 'Depot client',
    description:
      'Aider un client a deposer une piece depuis mobile, ordinateur ou via un collaborateur du cabinet.',
  },
  {
    icon: Users2,
    title: 'Comptes et invitations',
    description:
      'Comprendre la creation des acces cabinet/client, les invitations et les liens d activation.',
  },
  {
    icon: ClipboardList,
    title: 'Statuts et relances',
    description:
      'Identifier les pieces en attente, rejetees, a completer ou pretes pour validation.',
  },
  {
    icon: ShieldCheck,
    title: 'Acces et securite',
    description:
      'Verifier les droits par role, le rattachement cabinet/client et les bonnes pratiques de confidentialite.',
  },
];

const resolutionSteps = [
  {
    number: '1',
    title: 'Qualifier',
    description:
      'Decrire le role concerne, le client ou dossier, la page consultee et le resultat attendu.',
  },
  {
    number: '2',
    title: 'Reproduire',
    description:
      'Identifier si le probleme touche un utilisateur, un cabinet, un document ou un parcours complet.',
  },
  {
    number: '3',
    title: 'Corriger',
    description:
      'Traiter la cause : configuration, acces, statut de piece, email d invitation ou comportement applicatif.',
  },
  {
    number: '4',
    title: 'Capitaliser',
    description:
      'Transformer les demandes recurrentes en ameliorations produit, guides ou controles plus clairs.',
  },
];

const goodRequestItems = [
  'Adresse email de l utilisateur concerne',
  'Role utilise : admin, manager, collaborateur, secretaire ou client',
  'Page ou action concernee',
  'Message d erreur exact ou capture si disponible',
  'Client, cabinet ou document concerne si necessaire',
  'Impact : bloquant, genant ou question d usage',
];

const faqs = [
  {
    question: 'Comment demander une aide efficace ?',
    answer:
      'Indiquez le role utilise, la page concernee, l action effectuee, le resultat attendu et le message d erreur eventuel. Plus le contexte est precis, plus la resolution est rapide.',
  },
  {
    question: 'Un client ne recoit pas son email d activation, que verifier ?',
    answer:
      'Verifiez l adresse email, les courriers indesirables, le domaine expediteur et l etat du compte cote cabinet. Si besoin, transmettez le cabinet, le client et l heure de l envoi.',
  },
  {
    question: 'Le cabinet peut-il aider un client peu a l aise avec le numerique ?',
    answer:
      'Oui, le produit vise aussi les cas ou le cabinet depose ou complete des documents pour un client, tout en gardant le rattachement et le suivi dans le bon dossier.',
  },
  {
    question: 'L assistance remplace-t-elle la validation comptable ?',
    answer:
      'Non. CCS Compta aide a fluidifier les parcours et a diagnostiquer les blocages, mais le cabinet conserve le controle metier sur la validation et la production.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Assistance CCS Compta',
  url: siteUrl,
  description:
    'Page d assistance CCS Compta pour les cabinets comptables, leurs collaborateurs et leurs clients.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'CCS Compta',
    url: 'https://ccscompta.fr',
  },
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
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

function SupportSnapshot() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
      <div className="rounded-2xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <LifeBuoy className="h-4 w-4" />
          Support oriente production
        </div>
        <p className="mt-4 text-3xl font-black leading-tight">
          Aider vite, sans perdre le contexte metier.
        </p>
        <p className="mt-4 leading-7 text-slate-300">
          Une demande bien qualifiee doit permettre de comprendre qui agit, sur quel dossier, avec quel impact et quelle action attendue.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Acces', 'roles et invitations'],
          ['Pieces', 'depot, statut, rejet'],
          ['Pilotage', 'cabinet et clients'],
        ].map(([title, label]) => (
          <div key={title} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-lg font-black text-blue-700">{title}</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{label}</p>
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

export default function AssistancePage() {
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
                Assistance cabinet et clients
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl">
                Une aide claire pour garder la production comptable fluide.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CCS Compta doit simplifier le quotidien, pas ajouter un canal de support confus. L assistance aide les cabinets a deployer, diagnostiquer et accompagner les clients avec methode.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="mailto:contact@ccscompta.fr"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  Contacter l assistance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/connexion"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  Acceder a mon espace
                </Link>
              </div>
            </div>

            <SupportSnapshot />
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-blue-700">Canaux d assistance</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Choisir le bon canal selon le besoin.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Une demande de demo, un incident, un doute sur un acces ou un lancement cabinet ne se traitent pas avec le meme niveau de contexte.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {supportChannels.map((channel) => {
                const Icon = channel.icon;

                return (
                  <article key={channel.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-6 text-xl font-black text-slate-950">{channel.title}</h3>
                    <p className="mt-3 grow leading-7 text-slate-600">{channel.description}</p>
                    <Link
                      href={channel.href}
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                    >
                      {channel.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
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
                <Sparkles className="h-4 w-4" />
                Aide utile
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Les sujets qui doivent etre resolus sans friction.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Le support doit renforcer l adoption : clients mieux accompagnes, collaborateurs moins bloques, managers plus autonomes.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {quickHelp.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <Icon className="h-7 w-7 text-blue-200" />
                    <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase text-blue-700">Methode de resolution</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Qualifier avant de corriger, pour eviter les allers-retours.
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Dans un SaaS comptable, un incident n est jamais seulement technique : il peut toucher les acces, le cabinet, le client, le document ou le statut metier.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {resolutionSteps.map((step) => (
                  <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-3xl font-black text-blue-700">{step.number}</p>
                    <h3 className="mt-4 text-lg font-black text-slate-950">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <BookOpenCheck className="h-4 w-4" />
                Demande efficace
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Les informations qui accelerent vraiment le diagnostic.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Ces elements evitent de perdre du temps et permettent de traiter plus vite les sujets sensibles : invitation, droits, depot, piece rejetee ou parcours client bloque.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {goodRequestItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-black uppercase text-blue-700">Questions frequentes</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Les premiers reflexes avant d ouvrir un ticket.
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
                  Structurer un deploiement cabinet sans improvisation.
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Nous pouvons cadrer les roles, les clients pilotes, les emails d activation, les pieces attendues et le niveau d accompagnement necessaire.
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
