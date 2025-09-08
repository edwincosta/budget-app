# ⚙️ GitHub Copilot Configuration

## 🎯 Configuração Específica do Projeto

### Para usar estes arquivos de contexto de forma eficaz:

1. **Use copilot-context.md como fonte única**: Todas as regras de negócio, arquitetura e padrões estão lá
2. **Referencie sempre o contexto principal**: Mencione "seguindo as regras do copilot-context.md"
3. **Use exemplos deste arquivo**: Para snippets e templates específicos do VS Code

### Comandos recomendados para o Copilot:
- `"Seguindo as regras do copilot-context.md, crie uma nova rota para..."`
- `"Baseado na arquitetura budget-centric do sistema, implemente..."`
- `"Considerando as regras de responsividade obrigatórias, ajuste..."`
- `"Seguindo os padrões de validação estabelecidos, valide..."`

## 🔧 Configurações do VS Code (.vscode/settings.json)

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false
  },
  "github.copilot.inlineSuggest.enable": true,
  "github.copilot.suggestions.count": 3,
  "files.associations": {
    ".copilot-*": "markdown"
  }
}
```

## 📝 Snippets Customizados

### TypeScript Route Template
```json
{
  "Budget Route Template": {
    "prefix": "budget-route",
    "body": [
      "// @route   ${1:METHOD} /api/${2:endpoint}",
      "// @desc    ${3:Description}",
      "// @access  Private",
      "router.${4:method}('${5:path}', auth, async (req: AuthRequest, res: Response): Promise<void> => {",
      "  try {",
      "    // Get user's default budget",
      "    const user = await prisma.user.findUnique({",
      "      where: { id: req.user!.id },",
      "      select: { defaultBudgetId: true }",
      "    });",
      "",
      "    if (!user?.defaultBudgetId) {",
      "      res.status(404).json({ message: 'No default budget found' });",
      "      return;",
      "    }",
      "",
      "    // Implementation here",
      "    $0",
      "",
      "    res.json({ success: true });",
      "  } catch (error) {",
      "    console.error('Error in ${3:description}:', error);",
      "    res.status(500).json({ message: 'Internal server error' });",
      "  }",
      "});"
    ],
    "description": "Template for budget API routes"
  }
}
```

### React Component Template
```json
{
  "Budget Component Template": {
    "prefix": "budget-component",
    "body": [
      "import React from 'react';",
      "import { useQuery } from '@tanstack/react-query';",
      "import { api } from '../services/api';",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:type};",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {",
      "  const { data, isLoading, error } = useQuery({",
      "    queryKey: ['${4:queryKey}'],",
      "    queryFn: () => api.${5:apiMethod}()",
      "  });",
      "",
      "  if (isLoading) {",
      "    return (",
      "      <div className=\"flex justify-center items-center p-8\">",
      "        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>",
      "      </div>",
      "    );",
      "  }",
      "",
      "  if (error) {",
      "    return (",
      "      <div className=\"bg-red-50 border border-red-200 rounded-md p-4\">",
      "        <p className=\"text-red-800\">Erro ao carregar dados</p>",
      "      </div>",
      "    );",
      "  }",
      "",
      "  return (",
      "    <div className=\"bg-white rounded-lg shadow p-6\">",
      "      $0",
      "    </div>",
      "  );",
      "};"
    ],
    "description": "Template for React components with API integration"
  }
}
```

### Responsive Component Template
```json
{
  "Responsive Component Template": {
    "prefix": "responsive-component",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:type};",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {",
      "  return (",
      "    <div className=\"bg-white rounded-lg shadow\">",
      "      {/* DESKTOP/TABLET: Table view */}",
      "      <div className=\"hidden md:block\">",
      "        <table className=\"min-w-full\">",
      "          {/* Table content */}",
      "        </table>",
      "      </div>",
      "",
      "      {/* MOBILE: Card view */}",
      "      <div className=\"md:hidden divide-y divide-gray-200\">",
      "        {/* Card content */}",
      "      </div>",
      "    </div>",
      "  );",
      "};"
    ],
    "description": "Template for responsive component with table/card views"
  }
}
```

### Responsive Grid Template
```json
{
  "Responsive Grid Template": {
    "prefix": "responsive-grid",
    "body": [
      "<div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6\">",
      "  $0",
      "</div>"
    ],
    "description": "Responsive grid layout"
  }
}
```

### Mobile Navigation Template
```json
{
  "Mobile Navigation Template": {
    "prefix": "mobile-nav",
    "body": [
      "const [mobileMenuOpen, setMobileMenuOpen] = useState(false);",
      "",
      "return (",
      "  <>",
      "    {/* MOBILE: Header + Hamburger */}",
      "    <div className=\"lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40\">",
      "      <div className=\"flex items-center justify-between p-4\">",
      "        <h1 className=\"text-xl font-semibold text-gray-900\">${1:App Name}</h1>",
      "        <button",
      "          onClick={() => setMobileMenuOpen(true)}",
      "          className=\"p-2 rounded-md text-gray-400 hover:bg-gray-100\"",
      "        >",
      "          <Bars3Icon className=\"h-6 w-6\" />",
      "        </button>",
      "      </div>",
      "    </div>",
      "",
      "    {/* MOBILE: Sidebar overlay */}",
      "    {mobileMenuOpen && (",
      "      <div className=\"lg:hidden fixed inset-0 z-50\">",
      "        <div ",
      "          className=\"fixed inset-0 bg-black opacity-50\" ",
      "          onClick={() => setMobileMenuOpen(false)} ",
      "        />",
      "        <div className=\"fixed left-0 top-0 bottom-0 w-64 bg-white\">",
      "          {/* Navigation items */}",
      "          $0",
      "        </div>",
      "      </div>",
      "    )}",
      "",
      "    {/* TABLET: Bottom Navigation */}",
      "    <nav className=\"hidden sm:block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t\">",
      "      {/* Bottom nav items */}",
      "    </nav>",
      "",
      "    {/* DESKTOP: Sidebar */}",
      "    <div className=\"hidden lg:flex\">",
      "      <nav className=\"w-64 bg-white shadow-sm\">",
      "        {/* Sidebar content */}",
      "      </nav>",
      "      <main className=\"flex-1 overflow-hidden\">",
      "        {/* Main content */}",
      "      </main>",
      "    </div>",
      "  </>",
      ");"
    ],
    "description": "Complete responsive navigation template"
  }
}
```

### Responsive Form Template
```json
{
  "Responsive Form Template": {
    "prefix": "responsive-form",
    "body": [
      "<form onSubmit={handleSubmit(onSubmit)} className=\"space-y-4 md:space-y-6\">",
      "  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6\">",
      "    {/* Form fields */}",
      "    <div className=\"md:col-span-1\">",
      "      <label className=\"block text-sm font-medium text-gray-700 mb-1\">",
      "        ${1:Field Label}",
      "      </label>",
      "      <input",
      "        type=\"${2:text}\"",
      "        className=\"w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base\"",
      "        placeholder=\"${3:Placeholder}\"",
      "      />",
      "    </div>",
      "  </div>",
      "",
      "  {/* Responsive buttons */}",
      "  <div className=\"flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t\">",
      "    <button",
      "      type=\"button\"",
      "      className=\"w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50\"",
      "    >",
      "      Cancelar",
      "    </button>",
      "    <button",
      "      type=\"submit\"",
      "      className=\"w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700\"",
      "    >",
      "      ${4:Submit Text}",
      "    </button>",
      "  </div>",
      "</form>"
    ],
    "description": "Responsive form with grid layout and buttons"
  }
}
```

---

**Como usar estes arquivos:**

1. Coloque todos os arquivos na raiz do projeto
2. Sempre referencie o contexto nas suas interações com o Copilot
3. Mantenha os arquivos atualizados conforme o projeto evolui

**Comandos para o Copilot:**
- "Seguindo as regras do .copilot-context.md..."
- "Baseado nos exemplos do .copilot-examples.md..."
- "Implementar seguindo os padrões estabelecidos..."
