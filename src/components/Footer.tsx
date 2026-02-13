import Link from "next/link";
import Image from "next/image";
import {
  getAllCategories,
  getAllSections,
  getAllStyles,
  getAllPlatforms,
} from "@/data/apps";

export function Footer() {
  const categories = getAllCategories();
  const sections = getAllSections();
  const styles = getAllStyles();
  const platforms = getAllPlatforms();

  return (
    <footer className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-14">
        {/* Taxonomy grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Categories */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.map(({ category, count }) => (
                <li key={category}>
                  <Link
                    href={`/library?category=${category.toLowerCase()}`}
                    className="group flex items-center justify-between text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <span>{category}</span>
                    <span className="font-mono text-[11px] text-text-tertiary group-hover:text-text-secondary">
                      ({count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Sections
            </h4>
            <ul className="space-y-2">
              {sections.map(({ section, count }) => (
                <li key={section}>
                  <Link
                    href={`/library?section=${section.toLowerCase()}`}
                    className="group flex items-center justify-between text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <span>{section}</span>
                    <span className="font-mono text-[11px] text-text-tertiary group-hover:text-text-secondary">
                      ({count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Styles */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Styles
            </h4>
            <ul className="space-y-2">
              {styles.map(({ style, count }) => (
                <li key={style}>
                  <Link
                    href={`/library?style=${style.toLowerCase()}`}
                    className="group flex items-center justify-between text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <span>{style}</span>
                    <span className="font-mono text-[11px] text-text-tertiary group-hover:text-text-secondary">
                      ({count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platforms + Product + Connect */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Platforms
            </h4>
            <ul className="space-y-2">
              {platforms.map(({ platform, count }) => (
                <li key={platform}>
                  <Link
                    href={`/library?platform=${platform.toLowerCase()}`}
                    className="group flex items-center justify-between text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <span>{platform}</span>
                    <span className="font-mono text-[11px] text-text-tertiary group-hover:text-text-secondary">
                      ({count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Product links */}
            <h4 className="mb-4 mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/library"
                  className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Library
                </Link>
              </li>
            </ul>

            {/* Connect links */}
            <h4 className="mb-4 mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://x.com/darkscreenxyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@darkscreens.xyz"
                  className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-dark-border pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/darkscreen-logo.png"
              alt="Darkscreens"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-heading text-lg font-bold text-text-primary">
              darkscreens
            </span>
            <span className="rounded-full border border-dark-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
              Beta
            </span>
          </div>
          <span className="font-mono text-[11px] text-text-tertiary">
            &copy; {new Date().getFullYear()} Darkscreens. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
