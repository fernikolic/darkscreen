"use client";

import Link from "next/link";
import Image from "next/image";
import { type GranularElementTag } from "@/data/apps";
import { toSlug } from "@/data/seo";
import { screenshotUrl } from "@/lib/screenshot-url";

interface ElementTypeCard {
  tag: GranularElementTag;
  count: number;
  thumbnail?: string;
}

interface ElementGridProps {
  elements: ElementTypeCard[];
}

export function ElementGrid({ elements }: ElementGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {elements.map((el) => (
        <Link
          key={el.tag}
          href={`/elements/${toSlug(el.tag)}`}
          className="group block"
        >
          <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
            <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
              {el.thumbnail ? (
                <Image
                  src={screenshotUrl(el.thumbnail)!}
                  alt={el.tag}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[11px] text-text-tertiary">No preview</span>
                </div>
              )}
            </div>
            <div className="border-t border-dark-border p-3">
              <p className="text-[13px] font-medium text-text-primary">
                {el.tag}
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                {el.count} instance{el.count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
