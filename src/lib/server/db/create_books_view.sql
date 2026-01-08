/* ============================
   Helper: return only digits
   ============================ */
IF OBJECT_ID('dbo.OnlyDigits', 'FN') IS NOT NULL
    DROP FUNCTION dbo.OnlyDigits;
GO
CREATE FUNCTION dbo.OnlyDigits(@s NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @i INT = 1, @len INT = LEN(@s), @out NVARCHAR(MAX) = N'';
    WHILE @i <= @len
    BEGIN
        DECLARE @ch NCHAR(1) = SUBSTRING(@s, @i, 1);
        IF @ch >= N'0' AND @ch <= N'9'
            SET @out += @ch;
        SET @i += 1;
    END
    RETURN @out;
END
GO

/* ====================================================
   Get single subfield: item -> find tag block -> code
   Returns trimmed NVARCHAR(MAX) or NULL if missing.
   @occurrence: 1-based occurrence index of tag block to use
   ==================================================== */
IF OBJECT_ID('dbo.GetSubfield', 'FN') IS NOT NULL
    DROP FUNCTION dbo.GetSubfield;
GO
CREATE FUNCTION dbo.GetSubfield
(
    @item_in NVARCHAR(MAX),
    @tag CHAR(3),
    @code NCHAR(1),
    @occurrence INT = 1
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    IF @item_in IS NULL OR LTRIM(RTRIM(@tag)) = '' RETURN NULL;

    DECLARE @s NVARCHAR(MAX) = NCHAR(30) + @item_in; -- prefix separator so first tag matches
    DECLARE @pos INT = 1;
    DECLARE @foundBlock NVARCHAR(MAX) = NULL;
    DECLARE @occ INT = 0;

    -- find the N-th block with given tag
    WHILE 1=1
    BEGIN
        SET @pos = CHARINDEX(CHAR(30) + @tag, @s, @pos);
        IF @pos = 0 BREAK;
        SET @occ += 1;
        IF @occ = @occurrence
        BEGIN
            -- block starts after separator + tag (3 chars)
            DECLARE @blockStart INT = @pos + 3 + 1; -- +1 moves to character after tag
            -- capture until next record separator (char 30) or end
            DECLARE @nextSep INT = CHARINDEX(CHAR(30), @s, @blockStart);
            IF @nextSep = 0
                SET @foundBlock = SUBSTRING(@s, @blockStart, LEN(@s) - @blockStart + 1);
            ELSE
                SET @foundBlock = SUBSTRING(@s, @blockStart, @nextSep - @blockStart);
            BREAK;
        END
        SET @pos = @pos + 1; -- continue search
    END

    IF @foundBlock IS NULL RETURN NULL;

    -- find subfield marker CHAR(31) + code
    DECLARE @codePos INT = CHARINDEX(CHAR(31) + @code, @foundBlock);
    IF @codePos = 0 RETURN NULL;

    DECLARE @start INT = @codePos + 2; -- after 0x1F and code
    DECLARE @nextMarker INT = CHARINDEX(CHAR(31), @foundBlock, @start);
    DECLARE @len INT;
    IF @nextMarker = 0
        SET @len = LEN(@foundBlock) - @start + 1;
    ELSE
        SET @len = @nextMarker - @start;

    DECLARE @raw NVARCHAR(MAX) = LTRIM(RTRIM(SUBSTRING(@foundBlock, @start, @len)));
    RETURN NULLIF(@raw, '');
END
GO

/* ====================================================
   Get all occurrences of a subfield within all blocks of tag
   Joins individual values with '; '.
   ==================================================== */
IF OBJECT_ID('dbo.GetSubfieldsConcat', 'FN') IS NOT NULL
    DROP FUNCTION dbo.GetSubfieldsConcat;
GO
CREATE FUNCTION dbo.GetSubfieldsConcat
(
    @item_in NVARCHAR(MAX),
    @tag CHAR(3),
    @code NCHAR(1)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    IF @item_in IS NULL OR LTRIM(RTRIM(@tag)) = '' RETURN NULL;
    DECLARE @s NVARCHAR(MAX) = NCHAR(30) + @item_in;
    DECLARE @pos INT = 1, @out NVARCHAR(MAX) = N'';

    WHILE 1=1
    BEGIN
        SET @pos = CHARINDEX(CHAR(30) + @tag, @s, @pos);
        IF @pos = 0 BREAK;

        DECLARE @blockStart INT = @pos + 3 + 1;
        DECLARE @nextSep INT = CHARINDEX(CHAR(30), @s, @blockStart);
        DECLARE @block NVARCHAR(MAX);
        IF @nextSep = 0
            SET @block = SUBSTRING(@s, @blockStart, LEN(@s) - @blockStart + 1);
        ELSE
            SET @block = SUBSTRING(@s, @blockStart, @nextSep - @blockStart);

        -- find all subfield occurrences inside block
        DECLARE @innerPos INT = 1;
        WHILE 1=1
        BEGIN
            SET @innerPos = CHARINDEX(CHAR(31) + @code, @block, @innerPos);
            IF @innerPos = 0 BREAK;
            DECLARE @start INT = @innerPos + 2;
            DECLARE @nextMarker INT = CHARINDEX(CHAR(31), @block, @start);
            DECLARE @len INT;
            IF @nextMarker = 0
                SET @len = LEN(@block) - @start + 1;
            ELSE
                SET @len = @nextMarker - @start;

            DECLARE @val NVARCHAR(MAX) = LTRIM(RTRIM(SUBSTRING(@block, @start, @len)));
            IF @val IS NOT NULL AND @val <> ''
            BEGIN
                IF @out = '' SET @out = @val ELSE SET @out = @out + '; ' + @val;
            END

            SET @innerPos = @innerPos + 1;
        END

        SET @pos = @pos + 1;
    END

    RETURN NULLIF(@out, '');
END
GO

/* ============================
   Full view using the functions
   Assumes base table DOC(DOC_ID, RECTYPE, BIBLEVEL, ITEM)
   Converts ITEM -> NVARCHAR(MAX) once per row.
   ============================ */
IF OBJECT_ID('dbo.DOC_VIEW', 'V') IS NOT NULL
    DROP VIEW dbo.DOC_VIEW;
GO

CREATE VIEW dbo.DOC_VIEW
AS
SELECT
    D.DOC_ID,
    D.RECTYPE,
    D.BIBLEVEL,
    X.ITEM_STR,

    /* 000 */ dbo.GetSubfield(X.ITEM_STR, '000', '0', 1) AS record_marker,
    /* 001 */ dbo.GetSubfield(X.ITEM_STR, '001', '0', 1) AS control_number,
    /* 013 */ dbo.GetSubfield(X.ITEM_STR, '013', 'b', 1) AS country_code,
    /* 020 */ dbo.GetSubfield(X.ITEM_STR, '020', 'a', 1) AS isbn,
    /* 040 */ dbo.GetSubfield(X.ITEM_STR, '040', 'd', 1) AS database_section,
    /* 041 */ dbo.GetSubfield(X.ITEM_STR, '041', 'a', 1) AS text_language_code,
    /* 080 */ dbo.GetSubfield(X.ITEM_STR, '080', 'a', 1) AS udc_index,
    /* 090 */ dbo.GetSubfield(X.ITEM_STR, '090', 'a', 1) AS shelf_index,
    /* 090.c */ dbo.GetSubfield(X.ITEM_STR, '090', 'c', 1) AS catalogue_index,
    /* 090.f */ dbo.GetSubfield(X.ITEM_STR, '090', 'f', 1) AS storage_sigla,
    /* 090.x */ dbo.GetSubfield(X.ITEM_STR, '090', 'x', 1) AS authors_sign,
    /* 097.b */ dbo.GetSubfield(X.ITEM_STR, '097', 'b', 1) AS operator,
    /* 100.a */ dbo.GetSubfield(X.ITEM_STR, '100', 'a', 1) AS author,
    /* 245.* */
    dbo.GetSubfield(X.ITEM_STR, '245', 'a', 1) AS title,
    dbo.GetSubfield(X.ITEM_STR, '245', 'b', 1) AS title_continuation,
    dbo.GetSubfield(X.ITEM_STR, '245', 'h', 1) AS physical_media,
    dbo.GetSubfield(X.ITEM_STR, '245', 'z', 1) AS type_content_access,
    /* 260.* */
    dbo.GetSubfield(X.ITEM_STR, '260', 'a', 1) AS publication_place,
    dbo.GetSubfield(X.ITEM_STR, '260', 'b', 1) AS publisher,
    NULLIF(dbo.OnlyDigits(dbo.GetSubfield(X.ITEM_STR, '260', 'c', 1)), '') AS year_digits,
    TRY_CONVERT(INT, dbo.OnlyDigits(dbo.GetSubfield(X.ITEM_STR, '260', 'c', 1))) AS year,
    /* 300.* */
    TRY_CONVERT(INT, dbo.OnlyDigits(dbo.GetSubfield(X.ITEM_STR, '300', 'a', 1))) AS volume,
    /* 440 */ dbo.GetSubfield(X.ITEM_STR, '440', 'a', 1) AS batch,
    /* 541.n */ TRY_CONVERT(INT, dbo.OnlyDigits(dbo.GetSubfield(X.ITEM_STR, '541', 'n', 1))) AS quantity,
    /* 653 (may be multiple) */
    dbo.GetSubfieldsConcat(X.ITEM_STR, '653', 'a') AS keywords,
    /* 700.a */ dbo.GetSubfield(X.ITEM_STR, '700', 'a', 1) AS other_authors,
    /* 856.d */ dbo.GetSubfield(X.ITEM_STR, '856', 'd', 1) AS cover_link,
    /* 901.t */ dbo.GetSubfield(X.ITEM_STR, '901', 't', 1) AS document_type,
    /* 952.* */
    dbo.GetSubfield(X.ITEM_STR, '952', 'a', 1) AS literature_type_ksu_vsh,
    dbo.GetSubfield(X.ITEM_STR, '952', 'd', 1) AS faculty,
    dbo.GetSubfield(X.ITEM_STR, '952', 'e', 1) AS department,
    dbo.GetSubfield(X.ITEM_STR, '952', 'i', 1) AS subject,
    dbo.GetSubfield(X.ITEM_STR, '952', 'j', 1) AS specialization,
    /* 990.* */
    dbo.GetSubfield(X.ITEM_STR, '990', 'd', 1) AS record_creation_year,
    dbo.GetSubfield(X.ITEM_STR, '990', 'e', 1) AS record_creation_month,
    dbo.GetSubfield(X.ITEM_STR, '990', 'f', 1) AS record_creation_date,
    dbo.GetSubfield(X.ITEM_STR, '990', 'w', 1) AS received_from

    /* raw item for debug */
    /*X.ITEM_STR AS raw_item*/

FROM dbo.DOC AS D
CROSS APPLY (SELECT CAST(D.ITEM AS NVARCHAR(MAX)) AS ITEM_STR) AS X;
GO
