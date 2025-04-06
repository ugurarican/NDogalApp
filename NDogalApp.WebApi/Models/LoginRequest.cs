using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Kullanıcı giriş isteği için model.
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email adresi zorunludur.")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; }
    }
}