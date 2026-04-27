import editablePageCopy from "./pages.json";
import editableProfile from "./profile.json";

type SiteProfile = {
  name: string;
  defaultTitle: string;
  description: string;
  defaultSocialImage?: string;
  summary: string;
  location: string;
  roles: string[];
  tools: string[];
  keywords: string[];
  social: {
    instagram: string;
    linkedin: string;
    github: string;
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
    titleStyle?: "italic";
    venue: string;
    location: string;
    notes?: string;
  }>;
};

type NavigationItem = {
  href: string;
  label: string;
};

type PageCopy = {
  navigation: NavigationItem[];
  header: {
    navigationAriaLabel: string;
    themeToggle: {
      darkLabel: string;
      lightLabel: string;
      switchToDarkAriaLabel: string;
      switchToLightAriaLabel: string;
    };
  };
  footer: {
    socialAriaLabel: string;
    instagramAriaLabel: string;
    linkedinAriaLabel: string;
    githubAriaLabel: string;
  };
  shared: {
    tagsAriaLabel: string;
  };
  home: {
    seoDescription: string;
    heroTitle: string;
    photosTitle: string;
    photosCtaLabel: string;
    writingTitle: string;
    writingCtaLabel: string;
    contactTitle: string;
    contactCtaLabel: string;
  };
  writing: {
    seoTitle: string;
    seoDescription: string;
    indexEyebrow: string;
    indexTitle: string;
    articleEyebrow: string;
    emptyState: string;
    filters: {
      searchPlaceholder: string;
      searchAriaLabel: string;
      sortNewestAriaLabel: string;
      sortOldestAriaLabel: string;
      noResultsMessage: string;
    };
  };
  photography: {
    seoTitle: string;
    seoDescription: string;
    indexEyebrow: string;
    indexTitle: string;
    articleEyebrow: string;
    emptyState: string;
    filters: {
      searchPlaceholder: string;
      searchAriaLabel: string;
      sortNewestAriaLabel: string;
      sortOldestAriaLabel: string;
      noResultsMessage: string;
    };
  };
  about: {
    seoTitle: string;
    seoDescription: string;
    heroEyebrow: string;
    summaryTitle: string;
    summaryEmptyState: string;
    projectsTitle: string;
    projectsEmptyState: string;
    cvTitle: string;
    cvEmptyState: string;
  };
  contact: {
    seoTitle: string;
    seoDescription: string;
    eyebrow: string;
    honeypotLabel: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitLabel: string;
    sendingMessage: string;
    successMessage: string;
    errorMessage: string;
  };
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const profile = editableProfile as Partial<SiteProfile>;
const pageCopy = editablePageCopy as PageCopy;

const navigation = pageCopy.navigation.filter(
  (item): item is NavigationItem => hasText(item?.href) && hasText(item?.label),
);

const normalizedProfile: SiteProfile = {
  name: profile.name || "R. Martinez",
  defaultTitle: profile.defaultTitle || "R. Martinez",
  description:
    profile.description || "R. Martinez shares recent photographs and writing.",
  defaultSocialImage: hasText(profile.defaultSocialImage)
    ? profile.defaultSocialImage
    : undefined,
  summary: profile.summary || "",
  location: profile.location || "",
  roles: Array.isArray(profile.roles) ? profile.roles.filter(hasText) : [],
  tools: Array.isArray(profile.tools) ? profile.tools.filter(hasText) : [],
  keywords: Array.isArray(profile.keywords)
    ? profile.keywords.filter(hasText)
    : [],
  social: {
    instagram: profile.social?.instagram || "",
    linkedin: profile.social?.linkedin || "",
    github: profile.social?.github || "",
  },
  projects: Array.isArray(profile.projects)
    ? profile.projects
        .filter(
          (project): project is SiteProfile["projects"][number] =>
            Boolean(project) &&
            hasText(project.title) &&
            hasText(project.description) &&
            hasText(project.href),
        )
        .map((project) => ({
          ...project,
          status: hasText(project.status) ? project.status : undefined,
        }))
    : [],
  artCv: Array.isArray(profile.artCv)
    ? profile.artCv
        .filter(
          (item): item is SiteProfile["artCv"][number] =>
            Boolean(item) &&
            [item.year, item.title, item.venue, item.location, item.notes].some(
              hasText,
            ),
        )
        .map((item) => ({
          year: item.year || "",
          title: item.title || "",
          titleStyle: item.titleStyle === "italic" ? "italic" : undefined,
          venue: item.venue || "",
          location: item.location || "",
          notes: hasText(item.notes) ? item.notes : undefined,
        }))
    : [],
};

export const siteConfig = {
  ...normalizedProfile,
  navigation,
};

export { pageCopy };
