import React, { useEffect, useRef, useState } from 'react'
import { basicSetup } from "codemirror"
import { EditorView, gutter, GutterMarker, keymap } from "@codemirror/view"
import { Compartment, EditorState, StateField, StateEffect, RangeSet } from "@codemirror/state"
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import '@fontsource/fira-code';
import '@fontsource/source-code-pro';
import { autocompletion } from "@codemirror/autocomplete"
import {indentWithTab} from "@codemirror/commands"

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

import { linter, lintGutter, forceLinting } from "@codemirror/lint";
import { syntaxTree, indentUnit } from "@codemirror/language";
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

function CodeEditor({ roomId, username, color, theme, socketRef }) {
  const editorRef = useRef(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const settingsCompartment = useRef(new Compartment());
  const [language, setLanguage] = useState("javascript");
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [fontFamily, setFontFamily] = useState('Consolas, "Courier New", monospace');
  const [fontSize, setFontSize] = useState(15);
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(false);

  useEffect(() => {
    // Create Yjs document and shared text type
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('codemirror');

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const wsUrl = backendUrl.replace(/^http/, 'ws');

    // Connect to y-websocket server using roomId as the document name
    const provider = new WebsocketProvider(
      wsUrl,
      roomId,
      ydoc
    );
    providerRef.current = provider;

    // Set local user awareness (cursor label + color)
    provider.awareness.setLocalStateField('user', {
      name: username || 'Anonymous',
      color: color || '#E06C75',
      colorLight: (color || '#E06C75') + '40',
    });

    const view = new EditorView({
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        langCompartment.current.of([ LANGUAGES[language].ext(), syntaxLinter ]),
        themeCompartment.current.of(theme === 'dark' ? vscodeDark : vscodeLight),
        settingsCompartment.current.of([
          EditorState.tabSize.of(tabSize),
          indentUnit.of(" ".repeat(tabSize)),
          EditorView.theme({
            "&": { fontSize: `${fontSize}px` },
            ".cm-content, .cm-gutter": { fontFamily: fontFamily, fontSize: `${fontSize}px` }
          }),
          ...(wordWrap ? [EditorView.lineWrapping] : [])
        ]),
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
  }, [roomId]); // Do not recreate Y.Doc on username/color changes

  // Update Yjs awareness when username or color changes
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: username || 'Anonymous',
        color: color || '#E06C75',
        colorLight: (color || '#E06C75') + '40',
      });
    }
  }, [username, color]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.LANG_CHANGE, ({ language: newLang }) => {
        if (newLang && LANGUAGES[newLang]) {
          setLanguage(newLang);
          if (editorRef.current) {
            editorRef.current.dispatch({
              effects: langCompartment.current.reconfigure([ LANGUAGES[newLang].ext(), syntaxLinter ]),
            });
            forceLinting(editorRef.current);
          }
        }
      });

      // Request current room language now that listener is ready
      socketRef.current.emit('request_language', { roomId });
    }

    return () => {
      socketRef.current?.off(ACTIONS.LANG_CHANGE);
    };
  }, [socketRef.current]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? vscodeDark : vscodeLight),
      });
    }
  }, [theme]);

  // Keep a ref to the provider to update awareness later
  const providerRef = useRef(null);

  useEffect(() => {
    if (providerRef.current) {
      const state = providerRef.current.awareness.getLocalState();
      if (state && state.user && (state.user.name !== username || state.user.color !== color)) {
        providerRef.current.awareness.setLocalStateField('user', {
          ...state.user,
          name: username || 'Anonymous',
          color: color || '#E06C75',
          colorLight: (color || '#E06C75') + '40',
        });
      }
    }
  }, [username, color]);

  useEffect(() => {
    if (editorRef.current) {
      const extensions = [
        EditorState.tabSize.of(tabSize),
        indentUnit.of(" ".repeat(tabSize)),
        EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
          ".cm-content, .cm-gutter": { fontFamily: fontFamily, fontSize: `${fontSize}px` }
        })
      ];
      if (wordWrap) extensions.push(EditorView.lineWrapping);

      editorRef.current.dispatch({
        effects: settingsCompartment.current.reconfigure(extensions),
      });
    }
  }, [fontSize, fontFamily, tabSize, wordWrap]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    if (editorRef.current) {
      editorRef.current.dispatch({
        effects: langCompartment.current.reconfigure([ LANGUAGES[newLang].ext(), syntaxLinter ]),
      });
      forceLinting(editorRef.current);
    }

    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.LANG_CHANGE, { roomId, language: newLang });
    }
  };

  return (
    <div className='flex flex-col h-screen relative'>
      <div className='langSelectBar flex items-center justify-between'>
        <div className="flex items-center gap-2">
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
        
        <div className="settingsWrapper relative ml-auto flex items-center" ref={settingsRef}>
          <button onClick={() => setSettingsOpen(!settingsOpen)} title="Editor Settings" className="settingsBtn p-1 rounded transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          {settingsOpen && (
            <div className="settingsMenu absolute right-0 top-full mt-2 w-64 rounded shadow-xl z-50 p-4 flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <label>Font Family</label>
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="p-1 rounded">
                  <option value='Consolas, "Courier New", monospace'>Consolas / Courier</option>
                  <option value='"Fira Code", monospace'>Fira Code</option>
                  <option value='"Source Code Pro", monospace'>Source Code Pro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label>Font Size: {fontSize}px</label>
                <input type="range" min="12" max="24" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1">
                <label>Tab Size</label>
                <select value={tabSize} onChange={e => setTabSize(Number(e.target.value))} className="p-1 rounded">
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input type="checkbox" id="word-wrap" checked={wordWrap} onChange={e => setWordWrap(e.target.checked)} />
                <label htmlFor="word-wrap">Word Wrap</label>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='flex-1 overflow-auto' id="realtimeEditor"></div>
    </div>
  )
}

export default CodeEditor

