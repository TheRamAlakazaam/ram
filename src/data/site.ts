import editableProfile from "./profile.json";

type SiteProfile = {
  name: string;
  defaultTitle: string;
  description: string;
  location: string;
  roles: string[];
  tools: string[];
  keywords: string[];
  social: {
    instagram: string;
    linkedin: string;
  };
  projects: Array<{
    title: string;
    description: string;
    href: string;
    status?: string;
  }>;
  artCv: Array<{
    year: string;
    title: string;
    venue: string;
    location: string;
    notes?: string;
  }>;
};

const profile = editableProfile as SiteProfile;

const navigation = [
  { href: "/", label: "Home" },
  { href: "/photography", label: "Photography" },
  { href: "/blog", label: "Writing" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
] as const;

export const siteConfig = {
  ...profile,
  navigation,
};

export const sectionDescriptions = {
  photography:
    "Photo work, visual notes, and quiet studies of light, texture, and motion.",
  blog: "Blog posts, dev notes, lists, and whatever else I want to write about that week.",
};
