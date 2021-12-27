class Token {
    type;
    lexeme;
    literal;
    line;
    constructor(type1, lexeme, literal1, line1){
        this.type = type1;
        this.lexeme = lexeme;
        this.literal = literal1;
        this.line = line1;
    }
    toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }
}
class TabToken extends Token {
    line;
    count;
    constructor(line2, count){
        super(TokenType.TAB, '\t', null, line2);
        this.line = line2;
        this.count = count;
    }
    increment() {
        this.lexeme += '\t';
        this.count += 1;
    }
}
var TokenType;
(function(TokenType1) {
    TokenType1[TokenType1["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType1[TokenType1["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType1[TokenType1["LEFT_BRACE"] = 2] = "LEFT_BRACE";
    TokenType1[TokenType1["RIGHT_BRACE"] = 3] = "RIGHT_BRACE";
    TokenType1[TokenType1["COMMA"] = 4] = "COMMA";
    TokenType1[TokenType1["DOT"] = 5] = "DOT";
    TokenType1[TokenType1["MINUS"] = 6] = "MINUS";
    TokenType1[TokenType1["PLUS"] = 7] = "PLUS";
    TokenType1[TokenType1["SEMICOLON"] = 8] = "SEMICOLON";
    TokenType1[TokenType1["SLASH"] = 9] = "SLASH";
    TokenType1[TokenType1["STAR"] = 10] = "STAR";
    TokenType1[TokenType1["BANG"] = 11] = "BANG";
    TokenType1[TokenType1["BANG_EQUAL"] = 12] = "BANG_EQUAL";
    TokenType1[TokenType1["GREATER"] = 13] = "GREATER";
    TokenType1[TokenType1["GREATER_EQUAL"] = 14] = "GREATER_EQUAL";
    TokenType1[TokenType1["LESS"] = 15] = "LESS";
    TokenType1[TokenType1["LESS_EQUAL"] = 16] = "LESS_EQUAL";
    TokenType1[TokenType1["IDENTIFIER"] = 17] = "IDENTIFIER";
    TokenType1[TokenType1["STRING"] = 18] = "STRING";
    TokenType1[TokenType1["NUMBER"] = 19] = "NUMBER";
    TokenType1[TokenType1["AND"] = 20] = "AND";
    TokenType1[TokenType1["ELSE"] = 21] = "ELSE";
    TokenType1[TokenType1["TRUE"] = 22] = "TRUE";
    TokenType1[TokenType1["FALSE"] = 23] = "FALSE";
    TokenType1[TokenType1["IF"] = 24] = "IF";
    TokenType1[TokenType1["NULL"] = 25] = "NULL";
    TokenType1[TokenType1["OR"] = 26] = "OR";
    TokenType1[TokenType1["EOF"] = 27] = "EOF";
    TokenType1[TokenType1["EQUAL"] = 28] = "EQUAL";
    TokenType1[TokenType1["EQUAL_EQUAL"] = 29] = "EQUAL_EQUAL";
    TokenType1[TokenType1["TAB"] = 30] = "TAB";
    TokenType1[TokenType1["BREAK"] = 31] = "BREAK";
    TokenType1[TokenType1["COLON"] = 32] = "COLON";
    TokenType1[TokenType1["BAR"] = 33] = "BAR";
    TokenType1[TokenType1["BAR_BAR"] = 34] = "BAR_BAR";
    TokenType1[TokenType1["NOT_EQUAL"] = 35] = "NOT_EQUAL";
    TokenType1[TokenType1["IN"] = 36] = "IN";
    TokenType1[TokenType1["NOT_IN"] = 37] = "NOT_IN";
    TokenType1[TokenType1["MOD"] = 38] = "MOD";
    TokenType1[TokenType1["LEFT_BRACKET"] = 39] = "LEFT_BRACKET";
    TokenType1[TokenType1["RIGHT_BRACKET"] = 40] = "RIGHT_BRACKET";
    TokenType1[TokenType1["QM"] = 41] = "QM";
    TokenType1[TokenType1["OID"] = 42] = "OID";
    TokenType1[TokenType1["DATE"] = 43] = "DATE";
    TokenType1[TokenType1["AT_AT"] = 44] = "AT_AT";
    TokenType1[TokenType1["JAVASCRIPT"] = 45] = "JAVASCRIPT";
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
    constructor(source1){
        this.source = source1;
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
    constructor(content1){
        this.content = content1;
    }
    getInterpreted(generator) {
        return generator.interpretExpression(this);
    }
}
class Cast {
    expr;
    type;
    constructor(expr1, type2){
        this.expr = expr1;
        this.type = type2;
    }
    getInterpreted(generator) {
        return generator.interpretCast(this);
    }
}
class Equality {
    left;
    op;
    right;
    constructor(left1, op1, right1){
        this.left = left1;
        this.op = op1;
        this.right = right1;
    }
    getInterpreted(generator) {
        return generator.interpretEqualityExpr(this);
    }
}
class Comparison {
    left;
    op;
    right;
    constructor(left2, op2, right2){
        this.left = left2;
        this.op = op2;
        this.right = right2;
    }
    getInterpreted(generator) {
        return generator.interpretComparisonExpr(this);
    }
}
class Term {
    left;
    op;
    right;
    constructor(left3, op3, right3){
        this.left = left3;
        this.op = op3;
        this.right = right3;
    }
    getInterpreted(generator) {
        return generator.interpretTermExpr(this);
    }
}
class Factor {
    left;
    op;
    right;
    constructor(left4, op4, right4){
        this.left = left4;
        this.op = op4;
        this.right = right4;
    }
    getInterpreted(generator) {
        return generator.interpretFactorExpr(this);
    }
}
class Unary {
    op;
    right;
    constructor(op5, right5){
        this.op = op5;
        this.right = right5;
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
    constructor(value1, verbatim){
        this.value = value1;
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
    constructor(func1, args1){
        this.func = func1;
        this.args = args1;
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
    constructor(entries1){
        this.entries = entries1;
    }
    getInterpreted(generator) {
        return generator.interpretObjectLiteral(this);
    }
}
class ArrayLiteral {
    entries;
    constructor(entries2){
        this.entries = entries2;
    }
    getInterpreted(generator) {
        return generator.interpretArrayLiteral(this);
    }
}
class Ternary {
    left;
    middle;
    right;
    constructor(left5, middle, right6){
        this.left = left5;
        this.middle = middle;
        this.right = right6;
    }
    getInterpreted(generator) {
        return generator.interpretTernary(this);
    }
}
class TopQO {
    left;
    op;
    right;
    constructor(left6, op6, right7){
        this.left = left6;
        this.op = op6;
        this.right = right7;
    }
    getInterpreted(generator) {
        return generator.interpretTopQO(this);
    }
}
class DisjunctQO {
    left;
    op;
    right;
    constructor(left7, op7, right8){
        this.left = left7;
        this.op = op7;
        this.right = right8;
    }
    getInterpreted(generator) {
        return generator.interpretDisjunctQO(this);
    }
}
class ConjunctQO {
    op;
    right;
    constructor(op8, right9){
        this.op = op8;
        this.right = right9;
    }
    getInterpreted(generator) {
        return generator.interpretConjunctQO(this);
    }
}
class GroupingQO {
    content;
    constructor(content2){
        this.content = content2;
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
class File1 {
    collection;
    body;
    constructor(collection1, body1){
        this.collection = collection1;
        this.body = body1;
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
    constructor(head, body2){
        this.head = head;
        this.body = body2;
    }
    getInterpreted(generator, indent) {
        return generator.interpretStage(this, indent);
    }
}
class MatchStage extends Stage {
    constructor(head1, body3){
        super(head1, body3);
    }
}
class SetStage {
    id;
    value;
    constructor(id1, value2){
        this.id = id1;
        this.value = value2;
    }
    getInterpreted(generator, indent) {
        return generator.interpretSetStage(this, indent);
    }
}
class FieldsStage {
    fields;
    type;
    constructor(fields, type3){
        this.fields = fields;
        this.type = type3;
    }
    getInterpreted(generator, indent) {
        return generator.interpretFieldsStage(this, indent);
    }
}
class ComplexStage extends Stage {
    constructor(head2, body4){
        super(head2, body4);
    }
}
class QuerySubStage {
    id;
    body;
    constructor(id2, body5){
        this.id = id2;
        this.body = body5;
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
    constructor(collection2, localField, foreignField, alias){
        this.collection = collection2;
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
        const { done: done1 , value: value11  } = iterator1.next();
        const { done: done2 , value: value21  } = iterator2.next();
        if (done1 && done2) break;
        yield [
            value11,
            value21
        ];
    }
}
class Parser {
    tokens;
    indent = 0;
    current = 0;
    constructor(tokens1){
        this.tokens = tokens1;
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
            const collection3 = this.expression();
            if (collection3 instanceof Identifier) {
                const body6 = this.body();
                return new File1(collection3.name, body6);
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
        const stages1 = comap(this.block(), ()=>this.stage()
        );
        return new Body(stages1);
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
        const id3 = this.identifier();
        return new Stage('unwind', id3);
    }
    sortStage() {
        const stages1 = comap(this.block(), ()=>this.sortSubStage()
        );
        return new Stage('sort', stages1);
    }
    sortSubStage() {
        const id3 = this.identifier();
        let dir;
        if (this.matchContent("asc")) dir = "1";
        else if (this.matchContent("desc")) dir = "-1";
        else if (this.matchContent("text")) dir = '{ $meta: "textScore" }';
        else throw new Error("invalid sort stage");
        return new SetStage(id3.name, new Primary(dir, true));
    }
    groupStage() {
        this.consumeContent(()=>`Invalid group stage. Syntax is: 'group by <expression>:'`
        , 'by');
        const _id = this.expression();
        const stages1 = comap(this.block(), ()=>this.setSubStage()
        );
        return new Stage('group', [
            new SetStage("_id", _id),
            ...stages1
        ]);
    }
    countStage() {
        let alias1 = "count";
        if (this.matchContent("as")) {
            const id3 = this.identifier();
            alias1 = id3.name;
        } else if (this.matchContent("by")) {
            const expr1 = this.expression();
            return new Stage('sortByCount', expr1);
        }
        return new Stage('count', new Primary(alias1));
    }
    importOneStage() {
        const importStage = this.importStage();
        const importSpec = importStage.body;
        const idString = importSpec.alias || importSpec.collection;
        const id3 = new Identifier(idString);
        const rhsValue = new Access(id3, new Primary(0));
        return [
            importStage,
            new Stage('set', [
                new SetStage(idString, rhsValue)
            ])
        ];
    }
    importStage() {
        const first = this.identifier();
        let collection3, foreign, local, alias1;
        if (this.matchContent('from')) [collection3, alias1] = [
            this.identifier(),
            first
        ];
        else collection3 = first;
        if (this.matchContent('by')) foreign = this.identifier();
        if (this.matchContent('using')) local = this.identifier();
        if (!this.check(TokenType.BREAK)) throw new Error("invalid import stage");
        const spec = new ImportSpec(collection3.name, local?.name, foreign?.name, alias1?.name);
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
        const id3 = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
        );
        if (this.match(TokenType.EQUAL)) {
            const value3 = this.expression();
            return new SetStage(id3.lexeme, value3);
        } else if (this.check(TokenType.COMMA)) {
            const ids = [
                id3
            ];
            while(this.match(TokenType.COMMA)){
                const nextId = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
                );
                ids.push(nextId);
            }
            return new FieldsStage(ids.map((id4)=>id4.lexeme
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
        const id3 = this.consume(TokenType.IDENTIFIER, (str)=>`Expected identifier, found ${str}`
        );
        this.consume(TokenType.EQUAL, ()=>`Expected equal sign.`
        );
        const value3 = this.expression();
        return new SetStage(id3.lexeme, value3);
    }
    matchIf() {
        const expr1 = this.expression();
        return new Stage("match", new Expression(expr1));
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
        const id3 = this.consume(TokenType.IDENTIFIER, (str)=>`Expected idnetifier, found ${str}`
        );
        const body6 = this.expressionQO();
        return new QuerySubStage(id3, body6);
    }
    expressionQO() {
        let expr1 = this.disjunctQO();
        while(this.match(TokenType.BAR_BAR)){
            const operator = this.previous;
            const right10 = this.disjunctQO();
            expr1 = new TopQO(expr1, operator, right10);
        }
        return expr1;
    }
    disjunctQO() {
        let expr1 = this.conjunctQO();
        while(this.match(TokenType.COMMA)){
            const operator = this.previous;
            const right10 = this.conjunctQO();
            expr1 = new DisjunctQO(expr1, operator, right10);
        }
        return expr1;
    }
    conjunctQO() {
        if (this.match(TokenType.LEFT_PAREN)) {
            const expr1 = this.expressionQO();
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expected ")", found ${str}`
            );
            return new GroupingQO(expr1);
        } else if (this.match(...simpleQueryOperators)) {
            const operator = this.previous;
            const right10 = [
                TokenType.IN,
                TokenType.NOT_IN
            ].includes(operator.type) ? this.arrayLiteral(false) : this.literal();
            return new ConjunctQO(operator, right10);
        } else {
            throw new Error('Expected query statement.');
        }
    }
    expression() {
        const expr1 = this.castable();
        if (this.match(TokenType.QM)) {
            const middle1 = this.castable();
            this.consume(TokenType.COLON, (str)=>`Expected :, found ${str}`
            );
            const right10 = this.castable();
            return new Ternary(expr1, middle1, right10);
        } else return expr1;
    }
    castable() {
        const expr1 = this.equality();
        if (this.matchContent("as")) {
            const { lexeme: lexeme1  } = this.consume(TokenType.IDENTIFIER, (str)=>`Expected type identifier, found ${str}`
            );
            return new Cast(expr1, lexeme1);
        }
        return expr1;
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
            const right10 = this.unary();
            return new Unary(operator, right10);
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
            const expr1 = this.expression();
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expect ')' after expression, found ${str}`
            );
            return new Grouping(expr1);
        } else if (this.match(TokenType.LEFT_BRACE)) {
            this.allowWhitespace();
            const entries3 = [
                this.keyValuePair()
            ];
            while(this.match(TokenType.COMMA)){
                this.allowWhitespace();
                entries3.push(this.keyValuePair());
            }
            this.allowWhitespace();
            this.consume(TokenType.RIGHT_BRACE, (str)=>`Expected closing } for object literal, found ${str}`
            );
            return new ObjectLiteral(entries3);
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
        const entries3 = [
            this.expression()
        ];
        while(this.match(TokenType.COMMA)){
            this.allowWhitespace();
            entries3.push(this.expression());
        }
        this.allowWhitespace();
        this.consume(TokenType.RIGHT_BRACKET, (str)=>`Expected closing ] for array literal, found ${str}`
        );
        return new ArrayLiteral(entries3);
    }
    keyValuePair() {
        const key = this.identifier();
        this.consume(TokenType.COLON, (str)=>`Expected colon, found ${str}`
        );
        const expr1 = this.expression();
        return [
            key.name,
            expr1
        ];
    }
    identifierOrInvocation() {
        const token = this.advance();
        if (this.match(TokenType.LEFT_PAREN)) {
            const args1 = [
                this.expression()
            ];
            while(this.match(TokenType.COMMA))args1.push(this.expression());
            this.consume(TokenType.RIGHT_PAREN, (str)=>`Expect ')' after expression, found ${str}`
            );
            return new Invocation(token.lexeme, args1);
        } else if (this.match(TokenType.LEFT_BRACKET)) {
            const index1 = this.expression();
            this.consume(TokenType.RIGHT_BRACKET, (str)=>`Expected ']', found ${str}`
            );
            return new Access(new Identifier(token.lexeme), index1);
        }
        return new Identifier(token.lexeme);
    }
    identifier() {
        const token = this.advance();
        return new Identifier(token.lexeme);
    }
    rightAssociative(constituent, ExprType, ...tokens) {
        let expr1 = constituent.call(this);
        while(this.match(...tokens)){
            const operator = this.previous;
            const right10 = constituent.call(this);
            expr1 = new ExprType(expr1, operator, right10);
        }
        return expr1;
    }
    match(...types) {
        for (const type4 of types){
            if (this.check(type4)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    matchContent(...contents) {
        for (const content3 of contents){
            if (this.checkContent(content3)) {
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
            output.unshift(`${'\t'.repeat(indent)}${heads.map((head3)=>`{ $${head3}:`
            ).join(' ')} {\n`);
            output.push('\t'.repeat(indent) + '} '.repeat(heads.length + 1).trim());
            return output.join('');
        } else {
            let output = this.interpret(stage.body, indent);
            for (const head3 of heads.reverse()){
                if (!BMQLGenerator.LITERAL_STAGES.includes(head3)) output = `{${margin(output)}}`;
                output = `{ $${head3}:${margin(output)}}`;
            }
            return `${"\t".repeat(indent)}${output}`;
        }
    }
    interpretQuerySubStage(query, indent) {
        let { lexeme: lexeme1  } = query.id;
        if (lexeme1.includes('.')) lexeme1 = `"${lexeme1}"`;
        return '\t'.repeat(indent) + `${lexeme1}: ${this.interpret(query.body, indent)}`;
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
        const body6 = `[${this.interpret(expr.left)}, ${this.interpret(expr.right)}]`;
        switch(expr.op.type){
            case TokenType.LESS:
                return `{ $lt: ${body6} }`;
            case TokenType.LESS_EQUAL:
                return `{ $lte: ${body6} }`;
            case TokenType.GREATER:
                return `{ $gt: ${body6} }`;
            case TokenType.GREATER_EQUAL:
                return `{ $gte: ${body6} }`;
            case TokenType.IN:
                return `{ $in: ${body6} }`;
            case TokenType.NOT_IN:
                return `{ $not: { $in: ${body6} } }`;
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
        let { id: id3  } = expr;
        if (id3.includes(".")) id3 = `"${id3}"`;
        return '\t'.repeat(indent) + `${id3}: ${this.interpret(expr.value)}`;
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
            const value3 = defs[func];
            if (!value3) throw "this shouldn't happen";
            if (value3 === 'single') {
                const [arg, ...rest] = args;
                if (!arg) throw new Error(`Function ${func} expects 1 argument, found 0.`);
                if (rest.length) throw new Error(`Function ${func} expects 1 argument, found ${rest.length}`);
                return `{ $${func}: ${this.interpret(arg)} }`;
            } else if (typeof value3 === 'number') {
                const { length  } = args;
                if (length !== value3 && value3 !== Infinity) throw new Error(`Function ${func} expects ${value3} argument, found ${length}.`);
                const rhs = length ? `[${args.map((arg)=>this.interpret(arg)
                ).join(', ')}]` : '{}';
                return `{ $${func}: ${rhs} }`;
            } else if (Array.isArray(value3)) {
                const outputArgs = [];
                for (const [def, val] of zip(value3, args)){
                    if (!val) {
                        if (def === REQUIRED) throw new Error(`Required argument omitted from ${func}`);
                        outputArgs.push(`${def}`);
                    } else outputArgs.push(val);
                }
                return ` $${func}: [${outputArgs.map((thing)=>typeof thing === 'string' ? thing : this.interpret(thing)
                )}]`;
            } else if (isDetailedFuncSpec(value3)) {
                const { args: argNum = Infinity , alias: alias1 = func , argStyle  } = value3;
                return this.invocation(alias1, args, {
                    [alias1]: argStyle === "double" ? argNum : "single"
                });
            } else {
                if (value3.overloads.includes(args.length)) {
                    return this.invocation(func, args, {
                        [func]: args.length
                    });
                } else throw new Error(`Function ${func} expected ${value3.overloads.join('/')} arguments, found ${args.length}`);
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
        const intermediate = `{ ${expr.entries.map(([key, value3])=>`${key}: ${this.interpret(value3)}`
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
        if (typeof Deno === 'undefined') throw new Error(`Can't access file-system!`);
        const source1 = Deno.readTextFileSync(target);
        return this.run(source1, verbose);
    }
    static run(source, verbose = false) {
        if (verbose) console.log(source);
        const lexer = new Lexer(source);
        const tokens2 = lexer.lex();
        if (verbose) console.log(tokens2);
        const parser = new Parser(tokens2);
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
