// src/routes/api/descriptions/[doc_id]/+server.ts
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db/pg';

const pgDb = getDb();
import { getMssqlDb } from '$lib/server/db/mssql';
const mssqlDb = getMssqlDb();
import { bookDescriptions } from '$lib/server/db/pg/schema';
import { DOC_VIEW } from '$lib/server/db/mssql/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { getAppConfig } from '$lib/server/config';

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { PDFParse } from 'pdf-parse';


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
}

const llm = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
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

async function loadPDFSafely(url: string): Promise<string | null> {
  try {
    // Download PDF as buffer first
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    }, 15000);
    
    if (!response.ok) {
      console.log(`      HTTP ${response.status}, skipping`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF from buffer
    const parser = new PDFParse({ data: buffer });
    
    const result = await Promise.race([
      parser.getText(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF parse timeout')), 15000)
      )
    ]);
    
    await parser.destroy();
    
    if (!result || !result.text || result.text.length < 50) {
      console.log(`      PDF too short or empty, skipping`);
      return null;
    }
    
    return result.text.replace(/\s+/g, " ").trim();
    
  } catch (e: any) {
    if (e.message?.includes('timeout') || e.message?.includes('Timeout')) {
      console.log(`      PDF parse timeout, skipping`);
    } else if (e.message?.includes('Bad end offset')) {
      console.log(`      PDF chunking error, skipping`);
    } else {
      console.log(`      PDF parse error: ${e.message?.substring(0, 50) || 'unknown'}, skipping`);
    }
    return null;
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
      const pdfContent = await loadPDFSafely(url);
      if (!pdfContent) {
        return null;
      }
      fullContent = pdfContent;
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
    
  } catch (e: any) {
    if (!e.message?.includes('skipping')) {
      console.log(`      Load error, skipping`);
    }
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

async function book_search_description(rawBook: any): Promise<string | null> {
  const book: Book = {};
  
  if (rawBook.author !== undefined) book.author = rawBook.author;
  if (rawBook.other_authors !== undefined) book.other_authors = rawBook.other_authors;
  if (rawBook.title !== undefined) book.title = rawBook.title;
  if (rawBook.title_continuation !== undefined) book.title_continuation = rawBook.title_continuation;
  if (rawBook.publication_place !== undefined) book.publication_place = rawBook.publication_place;
  if (rawBook.publisher !== undefined) book.publisher = rawBook.publisher;
  if (rawBook.year !== undefined) book.year = rawBook.year;
  if (rawBook.year_digits !== undefined) book.year_digits = rawBook.year_digits;
  if (rawBook.isbn !== undefined) book.isbn = rawBook.isbn;
  if (rawBook.keywords !== undefined) book.keywords = rawBook.keywords;
  
  const hasAuthor = book.author || book.other_authors;
  if (!hasAuthor && !book.title) {
    return null;
  }
  
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
  const queries: string[] = [];
  
  const author = book.author || book.other_authors || "";
  const year = book.year || book.year_digits || "";
  const title = book.title || "";
  
  if (title && year) {
    queries.push(`${title} ${year}`);
  }
  
  if (author && title) {
    queries.push(`${author} ${title}`);
  }
  
  if (book.publisher && title) {
    queries.push(`${book.publisher} ${title}`);
  }
  
  queries.push(title);
  
  if (title && book.keywords) {
    queries.push(`${title} ${book.keywords}`);
  }
  
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
    console.log(`  [${idx + 1}/${prioritized.entries.length}] ${url}`);
    
    try {
      const result = await loadPage(url, book);
      
      if (result && result.score > 3) {
        console.log(`      Релевантность: ${result.score}`);
        results.push(result);
      } else {
        console.log(`      Низкая релевантность (${result?.score || 0})`);
      }
    } catch (e) {
      console.log(`      Ошибка загрузки, пропускаем`);
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
  
  annotation = annotation.replace(/^Аннотация:\s*/i, '');
  annotation = annotation.replace(/^Ответ:\s*/i, '');
  
  if (annotation.includes("ИНФОРМАЦИЯ О КНИГЕ НЕ НАЙДЕНА")) {
    return null;
  }
  
  return annotation;
}

// GET /api/descriptions/[doc_id] - Get book description
export const GET: RequestHandler = async ({ params }) => {
  const doc_id = parseInt(params.doc_id, 10);
  
  if (!doc_id || isNaN(doc_id)) {
    throw error(400, 'Invalid doc_id');
  }
 
  try {
    // Check if description exists in PostgreSQL
    const [existing] = await pgDb
      .select()
      .from(bookDescriptions)
      .where(eq(bookDescriptions.doc_id, doc_id))
      .limit(1);
    
    // If description exists and is not null or generating, return it
    if (existing && existing.description && existing.description !== 'generating') {
      return json({
        doc_id,
        description: existing.description,
        cached: true,
      });
    }
    
    // If previously failed (null) but not stuck generating, don't retry
    if (existing && existing.description === null) {
      return json({
        doc_id,
        description: null,
        cached: true,
        failed: true,
      });
    }
    
    // If already generating or was stuck generating, proceed with generation
    // (this handles both new requests and stuck "generating" states)
    
    // Mark as generating to prevent duplicate work
    await pgDb
      .insert(bookDescriptions)
      .values({
        doc_id,
        description: 'generating',
      })
      .onConflictDoUpdate({
        target: bookDescriptions.doc_id,
        set: { description: 'generating' },
      });
    
    // Description not found, fetch book from MSSQL
    const books = await mssqlDb
      .select({
        DOC_ID: DOC_VIEW.DOC_ID,
        author: DOC_VIEW.author,
        other_authors: DOC_VIEW.other_authors,
        title: DOC_VIEW.title,
        title_continuation: DOC_VIEW.title_continuation,
        publication_place: DOC_VIEW.publication_place,
        publisher: DOC_VIEW.publisher,
        year: DOC_VIEW.year,
        isbn: DOC_VIEW.isbn,
        keywords: DOC_VIEW.keywords,
      })
      .from(DOC_VIEW)
      .where(eq(DOC_VIEW.DOC_ID, doc_id));
    
    if (!books || books.length === 0) {
      // Book not found - mark as null
      await pgDb
        .update(bookDescriptions)
        .set({ description: null })
        .where(eq(bookDescriptions.doc_id, doc_id));
      
      throw error(404, 'Book not found');
    }
    
    const book = books[0];
    
    // Generate description using search function
    console.log(`Generating description for doc_id ${doc_id}...`);
    const description = await book_search_description(book);
    
    if (!description) {
      // Failed to generate - mark as null
      await pgDb
        .update(bookDescriptions)
        .set({ description: null })
        .where(eq(bookDescriptions.doc_id, doc_id));
      
      return json({
        doc_id,
        description: null,
        cached: false,
        failed: true,
      });
    }
    
    // Save generated description to PostgreSQL
    await pgDb
      .update(bookDescriptions)
      .set({ description })
      .where(eq(bookDescriptions.doc_id, doc_id));
    
    return json({
      doc_id,
      description,
      cached: false,
    });
  } catch (err) {
    console.error('Failed to get book description:', err);
    
    // On error, mark as null so we don't retry
    try {
      await pgDb
        .update(bookDescriptions)
        .set({ description: null })
        .where(eq(bookDescriptions.doc_id, doc_id));
    } catch (updateErr) {
      console.error('Failed to update description status on error:', updateErr);
    }
    
    throw error(500, 'Failed to get book description');
  }
};
