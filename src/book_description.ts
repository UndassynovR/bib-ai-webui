import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { PDFParse } from 'pdf-parse';

const OPENAI_API_KEY = Bun.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");

interface Book {
  author?: string;
  other_authors?: string;
  title?: string;
  title_continuation?: string;
  publication_place?: string;
  publisher?: string;
  year?: number;
  year_digits?: string;
  isbn?: string;
  keywords?: string;
  [key: string]: any;
}

const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  temperature: 0,
  modelName: "gpt-4o-mini",
});

const prompt = PromptTemplate.fromTemplate(`
Проанализируй предоставленный текст, если в нем нет аннотации, то создай ее.

ИНФОРМАЦИЯ О КНИГЕ:
Автор: {author}
Название: {title}
{additionalInfo}

ИЗВЛЕЧЕННЫЙ ТЕКСТ ИЗ ИСТОЧНИКОВ:
{content}

ИНСТРУКЦИИ:
1. Внимательно прочитай весь текст и найди информацию, относящуюся именно к этой книге
2. Обрати особое внимание на:
   - Описания содержания пособия
   - Фразы типа "В пособии рассмотрены...", "Предназначено для...", "Описаны..."
   - Информацию о целевой аудитории
   - Перечисление тем и разделов

3. Если информация о книге НАЙДЕНА, создай аннотацию (4-6 предложений):
   - Первое предложение: тематика и назначение пособия
   - Второе-третье: основное содержание и охваченные темы
   - Четвертое: целевая аудитория
   - Пятое (опционально): особенности и преимущества

4. Если информация НЕ НАЙДЕНА или текст не содержит описания книги, напиши только: "ИНФОРМАЦИЯ О КНИГЕ НЕ НАЙДЕНА"

ВАЖНО: 
- Пиши кратко и информативно
- Используй академический стиль
- НЕ придумывай информацию, если её нет в тексте
- Если в тексте упоминается только название без описания, считай это как "НЕ НАЙДЕНА"
- НЕ включай слово "Аннотация:" в начале ответа, начинай сразу с текста

Ответ:
`);

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function searchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "kk-KZ,kk;q=0.9,ru-RU,ru;q=0.8,en;q=0.7",
      }
    }, 10000);
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const links: string[] = [];
    
    const urlPattern = /uddg=([^"&]+)/g;
    let match;
    
    while ((match = urlPattern.exec(html)) !== null) {
      try {
        let link = decodeURIComponent(match[1]);
        if (!link.startsWith('http')) link = 'https://' + link;
        
        if (!link.includes('duckduckgo.com') && 
            link.length < 300 &&
            !link.includes('facebook.com') &&
            !link.includes('twitter.com') &&
            !link.includes('instagram.com')) {
          links.push(link);
        }
      } catch (e) {
        // Ignore decode errors
      }
    }
    
    return [...new Set(links)].filter(l => {
      try { 
        new URL(l); 
        return true; 
      } catch { 
        return false; 
      }
    });
  } catch (e) {
    return [];
  }
}

async function loadPage(url: string, book: Book): Promise<{ url: string; content: string; score: number } | null> {
  try {
    url = url.trim().replace(/\s+/g, '');
    
    try {
      new URL(url);
    } catch {
      return null;
    }
    
    const isPDF = url.toLowerCase().endsWith('.pdf');
    let fullContent = "";
    
    if (isPDF) {
      try {
        const parser = new PDFParse({ url });
        const result = await Promise.race([
          parser.getText(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
          )
        ]);
        await parser.destroy();
        fullContent = result.text.replace(/\s+/g, " ").trim();
      } catch (e) {
        throw e;
      }
    } else {
      const selector = "main, article, .content, .entry-content, .post-content, .description, .annotation, #content, body";
      
      const loader = new CheerioWebBaseLoader(url, {
        selector: selector,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "kk-KZ,kk;q=0.9,ru-RU,ru;q=0.8,en;q=0.7",
        },
        timeout: 10000,
      });
      
      const docs = await Promise.race([
        loader.load(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
        )
      ]);
      
      fullContent = docs[0].pageContent.replace(/\s+/g, " ").trim();
    }
    
    const { content, contextScore } = extractRelevantContent(fullContent, book, isPDF);
    const score = calculateRelevanceScore(url, content, book, contextScore);
    
    return { url, content, score };
    
  } catch (e) {
    return null;
  }
}

