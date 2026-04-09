type AlbumData = {
  title: string;
  description: string;
  coverAlt?: string;
  coverImage?: string;
  gallery?: string[];
};

function getUniqueImages(images: Array<string | undefined>) {
  const seen = new Set<string>();

  return images.filter((image): image is string => {
    if (typeof image !== "string") {
      return false;
    }

    const value = image.trim();

    if (!value || seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

export function getAlbumGallery(data: AlbumData) {
  return getUniqueImages([
    data.coverImage,
    ...(Array.isArray(data.gallery) ? data.gallery : []),
  ]);
}

export function getAlbumCoverImage(data: AlbumData) {
  return data.coverImage || getAlbumGallery(data)[0];
}

export function getAlbumCoverAlt(data: AlbumData) {
  return data.coverAlt?.trim() || data.description || data.title;
}

export function getAlbumImageCount(data: AlbumData) {
  return getAlbumGallery(data).length;
}

export function formatAlbumImageCount(count: number) {
  return `${count} ${count === 1 ? "photo" : "photos"}`;
}
