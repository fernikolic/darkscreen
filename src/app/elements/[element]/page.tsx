"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAllElements, type EnrichedScreen, getScreenPath } from "@/data/helpers";
import { fromSlug, toSlug } from "@/data/seo";
import { GRANULAR_ELEMENT_TAGS } from "@/data/apps";
import { ScreenModal } from "@/components/ScreenModal";
import { screenshotUrl } from "@/lib/screenshot-url";

export default function ElementDetailPage() {
  const params = useParams();
  const elementSlug = params.element as string;
  const [modalScreen, setModalScreen] = useState<EnrichedScreen | null>(null);

  const elements = useMemo(() => getAllElements(), []);

  const tagNames = GRANULAR_ELEMENT_TAGS.map((t) => t as string);
  const tagName = fromSlug(elementSlug, tagNames);

  const elementInfo = useMemo(() => {
    if (!tagName) return null;
    return elements.find((e) => e.tag === tagName) || null;
  }, [elements, tagName]);

  if (!tagName || !elementInfo) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Element not found
        </h1>
        <Link href="/elements" className="mt-4 inline-block text-[14px] text-text-secondary hover:text-white">
          Back to elements
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 font-mono text-[11px] text-text-tertiary">
        <Link href="/elements" className="hover:text-text-secondary">
          Elements
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{tagName}</span>
      </div>

      <div className="mb-12">
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {tagName}
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          {elementInfo.count} instance{elementInfo.count !== 1 ? "s" : ""} across{" "}
          {elementInfo.appCount} app{elementInfo.appCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Screen grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {elementInfo.screens.map((screen) => (
          <Link
            key={`${screen.appSlug}-${screen.flow}-${screen.step}`}
            href={getScreenPath(screen)}
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                setModalScreen(screen);
              }
            }}
            className="group block"
          >
            <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
              <div className="relative aspect-[9/16] overflow-hidden bg-dark-bg">
                {screen.image && (
                  <Image
                    src={screenshotUrl(screen.image)!}
                    alt={`${screen.appName} - ${screen.label}`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                )}
              </div>
              <div className="border-t border-dark-border p-3">
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                  {screen.appName}
                </span>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-text-tertiary">
                  {screen.label}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal */}
      {modalScreen && (
        <ScreenModal
          screen={modalScreen}
          flowScreens={[modalScreen]}
          onClose={() => setModalScreen(null)}
          onNavigate={setModalScreen}
        />
      )}
    </div>
  );
}
