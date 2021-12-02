module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/i");
  eleventyConfig.addPassthroughCopy("src/c");
  eleventyConfig.addNunjucksFilter("formatDate", function(value, with_dow) {
    let out;

    let month = new Intl.DateTimeFormat('en-US', {month: "short", timeZone: "UTC"}).format(value);
    let date = value.getUTCDate().toString();
    let year = value.getUTCFullYear().toString();

    out = `${month} ${date}, ${year}`;

    if (with_dow) {
      let dow = new Intl.DateTimeFormat('en-US', {weekday: "short", timeZone: "UTC"}).format(value);
      return `${dow} ${out}`;
    }

    return out;
  });
};
