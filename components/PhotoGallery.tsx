import Image from "next/image";
import { getPhotoUrl } from "@/lib/actions";
import type { JobPhoto } from "@/lib/types";

export default async function PhotoGallery({ photos }: { photos: JobPhoto[] }) {
  if (photos.length === 0) return null;

  const withUrls = await Promise.all(
    photos.map(async (p) => ({ photo: p, url: await getPhotoUrl(p.storage_path) }))
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {withUrls.map(({ photo, url }) =>
        url ? (
          <a
            key={photo.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square border border-line block overflow-hidden"
          >
            <Image src={url} alt={photo.caption || "Job photo"} fill className="object-cover" />
          </a>
        ) : null
      )}
    </div>
  );
}
