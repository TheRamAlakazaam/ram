const quoteFilenames = (filenames) =>
  filenames.map((filename) => JSON.stringify(filename)).join(" ");

export default {
  "**/*.{ts,tsx,astro}": () => "npm run type-check",

  "**/*.astro": (filenames) => [
    `eslint --fix ${quoteFilenames(filenames)}`,
    `prettier --write --ignore-unknown ${quoteFilenames(filenames)}`,
  ],

  "**/*.{ts,tsx,js,jsx}": (filenames) => [
    `eslint --fix ${quoteFilenames(filenames)}`,
    `prettier --write --ignore-unknown ${quoteFilenames(filenames)}`,
  ],

  "**/*.{md,json,yaml,yml,css,scss,sass}": (filenames) => [
    `prettier --write --ignore-unknown ${quoteFilenames(filenames)}`,
  ],
};
