const { createHash } = require("node:crypto");
const sass = require("sass");
const path = require("path");
const yaml = require("js-yaml");

// くコ:彡 www.nabilk.com 2023-07-16 くコ:彡

// add markdown support
const mdOptions = {
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
};
const markdownIt = require("markdown-it");

// @todo implement cache busting
function getHash(content, length = 8) {
  return createHash("md5").update(content).digest("hex").substr(0, length);
}

module.exports = (eleventyConfig, options = {}) => {
  // add yaml support
  eleventyConfig.addDataExtension("yml", (contents) => {
    let content = yaml.load(contents);
    return content;
  });

  // taken from https://github.com/GrimLink/eleventy-plugin-sass
  // @todo check if this is overkill
  const {
    outputPath = "css",
    outputStyle = "expanded",
    includePaths = ["node_modules", "_sass"],
    sourceMap = false,
    cache = false,
  } = options;
  const outputFileExtension = "css";
  eleventyConfig.addTemplateFormats("scss");
  // Creates the extension for use
  eleventyConfig.addExtension("scss", {
    compileOptions: {
      cache,
      permalink: (_inputContent, inputPath) => (_data) => {
        let parsed = path.parse(inputPath);
        // if (parsed.name.startsWith("_")) return; // Ignore partials
        if (!outputPath) return; // default to inputPath

        return `/${outputPath}/${parsed.name}.${outputFileExtension}`;
      },
    },
    getData: async () => ({ eleventyExcludeFromCollections: true }),
    compile: (inputContent, inputPath) => {
      let parsed = path.parse(inputPath);
      // if (parsed.name.startsWith("_")) return; // Ignore partials

      const loadPaths = [
        parsed.dir || ".",
        eleventyConfig.dir.includes || "_includes",
        ...includePaths,
      ];

      let result = sass.compileString(inputContent, {
        style: outputStyle,
        sourceMap,
        loadPaths,
      });

      return async (_data) => result.css;
    },
  });

  /**
   * Filters
   */

  // custom filter to filter by page front matter tag string
  eleventyConfig.addLiquidFilter("filterByTag", (obj, tags) => {
    const tagsArray = tags.split(",");
    // default tag to exclude
    const skip = "skip";

    const filteredActivities = [];
    for (let i in obj) {
      const year = Object.keys(obj[i])[0];
      const activitiesByTag = obj[i][year].filter(
        (e) =>
          !e.tags.includes(skip) &&
          tagsArray.every((tag) => e.tags.includes(tag))
      );
      if (activitiesByTag.length) {
        filteredActivities.push({ [year]: activitiesByTag });
      }
    }
    return filteredActivities;
  });

  // markdown-it liquid md parser
  const md = new markdownIt(mdOptions);
  eleventyConfig.addLiquidFilter("markdownify", (obj) => {
    return md.render(obj);
  });

  // Copy the "assets" directory to the compiled "_site" folder.
  eleventyConfig.addPassthroughCopy("assets/main.js");
  eleventyConfig.addPassthroughCopy("assets/TimesNRSevenMT-Regular.woff");

  return {
    dir: {
      input: ".",
      output: "_site",
      layouts: "_layouts",
    },
    templateFormats: ["html", "liquid", "md", "njk"],
    markdownTemplateEngine: "njk",
  };
};
