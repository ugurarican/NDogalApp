using Microsoft.AspNetCore.Mvc;
using NDogalApp.Business.Operations.User;
using NDogalApp.Business.Operations.User.Dtos;
using NDogalApp.WebApi.Models;
using NDogalApp.WebApi.Jwt;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Business.Operations.User.Dtos; 

namespace NDogalApp.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration; // JWT ayarlarını okumak için

        public AuthController(IUserService userService, IConfiguration configuration)
        {
            _userService = userService;
            _configuration = configuration;
        }

        // POST api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var addUserDto = new AddUserDto
            {
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Password = request.Password,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address
            };

            var result = await _userService.RegisterUserAsync(addUserDto);

            if (result.IsSucceed)
            {
                return Ok(new { Message = result.Message ?? "Kayıt başarılı." });
            }
            else
            {
                // İş mantığı hatası (örn: email zaten var)
                return BadRequest(new { Message = result.Message });
            }
        }

        // POST api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var loginDto = new LoginUserDto
            {
                Email = request.Email,
                Password = request.Password
            };

            var result = await _userService.LoginUserAsync(loginDto);

            if (result.IsSucceed && result.Data != null)
            {
                var user = result.Data;
                var jwtDto = new JwtDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    UserType = user.UserType,
                    SecretKey = _configuration["Jwt:SecretKey"]!,
                    Issuer = _configuration["Jwt:Issuer"]!,
                    Audience = _configuration["Jwt:Audience"]!,
                    ExpireMinutes = int.Parse(_configuration["Jwt:ExpireMinutes"]!)
                };

                var token = JwtHelper.GenerateJwtToken(jwtDto);
                var expirationDate = DateTime.UtcNow.AddMinutes(jwtDto.ExpireMinutes); 

                return Ok(new LoginResponse
                {
                    Message = result.Message ?? "Giriş başarılı.",
                    Token = token,
                    User = user,
                    Expiration = expirationDate 
                });
            }
            else
            {
                // Giriş başarısız (kullanıcı adı/şifre hatalı veya başka bir sorun)
                // Güvenlik açısından 401 Unauthorized dönüyoruz.
                return Unauthorized(new { Message = result.Message ?? "Kullanıcı adı veya şifre hatalı." });
            }
        }

        // GET api/auth/me
        [HttpGet("me")]
        [Authorize] // Bu endpoint için geçerli bir JWT token GEREKLİ
        public IActionResult GetMyInfo()
        {
            // Token doğrulandıktan sonra User.Claims üzerinden kullanıcı bilgilerine erişilebilir.
            var userIdClaim = User.FindFirst(JwtClaimNames.Id);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                // Token geçerli ama Id claim'i yok veya geçersiz, bu bir sorun.
                return Unauthorized(new { Message = "Geçersiz kullanıcı kimliği." });
            }

            var emailClaim = User.FindFirst(JwtClaimNames.Email)?.Value;
            var firstNameClaim = User.FindFirst(JwtClaimNames.FirstName)?.Value;
            return Ok(new
            {
                UserId = userId,
                Email = emailClaim,
                FirstName = firstNameClaim,
                Claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList() // Tüm claim'leri gör
            });
        }
    }
}