IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DOC_EMBEDDINGS')
BEGIN
    CREATE TABLE DOC_EMBEDDINGS (
        DOC_ID        INT           NOT NULL PRIMARY KEY,
        embedding     NVARCHAR(MAX) NOT NULL,
        content_hash  CHAR(64)      NOT NULL,
        embedded_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_DOC_EMBEDDINGS_embedded_at ON DOC_EMBEDDINGS (embedded_at);
END
