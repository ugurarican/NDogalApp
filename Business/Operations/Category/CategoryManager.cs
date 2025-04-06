using Microsoft.EntityFrameworkCore;
using NDogalApp.Business.Operations.Category.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Entities;
using NDogalApp.Data.Repositories;
using NDogalApp.Data.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Category
{
    // ICategoryService arayüzünü implemente eden sınıf.
    public class CategoryManager : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<CategoryEntity> _categoryRepository;

        // Constructor Injection
        public CategoryManager(IUnitOfWork unitOfWork, IRepository<CategoryEntity> categoryRepository)
        {
            _unitOfWork = unitOfWork;
            _categoryRepository = categoryRepository;
        }

        // Yeni kategori ekleme
        public async Task<ServiceMessage> AddCategoryAsync(AddCategoryDto categoryDto)
        {
            // Kategori adı zaten var mı kontrol et (Büyük/küçük harf duyarsız)
            var existingCategory = await _categoryRepository.GetAsync(c => c.Name.ToLower() == categoryDto.Name.ToLower());
            if (existingCategory != null)
            {
                return new ServiceMessage { IsSucceed = false, Message = "Bu kategori adı zaten mevcut." };
            }

            // Yeni CategoryEntity oluştur
            var categoryEntity = new CategoryEntity
            {
                Name = categoryDto.Name,
                Description = categoryDto.Description
            };

            // Repository'ye ekle ve değişiklikleri kaydet
            await _categoryRepository.AddAsync(categoryEntity);
            try
            {
                await _unitOfWork.SaveChangesAsync();
                return new ServiceMessage { IsSucceed = true };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Kategori eklenirken bir veritabanı hatası oluştu." };
            }
        }

        // Kategori güncelleme
        public async Task<ServiceMessage> UpdateCategoryAsync(UpdateCategoryDto categoryDto)
        {
            // 1. Güncellenecek kategoriyi bul
            var categoryEntity = await _categoryRepository.GetByIdAsync(categoryDto.Id);
            if (categoryEntity == null)
            {
                return new ServiceMessage { IsSucceed = false, Message = "Güncellenecek kategori bulunamadı." };
            }

            // 2. İsim değişikliği varsa, yeni ismin başka bir kategoride kullanılıp kullanılmadığını kontrol et
            if (categoryEntity.Name.ToLower() != categoryDto.Name.ToLower())
            {
                var existingCategory = await _categoryRepository.GetAsync(c => c.Name.ToLower() == categoryDto.Name.ToLower() && c.Id != categoryDto.Id);
                if (existingCategory != null)
                {
                    return new ServiceMessage { IsSucceed = false, Message = "Bu kategori adı başka bir kategori tarafından kullanılıyor." };
                }
            }

            // 3. Entity'yi güncelle
            categoryEntity.Name = categoryDto.Name;
            categoryEntity.Description = categoryDto.Description;
            // ModifiedDate DbContext interceptor tarafından ayarlanacak

            // 4. Repository üzerinden güncelleme (State'i Modified yapar) ve kaydet
            await _categoryRepository.UpdateAsync(categoryEntity); // Bu sadece state'i değiştirir
            try
            {
                await _unitOfWork.SaveChangesAsync(); // Değişiklikleri kaydeder
                return new ServiceMessage { IsSucceed = true };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Kategori güncellenirken bir veritabanı hatası oluştu." };
            }
        }

        // Kategori silme (Soft Delete)
        public async Task<ServiceMessage> DeleteCategoryAsync(int id)
        {
            // Kategoriyi bulmaya gerek yok, DeleteAsync zaten kontrol edecek.
            // Ancak silmeden önce bu kategoriye bağlı ürün var mı kontrol etmek isteyebiliriz.
            // Bu kontrolü burada veya Repository/DbContext seviyesinde yapmak yerine,
            // veritabanı kısıtlamasına (OnDelete Restrict) güvenmek daha doğru olabilir.
            // Eğer FK kısıtlaması olmasaydı, burada kontrol gerekirdi:
            // var category = await _categoryRepository.GetByIdAsync(id);
            // if (category != null && category.Products.Any()) { return ServiceMessage(false, "Bu kategoriye ait ürünler olduğundan silinemez."); }

            try
            {
                await _categoryRepository.DeleteAsync(id); // Soft delete işlemini repository yapar
                await _unitOfWork.SaveChangesAsync();    // Değişikliği kaydet
                return new ServiceMessage { IsSucceed = true };
            }
            catch (DbUpdateException dbEx) // FK kısıtlaması nedeniyle hata alırsak (OnDelete Restrict)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Bu kategoriye bağlı ürünler olduğundan silinemedi veya başka bir veritabanı kısıtlaması oluştu." };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Kategori silinirken bir hata oluştu." };
            }
        }

        // ID ile tek kategori getirme
        public async Task<ServiceMessage<CategoryDto?>> GetCategoryByIdAsync(int id)
        {
            var categoryEntity = await _categoryRepository.GetByIdAsync(id);

            if (categoryEntity == null)
            {
                return new ServiceMessage<CategoryDto?> { IsSucceed = false, Message = "Kategori bulunamadı.", Data = null };
            }

            // Entity'yi DTO'ya map'le
            var categoryDto = new CategoryDto
            {
                Id = categoryEntity.Id,
                Name = categoryEntity.Name,
                Description = categoryEntity.Description,
                CreatedTime = categoryEntity.CreatedTime
            };

            return new ServiceMessage<CategoryDto?> { IsSucceed = true, Data = categoryDto };
        }

        // Tüm kategorileri getirme
        public async Task<ServiceMessage<List<CategoryDto>>> GetAllCategoriesAsync()
        {
            var categoryEntities = await _categoryRepository.GetAll().ToListAsync(); // IQueryable'ı listeye çevir

            // Entity listesini DTO listesine map'le
            var categoryDtos = categoryEntities.Select(categoryEntity => new CategoryDto
            {
                Id = categoryEntity.Id,
                Name = categoryEntity.Name,
                Description = categoryEntity.Description,
                CreatedTime = categoryEntity.CreatedTime
            }).ToList();

            return new ServiceMessage<List<CategoryDto>> { IsSucceed = true, Data = categoryDtos };
        }
    }
}