/**
 * Represents a feature or capability of a tool.
 * @typedef {Object} Feature
 * @property {string} feature - The name or title of the feature.
 * @property {string} description - A brief description explaining the feature and its functionality.
 */
export type Feature = {
  feature: string;
  description: string;
};

/**
 * Represents a tool or application with various attributes describing its use, features, and categorization.
 * @typedef {Object} Tool
 * @property {string} name - The name of the tool or application.
 * @property {string} description - A detailed description of what the tool does, its purpose, and its key benefits.
 * @property {string} category - The category under which the tool falls, such as "API Testing Tools", "Developer Tools", etc.
 * @property {string} link - A link to the tool's official website or documentation.
 * @property {string} topic - A brief statement summarizing the main topic or focus of the tool.
 * @property {Feature[]} main_features - An array of features that provide more detailed information on the capabilities of the tool.
 * @property {string[]} tags - An array of tags or keywords associated with the tool. These tags help in categorizing and searching for the tool.
 */
export type Tool = {
  name: string;
  description: string;
  category: string;
  link: string;
  topic: string;
  main_features: Feature[];
  tags: string[];
};
// 345