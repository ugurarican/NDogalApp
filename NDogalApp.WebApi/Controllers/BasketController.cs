using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NDogalApp.Business.Operations.Basket;
using NDogalApp.Business.Operations.Basket.Dtos;
using NDogalApp.WebApi.Jwt;
using NDogalApp.WebApi.Models;
using System.Security.Claims;

namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")] // api/basket
    [ApiController]
    [Authorize] // Bu controller'daki tüm endpoint'ler için giriş yapmış olmak GEREKLİDİR.
    public class BasketController : ControllerBase
    {
        private readonly IBasketService _basketService;

        public BasketController(IBasketService basketService)
        {
            _basketService = basketService;
        }

        // Helper metot: Token'dan kullanıcı ID'sini alır.
        private int GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(JwtClaimNames.Id);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Geçerli kullanıcı kimliği bulunamadı.");
            }
            return userId;
        }

        // GET: api/basket
        // Giriş yapmış kullanıcının sepetini getirir.
        [HttpGet]
        public async Task<IActionResult> GetMyBasket()
        {
            int userId;
            try
            {
                userId = GetUserIdFromToken();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }

            var result = await _basketService.GetBasketByUserIdAsync(userId);

            if (result.IsSucceed && result.Data != null)
            {
                return Ok(result.Data);
            }
            else
            {
                // GetBasketByUserIdAsync her zaman başarılı ve boş/dolu DTO dönmeli.
                // Hata durumu beklenmedik bir durumdur.
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sepet getirilirken bir hata oluştu." });
            }
        }

        // POST: api/basket/items
        // Kullanıcının sepetine yeni bir ürün ekler veya mevcut ürünün miktarını artırır.
        [HttpPost("items")]
        public async Task<IActionResult> AddItemToMyBasket([FromBody] AddItemToBasketRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int userId;
            try
            {
                userId = GetUserIdFromToken();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }

            var addItemDto = new AddItemToBasketDto
            {
                UserId = userId, // Token'dan alınan kullanıcı ID'si
                ProductId = request.ProductId,
                Quantity = request.Quantity
            };

            var result = await _basketService.AddItemToBasketAsync(addItemDto);

            if (result.IsSucceed)
            {
                // Başarılı ekleme sonrası güncel sepeti döndürmek iyi olabilir.
                // Veya sadece başarı mesajı.
                return Ok(new { Message = result.Message ?? "Ürün sepete eklendi." });
            }
            else
            {
                // Stok yetersiz, ürün bulunamadı vb.
                if (result.Message != null && (result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("stok", StringComparison.OrdinalIgnoreCase)))
                {
                    return BadRequest(new { Message = result.Message }); // Geçersiz istek veya durum
                }
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sepete ürün eklenirken bir hata oluştu." });
            }
        }

        // PUT: api/basket/items/{basketItemId}
        // Sepetteki belirli bir ürünün miktarını günceller.
        [HttpPut("items/{basketItemId}")]
        public async Task<IActionResult> UpdateMyBasketItemQuantity(int basketItemId, [FromBody] UpdateBasketItemRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int userId;
            try
            {
                userId = GetUserIdFromToken();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }

            var updateDto = new UpdateBasketItemDto
            {
                UserId = userId, // Yetki kontrolü için
                BasketItemId = basketItemId, // URL'den alınan ID
                NewQuantity = request.NewQuantity
            };

            var result = await _basketService.UpdateBasketItemQuantityAsync(updateDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Sepet miktarı güncellendi." });
            }
            else
            {
                // Sepet öğesi bulunamadı, stok yetersiz vb.
                if (result.Message != null && (result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("stok", StringComparison.OrdinalIgnoreCase) || result.Message.Contains("yetkiniz yok", StringComparison.OrdinalIgnoreCase)))
                {
                    return NotFound(new { Message = result.Message });
                }
                if (result.Message != null && result.Message.Contains("miktar", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { Message = result.Message }); // Miktar 0'dan büyük olmalı hatası
                }
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sepet güncellenirken bir hata oluştu." });
            }
        }

        // DELETE: api/basket/items/{basketItemId}
        // Sepetteki belirli bir ürünü kaldırır.
        [HttpDelete("items/{basketItemId}")]
        public async Task<IActionResult> RemoveItemFromMyBasket(int basketItemId)
        {
            int userId;
            try
            {
                userId = GetUserIdFromToken();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }

            var removeDto = new RemoveBasketItemDto
            {
                UserId = userId, // Yetki kontrolü için
                BasketItemId = basketItemId
            };

            var result = await _basketService.RemoveItemFromBasketAsync(removeDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Ürün sepetten kaldırıldı." });
            }
            else
            {
                // Sepet öğesi bulunamadı (veya yetki yok) veya başka bir hata.
                if (result.Message != null && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(new { Message = result.Message });
                }
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sepetten ürün kaldırılırken bir hata oluştu." });
            }
        }

        // DELETE: api/basket
        // Kullanıcının sepetini tamamen boşaltır.
        [HttpDelete]
        public async Task<IActionResult> ClearMyBasket()
        {
            int userId;
            try
            {
                userId = GetUserIdFromToken();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }

            var result = await _basketService.ClearBasketAsync(userId);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Sepet başarıyla temizlendi." });
            }
            else
            {
                // Beklenmedik hata durumu
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Sepet temizlenirken bir hata oluştu." });
            }
        }
    }
}