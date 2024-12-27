import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { groq } from '@ai-sdk/groq'
import { mistral } from '@ai-sdk/mistral'
import Backupdata from '@/data/backupInfo.json'
import data from '@/data/joinedOG.json'
import { z } from 'zod'
import * as cheerio from 'cheerio';
const logWithColor = (message: string, color: string) => {
  const ansiColor = Bun.color(color, 'ansi');
  const resetColor = '\x1b[0m';
  console.log(`${ansiColor}${message}${resetColor}`);
};



export const CATEGORIES = [
  "AI", // Tools related to artificial intelligence
  "API", // Tools related to APIs, including mock APIs and API directories
  "Analytics",  // Analytics tools and platforms for data insights
  "Blogs",  // Websites that primarily publish articles or blogs
  "Backgrounds",  // Tools for backgrounds, e.g., BGjar, SVG Backgrounds
  "Colors",  // Tools for colors, e.g., ColorMagic, UI Colors
  "Components",  // UI component libraries and frameworks
  "Design",  // Design-related tools, e.g., Shapefest
  "Icons",  // Tools for icons, e.g., Feather Icons, YesIcon
  "Illustrations",  // Tools for illustrations, e.g., unDraw, SVG Doodles
  "Inspirations",  // Sites for design inspiration, e.g., Designspiration
  "Photos",  // Tools for photos, e.g., Pexels, Unsplash
  "Videos",  // Tools for videos, e.g., Pexels
  "Fonts",  // Tools for fonts, e.g., BeFonts, FontPair
  "Libraries",  // UI frameworks and component libraries
  "Tools",  // Utility tools not fitting into other categories
  "Websites",  // Websites that don't fit into any otCategorySchemaher category
  "Learning Resources", // Resources for learning and education
  "Games",  // Tools related to game development
  "Security",  // Tools for security research, etc.
  "Accessibility",  // Tools for web accessibility
  "Animation",  // Animation tools and libraries
  "Authentication",  // Authentication tools and platforms
  "CMS",  // Content management systems
  "Challenges",  // Web design and development challenges
  "Charts",  // Tools for creating charts and data visualizations
  "Course",  // Platforms for free or paid courses
  "Database",  // Tools for database management
  "Documentation",  // Tools for documentation in web development
  "Domain",  // Domain tools
  "Extensions",  // Tools for gnome or browser extensions
  "Forms",  // Tools for creating forms
  "Frameworks",  // Frameworks for various programming technologies
  "Hosting",  // Tools for hosting, e.g., Vercel
  "Newsletter",  // Newsletter tools and platforms
  "Performance",  // Tools for performance optimization
  "Productivity",  // Personal productivity tools
  "Reading",  // Tools for reading books
  "Storage",  // Tools for storage, e.g., Turso or cloud storage
  "Testing",  // Tools for testing, e.g., Playwright
  "3D",  // Tools for 3D or 3D-like SVGs, e.g., Spline, Atropos
  "Other",  // For tools that don't fit into any other category
] as const;
const CategorySchema = z.enum(CATEGORIES);
const targetAudience = ['Beginner developers', 'Designers', 'Developers', 'Content Creators', 'Educators', 'All', 'Artists', 'Scientists', "Students", "Security Researchers"] as const;
const TargetAudienceSchema = z.enum(targetAudience);
async function generateData(content: string, url: string) {
  const model = Math.random() > 0.5 ? google('gemini-1.5-pro-latest') : Math.random() > 0.5 ? mistral('mistral-large-latest') : groq('llama-3.2-1b-preview')
  console.log(model.modelId)
  try {
    const response = await generateObject({
      model,
      // model: mistral('mistral-large-latest'),
      // model: groq('llama-3.1-70b-versatile'),
      // model: groq('gemma2-9b-it'),
      // model: groq('llama-3.2-3b-preview'),
      system: `
      You are a tool expert in extract information from a website
      respect the following information
      and its order and format
    `,
      schema: z.object({
        name: z.string().describe('The name of the tool ej: Tailwind CSS,Figma,FigJam'),
        description: z.string().describe('A short description of the tool ej: Tailwind CSS is a utility-first CSS framework for rapidly building custom designs.'),
        category: CategorySchema.describe(`
        The category of the tool. It can be a single category or an array of categories.
        this is the orden of the categories
        AI => Resources related to artificial intelligence that use AI ej: ChatGPT,Gemini,Claude
        API => Resources related to APIs REST,GraphQL,gRPC,
        Analytics => Analytics Resources and platforms for data insights: Google Analytics,Vercel Analytics
        Blogs => Websites that primarily publish articles or blogs ej: Medium,Dev.to web.dev
        Backgrounds => Resources for backgrounds, e.g., BGjar, SVG Backgrounds
        Colors => Resources for colors, e.g., ColorMagic, UI Colors
        Components => UI component libraries and frameworks => shadcn,flowbite,antd
        Design => Design-related Resources, e.g., Shapefest
        Icons => Resources for icons, just icons e.g., Feather Icons, YesIcon
        Illustrations => Resources for illustrations, e.g., unDraw, SVG Doodles
        Inspirations  => Sites for design inspiration, e.g., Designspiration
        Photos => Resources for photos, e.g., Pexels, Unsplash
        Videos => Resources for videos, e.g., Pexels
        Fonts => Resources for fonts, e.g., BeFonts, FontPair
        Libraries => programing languages libraries ej: pandas ,numpy, jQuery Lodash
        Tools => Utility tools not fitting into other categories  ej: squoosh,Excalidraw, ray.so. this that fit on Colors Category or Design Category don't fit here
        Websites => website that are amazing and don't fit into any other category ej: a random page fun
        Learning Resources => Resources for learning and education ej: Coursera,Udemy,edX,Platzi small cursos
        Games => game development Resources ej: Unity,Unreal Engine,Godot or fit the category of games
        Security => Resources for security research, etc. ej: Burp Suite,OWASP ZAP,Cloudflare
        Accessibility => Resources for web accessibility ej: axe,Lighthouse,
        Animation => Animation Resources and libraries ej: anime.js, framer motion, GSAP
        Authentication => Authentication Resources and platforms ej: Auth0,Firebase
        CMS => Content management systems ej: Sanity,Strapi,Contentful
        Challenges => platforms for challenges ej: Codewars,Leetcode,hackerrank,game for learning css and html
        Charts => Resources for creating charts and data visualizations ej: ApexCharts,Recharts
        Course => Platforms for free or paid courses ej: Udemy,Coursera,edX,Platzi small cursos
        Database => Resources for database management ej: MongoDB,MySQL,PostgreSQL,SQLite or sass like Turso of suparbase
        Documentation => Resources for documentation in web development ej: MDN,Stack Overflow
        Domain => Domain Resources ej: Namecheap,GoDaddy
        Extensions => Resources for gnome or browser extensions ej: uBlock Origin,Adblock Plus
        Forms => Resources for creating forms ej: Formik,React Hook Form, typeform
        Frameworks => Frameworks for various programming technologies ej: Next.js,Nuxt,Gatsby,Svelte,Vue,React
        Hosting => Resources for hosting, e.g., Vercel ej: Vercel,Netlify,Cloudflare Pages
        Newsletter => Newsletter Resources and platforms ej: for induviduals personal newsletters, for companies newsletters
        Performance => Resources for performance optimization ej: Lighthouse,WebPageTest,Google PageSpeed Insights
        Productivity => Personal productivity Resources ej: Todoist,Notion,obsidian
        Reading => Resources for reading books ej: Goodreads,Books,Library of Congress
        Storage => Resources for storage, e.g., Turso or cloud storage
        Testing => Resources for testing, e.g., Playwright,Jest, Vitest
        3D => Resources for 3D or 3D-like SVGs, e.g., Spline, Atropos
        Other => For Resources that don't fit into any other category
        max 2 Categories
        `),
        topic: z.string().describe('The topic of the tool ej: CSS,Javascript,React,Next.js'),
        main_features: z.array(z.object({
          feature: z.string().describe('The main feature of the tool ej: in React Components,Hooks'),
          description: z.string().describe('A short description of the main feature ej: Tailwind CSS is a utility-first CSS framework for rapidly building custom designs.')
        })).describe('un maximo de 3 features').optional(),
        tags: z.array(z.string()).describe('The tags of the tool in short words ej: in Figma is design Ui'),
        targetAudience: z.array(TargetAudienceSchema).describe('The target audience of the tool ej just could be one of these =>: Beginner developers,Designers,Developers,Content Creators,Educators,All'),
        pricing: z.enum(['Free', 'Freemium', 'Paid', "Premium", 'Opensource']).describe('The pricing of the tool ej: Free,Freemium,Paid , Opensource or Premium').optional(),
        // alternatives: z.array(z.string()).describe('The alternatives of the tool ej: on React is Svelte,Vue,Angular')
      }),
      temperature: 0,
      prompt: `
      you are a tool expert in extract information from a website
      you have to extract the following information from the website
      this is the website url ->> ${url}
      ${content} 
    `
    })
    return response
  }
  catch (error) {
    console.log(error)
    return "error"
  }

}
async function fetchWebsiteContent(url: string) {
  const controller = new AbortController();
  const timeout = 10000; // Tiempo de espera en milisegundos (15 segundos)
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Cancela el timeout si la solicitud se completa a tiempo

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    const keywords = $('meta[name="keywords"]').attr('content');
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const body = $('body').text().split(' ').slice(0, 500).join(' ');
    const content = `
      title: ${title}
      description: ${description}
      keywords: ${keywords}
      ogTitle: ${ogTitle}
      body: ${body}
      `
    return content.slice(0, 1500).trim();


  } catch (error) {
    console.error(`Error fetching the website content: ${error}`);
    return "error"
  }
}

const rta = [...Backupdata]
const lins = rta.map(i => i.url)
for (const item of data) {
  if (lins.includes(item.url)) continue
  logWithColor(`---${item.url}---`, 'black')
  console.log('-----Fetching content-----')
  const content = await fetchWebsiteContent(item.url)
  // console.clear()
  if (content === "error") {
    logWithColor(`---Error en ${item.url} content----`, 'red')
    continue
  }
  console.log('-----Generating data-----')

  const info = await generateData(content, item.url)
  if (info === "error") {
    logWithColor(`---Error en ${item.url} info---`, 'red')
    continue
  }

  console.log(`<----${rta.length}---->`)
  console.log(`<----${rta.length} /${data.length}---->`)
  rta.push({ ...item, ...info.object })
  logWithColor(`---Ok ${item.url}---`, 'green')
  await Bun.write('./src/data/backupInfo.json', JSON.stringify(rta, null, 2))
}

await Bun.write('./src/data/ai.json', JSON.stringify(rta, null, 2))