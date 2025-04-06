using NDogalApp.Business.Operations.Product.Dtos;
using NDogalApp.Business.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Product
{
    // Ürün CRUD işlemleri ve listeleme için servis arayüzü.
    public interface IProductService
    {
        // Yeni ürün ekler.
        Task<ServiceMessage> AddProductAsync(AddProductDto productDto);

        // Mevcut ürünü günceller.
        Task<ServiceMessage> UpdateProductAsync(UpdateProductDto productDto);

        // Ürünü siler (Soft Delete).
        Task<ServiceMessage> DeleteProductAsync(int id);

        // ID ile tek bir ürün getirir (Kategori adı dahil).
        Task<ServiceMessage<ProductDto?>> GetProductByIdAsync(int id);

        // Tüm ürünleri getirir (Kategori adları dahil).
        Task<ServiceMessage<List<ProductDto>>> GetAllProductsAsync();

        // Belirli bir kategorideki ürünleri getirir (Kategori adları dahil).
        Task<ServiceMessage<List<ProductDto>>> GetProductsByCategoryIdAsync(int categoryId);

        Task<ServiceMessage> PatchProductAsync(int id, PatchProductDto patchDto);
    }
}