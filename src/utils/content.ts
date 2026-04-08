type EntryWithDate = {
  data: {
    publishDate: Date;
  };
};

export function sortByDateDesc<T extends EntryWithDate>(entries: T[]) {
  return [...entries].sort(
    (left, right) =>
      right.data.publishDate.valueOf() - left.data.publishDate.valueOf(),
  );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
