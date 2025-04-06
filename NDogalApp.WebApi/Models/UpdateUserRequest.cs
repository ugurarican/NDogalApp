using NDogalApp.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Ad zorunludur.")]
        [MaxLength(50, ErrorMessage = "Ad en fazla 50 karakter olabilir.")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Soyad zorunludur.")]
        [MaxLength(50, ErrorMessage = "Soyad en fazla 50 karakter olabilir.")]
        public string LastName { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Kullanıcı tipi zorunludur.")]
        [EnumDataType(typeof(UserType), ErrorMessage = "Geçersiz kullanıcı tipi.")]
        public UserType UserType { get; set; }
    }
}