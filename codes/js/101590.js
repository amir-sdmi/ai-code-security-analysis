const SyntaxHighlightList = ({ handleChooseSyntaxHighlight }) => {
  // Written by ChatGPT :D
  return (
    <ul
      className="dropdown-menu cursor-pointer absolute hidden max-h-72 w-40 overflow-auto bg-[#2b2b2b] pt-1 text-xs text-[#ddd]">
      <li
        className="text-gray-400 whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d] border-b-2 border-dotted border-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('null', 'Syntax highlight')}>None
      </li>
      <li id="syntaxHighlight" className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('arduino', 'Arduino')}>Arduino
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('atom', 'Atom')}>Atom
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('bash', 'Bash')}>Bash
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('basic', 'BASIC')}>BASIC
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('c', 'C')}>C
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('csharp', 'C#')}>C#
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('cpp', 'C++')}>C++
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('clojure', 'Clojure')}>Clojure
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('cmake', 'CMake')}>CMake
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('cobol', 'COBOL')}>COBOL
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('css', 'CSS')}>CSS
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('docker', 'Docker')}>Docker
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('fortran', 'Fortran')}>Fortran
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('git', 'Git')}>Git
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('go', 'Go')}>Go
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('gradle', 'Gradle')}>Gradle
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('haskell', 'Haskell')}>Haskell
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('html', 'HTML')}>HTML
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('java', 'Java')}>Java
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('javascript', 'JavaScript')}>JavaScript
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('json', 'JSON')}>JSON
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('kotlin', 'Kotlin')}>Kotlin
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('lisp', 'Lisp')}>Lisp
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('lua', 'Lua')}>Lua
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('markdown', 'Markdown')}>Markdown
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('markup-templating', 'Markup templating')}>Markup templating
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('mongodb', 'MongoDB')}>MongoDB
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('objectivec', 'Objective-C')}>Objective-C
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('pascal', 'Pascal')}>Pascal
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('perl', 'Perl')}>Perl
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('php', 'PHP')}>PHP
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('powershell', 'PowerShell')}>PowerShell
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('python', 'Python')}>Python
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('jsx', 'React JSX')}>React JSX
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('tsx', 'React TSX')}>React TSX
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('regex', 'Regex')}>Regex
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('robotframework', 'Robot Framework')}>Robot Framework
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('ruby', 'Ruby')}>Ruby
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('rust', 'Rust')}>Rust
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('scala', 'Scala')}>Scala
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('sql', 'SQL')}>SQL
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('swift', 'Swift')}>Swift
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('toml', 'TOML')}>TOML
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('typescript', 'TypeScript')}>TypeScript
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('vim', 'vim')}>vim
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('visual-basic', 'Visual Basic')}>Visual Basic
      </li>
      <li className="whitespace-no-wrap block py-1 px-4 hover:bg-[#403e3d]"
        onClick={() => handleChooseSyntaxHighlight('yaml', 'YAML')}>YAML
      </li>
    </ul>
  )
}

export default SyntaxHighlightList
