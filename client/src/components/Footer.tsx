interface FooterProps {
  name?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function Footer({ name = "Portfolio" }: FooterProps) {
  return (
    <footer className="mt-16 pb-6">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-neutral-400">
                © {new Date().getFullYear()} {name}. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
