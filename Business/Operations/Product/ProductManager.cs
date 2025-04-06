using Microsoft.EntityFrameworkCore;
using NDogalApp.Business.Operations.Product.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Entities;
using NDogalApp.Data.Repositories;
using NDogalApp.Data.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Product
{
    // IProductService arayüzünü implemente eden sınıf.
    public class ProductManager : IProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<ProductEntity> _productRepository;
        private readonly IRepository<CategoryEntity> _categoryRepository; // CategoryId kontrolü için

        // Constructor Injection
        public ProductManager(IUnitOfWork unitOfWork, IRepository<ProductEntity> productRepository, IRepository<CategoryEntity> categoryRepository)
        {
            _unitOfWork = unitOfWork;
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        // Yeni ürün ekleme
        public async Task<ServiceMessage> AddProductAsync(AddProductDto productDto)
        {
            // 1. Kategori ID'si geçerli mi kontrol et
            var categoryExists = await _categoryRepository.GetByIdAsync(productDto.CategoryId);
            if (categoryExists == null)
            {
                return new ServiceMessage { IsSucceed = false, Message = "Belirtilen kategori bulunamadı." };
            }

            // 2. Yeni ProductEntity oluştur
            var productEntity = new ProductEntity
            {
                Name = productDto.Name,
                Description = productDto.Description,
                Price = productDto.Price,
                StockQuantity = productDto.StockQuantity,
                ImageUrl = productDto.ImageUrl,
                CategoryId = productDto.CategoryId
            };

            // 3. Repository'ye ekle ve kaydet
            await _productRepository.AddAsync(productEntity);
            try
            {
                await _unitOfWork.SaveChangesAsync();
                return new ServiceMessage { IsSucceed = true };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Ürün eklenirken bir veritabanı hatası oluştu." };
            }
        }

        // Ürün güncelleme
        public async Task<ServiceMessage> UpdateProductAsync(UpdateProductDto productDto)
        {
            // 1. Güncellenecek ürünü bul
            var productEntity = await _productRepository.GetByIdAsync(productDto.Id);
            if (productEntity == null)
            {
                return new ServiceMessage { IsSucceed = false, Message = "Güncellenecek ürün bulunamadı." };
            }

            // 2. Yeni Kategori ID'si geçerli mi kontrol et
            if (productEntity.CategoryId != productDto.CategoryId)
            {
                var categoryExists = await _categoryRepository.GetByIdAsync(productDto.CategoryId);
                if (categoryExists == null)
                {
                    return new ServiceMessage { IsSucceed = false, Message = "Belirtilen yeni kategori bulunamadı." };
                }
            }

            // 3. Entity'yi güncelle
            productEntity.Name = productDto.Name;
            productEntity.Description = productDto.Description;
            productEntity.Price = productDto.Price;
            productEntity.StockQuantity = productDto.StockQuantity;
            productEntity.ImageUrl = productDto.ImageUrl;
            productEntity.CategoryId = productDto.CategoryId;

            // 4. Repository üzerinden güncelle ve kaydet
            await _productRepository.UpdateAsync(productEntity);
            try
            {
                await _unitOfWork.SaveChangesAsync();
                return new ServiceMessage { IsSucceed = true };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Ürün güncellenirken bir veritabanı hatası oluştu." };
            }
        }

        // Ürün silme (Soft Delete)
        public async Task<ServiceMessage> DeleteProductAsync(int id)
        {
            try
            {
                await _productRepository.DeleteAsync(id); // Soft delete
                await _unitOfWork.SaveChangesAsync();
                return new ServiceMessage { IsSucceed = true };
            }
            catch (DbUpdateException dbEx) // İlişkili veri nedeniyle silinemezse (örn: OrderItem'da Restrict varsa)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Bu ürüne bağlı sipariş kaydı gibi ilişkili veriler olduğundan silinemedi veya başka bir veritabanı kısıtlaması oluştu." };
            }
            catch (Exception ex)
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Ürün silinirken bir hata oluştu." };
            }
        }

        // ID ile tek ürün getirme (Projection ile)
        public async Task<ServiceMessage<ProductDto?>> GetProductByIdAsync(int id)
        {
            var productDto = await _productRepository
                .GetAll(p => p.Id == id) // IQueryable döndüren GetAll kullanılır
                .Select(p => new ProductDto // Veritabanı sorgusuna Select eklenir
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    ImageUrl = p.ImageUrl,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    CreatedTime = p.CreatedTime
                })
                .FirstOrDefaultAsync(); // Sorgu çalıştırılır

            if (productDto == null)
            {
                return new ServiceMessage<ProductDto?> { IsSucceed = false, Message = "Ürün bulunamadı.", Data = null };
            }

            return new ServiceMessage<ProductDto?> { IsSucceed = true, Data = productDto };
        }

        // Tüm ürünleri getirme (Projection ile)
        public async Task<ServiceMessage<List<ProductDto>>> GetAllProductsAsync()
        {
            var productDtos = await _productRepository
                .GetAll() // Tüm ürünler için IQueryable
                .Select(p => new ProductDto // Projection
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    ImageUrl = p.ImageUrl,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    CreatedTime = p.CreatedTime
                })
                .ToListAsync(); // Sorguyu çalıştır ve listeye çevir

            return new ServiceMessage<List<ProductDto>> { IsSucceed = true, Data = productDtos };
        }

        // Kategoriye göre ürünleri getirme (Projection ile)
        public async Task<ServiceMessage<List<ProductDto>>> GetProductsByCategoryIdAsync(int categoryId)
        {
            var categoryExists = await _categoryRepository.GetByIdAsync(categoryId);
            if (categoryExists == null)
            {
                return new ServiceMessage<List<ProductDto>> { IsSucceed = false, Message = "Belirtilen kategori bulunamadı.", Data = new List<ProductDto>() };
            }

            var productDtos = await _productRepository
                .GetAll(p => p.CategoryId == categoryId) // Kategoriye göre filtrele
                .Select(p => new ProductDto // Projection
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    ImageUrl = p.ImageUrl,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    CreatedTime = p.CreatedTime
                })
                .ToListAsync();

            return new ServiceMessage<List<ProductDto>> { IsSucceed = true, Data = productDtos };
        }
        public async Task<ServiceMessage> PatchProductAsync(int id, PatchProductDto patchDto)
        {
            // 1. Güncellenecek ürünü veritabanından bul.
            var productEntity = await _productRepository.GetByIdAsync(id);
            if (productEntity == null)
            {
                return new ServiceMessage { IsSucceed = false, Message = "Güncellenecek ürün bulunamadı." };
            }

            bool hasChanges = false; // Herhangi bir değişiklik yapıldı mı?

            // 2. DTO'daki her alan için kontrol yap ve null değilse uygula.
            if (patchDto.Name != null)
            {
                if (string.IsNullOrWhiteSpace(patchDto.Name))
                {
                    return new ServiceMessage { IsSucceed = false, Message = "Ürün adı boş olamaz." };
                }
                if (productEntity.Name != patchDto.Name)
                {
                    // İsteğe bağlı: İsim tekilliği kontrolü eklenebilir.
                    productEntity.Name = patchDto.Name;
                    hasChanges = true;
                }
            }

            // Description null veya boş string olabilir. patchDto.Description null değilse güncelle.
            if (patchDto.Description != null)
            {
                if (productEntity.Description != patchDto.Description)
                {
                    productEntity.Description = patchDto.Description;
                    hasChanges = true;
                }
            }

            if (patchDto.Price.HasValue)
            {
                if (patchDto.Price.Value <= 0)
                {
                    return new ServiceMessage { IsSucceed = false, Message = "Fiyat 0'dan büyük olmalıdır." };
                }
                if (productEntity.Price != patchDto.Price.Value)
                {
                    productEntity.Price = patchDto.Price.Value;
                    hasChanges = true;
                }
            }

            if (patchDto.StockQuantity.HasValue)
            {
                if (patchDto.StockQuantity.Value < 0)
                {
                    return new ServiceMessage { IsSucceed = false, Message = "Stok miktarı 0'dan küçük olamaz." };
                }
                if (productEntity.StockQuantity != patchDto.StockQuantity.Value)
                {
                    productEntity.StockQuantity = patchDto.StockQuantity.Value;
                    hasChanges = true;
                }
            }

            // ImageUrl null veya boş string olabilir.
            if (patchDto.ImageUrl != null)
            {
                // İsteğe bağlı: URL geçerlilik kontrolü eklenebilir.
                if (productEntity.ImageUrl != patchDto.ImageUrl)
                {
                    productEntity.ImageUrl = patchDto.ImageUrl;
                    hasChanges = true;
                }
            }

            if (patchDto.CategoryId.HasValue)
            {
                if (productEntity.CategoryId != patchDto.CategoryId.Value)
                {
                    // Yeni kategori ID'si geçerli mi kontrol et.
                    var categoryExists = await _categoryRepository.GetByIdAsync(patchDto.CategoryId.Value);
                    if (categoryExists == null)
                    {
                        return new ServiceMessage { IsSucceed = false, Message = "Belirtilen yeni kategori bulunamadı." };
                    }
                    productEntity.CategoryId = patchDto.CategoryId.Value;
                    hasChanges = true;
                }
            }

            // 3. Eğer hiçbir değişiklik yapılmadıysa, boşuna veritabanına gitme.
            if (!hasChanges)
            {
                return new ServiceMessage { IsSucceed = true, Message = "Güncellenecek bir değişiklik bulunmadı." };
            }

            // 4. Değişiklikleri kaydet.
            await _productRepository.UpdateAsync(productEntity);
            try
            {
                await _unitOfWork.SaveChangesAsync();
                return new ServiceMessage { IsSucceed = true, Message = "Ürün başarıyla güncellendi." };
            }
            catch (DbUpdateException ex) 
            {
                // Hata loglama
                return new ServiceMessage { IsSucceed = false, Message = $"Ürün güncellenirken bir veritabanı hatası oluştu: {ex.InnerException?.Message ?? ex.Message}" };
            }
            catch (Exception ex)
            {
                // Genel hata loglama
                return new ServiceMessage { IsSucceed = false, Message = "Ürün güncellenirken beklenmedik bir hata oluştu." };
            }
        }
    }
}