function extractRelevantContent(fullContent: string, book: Book, isPDF: boolean): { content: string; contextScore: number } {
  const lowerContent = fullContent.toLowerCase();
  
  const descriptionKeywords = [
    "оқу құралы", "оқу-әдістемелік", "әдістемелік құрал", 
    "арналған", "қарастырылған", "мақсаты",
    "в пособии рассмотрен", "учебное пособие", "методическое пособие",
    "предназначено для", "описаны", "излагаются", "рассматриваются",
    "аннотация", "содержание", "для студентов"
  ];
  
  const bookTerms: string[] = [];
  
  if (book.author) {
    bookTerms.push(...book.author.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2));
  }
  if (book.other_authors) {
    bookTerms.push(...book.other_authors.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2));
  }
  if (book.title) {
    bookTerms.push(...book.title.toLowerCase().split(/\s+/).filter(p => p.length > 3));
  }
  if (book.publisher) {
    bookTerms.push(...book.publisher.toLowerCase().split(/\s+/).filter(p => p.length > 3));
  }
  if (book.year) {
    bookTerms.push(book.year.toString());
  }
  
  let bestMatch = { start: 0, score: 0, end: 0 };
  const chunkSize = isPDF ? 3000 : 1500;
  const scanWindow = 8000;
  
  for (let i = 0; i < fullContent.length; i += chunkSize) {
    const chunk = lowerContent.substring(i, Math.min(i + scanWindow, fullContent.length));
    let chunkScore = 0;
    
    for (const keyword of descriptionKeywords) {
      if (chunk.includes(keyword)) {
        chunkScore += 5;
      }
    }
    
    for (const term of bookTerms) {
      if (chunk.includes(term)) {
        chunkScore += 2;
      }
    }
    
    if (chunkScore > bestMatch.score) {
      bestMatch = { start: i, score: chunkScore, end: i + scanWindow };
    }
  }
  
  let content: string;
  if (bestMatch.score > 5) {
    const start = Math.max(0, bestMatch.start - 500);
    const end = Math.min(fullContent.length, bestMatch.end + 2000);
    content = fullContent.slice(start, end);
  } else {
    content = fullContent.slice(0, Math.min(20000, fullContent.length));
  }
  
  return { content, contextScore: bestMatch.score };
}

function calculateRelevanceScore(url: string, content: string, book: Book, contextScore: number): number {
  const lowerUrl = url.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  let score = contextScore;
  
  const authorParts: string[] = [];
  if (book.author) {
    authorParts.push(...book.author.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2));
  }
  if (book.other_authors) {
    authorParts.push(...book.other_authors.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2));
  }
  
  const titleParts: string[] = [];
  if (book.title) {
    titleParts.push(...book.title.toLowerCase().split(/\s+/).filter(p => p.length > 3));
  }
  
  const publisherParts: string[] = [];
  if (book.publisher) {
    publisherParts.push(...book.publisher.toLowerCase().split(/\s+/).filter(p => p.length > 3));
  }
  
  for (const part of authorParts) {
    if (lowerUrl.includes(part)) score += 3;
    if (lowerContent.includes(part)) score += 3;
  }
  
  for (const part of titleParts) {
    if (lowerUrl.includes(part)) score += 2;
    if (lowerContent.includes(part)) score += 3;
  }
  
  for (const part of publisherParts) {
    if (lowerUrl.includes(part)) score += 2;
    if (lowerContent.includes(part)) score += 2;
  }
  
  if (book.year && lowerContent.includes(book.year.toString())) {
    score += 3;
  }
  
  const educationalKeywords = [
    "оқу құралы", "әдістемелік", "учебно", "пособи", "методическ"
  ];
  for (const keyword of educationalKeywords) {
    if (lowerContent.includes(keyword)) score += 2;
  }
  
  const hasDescription = /оқу құралы|арналған|в пособии|предназначено|рассмотрен|описан/.test(lowerContent);
  if (hasDescription) score += 5;
  
  return score;
}

function cleanContent(content: string): string {
  return content
    .replace(/\s+/g, " ")
    .replace(/(.{200})\1+/g, "$1")
    .trim();
}

