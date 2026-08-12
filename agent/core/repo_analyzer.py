import os
import json
from typing import Dict, List, Optional, Set
from dataclasses import dataclass
from pathlib import Path
import re

@dataclass
class FileInfo:
    path: str
    language: str
    size: int
    imports: List[str]
    exports: List[str]
    functions: List[str]
    classes: List[str]
    dependencies: List[str]

@dataclass
class RepoStructure:
    root: str
    frontend_path: Optional[str]
    backend_path: Optional[str]
    database_path: Optional[str]
    config_files: List[str]
    languages: Dict[str, int]
    file_tree: Dict

class FullStackAnalyzer:
    FRAMEWORK_PATTERNS = {
        'react': ['react', 'react-dom', 'jsx', 'tsx'],
        'vue': ['vue', 'vuex', 'vue-router'],
        'angular': ['@angular/', 'angular'],
        'next': ['next', 'next.js'],
        'express': ['express', 'express.js'],
        'fastapi': ['fastapi', 'uvicorn'],
        'django': ['django', 'settings.py'],
        'flask': ['flask', 'Flask'],
        'rails': ['rails', 'ruby'],
        'spring': ['spring', 'java'],
    }
    
    LANG_EXTENSIONS = {
        'python': ['.py', '.pyi'],
        'javascript': ['.js', '.jsx', '.mjs'],
        'typescript': ['.ts', '.tsx'],
        'java': ['.java'],
        'ruby': ['.rb'],
        'go': ['.go'],
        'rust': ['.rs'],
        'php': ['.php'],
        'html': ['.html', '.htm'],
        'css': ['.css', '.scss', '.sass', '.less'],
        'sql': ['.sql'],
    }
    
    def __init__(self):
        self.ignored_dirs = {'.git', 'node_modules', '__pycache__', 'venv', '.venv', 
                            'dist', 'build', '.next', 'coverage', '.idea', 'vendor'}
    
    def analyze(self, repo_path: str) -> RepoStructure:
        repo_path = Path(repo_path).expanduser().resolve()
        if not repo_path.exists():
            raise FileNotFoundError(f"Repository not found: {repo_path}")
        if not repo_path.is_dir():
            raise ValueError(f"Repository path must be a directory: {repo_path}")

        allowed_prefixes = [Path.home().resolve(), Path('/tmp').resolve(), Path('/workspaces').resolve(), Path('/home').resolve()]
        if not any(repo_path == allowed_root or repo_path.is_relative_to(allowed_root) for allowed_root in allowed_prefixes):
            raise ValueError(f"Repository path outside allowed directories: {repo_path}")
        
        structure = RepoStructure(
            root=str(repo_path),
            frontend_path=None,
            backend_path=None,
            database_path=None,
            config_files=[],
            languages={},
            file_tree={}
        )
        
        structure.file_tree = self._build_tree(repo_path)
        structure.languages = self._analyze_languages(repo_path)
        structure.config_files = self._find_config_files(repo_path)
        structure.frontend_path = self._detect_frontend(repo_path)
        structure.backend_path = self._detect_backend(repo_path)
        
        return structure
    
    def _build_tree(self, path: Path, depth: int = 0, max_depth: int = 4) -> Dict:
        if depth > max_depth:
            return {}
        tree = {}
        try:
            for item in sorted(path.iterdir()):
                if item.name.startswith('.') or item.name in self.ignored_dirs:
                    continue
                if item.is_dir():
                    tree[item.name + '/'] = self._build_tree(item, depth + 1, max_depth)
                else:
                    tree[item.name] = None
        except PermissionError:
            pass
        return tree
    
    def _analyze_languages(self, repo_path: Path) -> Dict[str, int]:
        languages = {}
        for ext, lang in self.LANG_EXTENSIONS.items():
            count = sum(1 for _ in repo_path.rglob(f'*{ext}'))
            if count > 0:
                languages[lang] = count
        return dict(sorted(languages.items(), key=lambda x: x[1], reverse=True))
    
    def _find_config_files(self, repo_path: Path) -> List[str]:
        config_names = {
            'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
            'pom.xml', 'Gemfile', 'composer.json', 'pyproject.toml',
            '.env', '.env.example', 'docker-compose.yml', 'Dockerfile',
            'tsconfig.json', 'webpack.config.js', 'vite.config.js'
        }
        configs = []
        for config in config_names:
            found = list(repo_path.rglob(config))
            configs.extend([str(f.relative_to(repo_path)) for f in found])
        return configs
    
    def _detect_frontend(self, repo_path: Path) -> Optional[str]:
        indicators = ['src/', 'components/', 'pages/', 'public/', 'assets/',
                     'package.json', 'tsconfig.json', 'vite.config.js', 'next.config.js']
        for indicator in indicators:
            found = list(repo_path.rglob(indicator))
            if found:
                return str(found[0].parent.relative_to(repo_path))
        frontend_dir = repo_path / 'frontend'
        if frontend_dir.exists():
            return 'frontend'
        client_dir = repo_path / 'client'
        if client_dir.exists():
            return 'client'
        return None
    
    def _detect_backend(self, repo_path: Path) -> Optional[str]:
        indicators = ['app.py', 'main.py', 'server.py', 'api/', 'routes/',
                     'requirements.txt', 'Cargo.toml', 'go.mod']
        for indicator in indicators:
            found = list(repo_path.rglob(indicator))
            if found:
                return str(found[0].parent.relative_to(repo_path))
        backend_dir = repo_path / 'backend'
        if backend_dir.exists():
            return 'backend'
        server_dir = repo_path / 'server'
        if server_dir.exists():
            return 'server'
        api_dir = repo_path / 'api'
        if api_dir.exists():
            return 'api'
        return None
    
    def analyze_file(self, file_path: str) -> FileInfo:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = path.suffix.lower()
        language = self._get_language(ext)
        content = self._read_file_safe(path)
        
        return FileInfo(
            path=str(path),
            language=language,
            size=path.stat().st_size,
            imports=self._extract_imports(content, language),
            exports=self._extract_exports(content, language),
            functions=self._extract_functions(content, language),
            classes=self._extract_classes(content, language),
            dependencies=self._extract_dependencies(path, language)
        )
    
    def _get_language(self, ext: str) -> str:
        ext = ext.lower()
        for lang, extensions in self.LANG_EXTENSIONS.items():
            if ext in extensions:
                return lang
        return 'unknown'
    
    def _read_file_safe(self, path: Path) -> str:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return ""
    
    def _extract_imports(self, content: str, language: str) -> List[str]:
        imports = []
        patterns = {
            'python': r'^(?:import|from)\s+[\w.]+',
            'javascript': r'^(?:import|require)\s*[({\'"][\w@/-]+',
            'typescript': r'^(?:import|require)\s*[({\'"][\w@/-]+',
            'java': r'^import\s+[\w.]+',
            'go': r'^import\s+[\w./"]+',
        }
        if language in patterns:
            imports = re.findall(patterns[language], content, re.MULTILINE)
        return imports[:50]
    
    def _extract_exports(self, content: str, language: str) -> List[str]:
        exports = []
        patterns = {
            'javascript': r'export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)',
            'typescript': r'export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)?\s*(\w+)',
        }
        if language in patterns:
            exports = re.findall(patterns[language], content)
        return exports[:30]
    
    def _extract_functions(self, content: str, language: str) -> List[str]:
        functions = []
        patterns = {
            'python': r'^def\s+(\w+)\s*\(',
            'javascript': r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>)',
            'typescript': r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>)',
        }
        if language in patterns:
            matches = re.findall(patterns[language], content, re.MULTILINE)
            functions = [m[0] if isinstance(m, tuple) else m for m in matches]
        return functions[:50]
    
    def _extract_classes(self, content: str, language: str) -> List[str]:
        classes = []
        patterns = {
            'python': r'^class\s+(\w+)',
            'javascript': r'class\s+(\w+)',
            'typescript': r'class\s+(\w+)',
            'java': r'class\s+(\w+)',
        }
        if language in patterns:
            classes = re.findall(patterns[language], content, re.MULTILINE)
        return classes[:30]
    
    def _extract_dependencies(self, path: Path, language: str) -> List[str]:
        deps = []
        parent = path.parent
        
        pkg_json = parent / 'package.json'
        if pkg_json.exists():
            try:
                data = json.loads(self._read_file_safe(pkg_json))
                deps.extend(list(data.get('dependencies', {}).keys()))
                deps.extend(list(data.get('devDependencies', {}).keys()))
            except:
                pass
        
        req_txt = parent / 'requirements.txt'
        if req_txt.exists():
            try:
                content = self._read_file_safe(req_txt)
                deps.extend([line.split('=')[0].split('==')[0].strip() 
                           for line in content.split('\n') if line.strip() and not line.startswith('#')])
            except:
                pass
        
        return deps[:100]
    
    def generate_summary(self, repo_structure: RepoStructure) -> str:
        summary = f"# Repository Analysis: {Path(repo_structure.root).name}\n\n"
        summary += "## Structure\n"
        summary += f"- Root: {repo_structure.root}\n"
        summary += f"- Frontend: {repo_structure.frontend_path or 'Not detected'}\n"
        summary += f"- Backend: {repo_structure.backend_path or 'Not detected'}\n\n"
        summary += "## Languages\n"
        for lang, count in repo_structure.languages.items():
            summary += f"- {lang}: {count} files\n"
        summary += "\n## Config Files\n"
        for cfg in repo_structure.config_files[:10]:
            summary += f"- {cfg}\n"
        return summary
