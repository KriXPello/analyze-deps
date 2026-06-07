# analyze-deps

CLI-утилита для анализа зависимостей пакетов. Обёртка над `pnpm why`.

Утилита показывает только те зависимости, которые установлены в проекте, в папке которого выполняется.

## Установка

```bash
git clone https://github.com/KriXPello/analyze-deps.git
cd analyze-deps
npm ci
npm run setup
```

## Использование

```bash
analyze-deps <pkg1> [<pkg2> ...]
```

### Примеры

Анализ одного пакета:
```bash
analyze-deps lodash
```

Анализ нескольких пакетов:
```bash
analyze-deps lodash react typescript
```

Анализ конкретной версии:
```bash
analyze-deps lodash@4.17.21
```

## Пример вывода

`package.json` проекта:
```json
{
  "dependencies": {
    "webpack": "5.90.0",
    "react": "18.2.0",
    "lodash": "4.17.21",
    "express": "4.18.2",
    "debug": "4.3.4"
  }
}
```

Дерево зависимостей webpack (результат `pnpm why webpack`):

```
webpack@5.90.0
├── css-loader@7.1.0
│   └── postcss@8.4.35
│       ├── postcss-values-parser@6.0.2
│       ├── postcss-modules@6.0.0
│       └── semver@7.5.4
├── babel-loader@9.1.3
│   └── @babel/core@7.24.0
│       └── @babel/preset-env@7.24.0
│           ├── core-js@3.36.0
│           └── babel-helpers@7.24.0
├── react@18.2.0
│   ├── react-dom@18.2.0
│   │   └── scheduler@0.23.0
│   └── lodash@4.16.21
│       └── express@4.18.2
│           └── debug@4.3.4
└── lodash@4.17.20
    └── express@4.18.2
        └── debug@4.3.4
```

Команда:
```bash
analyze-deps webpack
```

Результат:
```
Package: webpack@5.90.0
webpack@5.90.0
├──lodash@4.17.20
│  └──express@4.18.2
│     └──debug@4.3.4
└──react@18.2.0
   └──lodash@4.16.21
```

Утилита показывает только те зависимости, которые присутствуют в `package.json` проекта.