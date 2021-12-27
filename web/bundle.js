class Token {
    type;
    lexeme;
    literal;
    line;
    constructor(type, lexeme, literal, line){
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }
}
class TabToken extends Token {
    line;
    count;
    constructor(line, count){
        super(TokenType.TAB, '\t', null, line);
        this.line = line;
        this.count = count;
    }
    increment() {
        this.lexeme += '\t';
        this.count += 1;
    }
}
var TokenType;
(function(TokenType) {
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACE"] = 2] = "LEFT_BRACE";
    TokenType[TokenType["RIGHT_BRACE"] = 3] = "RIGHT_BRACE";
    TokenType[TokenType["COMMA"] = 4] = "COMMA";
    TokenType[TokenType["DOT"] = 5] = "DOT";
    TokenType[TokenType["MINUS"] = 6] = "MINUS";
    TokenType[TokenType["PLUS"] = 7] = "PLUS";
    TokenType[TokenType["SEMICOLON"] = 8] = "SEMICOLON";
    TokenType[TokenType["SLASH"] = 9] = "SLASH";
    TokenType[TokenType["STAR"] = 10] = "STAR";
    TokenType[TokenType["BANG"] = 11] = "BANG";
    TokenType[TokenType["BANG_EQUAL"] = 12] = "BANG_EQUAL";
    TokenType[TokenType["GREATER"] = 13] = "GREATER";
    TokenType[TokenType["GREATER_EQUAL"] = 14] = "GREATER_EQUAL";
    TokenType[TokenType["LESS"] = 15] = "LESS";
    TokenType[TokenType["LESS_EQUAL"] = 16] = "LESS_EQUAL";
    TokenType[TokenType["IDENTIFIER"] = 17] = "IDENTIFIER";
    TokenType[TokenType["STRING"] = 18] = "STRING";
    TokenType[TokenType["NUMBER"] = 19] = "NUMBER";
    TokenType[TokenType["AND"] = 20] = "AND";
    TokenType[TokenType["ELSE"] = 21] = "ELSE";
    TokenType[TokenType["TRUE"] = 22] = "TRUE";
    TokenType[TokenType["FALSE"] = 23] = "FALSE";
    TokenType[TokenType["IF"] = 24] = "IF";
    TokenType[TokenType["NULL"] = 25] = "NULL";
    TokenType[TokenType["OR"] = 26] = "OR";
    TokenType[TokenType["EOF"] = 27] = "EOF";
    TokenType[TokenType["EQUAL"] = 28] = "EQUAL";
    TokenType[TokenType["EQUAL_EQUAL"] = 29] = "EQUAL_EQUAL";
    TokenType[TokenType["TAB"] = 30] = "TAB";
    TokenType[TokenType["BREAK"] = 31] = "BREAK";
    TokenType[TokenType["COLON"] = 32] = "COLON";
    TokenType[TokenType["BAR"] = 33] = "BAR";
    TokenType[TokenType["BAR_BAR"] = 34] = "BAR_BAR";
    TokenType[TokenType["NOT_EQUAL"] = 35] = "NOT_EQUAL";
    TokenType[TokenType["IN"] = 36] = "IN";
    TokenType[TokenType["NOT_IN"] = 37] = "NOT_IN";
    TokenType[TokenType["MOD"] = 38] = "MOD";
    TokenType[TokenType["LEFT_BRACKET"] = 39] = "LEFT_BRACKET";
    TokenType[TokenType["RIGHT_BRACKET"] = 40] = "RIGHT_BRACKET";
    TokenType[TokenType["QM"] = 41] = "QM";
    TokenType[TokenType["OID"] = 42] = "OID";
    TokenType[TokenType["DATE"] = 43] = "DATE";
    TokenType[TokenType["AT_AT"] = 44] = "AT_AT";
    TokenType[TokenType["JAVASCRIPT"] = 45] = "JAVASCRIPT";
})(TokenType || (TokenType = {
}));
const simpleQueryOperators = [
    TokenType.EQUAL,
    TokenType.GREATER_EQUAL,
    TokenType.GREATER,
    TokenType.LESS,
    TokenType.LESS_EQUAL,
    TokenType.NOT_EQUAL,
    TokenType.IN,
    TokenType.NOT_IN
];
class Lexer {
    source;
    tokens = [];
    current = 0;
    start = 0;
    line = 1;
    constructor(source){
        this.source = source;
    }
    lex() {
        while(!this.isAtEnd){
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
        return this.tokens;
    }
    get isAtEnd() {
        return this.current >= this.source.length;
    }
    scanToken() {
        const __char = this.advance();
        if (__char === '\n') this.line++;
        switch(__char){
            case '"':
                return this.string();
            case "'":
                return this.javascript();
            case '#':
                return this.objectId();
            case ' ':
                if (this.lastToken.type !== TokenType.BREAK) break;
                return this.tabsFromSpaces();
            case '\t':
                if (this.lastToken instanceof TabToken) return this.lastToken.increment();
                else return this.addTabToken();
            default:
                if (Lexer.startsComplexSymbol(__char)) {
                    const { next  } = this;
                    const complex = __char + next;
                    if (complex === '@@') {
                        this.advance();
                        this.date();
                    } else if (Lexer.isComplexSymbol(complex)) {
                        this.addToken(Lexer.complexSymbols[complex]);
                        this.advance();
                    } else {
                        this.addToken(Lexer.simpleSymbols[__char]);
                    }
                } else if (Lexer.isSimpleSymbol(__char)) this.addToken(Lexer.simpleSymbols[__char]);
                else if (Lexer.isDigit(__char)) this.number();
                else if (Lexer.isAlpha(__char)) this.identifier();
                else throw new Error(`Unexpected character: ${__char}`);
        }
    }
    advance() {
        return this.source[this.current++];
    }
    addToken(type, literal = null) {
        const text = this.source.slice(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }
    addTabToken() {
        this.tokens.push(new TabToken(this.line, 1));
    }
    tabsFromSpaces() {
        if (this.next === ' ') {
            this.addTabToken();
            this.advance();
        }
        while(this.next === ' ' && this.afterNext === ' '){
            this.lastToken.increment();
            this.advance();
            this.advance();
        }
    }
    static simpleSymbols = {
        '(': TokenType.LEFT_PAREN,
        ')': TokenType.RIGHT_PAREN,
        '{': TokenType.LEFT_BRACE,
        '}': TokenType.RIGHT_BRACE,
        ',': TokenType.COMMA,
        '.': TokenType.DOT,
        '-': TokenType.MINUS,
        '+': TokenType.PLUS,
        ';': TokenType.SEMICOLON,
        '*': TokenType.STAR,
        '/': TokenType.SLASH,
        '\n': TokenType.BREAK,
        ':': TokenType.COLON,
        "@": TokenType.IN,
        '!': TokenType.BANG,
        '=': TokenType.EQUAL,
        '<': TokenType.LESS,
        '>': TokenType.GREATER,
        '|': TokenType.BAR,
        '%': TokenType.MOD,
        '[': TokenType.LEFT_BRACKET,
        ']': TokenType.RIGHT_BRACKET,
        '?': TokenType.QM
    };
    static isSimpleSymbol(__char) {
        return __char in this.simpleSymbols;
    }
    static complexSymbols = {
        '!=': TokenType.NOT_EQUAL,
        '!@': TokenType.NOT_IN,
        '<=': TokenType.LESS_EQUAL,
        '>=': TokenType.GREATER_EQUAL,
        '==': TokenType.EQUAL_EQUAL,
        '||': TokenType.BAR_BAR,
        '@@': TokenType.AT_AT
    };
    static startsComplexSymbol(__char) {
        return Object.keys(this.complexSymbols).map((key)=>key[0]
        ).includes(__char);
    }
    static isComplexSymbol(__char) {
        return __char in this.complexSymbols;
    }
    match(expected) {
        if (this.isAtEnd) return false;
        if (this.source[this.current] !== expected) return false;
        this.current++;
        return true;
    }
    get next() {
        if (this.isAtEnd) return '\0';
        return this.source[this.current];
    }
    get afterNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }
    get lastToken() {
        return this.tokens[this.tokens.length - 1];
    }
    string() {
        while(!this.stringShouldTerminate()){
            if (this.next === '\n') this.line++;
            this.advance();
        }
        if (this.isAtEnd) throw new Error('Unterminated string');
        this.advance();
        this.addToken(TokenType.STRING, this.source.slice(this.start + 1, this.current - 1));
    }
    stringShouldTerminate() {
        return this.next === '"' && this.source[this.current - 1] !== '\\' || this.isAtEnd;
    }
    javascript() {
        while(!this.jsShouldTerminate()){
            if (this.next === '\n') this.line++;
            this.advance();
        }
        if (this.isAtEnd) throw new Error('Unterminated interpolated JavaScript');
        this.advance();
        this.addToken(TokenType.JAVASCRIPT, this.source.slice(this.start + 1, this.current - 1));
    }
    jsShouldTerminate() {
        return this.next === "'" && this.source[this.current - 1] !== '\\' || this.isAtEnd;
    }
    static isDigit(__char) {
        return __char >= '0' && __char <= '9';
    }
    static isAlpha(__char) {
        return __char >= 'a' && __char <= 'z' || __char >= 'A' && __char <= 'Z' || __char === '_' || __char === '.' || __char === "$";
    }
    static isAlphaNumeric(__char) {
        return this.isDigit(__char) || this.isAlpha(__char);
    }
    static isHex(__char) {
        return this.isDigit(__char) || __char >= 'a' && __char <= 'f';
    }
    static isDateChar(__char) {
        return this.isDigit(__char) || __char === "T" || __char === "-" || __char === ":";
    }
    number() {
        while(Lexer.isDigit(this.next))this.advance();
        if (this.next === '.' && Lexer.isDigit(this.afterNext)) {
            this.advance();
            while(Lexer.isDigit(this.next))this.advance();
        }
        this.addToken(TokenType.NUMBER, +this.source.slice(this.start, this.current));
    }
    identifier() {
        while(Lexer.isAlphaNumeric(this.next))this.advance();
        switch(this.source.slice(this.start, this.current)){
            case 'true':
                return this.addToken(TokenType.TRUE);
            case 'false':
                return this.addToken(TokenType.FALSE);
            case 'null':
                return this.addToken(TokenType.NULL);
            default:
                this.addToken(TokenType.IDENTIFIER);
        }
    }
    objectId() {
        while(Lexer.isHex(this.next))this.advance();
        const hex = this.source.slice(this.start + 1, this.current);
        if (hex.length !== 12) throw new Error(`ObjectId must have length of 12, found ${hex.length}`);
        this.addToken(TokenType.OID, hex);
    }
    date() {
        while(Lexer.isDateChar(this.next))this.advance();
        const date = this.source.slice(this.start + 2, this.current);
        this.addToken(TokenType.DATE, date);
    }
}
class Expression {
    content;
    constructor(content){
        this.content = content;
    }
    getInterpreted(generator) {
        return generator.interpretExpression(this);
    }
}
class Cast {
    expr;
    type;
    constructor(expr, type){
        this.expr = expr;
        this.type = type;
    }
    getInterpreted(generator) {
        return generator.interpretCast(this);
    }
}
class Equality {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretEqualityExpr(this);
    }
}
class Comparison {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretComparisonExpr(this);
    }
}
class Term {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretTermExpr(this);
    }
}
class Factor {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretFactorExpr(this);
    }
}
class Unary {
    op;
    right;
    constructor(op, right){
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretUnaryExpr(this);
    }
}
class Grouping {
    expression;
    constructor(expression){
        this.expression = expression;
    }
    getInterpreted(generator) {
        return generator.interpretGroupingExpr(this);
    }
}
class Primary {
    value;
    verbatim;
    constructor(value, verbatim){
        this.value = value;
        this.verbatim = verbatim;
    }
    getInterpreted(generator) {
        return generator.interpretPrimaryExpr(this);
    }
}
class Identifier {
    name;
    constructor(name){
        this.name = name;
    }
    getInterpreted(generator) {
        return generator.interpretIdentifierExpr(this);
    }
}
class Invocation {
    func;
    args;
    constructor(func, args){
        this.func = func;
        this.args = args;
    }
    getInterpreted(generator) {
        return generator.interpretInvocation(this);
    }
}
class Access {
    array;
    index;
    constructor(array, index){
        this.array = array;
        this.index = index;
    }
    getInterpreted(generator) {
        return generator.interpretAccess(this);
    }
}
class ObjectLiteral {
    entries;
    constructor(entries){
        this.entries = entries;
    }
    getInterpreted(generator) {
        return generator.interpretObjectLiteral(this);
    }
}
class ArrayLiteral {
    entries;
    constructor(entries){
        this.entries = entries;
    }
    getInterpreted(generator) {
        return generator.interpretArrayLiteral(this);
    }
}
class Ternary {
    left;
    middle;
    right;
    constructor(left, middle, right){
        this.left = left;
        this.middle = middle;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretTernary(this);
    }
}
class TopQO {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretTopQO(this);
    }
}
class DisjunctQO {
    left;
    op;
    right;
    constructor(left, op, right){
        this.left = left;
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretDisjunctQO(this);
    }
}
class ConjunctQO {
    op;
    right;
    constructor(op, right){
        this.op = op;
        this.right = right;
    }
    getInterpreted(generator) {
        return generator.interpretConjunctQO(this);
    }
}
class GroupingQO {
    content;
    constructor(content){
        this.content = content;
    }
    getInterpreted(generator) {
        return generator.interpretGroupingQO(this);
    }
}
const stages = {
    bucket: "bucket",
    count: "count",
    group: "group",
    limit: "limit",
    import: "lookup",
    match: "match",
    project: "project",
    set: "set",
    unset: "unset",
    unwind: "unwind",
    sort: "sort"
};
const operators = {
    AGGREGATE: "aggregate",
    ...stages
};
class File {
    collection;
    body;
    constructor(collection, body){
        this.collection = collection;
        this.body = body;
    }
    getInterpreted(generator, indent) {
        return generator.interpretFile(this, indent);
    }
}
class Body {
    aggregations;
    constructor(aggregations){
        this.aggregations = aggregations;
    }
    getInterpreted(generator, indent) {
        return generator.interpretBody(this, indent);
    }
}
class Stage {
    head;
    body;
    constructor(head, body){
        this.head = head;
        this.body = body;
    }
    getInterpreted(generator, indent) {
        return generator.interpretStage(this, indent);
    }
}
class SetStage {
    id;
    value;
    constructor(id, value){
        this.id = id;
        this.value = value;
    }
    getInterpreted(generator, indent) {
        return generator.interpretSetStage(this, indent);
    }
}
class FieldsStage {
    fields;
    type;
    constructor(fields, type){
        this.fields = fields;
        this.type = type;
    }
    getInterpreted(generator, indent) {
        return generator.interpretFieldsStage(this, indent);
    }
}
class QuerySubStage {
    id;
    body;
    constructor(id, body){
        this.id = id;
        this.body = body;
    }
    getInterpreted(generator, indent) {
        return generator.interpretQuerySubStage(this, indent);
    }
}
class ImportSpec {
    collection;
    localField;
    foreignField;
    alias;
    constructor(collection, localField, foreignField, alias){
        this.collection = collection;
        this.localField = localField;
        this.foreignField = foreignField;
        this.alias = alias;
    }
    getInterpreted(generator, indent) {
        return generator.interpretImportSpec(this, indent);
    }
}
function comap(it, cb) {
    const output = [];
    for (const _ of it){
        const result = cb();
        if (Array.isArray(result)) output.push(...result);
        else output.push(result);
    }
    return output;
}
function* zip(it1, it2) {
    const iterator1 = it1[Symbol.iterator]();
    const iterator2 = it2[Symbol.iterator]();
    while(true){
        const { done: done1 , value: value1  } = iterator1.next();
        const { done: done2 , value: value2  } = iterator2.next();
        if (done1 && done2) break;
        yield [
            value1,
            value2
        ];
    }
}
class Parser {
    tokens;
    indent = 0;
    current = 0;
    constructor(tokens){
        this.tokens = tokens;
    }
    parse() {
        try {
            return this.file();
        } catch (err) {
            console.log(`Syntax error at ${this.next.line}: ${this.next.toString()}`);
            throw err;
        }
    }
    file() {
        if (this.matchContent(operators.AGGREGATE)) {
            const collection = this.expression();
            if (collection instanceof Identifier) {
                const body = this.body();
                return new File(collection.name, body);
            } else throw new Error('`aggregate` must be followed by an identifier.');
        } else {
            console.log(this);
            throw 'not yet implemented';
        }
    }
    *block() {
        this.consume(TokenType.COLON, (str)=>`Expected block, found ${str}`
        );
        this.consume(TokenType.BREAK, (str)=>`Expected line return after colon, found ${str}`
        );
        if (this.matchIndent(+1)) {
            this.indent += 1;
            while(this.matchIndent(0)){
                this.advance();
                console.log(`parsing ${this.next}`);
                yield;
                if (this.previous.type !== TokenType.BREAK) this.consume(TokenType.BREAK, (str)=>`Expected line return after stage, found ${str}`
                );
            }
            console.log('block finished');
            this.indent -= 1;
        } else throw new Error(`Expected ${this.indent + 1} indents after return, found ${this.next instanceof TabToken ? this.next.count : `non-tab: ${this.next.lexeme}`}.`);
    }
    body() {
        const stages = comap(this.block(), ()=>this.stage()
        );
        return new Body(stages);
    }
    stage() {
        if (this.check(TokenType.JAVASCRIPT)) {
            return new Stage('', this.primary());
        }
        const stage = this.consumeContent((str)=>`${str} is not a valid aggregation stage.`
        , ...Object.keys(stages));
        switch(stage.lexeme){
            case 'match':
                if (this.matchContent('if')) return this.matchIf();
                return this.matchStage();
            case 'set':
                return this.setStage();
            case 'limit':
                return this.limitStage();
            case 'project':
                return this.projectStage();
            case 'import':
                if (this.matchContent('one')) return this.importOneStage();
                return this.importStage();
            case 'count':
                return this.countStage();
            case 'group':
                return this.groupStage();
            case 'sort':
                return this.sortStage();
            case 'unwind':
                return this.unwindStage();
            default:
                throw "this shouldn't happen";
        }
    }
    unwindStage() {
        const id = this.identifier();
        return new Stage('unwind', id);
    }
    sortStage() {
        const stages = comap(this.block(), ()=>this.sortSubStage()
        );
        return new Stage('sort', stages);
    }
    sortSubStage() {
        const id = this.identifier();
        let dir;
        if (this.matchContent("asc")) dir = "1";
        else if (this.matchContent("desc")) dir = "-1";
        else if (this.matchContent("text")) dir = '{ $meta: "textScore" }';
        else throw new Error("invalid sort stage");
        return new SetStage(id.name, new Primary(dir, true));
    }
    groupStage() {
        this.consumeContent(()=>`Invalid group stage. Syntax is: 'group by <expression>:'`
        , 'by');
        const _id = this.expression();
        const stages = comap(this.block(), ()=>this.setSubStage()
        );
        return new Stage('group', [
            new SetStage("_id", _id),
            ...stages
        ]);
    }
    countStage() {
        let alias = "count";
        if (this.matchContent("as")) {
            const id = this.identifier();
            alias = id.name;
        } else if (this.matchContent("by")) {
            const expr = this.expression();
            return new Stage('sortByCount', expr);
        }
        return new Stage('count', new Primary(alias));
    }
    importOneStage() {
        const importStage = this.importStage();
        const importSpec = importStage.body;
        const idString = importSpec.alias || importSpec.collection;
        const id = new Identifier(idString);
        const rhsValue = new Access(id, new Primary(0));
        return [
            importStage,
            new Stage('set', [
                new SetStage(idString, rhsValue)
            ])
        ];
    }
    importStage() {
        const first = this.identifier();
        let collection, foreign, local, alias;
        if (this.matchContent('from')) [collection, alias] = [
            this.identifier(),
            first
        ];
        else collection = first;
        if (this.matchContent('by')) foreign = this.identifier();
        if (this.matchContent('using')) local = this.identifier();
        if (!this.check(TokenType.BREAK)) throw new Error("invalid import stage");
        const spec = new ImportSpec(collection.name, local?.name, foreign?.name, alias?.name);
        return new Stage('lookup', spec);
    }
    projectStage() {
        if (this.check(TokenType.COLON)) {
            const substages = comap(this.block(), ()=>this.projectSubStage()
            );
            return new Stage('project', substages);
        } else {
            const substage = this.projectSubStage();
            return new Stage('project', [
                substage
            ]);
        }
    }
    projectSubStage() {
        const id = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
        );
        if (this.match(TokenType.EQUAL)) {
            const value = this.expression();
            return new SetStage(id.lexeme, value);
        } else if (this.check(TokenType.COMMA)) {
            const ids = [
                id
            ];
            while(this.match(TokenType.COMMA)){
                const nextId = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
                );
                ids.push(nextId);
            }
            return new FieldsStage(ids.map((id)=>id.lexeme
            ), 'project');
        }
        throw new Error('Invalid project stage.');
    }
    limitStage() {
        const num = this.literal();
        if (typeof num.value !== 'number') throw new Error('Limit should be a number.');
        return new Stage('limit', num);
    }
    setStage() {
        if (this.check(TokenType.COLON)) {
            const substages = comap(this.block(), ()=>this.setSubStage()
            );
            return new Stage('set', substages);
        } else {
            const substage = this.setSubStage();
            return new Stage('set', [
                substage
            ]);
        }
    }
    setSubStage() {
        const id = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
        );
        this.consume(TokenType.EQUAL, ()=>`Expected equal sign.`
        );
        const value = this.expression();
        return new SetStage(id.lexeme, value);
    }
    matchIf() {
        const expr = this.expression();
        return new Stage("match", new Expression(expr));
    }
    matchStage() {
        if (this.check(TokenType.COLON)) {
            const substages = comap(this.block(), ()=>this.matchSubstage()
            );
            return new Stage('match', substages);
        } else {
            const substage = this.matchSubstage();
            return new Stage('match', [
                substage
            ]);
        }
    }
    matchSubstage() {
        const id = this.consume(TokenType.IDENTIFIER, (str)=>`Expected idnetifier, found ${str}`
        );
        const body = this.expressionQO();
        return new QuerySubStage(id, body);
    }
    expressionQO() {
        let expr = this.disjunctQO();
        while(this.match(TokenType.BAR_BAR)){
            const operator = this.previous;
            const right = this.disjunctQO();
            expr = new TopQO(expr, operator, right);
        }
        return expr;
    }
    disjunctQO() {
        let expr = this.conjunctQO();
        while(this.match(TokenType.COMMA)){
            const operator = this.previous;
            const right = this.conjunctQO();
            expr = new DisjunctQO(expr, operator, right);
        }
        return expr;
    }
    conjunctQO() {
        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expressionQO();
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expected ")", found ${str}`
            );
            return new GroupingQO(expr);
        } else if (this.match(...simpleQueryOperators)) {
            const operator = this.previous;
            const right = [
                TokenType.IN,
                TokenType.NOT_IN
            ].includes(operator.type) ? this.arrayLiteral(false) : this.literal();
            return new ConjunctQO(operator, right);
        } else {
            throw new Error('Expected query statement.');
        }
    }
    expression() {
        const expr = this.castable();
        if (this.match(TokenType.QM)) {
            const middle = this.castable();
            this.consume(TokenType.COLON, (str)=>`Expected :, found ${str}`
            );
            const right = this.castable();
            return new Ternary(expr, middle, right);
        } else return expr;
    }
    castable() {
        const expr = this.equality();
        if (this.matchContent("as")) {
            const { lexeme  } = this.consume(TokenType.IDENTIFIER, (str)=>`Expected type identifier, found ${str}`
            );
            return new Cast(expr, lexeme);
        }
        return expr;
    }
    equality() {
        return this.rightAssociative(this.comparison, Equality, TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL);
    }
    comparison() {
        const tokenTypes = [
            TokenType.GREATER,
            TokenType.GREATER_EQUAL,
            TokenType.LESS,
            TokenType.LESS_EQUAL,
            TokenType.IN,
            TokenType.NOT_IN
        ];
        return this.rightAssociative(this.term, Comparison, ...tokenTypes);
    }
    term() {
        return this.rightAssociative(this.factor, Term, TokenType.MINUS, TokenType.PLUS);
    }
    factor() {
        return this.rightAssociative(this.unary, Factor, TokenType.SLASH, TokenType.STAR, TokenType.MOD);
    }
    unary() {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous;
            const right = this.unary();
            return new Unary(operator, right);
        }
        return this.primary();
    }
    literal() {
        if (this.match(TokenType.FALSE)) return new Primary(false);
        if (this.match(TokenType.TRUE)) return new Primary(true);
        if (this.match(TokenType.NULL)) return new Primary(null);
        if (this.match(TokenType.NUMBER, TokenType.STRING)) return new Primary(this.previous.literal);
        if (this.match(TokenType.OID)) return new Primary(`ObjectId("${this.previous.literal}")`, true);
        if (this.match(TokenType.DATE)) return new Primary(`ISODate("${this.previous.literal}")`, true);
        if (this.match(TokenType.JAVASCRIPT)) return new Primary(this.previous.literal, true);
        throw new Error('Expected literal.');
    }
    primary() {
        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expect ')' after expression, found ${str}`
            );
            return new Grouping(expr);
        } else if (this.match(TokenType.LEFT_BRACE)) {
            this.allowWhitespace();
            const entries = [
                this.keyValuePair()
            ];
            while(this.match(TokenType.COMMA)){
                this.allowWhitespace();
                entries.push(this.keyValuePair());
            }
            this.allowWhitespace();
            this.consume(TokenType.RIGHT_BRACE, (str)=>`Expected closing } for object literal, found ${str}`
            );
            return new ObjectLiteral(entries);
        } else if (this.match(TokenType.LEFT_BRACKET)) {
            return this.arrayLiteral(true);
        } else {
            try {
                return this.literal();
            } catch  {
                return this.identifierOrInvocation();
            }
        }
    }
    arrayLiteral(bracketAlreadyConsumed) {
        if (!bracketAlreadyConsumed) this.consume(TokenType.LEFT_BRACKET, (str)=>`Expected [, found ${str}`
        );
        this.allowWhitespace();
        const entries = [
            this.expression()
        ];
        while(this.match(TokenType.COMMA)){
            this.allowWhitespace();
            entries.push(this.expression());
        }
        this.allowWhitespace();
        this.consume(TokenType.RIGHT_BRACKET, (str)=>`Expected closing ] for array literal, found ${str}`
        );
        return new ArrayLiteral(entries);
    }
    keyValuePair() {
        const key = this.identifier();
        this.consume(TokenType.COLON, (str)=>`Expected colon, found ${str}`
        );
        const expr = this.expression();
        return [
            key.name,
            expr
        ];
    }
    identifierOrInvocation() {
        const token = this.advance();
        if (this.match(TokenType.LEFT_PAREN)) {
            const args = [
                this.expression()
            ];
            while(this.match(TokenType.COMMA))args.push(this.expression());
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expect ')' after expression, found ${str}`
            );
            return new Invocation(token.lexeme, args);
        } else if (this.match(TokenType.LEFT_BRACKET)) {
            const index = this.expression();
            this.consume(TokenType.RIGHT_BRACKET, (str)=>`Expected ']', found ${str}`
            );
            return new Access(new Identifier(token.lexeme), index);
        }
        return new Identifier(token.lexeme);
    }
    identifier() {
        const token = this.advance();
        return new Identifier(token.lexeme);
    }
    rightAssociative(constituent, ExprType, ...tokens) {
        let expr = constituent.call(this);
        while(this.match(...tokens)){
            const operator = this.previous;
            const right = constituent.call(this);
            expr = new ExprType(expr, operator, right);
        }
        return expr;
    }
    match(...types) {
        for (const type of types){
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    matchContent(...contents) {
        for (const content of contents){
            if (this.checkContent(content)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd) return false;
        return this.next.type === type;
    }
    checkContent(content) {
        if (this.isAtEnd) return false;
        return this.next.lexeme === content;
    }
    advance() {
        if (!this.isAtEnd) this.current++;
        return this.previous;
    }
    get isAtEnd() {
        return this.next.type === TokenType.EOF;
    }
    get next() {
        return this.tokens[this.current];
    }
    get previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message) {
        if (this.check(type)) return this.advance();
        console.log(this.next);
        throw new Error(message(this.next.lexeme));
    }
    consumeContent(message, ...contents) {
        if (this.matchContent(...contents)) return this.previous;
        throw new Error(message(this.next.lexeme));
    }
    matchIndent(offset) {
        return this.next instanceof TabToken && this.next.count === this.indent + offset;
    }
    allowWhitespace() {
        if (this.match(TokenType.BREAK)) this.match(TokenType.TAB);
    }
}
const REQUIRED = Symbol();
class BMQLGenerator {
    interpret(tree, indent = 0) {
        return tree.getInterpreted(this, indent);
    }
    interpretFile(file, indent) {
        return `db.getCollection("${file.collection}").aggregate([\n${this.interpret(file.body, indent + 1)}\n])\n`;
    }
    interpretBody(body, indent) {
        return body.aggregations.map((stage)=>`${this.interpret(stage, indent)}`
        ).join(',\n');
    }
    interpretStage(stage, indent) {
        if (stage.head === '' && !Array.isArray(stage.body)) return `${'\t'.repeat(indent)}${this.interpret(stage.body)}`;
        const heads = stage.head.split('.');
        if (Array.isArray(stage.body)) {
            const output = stage.body.map((qss)=>`${this.interpret(qss, indent + 1)},\n`
            );
            output.unshift(`${'\t'.repeat(indent)}${heads.map((head)=>`{ $${head}:`
            ).join(' ')} {\n`);
            output.push('\t'.repeat(indent) + '} '.repeat(heads.length + 1).trim());
            return output.join('');
        } else {
            let output = this.interpret(stage.body, indent);
            for (const head of heads.reverse()){
                if (!BMQLGenerator.LITERAL_STAGES.includes(head)) output = `{${margin(output)}}`;
                output = `{ $${head}:${margin(output)}}`;
            }
            return `${"\t".repeat(indent)}${output}`;
        }
    }
    interpretQuerySubStage(query, indent) {
        let { lexeme  } = query.id;
        if (lexeme.includes('.')) lexeme = `"${lexeme}"`;
        return '\t'.repeat(indent) + `${lexeme}: ${this.interpret(query.body, indent)}`;
    }
    interpretPrimaryExpr(expr) {
        if (expr.verbatim) return `${expr.value}`;
        if (typeof expr.value === 'string') return `"${expr.value}"`;
        return `${expr.value}`;
    }
    interpretGroupingQO(expr) {
        return this.interpret(expr.content);
    }
    interpretConjunctQO(expr) {
        const mapping = {
            [TokenType.EQUAL]: 'eq',
            [TokenType.LESS]: 'lt',
            [TokenType.LESS_EQUAL]: 'lte',
            [TokenType.GREATER]: 'gt',
            [TokenType.GREATER_EQUAL]: 'gte',
            [TokenType.IN]: 'in',
            [TokenType.NOT_IN]: 'nin',
            [TokenType.NOT_EQUAL]: 'ne'
        };
        return `{ $${mapping[expr.op.type]}: ${this.interpret(expr.right)} }`;
    }
    interpretDisjunctQO(expr) {
        return `{ $and: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
    }
    interpretTopQO(expr) {
        return `{ $or: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
    }
    interpretIdentifierExpr(expr) {
        if (expr.name.startsWith("$$")) return `"${expr.name}"`;
        return `"$${expr.name}"`;
    }
    interpretGroupingExpr(expr) {
        return this.interpret(expr.expression);
    }
    interpretUnaryExpr(expr) {
        switch(expr.op.type){
            case TokenType.BANG:
                return `{ $not: ${this.interpret(expr.right)} }`;
            case TokenType.MINUS:
                return `{ $multiply: [${this.interpret(expr.right)}, -1] }`;
            default:
                throw "this shouldn't happen";
        }
    }
    interpretFactorExpr(expr) {
        switch(expr.op.type){
            case TokenType.STAR:
                return `{ $multiply: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            case TokenType.SLASH:
                return `{ $divide: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            case TokenType.MOD:
                return `{ $mod: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            default:
                throw "this shouldn't happen";
        }
    }
    interpretTermExpr(expr) {
        switch(expr.op.type){
            case TokenType.PLUS:
                return `{ $add: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            case TokenType.MINUS:
                return `{ $subtract: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            default:
                throw "this shouldn't happen";
        }
    }
    interpretComparisonExpr(expr) {
        const body = `[${this.interpret(expr.left)}, ${this.interpret(expr.right)}]`;
        switch(expr.op.type){
            case TokenType.LESS:
                return `{ $lt: ${body} }`;
            case TokenType.LESS_EQUAL:
                return `{ $lte: ${body} }`;
            case TokenType.GREATER:
                return `{ $gt: ${body} }`;
            case TokenType.GREATER_EQUAL:
                return `{ $gte: ${body} }`;
            case TokenType.IN:
                return `{ $in: ${body} }`;
            case TokenType.NOT_IN:
                return `{ $not: { $in: ${body} } }`;
            default:
                throw "this shouldn't happen";
        }
    }
    interpretEqualityExpr(expr) {
        switch(expr.op.type){
            case TokenType.EQUAL_EQUAL:
            case TokenType.EQUAL:
                return `{ $eq: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            case TokenType.BANG_EQUAL:
                return `{ $ne: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`;
            default:
                throw "this shouldn't happen";
        }
    }
    interpretExpression(expr) {
        return `$expr: ${this.interpret(expr.content)}`;
    }
    interpretSetStage(expr, indent) {
        let { id  } = expr;
        if (id.includes(".")) id = `"${id}"`;
        return '\t'.repeat(indent) + `${id}: ${this.interpret(expr.value)}`;
    }
    interpretFieldsStage(expr, indent) {
        switch(expr.type){
            case "project":
                return expr.fields.map((field)=>'\t'.repeat(indent) + `${field}: true`
                ).join(',\n');
            default:
                throw "this shouldn't happen";
        }
    }
    interpretImportSpec(expr, indent) {
        return '\n' + '\t'.repeat(indent + 1) + `from: "${expr.collection}",\n` + '\t'.repeat(indent + 1) + `localField: "${expr.localField || expr.collection}",\n` + '\t'.repeat(indent + 1) + `foreignField: "${expr.foreignField || '_id'}",\n` + '\t'.repeat(indent + 1) + `as: "${expr.alias || expr.collection}",\n` + '\t'.repeat(indent);
    }
    invocation(func, args, defs = BMQLGenerator.FUNCS) {
        if (func in defs) {
            const value = defs[func];
            if (!value) throw "this shouldn't happen";
            if (value === 'single') {
                const [arg, ...rest] = args;
                if (!arg) throw new Error(`Function ${func} expects 1 argument, found 0.`);
                if (rest.length) throw new Error(`Function ${func} expects 1 argument, found ${rest.length}`);
                return `{ $${func}: ${this.interpret(arg)} }`;
            } else if (typeof value === 'number') {
                const { length  } = args;
                if (length !== value && value !== Infinity) throw new Error(`Function ${func} expects ${value} argument, found ${length}.`);
                const rhs = length ? `[${args.map((arg)=>this.interpret(arg)
                ).join(', ')}]` : '{}';
                return `{ $${func}: ${rhs} }`;
            } else if (Array.isArray(value)) {
                const outputArgs = [];
                for (const [def, val] of zip(value, args)){
                    if (!val) {
                        if (def === REQUIRED) throw new Error(`Required argument omitted from ${func}`);
                        outputArgs.push(`${def}`);
                    } else outputArgs.push(val);
                }
                return ` $${func}: [${outputArgs.map((thing)=>typeof thing === 'string' ? thing : this.interpret(thing)
                )}]`;
            } else if (isDetailedFuncSpec(value)) {
                const { args: argNum = Infinity , alias =func , argStyle  } = value;
                return this.invocation(alias, args, {
                    [alias]: argStyle === "double" ? argNum : "single"
                });
            } else {
                if (value.overloads.includes(args.length)) {
                    return this.invocation(func, args, {
                        [func]: args.length
                    });
                } else throw new Error(`Function ${func} expected ${value.overloads.join('/')} arguments, found ${args.length}`);
            }
        } else throw new Error(`Function ${func} is not defined.`);
    }
    interpretInvocation(expr) {
        return this.invocation(expr.func, expr.args);
    }
    interpretCast(expr) {
        return `{ $to${expr.type}: ${this.interpret(expr.expr)} }`;
    }
    interpretObjectLiteral(expr) {
        const intermediate = `{ ${expr.entries.map(([key, value])=>`${key}: ${this.interpret(value)}`
        ).join(', ')} }`;
        if (expr.entries.some(([key])=>key.startsWith("$")
        )) return `{ $literal: ${intermediate} }`;
        return intermediate;
    }
    interpretArrayLiteral(expr) {
        return `[${expr.entries.map((entry)=>this.interpret(entry)
        ).join(", ")}]`;
    }
    interpretTernary(expr) {
        return `{ $cond: { if: ${this.interpret(expr.left)}, then: ${this.interpret(expr.middle)}, else: ${this.interpret(expr.right)} } }`;
    }
    interpretAccess(expr) {
        return `{ $arrayElemAt: [${this.interpret(expr.array)}, ${this.interpret(expr.index)}] }`;
    }
    static LITERAL_STAGES = [
        "limit",
        "count",
        "sortByCount",
        "unwind"
    ];
    static FUNCS = {
        abs: "single",
        acos: "single",
        acosh: "single",
        all: {
            args: Infinity,
            alias: "allElementsTrue",
            argStyle: "double"
        },
        any: {
            args: Infinity,
            alias: "anyElementTrue",
            argStyle: "double"
        },
        arrayToObject: "single",
        asin: "single",
        asinh: "single",
        atan: "single",
        atanh: "single",
        atan2: "single",
        avg: "single",
        ceil: "single",
        cmp: 2,
        concat: Infinity,
        concatArrays: Infinity,
        cos: "single",
        cosh: "single",
        dayOfMonth: "single",
        dayOfWeek: "single",
        dayOfYear: "single",
        degreesToRadians: "single",
        exp: "single",
        filter: "single",
        first: "single",
        floor: "single",
        hour: "single",
        indexOfArray: {
            overloads: [
                2,
                3,
                4
            ]
        },
        indexOfBytes: {
            overloads: [
                2,
                3,
                4
            ]
        },
        isArray: 1,
        isNumber: "single",
        isoDayOfWeek: "single",
        isoWeek: "single",
        isoWeekYear: "single",
        last: "single",
        let: "single",
        ln: "single",
        log: "single",
        log10: "single",
        map: "single",
        millisecond: "single",
        minute: "single",
        month: "single",
        objectToArray: "single",
        pow: 2,
        push: "single",
        radiansToDegrees: "single",
        rand: 0,
        range: [
            REQUIRED,
            REQUIRED,
            1
        ],
        reduce: "single",
        reverseArray: "single",
        round: [
            REQUIRED,
            0
        ],
        sampleRate: "single",
        second: "single",
        setDifference: 2,
        setEquals: Infinity,
        setIntersection: Infinity,
        setIsSubset: 2,
        setUnion: Infinity,
        size: "single",
        sin: "single",
        sinh: "single",
        slice: {
            overloads: [
                2,
                3
            ]
        },
        split: 2,
        sqrt: "single",
        strcasecmp: 2,
        strLenBytes: "single",
        strLenCP: "single",
        substr: 3,
        substrBytes: 3,
        substrCP: 3,
        sum: "single",
        switch: "single",
        tan: "single",
        tanh: "single",
        trunc: [
            REQUIRED,
            0
        ],
        type: "single",
        week: "single",
        year: "single",
        zip: "single"
    };
    static CASTS = [
        "Bool",
        "Date",
        "Decimal",
        "Double",
        "Int",
        "Long",
        "ObjectId",
        "String",
        "Lower",
        "Upper"
    ];
}
function isDetailedFuncSpec(obj) {
    return 'args' in obj || 'alias' in obj || 'argStyle' in obj;
}
function margin(str) {
    const begin = str.startsWith('\t') || str.startsWith(' ') ? '' : ' ';
    const end = str.endsWith('\t') || str.endsWith(' ') ? '' : ' ';
    return `${begin}${str}${end}`;
}
class Humongo {
    static runFile(target, verbose = false) {
        if (typeof Deno === 'undefined') throw new Error(`File system access only available with the Deno runtime -- you are either attempting to access the file system from the browser or using node.js!`);
        const source = Deno.readTextFileSync(target);
        return this.run(source, verbose);
    }
    static run(source, verbose = false) {
        if (verbose) console.log(source);
        const lexer = new Lexer(source);
        const tokens = lexer.lex();
        if (verbose) console.log(tokens);
        const parser = new Parser(tokens);
        const tree = parser.parse();
        if (verbose) console.log(tree);
        const generator = new BMQLGenerator();
        const output = generator.interpret(tree);
        if (verbose) console.log(output);
        return output;
    }
    static greet() {
        console.log("Welcome to Humongo. I hope you enjoy it!");
    }
}
Humongo.greet();
