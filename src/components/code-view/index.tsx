import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import './style.css';

type CodeViewProps = {
  code: string;
  language: string;
};

export default function CodeView({ code, language }: CodeViewProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  return (
    <pre className="m-0 rounded-none border-none bg-transparent p-2 text-xs">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}
