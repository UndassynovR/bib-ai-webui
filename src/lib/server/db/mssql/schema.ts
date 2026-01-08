import { mssqlTable, int, char, nvarchar } from "drizzle-orm/mssql-core";

export const DOC = mssqlTable("DOC", {
    DOC_ID: int("DOC_ID").notNull(),
    RECTYPE: char("RECTYPE", { length: 1 }).default(""),
    BIBLEVEL: char("BIBLEVEL", { length: 1 }).default(""),
    ITEM: nvarchar("ITEM", { length: "max" }),
});

export const DOC_VIEW = mssqlTable("DOC_VIEW", {
    DOC_ID: int("DOC_ID").notNull(),
    RECTYPE: char("RECTYPE", { length: 1 }),
    BIBLEVEL: char("BIBLEVEL", { length: 1 }),
    
    // Field 000
    record_marker: nvarchar("record_marker", { length: 50 }),
    
    // Field 001
    control_number: nvarchar("control_number", { length: 200 }),
    
    // Field 005
    date_of_correction: nvarchar("date_of_correction", { length: 50 }),
    
    // Field 013
    country_code: nvarchar("country_code", { length: 10 }),
    
    // Field 020
    isbn: nvarchar("isbn", { length: 30 }),
    
    // Field 040
    database_section: nvarchar("database_section", { length: 100 }),
    
    // Field 041
    text_language_code: nvarchar("text_language_code", { length: 10 }),
    
    // Field 080
    udc_index: nvarchar("udc_index", { length: 50 }),
    
    // Field 090
    shelf_index: nvarchar("shelf_index", { length: 50 }),
    
    // Field 097
    operator: nvarchar("operator", { length: 100 }),
    
    // Field 100
    author: nvarchar("author", { length: 100 }),
    
    // Field 245
    title: nvarchar("title", { length: 200 }),
    title_continuation: nvarchar("title_continuation", { length: 200 }),
    physical_media: nvarchar("physical_media", { length: 50 }),
    
    // Field 260
    publication_place: nvarchar("publication_place", { length: 50 }),
    publisher: nvarchar("publisher", { length: 100 }),
    year: int("year"),
    
    // Field 300
    volume: int("volume"),
    
    // Field 440
    batch: nvarchar("batch", { length: 100 }),
    
    // Field 541
    quantity: int("quantity"),
    
    // Field 653
    keywords: nvarchar("keywords", { length: 300 }),
    
    // Field 700
    other_authors: nvarchar("other_authors", { length: 100 }),
    
    // Field 856
    cover_link: nvarchar("cover_link", { length: 500 }),
    
    // Field 901
    document_type: nvarchar("document_type", { length: 20 }),
    
    // Field 952
    literature_type_ksu_vsh: nvarchar("literature_type_ksu_vsh", { length: 100 }),
    faculty: nvarchar("faculty", { length: 100 }),
    department: nvarchar("department", { length: 100 }),
    subject: nvarchar("subject", { length: 150 }),
    specialization: nvarchar("specialization", { length: 150 }),
    
    // Field 990
    record_creation_year: nvarchar("record_creation_year", { length: 10 }),
    record_creation_month: nvarchar("record_creation_month", { length: 10 }),
    record_creation_date: nvarchar("record_creation_date", { length: 15 }),
});
