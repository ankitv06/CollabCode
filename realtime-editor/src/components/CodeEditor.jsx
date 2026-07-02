import React, { useEffect, useRef, useState } from 'react'
import { basicSetup } from "codemirror"
import { EditorView } from "@codemirror/view"
import { Compartment } from "@codemirror/state"
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { autocompletion } from "@codemirror/autocomplete"

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { yCollab } from 'y-codemirror.next'

import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { java } from "@codemirror/lang-java"
import { cpp } from "@codemirror/lang-cpp"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { xml } from "@codemirror/lang-xml"
import { sql } from "@codemirror/lang-sql"
import { php } from "@codemirror/lang-php"
import { rust } from "@codemirror/lang-rust"

import { linter, lintGutter } from "@codemirror/lint";
import { syntaxTree } from "@codemirror/language";
import { ACTIONS } from '../../Actions';

export const syntaxLinter = linter((view) => {
  const diagnostics = [];

  syntaxTree(view.state).iterate({
    enter(node) {
      if (node.type.isError) {
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: "error",
          message: "Syntax error",
        });
      }
    },
  });

  return diagnostics;
});

// Creates a completion source from a keyword list
function keywordCompletionSource(keywords) {
  const completions = keywords.map(kw => ({ label: kw, type: "keyword" }));
  return (context) => {
    const word = context.matchBefore(/[\w#]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { from: word.from, options: completions, validFor: /^[\w#]*$/ };
  };
}

const C_KEYWORDS = [
  "auto", "break", "case", "char", "const", "continue", "default", "do",
  "double", "else", "enum", "extern", "float", "for", "goto", "if",
  "inline", "int", "long", "register", "return", "short", "signed",
  "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned",
  "void", "volatile", "while",
  "printf", "scanf", "malloc", "free", "calloc", "realloc",
  "strlen", "strcpy", "strcmp", "strcat", "memcpy", "memset",
  "NULL", "stdin", "stdout", "stderr", "EOF",
  "#include", "#define", "#ifdef", "#ifndef", "#endif", "#pragma",
];

const CPP_KEYWORDS = [
  ...C_KEYWORDS,
  "bool", "catch", "class", "const_cast", "delete", "dynamic_cast",
  "explicit", "export", "false", "friend", "mutable", "namespace",
  "new", "noexcept", "nullptr", "operator", "private", "protected",
  "public", "reinterpret_cast", "static_assert", "static_cast",
  "template", "this", "throw", "true", "try", "typeid", "typename",
  "using", "virtual", "override", "final",
  "cout", "cin", "endl", "string", "vector", "map", "set", "pair",
  "queue", "stack", "deque", "list", "unordered_map", "unordered_set",
  "push_back", "pop_back", "begin", "end", "size", "empty",
  "sort", "find", "erase", "insert", "emplace",
  "std", "constexpr", "decltype",
];

const JAVA_KEYWORDS = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "default", "do", "double",
  "else", "enum", "extends", "final", "finally", "float", "for",
  "goto", "if", "implements", "import", "instanceof", "int",
  "interface", "long", "native", "new", "package", "private",
  "protected", "public", "return", "short", "static", "strictfp",
  "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while",
  "true", "false", "null",
  "String", "Integer", "Double", "Float", "Boolean", "Character",
  "Long", "Short", "Byte", "Object", "System", "Math",
  "ArrayList", "HashMap", "HashSet", "LinkedList", "TreeMap", "TreeSet",
  "List", "Map", "Set", "Queue", "Stack", "Iterator", "Collections",
  "Arrays", "Scanner", "StringBuilder", "StringBuffer",
  "Override", "Deprecated", "SuppressWarnings",
  "println", "print", "printf", "toString", "equals", "hashCode",
  "compareTo", "length", "size", "add", "remove", "get", "put",
  "contains", "isEmpty", "toArray", "sort", "valueOf",
];

const RUST_KEYWORDS = [
  "as", "async", "await", "break", "const", "continue", "crate", "dyn",
  "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in",
  "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return",
  "self", "Self", "static", "struct", "super", "trait", "true", "type",
  "unsafe", "use", "where", "while",
  "String", "Vec", "Option", "Result", "Box", "Rc", "Arc",
  "HashMap", "HashSet", "BTreeMap", "BTreeSet",
  "Some", "None", "Ok", "Err",
  "println", "eprintln", "format", "vec", "panic", "assert",
  "unwrap", "expect", "clone", "iter", "into_iter", "collect",
  "map", "filter", "fold", "push", "pop", "len", "is_empty",
  "to_string", "parse", "from", "into", "as_ref", "as_mut",
  "i8", "i16", "i32", "i64", "i128", "isize",
  "u8", "u16", "u32", "u64", "u128", "usize",
  "f32", "f64", "bool", "char", "str",
];

const PHP_KEYWORDS = [
  "abstract", "and", "array", "as", "break", "callable", "case", "catch",
  "class", "clone", "const", "continue", "declare", "default", "do",
  "echo", "else", "elseif", "empty", "extends", "final", "finally",
  "fn", "for", "foreach", "function", "global", "goto", "if",
  "implements", "include", "include_once", "instanceof", "interface",
  "isset", "list", "match", "namespace", "new", "null", "or", "print",
  "private", "protected", "public", "readonly", "require", "require_once",
  "return", "static", "switch", "throw", "trait", "try", "unset", "use",
  "var", "while", "xor", "yield",
  "true", "false", "self", "parent",
  "strlen", "strpos", "substr", "str_replace", "explode", "implode",
  "array_push", "array_pop", "array_merge", "array_map", "array_filter",
  "count", "sort", "in_array", "var_dump", "print_r",
];

const LANGUAGES = {
  javascript:  { label: "JavaScript",  ext: () => [javascript()] },
  typescript:  { label: "TypeScript",  ext: () => [javascript({ typescript: true })] },
  jsx:         { label: "JSX",         ext: () => [javascript({ jsx: true })] },
  python:      { label: "Python",      ext: () => [python()] },
  java:        { label: "Java",        ext: () => [java(), autocompletion({ override: [keywordCompletionSource(JAVA_KEYWORDS)] })] },
  cpp:         { label: "C++",         ext: () => [cpp(), autocompletion({ override: [keywordCompletionSource(CPP_KEYWORDS)] })] },
  c:           { label: "C",           ext: () => [cpp(), autocompletion({ override: [keywordCompletionSource(C_KEYWORDS)] })] },
  html:        { label: "HTML",        ext: () => [html()] },
  css:         { label: "CSS",         ext: () => [css()] },
  json:        { label: "JSON",        ext: () => [json()] },
  markdown:    { label: "Markdown",    ext: () => [markdown()] },
  xml:         { label: "XML",         ext: () => [xml()] },
  sql:         { label: "SQL",         ext: () => [sql()] },
  php:         { label: "PHP",         ext: () => [php(), autocompletion({ override: [keywordCompletionSource(PHP_KEYWORDS)] })] },
  rust:        { label: "Rust",        ext: () => [rust(), autocompletion({ override: [keywordCompletionSource(RUST_KEYWORDS)] })] },
};

// Random color for cursor
function getRandomColor() {
  const colors = [
    '#E06C75', '#61AFEF', '#98C379', '#E5C07B', '#C678DD',
    '#56B6C2', '#BE5046', '#D19A66', '#7EC8E3', '#C3E88D',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function CodeEditor({ roomId, username, socketRef }) {
  const editorRef = useRef(null);
  const langCompartment = useRef(new Compartment());
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    // Create Yjs document and shared text type
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');

    // Connect to y-websocket server using roomId as the document name
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      ydoc
    );

    // Set local user awareness (cursor label + color)
    const cursorColor = getRandomColor();
    provider.awareness.setLocalStateField('user', {
      name: username || 'Anonymous',
      color: cursorColor,
      colorLight: cursorColor + '40',
    });

    const view = new EditorView({
      extensions: [
        basicSetup,
        syntaxLinter,
        langCompartment.current.of(LANGUAGES[language].ext()),
        vscodeDark,
        yCollab(ytext, provider.awareness), // handles merging of concurrent changes without conflicts
        EditorView.theme({
          "&": {
            height: "100%",
          },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
      parent: document.querySelector('#realtimeEditor'),
    });

    editorRef.current = view;

    return () => {
      view.destroy();
      provider.disconnect();
      ydoc.destroy();
    };
  }, [roomId, username]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    if (editorRef.current) {
      editorRef.current.dispatch({
        effects: langCompartment.current.reconfigure(LANGUAGES[newLang].ext()),
      });
    }
  };

  return (
    <div className='flex flex-col h-screen'>
      <div className='langSelectBar'>
        <label htmlFor="lang-select">Language:</label>
        <select
          id="lang-select"
          value={language}
          onChange={handleLanguageChange}
        >
          {Object.entries(LANGUAGES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div className='flex-1 overflow-auto' id="realtimeEditor"></div>
    </div>
  )
}

export default CodeEditor

