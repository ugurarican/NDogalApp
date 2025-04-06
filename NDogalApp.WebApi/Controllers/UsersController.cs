using Microsoft.AspNetCore.Authorization;     
using Microsoft.AspNetCore.Http;              
using Microsoft.AspNetCore.Mvc;             
using Microsoft.Extensions.Logging;         
using NDogalApp.Business.Operations.User;    
using NDogalApp.Business.Operations.User.Dtos;
using NDogalApp.Data.Enums;                 
using NDogalApp.WebApi.Models;            
using NDogalApp.WebApi.Jwt;                
using System;                              
using System.Linq;                          
using System.Security.Claims;              
using System.Threading.Tasks;                

namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")] // Yol: /api/users
    [ApiController]
    [Authorize(Roles = nameof(UserType.Admin))] // Bu controller'daki TÜM endpoint'ler için Admin rolü GEREKLİ
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        // GET: api/users
        [HttpGet]
        [ProducesResponseType(typeof(List<UserInfoDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetAllUsers()
        {
            _logger.LogInformation("Admin tarafından GetAllUsers endpoint'i çağrıldı.");
            var result = await _userService.GetAllUsersAsync();

            if (result.IsSucceed && result.Data != null)
            {
                _logger.LogInformation("GetAllUsers başarıyla {UserCount} kullanıcı döndürdü.", result.Data.Count);
                return Ok(result.Data);
            }
            else
            {
                _logger.LogWarning("GetAllUsers başarısız oldu: {Message}", result.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Kullanıcılar getirilirken bir sunucu hatası oluştu." });
            }
        }
        // GET: api/users/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(UserInfoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetUserByIdForAdmin(int id)
        {
            _logger.LogInformation("Admin GetUserByIdForAdmin çağrıldı: ID = {UserId}", id);
            if (id <= 0) return BadRequest(new { Message = "Geçersiz kullanıcı ID." });

            var result = await _userService.GetUserByIdAsync(id);

            if (result.IsSucceed && result.Data != null)
            {
                return Ok(result.Data); // UserInfoDto döndürür
            }
            else if (!result.IsSucceed && (result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase) || result.Data == null))
            {
                _logger.LogWarning("GetUserByIdForAdmin - Kullanıcı bulunamadı: ID = {UserId}", id);
                return NotFound(new { Message = result.Message ?? "Kullanıcı bulunamadı." });
            }
            else // Diğer hatalar (veritabanı vb.)
            {
                _logger.LogError("GetUserByIdForAdmin sırasında hata: {Message}", result.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Kullanıcı bilgileri getirilirken bir hata oluştu." });
            }
        }
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateUserByAdmin(int id, [FromBody] UpdateUserRequest request)
        {
            if (id <= 0) return BadRequest(new { Message = "Geçersiz kullanıcı ID." });
            if (!ModelState.IsValid) return BadRequest(ModelState); // Gelen modeli doğrula
            _logger.LogInformation("Admin UpdateUserByAdmin çağrıldı: ID = {UserId}", id);

            // Kendini güncelleyen adminin rolünü Customer yapmasını engelleme
            var currentUserId = GetCurrentUserId(); // Yardımcı metottan ID al
            if (currentUserId.HasValue && id == currentUserId.Value && request.UserType == UserType.Customer)
            {
                _logger.LogWarning("Admin kendi rolünü Customer yapmaya çalıştı: AdminID = {AdminId}", currentUserId.Value);
                // Model state'e hata ekleyip BadRequest dönüyoruz.
                ModelState.AddModelError(nameof(request.UserType), "Yönetici kendi rolünü Müşteri olarak değiştiremez.");
                return BadRequest(ModelState);
            }

            // Request Modelini Business DTO'suna map et
            var updateDto = new UpdateUserDto
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                UserType = request.UserType
            };

            // Servis metodunu çağır
            var result = await _userService.UpdateUserAsync(id, updateDto);

            if (result.IsSucceed)
            {
                _logger.LogInformation("UpdateUserByAdmin başarılı: ID = {UserId}", id);
                return Ok(new { Message = result.Message ?? "Kullanıcı başarıyla güncellendi." });
            }
            // Mesajda "bulunamadı" varsa NotFound dön
            else if (!result.IsSucceed && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("UpdateUserByAdmin - Güncellenecek kullanıcı bulunamadı: ID = {UserId}", id);
                return NotFound(new { Message = result.Message });
            }
            // Eş zamanlılık hatası veya diğer DB hataları
            else if (!result.IsSucceed && result.Message.Contains("eş zamanlılık", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("UpdateUserByAdmin - Eş zamanlılık hatası: ID = {UserId}", id);
                return Conflict(new { Message = result.Message });
            }
            else // Diğer servis katmanı veya veritabanı hataları
            {
                _logger.LogError("UpdateUserByAdmin sırasında hata: ID={UserId}, Message={Message}", id, result.Message);
                // Servisten gelen mesaj genellikle bilgi verir, BadRequest dönüyoruz.
                return BadRequest(new { Message = result.Message ?? "Kullanıcı güncellenirken bir hata oluştu." });
            }
        }
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteUserByAdmin(int id)
        {
            _logger.LogInformation("Admin DeleteUserByAdmin çağrıldı: ID = {UserId}", id);
            if (id <= 0) return BadRequest(new { Message = "Geçersiz kullanıcı ID." });

            // Adminin kendini silememesi kontrolü
            var currentUserId = GetCurrentUserId();
            if (currentUserId.HasValue && id == currentUserId.Value)
            {
                _logger.LogWarning("Admin kendini silmeye çalıştı: AdminID = {AdminId}", currentUserId.Value);
                return BadRequest(new { Message = "Yönetici kendi hesabını silemez." });
            }

            // Servis metodunu çağır
            var result = await _userService.DeleteUserAsync(id);

            if (result.IsSucceed)
            {
                _logger.LogInformation("DeleteUserByAdmin başarılı: ID = {UserId}", id);
                return Ok(new { Message = result.Message ?? "Kullanıcı başarıyla silindi." });
            }
            else if (!result.IsSucceed && result.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("DeleteUserByAdmin - Silinecek kullanıcı bulunamadı: ID = {UserId}", id);
                return NotFound(new { Message = result.Message ?? "Silinecek kullanıcı bulunamadı." });
            }
            else // Diğer hatalar
            {
                _logger.LogError("DeleteUserByAdmin sırasında hata: ID={UserId}, Message={Message}", id, result.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = result.Message ?? "Kullanıcı silinirken bir hata oluştu." });
            }
        }
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(JwtClaimNames.Id); 
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            _logger.LogWarning("GetCurrentUserId: Token'dan kullanıcı ID'si alınamadı.");
            return null; // ID alınamazsa null dön
        }
    }
}