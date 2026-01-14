// src/policy/whenEvaluator.js
// Safe minimal boolean expression evaluator for rules.when
// Supported:
// - comparisons: ==, !=, <, <=, >, >=
// - boolean: &&, ||, !
// - parentheses: ( )
// - literals: numbers, strings in double quotes
// - identifiers resolved from `ctx` (signals)

// Example:
//  'p_value < 0.05 && uplift_pct > 2'
//  'srm_level == "RED" || expected_loss_level == "RED"'

function tokenize(input) {
  const s = input.trim();
  const tokens = [];
  let i = 0;

  const isSpace = (c) => /\s/.test(c);
  const isDigit = (c) => /[0-9]/.test(c);
  const isIdentStart = (c) => /[A-Za-z_]/.test(c);
  const isIdent = (c) => /[A-Za-z0-9_]/.test(c);

  while (i < s.length) {
    const c = s[i];

    if (isSpace(c)) { i++; continue; }

    // parentheses
    if (c === '(' || c === ')') { tokens.push({ t: c }); i++; continue; }

    // operators (2-char first)
    const two = s.slice(i, i + 2);
    if (two === '&&' || two === '||' || two === '==' || two === '!=' || two === '<=' || two === '>=') {
      tokens.push({ t: two }); i += 2; continue;
    }
    if (c === '<' || c === '>' || c === '!') { tokens.push({ t: c }); i++; continue; }

    // string literal "..."
    if (c === '"') {
      let j = i + 1;
      let out = '';
      while (j < s.length) {
        const cc = s[j];
        if (cc === '\\' && j + 1 < s.length) {
          out += s[j + 1];
          j += 2;
          continue;
        }
        if (cc === '"') break;
        out += cc;
        j++;
      }
      if (j >= s.length || s[j] !== '"') throw new Error('Unterminated string literal');
      tokens.push({ t: 'STRING', v: out });
      i = j + 1;
      continue;
    }

    // number
    if (isDigit(c) || (c === '.' && isDigit(s[i + 1] || ''))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const num = Number(s.slice(i, j));
      if (Number.isNaN(num)) throw new Error('Invalid number');
      tokens.push({ t: 'NUMBER', v: num });
      i = j;
      continue;
    }

    // identifier
    if (isIdentStart(c)) {
      let j = i + 1;
      while (j < s.length && isIdent(s[j])) j++;
      tokens.push({ t: 'IDENT', v: s.slice(i, j) });
      i = j;
      continue;
    }

    throw new Error(`Unexpected char: ${c}`);
  }

  return tokens;
}

// Recursive descent parser with precedence:
// 1) !
// 2) comparisons
// 3) &&
// 4) ||

function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p];
  const eat = (t) => {
    const cur = tokens[p];
    if (!cur || cur.t !== t) throw new Error(`Expected ${t}`);
    p++;
    return cur;
  };
  const match = (t) => (peek() && peek().t === t);

  const parsePrimary = () => {
    if (match('(')) {
      eat('(');
      const e = parseOr();
      eat(')');
      return e;
    }
    if (match('NUMBER')) return { k: 'LIT', v: eat('NUMBER').v };
    if (match('STRING')) return { k: 'LIT', v: eat('STRING').v };
    if (match('IDENT')) return { k: 'ID', v: eat('IDENT').v };
    throw new Error('Expected primary');
  };

  const parseUnary = () => {
    if (match('!')) {
      eat('!');
      return { k: 'NOT', a: parseUnary() };
    }
    return parsePrimary();
  };

  const parseCompare = () => {
    let left = parseUnary();
    const ops = ['==', '!=', '<', '<=', '>', '>='];
    while (peek() && ops.includes(peek().t)) {
      const op = eat(peek().t).t;
      const right = parseUnary();
      left = { k: 'CMP', op, a: left, b: right };
    }
    return left;
  };

  const parseAnd = () => {
    let left = parseCompare();
    while (match('&&')) {
      eat('&&');
      const right = parseCompare();
      left = { k: 'AND', a: left, b: right };
    }
    return left;
  };

  const parseOr = () => {
    let left = parseAnd();
    while (match('||')) {
      eat('||');
      const right = parseAnd();
      left = { k: 'OR', a: left, b: right };
    }
    return left;
  };

  const ast = parseOr();
  if (p !== tokens.length) throw new Error('Unexpected tokens at end');
  return ast;
}

function resolve(node, ctx) {
  if (!node) return false;

  switch (node.k) {
    case 'LIT': return node.v;
    case 'ID': return ctx?.[node.v];
    case 'NOT': return !truthy(resolve(node.a, ctx));
    case 'AND': return truthy(resolve(node.a, ctx)) && truthy(resolve(node.b, ctx));
    case 'OR': return truthy(resolve(node.a, ctx)) || truthy(resolve(node.b, ctx));
    case 'CMP': {
      const a = resolve(node.a, ctx);
      const b = resolve(node.b, ctx);
      switch (node.op) {
        case '==': return a === b;
        case '!=': return a !== b;
        case '<': return Number(a) < Number(b);
        case '<=': return Number(a) <= Number(b);
        case '>': return Number(a) > Number(b);
        case '>=': return Number(a) >= Number(b);
        default: return false;
      }
    }
    default: return false;
  }
}

function truthy(x) {
  return !!x;
}

export function evaluateWhen(expr, ctx) {
  if (!expr || typeof expr !== 'string') return false;
  const tokens = tokenize(expr);
  const ast = parse(tokens);
  return truthy(resolve(ast, ctx));
}
