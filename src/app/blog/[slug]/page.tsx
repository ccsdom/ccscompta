import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PublicHeader } from '@/components/public-header';
import { blogPosts } from '@/lib/data/blog-posts';
import ReactMarkdown from 'react-markdown';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <PublicHeader />
      
      <main className="flex-1">
        <article className="py-12 md:py-24">
          <div className="container mx-auto max-w-4xl px-4">
            
            {/* Back button */}
            <Link 
              href="/blog" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au blog
            </Link>

            {/* Header */}
            <header className="mb-12">
              <Badge className="mb-4">{post.category}</Badge>
              <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-balance mb-6">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {post.author.charAt(0)}
                  </div>
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.date}>{post.date}</time>
                </div>
              </div>
            </header>

            {/* Image */}
            <div className="relative aspect-video rounded-3xl overflow-hidden mb-12 shadow-xl shadow-primary/5 border">
              <Image 
                src={post.image.src}
                alt={post.image.alt}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert prose-headings:font-display prose-headings:font-bold max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            
          </div>
        </article>
      </main>
      
      {/* Footer minimal */}
      <footer className="border-t py-12 bg-background mt-auto">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-bold text-muted-foreground">CCS Compta</span>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CCS Compta. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
