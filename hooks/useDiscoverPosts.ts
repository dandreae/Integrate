import { useEffect, useState } from "react";
import type { DiscoverPost } from "@/types";
import { discoverPostRepository } from "@/services/repositories";

/** Live Discover feed, newest first — mock seed data or live Firestore, per EXPO_PUBLIC_DISCOVER_MODE. */
export function useDiscoverPosts(): DiscoverPost[] {
  const [posts, setPosts] = useState<DiscoverPost[]>([]);

  useEffect(() => discoverPostRepository.subscribe(setPosts), []);

  return posts;
}
