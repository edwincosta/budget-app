import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import api from "@/services/api";
import { useBudget } from "@/contexts/BudgetContext";
import { useUXComponents } from "@/hooks/useUXComponents";

interface Category {
  id: string;
  name: string;
  color: string;
  type: "INCOME" | "EXPENSE";
  inactive: boolean;
  createdAt: string;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#6b7280",
  "#374151",
];

const Categories = () => {
  const { activeBudget, isOwner } = useBudget();
  const { executeWithUX, confirmDelete, showWarning } = useUXComponents();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: COLORS[0],
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    inactive: false,
  });

  const loadCategories = async () => {
    await executeWithUX(async () => {
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
    }, "Carregando categorias...");
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showWarning("Nome da categoria é obrigatório");
      return;
    }

    const loadingMessage = editingCategory
      ? "Atualizando categoria..."
      : "Criando categoria...";
    const successMessage = editingCategory
      ? "Categoria atualizada com sucesso!"
      : "Categoria criada com sucesso!";

    await executeWithUX(
      async () => {
        if (editingCategory) {
          await api.put(`/categories/${editingCategory.id}`, formData);
        } else {
          await api.post("/categories", formData);
        }

        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({
          name: "",
          color: COLORS[0],
          type: "EXPENSE",
          inactive: false,
        });
        await loadCategories();
      },
      loadingMessage,
      successMessage
    );
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      type: category.type,
      inactive: category.inactive || false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log(`Attempting to delete category with ID: ${id}`);

    confirmDelete("esta categoria", async () => {
      await executeWithUX(
        async () => {
          console.log(`Making DELETE request to /categories/${id}`);
          const response = await api.delete(`/categories/${id}`);
          console.log("Delete response:", response.data);
          await loadCategories();
        },
        "Excluindo categoria...",
        "Categoria excluída com sucesso!"
      );
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      color: COLORS[0],
      type: "EXPENSE",
      inactive: false,
    });
    setIsModalOpen(true);
  };

  const incomeCategories = categories.filter((cat) => cat.type === "INCOME");
  const expenseCategories = categories.filter((cat) => cat.type === "EXPENSE");

  return (
    <div className="space-y-6">
      {/* Banner de acesso compartilhado */}
      {activeBudget && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Visualizando: {activeBudget.budget?.name}
              </h3>
              <p className="text-sm text-blue-600">
                Orçamento compartilhado por {activeBudget.budget?.owner?.name} •
                Permissão:{" "}
                {activeBudget.permission === "READ" ? "Visualização" : "Edição"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Categorias
        </h1>
        {(isOwner || activeBudget?.permission === "WRITE") && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categorias de Receita */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Receitas ({incomeCategories.length})
          </h2>
          <div className="space-y-3">
            {incomeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate">
                      {category.name}
                    </span>
                    {category.inactive && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Nenhuma categoria de receita
              </p>
            )}
          </div>
        </div>

        {/* Categorias de Despesa */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Despesas ({expenseCategories.length})
          </h2>
          <div className="space-y-3">
            {expenseCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate">
                      {category.name}
                    </span>
                    {category.inactive && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Nenhuma categoria de despesa
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Alimentação, Salário..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "INCOME" | "EXPENSE",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color
                          ? "border-gray-900"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.inactive}
                    onChange={(e) =>
                      setFormData({ ...formData, inactive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Categoria inativa
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Categorias inativas não aparecerão como opções para novas
                  transações
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
