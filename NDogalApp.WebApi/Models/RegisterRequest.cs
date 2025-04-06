using System.ComponentModel.DataAnnotations; 

namespace NDogalApp.WebApi.Models
{
    // Kullanıcı kayıt isteği için model. Validasyon kuralları içerir.
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Email adresi zorunludur.")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
        [MaxLength(100, ErrorMessage = "Email adresi en fazla 100 karakter olabilir.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Şifre zorunludur.")]
        [MinLength(6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Ad zorunludur.")]
        [MaxLength(50, ErrorMessage = "Ad en fazla 50 karakter olabilir.")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Soyad zorunludur.")]
        [MaxLength(50, ErrorMessage = "Soyad en fazla 50 karakter olabilir.")]
        public string LastName { get; set; }

        [MaxLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir.")]
        public string? PhoneNumber { get; set; } // İsteğe bağlı

        [MaxLength(250, ErrorMessage = "Adres en fazla 250 karakter olabilir.")]
        public string? Address { get; set; }     // İsteğe bağlı
    }
}