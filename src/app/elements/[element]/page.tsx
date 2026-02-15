import { GRANULAR_ELEMENT_TAGS } from "@/data/apps";
import { toSlug } from "@/data/seo";
import { ElementDetailContent } from "./ElementDetailContent";

export function generateStaticParams() {
  return GRANULAR_ELEMENT_TAGS.map((tag) => ({
    element: toSlug(tag),
  }));
}

export default function ElementDetailPage({ params }: { params: { element: string } }) {
  return <ElementDetailContent elementSlug={params.element} />;
}
