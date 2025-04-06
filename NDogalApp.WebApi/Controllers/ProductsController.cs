using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NDogalApp.Business.Operations.Product;
using NDogalApp.Business.Operations.Product.Dtos;
using NDogalApp.Business.Types;
using NDogalApp.Data.Enums;
using NDogalApp.WebApi.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")] // Route: api/products
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        // Constructor ile IProductService bağımlılığını alıyoruz (Dependency Injection)
        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        // --- GET Endpoints ---

        // GET: api/products
        // Tüm ürünleri veya kategoriye göre filtrelenmiş ürünleri listeler.
        [HttpGet]
        [AllowAnonymous] // Herkes ürünleri listeleyebilir
        public async Task<IActionResult> GetProducts([FromQuery] int? categoryId)
        {
            ServiceMessage<List<ProductDto>> result;

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                // Kategoriye göre filtrele
                result = await _productService.GetProductsByCategoryIdAsync(categoryId.Value);
            }
            else
            {
                // Tüm ürünleri getir
                result = await _productService.GetAllProductsAsync();
            }

            if (result.IsSucceed)
            {
                return Ok(result.Data); // ProductDto listesi
            }
            else
            {
                // Kategori bulunamadı (GetProductsByCategoryIdAsync'ten gelebilir)
                if (result.Message != null && result.Message.Contains("kategori bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                // Genel hata
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Ürünler getirilirken bir hata oluştu." });
            }
        }

        // GET: api/products/{id}
        // Belirli bir ürünü ID ile getirir.
        [HttpGet("{id}")]
        [AllowAnonymous] // Herkes ürün detayını görebilir
        public async Task<IActionResult> GetProductById(int id)
        {
            var result = await _productService.GetProductByIdAsync(id);

            if (result.IsSucceed)
            {
                if (result.Data != null)
                {
                    return Ok(result.Data); // ProductDto
                }
                else
                {
                    return NotFound(new { Message = result.Message ?? $"ID'si {id} olan ürün bulunamadı." });
                }
            }
            else
            {
                // Ürün bulunamadı veya başka bir hata
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Ürün getirilirken bir hata oluştu." });
            }
        }

        // --- POST Endpoint ---

        // POST: api/products
        // Yeni bir ürün ekler. Sadece Admin erişebilir.
        [HttpPost]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> AddProduct([FromBody] AddProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var addProductDto = new AddProductDto
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId
            };

            var result = await _productService.AddProductAsync(addProductDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Ürün başarıyla eklendi." });
            }
            else
            {
                // Kategori bulunamadı veya başka bir iş mantığı/veritabanı hatası.
                if (result.Message != null && result.Message.Contains("kategori bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { Message = result.Message }); // Kategori ID'si geçersiz
                }
                // Başka bir hata (örn: veritabanı hatası)
                return BadRequest(new { Message = result.Message });
            }
        }

        // --- PUT Endpoint ---

        // PUT: api/products/{id}
        // Mevcut bir ürünü günceller (Tüm alanlar gönderilmelidir). Sadece Admin erişebilir.
        [HttpPut("{id}")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updateProductDto = new UpdateProductDto
            {
                Id = id, // URL'den gelen ID'yi kullan
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId
            };

            var result = await _productService.UpdateProductAsync(updateProductDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Ürün başarıyla güncellendi." });
            }
            else
            {
                // Ürün veya Kategori bulunamadı veya başka bir hata.
                if (result.Message != null && (result.Message.Contains("ürün bulunamadı", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("kategori bulunamadı", StringComparison.OrdinalIgnoreCase)))
                {
                    return NotFound(new { Message = result.Message });
                }
                return BadRequest(new { Message = result.Message });
            }
        }

        // --- PATCH Endpoint ---

        // PATCH: api/products/{id}
        // Belirli bir ürünün sadece gönderilen alanlarını günceller. Sadece Admin erişebilir.
        [HttpPatch("{id}")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> PatchProduct(int id, [FromBody] PatchProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var patchDto = new PatchProductDto
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId
            };

            var result = await _productService.PatchProductAsync(id, patchDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Ürün başarıyla güncellendi." });
            }
            else
            {
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                return BadRequest(new { Message = result.Message });
            }
        }

        // --- DELETE Endpoint ---

        // DELETE: api/products/{id}
        // Bir ürünü siler (Soft Delete). Sadece Admin erişebilir.
        [HttpDelete("{id}")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var result = await _productService.DeleteProductAsync(id);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Ürün başarıyla silindi." });
            }
            else
            {
                // Ürün bulunamadı veya silinemedi (ilişkili veri) veya başka bir hata.
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                // İlişkili veri hatası (FK kısıtlaması) genellikle BadRequest veya Conflict döner.
                return BadRequest(new { Message = result.Message });
            }
        }
    }
}