using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NDogalApp.Business.Operations.Category;
using NDogalApp.Business.Operations.Category.Dtos; 
using NDogalApp.Data.Enums; 
using NDogalApp.WebApi.Models; 
namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")] // api/categories
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // GET: api/categories
        // Tüm kategorileri listeler. Herkes erişebilir (veya sadece giriş yapmış kullanıcılar).
        [HttpGet]
        [AllowAnonymous] 
        public async Task<IActionResult> GetAllCategories()
        {
            var result = await _categoryService.GetAllCategoriesAsync();

            if (result.IsSucceed)
            {
                // CategoryDto listesini döndür
                return Ok(result.Data);
            }
            else
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Kategoriler getirilirken bir hata oluştu." });
            }
        }

        // GET: api/categories/{id}
        // Belirli bir kategoriyi ID ile getirir. Herkes erişebilir.
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var result = await _categoryService.GetCategoryByIdAsync(id);

            if (result.IsSucceed)
            {
                if (result.Data != null)
                {
                    return Ok(result.Data); 
                }
                else
                {
                    return NotFound(new { Message = result.Message ?? $"ID'si {id} olan kategori bulunamadı." });
                }
            }
            else
            {
                // Kategori bulunamadı veya başka bir hata
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                // Genel hata durumu
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Kategori getirilirken bir hata oluştu." });
            }
        }

        // POST: api/categories
        // Yeni bir kategori ekler. Sadece Admin rolündeki kullanıcılar erişebilir.
        [HttpPost]
        [Authorize(Roles = nameof(UserType.Admin))] // Sadece Admin rolü
        public async Task<IActionResult> AddCategory([FromBody] AddCategoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var addCategoryDto = new AddCategoryDto
            {
                Name = request.Name,
                Description = request.Description
            };

            var result = await _categoryService.AddCategoryAsync(addCategoryDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Kategori başarıyla eklendi." });
            }
            else
            {
                // Kategori adı zaten var veya başka bir iş mantığı hatası.
                return BadRequest(new { Message = result.Message });
            }
        }

        // PUT: api/categories/{id}
        // Mevcut bir kategoriyi günceller. Sadece Admin rolündeki kullanıcılar erişebilir.
        [HttpPut("{id}")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // URL'den gelen id ile request body'sindeki id (eğer varsa) tutarlı mı kontrolü eklenebilir.

            var updateCategoryDto = new UpdateCategoryDto
            {
                Id = id, // URL'den gelen ID'yi kullan
                Name = request.Name,
                Description = request.Description
            };

            var result = await _categoryService.UpdateCategoryAsync(updateCategoryDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Kategori başarıyla güncellendi." });
            }
            else
            {
                // Kategori bulunamadı, isim zaten kullanılıyor veya başka bir hata.
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                return BadRequest(new { Message = result.Message });
            }
        }

        // DELETE: api/categories/{id}
        // Bir kategoriyi siler (Soft Delete). Sadece Admin rolündeki kullanıcılar erişebilir.
        [HttpDelete("{id}")]
        [Authorize(Roles = nameof(UserType.Admin))]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Kategori başarıyla silindi." });
            }
            else
            {
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                // Silinememe durumu  BadRequest fırlatıyor.
                return BadRequest(new { Message = result.Message });
            }
        }
    }
}