const chain = RunnableSequence.from([
  (input) => ({
    content: cleanContent(input.content),
    author: input.author,
    title: input.title,
    additionalInfo: input.additionalInfo,
  }),
  prompt,
  llm,
]);

export async function book_search_description(rawBook: any): Promise<string | null> {
  // Only extract fields we actually need
  const book: Book = {
    author: rawBook.author,
    other_authors: rawBook.other_authors,
    title: rawBook.title,
    title_continuation: rawBook.title_continuation,
    publication_place: rawBook.publication_place,
    publisher: rawBook.publisher,
    year: rawBook.year,
    year_digits: rawBook.year_digits,
    isbn: rawBook.isbn,
    keywords: rawBook.keywords,
  };
  
  // Validate required fields
  const hasAuthor = book.author || book.other_authors;
  if (!hasAuthor && !book.title) {
    return null;
  }
  
  // If only title is available without author, try to use keywords or other info
  if (!hasAuthor && book.title) {
    console.log("\n" + "=".repeat(70));
    console.log("ВНИМАНИЕ: Книга без автора, поиск только по названию");
    console.log("=".repeat(70) + "\n");
  }
  
  console.log("\n" + "=".repeat(70));
  console.log("ПОИСК ИНФОРМАЦИИ О КНИГЕ");
  console.log("=".repeat(70));
  console.log(`Название: ${book.title || "Не указано"}`);
  if (book.author) console.log(`Автор: ${book.author}`);
  if (book.other_authors) console.log(`Другие авторы: ${book.other_authors}`);
  if (book.year) console.log(`Год: ${book.year}`);
  if (book.publisher) console.log(`Издательство: ${book.publisher}`);
  if (book.isbn) console.log(`ISBN: ${book.isbn}`);
  if (book.keywords) console.log(`Ключевые слова: ${book.keywords}`);
  console.log("=".repeat(70) + "\n");
  
  const allLinks = new Set<string>();
  
  // Generate search queries based on available fields
  const queries: string[] = [];
  
  const author = book.author || book.other_authors || "";
  const year = book.year || book.year_digits || "";
  const title = book.title || "";
  
  // Query 1: Full title + year (no quotes - fuzzy match)
  if (title && year) {
    queries.push(`${title} ${year}`);
  }
  
  // Query 2: Author + title (no quotes)
  if (author && title) {
    queries.push(`${author} ${title}`);
  }
  
  // Query 3: Publisher + title (no quotes)
  if (book.publisher && title) {
    queries.push(`${book.publisher} ${title}`);
  }
  
  // Query 4: Main title only (short version)
  queries.push(title);
  
  // Query 5: Title + Keywords
  if (title && book.keywords) {
    queries.push(`${title} ${book.keywords}`);
  }
  
  // Fallback: at least search with title
  if (queries.length === 0 && title) {
    queries.push(`"${title}"`);
  }
  
  if (queries.length === 0) {
    console.log("Невозможно сформировать поисковые запросы\n");
    return null;
  }
  
  console.log("Поиск через DuckDuckGo\n");
  
  for (const [idx, query] of queries.entries()) {
    console.log(`  [${idx + 1}/${queries.length}] ${query}`);
    const urls = await searchDuckDuckGo(query);
    console.log(`      Найдено: ${urls.length} ссылок`);
    urls.forEach(u => allLinks.add(u));
    await new Promise(r => setTimeout(r, 2500));
  }
  
  console.log(`\nВсего найдено уникальных URL: ${allLinks.size}\n`);
  
  if (allLinks.size === 0) {
    console.log("Ссылки не найдены\n");
    return null;
  }
  
  console.log("=".repeat(70) + "\n");
  
  const prioritized = [...allLinks]
    .sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      if (a.endsWith('.pdf')) scoreA += 3;
      if (b.endsWith('.pdf')) scoreB += 3;
      
      const priorities = ['edu', 'library', 'biblio', 'университет', 'ату', 'қазату'];
      for (const p of priorities) {
        if (a.toLowerCase().includes(p)) scoreA += 2;
        if (b.toLowerCase().includes(p)) scoreB += 2;
      }
      
      return scoreB - scoreA;
    })
    .slice(0, 15);
  
  console.log("Загрузка и анализ страниц\n");
  
  const results: { url: string; content: string; score: number }[] = [];
  
  for (const [idx, url] of prioritized.entries()) {
    console.log(`  [${idx + 1}/${prioritized.length}] ${url}`);
    const result = await loadPage(url, book);
    
    if (result && result.score > 3) {
      console.log(`      Релевантность: ${result.score}`);
      results.push(result);
    } else {
      console.log(`      Низкая релевантность (${result?.score || 0})`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log();
  
  if (results.length === 0) {
    console.log("Релевантная информация не найдена\n");
    return null;
  }
  
  results.sort((a, b) => b.score - a.score);
  const top5 = results.slice(0, 5);
  
  console.log("=".repeat(70));
  console.log("ТОП ИСТОЧНИКОВ:\n");
  top5.forEach((r, i) => {
    const type = r.url.toLowerCase().endsWith('.pdf') ? '[PDF]' : '[HTML]';
    console.log(`${i + 1}. Релевантность: ${r.score} ${type}`);
    console.log(`   ${r.url}`);
    console.log(`   Превью: ${r.content.slice(0, 150).replace(/\s+/g, ' ')}...\n`);
  });
  console.log("=".repeat(70) + "\n");
  
  const combinedContent = top5
    .map(r => r.content.slice(0, 10000))
    .join("\n\n")
    .slice(0, 40000);
  
  console.log(`Объем контента для анализа: ${combinedContent.length} символов`);
  console.log("Генерация аннотации через LLM...\n");
  
  const additionalInfo: string[] = [];
  if (book.year) additionalInfo.push(`Год издания: ${book.year}`);
  if (book.publisher) additionalInfo.push(`Издательство: ${book.publisher}`);
  if (book.publication_place) additionalInfo.push(`Место издания: ${book.publication_place}`);
  if (book.isbn) additionalInfo.push(`ISBN: ${book.isbn}`);
  if (book.keywords) additionalInfo.push(`Ключевые слова: ${book.keywords}`);
  
  const res = await chain.invoke({
    content: combinedContent,
    author: author || "Автор не указан",
    title: title,
    additionalInfo: additionalInfo.length > 0 ? additionalInfo.join("\n") : "",
  });
  
  console.log("=".repeat(70));
  console.log("РЕЗУЛЬТАТ:");
  console.log("=".repeat(70));
  console.log(res.content);
  console.log("=".repeat(70) + "\n");
  
  let annotation = res.content.toString().trim();
  
  // Remove "Аннотация:" prefix if LLM added it anyway
  annotation = annotation.replace(/^Аннотация:\s*/i, '');
  annotation = annotation.replace(/^Ответ:\s*/i, '');
  
  if (annotation.includes("ИНФОРМАЦИЯ О КНИГЕ НЕ НАЙДЕНА")) {
    return null;
  }
  
  return annotation;
}

// Example usage
const testBook1: Book = {
    DOC_ID: 617,
    record_marker: "n  2 22      i 450",
    control_number: "RU/IS/BASE/795116594",
    country_code: "ru",
    isbn: "978-5-699-40932-7",
    database_section: "Каталог традиционных изданий",
    text_language_code: "rus",
    udc_index: "3",
    shelf_index: "334",
    storage_sigla: "аб.1-1",
    authors_sign: "С40",
    operator: "Мусаева К.Б.",
    title: "Ресторанный бизнес: управляем профессионально и эффективно",
    title_continuation: "учебник",
    physical_media: "Текст",
    publication_place: "М.",
    publisher: "ЭКСМО",
    year_digits: "2010",
    year: 2010,
    volume: 352,
    quantity: 1,
    keywords: "основы управление предприятиями гир",
    literature_type_ksu_vsh: "КУР",
    faculty: "Факультет экономики и сервиса",
    department: "Туризм и сервис",
    specialization: "6В11126 - Ресторанное дело и гостиничный бизнес",
    record_creation_year: "2025.",
    record_creation_month: "09.2025.",
    record_creation_date: "08.09.2025.",
};

const description = await book_search_description(testBook1);

if (description) {
  console.log("Успешно создана аннотация");
} else {
  console.log("Аннотацию создать не удалось");
}
