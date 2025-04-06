using NDogalApp.Business.Operations.Category.Dtos; // DTO'lar için
using NDogalApp.Business.Types; // ServiceMessage için
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Category
{
    // Kategori CRUD işlemleri ve listeleme için servis arayüzü.
    public interface ICategoryService
    {
        // Yeni kategori ekler.
        Task<ServiceMessage> AddCategoryAsync(AddCategoryDto categoryDto);

        // Mevcut kategoriyi günceller.
        Task<ServiceMessage> UpdateCategoryAsync(UpdateCategoryDto categoryDto);

        // Kategoriyi siler (Soft Delete).
        Task<ServiceMessage> DeleteCategoryAsync(int id);

        // ID ile tek bir kategori getirir.
        Task<ServiceMessage<CategoryDto?>> GetCategoryByIdAsync(int id);

        // Tüm kategorileri getirir.
        Task<ServiceMessage<List<CategoryDto>>> GetAllCategoriesAsync();
    }
}