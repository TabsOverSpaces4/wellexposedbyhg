import { getPhotos } from "@/lib/photos";
import Gallery from "./components/Gallery";

export default async function Home() {
  const photos = await getPhotos();

  return <Gallery photos={photos} />;
}
