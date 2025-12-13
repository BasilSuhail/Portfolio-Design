import { Clock } from "lucide-react";

export interface BlogPost {
  id: string;
  date: string;
  title: string;
  readTime: number;
  url?: string;
}

interface WritingSectionProps {
  posts: BlogPost[];
  intro?: string;
}

export default function WritingSection({ posts, intro }: WritingSectionProps) {
  return (
    <section className="py-16" data-testid="section-writing">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            WRITING
          </span>
          {intro && (
            <p className="text-foreground/80">
              {intro}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url || "#"}
              className="grid grid-cols-[100px_1fr_auto] gap-4 items-center py-3 px-3 -mx-3 rounded-lg hover-elevate active-elevate-2 transition-colors cursor-pointer"
              data-testid={`link-post-${post.id}`}
            >
              <span className="text-sm text-muted-foreground font-mono">
                {post.date}
              </span>
              <span className="font-medium truncate">{post.title}</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} m</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
