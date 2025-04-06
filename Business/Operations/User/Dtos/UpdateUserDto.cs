using NDogalApp.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace NDogalApp.Business.Operations.User.Dtos
{
    public class UpdateUserDto
    {
        [Required(ErrorMessage = "Ad zorunludur.")]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Soyad zorunludur.")]
        [MaxLength(50)]
        public string LastName { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Kullanıcı tipi zorunludur.")]
        [EnumDataType(typeof(UserType))]
        public UserType UserType { get; set; } // Admin'in rol değiştirebilmesi için
    }
}